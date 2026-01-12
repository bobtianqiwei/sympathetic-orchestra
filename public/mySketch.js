// Sympathetic Orchestra 
// by Bob Tianqi Wei, Shm Garanganao Almeda, Ethan Tam, Dor Abrahamson and Bjoern Hartmann
// UC Berkeley, 2024

// This is the main file for the Sympathetic Orchestra project.

// Debug flag: set to false in production to disable console logs
const DEBUG = false;

let sound;
let amp;

let sounds = {};
let sliders = {}; // the sliders
let labels = {}; // labels for the sliders
let allLoaded = false;
let masterVolumeSlider;
let isPaused = true;
let firstTimePlaying = true

let cursorX = 0;
let cursorY = 0;

let hideSlidersButton;
let showSlidersButton;

/* Preload sound files */
function preload() {
  for (let i = 0; i < texts.length; i++) {
    let instrument = texts[i];
    sounds[instrument] = loadSound('shorter_soundfiles/' + instrument + '.mp3', soundLoaded);
    
    // Add an event listener for when the sound ends
    sounds[instrument].onended(() => soundEnded(i));
  }
}

// soundEnded callback function
function soundEnded(index) {
  colors[index][0] = 255; // Reset the color to white
  colors[index][1] = 255;
  colors[index][2] = 255;
}

function soundLoaded() {
  let loadedCount = 0;
  for (let instrument in sounds) {
    if (sounds[instrument].isLoaded()) {
      loadedCount++;
    }
  }
  
  // Update loading progress
  const progress = (loadedCount / texts.length) * 100;
  updateLoadingProgress(progress);
  
  if (loadedCount === texts.length) {
    allLoaded = true;
    if (DEBUG) console.log("All sounds loaded successfully");
    // Hide loading screen after a short delay
    setTimeout(() => {
      hideLoadingScreen();
    }, 300);
  }
}

// Update loading progress bar
function updateLoadingProgress(percent) {
  const progressBar = document.getElementById('loadingProgressBar');
  if (progressBar) {
    progressBar.style.width = percent + '%';
  }
}

// Hide loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

/* Modify the basic parameters. */
const n_parts = 18;
const n_grid_X = 16, n_grid_Y = 7;
const sizeX = 1565, sizeY = 1000;
let globalX = 50, globalY = 50; // Will be calculated to center the grid 

/* Defining the objects and arrays according to the basic parameters above. 
   No need to modify! */
let soundfilePtr = [];
let ampPtr = [];
let unitAttributes = Array.from({ length: n_parts }, () => Array(4).fill(0));
let textAttributes = Array.from({ length: n_parts }, () => Array(2).fill(0));
let colors = Array.from({ length: n_parts }, () => Array(3).fill(0));
let selectedUnits = Array(n_parts).fill(false); // Track which units are selected
let ampvalue = Array(n_parts).fill(0); // The actual values of the output of the soundtracks. 
let ampVals = Array(n_parts).fill(0); // The input values to correct the volume of the soundtracks. 
let ampValCoef = 1;

// Grid unit size: 70px × 70px (50px small square + 20px gap)
const unitX = 70;
const unitY = 70;
// Small square size: 50px × 50px
const smallSquareSize = 50;
// Small square corner radius: 25px (maximum, makes it circular)
const smallRectRad = 25;
// Big square margin from small squares: 5px
const bigSquareMargin = 5;
// Big square corner radius: 30px (25 + 5)
const bigRectRad = 30;
// Small square offset to center in grid: (70 - 50) / 2 = 10px
const smallSquareOffset = (unitX - smallSquareSize) / 2; 

let playTime = 0;
let lastTime;

let lookupTable = Array.from({ length: n_grid_Y + 1 }, () => Array(n_grid_X + 1).fill(0));

let states = [0, 0];

/* Parameters related to analyzing user inputs. */ 
let minY = 0;
let maxY = sizeY;
let minX = 0;
let maxX = sizeX;
const grabThreshold = 0.8;
const releaseThreshold = 0;
const lowVoiceVal = 0.01;
let isPlaying = false;

const gestures = [];
let numGestures = gestures.length;
let cur = 0;
const totalTime = 164000; // Modify according to the duration of the LONGEST soundtrack. 
let gestureFlags = Array(n_parts).fill(0);

