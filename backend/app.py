
import base64
from pathlib import Path

import cv2
import joblib
import numpy as np
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from skimage.feature import hog

# Load the trained HOG + SVM model from this project's saved_model folder.
MODEL_PATH = Path(__file__).resolve().parent / "saved_model"

IMAGE_SIZE = (100, 100)
HOG_ORIENTATIONS = 9
PIXELS_PER_CELL = (8, 8)
CELLS_PER_BLOCK = (2, 2)
BLOCK_NORM = "L2-Hys"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

model = joblib.load(MODEL_PATH / "face_recognition_svm.pkl")
label_encoder = joblib.load(MODEL_PATH / "label_encoder.pkl")

cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
face_cascade = cv2.CascadeClassifier(cascade_path)

if face_cascade.empty():
    raise RuntimeError("Unable to load the Haar Cascade face detector.")

app = FastAPI(
    title="FaceSpotlight API",
    description="Face detection and celebrity-category prediction using HOG and RBF SVM.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "FaceSpotlight API is running!",
        "model": "HOG + RBF SVM",
        "classes": [str(value) for value in label_encoder.classes_]
    }


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict")
async def predict_celebrity(file: UploadFile):
    contents = await file.read()

    if not contents:
        return {"status": "error", "message": "The uploaded file is empty."}

    if len(contents) > MAX_UPLOAD_BYTES:
        return {"status": "error", "message": "Image is too large. Maximum size is 10 MB."}

    image_array = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        return {"status": "error", "message": "Unable to read this image. Please upload a valid image."}

    image_height, image_width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    if len(faces) == 0:
        return {"status": "error", "message": "No face detected. Try a clearer, front-facing image."}

    x, y, width, height = max(faces, key=lambda face: face[2] * face[3])

    face_region = gray[y:y + height, x:x + width]
    face_region = cv2.resize(face_region, IMAGE_SIZE)
    normalized_face = face_region / 255.0

    features = hog(
        normalized_face,
        orientations=HOG_ORIENTATIONS,
        pixels_per_cell=PIXELS_PER_CELL,
        cells_per_block=CELLS_PER_BLOCK,
        block_norm=BLOCK_NORM
    )

    prediction = model.predict(features.reshape(1, -1))[0]
    celebrity_name = str(label_encoder.inverse_transform([prediction])[0])

    annotated = image.copy()

    cv2.rectangle(
        annotated,
        (int(x), int(y)),
        (int(x + width), int(y + height)),
        (101, 87, 220),
        3
    )

    cv2.putText(
        annotated,
        "Selected face region",
        (int(x), max(25, int(y) - 10)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (101, 87, 220),
        2,
        cv2.LINE_AA
    )

    success, encoded = cv2.imencode(".jpg", annotated)
    annotated_base64 = (
        base64.b64encode(encoded.tobytes()).decode("utf-8")
        if success else None
    )

    return {
        "status": "success",
        "celebrity": celebrity_name,
        "detected_faces": int(len(faces)),
        "annotated_image": annotated_base64,
        "image_width": int(image_width),
        "image_height": int(image_height)
    }
