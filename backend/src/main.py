from __future__ import annotations

import os
import pymongo
import uvicorn
import secrets
from fastapi import APIRouter, Depends, FastAPI, Header, Request
from fastapi.responses import HTMLResponse, JSONResponse
from bson import ObjectId
from typing import Annotated


AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "")


class AuthError(Exception):
    pass


client = pymongo.MongoClient("mongodb://webmenu_db:27017")
db = client.webmenu_db
items = db.items


api = APIRouter()


@api.get("/status")
async def get_status():
    return {"status": "success"}


@api.post("/item")
async def post_item(request: dict):
    result: ObjectId = items.insert_one(request).inserted_id
    return {"status": "success", "id": result.binary.hex()}


@api.put("/item/{id}")
async def put_item(id: str, request: dict):
    items.find_one_and_update({"_id": ObjectId(id)}, {"$set": request})


@api.delete("/item/{id}")
async def delete_item(id: str):
    items.find_one_and_delete({"_id": ObjectId(id)})


@api.get("/item")
async def get_items():
    results = []
    for item in items.find():
        item["id"] = item.pop("_id").binary.hex()
        results.append(item)
    return results


@api.get("/item/{id}")
async def get_item(id: str):
    result: dict | None = items.find_one({"_id": ObjectId(id)})
    if result is None:
        return HTMLResponse("invalid item id", status_code=400)
    else:
        result.pop("_id", None)
    return result


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