/* Defining the GUI. */
let units = [[2, 5, 1, 2, 255],
             [2, 7, 1, 2, 255],
             [2, 9, 1, 2, 255],
             [2, 11, 1, 2, 255],
             [0, 8, 1, 4, 255], 
             [1, 8, 1, 2, 255], 
             [1, 10, 1, 2, 255],
             [1, 12, 1, 1, 255],
             [0, 6, 2, 2, 255],
             [0, 4, 2, 2, 255],
             [1, 3, 2, 1, 255],
             [5, 0, 2, 7, 255],
             [3, 1, 2, 6, 255],
             [3, 7, 2, 4, 255],
             [5, 9, 2, 7, 255],
             [3, 11, 2, 4, 255],
             [2, 4, 1, 1, 255],
             [5, 7, 2, 2, 100]
            ];
// units: {Vertical Axis, Horizontal Axis, Vertical Length, Horizontal Axis, Color(0-255, Gray)}
const texts = ["Flute",
               "Oboe",
               "Clarinet",
               "Bassoon",
               "French Horns",
               "Trumpets",
               "Trombones",
               "Tuba",
               "Timpani",
               "Percussion",
               "Piano",
               "Violin 1",
               "Violin 2",
               "Viola",
               "Cello",
               "Bass",
               "Harp",
               "Conductor"
              ];
// Must ensure: texts.length == units.length
const muted = [false,
               false,
               false,
               false,
               false,
               false,
               false,
               false,
               false,
               true,
               false,
               false,
               false,
               false,
               false,
               false,
               true,
               true,
              ];

/* Function to draw the GUI. */
function deriveAttributes() { //draws the orchestra gui
  // Called only in preprocessing. 
  for (let i = units.length - 1; i > -1; --i) {
    // Big square position: grid position + small square offset - margin
    unitAttributes[i][0] = globalX + units[i][1] * unitX + smallSquareOffset - bigSquareMargin;
    unitAttributes[i][1] = globalY + units[i][0] * unitY + smallSquareOffset - bigSquareMargin;
    // Big square size: grid size - 2 * margin
    unitAttributes[i][2] = units[i][3] * unitX - 2 * bigSquareMargin;
    unitAttributes[i][3] = units[i][2] * unitY - 2 * bigSquareMargin;
    // Text position: center of big square (will be used with textAlign)
    textAttributes[i][0] = unitAttributes[i][0] + unitAttributes[i][2] / 2;
    textAttributes[i][1] = unitAttributes[i][1] + unitAttributes[i][3] / 2;
    colors[i][0] = (units[i][4] < 128) ? 255 : 0;
    colors[i][1] = colors[i][0];
    colors[i][2] = colors[i][0];
  }
};

function _deriveColors() {
  for (let i = units.length - 1; i > -1; --i) {
    let instrument = texts[i];
    // *4 to make the color more vibrant
    let enhancedValue = ampvalue[instrument] * 4;
    colors[i][0] = int(_normalize(enhancedValue, 0, 1, 255, 0));
    colors[i][1] = int(_normalize(enhancedValue, 0, 1, 255, 0));
    colors[i][2] = int(_normalize(enhancedValue, 0, 1, 255, 0));
  }
}


