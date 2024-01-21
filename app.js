"use strict";

// TESTING VARIABLES
var nightToSimulate = 1;
var secondLength = 1000; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
var defaultCamera = '1A';
var autoStartGame = false;
var Freddy = {
  name: 'Freddy',
  currentPosition: '1A',
  movementOpportunityInterval: 3.02,
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4, 20],
  // Freddy randomly starts at 1 or 2 on night 4
  currentAIlevel: 0,
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  stats: {
    successfulMovementChecks: 0,
    failedMovementChecks: 0,
    officeAttempts: 0
  }
};
var Bonnie = {
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
    officeAttempts: 0
  }
};
var Chica = {
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
    officeAttempts: 0
  }
};
var Foxy = {
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
    officeAttempts: 0
  }
};
var cameraNames = {
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
  '7': 'Restrooms'
};
var paths = {
  assets: 'assets',
  cameras: 'assets/cameras',
  animatronics: 'assets/animatronics',
  office: 'assets/office',
  audio: 'assets/sounds'
};

/* Time related variables */
var currentFrame = 0;
var currentSecond = -1; // We start at 1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
var framesPerSecond = 60;
var gameSpeed = 1;

/* Time related page elements */
var framesDisplay = document.querySelector('#frames');
var secondsDisplay = document.querySelector('#real-time');
var inGameHourDisplay = document.querySelector('#in-game-time');

// General page elements
var simulator = document.querySelector('#simulator');
var sidebar = document.querySelector('#sidebar');
var officeDisplay = document.querySelector('#office-overlay img');

// Camera related page elements
var cameraArea = document.querySelector('#camera-display');
var cameraButton = document.querySelector('button#cameras');
var cameraStatusText = document.querySelector('#camera-status');
var cameraScreen = document.querySelector('img#camera-screen');

// Power related page elements
var powerDisplay = document.querySelector('#power');

/* Player choosable variables */

var user = {
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
  gameMode: false // false for ai simulator, true for playable game with stuff hidden
};

// ========================================================================== //
// TIMER BASED FUNCTIONS
// These are split off separately as they each need to update at
// different rates.
// ========================================================================== //

