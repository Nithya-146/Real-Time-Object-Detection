// SpectraML App State
let model = null;
let stream = null;
let isDetecting = false;
let isModelLoading = true;
let animationFrameId = null;

// Sliders and settings
let confidenceThreshold = 0.60;
let lastFrameTime = performance.now();
let fpsArray = [];

// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvasOverlay');
const ctx = canvas.getContext('2d');

const modelStatus = document.getElementById('modelStatus');
const modelStatusText = modelStatus.querySelector('.status-text');
const cameraSelect = document.getElementById('cameraSelect');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');

const toggleCamBtn = document.getElementById('toggleCamBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const retryPermissionBtn = document.getElementById('retryPermissionBtn');

const fpsCounter = document.getElementById('fpsCounter');
const detectionCount = document.getElementById('detectionCount');
const classList = document.getElementById('classList');

const loadingOverlay = document.getElementById('loadingOverlay');
const errorOverlay = document.getElementById('errorOverlay');
const feedResolution = document.getElementById('feedResolution');

// Color mapping for neon HUD drawing
const CLASS_COLORS = {
  'person': '#d946ef',         // Neon Fuchsia
  // Vehicles
  'bicycle': '#06b6d4',        // Cyan
  'car': '#06b6d4',
  'motorcycle': '#06b6d4',
  'airplane': '#06b6d4',
  'bus': '#06b6d4',
  'train': '#06b6d4',
  'truck': '#06b6d4',
  // Animals
  'bird': '#eab308',           // Gold
  'cat': '#eab308',
  'dog': '#eab308',
  'horse': '#eab308',
  'sheep': '#eab308',
  'cow': '#eab308',
  'elephant': '#eab308',
  'bear': '#eab308',
  'zebra': '#eab308',
  'giraffe': '#eab308',
  // Electronics
  'backpack': '#a855f7',       // Purple/Violet for accessories
  'umbrella': '#a855f7',
  'handbag': '#a855f7',
  'tie': '#a855f7',
  'suitcase': '#a855f7',
  // Electronics & Office
  'frisbee': '#8b5cf6',
  'skis': '#8b5cf6',
  'snowboard': '#8b5cf6',
  'sports ball': '#8b5cf6',
  'kite': '#8b5cf6',
  'baseball bat': '#8b5cf6',
  'baseball glove': '#8b5cf6',
  'skateboard': '#8b5cf6',
  'surfboard': '#8b5cf6',
  'tennis racket': '#8b5cf6',
  'bottle': '#39ff14',         // Emerald Green for household/electronics
  'wine glass': '#39ff14',
  'cup': '#39ff14',
  'fork': '#39ff14',
  'knife': '#39ff14',
  'spoon': '#39ff14',
  'bowl': '#39ff14',
  'banana': '#eab308',
  'apple': '#eab308',
  'sandwich': '#eab308',
  'orange': '#eab308',
  'broccoli': '#eab308',
  'carrot': '#eab308',
  'hot dog': '#eab308',
  'pizza': '#eab308',
  'donut': '#eab308',
  'cake': '#eab308',
  'chair': '#8b5cf6',
  'couch': '#8b5cf6',
  'potted plant': '#8b5cf6',
  'bed': '#8b5cf6',
  'dining table': '#8b5cf6',
  'toilet': '#8b5cf6',
  'tv': '#39ff14',             // Emerald for tech
  'laptop': '#39ff14',
  'mouse': '#39ff14',
  'remote': '#39ff14',
  'keyboard': '#39ff14',
  'cell phone': '#39ff14',
  'microwave': '#39ff14',
  'oven': '#39ff14',
  'toaster': '#39ff14',
  'sink': '#39ff14',
  'refrigerator': '#39ff14',
  'book': '#a855f7',
  'clock': '#39ff14',
  'vase': '#8b5cf6',
  'scissors': '#39ff14',
  'teddy bear': '#eab308',
  'hair drier': '#39ff14',
  'toothbrush': '#39ff14'
};

function getColorForClass(className) {
  return CLASS_COLORS[className] || '#8b5cf6'; // fallback to violet
}

// Convert Hex to RGBA with specific opacity
function hexToRgba(hex, alpha) {
  let r = 0, g = 0, b = 0;
  // Handle shorthand (e.g. #3ff)
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Initialize Application
async function init() {
  updateLoadingMsg("Loading Neural Network (COCO-SSD)...");
  
  try {
    // Load model using cocoSsd global
    model = await cocoSsd.load();
    isModelLoading = false;
    
    // Update model status UI
    modelStatus.className = 'status-badge status-ready';
    modelStatusText.textContent = 'READY';
    
    // Scan cameras
    await enumerateCameras();
    
    // Enable Camera buttons & selection
    toggleCamBtn.removeAttribute('disabled');
    
    // Automatically trigger camera start to speed up onboarding
    startWebcam();
  } catch (err) {
    console.error("Initialization failed:", err);
    updateLoadingMsg("Model failed to load. Check console.");
  }
}

// Enumerate local webcam inputs
async function enumerateCameras() {
  try {
    // We request temporary permission first to ensure label discovery succeeds
    await navigator.mediaDevices.getUserMedia({ video: true });
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    cameraSelect.innerHTML = '';
    
    if (videoDevices.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No webcams found';
      cameraSelect.appendChild(opt);
      cameraSelect.setAttribute('disabled', 'true');
      return;
    }
    
    videoDevices.forEach((device, index) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(opt);
    });
    
    cameraSelect.removeAttribute('disabled');
    cameraSelect.addEventListener('change', handleCameraChange);
  } catch (err) {
    console.warn("Could not fully enumerate devices (permission delay):", err);
    // Add default fallbacks if permission is blocked initially
    cameraSelect.innerHTML = '<option value="">Default System Camera</option>';
  }
}

// Start webcam stream
async function startWebcam() {
  stopWebcam();
  
  updateLoadingMsg("Connecting to Camera Feed...");
  loadingOverlay.classList.add('active');
  errorOverlay.classList.remove('active');
  
  const deviceId = cameraSelect.value;
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
    audio: false
  };
  
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    // Listen for metadata to properly size the video dimensions
    video.onloadedmetadata = () => {
      video.play();
      resizeCanvas();
      loadingOverlay.classList.remove('active');
      
      // Update toggle button state
      toggleCamBtn.innerHTML = '<i class="fa-solid fa-square"></i> <span>Stop Camera</span>';
      toggleCamBtn.classList.remove('btn-primary');
      toggleCamBtn.classList.add('btn-secondary');
      
      // Enable pause/resume control
      pauseResumeBtn.removeAttribute('disabled');
      isDetecting = true;
      lastFrameTime = performance.now();
      
      // Start processing loop
      if (!animationFrameId) {
        processFrame();
      }
    };
  } catch (err) {
    console.error("Camera access error:", err);
    loadingOverlay.classList.remove('active');
    errorOverlay.classList.add('active');
    
    document.getElementById('errorMsg').textContent = 
      err.name === 'NotAllowedError' 
      ? 'Permission denied. Please grant webcam permissions in your address bar.'
      : `Failed to acquire video stream: ${err.message}`;
  }
}

