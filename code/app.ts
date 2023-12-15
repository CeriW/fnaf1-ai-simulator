// TESTING VARIABLES
let nightToSimulate: number = 6;
let secondLength: number = 1; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const defaultCamera = '1A' as Camera;

type MovementCheck = {
  animatronicName: string;
  canMove: boolean;
  scoreToBeat: number;
  aiLevel: number;
};

type Animatronic = {
  name: string;
  currentPosition: Position; // The camera the animatronic is currently at
  subPosition: number; // Used for Foxy. He will almost always be in 1C, but he goes thrsough multiple steps before he's able to leave. -1 is the equivalent of null.
  movementOpportunityInterval: number; // How often in seconds this animatronic gets a movement opportunity
  aiLevels: [null, number, number, number, number, number, number, number]; // The starting AI levels on nights 1-6. To make the code more readable, null is at the start so night 1 is at index 1 and so on
  currentAIlevel: number; // Some animatronics increase their AI level as the night goes on. This will be used to store what their current AI level is. It's set to 0 when the animatronics are first declared, then set to the correct value in generateAnimatronics()
  currentCountdown: number; // How many milliseconds they've got left before a special move
  pronouns: ['he' | 'she', 'his' | 'her']; // For FNAF 1 this is simple. In other FNAF games the genders of some animatronics are complicated, so this makes for easier forwards compatibility than just checking whether we're dealing with Chica (the only female animatronic in FNAF 1)
  stats: {
    successfulMovementChecks: number;
    failedMovementChecks: number;
    officeAttempts: number; // How many times they could have entered the office if not for the user
  };
};

type Camera = '1A' | '1B' | '1C' | '2A' | '2B' | '3' | '4A' | '4B' | '5' | '6' | '7';

type Position = Camera | 'office';

const Freddy: Animatronic = {
  name: 'Freddy',
  currentPosition: '1A',
  movementOpportunityInterval: 3.02,
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4, 20], // Freddy randomly starts at 1 or 2 on night 4
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  stats: {
    successfulMovementChecks: 0,
    failedMovementChecks: 0,
    officeAttempts: 0,
  },
};

const Bonnie: Animatronic = {
  name: 'Bonnie',
  currentPosition: '1A',
  movementOpportunityInterval: 4.97,
  aiLevels: [null, 0, 3, 0, 2, 5, 10, 20],
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  stats: {
    successfulMovementChecks: 0,
    failedMovementChecks: 0,
    officeAttempts: 0,
  },
};

const Chica: Animatronic = {
  name: 'Chica',
  currentPosition: '1A',
  movementOpportunityInterval: 4.98,
  aiLevels: [null, 0, 1, 5, 4, 7, 12, 20],
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['she', 'her'],
  subPosition: -1,
  stats: {
    successfulMovementChecks: 0,
    failedMovementChecks: 0,
    officeAttempts: 0,
  },
};

const Foxy: Animatronic = {
  name: 'Foxy',
  currentPosition: '1C',
  currentAIlevel: 0,
  subPosition: 0,
  movementOpportunityInterval: 5.01,
  aiLevels: [null, 0, 1, 2, 6, 5, 16, 20],
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  stats: {
    successfulMovementChecks: 0,
    failedMovementChecks: 0,
    officeAttempts: 0,
  },
};

const cameraNames = {
  '1A': 'Show stage',
  '1B': 'Dining area',
  '1C': 'Pirate cove',
  '2A': 'West hall',
  '2B': 'W. hall corner',
  '3': 'Supply closet',
  '4A': 'East hall',
  '4B': 'E. hall corner',
  '5': 'Backstage',
  '6': 'Kitchen',
  '7': 'Restrooms',
};

const paths = {
  assets: '../assets',
  cameras: '../assets/cameras',
  animatronics: '../assets/animatronics',
  office: '../assets/office',
  audio: '../assets/sounds',
};

/* Time related variables */
let currentFrame: number = 0;
let currentSecond: number = -1; // We start at 1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond: number = 60;
let gameSpeed = 1;

/* Time related page elements */
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#real-time')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-time')!;

// General page elements
const simulator: HTMLDivElement = document.querySelector('#simulator')!;
const sidebar: HTMLDivElement = document.querySelector('#sidebar')!;
const officeDisplay: HTMLImageElement = document.querySelector('#office-overlay img')!;

// Camera related page elements
const cameraArea: HTMLDivElement = document.querySelector('#camera-display')!;
const cameraButton: HTMLButtonElement = document.querySelector('button#cameras')!;
const cameraStatusText: HTMLDivElement = document.querySelector('#camera-status')!;
const cameraScreen: HTMLImageElement = document.querySelector('img#camera-screen')!;

// Power related page elements
const powerDisplay: HTMLDivElement = document.querySelector('#power')!;

/* Player choosable variables */

let user = {
  camerasOn: false,
  currentCamera: defaultCamera,
  leftDoorIsClosed: false,
  rightDoorIsClosed: false,
  leftLightIsOn: false,
  rightLightIsOn: false,
  camerasToggled: 0,
  camerasLookedAt: 0,
  leftDoorToggled: 0,
  rightDoorToggled: 0,
  power: 100,
  // power: 1,
  audioOn: false,
  gameMode: false, // false for ai simulator, true for playable game with stuff hidden
};

// ========================================================================== //
// TIMER BASED FUNCTIONS
// These are split off separately as they each need to update at
// different rates.
// ========================================================================== //

// We are running at 60fps
const updateFrames = () => {
  currentFrame++;
  framesDisplay.textContent = `${currentFrame} frames at ${framesPerSecond * gameSpeed}fps`;
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
  //   `${realMinutes} : ${String(realRemainingSeconds).padStart(2, '0')}  ${JSON.stringify(calculateInGameTime())}`
  // );

  updateFrames();

  // 2AM
  if (currentSecond === 179) {
    increaseAILevel(Bonnie);
  }

  // 3AM
  if (currentSecond === 268) {
    increaseAILevel(Bonnie);
    increaseAILevel(Chica);
    increaseAILevel(Foxy);
  }

  // 4AM
  if (currentSecond === 357) {
    increaseAILevel(Bonnie);
  }

  // 6AM - end game
  if (currentSecond === 535) {
    gameOver('6AM');
  }
};

// Modifier is how much to offset the time by.
// This is used in the calculations in calculateRemainingPower() to figure out
// what time you will run out of power based on current usage.
const calculateInGameTime = (modifier = 0) => {
  let inGameMinutes =
    Math.floor((currentSecond + modifier) * 0.6741573033707866) > 0
      ? Math.floor((currentSecond + modifier) * 0.6741573033707866)
      : 0;

  return {
    hour: String(Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12),
    minute: String(inGameMinutes % 60).padStart(2, '0'),
  };
};

// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //

const generateAnimatronics = () => {
  [Bonnie, Foxy, Freddy, Chica].forEach((animatronic: Animatronic) => {
    // Initialise their starting AI level
    animatronic.currentAIlevel = animatronic.aiLevels[nightToSimulate] ?? 1;

    // Create the icons
    let icon = document.createElement('span');
    icon.classList.add('animatronic');
    icon.setAttribute('id', animatronic.name);
    icon.setAttribute('position', animatronic.currentPosition);

    icon.setAttribute('sub-position', animatronic.subPosition.toString() ?? 'none');
    simulator.appendChild(icon);

    // Create the report
    let animatronicReport = document.createElement('div');
    animatronicReport.classList.add('animatronic-report');
    animatronicReport.setAttribute('for', animatronic.name);
    animatronicReport.innerHTML = `
      <div class="animatronic-icon"></div>
      <div class="animatronic-name">${animatronic.name}</div>
      <div class="starting-ai-level">Starting AI:<span>${animatronic.currentAIlevel}</span></div>
      <div class="current-ai-level">Current AI level: <span>${animatronic.currentAIlevel}</span></div>
      <div class="report-item-container"></div>
    `;
    document.querySelector('#animatronic-report')!.appendChild(animatronicReport);
    if (animatronic === Freddy) {
      animatronicReport.querySelector('.animatronic-icon')?.addEventListener('click', () => {
        playAudio('freddy-nose');
      });
    }
  });
};

const makeMovementCheck = (animatronic: Animatronic): MovementCheck => {
  const comparisonNumber = Math.ceil(Math.random() * 20);
  const canMove = animatronic.currentAIlevel >= comparisonNumber;

  if (canMove) {
    animatronic.stats.successfulMovementChecks++;
  } else {
    animatronic.stats.failedMovementChecks++;
  }

  return {
    animatronicName: animatronic.name,
    canMove,
    scoreToBeat: comparisonNumber,
    aiLevel: animatronic.currentAIlevel,
  };
};

const increaseAILevel = (animatronic: Animatronic) => {
  if (animatronic.currentAIlevel < 20) {
    animatronic.currentAIlevel++;
    addReport(animatronic, 'increase AI level');
    let aiReport = document.querySelector(`.animatronic-report[for="${animatronic.name}"] .current-ai-level span`);
    if (aiReport) {
      aiReport.innerHTML = animatronic.currentAIlevel.toString();
    }
  }
};

/* ========================================================================== //
DEVELOPER NOTE  
/* ========================================================================== //

Some of the if statements for the animatronics are quite lengthly.
I originally wrote these with nested if statements, but it got out of hand
quite quickly trying to keep track of which combinations of factors were
going on with each one.

The if statements below all seem to have a lot of factors, many of which are
shared, but this makes it much easier to keep track of exactly what
the animatronics should be doing for any given statement.

// ========================================================================== //
// FOXY
// ========================================================================== */

