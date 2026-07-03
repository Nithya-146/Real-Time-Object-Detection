# SpectraML: Real-Time Object Detection HUD 

SpectraML is a premium, zero-backend, GPU-accelerated real-time object detection dashboard running directly in your web browser. Using **TensorFlow.js** and the **COCO-SSD** model, it runs machine learning inference locally on your graphics card via WebGL, allowing you to access object tracking and coordinates with zero server latency.

![Project Preview](https://img.shields.io/badge/ML--Inference-WebGL--GPU-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech--Stack-WebRTC%20%7C%20Canvas%20%7C%20JS-blue)
![Backend](https://img.shields.io/badge/Backend-None%20(Client--Side)-orange)

### 🌐 Live Demo: [https://nithya-146.github.io/Real-Time-Object-Detection/](https://nithya-146.github.io/Real-Time-Object-Detection/)

---

## ⚡ Features

- **Local ML Inference**: Loads the pre-trained COCO-SSD model (MobileNetV2 base) directly in the browser.
- **WebRTC Camera Stream**: Scans local media hardware and allows switching between multiple cameras dynamically.
- **Precision Scale Bounding Boxes**: Custom high-tech HUD-style corner bracket reticles draw over detected items. Bounding boxes dynamically rescale to fit video displays on window resize.
- **Interactive Control Deck**:
  - Toggle camera feeds on/off.
  - Pause/Resume AI frame evaluation asynchronously.
  - Interactive confidence threshold slider (0.10 to 1.00) to filter predictions.
- **Live HUD Telemetry**:
  - Live smoothed frame rate (FPS) tracker with speed-coded colors.
  - Target/Detection counter.
  - Real-time list of class detections currently in sight with count summaries.

---

## 🛠️ Technology Stack

1. **TensorFlow.js**: Running inference client-side.
2. **COCO-SSD Model**: Pre-trained object detection model recognizing 80 common daily objects.
3. **HTML5 Canvas**: Handles rendering bounding boxes, glow effects, corner brackets, and labels at 30fps.
4. **WebRTC (`navigator.mediaDevices`)**: Connects secure camera inputs to the video context.
5. **Vanilla CSS**: Clean, responsive layout utilizing glassmorphism cards and custom animations.

---

## 🚀 Getting Started

Web browsers block webcam APIs when files are opened directly from the filesystem (`file:///...`) for security reasons. The app must be served from a secure origin like `localhost` or `127.0.0.1`.

We provide a lightweight, zero-dependency Node.js HTTP server to serve the assets properly.

### Running with Node.js (Recommended)

1. Make sure you have [Node.js](https://nodejs.org/) installed.
2. Open a terminal or shell in the project folder.
3. Run the launch command:
   ```bash
   npm start
   ```
4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
5. Click **Start Camera** and grant permissions when prompted by your browser!

### Running with Python (Alternative)

If you don't want to use Node.js, you can serve the directory using Python:
- For Python 3.x:
  ```bash
  python -m http.server 3000
  ```
- Open `http://localhost:3000` in your web browser.
