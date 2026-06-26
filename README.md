# 🚀 ResumeIQ – AI Resume Analyzer

ResumeIQ is a full-stack AI-powered Resume Analyzer that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS). Users can upload resumes, receive an ATS score, identify skill gaps, get AI-powered improvement suggestions, generate role-specific interview questions, and download a professional PDF report.

---

## ✨ Features

* 🔐 JWT Authentication (Register/Login)
* 📄 Resume Upload (PDF & DOCX)
* 📑 Resume Parsing & Text Extraction
* 📊 ATS Score Calculation
* 🎯 Skill Gap Analysis
* 🤖 AI Resume Improvement Suggestions (Gemini API)
* 💼 Job Role Recommendations
* 💬 Role-Specific Interview Question Generator
* 📥 PDF Report Generation
* 👤 User Profile Management
* 📈 Dashboard with Resume Analytics
* 📱 Responsive UI
* 🔒 Protected Routes
* 🌐 RESTful API Architecture

---

## 🛠 Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* React Router
* Axios

### Backend

* Django
* Django REST Framework
* PostgreSQL
* JWT Authentication (Simple JWT)

### AI & Cloud

* Google Gemini API
* Amazon S3 (Optional)

---

## 📂 Project Structure

```text
ResumeIQ/
│── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
│── backend/
│   ├── accounts/
│   ├── resume/
│   ├── analysis/
│   ├── jobs/
│   ├── interview/
│   ├── reports/
│   ├── dashboard/
│   ├── config/
│   ├── requirements.txt
│   └── manage.py
│
└── README.md
```

---

## 🏗 System Architecture

```text
                React Frontend
                       │
                       ▼
          Django REST Framework API
                       │
      ┌─────────────────────────────────┐
      │ Authentication (JWT)            │
      │ Resume Upload & Parsing         │
      │ ATS Analysis                    │
      │ Skill Gap Analysis              │
      │ Job Recommendations             │
      │ Interview Question Generator    │
      │ PDF Report Generator            │
      └─────────────────────────────────┘
                       │
                       ▼
               PostgreSQL Database
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/resumeiq.git
cd resumeiq
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend` folder.

```env
SECRET_KEY=your_secret_key

DEBUG=True

DB_NAME=resume_analyzer
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

GEMINI_API_KEY=your_gemini_api_key

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=ap-south-1
```

---

## 🔌 API Modules

### Authentication

* Register
* Login
* JWT Token Refresh
* User Profile

### Resume

* Upload Resume
* View Resumes
* Delete Resume
* Resume Parsing

### Analysis

* ATS Score
* Skill Gap Analysis
* Resume Suggestions

### Jobs

* Job Role Management
* Job Recommendations

### Interview

* Role-Specific Interview Questions

### Reports

* Generate PDF Report
* Download Report

### Dashboard

* Resume Analytics
* ATS Statistics

---

## 📋 Application Workflow

```text
Register/Login
      │
      ▼
Upload Resume
      │
      ▼
Extract Resume Text
      │
      ▼
Select Job Role
      │
      ▼
Generate ATS Score
      │
      ▼
Skill Gap Analysis
      │
      ▼
Job Recommendations
      │
      ▼
Interview Questions
      │
      ▼
Generate & Download PDF Report
```

---

## 🚀 Future Enhancements

* AI Cover Letter Generator
* LinkedIn Profile Analysis
* Resume Version History
* Resume Templates
* Career Roadmap Generator
* AI Career Assistant Chatbot
* Multi-language Resume Analysis
* Email Notifications

---

## 👨‍💻 Author

**Piyush Kumar**

If you found this project useful, consider giving the repository a ⭐ and feel free to fork it or contribute improvements.