// We are running at 60fps
var updateFrames = function updateFrames() {
  currentFrame++;
  framesDisplay.textContent = "".concat(currentFrame, " frames at ").concat(framesPerSecond * gameSpeed, "fps");
};
var updateTime = function updateTime() {
  currentSecond++;

  // REAL TIME
  var realMinutes = Math.floor(currentSecond / 60);
  var realRemainingSeconds = currentSecond % 60;
  secondsDisplay.textContent = "\n    ".concat(realMinutes, " : ").concat(String(realRemainingSeconds).padStart(2, '0'), "\n  ");

  // IN GAME TIME

  var gameTime = calculateInGameTime();
  inGameHourDisplay.innerHTML = "\n    <span class=\"in-game-hour\">".concat(gameTime.hour, "</span>\n    <span class=\"in-game-minutes\">").concat(String(gameTime.minute).padStart(2, '0'), "</span>\n    <span class=\"am-marker\">AM</span>\n  ");
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
var calculateInGameTime = function calculateInGameTime() {
  var modifier = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var inGameMinutes = Math.floor((currentSecond + modifier) * 0.6741573033707866) > 0 ? Math.floor((currentSecond + modifier) * 0.6741573033707866) : 0;
  return {
    hour: String(Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12),
    minute: String(inGameMinutes % 60).padStart(2, '0')
  };
};

// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //

var generateAnimatronics = function generateAnimatronics() {
  [Bonnie, Foxy, Freddy, Chica].forEach(function (animatronic) {
    var _animatronic$aiLevels, _animatronic$subPosit;
    // Initialise their starting AI level
    animatronic.currentAIlevel = (_animatronic$aiLevels = animatronic.aiLevels[nightToSimulate]) !== null && _animatronic$aiLevels !== void 0 ? _animatronic$aiLevels : 1;

    // Create the icons
    var icon = document.createElement('span');
    icon.classList.add('animatronic');
    icon.setAttribute('id', animatronic.name);
    icon.setAttribute('position', animatronic.currentPosition);
    icon.setAttribute('sub-position', (_animatronic$subPosit = animatronic.subPosition.toString()) !== null && _animatronic$subPosit !== void 0 ? _animatronic$subPosit : 'none');
    simulator.appendChild(icon);

    // Create the report
    var animatronicReport = document.createElement('div');
    animatronicReport.classList.add('animatronic-report');
    animatronicReport.setAttribute('for', animatronic.name);
    animatronicReport.innerHTML = "\n      <div class=\"animatronic-icon\"></div>\n      <div class=\"animatronic-name\">".concat(animatronic.name, "</div>\n      <div class=\"starting-ai-level\">Starting AI:<span>").concat(animatronic.currentAIlevel, "</span></div>\n      <div class=\"current-ai-level\">Current AI level: <span>").concat(animatronic.currentAIlevel, "</span></div>\n      <div class=\"report-item-container\"></div>\n    ");
    document.querySelector('#animatronic-report').appendChild(animatronicReport);
    if (animatronic === Freddy) {
      var _animatronicReport$qu;
      (_animatronicReport$qu = animatronicReport.querySelector('.animatronic-icon')) === null || _animatronicReport$qu === void 0 || _animatronicReport$qu.addEventListener('click', function () {
        playAudio('freddy-nose');
      });
    }
  });
};
var makeMovementCheck = function makeMovementCheck(animatronic) {
  var comparisonNumber = Math.ceil(Math.random() * 20);
  var canMove = animatronic.currentAIlevel >= comparisonNumber;
  if (canMove) {
    animatronic.stats.successfulMovementChecks++;
  } else {
    animatronic.stats.failedMovementChecks++;
  }
  return {
    animatronicName: animatronic.name,
    canMove: canMove,
    scoreToBeat: comparisonNumber,
    aiLevel: animatronic.currentAIlevel
  };
};
var increaseAILevel = function increaseAILevel(animatronic) {
  if (animatronic.currentAIlevel < 20) {
    animatronic.currentAIlevel++;
    addReport(animatronic, 'increase AI level');
    var aiReport = document.querySelector(".animatronic-report[for=\"".concat(animatronic.name, "\"] .current-ai-level span"));
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

var moveFoxy = function moveFoxy() {
  var movementCheck = makeMovementCheck(Foxy);
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
    moveAnimatronic(Foxy, {
      start: '1C',
      end: '1C',
      sub: Foxy.subPosition + 1
    }, false);
    addReport(Foxy, 'foxy successful pirate cove movement check', movementCheck);
  } else if (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition === 2 || Foxy.currentPosition === '2A') {
    // Once Foxy has made 3 successful movement checks, he can leave Pirate Cove
    if (Foxy.currentPosition === '1C') {
      // This if statement isn't necessary in normal play, but is necessary during testing when his starting position isn't 1C
      moveAnimatronic(Foxy, {
        start: '1C',
        end: '2A',
        sub: -1
      });
      addReport(Foxy, 'foxy leaving pirate cove', movementCheck);
    }

    // Once he has left Pirate Cove, he will attempt to attack in 25 seconds or 1.87 seconds after the player looks at cam 2A, whichever comes first
    clearInterval(foxyInterval);
    Foxy.currentCountdown = 25;
    window.addEventListener('cam-on-2A', attemptFoxyJumpscare);
    foxyInterval = window.setInterval(function () {
      Foxy.currentCountdown--;
      if (Foxy.currentCountdown === 0) {
        attemptFoxyJumpscare();
      }
    }, secondLength);
  }
};
var attemptFoxyJumpscare = function attemptFoxyJumpscare(e) {
  clearInterval(foxyInterval);
  Foxy.stats.officeAttempts++;
  var performFoxyJumpscareCheck = function performFoxyJumpscareCheck() {
    var restartSubPosition = Math.floor(Math.random() * 2);
    if (user.leftDoorIsClosed) {
      // If Foxy bashes on your door, you lose 1% power, plus an additional 5% for every time after that (e.g. 7% the second time, 13% the third etc)
      // We do -1 as the attempts get incremented before this function is called.
      var powerDrainage = 1 + (Foxy.stats.officeAttempts - 1) * 5;
      user.power -= powerDrainage;
      addReport(Foxy, 'foxy left door closed', null, {
        restartSubPosition: restartSubPosition,
        powerDrainage: powerDrainage
      });
      moveAnimatronic(Foxy, {
        start: '2A',
        end: '1C',
        sub: restartSubPosition
      }, false);
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
    var foxyIcon = document.querySelector('.animatronic#Foxy');
    if (foxyIcon) {
      foxyIcon.style.animation = "foxyHallAnimation ".concat(1.87 * secondLength / 1000, "s linear backwards");
    }
    playAudio('foxy-run');
    foxyJumpscareCountdown = window.setTimeout(performFoxyJumpscareCheck, secondLength * 1.87);
  } else {
    performFoxyJumpscareCheck();
  }
};

// When the cameras come down Foxy will be unable to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
// I am assuming the countdown doesn't renew if another cameras-off event happens during his cooldown.
var pauseFoxy = function pauseFoxy() {
  if (Foxy.currentPosition === '1C') {
    var cooldownInSeconds = Math.random() * (16.67 - 0.83) + 0.83;
    Foxy.currentCountdown = cooldownInSeconds * secondLength;
    addReport(Foxy, 'foxy paused', null, cooldownInSeconds);
    clearInterval(foxyInterval);
    foxyCooldown = window.setInterval(function () {
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
var makeFreddyJumpscareCheck = function makeFreddyJumpscareCheck() {
  clearInterval(freddyInterval);
  freddyInterval = window.setInterval(function () {
    var comparisonNumber = Math.random();
    var jumpscare = {
      canMove: comparisonNumber > 0.75
    };
    if (jumpscare.canMove && !user.camerasOn) {
      gameOverFreddy();
    } else {
      // Freddy is in your office but failed his movement check and was unable to jumpscare you.
      addReport(Freddy, 'freddy office failed movement check', {
        animatronicName: 'Freddy',
        canMove: true,
        scoreToBeat: 0.75 * 100,
        aiLevel: Math.floor(comparisonNumber * 100)
      });
    }
  }, secondLength);
};

// Freddy always follows a set path, and waits a certain amount of time before actually moving.
var moveFreddy = function moveFreddy() {
  var movementCheck = makeMovementCheck(Freddy);
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
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && user.currentCamera !== '4B' && user.rightDoorIsClosed && movementCheck.canMove) {
    // Freddy can't get you when the right door is closed even if you're not looking at 4B
    addReport(Freddy, 'right door closed', null, '4A');
    Freddy.currentPosition = '4A';
    moveAnimatronic(Freddy, {
      start: '4B',
      end: '4A'
    });
    Freddy.stats.officeAttempts++;
    playAudio('freddy-move');

    // CAMERAS ON, HE'S AT 4B, USER IS NOT LOOKING AT 4B BUT HE'S FAILED HIS MOVEMENT CHECK
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && user.currentCamera !== '4B' && !user.rightDoorIsClosed && !movementCheck.canMove) {
    // Freddy could have entered the office but he failed his movement check. He will continue to wait at Cam 4B
    addReport(Freddy, 'enter office failed movement check', movementCheck);
    Freddy.stats.failedMovementChecks++;
  } else if (!user.camerasOn && Freddy.currentPosition === '4B' && movementCheck.canMove) {
    addReport(Freddy, 'enter office cameras off');
    Freddy.stats.officeAttempts++;

    // THE CAMERAS ARE ON, HE'S AT 4B, THE RIGHT DOOR IS OPEN, HE CAN GET INTO THE OFFICE!!!!!
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && !user.rightDoorIsClosed) {
    addReport(Freddy, 'in the office');
    moveAnimatronic(Freddy, {
      start: '4B',
      end: 'office'
    }, false);
    playAudio('freddy-move');
    Freddy.stats.officeAttempts++;
  } else if (Freddy.currentPosition === 'office') {
    makeFreddyJumpscareCheck();
  } else if (movementCheck.canMove) {
    var waitingTime = 1000 - Freddy.currentAIlevel * 100; // How many FRAMES to wait before moving
    waitingTime = waitingTime >= 0 ? waitingTime : 0;
    var currentPosition = Freddy.currentPosition;
    var endingPosition = currentPosition;

    // Freddy always follows a set path
    switch (Freddy.currentPosition) {
      case '1A':
        // Show stage
        endingPosition = '1B';
        break;
      case '1B':
        // Dining area
        endingPosition = '7';
        break;
      case '7':
        // Restrooms
        endingPosition = '6';
        break;
      case '6':
        // Kitchen
        endingPosition = '4A';
        break;
      case '4A':
        // East hall
        endingPosition = '4B';
        break;
    }

    // Round to a reasonable number of decimal points for the report, only if it's not an integer.
    var formattedWaitingTime = Number.isInteger(waitingTime / 60) ? waitingTime / 60 : (waitingTime / 60).toFixed(2);
    addReport(Freddy, 'freddy successful movement check', movementCheck, {
      formattedWaitingTime: formattedWaitingTime,
      currentPosition: currentPosition,
      endingPosition: endingPosition
    });
    clearInterval(freddyInterval);

    // Freddy waits a certain amount of time between passing his movement check and actually moving.
    // The amount of time is dependent on his AI level.
    Freddy.currentCountdown = waitingTime / framesPerSecond * secondLength;

    // Freddy will not move while the cameras are up.
    // If his countdown expires while the cameras are up, he will wait until the cameras are down to move.
    freddyCountdown = window.setInterval(function () {
      Freddy.currentCountdown--;
      if (Freddy.currentCountdown <= 0 && !user.camerasOn) {
        moveAnimatronic(Freddy, {
          start: currentPosition,
          end: endingPosition
        });
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

var moveBonnieOrChica = function moveBonnieOrChica(animatronic) {
  // Figure out which set of details we need to use depending on whether it's Bonnie or Chica we're dealing with
  var name = animatronic.name;
  var newPosition = name === 'Bonnie' ? calculateNewBonniePosition() : calculateNewChicaPosition();
  var hallCorner = name === 'Bonnie' ? '2B' : '4B';
  var doorClosed = name === 'Bonnie' ? user.leftDoorIsClosed : user.rightDoorIsClosed;
  var doorClosedMessage = name === 'Bonnie' ? 'left door closed' : 'right door closed';
  var movementCheck = makeMovementCheck(animatronic);
  if (animatronic.currentAIlevel === 0) {
    addReport(animatronic, 'AI level 0');

    // They can move, aren't in their hall corner
  } else if (movementCheck.canMove && animatronic.currentPosition !== hallCorner) {
    moveAnimatronic(animatronic, {
      start: animatronic.currentPosition,
      end: newPosition
    }, true, movementCheck);
    if (animatronic.name === 'Chica' && newPosition === '6') {
      playAudio('oven');
    }

    // If they're at their hall corner but aren't in your doorway yet, move them into the doorway
  } else if (movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition === -1) {
    moveAnimatronic(animatronic, {
      start: hallCorner,
      end: hallCorner,
      sub: 1
    }, false);
    addReport(animatronic, 'in the doorway', movementCheck);

    // Passed a movement check, is already in the doorway and the door is not closed, they can get into your office!
  } else if (movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition !== -1 && !doorClosed) {
    moveAnimatronic(animatronic, {
      start: hallCorner,
      end: 'office',
      sub: -1
    }, false);
    addReport(animatronic, 'enter office bonnie or chica', movementCheck);
    animatronic.stats.officeAttempts++;
    if (name === 'Bonnie') {
      clearInterval(bonnieInterval);
      bonnieInterval = window.setInterval(function () {
        if (Math.random() * 3 > 2) {
          playAudio('breath');
          clearInterval(bonnieInterval);
        }
      });
    } else {
      clearInterval(chicaInterval);
      chicaInterval = window.setInterval(function () {
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
  } else if (movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition !== -1 && doorClosed) {
    moveAnimatronic(animatronic, {
      start: hallCorner,
      end: '1B',
      sub: -1
    }, false);
    addReport(animatronic, doorClosedMessage, movementCheck, '1B');

    // The conditions were right to enter the office but they failed their movement check
  } else if (!movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition !== -1 && !user.leftDoorIsClosed) {
    addReport(animatronic, 'enter office failed movement check doorway', movementCheck);

    // Failed a bog standard movement check with no other fancy conditions
  } else if (!movementCheck.canMove) {
    addReport(animatronic, 'failed movement check', movementCheck);
  } else {
    addReport(animatronic, 'debug');
  }
};

// Bonnie does not have to chose adjacent rooms. He can pick at random from a list of approved locations.
var calculateNewBonniePosition = function calculateNewBonniePosition() {
  var possibleLocations = ['1B', '3', '5', '2A', '2B'];
  var choice = Math.floor(Math.random() * possibleLocations.length);
  return possibleLocations[choice];
};

// Chica can only choose cameras adjacent to where she already is.
var calculateNewChicaPosition = function calculateNewChicaPosition() {
  var randomChoice = Math.round(Math.random());
  var newPosition = '';
  var choices;
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
  return newPosition;
};
var moveAnimatronic = function moveAnimatronic(animatronic, position) {
  var _position$sub, _document$querySelect, _document$querySelect2, _position$sub$toStrin, _position$sub2;
  var logThis = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var movementCheck = arguments.length > 3 ? arguments[3] : undefined;
  animatronic.currentPosition = position.end;
  animatronic.subPosition = (_position$sub = position.sub) !== null && _position$sub !== void 0 ? _position$sub : -1;
  if (logThis) {
    addReport(animatronic, 'has moved', movementCheck, {
      currentPosition: position.start,
      endPosition: position.end
    });
  }

  // Update the cameras if you're looking at their start or end position
  if (user.camerasOn && (user.currentCamera === position.start || user.currentCamera === position.end)) {
    cameraArea.classList.add('updating');
    playAudio('animatronic-camera-move');
  }
  window.setTimeout(function () {
    cameraScreen.src = getCameraImage(user.currentCamera);
    cameraArea.classList.remove('updating');
  }, secondLength * 5);
  (_document$querySelect = document.querySelector(".animatronic#".concat(animatronic.name))) === null || _document$querySelect === void 0 || _document$querySelect.setAttribute('position', position.end);
  (_document$querySelect2 = document.querySelector(".animatronic#".concat(animatronic.name))) === null || _document$querySelect2 === void 0 || _document$querySelect2.setAttribute('sub-position', (_position$sub$toStrin = (_position$sub2 = position.sub) === null || _position$sub2 === void 0 ? void 0 : _position$sub2.toString()) !== null && _position$sub$toStrin !== void 0 ? _position$sub$toStrin : 'none');
};

// ========================================================================== //
// REPORTING
// ========================================================================== //
// Foxy is leaving Pirate cove

var pluralise = function pluralise(number, word) {
  var plural = number > 1 ? 's' : '';
  return word + plural;
};
var capitalise = function capitalise(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
};
var addReport = function addReport(animatronic, reason) {
  var movementCheck = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var additionalInfo = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  // Figuring out what the message actually should be
  var message = '';
  var type = 'info';
  var preventDuplicates = false;
  var stats = movementCheck ? "<div class=\"report-extra-info\">Score to beat: ".concat(Math.ceil(movementCheck.scoreToBeat), " ").concat(animatronic.name, "'s AI level: ").concat(movementCheck.aiLevel, "</div>") : '';
  switch (reason) {
    case 'debug':
      message = "Something happened";
      break;
    case 'power outage - freddy not arrived':
      message = 'Your power has run out. Freddy has a 20% chance of arriving at your office every 5 seconds, up to a maximum of 20 seconds.';
      type = 'death-zone';
      break;
    case 'power outage - freddy has arrived':
      message = 'Freddy has arrived at your office. His song has a 20% chance of ending every 5 seconds, up to a maxmimum of 20 seconds';
      type = 'death-zone';
      break;
    case 'power outage - freddy is waiting to jumpscare':
      message = "Now Freddy's song has ended, he has a 20% chance of jumpscaring you every 2 seconds";
      type = 'death-zone';
      break;
    case 'power outage - freddy failed to arrive':
      message = "Freddy failed his check to arrive at the office. He will try up to ".concat(additionalInfo, " more ").concat(pluralise(additionalInfo, 'time'), "<div class=\"report-extra-info\">20% chance every 5 seconds</div>");
      break;
    case "power outage - freddy's song didn't end":
      message = "Freddy failed his check to end his song. He will continue for up to ".concat(additionalInfo, " more ").concat(pluralise(additionalInfo, 'second'), "<div class=\"report-extra-info\">20% chance every 5 seconds</div>");
      break;
    case "power outage - freddy didn't jumpscare":
      message = "Freddy failed his check to jumpscare you.<div class=\"report-extra-info\">20% chance every 2 seconds</div>";
      break;
    case 'AI level 0':
      message = "".concat(animatronic.name, "'s AI level is 0 and is unable to move.");
      if (animatronic === Bonnie) {
        message += "<div class=\"report-extra-info\">His AI level will increase at 2AM</div>";
      } else if (animatronic === Chica || animatronic === Foxy) {
        message += "<div class=\"report-extra-info\">".concat(capitalise(animatronic.pronouns[1]), " AI level will increase at 3AM</div>");
      }
      preventDuplicates = true;
      break;
    case 'in the doorway':
      var side = animatronic.name === 'Bonnie' ? 'left' : 'right';
      message = "".concat(animatronic.name, " is in your ").concat(side, " doorway!");
      type = 'alert';
      break;
    case 'increase AI level':
      message = "".concat(animatronic.name, "'s AI level has increased by 1 to ").concat(animatronic.currentAIlevel);
      break;
    case 'increase AI level max':
      message = "".concat(animatronic.name, " could have increased their AI level but they are already at 20");
    case 'camera auto fail':
      message = "".concat(animatronic.name, " will automatically fail all movement checks while the cameras are on");
      preventDuplicates = true;
      break;
    case 'failed movement check':
      message = "".concat(animatronic.name, " has failed ").concat(animatronic.pronouns[1], " movement check and will remain at cam ").concat(animatronic.currentPosition, " (").concat(cameraNames[animatronic.currentPosition], ") ").concat(stats);
      type = 'good';
      break;
    case 'freddy and camera at 4B':
      message = "Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.";
      preventDuplicates = true;
      break;
    case 'right door closed':
      message = "".concat(animatronic.name, " was ready to enter your office but the right door was closed. ").concat(capitalise(animatronic.pronouns[0]), " will return to cam ").concat(additionalInfo, " (").concat(cameraNames[additionalInfo], ")");
      type = 'good';
      break;
    case 'left door closed':
      message = "".concat(animatronic.name, " was ready to enter your office but the left door was closed.\n      ").concat(capitalise(animatronic.pronouns[0]), " will return to cam ").concat(additionalInfo, " (").concat(cameraNames[additionalInfo], ")");
      type = 'good';
      break;
    case 'enter office bonnie or chica':
      message = "".concat(animatronic.name.toUpperCase(), " HAS ENTERED THE OFFICE\n      <div class=\"report-extra-info\">").concat(capitalise(animatronic.pronouns[0]), " will jumpscare you in 30 seconds or the next time the camera goes down - whichever comes first</div>");
      type = 'death-zone';
      preventDuplicates = true;
      break;
    case 'freddy office failed movement check':
      message = "Freddy is in your office but failed his movement check and was unable to jumpscare you. \n          <div class=\"report-extra-info\">\n          Score to beat: ".concat(movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.scoreToBeat, "/100   Freddy's score: ").concat(movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.aiLevel, "\n          </div>");
      type = 'death-zone';
      break;
    case 'enter office failed movement check':
      message = "".concat(animatronic.name, " could have entered the office but ").concat(animatronic.pronouns[0], " failed ").concat(animatronic.pronouns[1], " movement check. ").concat(capitalise(animatronic.pronouns[0]), " will continue to wait at cam ").concat(animatronic.currentPosition, " (").concat(cameraNames[animatronic.currentPosition], ") ").concat(stats);
      type = 'alert';
      break;
    case 'enter office failed movement check doorway':
      var doorSide = animatronic.currentPosition === '2B' ? 'left' : 'right';
      message = "".concat(animatronic.name, " could have entered the office but ").concat(animatronic.pronouns[0], " failed ").concat(animatronic.pronouns[1], " movement check.\n      ").concat(capitalise(animatronic.pronouns[0]), " will continue to wait in the ").concat(doorSide, " doorway ").concat(stats);
      type = 'alert';
      break;
    case 'enter office cameras off':
      message = "".concat(animatronic.name, " passed ").concat(animatronic.pronouns[1], " movement check to enter the office but couldn't because the cameras were off.\n      ").concat(capitalise(animatronic.pronouns[0]), " will continue to wait at cam ").concat(animatronic.currentPosition, " (").concat(cameraNames[animatronic.currentPosition], ") ").concat(stats);
      type = 'warning';
      break;
    case 'in the office':
      message = "".concat(animatronic.name.toUpperCase(), " HAS ENTERED THE OFFICE");
      type = 'death-zone';
      preventDuplicates = true;
      break;
    case 'waiting for cameras down':
      message = "".concat(animatronic.name, " is ready to move but is waiting for the cameras to go down");
      preventDuplicates = true;
      break;
    case 'freddy successful movement check':
      message = "Freddy will move from\n      ".concat(additionalInfo.currentPosition, " (").concat(cameraNames[additionalInfo.currentPosition], ")\n      to ").concat(additionalInfo.endingPosition, " (").concat(cameraNames[additionalInfo.endingPosition], ")\n      in ").concat(additionalInfo.formattedWaitingTime, " seconds\n      ").concat(stats);
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
      message = "".concat(animatronic.name, " has moved from cam ").concat(additionalInfo.currentPosition, " (").concat(cameraNames[additionalInfo.currentPosition], ") to cam ").concat(additionalInfo.endPosition, " (").concat(cameraNames[additionalInfo.endPosition], ")");
      if (movementCheck) {
        message += "<div class=\"report-extra-info\">\n        Score to beat: ".concat(movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.scoreToBeat, "  ").concat(animatronic.name, "'s score: ").concat(movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.aiLevel, "\n        </div>");
      }
      type = 'bad';
      break;
    case 'foxy successful pirate cove movement check':
      var stepsRemaining = 3 - Foxy.subPosition;
      message = "Foxy has made a successful movement check. He is ".concat(stepsRemaining, " ").concat(pluralise(stepsRemaining, 'step'), "&nbsp;away from leaving Pirate Cove ").concat(stats);
      type = stepsRemaining === 1 ? 'warning' : 'bad';
      break;
    case 'foxy paused':
      message = "The cameras have just been turned off. Foxy will be unable to make movement checks for ".concat(additionalInfo.toFixed(2), " seconds <div class=\"report-extra-info\">Random number between 0.83 and 16.67</div>");
      break;
    case 'foxy failed pirate cove movement check':
      var stepsRemainingB = 3 - Foxy.subPosition;
      message = "Foxy has failed his movement check. He is still ".concat(stepsRemainingB, " ").concat(pluralise(stepsRemainingB, 'step'), " away from leaving 1C (").concat(cameraNames['1C'], ") ").concat(stats);
      type = 'good';
      break;
    case 'foxy leaving pirate cove':
      message = "FOXY HAS LEFT ".concat(cameraNames['1C'].toUpperCase(), "\n      <div class=\"report-extra-info\">He will attempt to jumpscare you in 25 seconds or when you next look at cam 2A, whichever comes first</div>");
      type = 'alert';
      break;
    case 'foxy left door closed':
      message = "Foxy attempted to enter your office but the left door was closed. He has drained ".concat(additionalInfo.powerDrainage, "% of your power and returned to cam 1C (").concat(cameraNames['1C'], ") at step ").concat(additionalInfo.restartSubPosition + 1, "\n      <div class=\"report-extra-info\">Restarting step chosen at random from 1 & 2</div>");
      type = 'good';
      break;
    case 'foxy coming down hall':
      message = 'FOXY IS COMING DOWN THE HALL. HE WILL ATTEMPT TO JUMPSCARE YOU IN 1.87 SECONDS';
      type = 'death-zone';
      break;
    case 'jumpscare':
      message = "".concat(animatronic.name, " successfully jumpscared you");
      type = 'death-zone';
      break;
  }
  var reportToAddTo = document.querySelector(".animatronic-report[for=\"".concat(animatronic.name, "\"] .report-item-container"));
  var firstReport = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.querySelector('.report-item');
  if (preventDuplicates && firstReport && firstReport.innerHTML.indexOf(message) > 0) {
    return;
    // Don't do anything here
  } else if (reportToAddTo) {
    var _reportToAddTo$innerH;
    var InGameTime = calculateInGameTime();
    reportToAddTo.innerHTML = "\n\n    <div class=\"report-item\" type=\"".concat(type, "\">\n    <span class=\"report-time\">").concat(InGameTime.hour, ":").concat(InGameTime.minute, "AM</span>\n    <div class=\"report-description\">").concat(message, "</div></div>\n    ").concat((_reportToAddTo$innerH = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.innerHTML) !== null && _reportToAddTo$innerH !== void 0 ? _reportToAddTo$innerH : '', "\n  ");
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

var getCameraImage = function getCameraImage(cam) {
  var camImageSrc = '';
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
  return "".concat(paths.cameras, "/").concat(camImageSrc);
};
var getLocationInfo = function getLocationInfo(cam) {
  var bonnieIsHere = Bonnie.currentPosition === cam;
  var chicaIsHere = Chica.currentPosition === cam;
  var foxyIsHere = Foxy.currentPosition === cam;
  var freddyIsHere = Freddy.currentPosition === cam;
  var bonnieIsAlone = bonnieIsHere && !chicaIsHere && !foxyIsHere && !freddyIsHere;
  var chicaIsAlone = !bonnieIsHere && chicaIsHere && !foxyIsHere && !freddyIsHere;
  // const foxyIsAlone = !bonnieIsHere && !chicaIsHere && foxyIsHere && !freddyIsHere; // Do I ever actually need to know whether Foxy is alone?
  var freddyIsAlone = !bonnieIsHere && !chicaIsHere && !foxyIsHere && freddyIsHere;
  var isEmpty = !bonnieIsHere && !chicaIsHere && !foxyIsHere && !freddyIsHere;
  return {
    bonnieIsHere: bonnieIsHere,
    chicaIsHere: chicaIsHere,
    foxyIsHere: foxyIsHere,
    freddyIsHere: freddyIsHere,
    bonnieIsAlone: bonnieIsAlone,
    chicaIsAlone: chicaIsAlone,
    freddyIsAlone: freddyIsAlone,
    isEmpty: isEmpty
  };
};

// Chance should be the 1 in X number chance it has
var randomise = function randomise(chance) {
  return Math.random() < 1 / chance;
};

// Note - Foxy can never be here.
var generateCamImage1A = function generateCamImage1A() {
  var info = getLocationInfo('1A');

  // Bonnie, Chica and Freddy are all here
  if (info.bonnieIsHere && info.chicaIsHere && info.freddyIsHere) {
    return "1A-bonnie-chica-freddy.webp";
  }

  // Chica and Freddy are here
  if (!info.bonnieIsHere && info.chicaIsHere && info.freddyIsHere) {
    return "1A-chica-freddy.webp";
  }

  // Bonnie and Freddy are here
  if (info.bonnieIsHere && !info.chicaIsHere && info.freddyIsHere) {
    return "1A-bonnie-freddy.webp";
  }
  if (info.freddyIsAlone) {
    // UNKNOWN - I can't find info on the chances of Freddy facing right rather than the camera
    var randomiser = randomise(8) ? '-2' : '-1';
    return "1A-freddy".concat(randomiser, ".webp");
  }

  // If we've reached this point it must be empty
  return "1A-empty.webp";
};

// Freddy will only show if he's alone. Bonnnie will only show if Chica isn't there.
var generateCamImage1B = function generateCamImage1B() {
  var info = getLocationInfo('1B');
  var randomiser = randomise(3) ? '-2' : '-1';
  if (info.chicaIsHere) {
    return "1B-chica".concat(randomiser, ".webp");
  }
  if (info.bonnieIsHere) {
    return "1B-bonnie".concat(randomiser, ".webp");
  }
  if (info.freddyIsAlone) {
    return '1B-freddy.webp';
  }
  return '1B-empty.webp';
};

// Foxy is the only one who can be here. Exactly which image is shown depends
// on how close he is to leaving Pirate Cove.
var generateCamImage1C = function generateCamImage1C() {
  var _getLocationInfo = getLocationInfo('1C'),
    foxyIsHere = _getLocationInfo.foxyIsHere;
  if (foxyIsHere) {
    return "1C-foxy-".concat(Foxy.subPosition, ".webp");
  }
  var emptyRandomiser = randomise(10) ? '-its-me' : '-default';
  return "1C-empty".concat(emptyRandomiser, ".webp");
};
var generateCamImage2A = function generateCamImage2A() {
  var info = getLocationInfo('2A');
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
var generateCamImage2B = function generateCamImage2B() {
  var info = getLocationInfo('2B');

  // There are 3 different options for Bonnie's images, with some being more
  // likely than others.
  if (info.bonnieIsHere && Bonnie.subPosition === -1) {
    var bonnieRandomiser = Math.ceil(Math.random() * 8);
    if (bonnieRandomiser === 1 && nightToSimulate >= 3) {
      playAudio('robot-voice');
      return '2B-bonnie-3.webp';
    } else if (bonnieRandomiser > 6) {
      return '2B-bonnie-2.webp';
    } else {
      return '2B-bonnie-1.webp';
    }
  }
  var emptyRandomiser = randomise(4) ? '-2' : '-1';
  return "2B-empty".concat(emptyRandomiser, ".webp");
};

// Bonnie is the only animatronic who can be here, and only has one image :)
var generateCamImage3 = function generateCamImage3() {
  return getLocationInfo('3').bonnieIsHere ? '3-bonnie.webp' : '3-empty.webp';
};

// Freddy or Chica may be here
var generateCamImage4A = function generateCamImage4A() {
  var info = getLocationInfo('4A');
  if (info.chicaIsHere) {
    var randomiser = randomise(3) ? '-2' : '-1';
    return "4A-chica".concat(randomiser, ".webp");
  }
  if (info.freddyIsAlone) {
    return '4A-freddy.webp';
  }

  // There are 3 image options for empty, with one of them being FAR more likely
  // than the others
  var emptyRandomiser = Math.ceil(Math.random() * 10);
  if (emptyRandomiser === 1) {
    return "4A-empty-1.webp";
  } else if (emptyRandomiser === 2) {
    return "4A-empty-2.webp";
  } else {
    return '4A-empty-default.webp';
  }
};

// Freddy or Chica may be here.
var generateCamImage4B = function generateCamImage4B() {
  var info = getLocationInfo('4B');
  if (info.freddyIsAlone) {
    return '4B-freddy.webp';
  }
  if (info.chicaIsHere && Chica.subPosition === -1) {
    var chicaRandomiser = Math.ceil(Math.random() * 6);
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
  var emptyRandomiser = Math.ceil(Math.random() * 30);
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
var generateCamImage5 = function generateCamImage5() {
  var randomiser = randomise(8) ? '-2' : '-1';
  return getLocationInfo('5').bonnieIsHere ? "5-bonnie".concat(randomiser, ".webp") : "5-empty".concat(randomiser, ".webp");
};
var generateCamImage7 = function generateCamImage7() {
  var info = getLocationInfo('7');
  if (info.freddyIsAlone) {
    return '7-freddy.webp';
  }
  if (info.chicaIsHere) {
    var randomiser = randomise(8) ? '-2' : '-1';
    return "7-chica".concat(randomiser, ".webp");
  }
  return '7-empty.webp';
};

// ========================================================================== //
// CAMERAS
// ========================================================================== //

var toggleCameras = function toggleCameras() {
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
var generateCameraButtons = function generateCameraButtons() {
  cameraScreen.src = getCameraImage(defaultCamera);
  var _loop = function _loop(key) {
    var myCameraButton = document.createElement('button');
    myCameraButton.classList.add('camera-button');
    if (key === defaultCamera) {
      myCameraButton.classList.add('active');
    }
    myCameraButton.textContent = "CAM ".concat(key);
    myCameraButton.setAttribute('camera', key);
    simulator.appendChild(myCameraButton);
    myCameraButton.addEventListener('click', function () {
      document.querySelectorAll('.camera-button').forEach(function (btn) {
        btn.classList.remove('active');
      });
      myCameraButton.classList.add('active');
      user.currentCamera = key;
      user.camerasLookedAt++;
      if (user.camerasOn) {
        lookAtCamera(user.currentCamera);
      }
    });
  };
  for (var key in cameraNames) {
    _loop(key);
  }
};

// We need to listen for certain cameras in certain situations.
// This will publish an event when a given camera is being looked at
var lookAtCamera = function lookAtCamera(camera) {
  window.dispatchEvent(new Event("cam-on-".concat(camera)));
  console.log("cam-on-".concat(camera));
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

var initialiseDoors = function initialiseDoors() {
  ['left', 'right'].forEach(function (direction) {
    var _document$querySelect3;
    // Create door buttons
    var myButton = document.createElement('button');
    myButton.classList.add('door-button');
    // myButton.textContent = `${direction} door`;
    myButton.setAttribute('door', direction);
    (_document$querySelect3 = document.querySelector('#controls')) === null || _document$querySelect3 === void 0 || _document$querySelect3.append(myButton);

    // Make the door buttons toggle the doors
    myButton.addEventListener('click', function () {
      if (!myButton.classList.contains('error-state')) {
        var _simulator$querySelec;
        myButton.classList.toggle('active');
        (_simulator$querySelec = simulator.querySelector("g#".concat(direction, "-door-close-icon"))) === null || _simulator$querySelec === void 0 || _simulator$querySelec.classList.toggle('hidden');

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
var disableOfficeButtons = function disableOfficeButtons() {
  document.querySelectorAll('#controls button').forEach(function (btn) {
    btn.classList.add('error-state');
    btn.addEventListener('click', function (e) {
      playAudio('error');
    });
  });
};

// ========================================================================== //
// LIGHTS
// ========================================================================== //
var initialiseLights = function initialiseLights() {
  var lightControlsContainer = document.querySelector('#controls');
  ['left', 'right'].forEach(function (direction) {
    var lightButton = document.createElement('button');
    lightButton.classList.add('light-button');
    // lightButton.textContent = `${direction} light`;
    lightButton.setAttribute('door', direction);
    lightButton.addEventListener('click', function () {
      if (!lightButton.classList.contains('error-state')) {
        toggleLight(direction);
      }
    });
    lightControlsContainer === null || lightControlsContainer === void 0 || lightControlsContainer.appendChild(lightButton);
  });
};
var toggleLight = function toggleLight(direction) {
  var matchingDoorway = direction === 'left' ? '2B' : '4B';
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
  if (direction === 'left' && user.leftLightIsOn || direction === 'right' && user.rightLightIsOn) {
    [Bonnie, Chica, Foxy, Freddy].forEach(function (animatronic) {
      if (animatronic.currentPosition === matchingDoorway && animatronic.subPosition !== -1) {
        playAudio('doorway-warning');
      }
    });
    playAudio("light-".concat(direction));
  }
  if (direction === 'left' && user.leftLightIsOn) {
    leftLightTimeout = window.setTimeout(function () {
      timeoutLight('left');
    }, 5 * secondLength); // TODO - CHECK HOW LONG THE LIGHTS ACTUALLY STAY ON IF YOU DON'T TURN THEM OFF
  }

  if (direction === 'right' && user.rightLightIsOn) {
    rightLightTimeout = window.setTimeout(function () {
      timeoutLight('right');
    }, 5 * secondLength); // TODO - CHECK HOW LONG THE LIGHTS ACTUALLY STAY ON IF YOU DON'T TURN THEM OFF
  }

  displayLightVisuals();
};
var timeoutLight = function timeoutLight(direction) {
  if (direction === 'left' && user.leftLightIsOn) {
    user.leftLightIsOn = false;
    killAudio('light-left');
  } else if (direction === 'right' && user.rightLightIsOn) {
    user.rightLightIsOn = false;
    killAudio('light-right');
  }
  displayLightVisuals();
};
var displayLightVisuals = function displayLightVisuals() {
  simulator.setAttribute('left-light-on', user.leftLightIsOn.toString());
  simulator.setAttribute('right-light-on', user.rightLightIsOn.toString());
  updatePowerDisplay();
};

// ========================================================================== //
// DEATH
// ========================================================================== //

// Clear all the intervals and timeouts so the game stops running
var clearAllIntervals = function clearAllIntervals() {
  var gameOver = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  var intervalsToClear = [bonnieInterval, chicaInterval, foxyInterval, foxyCooldown, freddyInterval, freddyCountdown, defaultPowerDrainInterval, additionalPowerDrainInterval, powerOutageInterval, pirateSongInterval, circusInterval, eerieInterval, ambienceInterval, coldPresenceInterval];
  var timeoutsToClear = [leftLightTimeout, rightLightTimeout, foxyJumpscareCountdown, bonnieJumpscareCountdown, chicaJumpscareCountdown];

  // It's possible to reach this function when you've run out of power, so the game isn't over quite yet.
  // We want to stop the animatronics etc from doing anything, but the timer should still be running in this case.
  if (gameOver) {
    intervalsToClear.push(timeUpdate, frameUpdate);
  }
  intervalsToClear.forEach(function (interval) {
    clearInterval(interval);
  });
  timeoutsToClear.forEach(function (timeout) {
    clearTimeout(timeout);
  });
};
var gameOver = function gameOver(reason) {
  var _document$querySelect4;
  killAudio(null);
  if (reason === '6AM') {
    playAudio('6AM');
  } else {
    playAudio('jumpscare');
  }
  document.body.setAttribute('game-in-progress', 'false');
  (_document$querySelect4 = document.querySelector('#sound-prompt')) === null || _document$querySelect4 === void 0 || _document$querySelect4.remove();
  clearAllIntervals();
  var gameOverWindow = document.querySelector('#game-over-stats');
  var generateStatsTable = function generateStatsTable(animatronic) {
    var myStats = "\n      <div class=\"stats-report\" for=\"".concat(animatronic.name, "\">\n        <h3>").concat(animatronic.name, "</h3>\n        <div class=\"animatronic-icon\"></div>\n        <div>Successful movement checks:&nbsp;<span>").concat(animatronic.stats.successfulMovementChecks, "</span></div>\n        <div>Failed movement checks:&nbsp;<span>").concat(animatronic.stats.failedMovementChecks, "</span></div>\n        <div>Attempts to get into office:&nbsp;<span>").concat(animatronic.stats.officeAttempts, "</span></div>\n      </div>\n    ");
    return myStats;
  };
  var gameOverTitle = reason === '6AM' ? 'CONGRATULATIONS!' : 'GAME OVER';
  var gameOverMessage = reason === '6AM' ? 'You survived until 6AM' : "You were jumpscared by ".concat(reason.name);
  gameOverWindow.innerHTML = "\n    <h2>".concat(gameOverTitle, "</h2>\n    <h3>").concat(gameOverMessage, "</h3>\n    <div class=\"stats-report\" for=\"user\">\n      <h3>You</h3>\n      <div class=\"animatronic-icon\"></div>\n      <div>Cameras turned on/off </span>").concat(user.camerasToggled, "</span> times</div>\n      <div>Cameras looked at: </span>").concat(user.camerasLookedAt, "</span></div>\n      <div>Left door toggled <span>").concat(user.leftDoorToggled, "</span> times</div>\n      <div>Right door toggled <span>").concat(user.rightDoorToggled, "</span> times</div>\n    </div>\n    ").concat(generateStatsTable(Freddy), "\n    ").concat(generateStatsTable(Bonnie), "\n    ").concat(generateStatsTable(Chica), "\n    ").concat(generateStatsTable(Foxy), "\n    <button id=\"new-game\" onclick=\"location.reload();\">Start a new game</button>\n  ");
};
var gameOverBonnie = function gameOverBonnie() {
  addReport(Bonnie, 'jumpscare');
  window.dispatchEvent(new Event('game-over-bonnie'));
};
var gameOverChica = function gameOverChica() {
  addReport(Chica, 'jumpscare');
  window.dispatchEvent(new Event('game-over-chica'));
};
var gameOverFoxy = function gameOverFoxy() {
  addReport(Foxy, 'jumpscare');
  window.dispatchEvent(new Event('game-over-foxy'));
};
var gameOverFreddy = function gameOverFreddy() {
  addReport(Freddy, 'jumpscare');
  window.dispatchEvent(new Event('game-over-freddy'));
};
window.addEventListener('game-over-bonnie', function () {
  gameOver(Bonnie);
});
window.addEventListener('game-over-chica', function () {
  gameOver(Chica);
});
window.addEventListener('game-over-foxy', function () {
  gameOver(Foxy);
});
window.addEventListener('game-over-freddy', function () {
  gameOver(Freddy);
});

// ========================================================================== //
// POWER
// ========================================================================== //

// The additional penalties on time - an additional 1% every X seconds
// Again, I've added a 0 to the start of this so night 1 is at index 1 and so on for more readable code
var additionalPowerDrainageIntervalSpacing = [0, 9.6, 6, 5, 4, 3, 3, 3];
var drainPower = function drainPower() {
  user.power -= calculatePowerDrain();
  if (user.power <= 0) {
    clearAllIntervals(false);
    powerOutage();
  }
  updatePowerDisplay();
};
var calculatePowerDrain = function calculatePowerDrain() {
  var defaultPowerDrain = 0.1 * calculatePowerDrainMultiplier();
  var nightlyBuffPowerDrain = nightToSimulate > 1 ? 0.1 / additionalPowerDrainageIntervalSpacing[nightToSimulate] : 0;
  return (defaultPowerDrain + nightlyBuffPowerDrain) / 10; // We are running this every 0.1 seconds, hence the /10
};

var calculatePowerDrainMultiplier = function calculatePowerDrainMultiplier() {
  // You lose a default amount of power, multiplied for each door/light/camera you have on, up to a maximum of 4x
  // The first item in this array is true as the multiplier needs to be at least 1
  var usage = [true, user.leftDoorIsClosed, user.rightDoorIsClosed, user.camerasOn, user.leftLightIsOn, user.rightLightIsOn].filter(Boolean).length;
  return usage > 4 ? 4 : usage;
};
var updatePowerDisplay = function updatePowerDisplay() {
  var secondsOfGameRemaining = 535 - currentSecond;
  var secondsOfPowerRemaining = Math.ceil(user.power / (calculatePowerDrain() * 10)); // x10 as this function calculates for 0.1 seconds

  var timeUserWillRunOutOfPower = calculateInGameTime(secondsOfPowerRemaining);
  var timeMessaging = parseInt(timeUserWillRunOutOfPower.hour) >= 6 ? "You have enough power to last until 6AM" : "You will run out of power at <b>".concat(timeUserWillRunOutOfPower.hour, ":").concat(timeUserWillRunOutOfPower.minute, "AM</b>");
  var powerToDisplay = user.gameMode ? user.power.toFixed(0) : user.power.toFixed(1);
  powerDisplay.innerHTML = "\n    <div id=\"main-power-info\">\n      <div id=\"power-percentage\">\n        Power left: ".concat(powerToDisplay.toString(), "%\n      </div>\n      <div id=\"power-usage\" multiplier=\"").concat(calculatePowerDrainMultiplier().toString(), "\">\n        <span>Usage: </span>\n        <div></div>\n        <div></div>\n        <div></div>\n        <div></div>\n      </div>\n    </div>\n    <div id=\"power-time\">\n      <h3>Based on current usage:</h3>\n      <div>").concat(timeMessaging, "</div>\n      <div>Seconds of power remaining: ").concat(secondsOfPowerRemaining, "</div>\n      <div>Seconds of game remaining: ").concat(secondsOfGameRemaining, "</div>\n    </div>\n  ");
};

// The sequence of events between you running out of power and Freddy jumpscaring you.
var powerOutage = function powerOutage() {
  var _document$querySelect5;
  officeDisplay.src = "".concat(paths.office, "/office-no-power.webp");
  var i = 0;
  addReport(Freddy, 'power outage - freddy not arrived');
  playAudio('power-outage');
  (_document$querySelect5 = document.querySelector('#office-overlay')) === null || _document$querySelect5 === void 0 || _document$querySelect5.classList.remove('hidden');
  var awaitFreddyArrival = function awaitFreddyArrival() {
    i += 1;
    if (randomise(5) || i >= 4) {
      officeDisplay.src = "".concat(paths.office, "/freddy-no-power.webp");
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
  var toreadorMarch = function toreadorMarch() {
    i += 1;
    if (randomise(5) || i >= 4) {
      officeDisplay.src = "".concat(paths.office, "/office-dark.webp");
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
  var awaitFreddyFinalJumpscare = function awaitFreddyFinalJumpscare() {
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

var playAudio = function playAudio(audio) {
  var _document$querySelect6;
  // Audio that should loop
  var loopingAudio = ['office-fan', 'camera-feed'];
  var blockMultiples = Boolean(document.querySelector("audio.".concat(audio)));

  // Some audio types should be randomly picked from a number of available files
  var myAudioSource;
  switch (audio) {
    case 'oven':
      myAudioSource = "oven-".concat(Math.ceil(Math.random() * 4));
      (_document$querySelect6 = document.querySelector('#kitchen-audio-graphic')) === null || _document$querySelect6 === void 0 || _document$querySelect6.setAttribute('visible', 'true');
      break;
    case 'breath':
      myAudioSource = "breath-".concat(Math.ceil(Math.random() * 4));
      break;
    case 'freddy-move':
      myAudioSource = "freddy-move-".concat(Math.ceil(Math.random() * 3));
      break;
    case 'garble':
      myAudioSource = "garble-".concat(Math.ceil(Math.random() * 3));
      break;
    case 'phone-guy':
      myAudioSource = "phone-guy-night-".concat(nightToSimulate);
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
    var myAudio = document.createElement('audio');
    myAudio.classList.add(audio);
    myAudio.src = "".concat(paths.audio, "/").concat(myAudioSource, ".mp3");
    if (loopingAudio.includes(audio)) {
      myAudio.setAttribute('loop', 'true');
    }
    document.body.appendChild(myAudio);
    myAudio.play();
    myAudio.onended = function () {
      var _document$querySelect7;
      document.body.removeChild(myAudio);
      (_document$querySelect7 = document.querySelector('button#mute-call')) === null || _document$querySelect7 === void 0 || _document$querySelect7.remove();
      if (audio === 'oven') {
        var _document$querySelect8;
        (_document$querySelect8 = document.querySelector('#kitchen-audio-graphic')) === null || _document$querySelect8 === void 0 || _document$querySelect8.removeAttribute('visible');
      }
    };
  }
  if (audio === 'jumpscare') {
    window.setTimeout(function () {
      playAudio('post-jumpscare');
    }, 5000);
  } else if (audio === '6AM') {
    window.setTimeout(function () {
      playAudio('cheer');
    }, 5500);
  }
  setAudioVolumes();
};

// Passing in null will kill all audio
var killAudio = function killAudio() {
  var audio = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var matchingAudio = audio ? document.querySelectorAll("audio.".concat(audio)) : document.querySelectorAll("audio");
  matchingAudio.forEach(function (match) {
    var _document$querySelect9;
    match.remove();
    (_document$querySelect9 = document.querySelector('button#mute-call')) === null || _document$querySelect9 === void 0 || _document$querySelect9.remove();
  });
};

// Update the audio volumes depending on certain conditions
var setAudioVolumes = function setAudioVolumes() {
  var audios = document.querySelectorAll('audio');
  audios.forEach(function (audio) {
    if (audio.classList.contains('office-fan')) {
      // Office fan should be quieter if we're looking at the cameras
      audio.volume = user.camerasOn ? 0.4 : 1;
    } else if (audio.classList.contains('oven')) {
      // The oven sounds should be loud if Chica is in the kitchen and we are looking at that cam, otherwise quieter
      audio.volume = Chica.currentPosition === '6' && user.camerasOn && user.currentCamera === '6' ? 1 : 0.25;
    } else if (audio.classList.contains('pirate-song')) {
      audio.volume = user.camerasOn && user.currentCamera === '1C' ? 1 : 0.4;
    } else if (audio.classList.contains('robot-voice')) {
      if (user.currentCamera !== '2B' && user.currentCamera !== '4B' || user.currentCamera === '2B' && Bonnie.currentPosition !== '2B' || user.currentCamera === '4B' && Chica.currentPosition !== '4B') {
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
var playAudioAmbience = function playAudioAmbience() {
  playAudio('office-fan');
  circusInterval = window.setInterval(function () {
    if (Math.random() * 20 > 19) {
      playAudio('circus');
      clearInterval(circusInterval);
    }
  }, 30 * secondLength);
  pirateSongInterval = window.setInterval(function () {
    if (Math.random() * 20 > 19) {
      playAudio('pirate-song');
    }
  }, 30 * secondLength);
  ambienceInterval = window.setInterval(function () {
    if (Math.random() * 20 > 19) {
      playAudio('ambience');
      clearInterval(ambienceInterval);
    }
  }, 10 * secondLength);
  coldPresenceInterval = window.setInterval(function () {
    if (Math.random() * 20 > 19) {
      playAudio('cold-presence');
      clearInterval(coldPresenceInterval);
    }
  }, 11 * secondLength);
  eerieInterval = window.setInterval(function () {
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

var startGame = function startGame() {
  var _parseFloat;
  var selectedOption = document.querySelector('#game-speed-selector select');
  gameSpeed = (_parseFloat = parseFloat(selectedOption.value)) !== null && _parseFloat !== void 0 ? _parseFloat : 1;
  secondLength = Math.ceil(1000 / gameSpeed);
  killAudio('game-menu');
  playAudioAmbience();

  // Phone guy stuff
  if (nightToSimulate !== 7) {
    playAudio('phone-guy');
  } else {
    var _document$querySelect10;
    (_document$querySelect10 = document.querySelector('button#mute-call')) === null || _document$querySelect10 === void 0 || _document$querySelect10.remove();
  }
  if (user.audioOn) {
    var muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.textContent = 'MUTE CALL';
    window.setTimeout(function () {
      cameraArea.appendChild(muteButton);
      muteButton.addEventListener('click', function () {
        killAudio('phone-guy');
        muteButton.remove();
      });
    }, 1000);
  }
  [Bonnie, Chica, Foxy, Freddy].forEach(function (animatronic) {
    var _parseInt;
    var animatronicAIinput = document.querySelector(".custom-ai-selector[for=\"".concat(animatronic.name, "\"] input"));
    animatronic.aiLevels[7] = (_parseInt = parseInt(animatronicAIinput.value)) !== null && _parseInt !== void 0 ? _parseInt : 0;
  });
  document.body.setAttribute('game-in-progress', 'true');
  drainPower();
  defaultPowerDrainInterval = window.setInterval(drainPower, secondLength / 10);
  timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
  frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
  freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
  foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
  bonnieInterval = window.setInterval(function () {
    moveBonnieOrChica(Bonnie);
  }, secondLength * Bonnie.movementOpportunityInterval);
  chicaInterval = window.setInterval(function () {
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
var initialiseMenu = function initialiseMenu() {
  var _document$querySelect11, _document$querySelect12, _gameMenu$querySelect;
  var gameMenu = document.querySelector('#game-menu');
  var nightMenu = gameMenu.querySelector('#night-selector-menu');
  var customNightMenu = gameMenu.querySelector('#custom-night-menu');

  // Generate the custom night buttons
  [Freddy, Bonnie, Chica, Foxy].forEach(function (animatronic) {
    var mySelector = document.createElement('div');
    mySelector.classList.add('custom-ai-selector');
    mySelector.setAttribute('for', animatronic.name);
    mySelector.innerHTML = "\n      <h2>".concat(animatronic.name, "</h2>\n      <img src=\"").concat(paths.animatronics, "/").concat(animatronic.name.toLowerCase(), ".png\">\n    ");
    var aiAdjuster = document.createElement('div');
    aiAdjuster.classList.add('ai-adjuster');
    mySelector.append(aiAdjuster);
    var aiDisplay = document.createElement('input');
    aiDisplay.type = 'number';
    aiDisplay.value = animatronic.aiLevels[1].toString();
    aiDisplay.addEventListener('input', function () {
      nightToSimulate = 7;
    });
    aiAdjuster.append(aiDisplay);
    var myDecreaseButton = document.createElement('button');
    myDecreaseButton.textContent = '<';
    myDecreaseButton.addEventListener('click', function () {
      var _nightMenu$querySelec;
      (_nightMenu$querySelec = nightMenu.querySelector('button.active')) === null || _nightMenu$querySelec === void 0 || _nightMenu$querySelec.classList.remove('active');
      nightToSimulate = 7;
      var newAILevel = parseInt(aiDisplay.value);
      animatronic.aiLevels[7] = newAILevel;
      aiDisplay.value = newAILevel.toString();
      nightToSimulate = 7;
      if (animatronic.aiLevels[7] > 0) {
        animatronic.aiLevels[7]--;
        aiDisplay.value = animatronic.aiLevels[7].toString();
      }
    });
    aiAdjuster.append(myDecreaseButton);
    var myIncreaseButton = document.createElement('button');
    myIncreaseButton.textContent = '>';
    myIncreaseButton.addEventListener('click', function () {
      var _nightMenu$querySelec2;
      (_nightMenu$querySelec2 = nightMenu.querySelector('button.active')) === null || _nightMenu$querySelec2 === void 0 || _nightMenu$querySelec2.classList.remove('active');
      var newAILevel = parseInt(aiDisplay.value);
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
  var _loop2 = function _loop2(i) {
    var myButton = document.createElement('button');
    myButton.classList.add('simulate-night');
    myButton.setAttribute('for', i.toString());
    myButton.textContent = i < 7 ? "Simulate night ".concat(i) : "Activate 4/20 mode";
    if (i === 1) {
      myButton.classList.add('active');
    }
    nightMenu.append(myButton);
    myButton.addEventListener('click', function () {
      // I've got separate entries here for night 7 and 4/20 mode, but they should be considered the same thing
      nightToSimulate = i < 7 ? i : 7;
      document.querySelectorAll('button.simulate-night').forEach(function (btn) {
        if (btn.getAttribute('for') === nightToSimulate.toString()) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      [Freddy, Bonnie, Chica, Foxy].forEach(function (animatronic) {
        var myInput = customNightMenu.querySelector("[for=\"".concat(animatronic.name, "\"] input"));
        myInput.value = animatronic.aiLevels[nightToSimulate].toString();
      });
    });
  };
  for (var i = 1; i <= 7; i++) {
    _loop2(i);
  }

  // Make the audio toggle work
  (_document$querySelect11 = document.querySelector('#audio-toggle input')) === null || _document$querySelect11 === void 0 || _document$querySelect11.addEventListener('change', function () {
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
  (_document$querySelect12 = document.querySelector('#game-mode input')) === null || _document$querySelect12 === void 0 || _document$querySelect12.addEventListener('click', function () {
    user.gameMode = !user.gameMode;
    var gameModeName = user.gameMode ? 'playable-game' : 'ai-simulator';
    document.body.setAttribute('game-mode', gameModeName);
  });
  (_gameMenu$querySelect = gameMenu.querySelector('#start-game')) === null || _gameMenu$querySelect === void 0 || _gameMenu$querySelect.addEventListener('click', startGame);
};

// All of the variables saved for various setIntervals and setTimeouts. These will be set and unset in various conditions so need to be global.
var timeUpdate;
var frameUpdate;
var defaultPowerDrainInterval;
var additionalPowerDrainInterval;
var bonnieInterval;
var chicaInterval;
var foxyInterval;
var freddyInterval;
var foxyCooldown;
var freddyCountdown;
var foxyJumpscareCountdown;
var bonnieJumpscareCountdown;
var chicaJumpscareCountdown;
var powerOutageInterval;
var leftLightTimeout;
var rightLightTimeout;
var circusInterval;
var pirateSongInterval;
var eerieInterval;
var ambienceInterval;
var coldPresenceInterval;
initialiseMenu();
if (autoStartGame) {
  startGame();
}
//# sourceMappingURL=app.js.map