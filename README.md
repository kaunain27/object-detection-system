#  Object Detection System

A real-time **Object Detection System** built using Python, Deep Learning, and Web Technologies.  
This project detects and localizes multiple objects in images, videos, and live webcam streams using modern computer vision techniques.

---

##  Overview

Object detection is a fundamental task in computer vision that identifies objects and determines their locations in visual data.

This system leverages deep learning models such as YOLO to achieve:
- High accuracy
- Real-time detection
- Scalable deployment

It is designed as a **full-stack application** with a frontend, backend, and AI-powered detection engine.

---

## Features

- Secure User Authentication (JWT-based)
- Image, Video & Webcam Object Detection
- Real-time detection (20–30 FPS)
- High accuracy (>90% expected)
- Bounding box visualization with labels
- Web-based interface (React)
- Cloud-ready scalable architecture
- Continuous Learning capability (model updates over time)

---

##  Tech Stack

### Frontend
- React.js
- HTML5, CSS3, JavaScript

###  Backend
- FastAPI / Flask
- REST APIs

###  AI & Computer Vision
- Python
- OpenCV
- NumPy
- PyTorch
- YOLOv8 (Ultralytics)

### Database
- PostgreSQL

###  Security
- JWT Authentication
- Bcrypt Password Hashing

---

## System Architecture

The system follows a **modular client-server architecture**:

Frontend (React)  
⬇  
Backend API (FastAPI/Flask)  
⬇  
Object Detection Model (YOLO)  
⬇  
Database (PostgreSQL)

---

## Object Detection Pipeline

1. Input (Image / Video / Webcam)
2. Preprocessing
   - Resize (640x640)
   - Normalize
3. Model Inference (YOLO)
4. Post-processing
   - Confidence Thresholding
   - Non-Maximum Suppression (NMS)
5. Output (Bounding Boxes + Labels)

---

## Continuous Learning

Unlike static models, this system supports **continuous learning**:

- Collects new detection data
- Identifies misdetections
- Retrains model periodically
- Improves performance over time

 Handles real-world issues like:
- Lighting changes
- New object types
- Camera variations

---

 Dataset

- COCO Dataset (benchmark dataset)
- Custom dataset (real-world images)

Preprocessing Steps:
- Data cleaning
- Image resizing (640×640)
- Normalization
- Data augmentation (flip, rotate, brightness)
- Annotation formatting (YOLO format)
