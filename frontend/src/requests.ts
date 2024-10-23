export async function ApiRequest(method: string, endpoint: string, data: any = undefined): Promise<any> {
    const options: RequestInit = {
        method,
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
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
