// TESTING VARIABLES
const nightToSimulate = 6;
let secondLength: number = 1000000; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const defaultCamera = '4A' as Camera;

// TODO - PUT THIS IN A MODULE

type MovementCheck = {
  animatronicName: string;
  canMove: boolean;
  scoreToBeat: number;
  aiLevel: number;
};

type Animatronic = {
  name: string;
  // possibleLocations: string[]; // The cameras where they can be
  startingPosition: Camera; // The camera where they start
  currentPosition: Position; // The camera the animatronic is currently at
  subPosition: number; // Used for Foxy. He will almost always be in 1C, but he goes thrsough multiple steps before he's able to leave. -1 is the equivalent of null.
  startingSubPosition: number; // Used for Foxy. The subposition he starts at.
  movementOpportunityInterval: number; // How often in seconds this animatronic gets a movement opportunity
  aiLevels: [null, number, number, number, number, number, number]; // The starting AI levels on nights 1-6. To make the code more readable, null is at the start so night 1 is at index 1 and so on
  currentAIlevel: number; // Some animatronics increase their AI level as the night goes on. This will be used to store what their current AI level is. It's set to 0 when the animatronics are first declared, then set to the correct value in generateAnimatronics()
  currentCountdown: number; // How many milliseconds they've got left before a special move
  pronouns: ['he' | 'she', 'his' | 'her']; // For FNAF 1 this is simple. In other FNAF games the genders of some animatronics are complicated, so this makes for easier forwards compatibility than just checking whether we're dealing with Chica (the only female animatronic in FNAF 1)
};

type Camera = '1A' | '1B' | '1C' | '2A' | '2B' | '2C' | '3' | '4A' | '4B' | '4C' | '5' | '6' | '7';
// Cameras 2C and 4C do not actually exist. I will use these names to denote the areas between cameras 2B/4B and the office.

type Position = Camera | 'office';

const Freddy: Animatronic = {
  name: 'Freddy',
  // possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 3.02,
  // aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 9], // Freddy randomly starts at 1 or 2 on night 4
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Bonnie: Animatronic = {
  name: 'Bonnie',
  // possibleLocations: ['1A'],
  // startingPosition: '1A',
  // currentPosition: '1A',

  startingPosition: '2B',
  currentPosition: '2B',

  movementOpportunityInterval: 4.97,
  aiLevels: [null, 0, 3, 0, 2, 5, 10],
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Chica: Animatronic = {
  name: 'Chica',
  // possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.98,
  aiLevels: [null, 0, 1, 5, 4, 7, 12],
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['she', 'her'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Foxy: Animatronic = {
  name: 'Foxy',
  startingPosition: '1C',
  currentPosition: '1C',
  currentAIlevel: 0,
  subPosition: 0,
  startingSubPosition: 0,
  movementOpportunityInterval: 5.01,
  aiLevels: [null, 0, 1, 2, 6, 5, 16],
  currentCountdown: 0,
  pronouns: ['he', 'his'],
};

const cameraNames = {
  '1A': 'Show stage',
  '1B': 'Dining area',
  '1C': 'Pirate cove',
  '2A': 'West hall',
  '2B': 'W. hall corner',
  '2C': 'Between 2B and office',
  '3': 'Supply closet',
  '4A': 'East hall',
  '4B': 'E. hall corner',
  '4C': 'Between 4B and office',
  '5': 'Backstage',
  '6': 'Kitchen',
  '7': 'Restrooms',
};

const paths = {
  assets: '../assets',
};

/* Time related variables */
let currentFrame: number = 0;
let currentSecond: number = -1; // We start at 1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond: number = 60;

/* Time related page elements */
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#real-time')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-time')!;

// General page elements
const simulator: HTMLDivElement = document.querySelector('#simulator')!;
const sidebar: HTMLDivElement = document.querySelector('#sidebar')!;

// Camera related page elements
const cameraArea: HTMLDivElement = document.querySelector('#camera-display')!;
const cameraButton: HTMLButtonElement = cameraArea.querySelector('#camera-display button')!;
const cameraStatusText: HTMLDivElement = cameraArea.querySelector('#camera-status')!;
const cameraScreen: HTMLImageElement = cameraArea.querySelector('img#camera-screen')!;

/* Player choosable variables */

let user = {
  camerasOn: false,
  currentCamera: defaultCamera,
  leftDoorIsClosed: false,
  rightDoorIsClosed: false,
};

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
    clearInterval(timeUpdate);
    clearInterval(frameUpdate);
    // clearInterval(freddyInssterval);
  }
};

const calculateInGameTime = () => {
  let inGameMinutes =
    Math.floor(currentSecond * 0.6741573033707866) > 0 ? Math.floor(currentSecond * 0.6741573033707866) : 0;

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
    animatronic.currentAIlevel = animatronic.aiLevels[nightToSimulate];

    // Create the icons
    let icon = document.createElement('span');
    icon.classList.add('animatronic');
    icon.setAttribute('id', animatronic.name);
    icon.setAttribute('position', animatronic.startingPosition);

    icon.setAttribute('sub-position', animatronic.startingSubPosition.toString() ?? 'none');
    simulator.appendChild(icon);

    // Create the report
    let animatronicReport = document.createElement('div');
    animatronicReport.classList.add('animatronic-report');
    animatronicReport.setAttribute('animatronic', animatronic.name);
    animatronicReport.innerHTML = `
      ${animatronic.name}<br>
      Starting AI level: ${animatronic.currentAIlevel}
      Current AI level: <span class="current-ai-level">${animatronic.currentAIlevel}</span>
      <div class="report-item-container"></div>
    `;
    sidebar.querySelector('#animatronic-report')!.appendChild(animatronicReport);
  });
};

