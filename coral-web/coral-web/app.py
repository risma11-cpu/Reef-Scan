import os
import uuid
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from PIL import Image
import onnxruntime as ort

# ====== KONFIGURASI ======
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "coral_model_best.onnx")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
IMG_SIZE = 224
CLASS_NAMES = {0: "Algae", 1: "Bleached", 2: "Dead", 3: "Healthy"}
CLASS_NAMES_ID = {
    "Algae": "Berlumut",
    "Bleached": "Memutih",
    "Dead": "Mati",
    "Healthy": "Sehat",
}
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)

app.secret_key = "reefsc4n-s3cr3t-k3y-2026"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ====== SQLITE DATABASE ======
basedir = os.path.abspath(os.path.dirname(__file__))

app.config["SQLALCHEMY_DATABASE_URI"] = \
    "sqlite:///" + os.path.join(basedir, "reefdb.sqlite3")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ====== MODEL DATABASE ======
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    prediksi = db.relationship("Prediksi", backref="user", lazy=True)

class Prediksi(db.Model):
    __tablename__ = "prediksi"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    nama_file = db.Column(db.String(255), nullable=False)
    hasil_kelas = db.Column(db.String(50), nullable=False)
    hasil_kelas_id = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    waktu = db.Column(db.DateTime, default=datetime.utcnow)

# ====== BUAT TABEL DI DATABASE (harus di luar __main__ biar jalan di WSGI/PythonAnywhere) ======
with app.app_context():
    db.create_all()

# ====== LOAD MODEL ONNX ======
session_onnx = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
input_name = session_onnx.get_inputs()[0].name
output_name = session_onnx.get_outputs()[0].name

# ====== HELPER ======
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def preprocess_image(image_path):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.asarray(img).astype(np.float32) / 255.0
    img_array = np.transpose(img_array, (2, 0, 1))
    img_array = np.expand_dims(img_array, axis=0)
    return img_array.astype(np.float32)

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def predict(image_path):
    input_tensor = preprocess_image(image_path)
    outputs = session_onnx.run([output_name], {input_name: input_tensor})
    logits = outputs[0][0]
    probs = softmax(logits)
    results = [
        {
            "label": CLASS_NAMES[i],
            "label_id": CLASS_NAMES_ID[CLASS_NAMES[i]],
            "prob": float(probs[i]) * 100,
        }
        for i in range(len(CLASS_NAMES))
    ]
    results.sort(key=lambda x: x["prob"], reverse=True)
    return results

def get_user_from_request():
    user_id = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except:
        return None

# ====== API ROUTES ======
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not username or not email or not password:
        return jsonify({'error': 'Semua kolom wajib diisi.'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username minimal 3 karakter.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password minimal 6 karakter.'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username sudah digunakan.'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email sudah terdaftar.'}), 400
    user = User(username=username, email=email, password=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'user': {'id': user.id, 'username': user.username, 'token': str(user.id)}})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Username atau password salah.'}), 401
    return jsonify({'user': {'id': user.id, 'username': user.username, 'token': str(user.id)}})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    user = get_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    file = request.files.get('image')
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'File tidak valid.'}), 400
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(save_path)
    try:
        prediction = predict(save_path)
        top = prediction[0]
        record = Prediksi(
            user_id=user.id,
            nama_file=filename,
            hasil_kelas=top["label"],
            hasil_kelas_id=top["label_id"],
            confidence=top["prob"],
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'prediction': prediction, 'image_url': f'/static/uploads/{filename}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/riwayat', methods=['GET'])
def riwayat():
    user = get_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = Prediksi.query.filter_by(user_id=user.id).order_by(Prediksi.waktu.desc()).all()
    return jsonify([{
        'id': d.id,
        'nama_file': d.nama_file,
        'hasil_kelas': d.hasil_kelas,
        'hasil_kelas_id': d.hasil_kelas_id,
        'confidence': d.confidence,
        'waktu': d.waktu.isoformat(),
        'image_url': f'/static/uploads/{d.nama_file}',
    } for d in data])

@app.route('/api/riwayat/<int:id>', methods=['DELETE'])
def hapus_riwayat(id):
    user = get_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    record = Prediksi.query.get_or_404(id)
    if record.user_id != user.id:
        return jsonify({'error': 'Akses ditolak.'}), 403
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], record.nama_file)
    if os.path.exists(file_path):
        os.remove(file_path)
    db.session.delete(record)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route("/api/users")
def all_users():
    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ])

@app.route("/api/prediksi-all")
def all_prediksi():
    data = Prediksi.query.all()
    return jsonify([
        {
            "id": p.id,
            "user": p.user.username,
            "hasil": p.hasil_kelas_id,
            "confidence": p.confidence,
            "waktu": p.waktu.isoformat()
        }
        for p in data
    ])

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