function drawParts() {
  noStroke();
  _deriveColors();
	
  for (let i = units.length - 1; i > -1; --i) {
    // Big Units. 
    if (units[i][4] === -1) fill(150, 200, 175);
    else if (gestureFlags[i] === 0) fill(255, 90, 90);
    else if (selectedUnits[i]) fill(169, 213, 175); // Green for selected (#a9d5af)
    else fill(units[i][4], units[i][4], units[i][4]);
    rect(unitAttributes[i][0], unitAttributes[i][1], unitAttributes[i][2], unitAttributes[i][3], bigRectRad);
    
    // Small units. 
    if (i !== 17) {
      fill(colors[i][0], colors[i][1], colors[i][2]);
      for (let j = units[i][2] - 1; j > -1; --j) {
        for (let k = units[i][3] - 1; k > -1; --k) {
          // Small square position: grid position + offset to center
          let smallX = globalX + (units[i][1] + k) * unitX + smallSquareOffset;
          let smallY = globalY + (units[i][0] + j) * unitY + smallSquareOffset;
          rect(smallX, smallY, smallSquareSize, smallSquareSize, smallRectRad);
        }
      }
    }
    
    // Text for the GUI (centered in the rounded rectangles)
    let c = (units[i][4] < 128) ? 255 : 0;
    fill(c, c, c);
    textAlign(CENTER, CENTER);
    textSize(15);
    textFont('Manrope');
    textStyle(NORMAL);
    
    // Draw text with white stroke outline (stroke behind text)
    push();
    drawingContext.textAlign = 'center';
    drawingContext.textBaseline = 'middle';
    drawingContext.font = 'normal 15px Manrope';
    // Draw stroke first (behind) - skip for Conductor
    if (texts[i] !== 'Conductor') {
      drawingContext.strokeStyle = 'rgb(255, 255, 255)';
      drawingContext.lineWidth = 2;
      drawingContext.strokeText(texts[i], textAttributes[i][0], textAttributes[i][1]);
    }
    // Draw fill text on top (in front)
    drawingContext.fillStyle = `rgb(${c}, ${c}, ${c})`;
    drawingContext.fillText(texts[i], textAttributes[i][0], textAttributes[i][1]);
    pop();
  }
};

/* Functions controlling the soundtracks. */
function playAll() {
  // Start Playing all soundtracks.
  if (isPlaying || playTime > totalTime) return;
  
  for (let i = soundfilePtr.length - 1; i > -1; --i) {
    if (!muted[i]) soundfilePtr[i].play();
  }
  isPlaying = true;
};

function pauseAll() {
  // Pause all soundtracks.
  if (!isPlaying || playTime > totalTime) return;
  for (let i = soundfilePtr.length - 1; i > -1; --i) {
    if (!muted[i]) soundfilePtr[i].pause();
  }
  isPlaying = false;
};

function setAmp(lowerVoice) {
  // Update the amplitudes for all soundtracks.
  if (lowerVoice) {
    for (let i = units.length - 1; i > -1; --i) {
      if (i === 10) soundfilePtr[i].amp(1); 
      else soundfilePtr[i].amp(lowVoiceVal);
    }
  } else {
    for (let i = units.length - 1; i > -1; --i) {
      if (i === 10) soundfilePtr[i].amp(1);
      else soundfilePtr[i].amp(gestureFlags[i] === 1 ? ampVals[i] * ampValCoef : lowVoiceVal);
    }
  }
};

function _updateAmpVal() {
  for (let i = 0; i < texts.length; i++) {
    let instrument = texts[i];
    //console.log(texts[i] + ": " + ampPtr[instrument].getLevel());
    ampvalue[instrument] = ampPtr[instrument].getLevel();
  }
}

function hideMasterVolumeSlider() {
  // Handled by card visibility
}

function showMasterVolumeSlider() {
  // Handled by card visibility
}

function hideInstrumentSliders() {
  const slidersCard = document.getElementById('slidersCard');
  if (slidersCard) {
    slidersCard.classList.remove('visible');
  }
}

function showInstrumentSliders() {
  const slidersCard = document.getElementById('slidersCard');
  if (slidersCard) {
    slidersCard.classList.add('visible');
  }
}


/* Functions recording time. */
function updateTime() {
  let curTime = millis();
  let timeElapsed = curTime - lastTime;
  //console.log("curTime" + curTime + " timeElapsed " + timeElapsed + " last time: " + lastTime)
  lastTime = curTime;
  if (isPlaying) playTime += timeElapsed;
}

function renewGestureFlags() {
  if (cur === numGestures) return;
  if (playTime > gestures[cur][0]) {
    gestureFlags[int(gestures[cur++][1])] = 0;
  }
}

/* Auxiliary Functions. */
function _normalize(x, inf, sup, target_inf, target_sup) {
  return (x - inf) * (target_sup - target_inf) / (sup - inf) + target_inf;
};