const makeMovementCheck = (animatronic: Animatronic): MovementCheck => {
  const comparisonNumber = Math.random() * 20;
  return {
    animatronicName: animatronic.name,
    canMove: animatronic.currentAIlevel >= comparisonNumber,
    scoreToBeat: comparisonNumber,
    aiLevel: animatronic.currentAIlevel,
  };
};

const increaseAILevel = (animatronic: Animatronic) => {
  animatronic.currentAIlevel++;
  addReport(animatronic, 'increase AI level');
  let aiReport = document.querySelector(`.animatronic-report[animatronic="${animatronic.name}"] .current-ai-level`);
  if (aiReport) {
    aiReport.innerHTML = animatronic.currentAIlevel.toString();
  }
  console.log(animatronic);
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

  // Foxy will fail all movement checks while the cameras are on
  if (user.camerasOn && Foxy.currentPosition === '1C') {
    addReport(Foxy, 'camera auto fail');

    // If Foxy fails a movement check while at 1C, he will not be able to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
  } else if (!movementCheck.canMove && Foxy.currentPosition === '1C') {
    addReport(Foxy, 'foxy failed pirate cove movement check', movementCheck);
  } else if (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition < 3) {
    // Foxy needs to make 3 successful movement checks before he is able to leave 1C
    Foxy.subPosition++;
    addReport(Foxy, 'foxy successful pirate cove movement check', movementCheck);
    moveAnimatronic(Foxy, { start: '1C', end: '1C', sub: Foxy.subPosition }, false);
  } else if (
    (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition === 3) ||
    Foxy.currentPosition === '4A'
  ) {
    // Once Foxy has made 4 successful movement checks, he can leave Pirate Cove
    if (Foxy.currentPosition === '1C') {
      // This if statement isn't necessary in normal play, but is necessary during testing when his starting position isn't 1C
      moveAnimatronic(Foxy, { start: '1C', end: '4A', sub: -1 });
      addReport(Foxy, 'foxy leaving pirate cove', movementCheck);
    }

    // Once he has left Pirate Cove, he will attempt to attack in 25 seconds or 1.87 seconds after the player looks at cam 4A, whichever comes first
    clearInterval(foxyInterval);
    Foxy.currentCountdown = 25;
    window.addEventListener('cam-on-4A', attemptFoxyJumpscare);
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

  const performFoxyJumpscareCheck = () => {
    const restartSubPosition = Math.floor(Math.random() * 2);
    if (user.rightDoorIsClosed) {
      addReport(Foxy, 'foxy right door closed', null, restartSubPosition);
      moveAnimatronic(Foxy, { start: '4A', end: '1C', sub: restartSubPosition }, false);
      foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);

      // TODO - Foxy drains your power if he bashes on the door.
    } else {
      addReport(Foxy, 'jumpscare');
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
    window.setTimeout(performFoxyJumpscareCheck, secondLength * 1.87);
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

    let foxyCooldown = window.setInterval(() => {
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
  window.setInterval(() => {
    let comparisonNumber = Math.random();
    let jumpscare = {
      canMove: comparisonNumber > 0.75,
    };

    if (jumpscare.canMove && !user.camerasOn) {
      // gameOver();
      addReport(Freddy, 'jumpscare');
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

  // CAMERAS ON, HE'S NOT AT 4B
  // Freddy will automatically fail all movement checks while the cameras are up
  if (user.camerasOn && Freddy.currentPosition !== '4B') {
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
  } else if (!user.camerasOn && Freddy.currentPosition === '4B' && movementCheck.canMove) {
    // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?
    addReport(Freddy, 'enter office cameras off');

    // THE CAMERAS ARE ON, HE'S AT 4B, THE RIGHT DOOR IS OPEN, HE CAN GET INTO THE OFFICE!!!!!
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && !user.rightDoorIsClosed) {
    addReport(Freddy, 'in the office');
    moveAnimatronic(Freddy, { start: '4B', end: 'office' }, false);
  } else if (Freddy.currentPosition === 'office') {
    makeFreddyJumpscareCheck();
  } else if (movementCheck.canMove) {
    let waitingTime = 1000 - Freddy.currentAIlevel * 100; // How many FRAMES to wait before moving
    waitingTime = waitingTime >= 0 ? waitingTime : 0;
    let startingPosition = Freddy.currentPosition;
    let endingPosition = startingPosition;

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
      startingPosition,
      endingPosition,
    });

    clearInterval(freddyInterval);

    // Freddy waits a certain amount of time between passing his movement check and actually moving.
    // The amount of time is dependent on his AI level.
    Freddy.currentCountdown = (waitingTime / framesPerSecond) * secondLength;

    // Freddy will not move while the cameras are up.
    // If his countdown expires while the cameras are up, he will wait until the cameras are down to move.
    let freddyCountdown = window.setInterval(() => {
      Freddy.currentCountdown--;
      if (Freddy.currentCountdown <= 0 && !user.camerasOn) {
        moveAnimatronic(Freddy, { start: startingPosition, end: endingPosition });
        freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
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
// BONNIE
// ========================================================================== //

const moveBonnie = () => {
  const movementCheck = makeMovementCheck(Bonnie);
  console.log(movementCheck);

  // If he can move, but isn't in 2B. He'll pick somewhere at random.
  if (movementCheck.canMove && Bonnie.currentPosition !== '2B') {
    moveAnimatronic(Bonnie, { start: Bonnie.currentPosition, end: calculateNewBonniePosition() });

    // If he's at 2B but isn't in your doorway yet, move him into the doorway
  } else if (movementCheck.canMove && Bonnie.currentPosition === '2B' && Bonnie.subPosition === -1) {
    moveAnimatronic(Bonnie, { start: '2B', end: '2B', sub: 1 }, false);
    addReport(Bonnie, 'in the doorway');

    // He's passed a movement check, is already in the doorway and the left door is not closed, he can get into your office!
  } else if (
    movementCheck.canMove &&
    Bonnie.currentPosition === '2B' &&
    Bonnie.subPosition !== -1 &&
    !user.leftDoorIsClosed
  ) {
    moveAnimatronic(Bonnie, { start: '2B', end: 'office', sub: -1 }, false);
    addReport(Bonnie, 'in the office');

    // Disable the doors and lights once the animatronic is in the office
    disableOfficeButtons();

    // TODO - DISABLE BUTTONS

    // They will jumpscare you in 30 seconds or when you next bring the cameras down - whichever comes first.
    window.setTimeout(gameOver, secondLength * 30);
    window.addEventListener('cameras-off', gameOver);

    // He meets all the critera to enter the office but the door is closed. He will return to the dining area
  } else if (
    movementCheck.canMove &&
    Bonnie.currentPosition === '2B' &&
    Bonnie.subPosition !== -1 &&
    user.leftDoorIsClosed
  ) {
    moveAnimatronic(Bonnie, { start: '2B', end: '1B', sub: -1 }, false);
    addReport(Bonnie, 'left door closed', movementCheck, '1B');

    // The conditions were right to enter the office but they failed their movement check
  } else if (
    !movementCheck.canMove &&
    Bonnie.currentPosition === '2B' &&
    Bonnie.subPosition !== -1 &&
    !user.leftDoorIsClosed
  ) {
    addReport(Bonnie, 'enter office failed movement check doorway');

    // Failed a bog standard movement check with no other fancy conditions
  } else if (!movementCheck.canMove) {
    addReport(Bonnie, 'failed movement check');
  } else {
    addReport(Bonnie, 'debug');
  }

  console.log(Bonnie);
};

// Bonnie does not have to chose adjacent rooms. He can pick at random from a list of approved locations.
const calculateNewBonniePosition = () => {
  const possibleLocations = ['1B', '3', '5', '2A', '2B'];
  const choice = Math.floor(Math.random() * possibleLocations.length);
  return possibleLocations[choice] as Position;
};

const calculateNewChicaPosition = () => {};

const moveAnimatronic = (
  animatronic: Animatronic,
  position: {
    start: Position;
    end: Position;
    sub?: number;
  },
  logThis: boolean = true
) => {
  animatronic.currentPosition = position.end;
  animatronic.subPosition = position.sub ?? -1;

  if (logThis) {
    addReport(animatronic, 'has moved', null, {
      startingPosition: position.start,
      endPosition: position.end,
    });
  }

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
  | 'increase AI level' // Used when animatronics gain their AI level increases throughout the night
  | 'enter office failed movement check doorway'
  | 'in the doorway' // The animatronic is in the doorway
  | 'camera auto fail' // The animatronic automatically fails movement checks when cameras are on
  | 'failed movement check' // Generic failed movement check
  | 'freddy office failed movement check' // Failed movement check while animatronic is in the office
  | 'freddy and camera at 4B' // Freddy auto fails all movement checks while both he and the camera are at 4B
  | 'left door closed'
  | 'right door closed'
  | 'enter office failed movement check' // Animatronic could have entered the office but failed their movement check
  | 'enter office cameras off' // Animatronic passed the check to enter the office but couldn't because the cameras were off
  | 'in the office' // Animatronic is in the office
  | 'waiting for cameras down' // Animatronic is ready to move but waiting for the cameras to go down
  | 'jumpscare' // Animatronic successfully achieved a jumpscare
  | 'has moved' // Animatronic is moving
  | 'freddy successful movement check' // Freddy has passed a movement check
  | 'foxy paused'
  | 'foxy failed pirate cove movement check'
  | 'foxy successful pirate cove movement check' // Foxy has passed a movement check while at Pirate Cove. Not one where he can leave.
  | 'foxy right door closed'
  | 'foxy coming down hall'
  | 'foxy leaving pirate cove'; // Foxy is leaving Pirate cove

const pluralise = (number: number, word: string) => {
  let plural = number > 1 ? 's' : '';
  return word + plural;
};

const addReport = (
  animatronic: Animatronic,
  reason: messagingType,
  movementCheck: MovementCheck | null = null,
  additionalInfo: any = null // Some reports need to pass in some additional info. This can take different formats so is allowed to be an 'any' type
) => {
  // Figuring out what the message actually should be
  let message = '';
  let type: 'success' | 'fail' | 'info' = 'info';
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

    case 'in the doorway':
      const side = animatronic.name === 'Bonnie' ? 'left' : 'right';
      message = `${animatronic.name} is in your ${side} doorway!`;
      type = 'success';
      break;

    case 'increase AI level':
      message = `${animatronic.name}'s AI level has increased by 1 to ${animatronic.currentAIlevel}`;
      break;

    case 'camera auto fail':
      message = `${animatronic.name} will automatically fail all movement checks while the cameras are on`;
      preventDuplicates = true;
      break;

    case 'failed movement check':
      message = `${animatronic.name} has failed ${animatronic.pronouns[1]} movement check and will remain at ${
        animatronic.currentPosition
      } (${cameraNames[animatronic.currentPosition as Camera]}) ${stats}`;
      type = 'fail';
      break;

    case 'freddy and camera at 4B':
      message = `Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.`;
      preventDuplicates = true;
      break;

    case 'right door closed':
      message = `${animatronic.name} was ready to enter your office but the right door was closed. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will return to cam ${additionalInfo} (${cameraNames[additionalInfo as Camera]})`;
      type = 'fail';
      break;

    case 'left door closed':
      message = `${animatronic.name} was ready to enter your office but the left door was closed. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will return to cam ${additionalInfo} (${cameraNames[additionalInfo as Camera]})`;
      type = 'fail';
      break;

    case 'freddy office failed movement check':
      message = `Freddy is in your office but failed his movement check and was unable to jumpscare you. 
          <div class="report-extra-info">
          Score to beat: ${movementCheck?.scoreToBeat}/100   Freddy's score: ${movementCheck?.aiLevel}
          </div>`;
      type = 'fail';
      break;

    case 'enter office failed movement check':
      message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${
        animatronic.pronouns[1]
      } movement check. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will continue to wait at cam ${animatronic.currentPosition} (${
        cameraNames[animatronic.currentPosition as Camera]
      }) ${stats}`;
      break;

    case 'enter office failed movement check doorway':
      let doorSide = animatronic.currentPosition === '2B' ? 'left' : 'right';

      message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${
        animatronic.pronouns[1]
      } movement check. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will continue to wait in the ${doorSide} doorway ${stats}`;
      type = 'fail';
      break;

    case 'enter office cameras off':
      message = `${animatronic.name} passed ${
        animatronic.pronouns[1]
      } movement check to enter the office but couldn't because the cameras were off. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will continue to wait at cam ${animatronic.currentPosition} (${
        cameraNames[animatronic.currentPosition as Camera]
      }) ${stats}`;
      break;

    case 'in the office':
      message = `${animatronic.name.toUpperCase()} HAS ENTERED THE OFFICE`;
      type = 'success';
      preventDuplicates = true;
      break;

    case 'waiting for cameras down':
      message = `${animatronic.name} is ready to move but is waiting for the cameras to go down`;
      preventDuplicates = true;
      break;

    case 'freddy successful movement check':
      message = `Freddy has passed his movement check and will move from
      ${additionalInfo.startingPosition} (${cameraNames[additionalInfo.startingPosition as Camera]})
      to ${additionalInfo.endingPosition} (${cameraNames[additionalInfo.endingPosition as Camera]})
      in ${additionalInfo.formattedWaitingTime} seconds
      ${stats}`;
      type = 'success';
      break;

    case 'has moved':
      message = `${animatronic.name} has moved from cam ${additionalInfo.startingPosition} (${
        cameraNames[additionalInfo.startingPosition as Camera]
      }) to cam ${additionalInfo.endPosition} (${cameraNames[additionalInfo.endPosition as Camera]})`;
      type = 'success';
      break;

    case 'foxy successful pirate cove movement check':
      const stepsRemaining = 4 - Foxy.subPosition;
      message = `Foxy has made a successful movement check while at 1C (${
        cameraNames['1C']
      }). He is ${stepsRemaining} ${pluralise(stepsRemaining, 'step')} away from attempting to attack ${stats}`;
      type = 'success';
      break;

    case 'foxy paused':
      message = `The cameras have just been turned off. Foxy will be unable to make movement checks for ${additionalInfo.toFixed(
        2
      )} seconds <div class="report-extra-info">Random number between 0.83 and 16.67</div>`;
      break;

    case 'foxy failed pirate cove movement check':
      let stepsRemainingB = 4 - Foxy.subPosition;
      message = `Foxy has failed his movement check. He is still ${stepsRemainingB} ${pluralise(
        stepsRemainingB,
        'step'
      )} away from leaving 1C (${cameraNames['1C']}) ${stats}`;
      type = 'fail';
      break;

    case 'foxy leaving pirate cove':
      message = `FOXY HAS LEFT ${cameraNames['1C'].toUpperCase()}
      <div class="report-extra-info">He will attempt to jumpscare you in 25 seconds or when you next look at cam 4A, whichever comes sooner</div>`;
      type = 'success';
      break;

    case 'foxy right door closed':
      message = `Foxy attempted to enter your office but the right door was closed. He will return to cam 1C (${
        cameraNames['1C']
      }) at step ${additionalInfo + 1}
      <div class="report-extra-info">Restarting step chosen at random from 1 & 2</div>`;
      type = 'fail';
      break;

    case 'foxy coming down hall':
      message = 'FOXY IS COMING DOWN THE HALL. HE WILL ATTEMPT TO JUMPSCARE YOU IN 1.87 SECONDS';
      type = 'success';
      break;

    case 'jumpscare':
      message = `${animatronic.name} successfully jumpscared you`;
      type = 'success';
      break;
  }

  let reportToAddTo = document.querySelector(
    `.animatronic-report[animatronic="${animatronic.name}"] .report-item-container`
  );

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
// CAMERAS
// ========================================================================== //

const toggleCameras = () => {
  user.camerasOn = !user.camerasOn;
  document.body.setAttribute('cameras-on', String(user.camerasOn));
  cameraButton.setAttribute('active', String(user.camerasOn));
  cameraStatusText.textContent = user.camerasOn ? 'CAMERAS ARE ON' : 'CAMERAS ARE OFF';

  if (user.camerasOn) {
    lookAtCamera(user.currentCamera);
  }
  if (!user.camerasOn) {
    window.dispatchEvent(new Event('cameras-off'));
    console.log('Cameras off');
  }
};

const generateCameraButtons = () => {
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
      cameraScreen.src = `${paths.assets}/cameras/${key}-empty.webp`;
      document.querySelectorAll('.camera-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      myCameraButton.classList.add('active');
      user.currentCamera = key as Camera;

      if (user.camerasOn) {
        lookAtCamera(user.currentCamera);
      }
    });
  }

  cameraScreen.src = `${paths.assets}/cameras/${defaultCamera}-empty.webp`;
};
generateCameraButtons();

// We need to listen for certain cameras in certain situations.
// This will publish an event when a given camera is being looked at
const lookAtCamera = (camera: Camera) => {
  window.dispatchEvent(new Event(`cam-on-${camera}`));
  console.log(`cam-on-${camera}`);
};

// ========================================================================== //
// DOORS
// ========================================================================== //

const initialiseDoors = () => {
  ['left', 'right'].forEach((direction) => {
    // Create door buttons
    let myButton = document.createElement('button');
    myButton.classList.add('door-button');
    myButton.textContent = `Close ${direction} door`;
    myButton.setAttribute('door', direction);
    document.querySelector('#door-controls')?.append(myButton);

    // Make the door buttons toggle the doors
    myButton.addEventListener('click', () => {
      myButton.classList.toggle('active');
      simulator.querySelector(`g#${direction}-door-close-icon`)?.classList.toggle('hidden');

      // Note - I could simplify this using else, but I'm leaving it like this to future proof it
      // Other FNAF games have doors in directions other than left and right.
      if (direction === 'left') {
        user.leftDoorIsClosed = !user.leftDoorIsClosed;
      }

      if (direction === 'right') {
        user.rightDoorIsClosed = !user.rightDoorIsClosed;
      }
    });
  });
};

const disableOfficeButtons = () => {
  document.querySelectorAll('.door-button').forEach((btn) => {
    btn.setAttribute('disabled', 'true');
  });
};

// ========================================================================== //
// DEATH
// ========================================================================== //

const gameOver = () => {
  alert('You got jumpscared');
};

// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //

const timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
const frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
let freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
let foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
let bonnieInterval = window.setInterval(moveBonnie, secondLength * Bonnie.movementOpportunityInterval);

// If Foxy is at 4A for testing purposes we need get him working immediately and not wait for his first movement opportunity
if (Foxy.currentPosition === '4A') {
  moveFoxy();
}

document.body.setAttribute('cameras-on', 'false');
initialiseDoors();
generateAnimatronics();

cameraButton.addEventListener('click', toggleCameras);
window.addEventListener('cameras-off', pauseFoxy);
