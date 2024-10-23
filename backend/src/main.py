from __future__ import annotations

import pymongo
import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from bson import ObjectId


client = pymongo.MongoClient("mongodb://webmenu_db:27017")
db = client.webmenu_db
items = db.items


app = FastAPI()


@app.get("/api/status")
async def get_status():
    return {"status": "success"}


@app.post("/api/item")
async def post_item(request: dict):
    result: ObjectId = items.insert_one(request).inserted_id
    return {"status": "success", "id": result.binary.hex()}


@app.put("/api/item/{id}")
async def put_item(id: str, request: dict):
    items.find_one_and_update({"_id": ObjectId(id)}, request)


@app.get("/api/item")
async def get_items():
    results = []
    for item in items.find():
        item["id"] = item.pop("_id").binary.hex()
        results.append(item)
    return results


@app.get("/api/item/{id}")
async def get_item(id: str):
    result: dict | None = items.find_one({"_id": ObjectId(id)})
    if result is None:
        return HTMLResponse("invalid item id", status_code=400)
    else:
        result.pop("_id", None)
    return result


if __name__ == '__main__':
    uvicorn.run(app, port=80, host="0.0.0.0")