const moveFoxy = () => {
  const movementCheck = makeMovementCheck(Foxy);

  if (Foxy.currentAIlevel === 0) {
    addReport(Foxy, 'AI level 0');
  } else if (user.camerasOn && Foxy.currentPosition === '1C') {
    // Foxy will fail all movement checks while the cameras are on
    addReport(Foxy, 'camera auto fail');

    // If Foxy fails a movement check while at 1C, he will not be able to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
  } else if (!movementCheck.canMove && Foxy.currentPosition === '1C') {
    addReport(Foxy, 'foxy failed pirate cove movement check', movementCheck);
  } else if (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition < 2) {
    // Foxy needs to make 3 successful movement checks before he is able to leave 1C
    moveAnimatronic(Foxy, { start: '1C', end: '1C', sub: Foxy.subPosition + 1 }, false);
    addReport(Foxy, 'foxy successful pirate cove movement check', movementCheck);
  } else if (
    (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition === 2) ||
    Foxy.currentPosition === '2A'
  ) {
    // Once Foxy has made 3 successful movement checks, he can leave Pirate Cove
    if (Foxy.currentPosition === '1C') {
      // This if statement isn't necessary in normal play, but is necessary during testing when his starting position isn't 1C
      moveAnimatronic(Foxy, { start: '1C', end: '2A', sub: -1 });
      addReport(Foxy, 'foxy leaving pirate cove', movementCheck);
    }

    // Once he has left Pirate Cove, he will attempt to attack in 25 seconds or 1.87 seconds after the player looks at cam 2A, whichever comes first
    clearInterval(foxyInterval);
    Foxy.currentCountdown = 25;
    window.addEventListener('cam-on-2A', attemptFoxyJumpscare);
    foxyInterval = window.setInterval(() => {
      Foxy.currentCountdown--;
      if (Foxy.currentCountdown === 0) {
        attemptFoxyJumpscare();
      }
    }, secondLength);
  }
};

const attemptFoxyJumpscare = (e?: Event) => {
  clearInterval(foxyInterval);
  Foxy.stats.officeAttempts++;

  const performFoxyJumpscareCheck = () => {
    const restartSubPosition = Math.floor(Math.random() * 2);
    if (user.leftDoorIsClosed) {
      // If Foxy bashes on your door, you lose 1% power, plus an additional 5% for every time after that (e.g. 7% the second time, 13% the third etc)
      // We do -1 as the attempts get incremented before this function is called.
      const powerDrainage = 1 + (Foxy.stats.officeAttempts - 1) * 5;
      user.power -= powerDrainage;
      addReport(Foxy, 'foxy left door closed', null, { restartSubPosition, powerDrainage });
      moveAnimatronic(Foxy, { start: '2A', end: '1C', sub: restartSubPosition }, false);
      foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
      playAudio('foxy-door-bash');
      updatePowerDisplay();
    } else {
      gameOverFoxy();
    }
  };

  // If this is happening as a result of looking at cam 4A, we need to wait 1.87 seconds before he attempts to attack
  // If this is happening as a result of him waiting 25 seconds (in which case there will be no event parameter here) he will attempt to attack immediately.
  if (e) {
    addReport(Foxy, 'foxy coming down hall');
    const foxyIcon = document.querySelector('.animatronic#Foxy') as HTMLSpanElement;
    if (foxyIcon) {
      foxyIcon.style.animation = `foxyHallAnimation ${(1.87 * secondLength) / 1000}s linear backwards`;
    }
    playAudio('foxy-run');
    foxyJumpscareCountdown = window.setTimeout(performFoxyJumpscareCheck, secondLength * 1.87);
  } else {
    performFoxyJumpscareCheck();
  }
};

// When the cameras come down Foxy will be unable to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
// QUESTION - I am assuming the countdown doesn't renew if another cameras-off event happens during his cooldown.
const pauseFoxy = () => {
  if (Foxy.currentPosition === '1C') {
    let cooldownInSeconds = Math.random() * (16.67 - 0.83) + 0.83;
    Foxy.currentCountdown = cooldownInSeconds * secondLength;
    addReport(Foxy, 'foxy paused', null, cooldownInSeconds);
    clearInterval(foxyInterval);

    foxyCooldown = window.setInterval(() => {
      Foxy.currentCountdown--;
      if (Foxy.currentCountdown <= 0) {
        foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
        clearInterval(foxyCooldown);
      }
    }, 1);
  }
};

// ========================================================================== //
// FREDDY
// ========================================================================== //

// Once Freddy is in the office he has a 25% chance of getting you every 1 second while the cameras are down
const makeFreddyJumpscareCheck = () => {
  clearInterval(freddyInterval);
  freddyInterval = window.setInterval(() => {
    let comparisonNumber = Math.random();
    let jumpscare = {
      canMove: comparisonNumber > 0.75,
    };

    if (jumpscare.canMove && !user.camerasOn) {
      gameOverFreddy();
    } else {
      // Freddy is in your office but failed his movement check and was unable to jumpscare you.
      addReport(Freddy, 'freddy office failed movement check', {
        animatronicName: 'Freddy',
        canMove: true,
        scoreToBeat: 0.75 * 100,
        aiLevel: Math.floor(comparisonNumber * 100),
      });
    }
  }, secondLength);
};

// Freddy always follows a set path, and waits a certain amount of time before actually moving.
const moveFreddy = () => {
  const movementCheck = makeMovementCheck(Freddy);

  if (Freddy.currentAIlevel === 0) {
    addReport(Freddy, 'AI level 0');
  } else if (Freddy.currentPosition === '1A' && Bonnie.currentPosition === '1A' && Chica.currentPosition === '1A') {
    // Freddy cannot move from the stage if Bonnie and/or Chica are also on the stage
    addReport(Freddy, 'freddy bonnie and chica on stage');
  } else if (Freddy.currentPosition === '1A' && Bonnie.currentPosition === '1A' && Chica.currentPosition !== '1A') {
    addReport(Freddy, 'freddy and bonnie on stage');
  } else if (Freddy.currentPosition === '1A' && Bonnie.currentPosition !== '1A' && Chica.currentPosition === '1A') {
    addReport(Freddy, 'freddy and chica on stage');
  } else if (user.camerasOn && Freddy.currentPosition !== '4B') {
    // CAMERAS ON, HE'S NOT AT 4B
    // Freddy will automatically fail all movement checks while the cameras are up
    addReport(Freddy, 'camera auto fail');

    // CAMERAS ON, HE'S AT 4B, USER IS LOOKING AT 4B. DOORS DON'T MATTER HERE
    // Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.
  } else if (user.camerasOn && user.currentCamera === '4B') {
    addReport(Freddy, 'freddy and camera at 4B');

    // ✓ CAMERAS ON    ✓ HE'S AT 4B    ✓ USER IS NOT LOOKING AT 4B    ✓ HE WANTS TO ENTER THE OFFICE     X THE RIGHT DOOR IS CLOSED
  } else if (
    user.camerasOn &&
    Freddy.currentPosition === '4B' &&
    user.currentCamera !== '4B' &&
    user.rightDoorIsClosed &&
    movementCheck.canMove
  ) {
    // Freddy can't get you when the right door is closed even if you're not looking at 4B
    // QUESTION - I HAVE ASSUMED HE RETURNS TO 4A WHEN THIS IS THE CASE?
    // QUESTION - DOES HE HAVE TO PASS A MOVEMENT CHECK BEFORE HE MOVES BACK TO 4A?
    // QUESTION - I ASSUME HE DOES A COUNTDOWN AND DOESN'T LEAVE IMMEDIATELY? Because that's not happening right here with this code
    addReport(Freddy, 'right door closed', null, '4A');
    Freddy.currentPosition = '4A';
    moveAnimatronic(Freddy, { start: '4B', end: '4A' });
    Freddy.stats.officeAttempts++;
    playAudio('freddy-move');

    // CAMERAS ON, HE'S AT 4B, USER IS NOT LOOKING AT 4B BUT HE'S FAILED HIS MOVEMENT CHECK
  } else if (
    user.camerasOn &&
    Freddy.currentPosition === '4B' &&
    user.currentCamera !== '4B' &&
    !user.rightDoorIsClosed &&
    !movementCheck.canMove
  ) {
    // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?

    // Freddy could have entered the office but he failed his movement check. He will continue to wait at Cam 4B
    addReport(Freddy, 'enter office failed movement check', movementCheck);
    Freddy.stats.failedMovementChecks++;
  } else if (!user.camerasOn && Freddy.currentPosition === '4B' && movementCheck.canMove) {
    // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?
    addReport(Freddy, 'enter office cameras off');
    Freddy.stats.officeAttempts++;

    // THE CAMERAS ARE ON, HE'S AT 4B, THE RIGHT DOOR IS OPEN, HE CAN GET INTO THE OFFICE!!!!!
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && !user.rightDoorIsClosed) {
    addReport(Freddy, 'in the office');
    moveAnimatronic(Freddy, { start: '4B', end: 'office' }, false);
    playAudio('freddy-move');
    Freddy.stats.officeAttempts++;
  } else if (Freddy.currentPosition === 'office') {
    makeFreddyJumpscareCheck();
  } else if (movementCheck.canMove) {
    let waitingTime = 1000 - Freddy.currentAIlevel * 100; // How many FRAMES to wait before moving
    waitingTime = waitingTime >= 0 ? waitingTime : 0;
    let currentPosition = Freddy.currentPosition;
    let endingPosition = currentPosition;

    // Freddy always follows a set path
    switch (Freddy.currentPosition) {
      case '1A': // Show stage
        endingPosition = '1B';
        break;
      case '1B': // Dining area
        endingPosition = '7';
        break;
      case '7': // Restrooms
        endingPosition = '6';
        break;
      case '6': // Kitchen
        endingPosition = '4A';
        break;
      case '4A': // East hall
        endingPosition = '4B';
        break;
    }

    // Round to a reasonable number of decimal points for the report, only if it's not an integer.
    let formattedWaitingTime = Number.isInteger(waitingTime / 60) ? waitingTime / 60 : (waitingTime / 60).toFixed(2);

    addReport(Freddy, 'freddy successful movement check', movementCheck, {
      formattedWaitingTime,
      currentPosition,
      endingPosition,
    });

    clearInterval(freddyInterval);

    // Freddy waits a certain amount of time between passing his movement check and actually moving.
    // The amount of time is dependent on his AI level.
    Freddy.currentCountdown = (waitingTime / framesPerSecond) * secondLength;

    // Freddy will not move while the cameras are up.
    // If his countdown expires while the cameras are up, he will wait until the cameras are down to move.
    freddyCountdown = window.setInterval(() => {
      Freddy.currentCountdown--;
      if (Freddy.currentCountdown <= 0 && !user.camerasOn) {
        moveAnimatronic(Freddy, { start: currentPosition, end: endingPosition });
        freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
        playAudio('freddy-move');
        clearInterval(freddyCountdown);
      } else if (Freddy.currentCountdown <= 0 && user.camerasOn) {
        addReport(Freddy, 'waiting for cameras down');
      }
    }, secondLength / framesPerSecond);
  } else {
    addReport(Freddy, 'failed movement check', movementCheck);
  }
};

