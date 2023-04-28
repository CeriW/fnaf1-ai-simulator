"use strict";
/* HELLO */
const timer = document.querySelector('#timer');
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#seconds');
let currentFrames = 0;
let currentSeconds = 0;
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
    if (currentSeconds === 855) {
        clearInterval(timeUpdate);
        clearInterval(frameUpdate);
    }
};
const frameUpdate = window.setInterval(updateFrames, 1000 / 60); // Update the frames every 1/60th of a second
const timeUpdate = window.setInterval(updateTime, 1000);