function deriveLookupTable() {
  for (let i = lookupTable.length - 1; i > -1; --i) {
    for (let j = lookupTable[0].length - 1; j > -1; --j) {
      lookupTable[i][j] = -1;
    }
  }
  
  for (let i = units.length - 1; i > -1; --i) {
    for (let j = units[i][0]; j < units[i][0] + units[i][2]; ++j) {
      for (let k = units[i][1]; k < units[i][1] + units[i][3]; ++k) {
        lookupTable[j][k] = i;
      }
    }
  }
};

/* Main Functions. */
function setup() {
  // Hide p5.js default loading screen if it exists
  const p5Loading = document.getElementById('p5_loading');
  if (p5Loading) {
    p5Loading.style.display = 'none';
  }
  
  for (let i = n_parts - 1; i > -1; --i) gestureFlags[i] = 1;
  /* Initialize the Sound objects. */
  if (DEBUG) console.log("Load soundtracks.");
//loop through each of the instruments (?)
  for (let i = texts.length - 1; i > -1; --i) {
    if (DEBUG) console.log(i);
    let instrument = texts[i];
    ampPtr[instrument] = new p5.Amplitude();
    ampPtr[instrument].setInput(sounds[instrument]);
  }

  /* Initialize the GUI. */
  createCanvas(windowWidth, windowHeight);
  
  // Calculate grid total size and center it in the window
  const gridWidth = n_grid_X * unitX;
  const gridHeight = n_grid_Y * unitY;
  globalX = (windowWidth - gridWidth) / 2;
  globalY = (windowHeight - gridHeight) / 2;
  
  deriveAttributes();
  deriveLookupTable();

  /* Create GUI elements */
  // let playButton = createButton('Play All');
  // playButton.position(10, 10);
  // playButton.mousePressed(playAllSounds);

  // let pauseButton = createButton('Pause All');
  // pauseButton.position(80, 10);
  // pauseButton.mousePressed(pauseAllSounds);

  // let resumeButton = createButton('Resume All');
  // resumeButton.position(150, 10);
  // resumeButton.mousePressed(resumeAllSounds);

  

  
  // Create sliders in HTML container
  const slidersContent = document.getElementById('slidersContent');
  
  if (slidersContent) {
    // Create master slider container
    const masterItem = document.createElement('div');
    masterItem.className = 'slider-item';
    const masterContainer = document.createElement('div');
    masterContainer.className = 'slider-container';
    const masterLabel = document.createElement('div');
    masterLabel.className = 'slider-label';
    masterLabel.textContent = 'Master Volume';
    masterContainer.appendChild(masterLabel);
    
    // Create master slider with p5.js
    masterVolumeSlider = createSlider(0, 1, 0.5, 0.01);
    masterVolumeSlider.elt.style.flex = '1';
    masterVolumeSlider.input(setMasterVolume);
    masterContainer.appendChild(masterVolumeSlider.elt);
    masterItem.appendChild(masterContainer);
    slidersContent.appendChild(masterItem);
    labels["master"] = masterLabel;

    // Create instrument sliders
    for (let i = 0; i < texts.length; i++) {
      let instrument = texts[i];
      const defaultVolume = (instrument === "Piano") ? 0.7 : 0.5;
      
      const sliderItem = document.createElement('div');
      sliderItem.className = 'slider-item';
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'slider-container';
      const label = document.createElement('div');
      label.className = 'slider-label';
      label.textContent = instrument;
      sliderContainer.appendChild(label);
      
      // Create slider with p5.js
      let slider = createSlider(0, 1, defaultVolume, 0.01);
      slider.elt.style.flex = '1';
      slider.input(() => setVolume(instrument));
      sliderContainer.appendChild(slider.elt);
      sliderItem.appendChild(sliderContainer);
      slidersContent.appendChild(sliderItem);
      
      sliders[instrument] = slider;
      labels[instrument] = label;
    }
  }
  

  // Setup button event listeners (buttons are in HTML)
  setupButtonListeners();
  
  // Hide all sliders by default
  hideMasterVolumeSlider();
  hideInstrumentSliders();
  /* Other Settings. */
  //frameRate(60);

  /* Start the Soundtracks. */
  //playAll();

  /* Initialize Timer. */
  lastTime = millis();
  startingTime = millis();
};

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate grid position to center it
  const gridWidth = n_grid_X * unitX;
  const gridHeight = n_grid_Y * unitY;
  globalX = (windowWidth - gridWidth) / 2;
  globalY = (windowHeight - gridHeight) / 2;
  deriveAttributes();
  deriveLookupTable();
}