// ========================================================================== //
// BONNIE AND CHICA
// Bonnie and Chica share much of the same logic with only minor differences.
// ========================================================================== //

const moveBonnieOrChica = (animatronic: Animatronic) => {
  // Figure out which set of details we need to use depending on whether it's Bonnie or Chica we're dealing with
  const name = animatronic.name;
  const newPosition = name === 'Bonnie' ? calculateNewBonniePosition() : calculateNewChicaPosition();
  const hallCorner = name === 'Bonnie' ? '2B' : '4B';
  const doorClosed = name === 'Bonnie' ? user.leftDoorIsClosed : user.rightDoorIsClosed;
  const doorClosedMessage = name === 'Bonnie' ? 'left door closed' : 'right door closed';

  const movementCheck = makeMovementCheck(animatronic);

  if (animatronic.currentAIlevel === 0) {
    addReport(animatronic, 'AI level 0');

    // They can move, aren't in their hall corner
  } else if (movementCheck.canMove && animatronic.currentPosition !== hallCorner) {
    moveAnimatronic(animatronic, { start: animatronic.currentPosition, end: newPosition }, true, movementCheck);

    if (animatronic.name === 'Chica' && newPosition === '6') {
      playAudio('oven');
    }

    // If they're at their hall corner but aren't in your doorway yet, move them into the doorway
  } else if (movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition === -1) {
    moveAnimatronic(animatronic, { start: hallCorner, end: hallCorner, sub: 1 }, false);
    addReport(animatronic, 'in the doorway', movementCheck);

    // Passed a movement check, is already in the doorway and the door is not closed, they can get into your office!
  } else if (
    movementCheck.canMove &&
    animatronic.currentPosition === hallCorner &&
    animatronic.subPosition !== -1 &&
    !doorClosed
  ) {
    moveAnimatronic(animatronic, { start: hallCorner, end: 'office', sub: -1 }, false);
    addReport(animatronic, 'enter office bonnie or chica', movementCheck);
    animatronic.stats.officeAttempts++;

    if (name === 'Bonnie') {
      clearInterval(bonnieInterval);
      bonnieInterval = window.setInterval(() => {
        if (Math.random() * 3 > 2) {
          playAudio('breath');
          clearInterval(bonnieInterval);
        }
      });
    } else {
      clearInterval(chicaInterval);
      chicaInterval = window.setInterval(() => {
        if (Math.random() * 3 > 2) {
          playAudio('breath');
          clearInterval(chicaInterval);
        }
      });
    }

    // Disable the doors and lights once the animatronic is in the office
    disableOfficeButtons();

    // They will jumpscare you in 30 seconds or when you next bring the cameras down - whichever comes first.

    if (name === 'Bonnie') {
      bonnieJumpscareCountdown = window.setTimeout(gameOverBonnie, secondLength * 30);
      window.addEventListener('cameras-off', gameOverBonnie);
    } else {
      chicaJumpscareCountdown = window.setTimeout(gameOverChica, secondLength * 30);
      window.addEventListener('cameras-off', gameOverChica);
    }

    // He meets all the critera to enter the office but the door is closed. He will return to the dining area
  } else if (
    movementCheck.canMove &&
    animatronic.currentPosition === hallCorner &&
    animatronic.subPosition !== -1 &&
    doorClosed
  ) {
    moveAnimatronic(animatronic, { start: hallCorner, end: '1B', sub: -1 }, false);
    addReport(animatronic, doorClosedMessage, movementCheck, '1B');

    // The conditions were right to enter the office but they failed their movement check
  } else if (
    !movementCheck.canMove &&
    animatronic.currentPosition === hallCorner &&
    animatronic.subPosition !== -1 &&
    !user.leftDoorIsClosed
  ) {
    addReport(animatronic, 'enter office failed movement check doorway', movementCheck);

    // Failed a bog standard movement check with no other fancy conditions
  } else if (!movementCheck.canMove) {
    addReport(animatronic, 'failed movement check', movementCheck);
  } else {
    addReport(animatronic, 'debug');
  }
};

// Bonnie does not have to chose adjacent rooms. He can pick at random from a list of approved locations.
const calculateNewBonniePosition = () => {
  const possibleLocations = ['1B', '3', '5', '2A', '2B'];
  const choice = Math.floor(Math.random() * possibleLocations.length);
  return possibleLocations[choice] as Position;
};

// Chica can only choose cameras adjacent to where she already is.
const calculateNewChicaPosition = () => {
  let randomChoice = Math.round(Math.random());
  let newPosition = '';

  let choices;
  switch (Chica.currentPosition) {
    case '1A':
      newPosition = '1B';
      break;
    case '1B':
      choices = ['4A', '6', '7'];
      newPosition = choices[Math.floor(Math.random() * choices.length)];
      break;
    case '6':
      choices = ['1B', '7'];
      newPosition = choices[Math.floor(Math.random() * choices.length)];
      playAudio('oven');
    case '7':
      choices = ['1B', '6'];
      newPosition = choices[Math.floor(Math.random() * choices.length)];
      break;
    case '4A':
      newPosition = randomChoice === 0 ? '1B' : '4B';
      break;
  }

  return newPosition as Camera;
};

const moveAnimatronic = (
  animatronic: Animatronic,
  position: {
    start: Position;
    end: Position;
    sub?: number;
  },
  logThis: boolean = true,
  movementCheck?: MovementCheck | undefined
) => {
  animatronic.currentPosition = position.end;
  animatronic.subPosition = position.sub ?? -1;

  if (logThis) {
    addReport(animatronic, 'has moved', movementCheck, {
      currentPosition: position.start,
      endPosition: position.end,
    });
  }

  // Update the cameras if you're looking at their start or end position
  if (user.camerasOn && (user.currentCamera === position.start || user.currentCamera === position.end)) {
    cameraArea.classList.add('updating');
    playAudio('animatronic-camera-move');
  }

  window.setTimeout(() => {
    cameraScreen.src = getCameraImage(user.currentCamera);
    cameraArea.classList.remove('updating');
  }, secondLength * 5);

  document.querySelector(`.animatronic#${animatronic.name}`)?.setAttribute('position', position.end);
  document
    .querySelector(`.animatronic#${animatronic.name}`)
    ?.setAttribute('sub-position', position.sub?.toString() ?? 'none');
};

// ========================================================================== //
// REPORTING
// ========================================================================== //

type messagingType =
  | 'debug' // Used for debugging purposes to report something, anything
  | 'AI level 0'
  | 'increase AI level' // Used when animatronics gain their AI level increases throughout the night
  | 'increase AI level max' // When animatronics could have gained an AI level boost but they're already at level 20
  | 'enter office failed movement check doorway'
  | 'in the doorway' // The animatronic is in the doorway
  | 'camera auto fail' // The animatronic automatically fails movement checks when cameras are on
  | 'failed movement check' // Generic failed movement check
  | 'freddy office failed movement check' // Failed movement check while animatronic is in the office
  | 'freddy and camera at 4B' // Freddy auto fails all movement checks while both he and the camera are at 4B
  | 'left door closed'
  | 'right door closed'
  | 'enter office bonnie or chica'
  | 'enter office failed movement check' // Animatronic could have entered the office but failed their movement check
  | 'enter office cameras off' // Animatronic passed the check to enter the office but couldn't because the cameras were off
  | 'in the office' // Animatronic is in the office
  | 'waiting for cameras down' // Animatronic is ready to move but waiting for the cameras to go down
  | 'jumpscare' // Animatronic successfully achieved a jumpscare
  | 'has moved' // Animatronic is moving
  | 'freddy successful movement check' // Freddy has passed a movement check
  | 'freddy bonnie and chica on stage' // Freddy can't leave the stage while Bonnie and/or Chica are still there
  | 'freddy and bonnie on stage' // Freddy can't leave the stage while Bonnie and/or Chica are still there
  | 'freddy and chica on stage' // Freddy can't leave the stage while Bonnie and/or Chica are still there
  | 'power outage - freddy not arrived'
  | 'power outage - freddy has arrived'
  | 'power outage - freddy is waiting to jumpscare'
  | 'power outage - freddy failed to arrive'
  | "power outage - freddy's song didn't end"
  | "power outage - freddy didn't jumpscare"
  | 'foxy paused'
  | 'foxy failed pirate cove movement check'
  | 'foxy successful pirate cove movement check' // Foxy has passed a movement check while at Pirate Cove. Not one where he can leave.
  | 'foxy left door closed'
  | 'foxy coming down hall'
  | 'foxy leaving pirate cove'; // Foxy is leaving Pirate cove

