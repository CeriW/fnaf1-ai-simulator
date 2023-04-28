/* HELLO */

const timer: HTMLDivElement = document.querySelector('#timer')!;
let currentFrames: number = 0;

// We are running at 60fps
const updateTimer = () => {
  currentFrames++;
  timer.textContent = currentFrames.toString();
};

window.setInterval(updateTimer, 1000 / 60);
