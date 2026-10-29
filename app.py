from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = Path(app.root_path) / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB per request

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
}


# Landing page
@app.route("/")
def home():
    return render_template("landing.html")


# Actual application workspace
@app.route("/workspace")
def workspace():
    return render_template("workspace.html")


# Upload files
@app.route("/upload", methods=["POST"])
def upload_files():
    files = request.files.getlist("files")

    if not files or all(not file.filename for file in files):
        return jsonify({
            "error": "Please select at least one file."
        }), 400

    saved_files = []
    errors = []

    for file in files:
        if not file.filename:
            continue

        original_name = secure_filename(file.filename)
        extension = Path(original_name).suffix.lower()

        if not original_name:
            errors.append("A file has an invalid filename.")
            continue

        if extension not in ALLOWED_EXTENSIONS:
            errors.append(
                f"{original_name}: file type not supported."
            )
            continue

        unique_name = f"{uuid4().hex}{extension}"
        destination = UPLOAD_FOLDER / unique_name

        try:
            file.save(destination)

            saved_files.append({
                "name": original_name,
                "stored_name": unique_name,
            })

        except OSError:
            errors.append(
                f"{original_name}: could not save the file."
            )

    status_code = 207 if saved_files and errors else (
        400 if errors and not saved_files else 200
    )

    return jsonify({
        "message": f"Uploaded {len(saved_files)} file(s).",
        "files": saved_files,
        "errors": errors,
    }), status_code


if __name__ == "__main__":
    app.run(debug=True)