const pluralise = (number: number, word: string) => {
  let plural = number > 1 ? 's' : '';
  return word + plural;
};

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

const addReport = (
  animatronic: Animatronic,
  reason: messagingType,
  movementCheck: MovementCheck | null = null,
  additionalInfo: any = null // Some reports need to pass in some additional info. This can take different formats so is allowed to be an 'any' type
) => {
  // Figuring out what the message actually should be
  let message = '';
  let type: 'bad' | 'good' | 'info' | 'warning' | 'alert' | 'death-zone' = 'info';
  let preventDuplicates = false;
  const stats = movementCheck
    ? `<div class="report-extra-info">Score to beat: ${Math.ceil(movementCheck.scoreToBeat)} ${
        animatronic.name
      }'s AI level: ${movementCheck.aiLevel}</div>`
    : '';

  switch (reason) {
    case 'debug':
      message = `Something happened`;
      break;

    case 'power outage - freddy not arrived':
      message =
        'Your power has run out. Freddy has a 20% chance of arriving at your office every 5 seconds, up to a maximum of 20 seconds.';
      type = 'death-zone';
      break;

    case 'power outage - freddy has arrived':
      message =
        'Freddy has arrived at your office. His song has a 20% chance of ending every 5 seconds, up to a maxmimum of 20 seconds';
      type = 'death-zone';
      break;

    case 'power outage - freddy is waiting to jumpscare':
      message = "Now Freddy's song has ended, he has a 20% chance of jumpscaring you every 2 seconds";
      type = 'death-zone';
      break;

    case 'power outage - freddy failed to arrive':
      message = `Freddy failed his check to arrive at the office. He will try up to ${additionalInfo} more ${pluralise(
        additionalInfo,
        'time'
      )}<div class="report-extra-info">20% chance every 5 seconds</div>`;
      break;

    case "power outage - freddy's song didn't end":
      message = `Freddy failed his check to end his song. He will continue for up to ${additionalInfo} more ${pluralise(
        additionalInfo,
        'second'
      )}<div class="report-extra-info">20% chance every 5 seconds</div>`;
      break;

    case "power outage - freddy didn't jumpscare":
      message = `Freddy failed his check to jumpscare you.<div class="report-extra-info">20% chance every 2 seconds</div>`;
      break;

    case 'AI level 0':
      message = `${animatronic.name}'s AI level is 0 and is unable to move.`;
      if (animatronic === Bonnie) {
        message += `<div class="report-extra-info">His AI level will increase at 2AM</div>`;
      } else if (animatronic === Chica || animatronic === Foxy) {
        message += `<div class="report-extra-info">${capitalise(
          animatronic.pronouns[1]
        )} AI level will increase at 3AM</div>`;
      }

      preventDuplicates = true;
      break;

    case 'in the doorway':
      const side = animatronic.name === 'Bonnie' ? 'left' : 'right';
      message = `${animatronic.name} is in your ${side} doorway!`;
      type = 'alert';
      break;

    case 'increase AI level':
      message = `${animatronic.name}'s AI level has increased by 1 to ${animatronic.currentAIlevel}`;
      break;

    case 'increase AI level max':
      message = `${animatronic.name} could have increased their AI level but they are already at 20`;

    case 'camera auto fail':
      message = `${animatronic.name} will automatically fail all movement checks while the cameras are on`;
      preventDuplicates = true;
      break;

    case 'failed movement check':
      message = `${animatronic.name} has failed ${animatronic.pronouns[1]} movement check and will remain at cam ${
        animatronic.currentPosition
      } (${cameraNames[animatronic.currentPosition as Camera]}) ${stats}`;
      type = 'good';
      break;

    case 'freddy and camera at 4B':
      message = `Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.`;
      preventDuplicates = true;
      break;

    case 'right door closed':
      message = `${animatronic.name} was ready to enter your office but the right door was closed. ${capitalise(
        animatronic.pronouns[0]
      )} will return to cam ${additionalInfo} (${cameraNames[additionalInfo as Camera]})`;
      type = 'good';
      break;

    case 'left door closed':
      message = `${animatronic.name} was ready to enter your office but the left door was closed.
      ${capitalise(animatronic.pronouns[0])} will return to cam ${additionalInfo} (${
        cameraNames[additionalInfo as Camera]
      })`;
      type = 'good';
      break;

    case 'enter office bonnie or chica':
      message = `${animatronic.name.toUpperCase()} HAS ENTERED THE OFFICE
      <div class="report-extra-info">${capitalise(
        animatronic.pronouns[0]
      )} will jumpscare you in 30 seconds or the next time the camera goes down - whichever comes first</div>`;

      type = 'death-zone';
      preventDuplicates = true;
      break;

    case 'freddy office failed movement check':
      message = `Freddy is in your office but failed his movement check and was unable to jumpscare you. 
          <div class="report-extra-info">
          Score to beat: ${movementCheck?.scoreToBeat}/100   Freddy's score: ${movementCheck?.aiLevel}
          </div>`;
      type = 'death-zone';
      break;

    case 'enter office failed movement check':
      message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${
        animatronic.pronouns[1]
      } movement check. ${capitalise(animatronic.pronouns[0])} will continue to wait at cam ${
        animatronic.currentPosition
      } (${cameraNames[animatronic.currentPosition as Camera]}) ${stats}`;
      type = 'alert';
      break;

    case 'enter office failed movement check doorway':
      let doorSide = animatronic.currentPosition === '2B' ? 'left' : 'right';

      message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${
        animatronic.pronouns[1]
      } movement check.
      ${capitalise(animatronic.pronouns[0])} will continue to wait in the ${doorSide} doorway ${stats}`;
      type = 'alert';
      break;

    case 'enter office cameras off':
      message = `${animatronic.name} passed ${
        animatronic.pronouns[1]
      } movement check to enter the office but couldn't because the cameras were off.
      ${capitalise(animatronic.pronouns[0])} will continue to wait at cam ${animatronic.currentPosition} (${
        cameraNames[animatronic.currentPosition as Camera]
      }) ${stats}`;
      type = 'warning';
      break;

    case 'in the office':
      message = `${animatronic.name.toUpperCase()} HAS ENTERED THE OFFICE`;
      type = 'death-zone';
      preventDuplicates = true;
      break;

    case 'waiting for cameras down':
      message = `${animatronic.name} is ready to move but is waiting for the cameras to go down`;
      preventDuplicates = true;
      break;

    case 'freddy successful movement check':
      message = `Freddy will move from
      ${additionalInfo.currentPosition} (${cameraNames[additionalInfo.currentPosition as Camera]})
      to ${additionalInfo.endingPosition} (${cameraNames[additionalInfo.endingPosition as Camera]})
      in ${additionalInfo.formattedWaitingTime} seconds
      ${stats}`;
      type = 'bad';
      break;

    case 'freddy and bonnie on stage':
      message = 'Freddy is unable to leave the stage while Bonnie is still there';
      preventDuplicates = true;
      break;

    case 'freddy and chica on stage':
      message = 'Freddy is unable to leave the stage while Chica is still there';
      preventDuplicates = true;
      break;

    case 'freddy bonnie and chica on stage':
      message = 'Freddy is unable to leave the stage while Bonnie and Chica are still there';
      preventDuplicates = true;
      break;

    case 'has moved':
      message = `${animatronic.name} has moved from cam ${additionalInfo.currentPosition} (${
        cameraNames[additionalInfo.currentPosition as Camera]
      }) to cam ${additionalInfo.endPosition} (${cameraNames[additionalInfo.endPosition as Camera]})`;
      if (movementCheck) {
        message += `<div class="report-extra-info">
        Score to beat: ${movementCheck?.scoreToBeat}  ${animatronic.name}'s score: ${movementCheck?.aiLevel}
        </div>`;
      }
      type = 'bad';
      break;

    case 'foxy successful pirate cove movement check':
      const stepsRemaining = 3 - Foxy.subPosition;
      message = `Foxy has made a successful movement check. He is ${stepsRemaining} ${pluralise(
        stepsRemaining,
        'step'
      )}&nbsp;away from leaving Pirate Cove ${stats}`;
      type = stepsRemaining === 1 ? 'warning' : 'bad';
      break;

    case 'foxy paused':
      message = `The cameras have just been turned off. Foxy will be unable to make movement checks for ${additionalInfo.toFixed(
        2
      )} seconds <div class="report-extra-info">Random number between 0.83 and 16.67</div>`;
      break;

    case 'foxy failed pirate cove movement check':
      let stepsRemainingB = 3 - Foxy.subPosition;
      message = `Foxy has failed his movement check. He is still ${stepsRemainingB} ${pluralise(
        stepsRemainingB,
        'step'
      )} away from leaving 1C (${cameraNames['1C']}) ${stats}`;
      type = 'good';
      break;

    case 'foxy leaving pirate cove':
      message = `FOXY HAS LEFT ${cameraNames['1C'].toUpperCase()}
      <div class="report-extra-info">He will attempt to jumpscare you in 25 seconds or when you next look at cam 2A, whichever comes first</div>`;
      type = 'alert';
      break;

    case 'foxy left door closed':
      message = `Foxy attempted to enter your office but the left door was closed. He has drained ${
        additionalInfo.powerDrainage
      }% of your power and returned to cam 1C (${cameraNames['1C']}) at step ${additionalInfo.restartSubPosition + 1}
      <div class="report-extra-info">Restarting step chosen at random from 1 & 2</div>`;
      type = 'good';
      break;

    case 'foxy coming down hall':
      message = 'FOXY IS COMING DOWN THE HALL. HE WILL ATTEMPT TO JUMPSCARE YOU IN 1.87 SECONDS';
      type = 'death-zone';
      break;

    case 'jumpscare':
      message = `${animatronic.name} successfully jumpscared you`;
      type = 'death-zone';
      break;
  }

  let reportToAddTo = document.querySelector(`.animatronic-report[for="${animatronic.name}"] .report-item-container`);

  let firstReport = reportToAddTo?.querySelector('.report-item');
  if (preventDuplicates && firstReport && firstReport.innerHTML.indexOf(message) > 0) {
    return;
    // Don't do anything here
  } else if (reportToAddTo) {
    const InGameTime = calculateInGameTime();

    reportToAddTo.innerHTML = `

    <div class="report-item" type="${type}">
    <span class="report-time">${InGameTime.hour}:${InGameTime.minute}AM</span>
    <div class="report-description">${message}</div></div>
    ${reportToAddTo?.innerHTML ?? ''}
  `;
  }
};

