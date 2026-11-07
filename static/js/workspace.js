document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ELEMENT REFERENCES
    // =====================================

    const fileInput = document.getElementById("fileInput");
    const uploadTrigger = document.getElementById("uploadTrigger");
    const browseFiles = document.getElementById("browseFiles");
    const emptyUploadTrigger = document.getElementById("emptyUploadTrigger");

    const uploadArea = document.getElementById("uploadArea");
    const uploadStatus = document.getElementById("uploadStatus");
    const filesLoading = document.getElementById("filesLoading");
    const filesList = document.getElementById("filesList");
    const fileCount = document.getElementById("fileCount");

    const memorySearch = document.getElementById("memorySearch");
    const searchButton = document.getElementById("searchButton");

    const viewAllFiles = document.getElementById("viewAllFiles");
    const filesHeading = document.getElementById("filesHeading");


    const searchResults = document.getElementById("searchResults");
    const searchResultsList = document.getElementById("searchResultsList");
    const searchResultCount = document.getElementById("searchResultCount");

    // =====================================
    // APPLICATION STATE
    // =====================================

    let uploadedFiles = [];
    let activeFilter = "all";

    // =====================================
    // FILE PICKER
    // =====================================

    function openFilePicker() {
        fileInput.click();
    }

    [uploadTrigger, browseFiles, emptyUploadTrigger].forEach(button => {
        if (button) {
            button.addEventListener("click", openFilePicker);
        }
    });

    // =====================================
    // FILE UPLOAD
    // =====================================

    async function uploadFiles(files) {

        if (!files.length) return;

        const formData = new FormData();

        Array.from(files).forEach(file => {
            formData.append("files", file);
        });

        uploadStatus.textContent = "Uploading your memories...";

        try {

            const response = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok && response.status !== 207) {
                throw new Error(
                    result.error || "Upload failed."
                );
            }

            const errors = result.errors || [];

            uploadStatus.textContent = [
                result.message,
                ...errors
            ].filter(Boolean).join(" ");

            await loadFiles();

        } catch (error) {

            uploadStatus.textContent = error.message;

        } finally {

            fileInput.value = "";

        }
    }

    fileInput.addEventListener("change", event => {
        uploadFiles(event.target.files);
    });

    // =====================================
    // DRAG AND DROP
    // =====================================

    ["dragenter", "dragover"].forEach(eventName => {

        uploadArea.addEventListener(eventName, event => {

            event.preventDefault();

            uploadArea.classList.add("drag-over");

        });

    });

    ["dragleave", "drop"].forEach(eventName => {

        uploadArea.addEventListener(eventName, event => {

            event.preventDefault();

            uploadArea.classList.remove("drag-over");

        });

    });

    uploadArea.addEventListener("drop", event => {

        uploadFiles(event.dataTransfer.files);

    });

    // =====================================
    // FILE HELPERS
    // =====================================

    function getFileType(filename) {

        const extension = filename
            .split(".")
            .pop()
            .toLowerCase();

        if (["png", "jpg", "jpeg"].includes(extension)) {
            return "image";
        }

        if (["pdf", "docx", "txt"].includes(extension)) {
            return "document";
        }

        return "other";
    }


    function formatSize(bytes) {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    }


    // Normalize filenames before searching.
    // Example: Python_Notes.pdf becomes python notes pdf.

    function normalizeText(text) {

        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    }


    // =====================================
    // FILTER AND SEARCH
    // =====================================

    function getFilteredFiles() {

    let files = [...uploadedFiles];

    if (activeFilter === "image") {

        files = files.filter(file =>
            getFileType(file.name) === "image"
        );

    } else if (activeFilter === "document") {

        files = files.filter(file =>
            getFileType(file.name) === "document"
        );

    } else if (activeFilter === "recent") {

        files.reverse();
        files = files.slice(0, 5);

    }

    return files;
}


function renderSearchResults() {

    const query = normalizeText(memorySearch.value);

    // Hide results when the search box is empty.
    if (!query) {

        searchResults.hidden = true;
        return;

    }

    const matchingFiles = uploadedFiles.filter(file => {

        const filename = normalizeText(file.name);

        return filename.includes(query);

    });

    searchResults.hidden = false;

    searchResultCount.textContent =
        `${matchingFiles.length} found`;

    searchResultsList.innerHTML = "";


    if (!matchingFiles.length) {

        searchResultsList.innerHTML = `
            <div class="search-no-results">
                No matching files found. Try another filename.
            </div>
        `;

        return;

    }


    matchingFiles.forEach(file => {

        const type = getFileType(file.name);

        const item = document.createElement("div");
        item.className = "search-result-item";

        const thumbnail = document.createElement("div");
        thumbnail.className = "search-result-thumbnail";

        // Show actual image thumbnail for image files.
        if (type === "image") {

            const img = document.createElement("img");

            img.src =
                `/preview/${encodeURIComponent(file.stored_name)}`;

            img.alt = file.name;

            thumbnail.appendChild(img);

        } else {

            thumbnail.textContent = "▤";

        }


        const info = document.createElement("div");
        info.className = "search-result-info";

        const name = document.createElement("strong");
        name.textContent = file.name;

        const details = document.createElement("small");

        details.textContent =
            `${type.toUpperCase()} · ${formatSize(file.size || 0)}`;

        info.append(name, details);


        const previewButton = document.createElement("button");

        previewButton.className = "search-result-preview";
        previewButton.textContent = "Preview";

        previewButton.addEventListener("click", () => {

            window.open(
                `/preview/${encodeURIComponent(file.stored_name)}`,
                "_blank",
                "noopener"
            );

        });


        item.append(thumbnail, info, previewButton);

        searchResultsList.appendChild(item);

    });

}


