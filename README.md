# 🎯 ExamPulse - Online Mock Test & Assessment Platform

[![Java 17](https://img.shields.io/badge/Java-17-orange.svg?logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.5.5-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![H2 Database](https://img.shields.io/badge/Database-H2%20In--Memory-yellow.svg)](https://www.h2database.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, full-stack mock test and examination application built with **Java Spring Boot 3** and a lightweight, clean **React (Vite)** frontend. Designed for speed, responsive mobile touchscreens, and zero bloated state libraries.

---

## ✨ Features

- **⏱️ Real-Time Countdown Timer**: Live timer with urgent visual warning pulses when time runs low, plus auto-submit upon expiration.
- **📱 Mobile-First Responsive Design**:
  - Touch-friendly slide-up bottom sheet drawer for the Question Palette.
  - Sticky mobile bottom navigation bar (`← Prev`, `📋 Grid (3/8)`, `Next →` / `Finish ✓`).
  - Single-column cards and horizontal touch-scrolling category chips on smartphones.
- **🧭 Question Navigation Palette**: Interactive grid with status indicators:
  - 🟢 Answered
  - 🟡 Marked for Review (with asterisk `*`)
  - 🔵 Current Question
  - ⚪ Unvisited / Skipped
- **🔒 Anti-Cheat Secure Exam Flow**: Exam questions delivered to the frontend omit correct answer flags and explanations until the submission is evaluated on the server.
- **📊 Instant Evaluation & Analytics Engine**:
  - Automated scoring with negative marking support.
  - Circular score gauge, percentage, pass/fail status, accuracy rate %, and time taken.
- **💡 In-Depth Solution Reviews**: Filterable review (All / Correct / Incorrect / Skipped) comparing candidate choice with correct answer and concept explanations.
- **➕ Test Builder & Creator Mode**: Easily create new custom mock tests and questions with option keys, answers, and explanations.
- **📈 Past Attempt History**: Track and review previous attempts and scorecards.

---

## 🏗️ System Architecture

```
mockito/
├── backend/                  # Java Spring Boot 3.5.5 REST API
│   ├── src/main/java/com/mocktest/
│   │   ├── config/           # CORS & DataLoader (auto-seeds sample tests)
│   │   ├── controller/       # REST Endpoints (/api/tests, /api/categories, /api/attempts)
│   │   ├── dto/              # Immutable Java Records for Request & Response contracts
│   │   ├── entity/           # JPA Entities (Category, MockTest, Question, TestAttempt, etc.)
│   │   ├── exception/        # Global RFC-7807 Exception Handler
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   └── service/          # Business logic & scoring evaluation
│   └── src/main/resources/
│       └── application.yml   # H2 configuration & server settings
│
├── frontend/                 # "Lite React" Frontend powered by Vite
│   ├── src/
│   │   ├── api/              # Native fetch API client (testApi.js)
│   │   ├── components/       # ExamTimer, QuestionCard, QuestionPalette, Modals, Navbar
│   │   ├── pages/            # HomePage, ExamPage, ResultPage
│   │   ├── App.jsx           # Clean reactive view router
│   │   └── index.css         # Glassmorphism design system & mobile styles
│   └── vite.config.js        # Reverse proxy config to backend
│
├── .gitignore                # Complete root ignore for node_modules and target
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 17 or higher** installed (`java -version`)
- **Node.js 18 or higher** and **npm** installed (`node -v`, `npm -v`)

---

### 1. Run the Backend (Spring Boot)

Navigate to the `backend` folder:
```bash
cd backend
```

Using the included Maven wrapper:
- **Windows**:
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```
- **macOS / Linux**:
  ```bash
  chmod +x mvnw
  ./mvnw spring-boot:run
  ```

The server starts at `http://localhost:8080`.
- **H2 In-Memory Database Console**: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:mocktestdb`
  - Username: `sa`
  - Password: *(leave blank)*

> **Note**: On startup, sample mock tests for **Java & Spring Boot**, **React & Frontend**, and **Databases & SQL** are automatically seeded!

---

### 2. Run the Frontend (Lite React)

Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 📡 Core REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | List all subjects & categories |
| `GET` | `/api/tests` | List available tests (supports `?categoryId=`) |
| `GET` | `/api/tests/{id}` | Get summary of a specific test |
| `GET` | `/api/tests/{id}/start` | Start exam (returns questions sanitized without answers) |
| `POST` | `/api/tests` | Create a new test with questions |
| `DELETE` | `/api/tests/{id}` | Delete a test |
| `POST` | `/api/attempts/submit` | Submit exam answers, evaluate score, and save attempt |
| `GET` | `/api/attempts/{id}/result`| Get detailed scorecard and solution reviews |
| `GET` | `/api/attempts/history` | List all previous exam attempts |

---

## 📱 Mobile Preview
Optimized for mobile touchscreens:
- Responsive sticky bottom bar with navigation controls.
- Slide-up bottom sheet drawer for question navigation.
- Minimum 52px thumb touch targets with instant feedback.
- `overflow-x: hidden;` protection preventing horizontal page wobble.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
