# Posture Detection System

A modern real-time posture monitoring system that uses AI-powered pose estimation to detect sitting posture through a webcam, provide live visual and voice feedback, and store session analytics for long-term posture tracking.

---

## 📌 Overview

This project is a browser-based posture monitoring system designed to help users maintain healthy sitting posture during long working hours.

The system captures live webcam input, extracts body landmarks using AI-based pose estimation, analyzes posture patterns in real time, and provides instant corrective feedback through visual indicators and voice alerts.

It also stores session analytics such as posture quality, posture trends, alert counts, and session duration for later review through reports and insights dashboards.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| Real-Time Posture Detection | Detects user posture continuously using live webcam feed |
| AI Pose Estimation | Uses MediaPipe Pose to extract body landmarks |
| Calibration System | Learns the user's natural sitting posture before monitoring |
| Live Visual Feedback | Displays posture state directly on screen |
| Voice Alerts | Provides spoken posture correction alerts |
| Session Analytics | Tracks posture quality and session statistics |
| Reports Dashboard | Displays saved posture sessions and trends |
| Pause & Resume Monitoring | Allows monitoring sessions to be paused without resetting |
| Picture-in-Picture (PiP) Mode | Keeps monitoring visible while switching tabs |
| Mirror Camera Option | Lets users flip the camera view for better usability |
| Secure Authentication | JWT-based login and signup system |
| Persistent User Settings | Saves settings such as voice alerts and mirror mode |
| Protected Session Data | Each user can access only their own sessions |
| Dark-Themed UI | Modern dark interface optimized for long usage |

---

## 🧠 System Workflow

1. Webcam captures live video  
2. MediaPipe extracts body landmarks  
3. Posture features are calculated  
4. Posture is classified into zones  
5. UI feedback and voice alerts are generated  
6. Session statistics are tracked  
7. Session data is stored in backend database  
8. Reports and insights are displayed to the user  

---

## 🛠 Tech Stack

### Frontend

| Technology | Usage |
|---|---|
| React | Frontend UI development |
| Tailwind CSS | Styling and responsive UI |
| Axios | API communication |
| MediaPipe Pose | Real-time pose detection |
| Browser Canvas API | Skeleton rendering and overlays |
| Web Speech API | Voice posture alerts |
| Picture-in-Picture API | Floating monitoring window |
| Local Storage API | Persistent user settings |

### Backend

| Technology | Usage |
|---|---|
| Django | Backend framework |
| Django REST Framework | API development |
| Simple JWT | Authentication system |
| SQLite / Database | Session data storage |

---

## 🔐 Authentication System

The project uses JWT-based authentication with secure token handling.

### Implemented Features

- User Signup  
- User Login  
- Access Token & Refresh Token generation  
- Protected APIs using authentication middleware  
- User-specific session access control  

---

## 📊 Session Management

The system supports complete posture session management.

| Feature | Description |
|---|---|
| Create Session | Saves monitoring session data |
| Fetch Sessions | Retrieves user posture history |
| Delete Session | Deletes a selected session |
| Clear Sessions | Removes all user sessions |

---

## 🎥 Real-Time AI Engine

The posture detection engine runs directly in the frontend browser.

### Why Frontend-Based Processing?

- Faster real-time performance  
- Reduced backend processing load  
- Lower latency  
- Improved privacy since video stays in browser  
- No continuous video streaming to server  

### The backend is mainly responsible for:

- Authentication  
- Session storage  
- Reports data management  

---

## 📈 Posture Analysis Metrics

The system tracks multiple posture-related metrics including:

- Good posture percentage  
- Poor posture duration  
- Alert count  
- Drift analysis  
- Posture trend  
- Session duration  
- Posture Stability Index (PSI)  

---

## 🚀 Future Enhancements

| Enhancement | Description |
|---|---|
| Multi-Person Detection Support | Improve tracking when multiple people enter the frame |
| Smart Exercise Recommendations | Suggest stretches and posture correction exercises |
| Smart Break Reminder System | Detect long sitting duration and suggest breaks automatically |

---

## ⚠ Current Limitations

- Works best with laptop webcams and seated desk posture  
- User should be centered and reasonably well-lit in frame  
- Mobile layout is currently limited  

---

## 📚 Research Reference

https://ijprcp.com/articles/real-time-posture-monitoring-system-a-systematic-review

---

## 👥 Team Members

| Name | Role | Responsibilities |
|---|---|---|
| Aflaha A | Frontend & AI Workflow Development | Developed posture detection workflow, MediaPipe integration, monitoring UI, session handling, alerts, and frontend system architecture |
| Thoufeeq | Backend Development & System Support | Worked on backend APIs, authentication, database integration, and session management |

---

## ▶️ Running the Project

### Clone the Repository

```bash
git clone https://github.com/aflaha01/posture-detection-system.git
```

## 🧰 Setup Instructions

### Frontend Setup

```bash
cd posture-detection-system/frontend
npm install
npm start
```

### Backend Setup

```bash
cd ../backend
python -m venv venv
```

#### Activate Virtual Environment

- Windows:
  ```bash
  venv\Scripts\activate
  ```
- macOS / Linux:
  ```bash
  source venv/bin/activate
  ```

```bash
pip install -r requirements.txt
python manage.py runserver
```