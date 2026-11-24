# FaceSpotlight – Celebrity Face Recognition

FaceSpotlight is a celebrity face recognition application built using Python, OpenCV, HOG feature extraction, an RBF SVM classifier, FastAPI, and Angular.

## Features
- Recognizes 9 celebrity categories.
- Detects faces using Haar Cascade.
- Extracts facial features using HOG.
- Predicts celebrity categories using an SVM classifier.
- Displays annotated images with the selected face region.
- Angular dashboard with recognition history, analytics, model insights, and celebrity gallery.

## Technology Stack
- **Frontend:** Angular, TypeScript, HTML, CSS
- **Backend:** Python, FastAPI, OpenCV
- **Machine Learning:** HOG, StandardScaler, RBF SVM
- **Model Storage:** Joblib

## Project Structure
```text
FaceSpotlight/
├── frontend/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── saved_model/
│       ├── face_recognition_svm.pkl
│       └── label_encoder.pkl
├── .gitignore
└── README.md
```

## Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

API: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

## Run the Frontend

Open another terminal:

```bash
cd frontend
npm install
npx ng serve
```

Open `http://localhost:4200`.

## Model Evaluation

- Recognition categories: 9
- Cross-validation accuracy: 83.50% (5-fold Stratified Cross-Validation)
- External evaluation accuracy: 66.1% on 59 successfully processed images.

*Cross-validation and external evaluation results are reported separately.*

## Note
This is a closed-set celebrity classification project. Predictions are limited to the celebrity categories used during model training.
