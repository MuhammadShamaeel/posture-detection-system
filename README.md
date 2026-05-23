# 🛡️ PostureGuard – AI-Based Real-Time Posture Detection System

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Django](https://img.shields.io/badge/Django-5.2-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange.svg)
![Machine Learning](https://img.shields.io/badge/Machine-Learning-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

# 📌 Overview

**PostureGuard** is an AI-powered real-time posture monitoring web application that uses **Computer Vision**, **Machine Learning**, and **Biomechanical Analysis** to detect poor sitting posture through a standard webcam.

The system continuously tracks body posture using **MediaPipe Pose**, extracts biomechanical features such as neck angle and spine tilt, and classifies posture using a trained **Machine Learning model** like **Random Forest** or **SVM**.

When poor posture is detected, the system instantly alerts the user through:
- Visual warning notifications
- Color-based posture indicators
- Voice feedback alerts

The application also stores session history and provides analytics dashboards to help users improve posture habits over time.

---

# 🎯 Problem Statement

Modern lifestyles involve long hours of:
- Online classes
- Video conferencing
- Software development
- Gaming
- Remote work

This leads to poor sitting posture, causing:
- Neck strain
- Back pain
- Shoulder pain
- Spinal problems
- Musculoskeletal disorders

Most existing posture correction methods are reactive instead of preventive.

---

# 💡 Proposed Solution

PostureGuard provides a proactive AI-based posture monitoring system that:

✅ Detects posture continuously in real-time  
✅ Uses Machine Learning for intelligent posture classification  
✅ Gives instant corrective feedback  
✅ Tracks posture history and trends  
✅ Works directly in the browser without additional hardware  

---

# ✨ Key Features

## 🎥 Real-Time Posture Detection
- Live webcam posture monitoring
- MediaPipe Pose landmark extraction
- 33 body keypoint tracking
- Biomechanical angle calculations
- ML-based posture classification

## 🧠 Machine Learning Integration
- Random Forest / SVM / KNN support
- Trained posture classification model
- Real-time posture scoring
- Feature scaling using Scikit-learn

## 🔔 Smart Alert System
- Live posture score (0–100)
- Green / Yellow / Red posture zones
- Warning popup notifications
- Voice alerts using Web Speech API

## 📊 Analytics Dashboard
- Session history tracking
- Weekly posture reports
- Posture improvement trends
- Interactive charts using Chart.js

## 🔐 Authentication & Security
- JWT Authentication
- User-specific data storage
- Secure API communication

## 🖥️ Browser-Based Solution
- No wearable devices needed
- Works with standard webcams
- Picture-in-Picture (PiP) support
- Lightweight and scalable

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                     │
├──────────────────────────────────────────────────────────────┤
│ Webcam → MediaPipe Pose → Angle Calculation → Django API   │
│                                                             │
│ ML Result → Zone Detection → Alerts & Notifications         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND (Django)                     │
├──────────────────────────────────────────────────────────────┤
│ JWT Auth → Session Management → ML Model → Database        │
│                                                             │
│ Feature Scaling → Posture Classification                    │
└──────────────────────────────────────────────────────────────┘
```

---

# 🧬 Biomechanical Features Used

The ML model uses several posture-related biomechanical measurements:

- Neck Angle
- Shoulder Slope
- Spine Tilt
- Head Tilt
- Ear-to-Shoulder Ratio
- Body Alignment Angles

These features are extracted from MediaPipe body landmarks and passed into the trained ML model.

---

# 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React.js, JavaScript, Tailwind CSS |
| Backend | Django, Django REST Framework |
| Authentication | JWT (Simple JWT) |
| Computer Vision | MediaPipe Pose |
| Machine Learning | Scikit-learn |
| Database | SQLite / PostgreSQL |
| Data Processing | Pandas, NumPy |
| Visualization | Chart.js, Matplotlib |
| APIs | REST API |
| Browser APIs | Web Speech API, PiP API |
| Version Control | Git, GitHub |

---

# 📚 Machine Learning Workflow

```text
MediaPipe Pose Detection
          ↓
Landmark Extraction
          ↓
Biomechanical Feature Calculation
          ↓
Feature Scaling
          ↓
ML Model Prediction
          ↓
Posture Classification
          ↓
Alert Generation
```

---

# 🎯 Research Objectives

1. Develop a web-based posture monitoring system
2. Implement real-time human pose estimation
3. Train ML models for posture classification
4. Extract biomechanical posture features
5. Provide real-time corrective feedback
6. Store and visualize posture history
7. Build a scalable and non-intrusive monitoring solution

---

# 📂 Project Structure

```bash
posture-detection-system/
│
├── backend/
│   ├── posture_api/
│   ├── ml_model/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── dataset/
├── notebooks/
├── README.md
└── .gitignore
```

---

# 🚀 Installation Guide

## 📌 Prerequisites

Before running the project, install:

- Python 3.8+
- Node.js 16+
- npm or yarn
- Webcam access enabled

---

# ⚙️ Backend Setup (Django)

## 1️⃣ Clone Repository

```bash
git clone https://github.com/MuhammadShamaeel/posture-detection-system.git

cd posture-detection-system
```

---

## 2️⃣ Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4️⃣ Run Database Migrations

```bash
cd backend

python manage.py migrate
```

---

## 5️⃣ Start Django Server

```bash
python manage.py runserver
```

Backend runs at:

```bash
http://127.0.0.1:8000/
```

---

# ⚛️ Frontend Setup (React)

## 1️⃣ Navigate to Frontend

```bash
cd frontend
```

---

## 2️⃣ Install Node Packages

```bash
npm install
```

---

## 3️⃣ Start React Application

```bash
npm run dev
```

Frontend runs at:

```bash
http://localhost:5173/
```

---

# 🧠 ML Model Training

## Supported Algorithms

- Random Forest Classifier
- Support Vector Machine (SVM)
- K-Nearest Neighbors (KNN)

---

## Training Workflow

```bash
dataset → preprocessing → feature extraction → training → model.pkl
```

---

# 📊 Posture Classification

| Posture Score | Zone | Status |
|---------------|------|--------|
| 80 – 100 | 🟢 Green | Good Posture |
| 50 – 79 | 🟡 Yellow | Warning |
| 0 – 49 | 🔴 Red | Poor Posture |

---

# 📸 Application Screenshots

## Dashboard
_Add dashboard screenshot here_

## Real-Time Detection
_Add posture detection screenshot here_

## Analytics Report
_Add analytics screenshot here_

---

# 🔐 Authentication Flow

```text
User Login/Register
        ↓
JWT Token Generation
        ↓
Protected API Access
        ↓
Session Data Storage
```

---

# 📈 Future Enhancements

- Mobile support
- AI posture correction suggestions
- Multi-person posture tracking
- Cloud deployment
- Email health reports
- Deep Learning integration
- Wearable device integration

---

# 🧪 Testing

Run backend tests:

```bash
python manage.py test
```

Run frontend linting:

```bash
npm run lint
```

---

# 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | User Registration |
| `/api/auth/login/` | POST | User Login |
| `/api/posture/predict/` | POST | Posture Prediction |
| `/api/history/` | GET | Fetch Posture History |

---

# 🤝 Contribution

Contributions are welcome!

## Steps to Contribute

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Create Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

## Muhammad Shamaeel

AI & Full Stack Developer

GitHub: https://github.com/MuhammadShamaeel

---

# ⭐ Support

If you found this project useful:

⭐ Star the repository  
🍴 Fork the project  
🛠️ Contribute improvements  
📢 Share with others  

---