// ========================================================================== //
// IMAGES FOR INDIVIDUAL CAMERAS
// I wish it were simple as figuring out which animatronics were at the current
// location and just giving it an image. It isn't.
// Freddy will only show on a cam if he's the only one at his location.
// Foxy will always be the only one to show at his location.
// Some locations and animatronics have more than one image option.
// ========================================================================== //

const getCameraImage = (cam: Camera) => {
  let camImageSrc = '';

  switch (cam) {
    case '1A':
      camImageSrc = generateCamImage1A();
      break;
    case '1B':
      camImageSrc = generateCamImage1B();
      break;
    case '1C':
      camImageSrc = generateCamImage1C();
      break;
    case '2A':
      camImageSrc = generateCamImage2A();
      break;
    case '2B':
      camImageSrc = generateCamImage2B();
      break;
    case '3':
      camImageSrc = generateCamImage3();
      break;
    case '4A':
      camImageSrc = generateCamImage4A();
      break;
    case '4B':
      camImageSrc = generateCamImage4B();
      break;
    case '5':
      camImageSrc = generateCamImage5();
      break;
    case '6':
      camImageSrc = '6.webp';
      break;
    case '7':
      camImageSrc = generateCamImage7();
      break;
  }

  return `${paths.cameras}/${camImageSrc}`;
};

const getLocationInfo = (cam: Camera) => {
  const bonnieIsHere = Bonnie.currentPosition === cam;
  const chicaIsHere = Chica.currentPosition === cam;
  const foxyIsHere = Foxy.currentPosition === cam;
  const freddyIsHere = Freddy.currentPosition === cam;
  const bonnieIsAlone = bonnieIsHere && !chicaIsHere && !foxyIsHere && !freddyIsHere;
  const chicaIsAlone = !bonnieIsHere && chicaIsHere && !foxyIsHere && !freddyIsHere;
  // const foxyIsAlone = !bonnieIsHere && !chicaIsHere && foxyIsHere && !freddyIsHere; // Do I ever actually need to know whether Foxy is alone?
  const freddyIsAlone = !bonnieIsHere && !chicaIsHere && !foxyIsHere && freddyIsHere;
  const isEmpty = !bonnieIsHere && !chicaIsHere && !foxyIsHere && !freddyIsHere;

  return {
    bonnieIsHere,
    chicaIsHere,
    foxyIsHere,
    freddyIsHere,
    bonnieIsAlone,
    chicaIsAlone,
    freddyIsAlone,
    isEmpty,
  };
};

// Chance should be the 1 in X number chance it has
const randomise = (chance: number): boolean => Math.random() < 1 / chance;

// Note - Foxy can never be here.
const generateCamImage1A = (): string => {
  const info = getLocationInfo('1A');

  // Bonnie, Chica and Freddy are all here
  if (info.bonnieIsHere && info.chicaIsHere && info.freddyIsHere) {
    return `1A-bonnie-chica-freddy.webp`;
  }

  // Chica and Freddy are here
  if (!info.bonnieIsHere && info.chicaIsHere && info.freddyIsHere) {
    return `1A-chica-freddy.webp`;
  }

  // Bonnie and Freddy are here
  if (info.bonnieIsHere && !info.chicaIsHere && info.freddyIsHere) {
    return `1A-bonnie-freddy.webp`;
  }

  if (info.freddyIsAlone) {
    // UNKNOWN - I can't find info on the chances of Freddy facing right rather than the camera
    let randomiser = randomise(8) ? '-2' : '-1';
    return `1A-freddy${randomiser}.webp`;
  }

  // If we've reached this point it must be empty
  return `1A-empty.webp`;
};

// Freddy will only show if he's alone. Bonnnie will only show if Chica isn't there.
const generateCamImage1B = (): string => {
  const info = getLocationInfo('1B');
  const randomiser = randomise(3) ? '-2' : '-1';

  if (info.chicaIsHere) {
    return `1B-chica${randomiser}.webp`;
  }

  if (info.bonnieIsHere) {
    return `1B-bonnie${randomiser}.webp`;
  }

  if (info.freddyIsAlone) {
    return '1B-freddy.webp';
  }

  return '1B-empty.webp';
};

// Foxy is the only one who can be here. Exactly which image is shown depends
// on how close he is to leaving Pirate Cove.
const generateCamImage1C = (): string => {
  let { foxyIsHere } = getLocationInfo('1C');

  if (foxyIsHere) {
    return `1C-foxy-${Foxy.subPosition}.webp`;
  }

  let emptyRandomiser = randomise(10) ? '-its-me' : '-default';
  return `1C-empty${emptyRandomiser}.webp`;
};

const generateCamImage2A = () => {
  let info = getLocationInfo('2A');

  if (info.foxyIsHere) {
    return '2A-foxy.webp';
  }

  if (info.bonnieIsHere) {
    return '2A-bonnie.webp';
  }

  return '2A-empty.webp';
};

// Bonnie is the only one who can be here.
// This code does not currently deal with the unlikely prospect of Golden Freddy
const generateCamImage2B = (): string => {
  let info = getLocationInfo('2B');

  // There are 3 different options for Bonnie's images, with some being more
  // likely than others.
  if (info.bonnieIsHere && Bonnie.subPosition === -1) {
    let bonnieRandomiser = Math.ceil(Math.random() * 8);
    if (bonnieRandomiser === 1 && nightToSimulate >= 3) {
      playAudio('robot-voice');
      return '2B-bonnie-3.webp';
    } else if (bonnieRandomiser > 6) {
      return '2B-bonnie-2.webp';
    } else {
      return '2B-bonnie-1.webp';
    }
  }

  let emptyRandomiser = randomise(4) ? '-2' : '-1';
  return `2B-empty${emptyRandomiser}.webp`;
};

// Bonnie is the only animatronic who can be here, and only has one image :)
const generateCamImage3 = (): string => (getLocationInfo('3').bonnieIsHere ? '3-bonnie.webp' : '3-empty.webp');

// Freddy or Chica may be here
const generateCamImage4A = (): string => {
  const info = getLocationInfo('4A');

  if (info.chicaIsHere) {
    let randomiser = randomise(3) ? '-2' : '-1';
    return `4A-chica${randomiser}.webp`;
  }

  if (info.freddyIsAlone) {
    return '4A-freddy.webp';
  }

  // There are 3 image options for empty, with one of them being FAR more likely
  // than the others
  let emptyRandomiser = Math.ceil(Math.random() * 10);
  if (emptyRandomiser === 1) {
    return `4A-empty-1.webp`;
  } else if (emptyRandomiser === 2) {
    return `4A-empty-2.webp`;
  } else {
    return '4A-empty-default.webp';
  }
};

// Freddy or Chica may be here.
const generateCamImage4B = (): string => {
  let info = getLocationInfo('4B');

  if (info.freddyIsAlone) {
    return '4B-freddy.webp';
  }

  if (info.chicaIsHere && Chica.subPosition === -1) {
    let chicaRandomiser = Math.ceil(Math.random() * 6);
    if (chicaRandomiser === 1 && nightToSimulate >= 3) {
      playAudio('robot-voice');
      return '4B-chica-3.webp';
    } else if (chicaRandomiser === 2) {
      return '4B-chica-2.webp';
    } else {
      return '4B-chica-1.webp';
    }
  }

  // It must be empty if we've reached this point
  // There are 5 image options here, with one being FAR more likely than the others
  let emptyRandomiser = Math.ceil(Math.random() * 30);
  if (emptyRandomiser === 1) {
    return '4B-empty-4.webp';
  } else if (emptyRandomiser === 2) {
    return '4B-empty-3.webp';
  } else if (emptyRandomiser === 3) {
    return '4B-empty-3.webp';
  } else if (emptyRandomiser === 4) {
    return '4B-empty-2.webp';
  } else if (emptyRandomiser === 5) {
    return '4B-empty-1.webp';
  } else {
    return '4B-empty-default.webp';
  }
};

// Bonnie is the only animatronic who can be here. There are 2 options for
// Bonnie and 2 options for empty
const generateCamImage5 = (): string => {
  let randomiser = randomise(8) ? '-2' : '-1';
  return getLocationInfo('5').bonnieIsHere ? `5-bonnie${randomiser}.webp` : `5-empty${randomiser}.webp`;
};