function renderFiles() {

    const filteredFiles = getFilteredFiles();

    fileCount.textContent =
        `${uploadedFiles.length} ${
            uploadedFiles.length === 1 ? "file" : "files"
        }`;

    filesList.innerHTML = "";


    if (!filteredFiles.length) {

        filesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⌕</div>
                <h3>No files in this section</h3>
                <p>Upload a file or select another category.</p>
            </div>
        `;

        renderSearchResults();
        return;

    }


    filteredFiles.forEach(file => {

        const type = getFileType(file.name);
        const icon = type === "image" ? "▧" : "▤";

        const row = document.createElement("div");
        row.className = "file-row";

        const iconBox = document.createElement("div");
        iconBox.className = "file-type-icon";
        iconBox.textContent = icon;

        const info = document.createElement("div");
        info.className = "file-row-info";

        const name = document.createElement("strong");
        name.textContent = file.name;

        const details = document.createElement("small");
        details.textContent =
            `${type.toUpperCase()} · ${formatSize(file.size || 0)}`;

        info.append(name, details);

        const actions = document.createElement("div");
        actions.className = "file-actions";

        const previewButton = document.createElement("button");
        previewButton.className = "file-action-button";
        previewButton.textContent = "Preview";

        previewButton.addEventListener("click", () => {

            window.open(
                `/preview/${encodeURIComponent(file.stored_name)}`,
                "_blank",
                "noopener"
            );

        });

        const deleteButton = document.createElement("button");
        deleteButton.className =
            "file-action-button delete-action";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteFile(file);
        });

        actions.append(previewButton, deleteButton);

        row.append(iconBox, info, actions);

        filesList.appendChild(row);

    });

    renderSearchResults();

}
            


    // =====================================
    // LOAD FILES FROM FLASK
    // =====================================

   async function loadFiles() {

    // Show loading indicator
    if (filesLoading) {
        filesLoading.style.display = "block";
    }

    // Temporarily hide the file list
    filesList.style.display = "none";

    try {

        const response = await fetch("/files");

        if (!response.ok) {
            throw new Error("Could not load your files.");
        }

        const result = await response.json();

        uploadedFiles = result.files || [];

        // Display updated files
        renderFiles();

    } catch (error) {

        console.error("File loading error:", error);

        uploadStatus.textContent = error.message;

    } finally {

        // Hide loading indicator
        if (filesLoading) {
            filesLoading.style.display = "none";
        }

        // Restore file list
        filesList.style.display = "";

    }

}
    // =====================================
    // DELETE FILE
    // =====================================

    async function deleteFile(file) {

        const confirmed = confirm(
            `Are you sure you want to delete "${file.name}"?`
        );

        if (!confirmed) return;

        try {

            const response = await fetch(
                `/delete/${encodeURIComponent(file.stored_name)}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {

                throw new Error(
                    result.error || "Could not delete file."
                );

            }

            uploadStatus.textContent = result.message;

            await loadFiles();

        } catch (error) {

            uploadStatus.textContent = error.message;

        }

    }


    // =====================================
    // SEARCH EVENTS
    // =====================================

    searchButton.addEventListener("click", () => {

        renderFiles();

    });


    memorySearch.addEventListener("input", () => {

        renderFiles();

    });


    memorySearch.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            renderFiles();

        }

    });


    // =====================================
    // SEARCH SUGGESTIONS
    // =====================================

    document.querySelectorAll(".suggestion").forEach(button => {

        button.addEventListener("click", () => {

            memorySearch.value = button.textContent.trim();

            activeFilter = "all";

            updateActiveNavigation();

            renderFiles();

        });

    });


    // =====================================
    // NAVIGATION AND CATEGORY FILTERS
    // =====================================

    function updateActiveNavigation() {

        document.querySelectorAll("[data-filter]").forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.filter === activeFilter
            );

        });

    }


    document.querySelectorAll("[data-filter]").forEach(button => {

        button.addEventListener("click", event => {

            event.preventDefault();

            activeFilter = button.dataset.filter;

            if (activeFilter === "all") {

                filesHeading.textContent = "All Memories";

            } else if (activeFilter === "image") {

                filesHeading.textContent = "Images";

            } else if (activeFilter === "document") {

                filesHeading.textContent = "Documents";

            } else if (activeFilter === "recent") {

                filesHeading.textContent = "Recently Added";

            }

            memorySearch.value = "";

            updateActiveNavigation();

            renderFiles();

        });

    });


    // =====================================
    // VIEW ALL FILES
    // =====================================

    viewAllFiles.addEventListener("click", () => {

        activeFilter = "all";

        memorySearch.value = "";

        filesHeading.textContent = "All Memories";

        updateActiveNavigation();

        renderFiles();

    });


    // =====================================
    // INITIALIZE
    // =====================================

    updateActiveNavigation();

    loadFiles();

});