function drawDebugInfo() {
  baseX = windowWidth/2;
  fill("black");
  rect(baseX - 20, 10, 600, 400);
  fill("white");
  text("Left Hand Cursor X: " + window.sharedData.leftHandCursorX, baseX, 50);
  text("Left Hand Cursor Y: " + window.sharedData.leftHandCursorY, baseX, 80);

  // Display the right hand cursor data
  text("Right Hand Cursor X: " + window.sharedData.rightHandCursorX, baseX, 130);
  text("Right Hand Cursor Y: " + window.sharedData.rightHandCursorY, baseX, 160);

  // Display the left hand gesture data
  text("Left Hand Gesture Name: " + window.sharedData.leftGestureData.gestureName, baseX, 210);
  text("Left Hand Gesture Score: " + window.sharedData.leftGestureData.gestureScore, baseX, 240);
  text("Left Hand Gesture Handedness: " + window.sharedData.leftGestureData.handedness, baseX, 270);

  // Display the right hand gesture data
  text("Right Hand Gesture Name: " + window.sharedData.rightGestureData.gestureName, baseX, 320);
  text("Right Hand Gesture Score: " + window.sharedData.rightGestureData.gestureScore, baseX, 350);
  text("Right Hand Gesture Handedness: " + window.sharedData.rightGestureData.handedness, baseX, 380);

}

function draw() {

  /* Initialize flags. */
  let playFlag = true;
  let lowerVoice = false;
  let target = -1;
  let tmp = 255;
  states[0] = -1; states[1] = -1;
    
  let leftHand = -1;
  let rightHand = -1;
  
  /* Renew playtime and gestures. */
  updateTime();
  renewGestureFlags();
  background(200);

  /* Update amplitude values */
  _updateAmpVal();

  /* Draw parts */
  drawParts();

  
  // Use the global object stored with the browser window to get cursor coordinates
  let leftHandCursorX = window.sharedData.leftHandCursorX || 0;
  let leftHandCursorY = window.sharedData.leftHandCursorY || 0;
  let rightHandCursorX = window.sharedData.rightHandCursorX || 0;
  let rightHandCursorY = window.sharedData.rightHandCursorY || 0;

  // these range from (0.0 - 1.0) by default -- let's make it proportional to our window size 
  leftHandCursorX = (1 - leftHandCursorX) * windowWidth; // horizontal flip this as well
  leftHandCursorY = leftHandCursorY * windowHeight;

  rightHandCursorX = (1 - rightHandCursorX) * windowWidth; // horizontal flip this as well
  rightHandCursorY = rightHandCursorY * windowHeight;

  // Read gesture data from window.sharedData
  let leftGestureName = window.sharedData.leftGestureData.gestureName;
  let rightGestureName = window.sharedData.rightGestureData.gestureName;

  
  // First, reset all selections
  for (let i = 0; i < selectedUnits.length; i++) {
    selectedUnits[i] = false;
  }
  
  // check if either hand is pointing up
  if (rightGestureName === "Pointing_Up" || leftGestureName === "Pointing_Up") {
    // Use the pointing hand's cursor position to detect instrument
    let pointingCursorX = (rightGestureName === "Pointing_Up") ? rightHandCursorX : leftHandCursorX;
    let pointingCursorY = (rightGestureName === "Pointing_Up") ? rightHandCursorY : leftHandCursorY;
    
    target = detectInstrument(pointingCursorX, pointingCursorY);
    
    // 如果手指向上且位于一个声部上方，将声部变绿
    if (target !== -1) {
        if (DEBUG) console.log(`Selected instrument: ${texts[target]} at position (${pointingCursorX}, ${pointingCursorY})`);
        selectedUnits[target] = true;
    } else {
        if (DEBUG) console.log(`No instrument detected at position (${pointingCursorX}, ${pointingCursorY})`);
    }
    
    // 如果左手是张开手掌且右手指向上，可以调整音量
    if (target !== -1 && rightGestureName === "Pointing_Up" && leftGestureName === "Open_Palm") {
        let volume = 1 - (leftHandCursorY / windowHeight); // 使用左手的y位置设置音量
        sliders[texts[target]].value(volume);
        setVolume(texts[target]);
    }
  }


  // check if the left hand is fist
  if (leftGestureName === "Closed_Fist" || rightGestureName === "Closed_Fist") {
    // mute
    setAmp(true);
  } else {
    // adjust volume
    setAmp(false);
  }

  // Adjust volume based on the hand's y position when the gesture is "Open_Palm"
  if (leftGestureName === "Open_Palm" && rightGestureName != "Pointing_Up") {
    let volume = 1 - (leftHandCursorY / windowHeight); // Normalize y position to volume (0.0 - 1.0)
    masterVolumeSlider.value(volume);
    setMasterVolume();
  }
  if (rightGestureName === "Open_Palm" && leftGestureName != "Pointing_Up") {
    let volume = 1 - (rightHandCursorY / windowHeight); // Normalize y position to volume (0.0 - 1.0)
    masterVolumeSlider.value(volume);
    setMasterVolume();
  }

  // Draw left hand cursor based on gesture
  switch (leftGestureName) {
    case "Pointing_Up":
      fill("green");
      triangle(leftHandCursorX, leftHandCursorY, // first vertex
         leftHandCursorX + 25, leftHandCursorY + 26, // second vertex
         leftHandCursorX + 1, leftHandCursorY + 35); // third vertex

      break;
    case "Open_Palm":
      fill("yellow");
      rect(leftHandCursorX - 25, leftHandCursorY - 12.5, 45, 15);
      break;
    case "Closed_Fist":
      fill("red");
      circle(leftHandCursorX, leftHandCursorY, 10); // Smaller circle
      break;
    default:
      fill("red");
      circle(leftHandCursorX, leftHandCursorY, 25); // Default circle
      break;
  }

  // Draw right hand cursor based on gesture
  switch (rightGestureName) {
    case "Pointing_Up":
      fill("green");
      triangle(rightHandCursorX, rightHandCursorY, 
        rightHandCursorX + 25, rightHandCursorY + 26, 
        rightHandCursorX + 1, rightHandCursorY + 35);
      break;
    case "Open_Palm":
      fill("yellow");
      rect(rightHandCursorX - 25, rightHandCursorY - 12.5, 45, 15);
      break;
    case "Closed_Fist":
      fill("blue");
      circle(rightHandCursorX, rightHandCursorY, 10); // Smaller circle
      break;
    default:
      fill("blue");
      circle(rightHandCursorX, rightHandCursorY, 25); // Default circle
      break;
  }

}

