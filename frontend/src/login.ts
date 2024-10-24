import { ApiRequest } from "./requests.ts";


window.addEventListener("load", async () => {
    try {
        const statusResponse: { status: string } = await ApiRequest("GET", "/status");
        if (statusResponse.status == "success") {
            location.replace("/");
        }
    }
    catch { }

    const tokenInput = document.getElementById("token") as HTMLInputElement;
    const loginButton = document.getElementById("login") as HTMLButtonElement;
    loginButton.addEventListener("click", async () => {
        if (!tokenInput.value) {
            return;
        }
        localStorage.setItem("token", tokenInput.value);
        const statusResponse: { status: string } = await ApiRequest("GET", "/status");
        if (statusResponse.status == "success") {
            location.replace("/");
        }
    });

    console.log("Page loaded.");
});
