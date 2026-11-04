document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const uploadTrigger = document.getElementById("uploadTrigger");
    const browseFiles = document.getElementById("browseFiles");
    const emptyUploadTrigger = document.getElementById("emptyUploadTrigger");
    const uploadArea = document.getElementById("uploadArea");
    const uploadStatus = document.getElementById("uploadStatus");
    const filesList = document.getElementById("filesList");
    const fileCount = document.getElementById("fileCount");
    const memorySearch = document.getElementById("memorySearch");
    const searchButton = document.getElementById("searchButton");

    let uploadedFiles = [];
    let activeFilter = "all";

    function openFilePicker() {
        fileInput.click();
    }

    [uploadTrigger, browseFiles, emptyUploadTrigger].forEach(button => {
        if (button) button.addEventListener("click", openFilePicker);
    });

    async function uploadFiles(files) {
        if (!files.length) return;

        const formData = new FormData();

        Array.from(files).forEach(file => {
            formData.append("files", file);
        });

        uploadStatus.textContent = "Uploading your files...";

        try {
            const response = await fetch("/upload", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (!response.ok && response.status !== 207) {
                throw new Error(result.error || "Upload failed.");
            }

            const errors = result.errors || [];

            uploadStatus.textContent = [
                result.message,
                ...errors
            ].filter(Boolean).join(" ");

            await loadFiles();

        } catch (error) {
            uploadStatus.textContent = error.message;
        }

        fileInput.value = "";
    }

    fileInput.addEventListener("change", event => {
        uploadFiles(event.target.files);
    });

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

    function getFileType(filename) {
        const extension = filename.split(".").pop().toLowerCase();

        if (["png", "jpg", "jpeg"].includes(extension)) return "image";
        if (["pdf", "docx", "txt"].includes(extension)) return "document";

        return "other";
    }

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function renderFiles() {
        const query = memorySearch.value.trim().toLowerCase();

        const filteredFiles = uploadedFiles.filter(file => {
            const matchesFilter =
                activeFilter === "all" ||
                activeFilter === "recent" ||
                getFileType(file.name) === activeFilter;

            const matchesSearch = file.name.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });

        fileCount.textContent =
            `${uploadedFiles.length} ${uploadedFiles.length === 1 ? "file" : "files"}`;

        filesList.innerHTML = "";

        if (!filteredFiles.length) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⌕</div>
                    <h3>No matching files found</h3>
                    <p>Try another search or upload a new file.</p>
                </div>`;
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
            details.textContent = `${type.toUpperCase()} · ${formatSize(file.size)}`;

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
            deleteButton.className = "file-action-button delete-action";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                deleteFile(file);
            });

            actions.append(previewButton, deleteButton);
            row.append(iconBox, info, actions);
            filesList.appendChild(row);
        });
    }

    async function loadFiles() {
        try {
            const response = await fetch("/files");

            if (!response.ok) {
                throw new Error("Could not load files.");
            }

            const result = await response.json();
            uploadedFiles = result.files || [];

            renderFiles();

        } catch (error) {
            console.error(error);
            uploadStatus.textContent = error.message;
        }
    }

    async function deleteFile(file) {
        const confirmed = confirm(
            `Are you sure you want to delete "${file.name}"?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `/delete/${encodeURIComponent(file.stored_name)}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Could not delete file.");
            }

            uploadStatus.textContent = result.message;
            await loadFiles();

        } catch (error) {
            uploadStatus.textContent = error.message;
        }
    }

    searchButton.addEventListener("click", renderFiles);

    memorySearch.addEventListener("input", renderFiles);

    memorySearch.addEventListener("keydown", event => {
        if (event.key === "Enter") renderFiles();
    });

    document.querySelectorAll(".suggestion").forEach(button => {
        button.addEventListener("click", () => {
            memorySearch.value = button.textContent;
            renderFiles();
        });
    });

    document.querySelectorAll("[data-filter]").forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;

            document.querySelectorAll("[data-filter]").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");
            renderFiles();
        });
    });

    document.getElementById("viewAllFiles").addEventListener("click", () => {
        activeFilter = "all";
        memorySearch.value = "";

        document.querySelectorAll("[data-filter]").forEach(item => {
            item.classList.remove("active");
        });

        renderFiles();
    });

    loadFiles();
});