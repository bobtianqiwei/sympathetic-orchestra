# Sympathetic Orchestra

An interactive web-based orchestra controlled by hand gestures, developed by Bob Tianqi Wei, Shm Garanganao Almeda, Ethan Tam, Dor Abrahamson and Bjoern Hartmann at UC Berkeley, 2024.

## Overview

Sympathetic Orchestra is a gesture-controlled music application that allows users to conduct a virtual orchestra using hand gestures detected through their webcam. The application uses MediaPipe for hand recognition and gesture detection, p5.js for visualization and audio playback, and Node.js/Express for the web server.

## Features

- **Hand Gesture Recognition**: Control the orchestra using hand gestures detected via webcam
- **Interactive Orchestra**: Multiple instruments that can be controlled individually
- **Real-time Visualization**: Visual feedback synchronized with audio playback
- **Camera Preview**: Optional camera preview to see your gestures
- **Volume Controls**: Adjustable volume sliders for each instrument

## Prerequisites

- Node.js (v16.15.0 or higher recommended)
- npm (v8.10.0 or higher recommended)
- A modern web browser with webcam support (Chrome, Firefox, Safari, Edge)
- Webcam for gesture recognition

## Installation

1. **Clone this repository** to your computer:
   ```bash
   git clone <repository-url>
   cd sympathetic-orchestra
   ```

2. **Check Node.js and npm installation**:
   ```bash
   node -v
   npm -v
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install:
   - `express` - Web server framework
   - `body-parser` - Middleware for parsing request bodies

## Running the Application

1. **Start the server**:
   ```bash
   node App.js
   ```

   You should see the message:
   ```
   Server is running on http://localhost:8000
   ```

2. **Open your web browser** and navigate to:
   ```
   http://localhost:8000/
   ```

3. **Enable the camera** by clicking the "Enable Camera" button to start gesture recognition.

## Available Routes

- **`http://localhost:8000/`** - Main Sympathetic Orchestra application
- **`http://localhost:8000/player`** - Standalone player interface
- **`http://localhost:8000/hands`** - Hand recognition test/demo page

## Project Structure

```
sympathetic-orchestra/
│   README.md
│   App.js                    # Main Express server file
│   package.json              # Node.js dependencies
│
├── public/                   # Web content directory
│   │   index.html            # Main application page
│   │   mySketch.js           # p5.js sketch (visualization & audio)
│   │   recognize_hands.js    # MediaPipe hand gesture recognition
│   │   hands_test.html       # Hand recognition test page
│   │
│   ├── player/               # Standalone player interface
│   │   ├── index.html
│   │   ├── sketch.js
│   │   └── soundfiles/       # Full-length audio files
│   │
│   ├── shorter_soundfiles/   # Shorter audio clips for main app
│   │   └── [instrument].mp3
│   │
│   └── css/
│       └── styles.css        # CSS stylesheet
│
└── app:shared:models/        # MediaPipe model files
    ├── gesture_recognizer.task
    └── hand_landmarker.task
```

## Usage

1. **Enable Camera**: Click "Enable Camera" to start webcam access and gesture recognition
2. **Camera Preview**: Toggle "Camera Preview" to show/hide the webcam feed
3. **Show Sliders**: Click "Show Sliders" to access volume controls for each instrument
4. **Play/Pause**: Use the "Play" button to start or pause the orchestra
5. **Gesture Control**: Use hand gestures to control the orchestra (see gesture recognition documentation)

## Technologies Used

- **Node.js** - Server runtime
- **Express** - Web server framework
- **p5.js** - Creative coding library for visualization and audio
- **MediaPipe** - Hand gesture recognition and tracking
- **HTML5/CSS3** - Frontend structure and styling

## Troubleshooting

- **Error: Cannot find module 'express'** - Run `npm install` to install dependencies
- **Camera not working** - Ensure you've granted camera permissions in your browser
- **Audio not playing** - Check browser audio permissions and ensure sound files are loaded
- **Server port already in use** - Change the port in `App.js` (line 25) if port 8000 is occupied

## Development

To modify the application:

- **HTML/CSS**: Edit files in the `public/` directory
- **Server routes**: Modify `App.js` to add new routes or change server behavior
- **Visualization**: Edit `public/mySketch.js` for p5.js canvas and audio logic
- **Gesture recognition**: Edit `public/recognize_hands.js` for hand tracking behavior

## License

ISC

## Credits

- **Developers**: Bob Tianqi Wei, Shm Garanganao Almeda, Ethan Tam, Dor Abrahamson, Bjoern Hartmann
- **Institution**: UC Berkeley, 2024
- **Original Processing Version**: `Original_Sympathetic_Orchestra.pde`

## References

- [Express.js Documentation](https://expressjs.com/)
- [p5.js Documentation](https://p5js.org/)
- [MediaPipe Documentation](https://developers.google.com/mediapipe)
- [Node.js Documentation](https://nodejs.org/)
