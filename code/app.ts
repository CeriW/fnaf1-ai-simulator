/* HELLO */

const timer: HTMLDivElement = document.querySelector('#timer')!;
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#seconds')!;

let currentFrames: number = 0;
let currentSeconds: number = 0;

// We are running at 60fps
const updateFrames = () => {
  currentFrames++;
  // timer.textContent = currentFrames.toString();
  framesDisplay.textContent = `${Math.floor(currentFrames)}`;
};

const updateTime = () => {
  currentSeconds++;
  secondsDisplay.textContent = `
    ${Math.floor(currentSeconds / 60)} : ${String(currentSeconds % 60).padStart(2, '0')}
  `;
};

window.setInterval(updateFrames, 1000 / 60); // Update the frames every 1/60th of a second
window.setInterval(updateTime, 1000);
