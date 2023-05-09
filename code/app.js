// TESTING VARIABLES
let nightToSimulate = 1;
let secondLength = 1000; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const defaultCamera = '1A';
const Freddy = {
    name: 'Freddy',
    currentPosition: '1A',
    movementOpportunityInterval: 3.02,
    // aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
    aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 9, 0],
    currentAIlevel: 0,
    currentCountdown: 0,
    pronouns: ['he', 'his'],
    subPosition: -1,
};
const Bonnie = {
    name: 'Bonnie',
    currentPosition: '1A',
    movementOpportunityInterval: 4.97,
    aiLevels: [null, 0, 3, 0, 2, 5, 10, 0],
    currentAIlevel: 0,
    currentCountdown: 0,
    pronouns: ['he', 'his'],
    subPosition: -1,
};
const Chica = {
    name: 'Chica',
    currentPosition: '1A',
    movementOpportunityInterval: 4.98,
    aiLevels: [null, 0, 1, 5, 4, 7, 12, 0],
    currentAIlevel: 0,
    currentCountdown: 0,
    pronouns: ['she', 'her'],
    subPosition: -1,
};
const Foxy = {
    name: 'Foxy',
    currentPosition: '1C',
    currentAIlevel: 0,
    subPosition: 0,
    movementOpportunityInterval: 5.01,
    aiLevels: [null, 0, 1, 2, 6, 5, 16, 0],
    currentCountdown: 0,
    pronouns: ['he', 'his'],
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
};
/* Time related variables */
let currentFrame = 0;
let currentSecond = -1; // We start at 1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond = 60;
/* Time related page elements */
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time');
const inGameHourDisplay = document.querySelector('#in-game-time');
// General page elements
const simulator = document.querySelector('#simulator');
const sidebar = document.querySelector('#sidebar');
// Camera related page elements
const cameraArea = document.querySelector('#camera-display');
const cameraButton = document.querySelector('button#cameras');
const cameraStatusText = document.querySelector('#camera-status');
const cameraScreen = document.querySelector('img#camera-screen');
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
    let inGameMinutes = Math.floor(currentSecond * 0.6741573033707866) > 0 ? Math.floor(currentSecond * 0.6741573033707866) : 0;
    return {
        hour: String(Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12),
        minute: String(inGameMinutes % 60).padStart(2, '0'),
    };
};
// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //
const generateAnimatronics = () => {
    [Bonnie, Foxy, Freddy, Chica].forEach((animatronic) => {
        var _a, _b;
        // Initialise their starting AI level
        animatronic.currentAIlevel = (_a = animatronic.aiLevels[nightToSimulate]) !== null && _a !== void 0 ? _a : 1;
        // Create the icons
        let icon = document.createElement('span');
        icon.classList.add('animatronic');
        icon.setAttribute('id', animatronic.name);
        icon.setAttribute('position', animatronic.currentPosition);
        icon.setAttribute('sub-position', (_b = animatronic.subPosition.toString()) !== null && _b !== void 0 ? _b : 'none');
        simulator.appendChild(icon);
        // Create the report
        let animatronicReport = document.createElement('div');
        animatronicReport.classList.add('animatronic-report');
        animatronicReport.setAttribute('for', animatronic.name);
        animatronicReport.innerHTML = `
      <div class="animatronic-icon"></div>
      <div class="animatronic-name">${animatronic.name}</div>
      <div class="starting-ai-level">Starting AI level: <span>${animatronic.currentAIlevel}<span></div>
      <div class="current-ai-level">Current AI level: <span>${animatronic.currentAIlevel}</span></div>
      <div class="report-item-container"></div>
    `;
        sidebar.querySelector('#animatronic-report').appendChild(animatronicReport);
    });
};
const makeMovementCheck = (animatronic) => {
    const comparisonNumber = Math.ceil(Math.random() * 20);
    return {
        animatronicName: animatronic.name,
        canMove: animatronic.currentAIlevel >= comparisonNumber,
        scoreToBeat: comparisonNumber,
        aiLevel: animatronic.currentAIlevel,
    };
};
const increaseAILevel = (animatronic) => {
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
    // Foxy will fail all movement checks while the cameras are on
    if (user.camerasOn && Foxy.currentPosition === '1C') {
        addReport(Foxy, 'camera auto fail');
        // If Foxy fails a movement check while at 1C, he will not be able to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
    }
    else if (!movementCheck.canMove && Foxy.currentPosition === '1C') {
        addReport(Foxy, 'foxy failed pirate cove movement check', movementCheck);
    }
    else if (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition < 2) {
        // Foxy needs to make 3 successful movement checks before he is able to leave 1C
        moveAnimatronic(Foxy, { start: '1C', end: '1C', sub: Foxy.subPosition + 1 }, false);
        addReport(Foxy, 'foxy successful pirate cove movement check', movementCheck);
        console.log(Foxy.subPosition);
    }
    else if ((movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition === 2) ||
        Foxy.currentPosition === '2A') {
        // Once Foxy has made 3 successful movement checks, he can leave Pirate Cove
        if (Foxy.currentPosition === '1C') {
            // This if statement isn't necessary in normal play, but is necessary during testing when his starting position isn't 1C
            moveAnimatronic(Foxy, { start: '1C', end: '2A', sub: -1 });
            addReport(Foxy, 'foxy leaving pirate cove', movementCheck);
        }
        // Once he has left Pirate Cove, he will attempt to attack in 25 seconds or 1.87 seconds after the player looks at cam 4A, whichever comes first
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
const attemptFoxyJumpscare = (e) => {
    clearInterval(foxyInterval);
    const performFoxyJumpscareCheck = () => {
        const restartSubPosition = Math.floor(Math.random() * 2);
        if (user.rightDoorIsClosed) {
            addReport(Foxy, 'foxy right door closed', null, restartSubPosition);
            moveAnimatronic(Foxy, { start: '2A', end: '1C', sub: restartSubPosition }, false);
            foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
            // TODO - Foxy drains your power if he bashes on the door.
        }
        else {
            gameOverFoxy();
        }
    };
    // If this is happening as a result of looking at cam 4A, we need to wait 1.87 seconds before he attempts to attack
    // If this is happening as a result of him waiting 25 seconds (in which case there will be no event parameter here) he will attempt to attack immediately.
    if (e) {
        addReport(Foxy, 'foxy coming down hall');
        const foxyIcon = document.querySelector('.animatronic#Foxy');
        if (foxyIcon) {
            foxyIcon.style.animation = `foxyHallAnimation ${(1.87 * secondLength) / 1000}s linear backwards`;
        }
        foxyJumpscareCountdown = window.setTimeout(performFoxyJumpscareCheck, secondLength * 1.87);
    }
    else {
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
        }
        else {
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
    }
    else if (user.camerasOn && user.currentCamera === '4B') {
        addReport(Freddy, 'freddy and camera at 4B');
        // ✓ CAMERAS ON    ✓ HE'S AT 4B    ✓ USER IS NOT LOOKING AT 4B    ✓ HE WANTS TO ENTER THE OFFICE     X THE RIGHT DOOR IS CLOSED
    }
    else if (user.camerasOn &&
        Freddy.currentPosition === '4B' &&
        user.currentCamera !== '4B' &&
        user.rightDoorIsClosed &&
        movementCheck.canMove) {
        // Freddy can't get you when the right door is closed even if you're not looking at 4B
        // QUESTION - I HAVE ASSUMED HE RETURNS TO 4A WHEN THIS IS THE CASE?
        // QUESTION - DOES HE HAVE TO PASS A MOVEMENT CHECK BEFORE HE MOVES BACK TO 4A?
        // QUESTION - I ASSUME HE DOES A COUNTDOWN AND DOESN'T LEAVE IMMEDIATELY? Because that's not happening right here with this code
        addReport(Freddy, 'right door closed', null, '4A');
        Freddy.currentPosition = '4A';
        moveAnimatronic(Freddy, { start: '4B', end: '4A' });
        // CAMERAS ON, HE'S AT 4B, USER IS NOT LOOKING AT 4B BUT HE'S FAILED HIS MOVEMENT CHECK
    }
    else if (user.camerasOn &&
        Freddy.currentPosition === '4B' &&
        user.currentCamera !== '4B' &&
        !user.rightDoorIsClosed &&
        !movementCheck.canMove) {
        // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?
        // Freddy could have entered the office but he failed his movement check. He will continue to wait at Cam 4B
        addReport(Freddy, 'enter office failed movement check', movementCheck);
    }
    else if (!user.camerasOn && Freddy.currentPosition === '4B' && movementCheck.canMove) {
        // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?
        addReport(Freddy, 'enter office cameras off');
        // THE CAMERAS ARE ON, HE'S AT 4B, THE RIGHT DOOR IS OPEN, HE CAN GET INTO THE OFFICE!!!!!
    }
    else if (user.camerasOn && Freddy.currentPosition === '4B' && !user.rightDoorIsClosed) {
        addReport(Freddy, 'in the office');
        moveAnimatronic(Freddy, { start: '4B', end: 'office' }, false);
    }
    else if (Freddy.currentPosition === 'office') {
        makeFreddyJumpscareCheck();
    }
    else if (movementCheck.canMove) {
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
        let freddyCountdown = window.setInterval(() => {
            Freddy.currentCountdown--;
            if (Freddy.currentCountdown <= 0 && !user.camerasOn) {
                moveAnimatronic(Freddy, { start: currentPosition, end: endingPosition });
                freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
                clearInterval(freddyCountdown);
            }
            else if (Freddy.currentCountdown <= 0 && user.camerasOn) {
                addReport(Freddy, 'waiting for cameras down');
            }
        }, secondLength / framesPerSecond);
    }
    else {
        addReport(Freddy, 'failed movement check', movementCheck);
    }
};
// ========================================================================== //
// BONNIE AND CHICA
// Bonnie and Chica share much of the same logic with only minor differences.
// ========================================================================== //
const moveBonnieOrChica = (animatronic) => {
    // Figure out which set of details we need to use depending on whether it's Bonnie or Chica we're dealing with
    const name = animatronic.name;
    const newPosition = name === 'Bonnie' ? calculateNewBonniePosition() : calculateNewChicaPosition();
    const hallCorner = name === 'Bonnie' ? '2B' : '4B';
    const doorClosed = name === 'Bonnie' ? user.leftDoorIsClosed : user.rightDoorIsClosed;
    const doorClosedMessage = name === 'Bonnie' ? 'left door closed' : 'right door closed';
    const movementCheck = makeMovementCheck(animatronic);
    // They can move, aren't in their hall corner
    if (movementCheck.canMove && animatronic.currentPosition !== hallCorner) {
        moveAnimatronic(animatronic, { start: animatronic.currentPosition, end: newPosition }, true, movementCheck);
        // If he's at 2B but isn't in your doorway yet, move him into the doorway
    }
    else if (movementCheck.canMove && animatronic.currentPosition === hallCorner && animatronic.subPosition === -1) {
        moveAnimatronic(animatronic, { start: hallCorner, end: hallCorner, sub: 1 }, false);
        addReport(animatronic, 'in the doorway', movementCheck);
        // Passed a movement check, is already in the doorway and the door is not closed, they can get into your office!
    }
    else if (movementCheck.canMove &&
        animatronic.currentPosition === hallCorner &&
        animatronic.subPosition !== -1 &&
        !doorClosed) {
        moveAnimatronic(animatronic, { start: hallCorner, end: 'office', sub: -1 }, false);
        addReport(animatronic, 'enter office bonnie or chica', movementCheck);
        if (name === 'Bonnie') {
            clearInterval(bonnieInterval);
        }
        else {
            clearInterval(chicaInterval);
        }
        // Disable the doors and lights once the animatronic is in the office
        disableOfficeButtons();
        // They will jumpscare you in 30 seconds or when you next bring the cameras down - whichever comes first.
        if (name === 'Bonnie') {
            bonnieJumpscareCountdown = window.setTimeout(gameOverBonnie, secondLength * 30);
            window.addEventListener('cameras-off', gameOverBonnie);
        }
        else {
            chicaJumpscareCountdown = window.setTimeout(gameOverChica, secondLength * 30);
            window.addEventListener('cameras-off', gameOverChica);
        }
        // He meets all the critera to enter the office but the door is closed. He will return to the dining area
    }
    else if (movementCheck.canMove &&
        animatronic.currentPosition === hallCorner &&
        animatronic.subPosition !== -1 &&
        doorClosed) {
        moveAnimatronic(animatronic, { start: hallCorner, end: '1B', sub: -1 }, false);
        addReport(animatronic, doorClosedMessage, movementCheck, '1B');
        // The conditions were right to enter the office but they failed their movement check
    }
    else if (!movementCheck.canMove &&
        animatronic.currentPosition === hallCorner &&
        animatronic.subPosition !== -1 &&
        !user.leftDoorIsClosed) {
        addReport(animatronic, 'enter office failed movement check doorway', movementCheck);
        // Failed a bog standard movement check with no other fancy conditions
    }
    else if (!movementCheck.canMove) {
        addReport(animatronic, 'failed movement check', movementCheck);
    }
    else {
        addReport(animatronic, 'debug');
    }
};
// Bonnie does not have to chose adjacent rooms. He can pick at random from a list of approved locations.
const calculateNewBonniePosition = () => {
    const possibleLocations = ['1B', '3', '5', '2A', '2B'];
    const choice = Math.floor(Math.random() * possibleLocations.length);
    return possibleLocations[choice];
};
// Chica can only choose cameras adjacent to where she already is.
const calculateNewChicaPosition = () => {
    let randomChoice = Math.round(Math.random());
    let newPosition = '';
    // QUESTION - I AM ASSUMING CHICA CAN'T JUMP BETWEEN THE KITCHEN AND RESTROOMS WITHOUT GOING VIA 1B
    switch (Chica.currentPosition) {
        case '1A':
            newPosition = '1B';
            break;
        case '1B':
            newPosition = randomChoice === 0 ? '6' : '7';
            break;
        case '6':
        case '7':
            newPosition = '1B';
            break;
        case '4A':
            newPosition = randomChoice === 0 ? '1B' : '4B';
            break;
    }
    return newPosition;
};
const moveAnimatronic = (animatronic, position, logThis = true, movementCheck) => {
    var _a, _b, _c, _d, _e;
    animatronic.currentPosition = position.end;
    animatronic.subPosition = (_a = position.sub) !== null && _a !== void 0 ? _a : -1;
    if (logThis) {
        addReport(animatronic, 'has moved', movementCheck, {
            currentPosition: position.start,
            endPosition: position.end,
        });
    }
    // Update the cameras if you're looking at their start or end position
    if (user.camerasOn && (user.currentCamera === position.start || user.currentCamera === position.end)) {
        cameraArea.classList.add('updating');
    }
    window.setTimeout(() => {
        cameraScreen.src = getCameraImage(user.currentCamera);
        cameraArea.classList.remove('updating');
    }, secondLength * 2.5);
    (_b = document.querySelector(`.animatronic#${animatronic.name}`)) === null || _b === void 0 ? void 0 : _b.setAttribute('position', position.end);
    (_c = document
        .querySelector(`.animatronic#${animatronic.name}`)) === null || _c === void 0 ? void 0 : _c.setAttribute('sub-position', (_e = (_d = position.sub) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : 'none');
};
const pluralise = (number, word) => {
    let plural = number > 1 ? 's' : '';
    return word + plural;
};
const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const addReport = (animatronic, reason, movementCheck = null, additionalInfo = null // Some reports need to pass in some additional info. This can take different formats so is allowed to be an 'any' type
) => {
    var _a;
    // Figuring out what the message actually should be
    let message = '';
    let type = 'info';
    let preventDuplicates = false;
    const stats = movementCheck
        ? `<div class="report-extra-info">Score to beat: ${Math.ceil(movementCheck.scoreToBeat)} ${animatronic.name}'s AI level: ${movementCheck.aiLevel}</div>`
        : '';
    switch (reason) {
        case 'debug':
            message = `Something happened`;
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
            message = `${animatronic.name} has failed ${animatronic.pronouns[1]} movement check and will remain at cam ${animatronic.currentPosition} (${cameraNames[animatronic.currentPosition]}) ${stats}`;
            type = 'good';
            break;
        case 'freddy and camera at 4B':
            message = `Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.`;
            preventDuplicates = true;
            break;
        case 'right door closed':
            message = `${animatronic.name} was ready to enter your office but the right door was closed. ${capitalise(animatronic.pronouns[0])} will return to cam ${additionalInfo} (${cameraNames[additionalInfo]})`;
            type = 'good';
            break;
        case 'left door closed':
            message = `${animatronic.name} was ready to enter your office but the left door was closed.
      ${capitalise(animatronic.pronouns[0])} will return to cam ${additionalInfo} (${cameraNames[additionalInfo]})`;
            type = 'good';
            break;
        case 'enter office bonnie or chica':
            message = `${animatronic.name.toUpperCase()} HAS ENTERED THE OFFICE
      <div class="report-extra-info">${capitalise(animatronic.pronouns[0])} will jumpscare you in 30 seconds or the next time the camera goes down - whichever comes first</div>`;
            type = 'death-zone';
            preventDuplicates = true;
            break;
        case 'freddy office failed movement check':
            message = `Freddy is in your office but failed his movement check and was unable to jumpscare you. 
          <div class="report-extra-info">
          Score to beat: ${movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.scoreToBeat}/100   Freddy's score: ${movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.aiLevel}
          </div>`;
            type = 'death-zone';
            break;
        case 'enter office failed movement check':
            message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${animatronic.pronouns[1]} movement check. ${capitalise(animatronic.pronouns[0])} will continue to wait at cam ${animatronic.currentPosition} (${cameraNames[animatronic.currentPosition]}) ${stats}`;
            type = 'alert';
            break;
        case 'enter office failed movement check doorway':
            let doorSide = animatronic.currentPosition === '2B' ? 'left' : 'right';
            message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${animatronic.pronouns[1]} movement check.
      ${capitalise(animatronic.pronouns[0])} will continue to wait in the ${doorSide} doorway ${stats}`;
            type = 'alert';
            break;
        case 'enter office cameras off':
            message = `${animatronic.name} passed ${animatronic.pronouns[1]} movement check to enter the office but couldn't because the cameras were off.
      ${capitalise(animatronic.pronouns[0])} will continue to wait at cam ${animatronic.currentPosition} (${cameraNames[animatronic.currentPosition]}) ${stats}`;
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
      ${additionalInfo.currentPosition} (${cameraNames[additionalInfo.currentPosition]})
      to ${additionalInfo.endingPosition} (${cameraNames[additionalInfo.endingPosition]})
      in ${additionalInfo.formattedWaitingTime} seconds
      ${stats}`;
            type = 'bad';
            break;
        case 'has moved':
            message = `${animatronic.name} has moved from cam ${additionalInfo.currentPosition} (${cameraNames[additionalInfo.currentPosition]}) to cam ${additionalInfo.endPosition} (${cameraNames[additionalInfo.endPosition]})`;
            if (movementCheck) {
                message += `<div class="report-extra-info">
        Score to beat: ${movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.scoreToBeat}  ${animatronic.name}'s score: ${movementCheck === null || movementCheck === void 0 ? void 0 : movementCheck.aiLevel}
        </div>`;
            }
            type = 'bad';
            break;
        case 'foxy successful pirate cove movement check':
            const stepsRemaining = 3 - Foxy.subPosition;
            message = `Foxy has made a successful movement check. He is ${stepsRemaining} ${pluralise(stepsRemaining, 'step')}&nbsp;away from leaving Pirate Cove ${stats}`;
            type = stepsRemaining === 1 ? 'warning' : 'bad';
            break;
        case 'foxy paused':
            message = `The cameras have just been turned off. Foxy will be unable to make movement checks for ${additionalInfo.toFixed(2)} seconds <div class="report-extra-info">Random number between 0.83 and 16.67</div>`;
            break;
        case 'foxy failed pirate cove movement check':
            let stepsRemainingB = 3 - Foxy.subPosition;
            message = `Foxy has failed his movement check. He is still ${stepsRemainingB} ${pluralise(stepsRemainingB, 'step')} away from leaving 1C (${cameraNames['1C']}) ${stats}`;
            type = 'good';
            break;
        case 'foxy leaving pirate cove':
            message = `FOXY HAS LEFT ${cameraNames['1C'].toUpperCase()}
      <div class="report-extra-info">He will attempt to jumpscare you in 25 seconds or when you next look at cam 2A, whichever comes first</div>`;
            type = 'alert';
            break;
        case 'foxy right door closed':
            message = `Foxy attempted to enter your office but the right door was closed. He will return to cam 1C (${cameraNames['1C']}) at step ${additionalInfo + 1}
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
    let firstReport = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.querySelector('.report-item');
    if (preventDuplicates && firstReport && firstReport.innerHTML.indexOf(message) > 0) {
        return;
        // Don't do anything here
    }
    else if (reportToAddTo) {
        const InGameTime = calculateInGameTime();
        reportToAddTo.innerHTML = `

    <div class="report-item" type="${type}">
    <span class="report-time">${InGameTime.hour}:${InGameTime.minute}AM</span>
    <div class="report-description">${message}</div></div>
    ${(_a = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.innerHTML) !== null && _a !== void 0 ? _a : ''}
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
const getCameraImage = (cam) => {
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
const getLocationInfo = (cam) => {
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
const randomise = (chance) => Math.random() < 1 / chance;
// Note - Foxy can never be here.
const generateCamImage1A = () => {
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
const generateCamImage1B = () => {
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
const generateCamImage1C = () => {
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
const generateCamImage2B = () => {
    let info = getLocationInfo('2B');
    // There are 3 different options for Bonnie's images, with some being more
    // likely than others.
    if (info.bonnieIsHere && Bonnie.subPosition === -1) {
        let bonnieRandomiser = Math.ceil(Math.random() * 8);
        if (bonnieRandomiser === 1) {
            return '2B-bonnie-3.webp';
        }
        else if (bonnieRandomiser > 6) {
            return '2B-bonnie-2.webp';
        }
        else {
            return '2B-bonnie-1.webp';
        }
    }
    let emptyRandomiser = randomise(4) ? '-2' : '-1';
    return `2B-empty${emptyRandomiser}.webp`;
};
// Bonnie is the only animatronic who can be here, and only has one image :)
const generateCamImage3 = () => (getLocationInfo('3').bonnieIsHere ? '3-bonnie.webp' : '3-empty.webp');
// Freddy or Chica may be here
const generateCamImage4A = () => {
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
    }
    else if (emptyRandomiser === 2) {
        return `4A-empty-2.webp`;
    }
    else {
        return '4A-empty-default.webp';
    }
};
// Freddy or Chica may be here.
const generateCamImage4B = () => {
    let info = getLocationInfo('4B');
    if (info.freddyIsAlone) {
        return '4B-freddy.webp';
    }
    if (info.chicaIsHere && Chica.subPosition === -1) {
        let chicaRandomiser = Math.ceil(Math.random() * 6);
        if (chicaRandomiser === 1) {
            return '4B-chica-3.webp';
        }
        else if (chicaRandomiser === 2) {
            return '4B-chica-2.webp';
        }
        else {
            return '4B-chica-1.webp';
        }
    }
    // It must be empty if we've reached this point
    // There are 5 image options here, with one being FAR more likely than the others
    let emptyRandomiser = Math.ceil(Math.random() * 30);
    if (emptyRandomiser === 1) {
        return '4B-empty-4.webp';
    }
    else if (emptyRandomiser === 2) {
        return '4B-empty-3.webp';
    }
    else if (emptyRandomiser === 3) {
        return '4B-empty-3.webp';
    }
    else if (emptyRandomiser === 4) {
        return '4B-empty-2.webp';
    }
    else if (emptyRandomiser === 5) {
        return '4B-empty-1.webp';
    }
    else {
        return '4B-empty-default.webp';
    }
};
// Bonnie is the only animatronic who can be here. There are 2 options for
// Bonnie and 2 options for empty
const generateCamImage5 = () => {
    let randomiser = randomise(8) ? '-2' : '-1';
    return getLocationInfo('5').bonnieIsHere ? `5-bonnie${randomiser}.webp` : `5-empty${randomiser}.webp`;
};
const generateCamImage7 = () => {
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
    if (user.camerasOn) {
        lookAtCamera(user.currentCamera);
    }
    if (!user.camerasOn) {
        window.dispatchEvent(new Event('cameras-off'));
        console.log('Cameras off');
    }
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
            user.currentCamera = key;
            if (user.camerasOn) {
                lookAtCamera(user.currentCamera);
            }
        });
    }
};
// We need to listen for certain cameras in certain situations.
// This will publish an event when a given camera is being looked at
const lookAtCamera = (camera) => {
    window.dispatchEvent(new Event(`cam-on-${camera}`));
    console.log(`cam-on-${camera}`);
    cameraScreen.src = getCameraImage(camera);
};
// ========================================================================== //
// DOORS
// ========================================================================== //
const initialiseDoors = () => {
    ['left', 'right'].forEach((direction) => {
        var _a;
        // Create door buttons
        let myButton = document.createElement('button');
        myButton.classList.add('door-button');
        myButton.textContent = `Close ${direction} door`;
        myButton.setAttribute('door', direction);
        (_a = document.querySelector('#door-controls')) === null || _a === void 0 ? void 0 : _a.append(myButton);
        // Make the door buttons toggle the doors
        myButton.addEventListener('click', () => {
            var _a;
            myButton.classList.toggle('active');
            (_a = simulator.querySelector(`g#${direction}-door-close-icon`)) === null || _a === void 0 ? void 0 : _a.classList.toggle('hidden');
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
const gameOver = (e) => {
    console.log(e);
    // Clear all the intervals and timeouts so the game stops running
    clearInterval(timeUpdate);
    clearInterval(frameUpdate);
    clearInterval(bonnieInterval);
    clearInterval(chicaInterval);
    clearInterval(foxyInterval);
    clearInterval(freddyInterval);
    clearInterval(foxyCooldown);
    clearInterval(foxyJumpscareCountdown);
    clearInterval(bonnieJumpscareCountdown);
    clearInterval(chicaJumpscareCountdown);
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
window.addEventListener('game-over-bonnie', gameOver);
window.addEventListener('game-over-chica', gameOver);
window.addEventListener('game-over-foxy', gameOver);
window.addEventListener('game-over-freddy', gameOver);
// const gameOver = (e: Event) => {
//   // alert('You got jumpscared');
//   console.log(e);
//   [timeUpdate, frameUpdate, bonnieInterval, chicaInterval, foxyInterval, freddyInterval].forEach((int) => {
//     clearInterval(int);
//   });
//   window.removeEventListener('cameras-off', pauseFoxy);
//   cameraButton.removeEventListener('click', toggleCameras);
//   window.removeEventListener('cam-on-2A', attemptFoxyJumpscare);
//   window.removeEventListener('cameras-off', gameOver);
//   let gameOverWindow = document.createElement('div');
//   gameOverWindow.id = 'game-over';
//   gameOverWindow.classList.add('modal');
//   document.querySelector('#simulator-container')?.append(gameOverWindow);
//   gameOverWindow.innerHTML = `
//     <h2>GAME OVER</h2>
//   `;
// };
// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //
const startGame = () => {
    document.body.setAttribute('game-has-started', 'true');
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
    generateAnimatronics();
    generateCameraButtons();
    cameraButton.addEventListener('click', toggleCameras);
    // cameraButton.addEventListener('mouseenter', toggleCameras);
    window.addEventListener('cameras-off', pauseFoxy);
};
const initialiseMenu = () => {
    var _a;
    let gameMenu = document.querySelector('#game-menu');
    let nightMenu = gameMenu.querySelector('#night-selector-menu');
    let customNightMenu = gameMenu.querySelector('#custom-night-menu');
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
        aiDisplay.readOnly = true;
        aiDisplay.value = animatronic.aiLevels[7].toString();
        aiAdjuster.append(aiDisplay);
        let myDecreaseButton = document.createElement('button');
        myDecreaseButton.textContent = '<';
        myDecreaseButton.addEventListener('click', () => {
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
    for (let i = 1; i <= 6; i++) {
        let myButton = document.createElement('button');
        myButton.classList.add('simulate-night');
        myButton.textContent = `Simulate night ${i}`;
        nightMenu.append(myButton);
        myButton.addEventListener('click', () => {
            nightToSimulate = i;
            // startGame();
            [Freddy, Bonnie, Chica, Foxy].forEach((animatronic) => {
                let myInput = customNightMenu.querySelector(`[for="${animatronic.name}"] input`);
                myInput.value = animatronic.aiLevels[nightToSimulate].toString();
                console.log(animatronic);
            });
        });
    }
    (_a = gameMenu.querySelector('#start-game')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', startGame);
};
// All of the variables saved for various setIntervals and setTimeouts. These will be set and unset in various conditions so need to be global.
let timeUpdate;
let frameUpdate;
let bonnieInterval;
let chicaInterval;
let foxyInterval;
let freddyInterval;
let foxyCooldown;
let foxyJumpscareCountdown;
let bonnieJumpscareCountdown;
let chicaJumpscareCountdown;
initialiseMenu();
export {};
// startGame();
