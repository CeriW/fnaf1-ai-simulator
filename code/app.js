// TODO - PUT THIS IN A MODULE
export const animatronics = [
    {
        name: 'Chica',
        possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
        startingPosition: '1A',
    },
    {
        name: 'Bonnie',
        possibleLocations: ['1A'],
        startingPosition: '1A',
    },
    {
        name: 'Freddy',
        possibleLocations: ['1A'],
        startingPosition: '1A',
    },
];
// import { Animatronic, animatronics } from './animatronics';
/* Time related variables */
let currentFrames = 0;
let framesPerSecond = 60;
/* Time related page elements */
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time');
const inGameHourDisplay = document.querySelector('#in-game-time');
const simulator = document.querySelector('#simulator');
// ========================================================================== //
// TIMER BASED FUNCTIONS
// ========================================================================== //
// We are running at 60fps
const updateFrames = () => {
    currentFrames++;
    framesDisplay.textContent = `${Math.floor(currentFrames)} frames at ${framesPerSecond}fps`;
    updateRealTime();
    updateInGameTime();
    // Make it stop at 6AM
    if (currentFrames >= 32100) {
        clearInterval(frameUpdate);
    }
};
const updateRealTime = () => {
    let seconds = Math.floor(currentFrames / 60);
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    secondsDisplay.textContent = `
    ${minutes} : ${String(remainingSeconds).padStart(2, '0')}
  `;
};
// One in game hour is 90 real-life seconds
const updateInGameTime = () => {
    let minutes = Math.floor(currentFrames / (60 * 1.5)) > 0 ? Math.floor((currentFrames - 60) / (60 * 1.5)) : 0;
    let hours = Math.floor(minutes / 60) > 0 ? Math.floor(minutes / 60) : 12;
    let remainingMinutes = minutes % 60;
    inGameHourDisplay.innerHTML = `

    <span class="in-game-hour">${hours}</span>
    <span class="in-game-minutes">${String(remainingMinutes).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;
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
const frameUpdate = window.setInterval(updateFrames, 1000 / framesPerSecond); // Update the frames every 1/60th of a second
generateAnimatronics();
