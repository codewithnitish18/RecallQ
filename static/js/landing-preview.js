document.addEventListener("DOMContentLoaded", () => {
const searchText = document.getElementById("previewSearchText");
const matchingFile = document.querySelector(".preview-file-match");


if (!searchText || !matchingFile) return;

const query = "Find my project research screenshot...";
let index = 0;

function typeQuery() {
    if (index <= query.length) {
        searchText.textContent = query.slice(0, index);
        index++;

        setTimeout(typeQuery, 65);
    } else {
        // Show the matching file after typing finishes
        setTimeout(() => {
            matchingFile.classList.add("is-found");
        }, 700);
    }
}

setTimeout(typeQuery, 1500);


});
