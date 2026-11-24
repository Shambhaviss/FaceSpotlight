# FaceSpotlight – Celebrity Face Recognition

FaceSpotlight is a celebrity face recognition application built using Python, OpenCV, HOG feature extraction, an RBF SVM classifier, FastAPI, and Angular.

The application identifies faces belonging to 9 celebrity categories through a machine learning model and provides an interactive Angular dashboard.

## Features

- Recognizes 9 celebrity categories.
- Detects faces using Haar Cascade.
- Extracts facial features using Histogram of Oriented Gradients (HOG).
- Predicts celebrity categories using an RBF SVM classifier.
- Displays annotated images with the selected face region.
- Angular dashboard with recognition history, analytics, model insights, and celebrity gallery.
- FastAPI backend for model predictions.

## Technology Stack

- **Frontend:** Angular, TypeScript, HTML, CSS
- **Backend:** Python, FastAPI
- **Computer Vision:** OpenCV, Haar Cascade
- **Machine Learning:** HOG, StandardScaler, RBF SVM
- **Model Storage:** Joblib

## Project Structure

```text
FaceSpotlight/
├── frontend/
│   ├── src/
│   ├── angular.json
│   └── package.json
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── saved_model/
│       ├── face_recognition_svm.pkl
│       └── label_encoder.pkl
├── notebook/
│   └── FaceSpotlight_Final.ipynb
├── .gitignore
└── README.md
```

**Note:** The original dataset is kept locally and is not included in this repository.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Shambhaviss/FaceSpotlight.git
cd FaceSpotlight
```

### 2. Run the Backend

Open a terminal:

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend API:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 3. Run the Frontend

Open another terminal from the project root:

```bash
cd frontend
npm install
npx ng serve
```

Open the application:

`http://localhost:4200`

## Model Evaluation

The model was evaluated using two separate evaluation methods:

| Evaluation | Result |
|---|---:|
| Recognition categories | 9 |
| 5-Fold Stratified Cross-Validation Accuracy | 83.50% |
| External Evaluation Accuracy | 66.1% |
| Successfully Processed External Images | 59 |

*Cross-validation and external evaluation results are reported separately.*

## Model Limitations

- The model performs closed-set classification and predicts only among the 9 celebrity categories used during training.
- Recognition accuracy can be affected by lighting, facial expressions, image quality, and face detection.
- Some external images may be misclassified, particularly when facial appearance differs from the training samples.

## Future Improvements

- Expand the celebrity dataset.
- Improve face detection and recognition accuracy.
- Add support for unknown-face detection.
- Improve model generalization across different lighting conditions and image qualities.
