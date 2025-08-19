# ORDINARY DEFENSE 2 - TACTICAL OPERATIONS

This document serves as a quick reference guide for developers working on "Ordinary Defense 2 - Tactical Operations".

## 1. Project Overview

"Ordinary Defense 2" is a 3D tower defense game built using Babylon.js. Players strategically place towers and colonies to defend against waves of enemies.

## 2. Setup

To run the project locally:

1.  Ensure you have a local web server (e.g., Apache, Nginx, Node.js `http-server`).
2.  Serve the project directory (`/home/damion/Desktop/oRDIANRY dEFENSE 2/`) through your web server.
3.  Open `index.html` in your web browser.

## 3. Project Structure

Here's a breakdown of the key directories and files:

*   **`/` (Root Directory)**:
    *   `game.js`: **CORE GAME LOGIC**. Manages game state, scene, input, UI, entity placement, enemy spawning, and the main game loop.
    *   `enemy.js`: Defines the `Enemy` class (movement, health, etc.).
    *   `player.js`: Defines the `Player` class (player character logic).
    *   `colony.js`: Defines the `Colony` class (model loading, placement, etc.).
    *   `skybox.js`: Handles the 3D skybox environment.
    *   `weather.js`: Implements dynamic weather effects.
    *   `particle.js`: Contains functions for particle effects (e.g., hit, explosion).
    *   `index.html`: The main entry point. Loads all scripts, styles, and assets.
    *   `hud.css`: Stylesheet for the in-game UI.

*   **`assets/`**: Contains all game assets.
    *   `images/`: 2D image assets (e.g., UI elements, textures).
    *   `lore/`: Audio files for in-game lore.
    *   `models/`: 3D models (`.glb` is the primary format).
    *   `music/`: Background music and sound effects.
    *   `video/`: Video assets (e.g., intro video).

*   **`readmes and spine/`**: Developer documentation and supporting files.
    *   `README.md` (This file): Project documentation.
    *   `pause.js`: Logic for the in-game pause menu.
    *   `BABYLONJSBIBLE2.txt`: Notes or references related to Babylon.js.
    *   `Complete Babylon.js GLB_GLTF Loaders and Plugins R.pdf`: Babylon.js documentation.

## 4. Development Workflow

*   **Code Style**: Adhere to existing JavaScript conventions within the project (e.g., variable naming, indentation).
*   **Babylon.js**: Familiarity with Babylon.js concepts (Scenes, Meshes, Materials, Cameras, Lights, Particle Systems) is essential.
*   **Testing**: Currently, there are no dedicated unit tests. Manual testing by running the game in a browser is the primary method.
*   **Version Control**: (Assumed to be Git) Commit small, atomic changes with clear commit messages.

## 5. Common Tasks

*   **Adding a New Tower Type**:
    1.  Create/obtain a new 3D model and place it in `assets/models/`.
    2.  Update `game.js`:
        *   Add a new entry to `this.towerTypes` with its cost, damage, range, etc.
        *   Update the `createTower` function's `switch` statement to load the new model.
    3.  Update `index.html`: Add a new button for the tower in the "WEAPON SYSTEMS" section.

*   **Adding a New Enemy Type**:
    1.  Create/obtain a new 3D model and place it in `assets/models/`.
    2.  Update `game.js`:
        *   Modify the `spawnEnemy` function to conditionally load the new model based on wave number or other criteria.
        *   Adjust health, speed, and reward as needed.

*   **Adding a New Colony Type**:
    1.  Create/obtain a new 3D model and place it in `assets/models/`.
    2.  Update `game.js`:
        *   Add a new entry to `this.towerTypes` (or a separate `colonyTypes` if more complex) for the new colony.
        *   Modify `createColony` if different colony models are needed.
    3.  Update `index.html`: Add a new button for the colony.

*   **Modifying UI**:
    *   For structure and content: `index.html`.
    *   For styling: `hud.css`.

## 6. Babylon.js Resources

*   [Babylon.js Documentation](https://doc.babylonjs.com/)
*   [Babylon.js Playground](https://playground.babylonjs.com/) (Excellent for testing small code snippets)
*   Refer to the existing PDF and TXT files in this directory for additional insights.

---