const generateCamImage7 = (): string => {
  let info = getLocationInfo('7');

  if (info.freddyIsAlone) {
    return '7-freddy.webp';
  }

  if (info.chicaIsHere) {
    let randomiser = randomise(8) ? '-2' : '-1';
    return `7-chica${randomiser}.webp`;
  }

  return '7-empty.webp';
};

// ========================================================================== //
// CAMERAS
// ========================================================================== //

const toggleCameras = () => {
  user.camerasOn = !user.camerasOn;
  document.body.setAttribute('cameras-on', String(user.camerasOn));
  cameraButton.setAttribute('active', String(user.camerasOn));
  cameraStatusText.textContent = user.camerasOn ? '' : 'CAMERAS ARE OFF';
  user.camerasToggled++;

  if (user.camerasOn) {
    lookAtCamera(user.currentCamera);
    playAudio('camera-toggle-on');
    playAudio('camera-toggle-off');
  }
  if (!user.camerasOn) {
    window.dispatchEvent(new Event('cameras-off'));
    killAudio('camera-toggle-on');
    killAudio('camera-feed');
    killAudio('animatronic-camera-move');
    killAudio('garble');
  }

  setAudioVolumes();

  updatePowerDisplay();
};

const generateCameraButtons = () => {
  cameraScreen.src = getCameraImage(defaultCamera);
  for (const key in cameraNames) {
    const myCameraButton = document.createElement('button');
    myCameraButton.classList.add('camera-button');
    if (key === defaultCamera) {
      myCameraButton.classList.add('active');
    }
    myCameraButton.textContent = `CAM ${key}`;
    myCameraButton.setAttribute('camera', key);
    simulator.appendChild(myCameraButton);

    myCameraButton.addEventListener('click', () => {
      document.querySelectorAll('.camera-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      myCameraButton.classList.add('active');
      user.currentCamera = key as Camera;
      user.camerasLookedAt++;

      if (user.camerasOn) {
        lookAtCamera(user.currentCamera);
      }
    });
  }
};

// We need to listen for certain cameras in certain situations.
// This will publish an event when a given camera is being looked at
const lookAtCamera = (camera: Camera) => {
  window.dispatchEvent(new Event(`cam-on-${camera}`));
  console.log(`cam-on-${camera}`);
  cameraScreen.src = getCameraImage(camera);
  playAudio('camera-change');

  if (Math.random() * 10 > 7) {
    playAudio('garble');
  }

  setAudioVolumes();
};

// ========================================================================== //
// DOORS
// ========================================================================== //

const initialiseDoors = () => {
  ['left', 'right'].forEach((direction) => {
    // Create door buttons
    let myButton = document.createElement('button') as HTMLButtonElement;
    myButton.classList.add('door-button');
    // myButton.textContent = `${direction} door`;
    myButton.setAttribute('door', direction);
    document.querySelector('#controls')?.append(myButton);

    // Make the door buttons toggle the doors
    myButton.addEventListener('click', () => {
      if (!myButton.classList.contains('error-state')) {
        myButton.classList.toggle('active');
        simulator.querySelector(`g#${direction}-door-close-icon`)?.classList.toggle('hidden');

        // Note - I could simplify this using else, but I'm leaving it like this to future proof it
        // Other FNAF games have doors in directions other than left and right.
        if (direction === 'left') {
          user.leftDoorIsClosed = !user.leftDoorIsClosed;
          user.leftDoorToggled++;
        }

        if (direction === 'right') {
          user.rightDoorIsClosed = !user.rightDoorIsClosed;
          user.rightDoorToggled++;
        }

        updatePowerDisplay();
        playAudio('door-toggle');
      }
    });
  });
};

const disableOfficeButtons = () => {
  document.querySelectorAll('#controls button').forEach((btn) => {
    btn.classList.add('error-state');
    btn.addEventListener('click', (e) => {
      playAudio('error');
    });
  });
};

// ========================================================================== //
// LIGHTS
// ========================================================================== //

type LightDirection = 'left' | 'right';

const initialiseLights = () => {
  const lightControlsContainer = document.querySelector('#controls');

  ['left', 'right'].forEach((direction) => {
    const lightButton = document.createElement('button');
    lightButton.classList.add('light-button');
    // lightButton.textContent = `${direction} light`;
    lightButton.setAttribute('door', direction);
    lightButton.addEventListener('click', () => {
      if (!lightButton.classList.contains('error-state')) {
        toggleLight(direction as LightDirection);
      }
    });
    lightControlsContainer?.appendChild(lightButton);
  });
};

const toggleLight = (direction: LightDirection) => {
  let matchingDoorway = direction === 'left' ? '2B' : '4B';

  if (direction === 'left') {
    user.leftLightIsOn = !user.leftLightIsOn;
    if (!user.leftLightIsOn) {
      killAudio('light-left');
    }
    clearTimeout(leftLightTimeout);
  } else {
    user.rightLightIsOn = !user.rightLightIsOn;
    if (!user.rightLightIsOn) {
      killAudio('light-right');
    }
    clearTimeout(rightLightTimeout);
  }

  if ((direction === 'left' && user.leftLightIsOn) || (direction === 'right' && user.rightLightIsOn)) {
    [Bonnie, Chica, Foxy, Freddy].forEach((animatronic) => {
      if (animatronic.currentPosition === matchingDoorway && animatronic.subPosition !== -1) {
        playAudio('doorway-warning');
      }
    });

    playAudio(`light-${direction}`);
  }

  if (direction === 'left' && user.leftLightIsOn) {
    leftLightTimeout = window.setTimeout(() => {
      timeoutLight('left');
    }, 5 * secondLength); // TODO - CHECK HOW LONG THE LIGHTS ACTUALLY STAY ON IF YOU DON'T TURN THEM OFF
  }

  if (direction === 'right' && user.rightLightIsOn) {
    rightLightTimeout = window.setTimeout(() => {
      timeoutLight('right');
    }, 5 * secondLength); // TODO - CHECK HOW LONG THE LIGHTS ACTUALLY STAY ON IF YOU DON'T TURN THEM OFF
  }

  displayLightVisuals();
};

const timeoutLight = (direction: LightDirection) => {
  if (direction === 'left' && user.leftLightIsOn) {
    user.leftLightIsOn = false;
    killAudio('light-left');
  } else if (direction === 'right' && user.rightLightIsOn) {
    user.rightLightIsOn = false;
    killAudio('light-right');
  }

  displayLightVisuals();
};

const displayLightVisuals = () => {
  simulator.setAttribute('left-light-on', user.leftLightIsOn.toString());
  simulator.setAttribute('right-light-on', user.rightLightIsOn.toString());
  updatePowerDisplay();
};

// ========================================================================== //
// DEATH
// ========================================================================== //

// Clear all the intervals and timeouts so the game stops running
const clearAllIntervals = (gameOver = true) => {
  const intervalsToClear = [
    bonnieInterval,
    chicaInterval,
    foxyInterval,
    foxyCooldown,
    freddyInterval,
    freddyCountdown,
    defaultPowerDrainInterval,
    additionalPowerDrainInterval,
    powerOutageInterval,
    pirateSongInterval,
    circusInterval,
    eerieInterval,
    ambienceInterval,
    coldPresenceInterval,
  ];

  const timeoutsToClear = [
    leftLightTimeout,
    rightLightTimeout,
    foxyJumpscareCountdown,
    bonnieJumpscareCountdown,
    chicaJumpscareCountdown,
  ];

  // It's possible to reach this function when you've run out of power, so the game isn't over quite yet.
  // We want to stop the animatronics etc from doing anything, but the timer should still be running in this case.
  if (gameOver) {
    intervalsToClear.push(timeUpdate, frameUpdate);
  }

  intervalsToClear.forEach((interval) => {
    clearInterval(interval);
  });

  timeoutsToClear.forEach((timeout) => {
    clearTimeout(timeout);
  });
};

const gameOver = (reason: Animatronic | '6AM') => {
  killAudio(null);

  if (reason === '6AM') {
    playAudio('6AM');
  } else {
    playAudio('jumpscare');
  }
  document.body.setAttribute('game-in-progress', 'false');
  document.querySelector('#sound-prompt')?.remove();
  clearAllIntervals();

  let gameOverWindow = document.querySelector('#game-over-stats')!;

  const generateStatsTable = (animatronic: Animatronic) => {
    let myStats = `
      <div class="stats-report" for="${animatronic.name}">
        <h3>${animatronic.name}</h3>
        <div class="animatronic-icon"></div>
        <div>Successful movement checks: <span>${animatronic.stats.successfulMovementChecks}</span></div>
        <div>Failed movement checks: <span>${animatronic.stats.failedMovementChecks}</span></div>
        <div>Attempts to get into office: <span>${animatronic.stats.officeAttempts}</span></div>
      </div>
    `;

    return myStats;
  };

  const gameOverTitle = reason === '6AM' ? 'CONGRATULATIONS!' : 'GAME OVER';
  const gameOverMessage = reason === '6AM' ? 'You survived until 6AM' : `You were jumpscared by ${reason.name}`;

  gameOverWindow.innerHTML = `
    <h2>${gameOverTitle}</h2>
    <h3>${gameOverMessage}</h3>
    <div class="stats-report" for="user">
      <h3>You</h3>
      <div class="animatronic-icon"></div>
      <div>Cameras turned on/off </span>${user.camerasToggled}</span> times</div>
      <div>Cameras looked at: </span>${user.camerasLookedAt}</span></div>
      <div>Left door toggled <span>${user.leftDoorToggled}</span> times</div>
      <div>Right door toggled <span>${user.rightDoorToggled}</span> times</div>
    </div>
    ${generateStatsTable(Freddy)}
    ${generateStatsTable(Bonnie)}
    ${generateStatsTable(Chica)}
    ${generateStatsTable(Foxy)}
    <button id="new-game" onclick="location.reload();">Start a new game</button>
  `;
};

const gameOverBonnie = () => {
  addReport(Bonnie, 'jumpscare');
  window.dispatchEvent(new Event('game-over-bonnie'));
};

const gameOverChica = () => {
  addReport(Chica, 'jumpscare');
  window.dispatchEvent(new Event('game-over-chica'));
};

const gameOverFoxy = () => {
  addReport(Foxy, 'jumpscare');
  window.dispatchEvent(new Event('game-over-foxy'));
};

const gameOverFreddy = () => {
  addReport(Freddy, 'jumpscare');
  window.dispatchEvent(new Event('game-over-freddy'));
};

window.addEventListener('game-over-bonnie', () => {
  gameOver(Bonnie);
});
window.addEventListener('game-over-chica', () => {
  gameOver(Chica);
});
window.addEventListener('game-over-foxy', () => {
  gameOver(Foxy);
});
window.addEventListener('game-over-freddy', () => {
  gameOver(Freddy);
});

// ========================================================================== //
// POWER
// ========================================================================== //

// The additional penalties on time - an additional 1% every X seconds
// Again, I've added a 0 to the start of this so night 1 is at index 1 and so on for more readable code
const additionalPowerDrainageIntervalSpacing = [0, 9.6, 6, 5, 4, 3, 3, 3];

const drainPower = () => {
  user.power -= calculatePowerDrain();
  if (user.power <= 0) {
    clearAllIntervals(false);
    powerOutage();
  }

  updatePowerDisplay();
};

const calculatePowerDrain = () => {
  let defaultPowerDrain = 0.1 * calculatePowerDrainMultiplier();
  let nightlyBuffPowerDrain = nightToSimulate > 1 ? 0.1 / additionalPowerDrainageIntervalSpacing[nightToSimulate]! : 0;

  return (defaultPowerDrain + nightlyBuffPowerDrain) / 10; // We are running this every 0.1 seconds, hence the /10
};

const calculatePowerDrainMultiplier = () => {
  // You lose a default amount of power, multiplied for each door/light/camera you have on, up to a maximum of 4x
  // The first item in this array is true as the multiplier needs to be at least 1
  const usage = [
    true,
    user.leftDoorIsClosed,
    user.rightDoorIsClosed,
    user.camerasOn,
    user.leftLightIsOn,
    user.rightLightIsOn,
  ].filter(Boolean).length;
  return usage > 4 ? 4 : usage;
};

const updatePowerDisplay = () => {
  const secondsOfGameRemaining = 535 - currentSecond;
  const secondsOfPowerRemaining = Math.ceil(user.power / (calculatePowerDrain() * 10)); // x10 as this function calculates for 0.1 seconds

  const timeUserWillRunOutOfPower = calculateInGameTime(secondsOfPowerRemaining);

  const timeMessaging =
    parseInt(timeUserWillRunOutOfPower.hour) >= 6
      ? `You have enough power to last until 6AM`
      : `You will run out of power at <b>${timeUserWillRunOutOfPower.hour}:${timeUserWillRunOutOfPower.minute}AM</b>`;

  let powerToDisplay = user.gameMode ? user.power.toFixed(0) : user.power.toFixed(1);

  powerDisplay.innerHTML = `
    <div id="main-power-info">
      <div id="power-percentage">
        Power left: ${powerToDisplay.toString()}%
      </div>
      <div id="power-usage" multiplier="${calculatePowerDrainMultiplier().toString()}">
        <span>Usage: </span>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
    <div id="power-time">
      <h3>Based on current usage:</h3>
      <div>${timeMessaging}</div>
      <div>Seconds of power remaining: ${secondsOfPowerRemaining}</div>
      <div>Seconds of game remaining: ${secondsOfGameRemaining}</div>
    </div>
  `;
};

// The sequence of events between you running out of power and Freddy jumpscaring you.
const powerOutage = () => {
  officeDisplay.src = `${paths.office}/office-no-power.webp`;
  let i = 0;
  addReport(Freddy, 'power outage - freddy not arrived');
  playAudio('power-outage');
  document.querySelector('#office-overlay')?.classList.remove('hidden');

  const awaitFreddyArrival = () => {
    i += 1;
    if (randomise(5) || i >= 4) {
      officeDisplay.src = `${paths.office}/freddy-no-power.webp`;
      clearInterval(powerOutageInterval);
      powerOutageInterval = window.setInterval(toreadorMarch, secondLength * 5);
      addReport(Freddy, 'power outage - freddy has arrived');
      playAudio('toreador-march');
      i = 0;
    } else {
      addReport(Freddy, 'power outage - freddy failed to arrive', null, 4 - i);
    }
  };

  powerOutageInterval = window.setInterval(awaitFreddyArrival, secondLength * 5);

  // Once Freddy has arrived, he will start playing his song, which has a 20% chance of ending every 20 seconds, up to a maximum of 20 seconds when the lights will go out.
  const toreadorMarch = () => {
    i += 1;
    if (randomise(5) || i >= 4) {
      officeDisplay.src = `${paths.office}/office-dark.webp`;
      clearInterval(powerOutageInterval);
      addReport(Freddy, 'power outage - freddy is waiting to jumpscare', null, 4 - i);
      powerOutageInterval = window.setInterval(awaitFreddyFinalJumpscare, secondLength * 2);
      killAudio('toreador-march');
      killAudio('power-outage');
    } else {
      addReport(Freddy, "power outage - freddy's song didn't end", null, (4 - i) * 5);
    }
  };

  // Once the lights are out, you have a 20% chance every 2 seconds for him to jumpscare you
  const awaitFreddyFinalJumpscare = () => {
    if (randomise(5)) {
      gameOverFreddy();
    } else {
      addReport(Freddy, "power outage - freddy didn't jumpscare", null, 4 - i);
    }
  };

  // Note - you will still win the night if you reach 6AM after the power has gone out but before Freddy jumpscares you
};

// ========================================================================== //
// AUDIO
// ========================================================================== //

type AvailableAudio =
  | 'ambience'
  | 'cold-presence'
  | 'door-toggle'
  | 'doorway-warning'
  | 'eerie'
  | 'error'
  | 'foxy-door-bash'
  | 'foxy-run'
  | 'freddy-move'
  | 'freddy-nose'
  | 'game-menu'
  | 'garble'
  | 'jumpscare'
  | 'jumpscare-golden-freddy'
  | 'light-left'
  | 'light-right'
  | 'office-fan'
  | 'oven'
  | 'pirate-song'
  | 'post-jumpscare'
  | 'power-outage'
  | 'robot-voice'
  | 'toreador-march'
  | '6AM'
  | 'animatronic-camera-move'
  | 'breath'
  | 'camera-change'
  | 'camera-feed'
  | 'camera-toggle-off'
  | 'camera-toggle-on'
  | 'cheer'
  | 'phone-guy'
  | 'circus';

const playAudio = (audio: AvailableAudio) => {
  // Audio that should loop
  const loopingAudio = ['office-fan', 'camera-feed'];
  let blockMultiples = Boolean(document.querySelector(`audio.${audio}`));

  // Some audio types should be randomly picked from a number of available files
  let myAudioSource;
  switch (audio) {
    case 'oven':
      myAudioSource = `oven-${Math.ceil(Math.random() * 4)}`;
      document.querySelector('#kitchen-audio-graphic')?.setAttribute('visible', 'true');
      break;
    case 'breath':
      myAudioSource = `breath-${Math.ceil(Math.random() * 4)}`;
      break;
    case 'freddy-move':
      myAudioSource = `freddy-move-${Math.ceil(Math.random() * 3)}`;
      break;
    case 'garble':
      myAudioSource = `garble-${Math.ceil(Math.random() * 3)}`;
      break;
    case 'phone-guy':
      myAudioSource = `phone-guy-night-${nightToSimulate}`;
      break;
    case 'light-left':
    case 'light-right':
    case 'door-toggle':
    case 'doorway-warning':
      blockMultiples = false;
    default:
      myAudioSource = audio;
  }

  if (user.audioOn && !blockMultiples) {
    let myAudio = document.createElement('audio');
    myAudio.classList.add(audio);
    myAudio.src = `${paths.audio}/${myAudioSource}.mp3`;
    if (loopingAudio.includes(audio)) {
      myAudio.setAttribute('loop', 'true');
    }
    document.body.appendChild(myAudio);
    myAudio.play();
    myAudio.onended = () => {
      document.body.removeChild(myAudio);

      if (audio === 'oven') {
        document.querySelector('#kitchen-audio-graphic')?.removeAttribute('visible');
      }

      if (audio === 'phone-guy') {
        document.querySelector('button#mute-call')?.remove();
      }
    };
  }

  if (audio === 'jumpscare') {
    window.setTimeout(() => {
      playAudio('post-jumpscare');
    }, 5000);
  } else if (audio === '6AM') {
    window.setTimeout(() => {
      playAudio('cheer');
    }, 5500);
  }

  setAudioVolumes();
};

// Passing in null will kill all audio
const killAudio = (audio: AvailableAudio | null = null) => {
  const matchingAudio = audio ? document.querySelectorAll(`audio.${audio}`) : document.querySelectorAll(`audio`);
  matchingAudio.forEach((match) => {
    match.remove();
  });
};

// Update the audio volumes depending on certain conditions
const setAudioVolumes = () => {
  let audios = document.querySelectorAll('audio') as NodeListOf<HTMLAudioElement>;
  audios.forEach((audio) => {
    if (audio.classList.contains('office-fan')) {
      // Office fan should be quieter if we're looking at the cameras
      audio.volume = user.camerasOn ? 0.4 : 1;
    } else if (audio.classList.contains('oven')) {
      // The oven sounds should be loud if Chica is in the kitchen and we are looking at that cam, otherwise quieter
      audio.volume = Chica.currentPosition === '6' && user.camerasOn && user.currentCamera === '6' ? 1 : 0.25;
    } else if (audio.classList.contains('pirate-song')) {
      audio.volume = user.camerasOn && user.currentCamera === '1C' ? 1 : 0.4;
    } else if (audio.classList.contains('robot-voice')) {
      if (
        (user.currentCamera !== '2B' && user.currentCamera !== '4B') ||
        (user.currentCamera === '2B' && Bonnie.currentPosition !== '2B') ||
        (user.currentCamera === '4B' && Chica.currentPosition !== '4B')
      ) {
        killAudio('robot-voice');
      }

      // Some audio just generally needs to be quieter
    } else if (audio.classList.contains('eerie')) {
      audio.volume = 0.5;
    } else if (audio.classList.contains('circus')) {
      audio.volume = 0.3;
    }
  });
};

const playAudioAmbience = () => {
  playAudio('office-fan');

  circusInterval = window.setInterval(() => {
    if (Math.random() * 20 > 19) {
      playAudio('circus');
      clearInterval(circusInterval);
    }
  }, 30 * secondLength);

  pirateSongInterval = window.setInterval(() => {
    if (Math.random() * 20 > 19) {
      playAudio('pirate-song');
    }
  }, 30 * secondLength);

  ambienceInterval = window.setInterval(() => {
    if (Math.random() * 20 > 19) {
      playAudio('ambience');
      clearInterval(ambienceInterval);
    }
  }, 10 * secondLength);

  coldPresenceInterval = window.setInterval(() => {
    if (Math.random() * 20 > 19) {
      playAudio('cold-presence');
      clearInterval(coldPresenceInterval);
    }
  }, 11 * secondLength);

  eerieInterval = window.setInterval(() => {
    if (Math.random() * 20 > 19) {
      playAudio('eerie');
      clearInterval(eerieInterval);
    }
  }, 12 * secondLength);

  setAudioVolumes();
};

// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //

const startGame = () => {
  let selectedRadio = document.querySelector('#game-speed-selector input[type="radio"]:checked') as HTMLInputElement;
  gameSpeed = parseFloat(selectedRadio.value) ?? 1;
  secondLength = Math.ceil(1000 / gameSpeed);

  killAudio('game-menu');
  playAudioAmbience();

  // Phone guy stuff
  playAudio('phone-guy');

  if (user.audioOn) {
    let muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.textContent = 'MUTE CALL';

    window.setTimeout(() => {
      cameraArea.appendChild(muteButton);
      muteButton.addEventListener('click', () => {
        killAudio('phone-guy');
        muteButton.remove();
      });
    }, 1000);
  }

  [Bonnie, Chica, Foxy, Freddy].forEach((animatronic) => {
    let animatronicAIinput = document.querySelector(
      `.custom-ai-selector[for="${animatronic.name}"] input`
    ) as HTMLInputElement;
    animatronic.aiLevels[7] = parseInt(animatronicAIinput.value) ?? 0;
  });

  document.body.setAttribute('game-in-progress', 'true');
  drainPower;
  defaultPowerDrainInterval = window.setInterval(drainPower, secondLength / 10);
  // additionalPowerDrainInterval = window.setInterval(drainAdditionalPower, secondLength / 10);

  timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
  frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);

  freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
  foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
  bonnieInterval = window.setInterval(() => {
    moveBonnieOrChica(Bonnie);
  }, secondLength * Bonnie.movementOpportunityInterval);
  chicaInterval = window.setInterval(() => {
    moveBonnieOrChica(Chica);
  }, secondLength * Chica.movementOpportunityInterval);

  // If Foxy is at 4A for testing purposes we need get him working immediately and not wait for his first movement opportunity
  if (Foxy.currentPosition === '4A') {
    moveFoxy();
  }

  document.body.setAttribute('cameras-on', 'false');
  initialiseDoors();
  initialiseLights();
  generateAnimatronics();
  generateCameraButtons();

  cameraButton.addEventListener('click', toggleCameras);
  // cameraButton.addEventListener('mouseenter', toggleCameras);
  window.addEventListener('cameras-off', pauseFoxy);
};

