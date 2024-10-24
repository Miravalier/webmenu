import { ApiRequest, ListItems, PutItem, DeleteItem, PostItem } from "./requests.ts";
import { Item } from "./models.ts";


declare global {
    interface Window {
        ApiRequest: any;
    }
}
window.ApiRequest = ApiRequest;


function SetContents(recipeElement: HTMLDivElement, item: Item) {
    let content = `<div class="name">${item.name}</div>`;
    if (item.selected) {
        content += `<div class="icon"><i class="fa-solid fa-circle-check"></i></div>`;
    }
    else if (item.allowed) {
        content += `<div class="icon"><i class="fa-solid fa-circle-half-stroke"></i></div>`;
    }
    else {
        content += `<div class="icon"><i class="fa-regular fa-circle"></i></div>`;
    }
    recipeElement.innerHTML = content;
}


async function UpdateItems() {
    const recipesContainer = document.querySelector(".recipes") as HTMLDivElement;

    for (const item of await ListItems()) {
        // Get existing Recipe Element or create new one
        let recipeElement = recipesContainer.querySelector(`[data-id="${item.id}"]`) as HTMLDivElement;
        if (!recipeElement) {
            recipeElement = document.createElement("div");
            recipeElement.classList.add("recipe");
            recipeElement.dataset.id = item.id;
            recipeElement.addEventListener("click", async () => {
                if (item.selected) {
                    item.selected = false;
                    item.allowed = false;
                }
                else if (item.allowed) {
                    item.selected = true;
                }
                else {
                    item.allowed = true;
                }
                // Update item on screen
                SetContents(recipeElement, item);
                // Update item in DB
                await PutItem(item);
            });
            recipeElement.addEventListener("contextmenu", async () => {
                if (!confirm(`Delete recipe ${item.name}?`)) {
                    return;
                }
                recipeElement.remove();
                await DeleteItem(item.id);
            });
        }
        // Set element contents
        SetContents(recipeElement, item);
        // Move element to end of list
        recipesContainer.appendChild(recipeElement);
    }
}


window.addEventListener("load", async () => {
    try {
        const statusResponse: { status: string } = await ApiRequest("GET", "/status");
        if (statusResponse.status != "success") {
            throw "Page failed to load.";
        }
    }
    catch {
        location.replace("/login");
    }

    document.addEventListener("contextmenu", ev => {
        ev.preventDefault();
    });

    const recipeName = document.getElementById("recipeName") as HTMLInputElement;
    const addRecipe = document.getElementById("addRecipe") as HTMLButtonElement;
    addRecipe.addEventListener("click", async () => {
        if (recipeName.value.length == 0) {
            return;
        }
        const item: Item = { name: recipeName.value, allowed: false, selected: false };
        await PostItem(item);
        await UpdateItems();
    });

    // Update items on page load
    await UpdateItems();

    // Start updating items every 15 seconds
    setInterval(() => {
        UpdateItems();
    }, 15000);

    console.log("Page loaded.");
});
