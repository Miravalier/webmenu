from __future__ import annotations

import os
import pymongo
import uvicorn
import secrets
import requests
from fastapi import APIRouter, Depends, FastAPI, Header, Request
from fastapi.responses import HTMLResponse, JSONResponse
from bson import ObjectId
from pydantic import BaseModel
from typing import Annotated


DISCORD_URL = "https://discord.com/api"
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
RECIPIENT_ID = os.environ.get("RECIPIENT_ID", "")
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "")
AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "")


def discord_request(method: str, endpoint: str, data: dict = None):
    kwargs = {}
    if data is not None:
        kwargs["json"] = data
    return requests.request(
        method,
        DISCORD_URL + endpoint,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bot {BOT_TOKEN}"
        },
        **kwargs
    )


class AuthError(Exception):
    pass


class Item(BaseModel):
    id: str | None = None
    name: str = ""
    allowed: bool = False
    selected: bool = False
    category: str = ""


client = pymongo.MongoClient("mongodb://webmenu_db:27017")
db = client.webmenu_db
items = db.items


api = APIRouter()


@api.get("/status")
async def get_status():
    return {"status": "success"}


@api.post("/item")
async def post_item(item: Item):
    result: ObjectId = items.insert_one(item.model_dump(exclude="id")).inserted_id
    return {"status": "success", "id": result.binary.hex()}


@api.put("/item/{id}")
async def put_item(id: str, item: Item):
    items.find_one_and_update({"_id": ObjectId(id)}, {"$set": item.model_dump(exclude="id")})


@api.delete("/item/{id}")
async def delete_item(id: str):
    items.find_one_and_delete({"_id": ObjectId(id)})


@api.get("/item")
async def get_items():
    results: list[Item] = []
    for item in items.find():
        item["id"] = item.pop("_id").binary.hex()
        results.append(Item.model_validate(item))
    results.sort(key=lambda item: item.name)
    return results


@api.get("/item/{id}")
async def get_item(id: str):
    result: dict | None = items.find_one({"_id": ObjectId(id)})
    if result is None:
        return HTMLResponse("invalid item id", status_code=400)
    else:
        result.pop("_id", None)
    return result


@api.post("/message")
async def post_message(meal: str = None):
    recipes = []
    for item in items.find():
        item["id"] = item.pop("_id").binary.hex()
        if item.get("selected", False):
            recipes.append(item["name"])
    recipes.sort()
    if not recipes:
        return {"status": "success"}

    content = ""
    if meal:
        content += f"[**{meal}**]"
    for recipe in recipes:
        content += f"\n- {recipe}"
    message = {"content": content}

    if WEBHOOK_URL:
        requests.post(WEBHOOK_URL, headers={"Content-Type": "application/json"}, json=message)

    if BOT_TOKEN and RECIPIENT_ID:
        response = discord_request("POST", "/users/@me/channels", {"recipient_id": RECIPIENT_ID}).json()
        print(response)
        channel_id = response.get("id", None)
        if channel_id is not None:
            discord_request("POST", f"/channels/{channel_id}/messages", message)

    return {"status": "success"}


def token_auth(authorization: Annotated[str | None, Header()] = None):
    if not authorization.startswith("Bearer "):
        raise AuthError("invalid authorization header")
    token = authorization[7:]
    if not secrets.compare_digest(token, AUTH_TOKEN):
        raise AuthError("incorrect authorization token")


app = FastAPI()
app.include_router(api, prefix="/api", dependencies=[Depends(token_auth)])


@app.exception_handler(AuthError)
async def auth_error_handler(request: Request, exc: AuthError):
    return JSONResponse(status_code=401, content={
        "status": "error",
        "reason": str(exc),
    })


if __name__ == '__main__':
    uvicorn.run(app, port=80, host="0.0.0.0")
