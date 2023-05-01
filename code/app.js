// TESTING VARIABLES
const nightToSimulate = 3;
let secondLength = 50; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const Freddy = {
    name: 'Freddy',
    possibleLocations: ['1A'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 3.02,
    aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
};
const Chica = {
    name: 'Bonnie',
    possibleLocations: ['1A'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 4.97,
    aiLevels: [null, 0, 3, 0, 2, 5, 10],
};
const Bonnie = {
    name: 'Chica',
    possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 4.98,
    aiLevels: [null, 0, 1, 5, 4, 7, 12],
};
// import { Animatronic, animatronics } from './animatronics';
/* Time related variables */
let currentFrame = 0;
let currentSecond = -1; // We start at -1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond = 60;
/* Time related page elements */
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time');
const inGameHourDisplay = document.querySelector('#in-game-time');
// General page elements
const simulator = document.querySelector('#simulator');
const sidebar = document.querySelector('#sidebar');
const cameraButton = document.querySelector('#camera-display button');
const cameraStatusText = document.querySelector('#camera-status');
/* Player choosable variables */
let camerasOn = false;
// ========================================================================== //
// TIMER BASED FUNCTIONS
// These are split off separately as they each need to update at
// different rates.
// ========================================================================== //
// We are running at 60fps
const updateFrames = () => {
    currentFrame++;
    framesDisplay.textContent = `${currentFrame} frames at ${framesPerSecond}fps`;
};
const updateTime = () => {
    currentSecond++;
    // REAL TIME
    let realMinutes = Math.floor(currentSecond / 60);
    let realRemainingSeconds = currentSecond % 60;
    secondsDisplay.textContent = `
    ${realMinutes} : ${String(realRemainingSeconds).padStart(2, '0')}
  `;
    // IN GAME TIME
    const gameTime = calculateInGameTime();
    inGameHourDisplay.innerHTML = `
    <span class="in-game-hour">${gameTime.hour}</span>
    <span class="in-game-minutes">${String(gameTime.minute).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;
    // console.log(
    //   `Real time: ${realMinutes}:${realRemainingSeconds} (${currentSecond})     In-game time: ${inGameHours}:${String(
    //     inGameRemainingMinutes
    //   ).padStart(2, '0')}`
    // );
    updateFrames();
    if (currentSecond === 539) {
        clearInterval(timeUpdate);
        clearInterval(frameUpdate);
        // clearInterval(freddyInterval);
    }
};
const calculateInGameTime = () => {
    let inGameMinutes = Math.ceil(currentSecond * 0.666666666667) > 0 ? Math.ceil(currentSecond * 0.666666666667) : 0;
    return {
        hour: String(Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12),
        minute: String(inGameMinutes % 60).padStart(2, '0'),
    };
};
// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //
const generateAnimatronics = () => {
    [Freddy, Bonnie, Chica].forEach((animatronic) => {
        // Create the icons
        let icon = document.createElement('span');
        icon.classList.add('animatronic');
        icon.setAttribute('id', animatronic.name);
        icon.setAttribute('position', animatronic.startingPosition);
        simulator.appendChild(icon);
        // Create the report
        let animatronicReport = document.createElement('div');
        animatronicReport.classList.add('animatronic-report');
        animatronicReport.setAttribute('animatronic', animatronic.name);
        animatronicReport.innerHTML = `
      ${animatronic.name}<br>
      Starting AI level: ${animatronic.aiLevels[nightToSimulate]}
    `;
        sidebar.querySelector('#animatronic-report').appendChild(animatronicReport);
    });
};
// Freddy always follows a set path, and waits a certain amount of time before actually moving.
const moveFreddy = () => {
    const success = Freddy.aiLevels[nightToSimulate] >= Math.random() * 20;
    if (camerasOn) {
        addReport('Freddy', `Freddy will automatically fail all movement checks while the cameras are up`, false);
    }
    else if (success) {
        let waitingTime = 1000 - Freddy.aiLevels[nightToSimulate] * 100; // How many FRAMES to wait before moving
        waitingTime = waitingTime >= 0 ? waitingTime : 0;
        let startingPosition = Freddy.currentPosition;
        let endingPosition = startingPosition;
        // Freddy always follows a set path
        switch (Freddy.currentPosition) {
            case '1A': // Show stage
                endingPosition = '1B';
                break;
            case '1B': // Dining area
                endingPosition = '7';
                break;
            case '7': // Restrooms
                endingPosition = '6';
                break;
            case '6': // Kitchen
                endingPosition = '4A';
                break;
            case '4A': // East hall
                endingPosition = '4B';
                break;
            case '4B': // East hall corner
                endingPosition = '4A';
                break;
            // TODO - outside/inside office?
        }
        addReport('Freddy', `Freddy has passed his AI check and will move from ${startingPosition} to ${endingPosition} in ${(waitingTime / 60).toFixed(2)} seconds`, success);
        clearInterval(freddyInterval);
        // Freddy waits a certain amount of time between passing his movement check and actually moving.
        // The amount of time is dependent on his AI level.
        window.setTimeout(() => {
            moveAnimatronic(Freddy, startingPosition, endingPosition);
            freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
        }, (waitingTime / 60) * secondLength);
    }
    else {
        addReport('Freddy', `Freddy has failed to move and remains at ${Freddy.currentPosition}`, success);
    }
};
const moveAnimatronic = (animatronic, startingPosition, endPosition) => {
    var _a;
    animatronic.currentPosition = endPosition;
    addReport(animatronic.name, `${animatronic.name} has moved from ${startingPosition} to ${endPosition}`, true);
    (_a = document.querySelector(`.animatronic#${animatronic.name}`)) === null || _a === void 0 ? void 0 : _a.setAttribute('position', endPosition);
};
// ========================================================================== //
// REPORTING
// ========================================================================== //
const addReport = (animatronicName, message, success) => {
    var _a;
    let reportToAddTo = document.querySelector(`.animatronic-report[animatronic="${animatronicName}"]`);
    const InGameTime = calculateInGameTime();
    if (reportToAddTo) {
        reportToAddTo.innerHTML = `

    
    <div class="report-item" type="${success}"><span class="report-time">${InGameTime.hour}:${InGameTime.minute}AM</span> ${message}</div>
    ${(_a = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.innerHTML) !== null && _a !== void 0 ? _a : ''}
  `;
    }
};
// ========================================================================== //
// PLAYER INTERACTION
// ========================================================================== //
const toggleCameras = () => {
    camerasOn = !camerasOn;
    cameraButton.setAttribute('active', String(camerasOn));
    cameraStatusText.textContent = camerasOn ? 'CAMERAS ON' : 'CAMERAS OFF';
};
// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //
const timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
const frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
let freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
// Since we're starting the time at -1 to accommodate 12AM being 89 seconds long, wait 1 second before starting the movement calculations
// window.setTimeout(() => {
//   freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
// }, 1000);
generateAnimatronics();
cameraButton.addEventListener('click', toggleCameras);
export {};
