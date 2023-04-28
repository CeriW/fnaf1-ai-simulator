"use strict";
/* HELLO */
const timer = document.querySelector('#timer');
let currentFrames = 0;
// We are running at 60fps
const updateTimer = () => {
    currentFrames++;
    timer.textContent = currentFrames.toString();
};
window.setInterval(updateTimer, 1000 / 60);
