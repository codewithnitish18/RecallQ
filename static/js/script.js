const uploadedFilesList = document.getElementById("uploadedFilesList");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const uploadButton = document.getElementById("uploadButton");

searchForm.addEventListener("submit", function (event) {
event.preventDefault();


const query = searchInput.value.trim();

if (query === "") {
    alert("Please describe the file you want to find.");
    return;
}

alert("Your search query is: " + query);


});

const fileInput = document.getElementById("fileInput");
const selectedFiles = document.getElementById("selectedFiles");

let pendingFiles = [];

uploadButton.addEventListener("click", function () {
fileInput.click();
});

fileInput.addEventListener("change", function () {
const newFiles = Array.from(fileInput.files);


newFiles.forEach(function (newFile) {
    const alreadyAdded = pendingFiles.some(function (existingFile) {
        return (
            existingFile.name === newFile.name &&
            existingFile.size === newFile.size &&
            existingFile.lastModified === newFile.lastModified
        );
    });

    if (!alreadyAdded) {
        pendingFiles.push(newFile);
    }
});

updateSelectedFiles();
fileInput.value = "";


});

function updateSelectedFiles() {
if (pendingFiles.length === 0) {
selectedFiles.textContent = "No files selected yet.";
return;
}


selectedFiles.textContent =
    "Selected files (" + pendingFiles.length + "): " +
    pendingFiles.map(function (file) {
        return file.name;
    }).join(", ");


}

const uploadForm = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", async function (event) {
event.preventDefault();


if (pendingFiles.length === 0) {
    alert("Please select files before uploading.");
    return;
}

const formData = new FormData();

pendingFiles.forEach(function (file) {
    formData.append("files", file);
});

const submitButton = document.getElementById("submitUpload");
submitButton.disabled = true;
submitButton.textContent = "Uploading...";

try {
    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    console.log("HTTP status:", response.status);
    console.log("Server response:", JSON.stringify(result, null, 2));

   if (result.files && result.files.length > 0) {
    displayUploadedFiles(result.files);

    pendingFiles = [];
    updateSelectedFiles();
}
 

    let message = result.message || "Upload completed.";

    if (result.errors && result.errors.length > 0) {
        message += "\n\n" + result.errors.join("\n");
    }

    if (!response.ok && response.status !== 207) {
        throw new Error(message);
    }

    alert(message);
} catch (error) {
    alert("Upload failed: " + error.message);
} finally {
submitButton.disabled = false;
submitButton.textContent = "Upload Selected Files";
}



function displayUploadedFiles(files) {
files.forEach(function (file) {
const listItem = document.createElement("li");
listItem.textContent = "📄 " + file.name;


    uploadedFilesList.appendChild(listItem);
});

const totalFiles = uploadedFilesList.children.length;

resultCount.textContent =
    totalFiles + (totalFiles === 1 ? " file" : " files");

emptyState.style.display = totalFiles === 0 ? "block" : "none";


}



});
