// TODO - PUT THIS IN A MODULE
export const animatronics = [
    {
        name: 'Chica',
        possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
        startingPosition: '1A',
        movementOpportunityInterval: 4980,
    },
    {
        name: 'Bonnie',
        possibleLocations: ['1A'],
        startingPosition: '1A',
        movementOpportunityInterval: 4970,
    },
    {
        name: 'Freddy',
        possibleLocations: ['1A'],
        startingPosition: '1A',
        movementOpportunityInterval: 3020,
    },
];
// import { Animatronic, animatronics } from './animatronics';
/* Time related variables */
let currentFrame = 0;
let currentSecond = -3; // We start at -1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let currentGameHour;
let framesPerSecond = 60;
let secondLength = 1; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
/* Time related page elements */
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time');
const inGameHourDisplay = document.querySelector('#in-game-time');
const simulator = document.querySelector('#simulator');
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
    // One in game hour is 90 real-life seconds (with the exception of 12AM which is 89 seconds)
    let inGameMinutes = Math.ceil(currentSecond * 0.666666666667) > 0 ? Math.ceil(currentSecond * 0.666666666667) : 0;
    let inGameHours = Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12;
    let inGameRemainingMinutes = inGameMinutes % 60;
    inGameHourDisplay.innerHTML = `
    <span class="in-game-hour">${inGameHours}</span>
    <span class="in-game-minutes">${String(inGameRemainingMinutes).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;
    console.log(`Real time: ${realMinutes}:${realRemainingSeconds} (${currentSecond})     In-game time: ${inGameHours}:${String(inGameRemainingMinutes).padStart(2, '0')}`);
    updateFrames();
    if (currentSecond === 539) {
        clearInterval(timeUpdate);
        clearInterval(frameUpdate);
    }
};
// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //
const generateAnimatronics = () => {
    animatronics.forEach((animatronic) => {
        let animatronicDisplay = document.createElement('span');
        animatronicDisplay.innerHTML = `
      <span class="animatronic" id=${animatronic.name} position="${animatronic.startingPosition}">
      </span>
    `;
        simulator.appendChild(animatronicDisplay);
    });
};
// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //
const timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
const frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
generateAnimatronics();
