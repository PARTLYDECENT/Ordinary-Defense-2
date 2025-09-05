const objectives = [
    {
        id: 1,
        description: "Survive for 5 minutes.",
        completed: false,
        timeRequirement: 300, // 5 minutes in seconds
    },
    {
        id: 2,
        description: "Kill 10 enemies.",
        completed: false,
        killRequirement: 10,
    },
    {
        id: 3,
        description: "Build 5 towers.",
        completed: false,
        buildRequirement: 5,
    }
];

let currentObjectiveIndex = 0;
let startTime = null;
let kills = 0;
let towersBuilt = 0;
let objectivesActive = false;
let objectiveInterval = null;

function displayObjective() {
    const objectivesContainer = document.getElementById("objectives-container");
    if (objectivesContainer) {
        objectivesContainer.innerHTML = `
            <div class="objective">
                <p>${objectives[currentObjectiveIndex].description}</p>
            </div>
        `;
    }
}

// show a temporary mission popup (e.g. "MISSION 1")
function showMissionPopup(index) {
    const popup = document.createElement('div');
    popup.id = 'objective-popup';
    popup.textContent = `MISSION ${index + 1}`;
    // basic inline styling so it appears visibly without requiring CSS edits
    Object.assign(popup.style, {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '20px 30px',
        background: 'rgba(0,0,0,0.8)',
        color: '#fff',
        fontSize: '28px',
        fontWeight: '700',
        borderRadius: '8px',
        zIndex: 9999,
        textAlign: 'center',
        pointerEvents: 'none'
    });
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.style.transition = 'opacity 300ms';
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 300);
    }, 1800);
}

// try to play an objective audio, with fallbacks if the primary file isn't available
async function playObjectiveAudio(index) {
    const candidates = [
        `assets/music/objective${index + 1}.mp3`,
        `assets/music/objective${index + 1}.wav`,
        'assets/music/1.wav',
        'assets/music/intro1.mp3'
    ];

    for (const path of candidates) {
        try {
            const audio = new Audio(path);
            audio.volume = 0.9;
            await audio.play();
            return; // stop after first successful play
        } catch (e) {
            // try next candidate
        }
    }
}

function updateObjectives() {
    if (!objectivesActive) return; // don't update until objectives are started

    if (startTime === null) {
        startTime = Date.now();
    }

    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds

    const currentObjective = objectives[currentObjectiveIndex];

    if (!currentObjective.completed) {
        if (currentObjective.timeRequirement && elapsedTime >= currentObjective.timeRequirement) {
            currentObjective.completed = true;
            nextObjective();
            return;
        }
        if (currentObjective.killRequirement && kills >= currentObjective.killRequirement) {
            currentObjective.completed = true;
            nextObjective();
            return;
        }
        if (currentObjective.buildRequirement && towersBuilt >= currentObjective.buildRequirement) {
            currentObjective.completed = true;
            nextObjective();
            return;
        }
    }
}

function nextObjective() {
    if (currentObjectiveIndex < objectives.length - 1) {
        currentObjectiveIndex++;
        // reset timer for next objective that has a timeRequirement
        startTime = null;
        displayObjective();
    } else {
        const objectivesContainer = document.getElementById("objectives-container");
        if (objectivesContainer) {
            objectivesContainer.innerHTML = `
                <div class="objective">
                    <p>All objectives completed!</p>
                </div>
            `;
        }
        // stop updates
        objectivesActive = false;
        if (objectiveInterval) {
            clearInterval(objectiveInterval);
            objectiveInterval = null;
        }
    }
}

// Call this function when an enemy is killed
function enemyKilled() {
    kills++;
    updateObjectives();
}

// Call this function when a tower is built
function towerBuilt() {
    towersBuilt++;
    updateObjectives();
}

// Start objectives when player engages. Does not auto-start on load.
function startObjectives() {
    if (objectivesActive) return; // already running
    // reset state for a fresh run
    objectives.forEach(o => o.completed = false);
    currentObjectiveIndex = 0;
    startTime = null;
    kills = 0;
    towersBuilt = 0;

    objectivesActive = true;
    // show mission popup and play audio when objectives start
    showMissionPopup(currentObjectiveIndex);
    playObjectiveAudio(currentObjectiveIndex);
    displayObjective();
    // run updates every second
    objectiveInterval = setInterval(updateObjectives, 1000);
}

// expose a global function so the game can call it when the player "engages"
window.startObjectives = startObjectives;
window.engageObjectives = startObjectives;

// Note: don't auto-start. Call startObjectives() when the player engages in the game.