// check if the cursor is over a unit
function detectInstrument(x, y) {
  for (let i = 0; i < units.length; i++) {
    if (x > unitAttributes[i][0] && x < unitAttributes[i][0] + unitAttributes[i][2] &&
        y > unitAttributes[i][1] && y < unitAttributes[i][1] + unitAttributes[i][3]) {
      return i; // return the index of the unit
    }
  }
  return -1; // if the cursor is not over a unit
}

function resetColors() {
  for (let i = 0; i < colors.length; i++) {
    colors[i] = [(units[i][4] < 128) ? 255 : 0, (units[i][4] < 128) ? 255 : 0, (units[i][4] < 128) ? 255 : 0];
    selectedUnits[i] = false; // Reset selection state
  }
}



function setAmp(lowerVoice) {
  if (lowerVoice) {
    for (let i = units.length - 1; i > -1; --i) {
      if (i === 10) sounds[texts[i]].setVolume(0.7); // piano volume is always 100%
      else sounds[texts[i]].setVolume(lowVoiceVal); // mute the other instruments
    }
  } else {
    for (let i = units.length - 1; i > -1; --i) {
      if (i === 10) sounds[texts[i]].setVolume(1);
      else {
        let volume = sliders[texts[i]].value() * masterVolumeSlider.value();
        sounds[texts[i]].setVolume(volume);
      }
    }
  }
}

// ---- KEYBOARD SHORTCUT TIME -----

