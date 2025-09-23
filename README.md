# 🎓 E-Learning & School Management Platform

This project is an **E-Learning and School Management System** built with:

- **Backend**: Laravel 11 (API + Business Logic)
- **Frontend**: React.js (UI/UX)
- **Containerization**: Docker & Docker Compose
- **Database**: MySQL (via Docker)
- **Authentication**: JWT/Auth Guards
- **Deployment**: Docker Compose for multi-service orchestration

---

## 📂 Project Structure

/project-root
├── backend/ # Laravel API
├── frontend/ # React Frontend
├── docker-compose.yml # Docker services (Laravel, React, MySQL, Nginx)
├── README.md # Documentation
└── .env # Environment variables



---

## 🌐 User Side Pages

### **Page 1: Home Page**
- **Hero Section**: Catchy headline + CTA (`Join Now`, `Login`).
- **Portfolio/Features**: Cards showing benefits (Easy Access, Quality Courses, Live Sessions, Secure).
- **About Us**: Mission/vision of the platform.
- **Contact Us**: Form (Name, Email, Message) + map/chat link.
- **Connexion/Inscription**: Quick access button in navbar (modal).

---

### **Page 2: Connexion / Inscription**
- **Connexion**
  - Phone Number
  - Password
  - "Forgot Password?" link
- **Inscription**
  - Full Name
  - Student & Parent Phone Numbers
  - Password (strength indicator)
  - Auto-generated Student ID
  - Redirect → Student Profile

---

### **Page 3: Student Profile**
- Profile Card:
  - Upload/change photo
  - Name, ID, Phone
  - QR Code (for check-in)
- Tabs:
  - Enrolled Classes (progress tracking)
  - Certificates & Achievements (future)

---

### **Page 4: Chapters**
- Search Bar (by subject/keyword).
- **Chapter Cards** → On click → Dialog:
  - Video player
  - PDF Summary (view + download)
  - Exercises (downloadable PDFs)

---

### **Page 5: Course Page**
- Main video player
- Side/Bottom Panel:
  - Summary PDF
  - Exercises PDFs
- Progress Status (Completed/In Progress)

---

### **Page 6: Live Sessions**
- Cards with:
  - Teacher name
  - Subject
  - Date & Time
  - Status (🟢 Live / ⏳ Upcoming / 🔴 Ended)
  - **Join Live** button

---

### **Page 7: Events**
- Sliders for school/learning events
- Upcoming lives & promotions
- CTA to register

---

## 🛠️ Admin Side Pages

### **Page 1: Dashboard**
- KPI Cards: Total Students, Teachers, Revenue, Sessions.
- Calendar filter.
- Graphs:
  - Subscriptions (monthly)
  - Guests (ma3fi cases with cause)
  - Top 3 Teachers (by load)
- Detailed view with:
  - School % performance
  - Revenue & Benefits
  - Session table (date, duration, type, revenue)
  - Print/export

---

### **Page 2: Students**
- Search/Filter (by prof, module, calendar).
- Table Rows: ID, Name, Phone, Subscription Status, Actions.
- "View More": Daily sessions attended.
- Add Student Modal:
  - Num, Nom, Prénom
  - Default Password (000000 → changeable)
  - Subscription / ma3fi with cause

---

### **Page 3: Teachers**
- Teacher Table: Name, Module, % Share, Subscription Price.
- Add Teacher Form:
  - Name, Number, Percentage, Module, Subscription Price
- Actions: Edit / Delete

---

### **Page 4: Sessions**
- Add Session Form:
  - Select Prof
  - Time
  - Type (sub/free/paid)
  - Price
- Filter: By Prof, Module, Type
- Default View: Today’s Sessions (cards)

---

### **Page 5: Chapters (Admin)**
- Create Chapter (title + icon).
- Chapter Cards with "Add Course" button.
- Add Course Popup:
  - Video link
  - Title & Description
  - Upload PDFs

---

### **Page 6: Check-In**
- QR Code Scanner → Shows student info.
- Teacher Cards:
  - 🟢 Subscribed / 🔴 Not Subscribed
  - Button to pay monthly or per-session
- Search bar: by Prof/Module

---

### **Page 7: Events (Admin)**
- Add Sliders for promotions
- Add Live Events:
  - Teacher
  - Date/Time
  - Join Link

---

## ⚙️ Docker Setup

`docker-compose.yml` (simplified example):

```yaml
version: "3.8"
services:
  laravel:
    build: ./backend
    volumes:
      - ./backend:/var/www
    depends_on:
      - mysql
    environment:
      - DB_HOST=mysql
      - DB_DATABASE=alouaoui_school
      - DB_USERNAME=root
      - DB_PASSWORD=
    networks:
      - app-net

  react:
    build: ./frontend
    ports:
      - "3000:3000"
    networks:
      - app-net

  mysql:
    image: mysql:8
    restart: always
    environment:
      - MYSQL_DATABASE=alouaoui_school
      - MYSQL_ALLOW_EMPTY_PASSWORD=yes
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - app-net

  nginx:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - laravel
      - react
    networks:
      - app-net

volumes:
  db_data:

networks:
  app-net:
