import { ApiRequest } from "./requests.ts";

declare global {
    interface Window {
        ApiRequest: any;
    }
}

window.ApiRequest = ApiRequest;

window.addEventListener("load", async () => {
    const statusResponse = await ApiRequest("GET", "/status");
    if (statusResponse.status != "success") {
        console.error("Page failed to load.");
        return;
    }
    console.log("Page loaded.");
});
