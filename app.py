from pathlib import Path
from uuid import uuid4
import json

from flask import (
    Flask,
    jsonify,
    render_template,
    request,
    send_from_directory,
    abort,
)
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = Path(app.root_path) / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

METADATA_FILE = UPLOAD_FOLDER / "metadata.json"

app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg",
}

PREVIEW_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
}


# -------------------------------
# Metadata helpers
# -------------------------------

def load_metadata():
    if not METADATA_FILE.exists():
        return {}

    try:
        return json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def save_metadata(metadata):
    METADATA_FILE.write_text(
        json.dumps(metadata, indent=4),
        encoding="utf-8",
    )

# -------------------------------
# Landing page with cinematic intro
# -------------------------------

@app.route("/")
def home():
    return render_template("landing.html")


# -------------------------------
# Workspace
# -------------------------------

@app.route("/workspace")
def workspace():
    return render_template("workspace.html")

# -------------------------------
# Upload files
# -------------------------------

@app.route("/upload", methods=["POST"])
def upload_files():
    files = request.files.getlist("files")

    if not files or all(not file.filename for file in files):
        return jsonify({
            "error": "Please select at least one file."
        }), 400

    metadata = load_metadata()
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

            file_info = {
                "name": original_name,
                "stored_name": unique_name,
                "size": destination.stat().st_size,
            }

            metadata[unique_name] = file_info
            saved_files.append(file_info)

        except OSError:
            errors.append(
                f"{original_name}: could not save the file."
            )

    save_metadata(metadata)

    status_code = 207 if saved_files and errors else (
        400 if errors and not saved_files else 200
    )

    return jsonify({
        "message": f"Uploaded {len(saved_files)} file(s).",
        "files": saved_files,
        "errors": errors,
    }), status_code


# -------------------------------
# List uploaded files
# -------------------------------

@app.route("/files", methods=["GET"])
def get_files():
    metadata = load_metadata()
    available_files = []

    for stored_name, file_info in metadata.items():
        file_path = UPLOAD_FOLDER / stored_name

        if not file_path.is_file():
            continue

        available_files.append({
            "name": file_info["name"],
            "stored_name": stored_name,
            "size": file_path.stat().st_size,
            "extension": file_path.suffix.lower(),
        })

    available_files.sort(
        key=lambda item: item["name"].lower()
    )

    return jsonify({
        "files": available_files
    })


# -------------------------------
# Preview files
# -------------------------------

@app.route("/preview/<stored_name>", methods=["GET"])
def preview_file(stored_name):
    metadata = load_metadata()

    if stored_name not in metadata:
        abort(404)

    file_path = UPLOAD_FOLDER / stored_name

    if not file_path.is_file():
        abort(404)

    extension = file_path.suffix.lower()

    if extension not in PREVIEW_EXTENSIONS:
        return jsonify({
            "error": "Preview is not supported for this file type."
        }), 415

    return send_from_directory(
        UPLOAD_FOLDER,
        stored_name,
        as_attachment=False,
    )


# -------------------------------
# Delete files
# -------------------------------

@app.route("/delete/<stored_name>", methods=["DELETE"])
def delete_file(stored_name):
    metadata = load_metadata()

    if stored_name not in metadata:
        return jsonify({
            "error": "File not found."
        }), 404

    file_path = UPLOAD_FOLDER / stored_name

    try:
        if file_path.exists():
            file_path.unlink()

        del metadata[stored_name]
        save_metadata(metadata)

        return jsonify({
            "message": "File deleted successfully."
        })

    except OSError:
        return jsonify({
            "error": "Could not delete the file."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)