import { Item } from "./models.ts";


export async function ApiRequest(method: string, endpoint: string, data: any = undefined): Promise<any> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw "[AUTH ERROR] Missing token";
    }
    const options: RequestInit = {
        method,
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    };
    if (data) {
        options.body = JSON.stringify(data);
        console.log("[API REQUEST]", method, endpoint, data);
    }
    else {
        console.log("[API REQUEST]", method, endpoint);
    }

    const response = await fetch(`/api${endpoint}`, options);
    const responseText = await response.text();

    let responseJson: any = null;
    try {
        responseJson = JSON.parse(responseText);
    }
    catch {
        throw `[API ERROR] ${response.status} ${responseText}`;
    }

    // 422 Error, Unprocessable Entity
    if (response.status == 422) {
        for (let item of responseJson.detail) {
            console.error(`Error 422: ${item.msg}: ${item.loc.slice(1).join(", ")}`);
        }
        throw `[API ERROR] ${response.status} ${response.statusText}`;
    }
    else if (response.status != 200) {
        throw `[API ERROR] ${response.status} ${response.statusText}`;
    }

    console.log("[API REPLY]", responseJson);
    return responseJson;
}


export async function GetItem(id: string): Promise<Item> {
    return await ApiRequest("GET", `/item/${id}`);
}


export async function PostItem(item: Item) {
    await ApiRequest("POST", "/item", item);
}


export async function PutItem(item: Item) {
    if (!item.id) {
        throw `error: item is missing id`;
    }
    const serializedItem = structuredClone(item);
    delete serializedItem["id"];
    await ApiRequest("PUT", `/item/${item.id}`, serializedItem);
}


export async function DeleteItem(id: string) {
    await ApiRequest("DELETE", `/item/${id}`);
}


export async function ListItems(): Promise<Item[]> {
    return await ApiRequest("GET", "/item");
}