function keyPressed() {
  if (key === " ") {
    if (DEBUG) console.log("pressed space");
    if (isPaused && firstTimePlaying){
      playAllSounds();
    }
    else if(isPaused){
      resumeAllSounds();
    }
    else{
      pauseAllSounds();
    }
  }

  if (keyCode === ENTER) {
    if (DEBUG) console.log("pressed enter")
    playTime = 0;
    lastTime = millis();
    
  }
    
}

// ---- KEYBOARD SHORTCUT TIME OVER -----


/* Functions from player start */
function playAllSounds() {
  firstTimePlaying = false;
  // Ensure the AudioContext is resumed on user gesture
  const audioContext = getAudioContext();
  if (audioContext.state !== 'running') {
    audioContext.resume().then(() => {
      // After AudioContext is resumed, play the sounds
      if (allLoaded) {
        let currentTime = audioContext.currentTime;
        for (let instrument in sounds) {
          if (sounds.hasOwnProperty(instrument)) {
            sounds[instrument].playMode('restart');  // Ensure the sound restarts on play
            sounds[instrument].play(currentTime + 0.1); // Play all sounds at the same time after 0.1 second
          }
        }
        isPaused = false;
      } else {
        if (DEBUG) console.log("Sounds are not fully loaded yet");
      }
    });
    return;
  }
  
  if (allLoaded) {
    let currentTime = audioContext.currentTime;
    for (let instrument in sounds) {
      if (sounds.hasOwnProperty(instrument)) {
        sounds[instrument].playMode('restart');  // Ensure the sound restarts on play
        sounds[instrument].play(currentTime + 0.1); // Play all sounds at the same time after 0.1 second
      }
    }
    isPaused = false;
  } else {
    if (DEBUG) console.log("Sounds are not fully loaded yet");
  }
}

function pauseAllSounds() {
  if (allLoaded) {
    for (let instrument in sounds) {
      if (sounds.hasOwnProperty(instrument)) {
        sounds[instrument].pause();  // Pause the sound
      }
    }
    isPaused = true;
  } else {
    console.log("Sounds are not fully loaded yet");
  }
}

function resumeAllSounds() {
  if (allLoaded && isPaused) {
    for (let instrument in sounds) {
      if (sounds.hasOwnProperty(instrument)) {
        sounds[instrument].play();
      }
    }
    isPaused = false;
  } else {
    if (DEBUG) console.log("Sounds are not fully loaded yet or not paused");
  }
}

function setVolume(instrument) {
  if (instrument === "Piano") {
    sounds[instrument].setVolume(0.7); // Piano volume is always 100%
  } else {
    let volume = sliders[instrument].value() * masterVolumeSlider.value();
    sounds[instrument].setVolume(volume);
  }
}

function setMasterVolume() {
  for (let instrument in sounds) {
    if (sounds.hasOwnProperty(instrument)) {
      if (instrument === "Piano") {
        sounds[instrument].setVolume(0.7); // Piano volume is always 100%
      } else {
        let volume = sliders[instrument].value() * masterVolumeSlider.value();
        sounds[instrument].setVolume(volume);
      }
    }
  }
}

/* Functions from player end */

// Setup button event listeners
function setupButtonListeners() {
  let slidersVisible = false;
  const showSlidersButton = document.getElementById('showSlidersButton');
  const playPauseButton = document.getElementById('playPauseButton');
  
  // Show/Hide Sliders button
  if (showSlidersButton) {
    showSlidersButton.addEventListener('click', () => {
      if (slidersVisible) {
        hideMasterVolumeSlider();
        hideInstrumentSliders();
        showSlidersButton.innerText = 'Show Sliders';
        slidersVisible = false;
      } else {
        showMasterVolumeSlider();
        showInstrumentSliders();
        showSlidersButton.innerText = 'Hide Sliders';
        slidersVisible = true;
      }
    });
  }
  
  // Play/Pause button
  if (playPauseButton) {
    playPauseButton.addEventListener('click', () => {
      if (isPaused && firstTimePlaying) {
        playAllSounds();
        playPauseButton.innerText = 'Pause';
      } else if (isPaused) {
        resumeAllSounds();
        playPauseButton.innerText = 'Pause';
      } else {
        pauseAllSounds();
        playPauseButton.innerText = 'Play';
      }
    });
  }
}