// Stop webcam stream
function stopWebcam() {
  isDetecting = false;
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset buttons
  toggleCamBtn.innerHTML = '<i class="fa-solid fa-video"></i> <span>Start Camera</span>';
  toggleCamBtn.classList.add('btn-primary');
  toggleCamBtn.classList.remove('btn-secondary');
  
  pauseResumeBtn.setAttribute('disabled', 'true');
  pauseResumeBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause AI</span>';
  
  feedResolution.textContent = '0 x 0';
  fpsCounter.textContent = '0';
  fpsCounter.className = 'stat-value text-yellow';
  detectionCount.textContent = '0';
  
  resetClassList("Camera stream stopped.");
}

// Handle Camera Input change
function handleCameraChange() {
  if (stream) {
    startWebcam();
  }
}

// Update UI Loading text
function updateLoadingMsg(msg) {
  document.getElementById('loadingMsg').textContent = msg;
}

// Dynamically size canvas overlays based on viewport scales
function resizeCanvas() {
  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;
  
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  
  if (video.videoWidth) {
    feedResolution.textContent = `${video.videoWidth} x ${video.videoHeight}`;
  }
}

// Frame Processing and Object Detection Loop
async function processFrame() {
  if (!isDetecting || isModelLoading) {
    animationFrameId = requestAnimationFrame(processFrame);
    return;
  }
  
  // Calculate FPS (smoothed over last 30 frames)
  const now = performance.now();
  const delta = now - lastFrameTime;
  lastFrameTime = now;
  
  const currentFps = 1000 / delta;
  fpsArray.push(currentFps);
  if (fpsArray.length > 30) fpsArray.shift();
  
  const avgFps = Math.round(fpsArray.reduce((sum, f) => sum + f, 0) / fpsArray.length);
  fpsCounter.textContent = avgFps;
  
  // Style FPS based on speed
  if (avgFps >= 24) {
    fpsCounter.className = 'stat-value text-green';
  } else if (avgFps >= 15) {
    fpsCounter.className = 'stat-value text-yellow';
  } else {
    fpsCounter.className = 'stat-value text-red';
  }

  // Ensure video is playing and has frames before inferring
  if (video.readyState === video.HAVE_ENOUGH_DATA && model) {
    try {
      // Run TensorFlow detection
      const predictions = await model.detect(video);
      
      // Make sure overlay dimensions align
      resizeCanvas();
      
      // Filter predictions based on UI slider threshold
      const filteredPredictions = predictions.filter(pred => pred.score >= confidenceThreshold);
      
      // Update Stats & Canvas overlay
      detectionCount.textContent = filteredPredictions.length;
      drawOverlay(filteredPredictions);
      updateClassList(filteredPredictions);
      
    } catch (err) {
      console.error("Inference Error:", err);
    }
  }
  
  animationFrameId = requestAnimationFrame(processFrame);
}

