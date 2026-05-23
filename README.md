# PostureGuard - AI-Based Real-Time Posture Detection System

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange.svg)](https://mediapipe.dev/)
[![ML](https://img.shields.io/badge/Machine-Learning-red.svg)](https://scikit-learn.org/)

## 📌 Project Overview

**PostureGuard** is an intelligent, non-intrusive web application that uses **computer vision and machine learning** to monitor user posture in real-time through a standard webcam. The system detects poor posture automatically and displays instant warning alerts, encouraging healthier sitting habits without interrupting workflow.

### Problem Statement

In today's digital era, prolonged screen time during video calls, online classes, and remote work leads to poor sitting posture, causing musculoskeletal disorders including chronic back pain, neck strain, and spinal issues. Traditional posture correction methods are reactive rather than preventive.

### Solution

PostureGuard provides an intelligent, real-time solution that:
- Continuously monitors posture using a standard webcam
- Uses **Machine Learning (Random Forest/SVM)** for accurate posture classification
- Provides instant visual and voice feedback
- Stores session data for posture history and weekly reports

## ✨ Key Features

### 🎯 Real-Time Posture Detection
- MediaPipe Pose for 33 body landmark extraction
- Biomechanical angle calculation (neck angle, shoulder slope, spine tilt)
- **Custom-trained ML model** (Random Forest/SVM) for posture classification
- Real-time webcam processing directly in browser

### 🔔 Smart Alert System
- Live posture score (0-100) display
- Visual feedback with color-coded zones (Green/Yellow/Red)
- Warning popup toasts with corrective instructions
- Voice alerts using Web Speech API

### 📊 Analytics Dashboard
- Posture history tracking
- Weekly performance reports
- Session-wise data storage
- Posture trend visualization with Chart.js

### 🔐 User Management
- JWT-based authentication
- Personal session storage
- User-specific posture history

### 🖥️ Browser-Based Implementation
- No additional hardware required
- Picture-in-Picture (PiP) support for uninterrupted monitoring
- Works with standard webcam

## 🏗️ System Architecture
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND (React)                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │   Webcam    │───▶│  MediaPipe  │───▶│   Angle     │───▶│   Send to Django    │   │
│  │   Capture   │    │    Pose     │    │ Calculation │    │       API           │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┬──────────┘   │
│                                                                       │              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │              │
│  │   Alert     │◀───│   Zone      │◀───│   ML Result │               │              │
│  │   Display   │    │   (G/Y/R)   │    │   from API  │               │              │
│  └─────────────┘    └─────────────┘    └─────────────┘               │              │
└───────────────────────────────────────────────────────────────────────┼──────────────┘
                                                                        │
                                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BACKEND (Django)                                  │
│                                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │    JWT      │    │   Session   │    │    Load     │    │     Feature         │   │
│  │   Auth      │───▶│  Management │───▶│   ML Model  │───▶│     Scaling         │   │
│  │             │    │             │    │   (.pkl)    │    │                     │   │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    └──────────┬──────────┘   │
│                                               │                      │              │
│                                               ▼                      ▼              │
│                                    ┌─────────────────┐    ┌─────────────────────┐   │
│                                    │   Random Forest │    │      Database       │   │
│                                    │   / SVM Model   │    │   (SQLite/PostgreSQL)│   │
│                                    └─────────────────┘    └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    ▲                              ▲
                                    │                              │
                    ┌───────────────┴───────────────┐              │
                    │                               │              │
            ┌───────┴───────┐               ┌───────┴───────┐       │
            │  Neck Angle   │               │ Shoulder Slope│       │
            │  Spine Tilt   │               │ Ear-Shoulder  │       │
            │  Head Tilt    │               │    Ratio      │       │
            └───────────────┘               └───────────────┘       │
                                                                     │
                                    ┌────────────────────────────────┘
                                    ▼
                    ┌───────────────────────────────────────────────┐
                    │           Biomechanical Features              │
                    │  (Input to ML Model for Posture Classification)│
                    └───────────────────────────────────────────────┘
                    
## 🛠️ Technology Stack

| Category | Technologies Used |
|----------|-------------------|
| **Frontend** | React.js, JavaScript, Tailwind CSS |
| **Computer Vision** | MediaPipe Pose |
| **Machine Learning** | Scikit-learn (Random Forest, SVM, KNN) |
| **Backend** | Django, Django REST Framework |
| **Authentication** | JWT (Simple JWT) |
| **Database** | SQLite / PostgreSQL |
| **Data Analysis** | Pandas, NumPy, Matplotlib, Seaborn |
| **API Communication** | REST API |
| **Browser APIs** | Web Speech API, Picture-in-Picture API, Canvas API |
| **Version Control** | Git, GitHub |

## 📋 Research Objectives

1. Develop a web-based posture monitoring application using React and Django REST Framework
2. Implement real-time human pose estimation using MediaPipe Pose
3. Build and train a machine learning classification model (Random Forest/SVM)
4. Calculate biomechanical angles as model features
5. Display real-time warning popups and posture scores
6. Store session data and provide posture history dashboard
7. Create a scalable, non-intrusive posture monitoring solution

## 🚀 Installation Guide

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Webcam (built-in or external)

### Step 1: Clone the Repository

```bash
git clone https://github.com/MuhammadShamaeel/posture-detection-system.git
cd posture-detection-system