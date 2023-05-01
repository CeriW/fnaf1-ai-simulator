// TESTING VARIABLES
const nightToSimulate = 5;
// let secondMultiplier: number = 1;
let secondLength: number = 1000; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.

// TODO - PUT THIS IN A MODULE

export type Animatronic = {
  name: string;
  possibleLocations: string[]; // The cameras where they can be
  startingPosition: string; // The camera where they start
  currentPosition: string; // The camera the animatronic is currently at
  movementOpportunityInterval: number; // How often in seconds this animatronic gets a movement opportunity
  aiLevels: [null, number, number, number, number, number, number]; // The starting AI levels on nights 1-6. To make the code more readable, null is at the start so night 1 is at index 1 and so on
  canMove?: boolean;
};

const Freddy: Animatronic = {
  name: 'Freddy',
  possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 3.02,
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
  canMove: true, // Freddy waits a certain amount of time once he's passed a movement opportunity check before he actually moves. This boolean stores whether he's currently in the middle of a countdown and therefore can't make any additional checks
};

const Chica: Animatronic = {
  name: 'Bonnie',
  possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.97,
  aiLevels: [null, 0, 3, 0, 2, 5, 10],
};

const Bonnie: Animatronic = {
  name: 'Chica',
  possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.98,
  aiLevels: [null, 0, 1, 5, 4, 7, 12],
};

// import { Animatronic, animatronics } from './animatronics';

/* Time related variables */
let currentFrame: number = 0;
let currentSecond: number = -1; // We start at -1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond: number = 60;

/* Time related page elements */
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#real-time')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-time')!;

// General page elements
const simulator: HTMLDivElement = document.querySelector('#simulator')!;
const sidebar: HTMLDivElement = document.querySelector('#sidebar')!;

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
  [Freddy, Bonnie, Chica].forEach((animatronic: Animatronic) => {
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
    sidebar.querySelector('#animatronic-report')!.appendChild(animatronicReport);
  });
};

// Freddy always follows a set path, and waist a certain amount of time before actually moving.
const moveFreddy = () => {
  const success = Freddy.aiLevels[nightToSimulate] >= Math.random() * 20;
  Freddy.canMove = !success;

  if (success) {
    let waitingTime = 1000 - Freddy.aiLevels[nightToSimulate] * 100; // How many FRAMES to wait before moving
    waitingTime = waitingTime >= 0 ? waitingTime : 0;
    let startingPosition = Freddy.currentPosition;
    let endingPosition = startingPosition;

    // Show stage
    if (Freddy.currentPosition === '1A') {
      endingPosition = '1B';

      addReport(
        'Freddy',
        `Freddy has passed his AI check and will move from ${startingPosition} to ${endingPosition} in ${(
          waitingTime / 60
        ).toFixed(2)} seconds`,
        success
      );

      clearInterval(freddyInterval);
    }
    // Dining area
    else if (Freddy.currentPosition === '1B') {
    }

    // Freddy waits a certain amount of time between passing his movement check and actually moving.
    // The amount of time is dependent on his AI level.
    window.setTimeout(() => {
      Freddy.canMove = true;
      moveAnimatronic(Freddy, startingPosition, endingPosition);
      freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
    }, (waitingTime / 60) * secondLength);
  } else {
    addReport('Freddy', `Freddy has failed to move and remains at ${Freddy.currentPosition}`, success);
  }
};

const moveAnimatronic = (animatronic: Animatronic, startingPosition: string, endPosition: string) => {
  animatronic.currentPosition = endPosition;
  addReport(animatronic.name, `${animatronic.name} has moved from ${startingPosition} to ${endPosition}`, true);
  document.querySelector(`.animatronic#${animatronic.name}`)?.setAttribute('position', endPosition);
};

// ========================================================================== //
// REPORTING
// ========================================================================== //

const addReport = (animatronicName: string, message: string, success: boolean) => {
  let reportToAddTo = document.querySelector(`.animatronic-report[animatronic="${animatronicName}"]`);
  const InGameTime = calculateInGameTime();

  if (reportToAddTo) {
    reportToAddTo.innerHTML = `

    ${reportToAddTo?.innerHTML ?? ''}
    <div class="report-item" type="${success}"><span class="report-time">${InGameTime.hour}:${
      InGameTime.minute
    }AM</span> ${message}</div>
  `;
  }
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