// Draw Bounding Boxes and HUD corner brackets
function drawOverlay(predictions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (video.videoWidth === 0 || video.videoHeight === 0) return;
  
  // Map raw model coordinates back to the canvas scales
  const scaleX = canvas.width / video.videoWidth;
  const scaleY = canvas.height / video.videoHeight;
  
  predictions.forEach(prediction => {
    const [x, y, width, height] = prediction.bbox;
    
    // Scale box parameters
    const drawX = x * scaleX;
    const drawY = y * scaleY;
    const drawWidth = width * scaleX;
    const drawHeight = height * scaleY;
    
    const label = prediction.class;
    const score = prediction.score;
    const color = getColorForClass(label);
    
    drawHUDBox(drawX, drawY, drawWidth, drawHeight, label, score, color);
  });
}

// Draw a custom sci-fi HUD bounding box
function drawHUDBox(x, y, w, h, label, score, color) {
  // 1. Draw solid, semi-transparent backing fill
  ctx.fillStyle = hexToRgba(color, 0.08);
  ctx.fillRect(x, y, w, h);
  
  // 2. Draw thin boundary box outline
  ctx.strokeStyle = hexToRgba(color, 0.25);
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  
  // 3. Draw heavy corner reticle brackets
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  
  // Calculate relative corner bracket length
  const bracketLen = Math.min(18, w * 0.15, h * 0.15);
  
  // Top-Left corner
  ctx.beginPath();
  ctx.moveTo(x + bracketLen, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + bracketLen);
  ctx.stroke();
  
  // Top-Right corner
  ctx.beginPath();
  ctx.moveTo(x + w - bracketLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + bracketLen);
  ctx.stroke();
  
  // Bottom-Left corner
  ctx.beginPath();
  ctx.moveTo(x, y + h - bracketLen);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + bracketLen, y + h);
  ctx.stroke();
  
  // Bottom-Right corner
  ctx.beginPath();
  ctx.moveTo(x + w - bracketLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - bracketLen);
  ctx.stroke();
  
  // 4. Draw Label Badge
  ctx.font = '500 12px "Space Grotesk", sans-serif';
  const displayLabel = `${label.toUpperCase()} [${Math.round(score * 100)}%]`;
  const textMetrics = ctx.measureText(displayLabel);
  const textWidth = textMetrics.width;
  const badgeHeight = 22;
  const badgeWidth = textWidth + 16;
  
  // Shift tag below the top edge if the target matches the canvas top boundary
  const badgeY = y - badgeHeight >= 0 ? y - badgeHeight : y;
  const badgeX = x;
  
  // Badge background
  ctx.fillStyle = color;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4);
  ctx.fill();
  
  // Text content
  ctx.fillStyle = '#060814'; // high contrast dark color for text
  ctx.fillText(displayLabel, badgeX + 8, badgeY + 15);
}

// Rounded rectangle helper path
function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

// Update the list of active objects in sidebar
function updateClassList(predictions) {
  // Aggregate predictions count
  const classCounts = {};
  predictions.forEach(pred => {
    const key = pred.class;
    classCounts[key] = (classCounts[key] || 0) + 1;
  });
  
  const sortedClasses = Object.keys(classCounts).sort();
  
  if (sortedClasses.length === 0) {
    resetClassList("No objects in sight.");
    return;
  }
  
  classList.innerHTML = '';
  sortedClasses.forEach(className => {
    const count = classCounts[className];
    const color = getColorForClass(className);
    
    const li = document.createElement('li');
    li.className = 'class-item';
    
    li.innerHTML = `
      <div class="class-item-name">
        <span class="class-badge-dot" style="background-color: ${color}; box-shadow: 0 0 6px ${color}"></span>
        <span>${className.charAt(0).toUpperCase() + className.slice(1)}</span>
      </div>
      <span class="class-item-count">${count}</span>
    `;
    
    classList.appendChild(li);
  });
}

function resetClassList(message) {
  classList.innerHTML = `<li class="empty-list-msg">${message}</li>`;
}

// UI Event Handlers
toggleCamBtn.addEventListener('click', () => {
  if (stream) {
    stopWebcam();
  } else {
    startWebcam();
  }
});

pauseResumeBtn.addEventListener('click', () => {
  if (isDetecting) {
    isDetecting = false;
    pauseResumeBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Resume AI</span>';
    modelStatus.className = 'status-badge status-paused';
    modelStatusText.textContent = 'PAUSED';
  } else {
    isDetecting = true;
    lastFrameTime = performance.now();
    pauseResumeBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause AI</span>';
    modelStatus.className = 'status-badge status-ready';
    modelStatusText.textContent = 'READY';
  }
});

thresholdSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  confidenceThreshold = val / 100;
  thresholdValue.textContent = `${val}%`;
});

retryPermissionBtn.addEventListener('click', () => {
  startWebcam();
});

// Run Init on Page Load
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', resizeCanvas);
