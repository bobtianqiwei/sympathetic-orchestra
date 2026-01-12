//Sympathetic Orchestra 
//by Bob Tianqi Wei, Shm Garanganao Almeda, Ethan Tam, Dor Abrahamson and Bjoern Hartmann
//UC Berkeley, 2024

// This is the code for the hand gesture recognition model.

import {
  GestureRecognizer,
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

window.sharedData = {
  leftHandCursorX: 0,
  leftHandCursorY: 0,
  rightHandCursorX: 0,
  rightHandCursorY: 0,
  leftGestureData: {
    gestureName: "",
    gestureScore: 0,
    handedness: ""
  },
  rightGestureData: {
    gestureName: "",
    gestureScore: 0,
    handedness: ""
  }
};

document.addEventListener("DOMContentLoaded", () => {
  let gestureRecognizer;
  let handLandmarker;
  let webcamRunning = false;
  // I think that setting this to the same size as the p5js canvas makes the tracking better...
  const videoHeight = "1440px";
  const videoWidth = "900px";

  const video = document.getElementById("webcam");
  const enableCameraButton = document.getElementById("enableCameraButton");
  const cameraPreviewButton = document.getElementById("cameraPreviewButton");
  const videoContainer = document.getElementById("videoContainer");
  let cameraPreviewVisible = false;

  // Initialize the gesture recognizer
  const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      numHands: 2,
      runningMode: "VIDEO"
    });
    // Enable button when models are loaded
    if (gestureRecognizer && handLandmarker) {
      enableCameraButton.innerText = "Enable Camera";
      enableCameraButton.disabled = false;
    }
  };
  createGestureRecognizer();

  // Initialize the hand landmarker
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
    // Enable button when models are loaded
    if (gestureRecognizer && handLandmarker) {
      enableCameraButton.innerText = "Enable Camera";
      enableCameraButton.disabled = false;
    }
  };
  createHandLandmarker();
  
  // Camera Preview toggle functionality
  cameraPreviewButton.addEventListener("click", () => {
    cameraPreviewVisible = !cameraPreviewVisible;
    if (cameraPreviewVisible) {
      videoContainer.classList.add("visible");
      cameraPreviewButton.innerText = "Hide Preview";
    } else {
      videoContainer.classList.remove("visible");
      cameraPreviewButton.innerText = "Camera Preview";
    }
  });

  // Webcam functionality
  const hasGetUserMedia = () =>
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const enableCam = async () => {
    if (!gestureRecognizer || !handLandmarker) {
      console.log("Models are still loading, please wait...");
      enableCameraButton.innerText = "Loading Models...";
      enableCameraButton.disabled = true;
      return;
    }

    if (webcamRunning) {
      webcamRunning = false;
      enableCameraButton.innerText = "Enable Camera";
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    } else {
      webcamRunning = true;
      enableCameraButton.innerText = "Disable Camera";

      const constraints = {
        video: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      
      // Adjust video size based on actual camera dimensions
      video.addEventListener("loadedmetadata", () => {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const targetWidth = 250;
        const aspectRatio = videoHeight / videoWidth;
        const targetHeight = Math.round(targetWidth * aspectRatio);
        
        video.style.width = targetWidth + 'px';
        video.style.height = targetHeight + 'px';
      });
      
      video.addEventListener("loadeddata", predictWebcam);
    }
  };

  enableCameraButton.addEventListener("click", enableCam);

  let lastVideoTime = -1;
  let results = undefined;

  const predictWebcam = async () => {
    if (!webcamRunning) return;

    const nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      results = gestureRecognizer.recognizeForVideo(video, nowInMs);
      const handLandmarkerResults = await handLandmarker.detectForVideo(
        video,
        nowInMs
      );

      if (handLandmarkerResults.landmarks && handLandmarkerResults.landmarks.length > 0) {
        handLandmarkerResults.landmarks.forEach((landmarks, index) => {

          const eighthLandmark = landmarks[8];
          if (handLandmarkerResults.handednesses[index][0].categoryName === "Right") {
            window.sharedData.leftHandCursorX = eighthLandmark.x;
            window.sharedData.leftHandCursorY = eighthLandmark.y;
          } else {
            window.sharedData.rightHandCursorX = eighthLandmark.x;
            window.sharedData.rightHandCursorY = eighthLandmark.y;
          }
        });
      }
      //console.log(results);

      if (results.gestures.length > 0) {
        results.gestures.forEach((gesture, index) => {
          const categoryName = gesture[0].categoryName;
          const categoryScore = parseFloat(
            gesture[0].score * 100
          ).toFixed(2);
          const handedness = results.handednesses[index][0].displayName;
          
          // Gesture output element removed - no longer displaying gesture info on screen

          if (handedness == "Right") {
            window.sharedData.leftGestureData.gestureName = categoryName;
            window.sharedData.leftGestureData.gestureScore = categoryScore;
            window.sharedData.leftGestureData.handedness = handedness;
          } else if (handedness=="Left") {
            window.sharedData.rightGestureData.gestureName = categoryName;
            window.sharedData.rightGestureData.gestureScore = categoryScore;
            window.sharedData.rightGestureData.handedness = handedness;
          }
        });
      }
    }

    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  };
});

