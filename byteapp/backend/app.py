import os
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from werkzeug.utils import secure_filename
import google.generativeai as genai
import PyPDF2
import docx
import json

# Load env
load_dotenv()

MONGO_URI = os.getenv("MONGO_HOST")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Flask setup
app = Flask(
    __name__,
    static_folder="build",   # React build folder
    template_folder="templates"
)
CORS(app)

# MongoDB
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
try:
    client.server_info()
    print("✅ Connected to MongoDB")
except ServerSelectionTimeoutError as e:
    print("❌ MongoDB connection failed:", e)

# Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

# ---------------- AUTH ----------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password required"}), 400
    db = client["data"]
    if db.logins.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400
    db.logins.insert_one({"email": data["email"], "password": data["password"]})
    return jsonify({"message": "Registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password required"}), 400
    db = client["data"]
    user = db.logins.find_one({"email": data["email"], "password": data["password"]})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"message": "Login successful", "redirect": "/roadmap"})

# ---------------- ROADMAP GENERATOR ----------------

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"txt", "pdf", "doc", "docx"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(filepath, filename):
    try:
        if filename.endswith(".txt"):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        elif filename.endswith(".pdf"):
            with open(filepath, "rb") as f:
                pdf_reader = PyPDF2.PdfReader(f)
                return "\n".join([p.extract_text() for p in pdf_reader.pages])
        elif filename.endswith(".docx"):
            doc = docx.Document(filepath)
            return "\n".join([p.text for p in doc.paragraphs])
        return None
    except Exception:
        return None

def generate_course_roadmap(content):
    prompt = f"Generate a study roadmap and quizzes for:\n{content}"
    response = model.generate_content(prompt)
    try:
        response_text = response.text
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        return json.loads(response_text.strip())
    except:
        return {"roadmap_text": response.text, "format": "text"}

@app.route("/generate-roadmap", methods=["POST"])
def generate_roadmap():
    if not GEMINI_API_KEY:
        return jsonify({"error": "Gemini API key not set"}), 500
    content = ""
    if "file" in request.files and request.files["file"].filename:
        file = request.files["file"]
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            content = extract_text_from_file(filepath, filename)
            os.remove(filepath)
    elif request.form.get("content"):
        content = request.form.get("content")
    if not content or not content.strip():
        return jsonify({"error": "No content provided"}), 400
    roadmap = generate_course_roadmap(content)
    return jsonify({"success": True, "roadmap": roadmap})

# ---------------- UI ROUTES ----------------

@app.route("/roadmap")
def roadmap_page():
    return render_template("indexj.html")

# React frontend routes (serve React build)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
