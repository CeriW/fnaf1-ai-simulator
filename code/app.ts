/* HELLO */

/* Time related page elements */
const timer: HTMLDivElement = document.querySelector('#timer')!;
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#seconds')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-hour')!;

/* Time related variables */
let currentFrames: number = 0;
// let currentSeconds: number = -1; // We start at -1 because the first 'hour' is 1 second shorter than the rest.

// We are running at 60fps
const updateFrames = () => {
  currentFrames++;
  framesDisplay.textContent = `${Math.floor(currentFrames)}`;
};

const updateTime = () => {
  let seconds = Math.floor(currentFrames / 60);

  var minutes = Math.floor(seconds / 60);
  var remainingSeconds = seconds % 60;

  secondsDisplay.textContent = `
    ${minutes} : ${String(remainingSeconds).padStart(2, '0')}
  `;
};

// const updateTime = () => {
//   currentSeconds++;
//   secondsDisplay.textContent = `
//     ${Math.floor(currentSeconds / 60)} : ${String(currentSeconds % 60).padStart(2, '0')}
//   `;

//   if (currentSeconds === 854) {
//     clearInterval(timeUpdate);
//     clearInterval(frameUpdate);
//   }
// };

// const updateInGameTime = () => {
//   let inGameTime = currentSeconds * 1.5;

//   let myHour = Math.floor(inGameTime / 90);
//   if (!myHour) {
//     myHour = 12;
//   }

//   let myMinute = inGameTime / 60;

//   inGameHourDisplay.textContent = `${myHour}:${Math.floor(myMinute)}AM`;
// };

const frameUpdate = window.setInterval(updateFrames, 1000 / 60); // Update the frames every 1/60th of a second
const timeUpdate = window.setInterval(updateTime, 1000); // Update the seconds every second.
const inGameHourUpdate = window.setInterval(updateInGameTime, 150); // Update the in-game time every 1.5 seconds (an in game 'hour' is 90 real time seconds)
