/* HELLO */

/* Time related page elements */
const timer: HTMLDivElement = document.querySelector('#timer')!;
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#seconds')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-hour')!;

/* Time related variables */
let currentFrames: number = 0;
let currentSeconds: number = 0;

// We are running at 60fps
const updateFrames = () => {
  currentFrames++;
  framesDisplay.textContent = `${Math.floor(currentFrames)}`;
};

const updateTime = () => {
  currentSeconds++;
  secondsDisplay.textContent = `
    ${Math.floor(currentSeconds / 60)} : ${String(currentSeconds % 60).padStart(2, '0')}
  `;

  let myHour = Math.floor((currentSeconds - 1) / 90);
  if (!myHour) {
    myHour = 12;
  }

  inGameHourDisplay.textContent = `${myHour.toString()}AM`;

  if (currentSeconds === 855) {
    clearInterval(timeUpdate);
    clearInterval(frameUpdate);
  }
};

const frameUpdate = window.setInterval(updateFrames, 1000 / 60); // Update the frames every 1/60th of a second
const timeUpdate = window.setInterval(updateTime, 1000); // Update the seconds every second.