const initialiseMenu = () => {
  let gameMenu = document.querySelector('#game-menu')!;
  let nightMenu = gameMenu.querySelector('#night-selector-menu')!;
  let customNightMenu = gameMenu.querySelector('#custom-night-menu')!;

  // Generate the custom night buttons
  [Freddy, Bonnie, Chica, Foxy].forEach((animatronic) => {
    let mySelector = document.createElement('div');
    mySelector.classList.add('custom-ai-selector');
    mySelector.setAttribute('for', animatronic.name);

    mySelector.innerHTML = `
      <h2>${animatronic.name}</h2>
      <img src="${paths.animatronics}/${animatronic.name.toLowerCase()}.png">
    `;

    let aiAdjuster = document.createElement('div');
    aiAdjuster.classList.add('ai-adjuster');
    mySelector.append(aiAdjuster);

    let aiDisplay = document.createElement('input');
    aiDisplay.type = 'number';
    aiDisplay.value = animatronic.aiLevels[1].toString();
    aiDisplay.addEventListener('input', () => {
      nightToSimulate = 7;
    });
    aiAdjuster.append(aiDisplay);

    let myDecreaseButton = document.createElement('button');
    myDecreaseButton.textContent = '<';
    myDecreaseButton.addEventListener('click', () => {
      nightMenu.querySelector('button.active')?.classList.remove('active');
      nightToSimulate = 7;
      let newAILevel = parseInt(aiDisplay.value);
      animatronic.aiLevels[7] = newAILevel;
      aiDisplay.value = newAILevel.toString();
      nightToSimulate = 7;

      if (animatronic.aiLevels[7] > 0) {
        animatronic.aiLevels[7]--;
        aiDisplay.value = animatronic.aiLevels[7].toString();
      }
    });

    aiAdjuster.append(myDecreaseButton);

    let myIncreaseButton = document.createElement('button');
    myIncreaseButton.textContent = '>';
    myIncreaseButton.addEventListener('click', () => {
      nightMenu.querySelector('button.active')?.classList.remove('active');
      let newAILevel = parseInt(aiDisplay.value);
      animatronic.aiLevels[7] = newAILevel;
      aiDisplay.value = newAILevel.toString();
      nightToSimulate = 7;

      if (animatronic.aiLevels[7] < 20) {
        animatronic.aiLevels[7]++;
        aiDisplay.value = animatronic.aiLevels[7].toString();
      }
    });
    aiAdjuster.append(myIncreaseButton);

    customNightMenu.append(mySelector);
  });

  // Generate the night selector buttons
  for (let i = 1; i <= 7; i++) {
    let myButton = document.createElement('button');
    myButton.classList.add('simulate-night');
    myButton.setAttribute('for', i.toString());

    myButton.textContent = i < 7 ? `Simulate night ${i}` : `Activate 4/20 mode`;
    if (i === 1) {
      myButton.classList.add('active');
    }
    nightMenu.append(myButton);

    myButton.addEventListener('click', () => {
      // I've got separate entries here for night 7 and 4/20 mode, but they should be considered the same thing
      nightToSimulate = i < 7 ? i : 7;

      document.querySelectorAll('button.simulate-night').forEach((btn) => {
        if (btn.getAttribute('for') === nightToSimulate.toString()) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      [Freddy, Bonnie, Chica, Foxy].forEach((animatronic) => {
        let myInput = customNightMenu.querySelector(`[for="${animatronic.name}"] input`) as HTMLInputElement;
        myInput.value = animatronic.aiLevels[nightToSimulate]!.toString();
      });
    });
  }

  // Make the audio toggle work
  document.querySelector('#audio-toggle input')?.addEventListener('change', () => {
    user.audioOn = !user.audioOn;

    // Play the game menu music if the game hasn't started yet
    if (!document.body.getAttribute('game-in-progress') && user.audioOn) {
      playAudio('game-menu');
    }

    // Turn all the audio off if the user has chosen so
    else if (!user.audioOn) {
      killAudio();
    } else {
      playAudioAmbience();
    }
  });

  // Make the game mode selector work
  document.querySelector('#game-mode input')?.addEventListener('click', () => {
    user.gameMode = !user.gameMode;
    let gameModeName = user.gameMode ? 'playable-game' : 'ai-simulator';
    document.body.setAttribute('game-mode', gameModeName);
  });

  gameMenu.querySelector('#start-game')?.addEventListener('click', startGame);
};

// All of the variables saved for various setIntervals and setTimeouts. These will be set and unset in various conditions so need to be global.
let timeUpdate: number;
let frameUpdate: number;
let defaultPowerDrainInterval: number;
let additionalPowerDrainInterval: number;
let bonnieInterval: number;
let chicaInterval: number;
let foxyInterval: number;
let freddyInterval: number;
let foxyCooldown: number;
let freddyCountdown: number;
let foxyJumpscareCountdown: number;
let bonnieJumpscareCountdown: number;
let chicaJumpscareCountdown: number;
let powerOutageInterval: number;
let leftLightTimeout: number;
let rightLightTimeout: number;
let circusInterval: number;
let pirateSongInterval: number;
let eerieInterval: number;
let ambienceInterval: number;
let coldPresenceInterval: number;

initialiseMenu();
startGame();
