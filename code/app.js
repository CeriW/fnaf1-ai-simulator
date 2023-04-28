"use strict";
/* HELLO */
/* Time related page elements */
const timer = document.querySelector('#timer');
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time-seconds');
const inGameHourDisplay = document.querySelector('#in-game-time');
/* Time related variables */
let currentFrames = 0;
// let currentSeconds: number = -1; // We start at -1 because the first 'hour' is 1 second shorter than the rest.
// We are running at 60fps
const updateFrames = () => {
    currentFrames++;
    framesDisplay.textContent = `${Math.floor(currentFrames)}`;
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
    let minutes = Math.floor((currentFrames - 60) / (60 * 1.5)) > 0 ? Math.floor((currentFrames - 60) / (60 * 1.5)) : 0;
    let hours = Math.floor(minutes / 60) > 0 ? Math.floor(minutes / 60) : 12;
    let remainingMinutes = minutes % 60;
    inGameHourDisplay.innerHTML = `

    <span class="in-game-hour">${hours}</span>
    <span class="in-game-minutes">${String(remainingMinutes).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;
};
const frameUpdate = window.setInterval(updateFrames, 0.0005); // Update the frames every 1/60th of a second
