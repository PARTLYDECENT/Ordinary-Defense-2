let game;

class TowerDefenseGame {
    constructor() {
        console.log("🎮 Initializing Enhanced Tower Defense Game...");
        this.canvas = document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true, { 
            preserveDrawingBuffer: true, 
            stencil: true,
            antialias: true
        });
        this.scene = null;
        this.camera = null;
        
        // Game state
        this.gold = 1000;
        this.lives = 50;
        this.playerHealth = 100;
        this.maxPlayerHealth = 100;
        this.score = 0;
        this.wave = 0;
        this.enemiesInWave = 4;
        this.enemiesSpawned = 0;
        this.selectedTowerType = 'basic';
        this.gameStarted = false;
        this.isPaused = false;
        this.lastPauseToggle = 0;
        
        this.assetDescriptions = {
            'basic': { title: 'M4 TURRET', description: 'A standard automatic turret, effective against light armored units. Good all-around defense.' },
            'missile': { title: 'RPG LAUNCHER', description: 'Launches powerful rockets that deal area-of-effect damage. Ideal for groups of enemies or heavily armored targets.' },
            'laser': { title: 'RAIL GUN', description: 'Fires high-energy laser beams with pinpoint accuracy and piercing power. Excellent against fast, single targets.' },
            'light': { title: 'LIGHT TOWER', description: 'Illuminates the surrounding area with a bright point light. Helps visibility in dark conditions.' },
            'colony': { title: 'COLONY', description: 'Establishes a new settlement, expanding your territory and providing a new target for enemies. Essential for strategic defense.' },
            'playerAttack': { title: 'PLAYER ATTACK', description: 'Calls in a powerful player-controlled attack drone that clears all enemies on the map. Use wisely!' },
            'researchStation': { title: 'RESEARCH STATION', description: 'Unlocks new technologies and upgrades for your towers and units. Invest in research to gain a strategic advantage.' },
            'farmingUnit': { title: 'FARMING UNIT', description: 'Generates a steady income of gold over time. Essential for sustaining your defense and expanding your economy.' },
            'enemy.glb': { title: 'STANDARD ENEMY', description: 'A common ground unit. Weak armor, but can overwhelm in numbers.' },
            'enemy2.glb': { title: 'HEAVY ENEMY', description: 'A more resilient ground unit with thicker armor. Requires sustained fire.' },
            'player.glb': { title: 'PLAYER UNIT', description: 'Your primary combat unit. Agile and equipped with versatile weaponry.' },
            'egg.glb': { title: 'ALIEN EGG', description: 'A fragile alien egg. Destroy it to prevent enemy spawns.' },
            'tentacle_ship.glb': { title: 'LORE CUBE', description: 'An ancient alien artifact containing valuable lore data. Interact to uncover secrets.' },
            '1.wav': { title: 'MUSIC TRACK 1', description: 'An atmospheric background track.' },
            '11.wav': { title: 'MUSIC TRACK 11', description: 'Another atmospheric background track.' },
        };
        
        // Video elements
        this.introVideo = null;
        this.videoContainer = null;
        
        // Music
        this.musicFiles = [
            "assets/music/1.wav",
            "assets/music/2.wav",
            "assets/music/3.wav",
            "assets/music/4.wav",
            "assets/music/5.wav",
            "assets/music/6.wav",
            "assets/music/7.wav",
            "assets/music/8.wav",
            "assets/music/9.wav",
            "assets/music/10.wav",
            "assets/music/11.wav",
            "assets/music/12.wav"
        ];
        this.currentMusic = null;
        this.currentMusicIndex = -1; // To avoid immediate repeats
        
        // Sound effects
        this.damageSound = null;
        this.shotBasicSound = null;
        this.shotMissileSound = null;
        this.shotLaserSound = null;
        this.enemyShotSound = null; // Added for enemy shots
        this.loreSound = null;
        this.lore2Sound = null; // New lore sound
        this.lore3Sound = null; // New lore sound for game start
        this.lore4Sound = null; // New lore sound
        this.lore5Sound = null; // New lore sound
        this.firstEnemyKilled = false; // Flag for first enemy kill
        this.lore1PlayedOnPause = false; // Flag to play lore1.mp3 only once on pause
        this.lore4Played = false; // Flag for lore4.mp3 to play once
        this.lore5Played = false; // Flag for lore5.mp3 to play once
        this.pauseMenu = null; // New pause menu instance
        this.sfx1Sound = null;
        this.fartSound = null; // New: Fart sound for vehicle
        this.eggSound = null; // New: Egg sound
        this.towerPlacedCount = 0;
        this.loreEggMesh = null; // To store the lore egg mesh
        this.loreEggCollected = false; // To track if the lore egg has been collected
        this.loreCubeMesh = null; // To store the lore cube mesh
        // lore content state
        this.loreContent = this.loreContent || [];
        this.unlockedLore = this.unlockedLore || [];
        this.currentLoreIndex = typeof this.currentLoreIndex === 'number' ? this.currentLoreIndex : 0;
        this.farmingInterval = null; // To store the farming unit interval

        // Game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = []; // Added for enemy projectiles
        this.colonies = []; // New: Array to store colonies
        this.farmingUnits = []; // New: Array to store farming units
        this.tentacleOrbs = []; // To store tentacle orb instances
        this.ufos = []; // New: Array to store UFO instances
        this.path = [];
        this.pathMeshes = [];
        this.ground = null;
        this.player = null;
        this.drivableVehicle = null;
        this.collectibleEgg = null;
        this.allEggsDestroyed = false;

        // Input
        this.keys = {};
        this.playerControlState = 'camera'; // 'camera' or 'vehicle'
        this.vehicleSpeed = 0;
        this.vehicleRotationSpeed = 0;
        this.isPointerLocked = false;
        this.weatherSystem = null;
        this.cameraSensitivity = 0.002; // Reduced sensitivity
        this.targetCameraRotation = null;
        this.cameraRotationSpeed = 0.1; // Smoothing factor

        this.entryPoints = [
            new BABYLON.Vector3(-100, 0, 150),
            new BABYLON.Vector3(100, 0, 150),
            new BABYLON.Vector3(-100, 0, -150),
            new BABYLON.Vector3(100, 0, -150),
        ];
        this.targetColony = null;
        
        // Tower definitions - rebalanced
        this.towerTypes = {
            basic: { cost: 40, damage: 25, range: 30, fireRate: 900, color: '#ff6b35', name: 'BASIC' },
            missile: { cost: 85, damage: 60, range: 32, fireRate: 1400, color: '#e74c3c', name: 'MISSILE' },
            laser: { cost: 130, damage: 40, range: 38, fireRate: 350, color: '#3498db', name: 'LASER' },
            light: { cost: 50, damage: 0, range: 25, fireRate: 0, color: '#ffeb3b', name: 'LIGHT' }, // New: Light tower
            colony: { cost: 20, name: 'COLONY' }, // New: Colony definition
            playerAttack: { cost: 100, name: 'PLAYER ATTACK' }, // New: Player Attack special weapon
            researchStation: { cost: 500, name: 'RESEARCH STATION' }, // New: Research Station definition
            farmingUnit: { cost: 300, name: 'FARMING UNIT' } // New: Farming Unit definition
        };
        
        this.isEnhancedWeather = true;
        this.init();
    }

    triggerStoryPopups() {
        popupManager.addMessage("Captain's Log: Day 1. We've established Outpost Prime. The indigenous life seems... unsettling.", 5000);
        popupManager.addMessage("Day 3: The fog is constant. Strange noises in the distance. Jenkins from Bravo team went missing.", 15000);
        popupManager.addMessage("Day 5: We found Jenkins. Or what was left of him. The local fauna is more aggressive than anticipated.", 30000);
        popupManager.addMessage("Day 7: They're testing our defenses. Small, coordinated attacks. They're intelligent.", 45000);
        popupManager.addMessage("Day 9: The attacks are relentless. We're losing ground. The perimeter is breached.", 60000);
        popupManager.addMessage("Day 10: Communications are down. We're on our own. The sky is swarming with them.", 75000);
        popupManager.addMessage("Day 11: The main generator is down. We're in the dark. They're inside the walls.", 90000);
        popupManager.addMessage("Day 12: I can hear them scratching at the door. This is my last entry. If anyone finds this... it's too late.", 105000);
        popupManager.addMessage("...", 120000);
        popupManager.addMessage("...", 125000);
        popupManager.addMessage("...", 130000);
        popupManager.addMessage("Signal Lost.", 140000);
    }

    async activatePlayerAttack() {
        if (this.isPaused) return;

        console.log("🚀 Activating Player Attack!");

        // Ensure there are enemies to attack
        if (this.enemies.length === 0) {
            console.log("No enemies to attack!");
            return;
        }

        // Load player model for the attack
        // Assuming createPlayer is now a utility function that can load the model
        // and return its mesh, without attaching it to camera controls.
        const playerAttackModel = await createPlayer(this.scene, this); 
        
        // Position the player model off-screen, ready to fly in
        playerAttackModel.position = new BABYLON.Vector3(-100, 50, 0); // Start far left, high up
        playerAttackModel.rotation.y = Math.PI / 2; // Face right

        // Animate the player model flying across the map
        const flyInAnimation = new BABYLON.Animation(
            "playerAttackFlyIn",
            "position",
            60, // frames per second
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({ frame: 0, value: new BABYLON.Vector3(-100, 50, 0) });
        keys.push({ frame: 120, value: new BABYLON.Vector3(100, 50, 0) }); // Fly across to the right

        flyInAnimation.setKeys(keys);
        playerAttackModel.animations.push(flyInAnimation);

        this.scene.beginAnimation(playerAttackModel, 0, 120, false, 1, () => {
            // Once animation is complete, destroy all enemies
            console.log("💥 Player Attack: Destroying all enemies!");
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                this.createExplosionParticles(enemy.mesh.position); // Visual effect
                if (enemy.healthBar) enemy.healthBar.dispose();
                enemy.mesh.dispose();
                this.enemies.splice(i, 1);
                this.gold += enemy.reward; // Grant gold for destroyed enemies
                this.score += enemy.reward * 15; // Grant score
            }
            this.updateUI();
            
            // Dispose of the player attack model
            playerAttackModel.dispose();
            console.log("Player Attack complete. Model disposed.");
        });
    }

    async init() {
        try {
            // Get video elements
            this.introVideo = document.getElementById('introVideo');
            this.videoContainer = document.getElementById('videoContainer');
            this.loreVideo = document.getElementById('loreVideo');
            this.loreVideoContainer = document.getElementById('loreVideoContainer');
            this.lore2Video = document.getElementById('lore2Video');
            this.lore2VideoContainer = document.getElementById('lore2VideoContainer');
            this.datalogContainer = document.getElementById('datalogContainer');
            this.datalogIframe = document.getElementById('datalogIframe');

            // Hide loading screen immediately
            document.getElementById('loading').style.display = 'none';

            this.introVideo.onended = () => {
                this.startGameAfterVideo();
            };

        } catch (error) {
            console.error("❌ Failed to initialize game:", error);
            document.getElementById('loading').innerHTML = "❌ Failed to load game";
        }
    }

    async startGameAfterVideo() {
        // Hide video container
        if (this.videoContainer) {
            this.videoContainer.style.display = 'none';
        }

        // Create scene and other game elements
        await this.createScene();
        this.weatherSystem = new EnhancedWeatherSystem(this.scene, this.engine);
        // Start raining immediately at game start (guarded)
        if (this.weatherSystem && typeof this.weatherSystem.startRain === 'function') {
            try { this.weatherSystem.startRain(); } catch (e) { console.warn('Weather startRain failed:', e); }
        }
        await this.createTerrain();
        this.createEntryPointMarkers(); // Add visual markers for spawn points
        const sprawlingPlantPosition = new BABYLON.Vector3(-80, 0, 0);
        const sprawlingPlantConfig = {
            growthRate: (0.02 + Math.random() * 0.03) / 10,
            maturityAge: 60, // 1 minute
            spreadChance: 0.1,
            maxOffspring: 1, // So it only turns into 2
        };
        new SprawlingPlant(this.scene, sprawlingPlantPosition, sprawlingPlantConfig);

        const predatoryThornvinePosition = new BABYLON.Vector3(80, 0, 0);
        const predatoryThornvineConfig = {
            growthRate: (0.08 + Math.random() * 0.05) / 10,
            maturityAge: 60, // 1 minute
            spreadChance: 0.1,
            maxOffspring: 1,
        };
        new PredatoryThornvine(this.scene, predatoryThornvinePosition, predatoryThornvineConfig);
                                                        this.tentacleOrbs = spawnTentacleOrbs(this.scene, 3, 200);
        this.ufos = spawnUFOs(this.scene, this, 3); // Spawn 3 UFOs
        this.ufoVisibilityInterval = null; // New: To manage UFO visibility timing
        this.path = [];
        this.createCamera();
        this.createDrivableVehicle();
        this.spawnLoreCube(); // Spawn the lore cube
        createWarSkybox(this.scene); // Create skybox AFTER camera is ready
        this.setupControls();
        this.setupUI();
        this.startGameLoop();
        this.initMusic();
        this.damageSound = document.getElementById('damageSound');
        this.shotBasicSound = document.getElementById('shotBasicSound');
        this.shotMissileSound = document.getElementById('shotMissileSound');
        this.shotLaserSound = document.getElementById('shotLaserSound');
        this.enemyShotSound = document.getElementById('enemyShotSound');
                        if (this.loreSound) {
                    this.loreSound.pause();
                    this.loreSound.currentTime = 0;
                }
        this.lore2Sound = document.getElementById('lore2Sound'); // Initialize lore2Sound
        this.lore3Sound = document.getElementById('lore3Sound'); // Initialize lore3Sound
        this.lore4Sound = document.getElementById('lore4Sound'); // Initialize lore4Sound
        this.lore5Sound = document.getElementById('lore5Sound'); // Initialize lore5Sound
        this.sfx1Sound = document.getElementById('sfx1Sound');
        this.fartSound = document.getElementById('fartSound'); // Initialize fartSound
        this.eggSound = document.getElementById('eggSound'); // Initialize eggSound
        
        // Initialize pause menu
        this.pauseMenu = new PauseMenu(this); // Pass game instance to pause menu

        // Show UI
        document.getElementById('ui').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
        document.getElementById('waveInfo').style.display = 'block';
        
        this.setupDatalogControls(); // New: Setup datalog controls
        
        // Create and add hands.png overlay
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const handsContainer = new BABYLON.GUI.Rectangle("handsContainer");
        handsContainer.width = "50%";
        handsContainer.height = "50%";
        handsContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        handsContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        handsContainer.thickness = 0;
        advancedTexture.addControl(handsContainer);

        const handsImage = new BABYLON.GUI.Image("hands", "assets/images/hands.png");
        handsImage.width = "100%";
        handsImage.height = "100%";
        handsImage.alpha = 0.5; // Adjust transparency as needed
        handsContainer.addControl(handsImage);
        this.handsImage = handsImage; // Make handsImage accessible as a class property

        // Add more robust animation to handsImage
        // Scale animation
        const scaleAnimation = new BABYLON.Animation(
            "handsScaleAnimation",
            "scaleY",
            30, // frames per second
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const scaleKeys = [];
        scaleKeys.push({ frame: 0, value: 1.0 });
        scaleKeys.push({ frame: 30, value: 1.02 }); // Slight pulse up
        scaleKeys.push({ frame: 60, value: 1.0 });
        scaleAnimation.setKeys(scaleKeys);

        // Opacity animation
        const opacityAnimation = new BABYLON.Animation(
            "handsOpacityAnimation",
            "alpha",
            30, // frames per second
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const opacityKeys = [];
        opacityKeys.push({ frame: 0, value: 0.5 });
        opacityKeys.push({ frame: 20, value: 0.45 }); // Subtle flicker
        opacityKeys.push({ frame: 40, value: 0.55 });
        opacityKeys.push({ frame: 60, value: 0.5 });
        opacityAnimation.setKeys(opacityKeys);

        // Attach and play animations
        this.scene.beginDirectAnimation(handsImage, [scaleAnimation, opacityAnimation], 0, 60, true);

        // Add LED dots to handsImage
        this.createLedDots(handsContainer);

        // Setup collapsible menu
        const toggleWeaponSystemsBtn = document.getElementById('toggleWeaponSystems');
        const weaponSystemsContent = document.getElementById('weaponSystemsContent');
        if (toggleWeaponSystemsBtn && weaponSystemsContent) {
            toggleWeaponSystemsBtn.addEventListener('click', () => {
                weaponSystemsContent.classList.toggle('collapsed');
                toggleWeaponSystemsBtn.textContent = weaponSystemsContent.classList.contains('collapsed') ? '▼' : '▲';
            });
        }

        const toggleEngineeringBtn = document.getElementById('toggleEngineering');
        const engineeringContent = document.getElementById('engineeringContent');
        if (toggleEngineeringBtn && engineeringContent) {
            toggleEngineeringBtn.addEventListener('click', () => {
                engineeringContent.classList.toggle('collapsed');
                toggleEngineeringBtn.textContent = engineeringContent.classList.contains('collapsed') ? '▼' : '▲';
            });
        }

        // Play lore3 audio at start
        if (this.lore3Sound) {
            this.lore3Sound.play().catch(e => console.error("Error playing lore3 audio:", e));
        }
        
        console.log("✅ Game loaded successfully!");
        this.engine.runRenderLoop(() => {
            if (this.scene && !this.isPaused) {
                this.scene.render();
            }
        });

        // Unmute background music if it was muted
        if (this.currentMusic) {
            this.currentMusic.muted = false;
            this.currentMusic.volume = 0.3; // Restore desired volume
        }
    }

    async createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        
        // Lighting and fog are now primarily controlled by weather.js and the skybox shader.
        // We will not add any lights here to avoid conflicts.

        // Skybox will be created in startGameAfterVideo after the camera is initialized.

        console.log("🌍 Enhanced scene created");
    }

    async createTerrain() {
        const meshes = await this.loadModel("assets/models/", "map.glb");

        if (meshes.length > 0) {
            this.ground = meshes[0];
            this.ground.name = "ground"; // Explicitly set the name to "ground"
            console.log("🌱 Terrain loaded from map.glb", this.ground);

        } else {
            console.error("❌ No meshes found in map.glb");
        }
    }

    createEntryPointMarkers() {
        console.log("Creating entry point markers...");
        const markerMaterial = new BABYLON.StandardMaterial("markerMat", this.scene);
        markerMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
        markerMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2); // Glowing red
        markerMaterial.alpha = 0.5; // Semi-transparent

        this.entryPoints.forEach((point, index) => {
            const marker = BABYLON.MeshBuilder.CreateBox(`entryMarker_${index}`, {size: 3}, this.scene);
            marker.material = markerMaterial;
            
            // Raycast to position the marker on the ground
            const ray = new BABYLON.Ray(new BABYLON.Vector3(point.x, 1000, point.z), new BABYLON.Vector3(0, -1, 0));
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);

            if (hit.hit) {
                marker.position = new BABYLON.Vector3(point.x, hit.pickedPoint.y + 1.5, point.z);
            } else {
                marker.position = new BABYLON.Vector3(point.x, 1.5, point.z); // Fallback
            }

            // Add a rotation animation
            const rotationAnimation = new BABYLON.Animation(
                "markerRotation",
                "rotation.y",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            const keys = [];
            keys.push({ frame: 0, value: 0 });
            keys.push({ frame: 90, value: 2 * Math.PI });
            rotationAnimation.setKeys(keys);
            marker.animations.push(rotationAnimation);
            this.scene.beginAnimation(marker, 0, 90, true);
        });
        console.log(`✅ ${this.entryPoints.length} entry point markers created.`);
    }

    createEnhancedPath(startPoint, endPoint) {
        if (!startPoint || !endPoint) {
            this.path = [];
            return;
        }
    
        const points = [];
        const segments = 10; // Number of segments for the path
        for (let i = 0; i <= segments; i++) {
            points.push(BABYLON.Vector3.Lerp(startPoint, endPoint, i / segments));
        }
    
        this.path = points.map(point => {
            const ray = new BABYLON.Ray(new BABYLON.Vector3(point.x, 1000, point.z), new BABYLON.Vector3(0, -1, 0));
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);
            if (hit.hit) {
                point.y = hit.pickedPoint.y + 0.15; // Slightly above ground
            } else {
                point.y = 0.15;
            }
            return point;
        });
    
        // Clear existing path meshes
        this.pathMeshes.forEach(mesh => mesh.dispose());
        this.pathMeshes = [];
    
        // Create visual path
        const pathLine = BABYLON.MeshBuilder.CreateLines("pathLine", { points: this.path }, this.scene);
        pathLine.color = new BABYLON.Color3(0.8, 0.5, 0.2);
        pathLine.visibility = 0.5; // Make it semi-visible for debugging or style
        this.pathMeshes.push(pathLine);
    
        console.log("🛤️ Dynamic path created with", this.path.length, "waypoints");
    }

    createCamera() {
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 9, -17), this.scene);
        this.camera.rotation.x = Math.PI / 6; // Look down at good angle
        this.camera.fov = 0.9; // Reduced FOV for smaller perspective
        this.targetCameraRotation = new BABYLON.Vector2(this.camera.rotation.x, this.camera.rotation.y);
        this.camera.attachControl(this.canvas, false);
        this.scene.activeCamera = this.camera;
        this.camera.maxZ = 2000; // Reduced view distance
        console.log("📷 Camera positioned with reduced scale");
    }

    async createDrivableVehicle() {
        const meshes = await this.loadModel("assets/models/", "fucked.glb");
        this.drivableVehicle = meshes[0];
        this.drivableVehicle.rotation.y = Math.PI;
    
        // Set an initial position (e.g., near the center of the map)
        const initialX = 0;
        const initialZ = 0;

        // Raycast to position the vehicle on the ground
        const ray = new BABYLON.Ray(new BABYLON.Vector3(initialX, 1000, initialZ), new BABYLON.Vector3(0, -1, 0));
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);
    
        if (hit.hit) {
            this.drivableVehicle.position = new BABYLON.Vector3(initialX, hit.pickedPoint.y, initialZ);
        } else {
            // Fallback if raycast fails (e.g., ground not loaded yet)
            this.drivableVehicle.position = new BABYLON.Vector3(initialX, 0, initialZ); // Default to y=0
        }
    }

    setupControls() {
        // Keyboard controls with pause functionality
        window.addEventListener('keydown', (e) => { 
            this.keys[e.code] = true;
            
            // Pause toggle with debouncing
            if (e.code === 'KeyP') {
                const now = Date.now();
                if (now - this.lastPauseToggle > 300) { // 300ms debounce
                    this.togglePause();
                    this.lastPauseToggle = now;
                }
            }
            
            if (e.code === 'Escape') {
                document.exitPointerLock();
            }

            // Egg destruction with 'T' key
            if (e.code === 'KeyT') {
                if (this.isPaused) return;
                console.log("'T' key pressed for egg destruction.");
                console.log(`Camera position: ${this.camera.position}`);

                const interactionRange = 15.0; // Increased interaction range
                if (!this.destructibleEggs || this.destructibleEggs.length === 0) {
                    console.log("No destructible eggs found.");
                    return;
                }

                console.log(`Found ${this.destructibleEggs.length} eggs to check.`);
                for (let i = this.destructibleEggs.length - 1; i >= 0; i--) {
                    const egg = this.destructibleEggs[i];
                    if (!egg) {
                        console.log(`Egg at index ${i} is null or undefined.`);
                        continue;
                    }

                    egg.computeWorldMatrix(true); // Force update of world matrix
                    const eggCenter = egg.getBoundingInfo().boundingBox.centerWorld;
                    const dist = BABYLON.Vector3.Distance(this.camera.position, eggCenter);
                    console.log(`Distance to egg ${i}: ${dist}`);
                    console.log(`Egg absolute position: ${egg.getAbsolutePosition()}`);
                    console.log(`Egg bounding box center: ${eggCenter}`);

                    if (dist <= interactionRange) {
                        console.log(`🥚 Egg ${i} destroyed with T key!`);
                        this.createEggBurstParticles(egg.getAbsolutePosition());
                        egg.dispose();
                        this.destructibleEggs.splice(i, 1);
                        break; // Only destroy one egg per key press
                    }
                }
            }

            // Lore Cube interaction with 'Y' key
            if (e.code === 'KeyY') {
                if (this.isPaused) return;
                console.log("'Y' key pressed for lore cube interaction.");

                const interactionRange = 15.0; // Increased interaction range
                if (!this.loreCubeMesh) {
                    console.log("No lore cube found.");
                    return;
                }

                this.loreCubeMesh.computeWorldMatrix(true); // Force update of world matrix
                const cubeCenter = this.loreCubeMesh.getBoundingInfo().boundingBox.centerWorld;
                const dist = BABYLON.Vector3.Distance(this.camera.position, cubeCenter);
                console.log(`Distance to lore cube: ${dist}`);

                if (dist <= interactionRange) {
                    console.log(`✨ Lore Cube activated with Y key!`);
                    this.activateLoreCube();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

        // Mouse controls
        this.canvas.addEventListener('click', () => {
            if (this.isPaused) return;
            
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            } else {
                this.placeTowerAtCrosshair();
            }
        });

        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            if (this.isPointerLocked) {
                document.body.style.cursor = 'none';
            } else {
                document.body.style.cursor = '';
            }
        });

        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && !this.isPaused) {
                this.targetCameraRotation.y += e.movementX * this.cameraSensitivity;
                this.targetCameraRotation.x += e.movementY * this.cameraSensitivity;
                this.targetCameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetCameraRotation.x));
            }
        });
        this.setupMobileControls();
        console.log("🎮 Controls setup with pause system");
    }

    setupMobileControls() {
        if ('ontouchstart' in window) {
            document.getElementById('joystick-container').style.display = 'block';
            document.getElementById('fire-button').style.display = 'block';

            const joystickContainer = document.getElementById('joystick-container');
            const fireButton = document.getElementById('fire-button');

            const options = {
                zone: joystickContainer,
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: 'white'
            };
            const manager = nipplejs.create(options);

            this.joystick = { x: 0, y: 0 };

            manager.on('move', (evt, data) => {
                const angle = data.angle.radian;
                const force = data.force;
                this.joystick.x = Math.cos(angle) * force;
                this.joystick.y = Math.sin(angle) * force;
            });

            manager.on('end', () => {
                this.joystick.x = 0;
                this.joystick.y = 0;
            });

            fireButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.placeTowerAtCrosshair();
            });
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            console.log("⏸️ Game Paused - Press P to resume");
            this.pauseMenu.show();
            
            // Play lore1.mp3 if it hasn't been played on pause yet
            if (!this.lore1PlayedOnPause && this.loreSound) {
                this.loreSound.play().catch(e => console.error("Error playing lore audio on pause:", e));
                this.lore1PlayedOnPause = true; // Set flag to true so it only plays once
            }
        } else {
            console.log("▶️ Game Resumed");
            this.pauseMenu.hide();
        }
    }

    placeTowerAtCrosshair() {
        if (this.isPaused) return;

        const ray = new BABYLON.Ray(this.camera.position, this.camera.getForwardRay().direction);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            let current = mesh;
            while (current) {
                if (current === this.ground) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        });

        console.log("Casting ray...", {
            hit: hit.hit,
            pickedPoint: hit.pickedPoint,
            ground: this.ground,
            pickedMesh: hit.pickedMesh ? hit.pickedMesh.name : null
        });

        if (hit.hit && hit.pickedPoint) {
            this.placeTower(hit.pickedPoint);
        }
    }

    setupUI() {
        this.updateUI();
        this.selectTowerType('basic');
    }

    updateUI() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('playerHealth').textContent = this.playerHealth;
        document.getElementById('score').textContent = this.score;
        document.getElementById('waveNumber').textContent = this.wave;
        document.getElementById('enemiesLeft').textContent = Math.max(0, this.enemiesInWave - this.enemiesSpawned);
        
        // Update tower buttons
        Object.keys(this.towerTypes).forEach(type => {
            const btn = document.getElementById(type + 'Btn');
            const towerData = this.towerTypes[type];
            if (btn) {
                btn.disabled = this.gold < towerData.cost;
                btn.innerHTML = `${this.getTowerEmoji(type)} ${towerData.name} ($${towerData.cost})`;
            }
        });
    }

    getTowerEmoji(type) {
        const emojis = { basic: '🔫', missile: '🚀', laser: '⚡', colony: '🏡', playerAttack: '🛸', light: '💡' }; // Added light tower emoji
        return emojis[type] || '🗼';
    }

    selectTowerType(type) {
        this.selectedTowerType = type;
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        const selectedBtn = document.getElementById(type + 'Btn');
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }

        // Update asset description panel
        const assetDescriptionPanel = document.getElementById('assetDescriptionPanel');
        const assetDescriptionTitle = document.getElementById('assetDescriptionTitle');
        const assetDescriptionText = document.getElementById('assetDescriptionText');

        if (type && this.assetDescriptions[type]) {
            const descriptionData = this.assetDescriptions[type];
            assetDescriptionTitle.textContent = descriptionData.title;
            assetDescriptionText.textContent = descriptionData.description;
            assetDescriptionPanel.style.display = 'block'; // Show the panel
        } else {
            assetDescriptionPanel.style.display = 'none'; // Hide the panel if no type or description
        }

        // If playerAttack is selected, immediately trigger its activation
        if (type === 'playerAttack') {
            this.placeTowerAtCrosshair(); // This will call placeTower with playerAttack type
        }
    }

    async placeTower(position) {
        if (this.isPaused) return; 
        
        const itemData = this.towerTypes[this.selectedTowerType]; // Renamed towerData to itemData for generality
        if (this.gold >= itemData.cost) {
            let validPosition = true;
            
            // Check distance from other towers (increased spacing)
            for (let tower of this.towers) {
                if (BABYLON.Vector3.Distance(position, tower.base.position) < 6) {
                    validPosition = false;
                    break;
                }
            }
            
            // Check distance from other colonies
            for (let colony of this.colonies) {
                if (BABYLON.Vector3.Distance(position, colony.mesh.position) < 10) { // Increased spacing for colonies
                    validPosition = false;
                    break;
                }
            }

            // Check if not blocking path
            for (let pathPoint of this.path) {
                if (BABYLON.Vector3.Distance(position, pathPoint) < 4) {
                    validPosition = false;
                    break;
                }
            }
            
            if (validPosition) {
                if (this.selectedTowerType === 'colony') {
                    const colony = await this.createColony(position);
                    this.colonies.push(colony);
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🏡 Built ${itemData.name} for ${itemData.cost}!`);

                    if (this.colonies.length === 1) {
                        this.targetColony = colony;
                        console.log("🎯 First colony placed, setting as target for enemies.");
                    }

                    // Play lore video
                    if (this.loreVideoContainer && this.loreVideo) {
                        this.loreVideoContainer.style.display = 'flex';
                        this.loreVideo.play();
                        this.loreVideo.onended = () => {
                            this.loreVideoContainer.style.display = 'none';
                        };
                    }
                } else if (this.selectedTowerType === 'playerAttack') {
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🚀 Activating ${itemData.name} for ${itemData.cost}!`);
                    await this.activatePlayerAttack();
                } else if (this.selectedTowerType === 'researchStation') {
                    const researchStationMesh = await this.createResearchStationMesh(position);
                    this.researchStations.push(researchStationMesh);
                    this.gold -= itemData.cost;
                    this.score += 1000; // One-time score bonus
                    this.updateUI();
                    console.log(`🔬 Built ${itemData.name} for ${itemData.cost}! Score +1000.`);
                } else if (this.selectedTowerType === 'farmingUnit') {
                    const farmingUnitMesh = await this.createFarmingUnitMesh(position);
                    this.farmingUnits.push(farmingUnitMesh);
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🌾 Built ${itemData.name} for ${itemData.cost}!`);

                    // Start gold generation for this unit
                    if (!this.farmingInterval) { // Only start interval if not already running
                        this.farmingInterval = setInterval(() => {
                            this.gold += 10; // Generate 10 gold every 5 seconds
                            this.updateUI();
                            console.log("💰 Farming Unit generated 10 gold!");
                        }, 5000);
                    }
                } else {
                    if (this.selectedTowerType === 'basic') {
                        const basicTowers = this.towers.filter(t => t.type === 'basic');
                        if (basicTowers.length === 0) {
                            // This is the first basic tower
                            // Play lore2.mp4
                            if (this.lore2VideoContainer && this.lore2Video) {
                                this.lore2VideoContainer.style.display = 'flex';
                                this.lore2Video.play();
                                this.lore2Video.onended = () => {
                                    this.lore2VideoContainer.style.display = 'none';
                                };
                            }
                        }
                    }

                    const tower = await this.createTower(position, this.selectedTowerType);
                    this.towers.push(tower);
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🏗️ Built ${itemData.name} tower for ${itemData.cost}!`);

                    this.towerPlacedCount++;
                    if (this.towerPlacedCount === 5) {
                        if (this.sfx1Sound) {
                            this.sfx1Sound.play().catch(e => console.error("Error playing sfx1 audio:", e));
                        }
                    }
                    towerBuilt();
                }
                this.selectTowerType('basic'); // Reset to basic tower after placement
            } else {
                console.log("❌ Invalid placement - too close to path or other structures");
            }
        } else {
            console.log("💰 Need $" + (itemData.cost - this.gold) + " more gold!");
        }
    }

    async loadModel(path, fileName) {
        return new Promise((resolve, reject) => {
            const dracoFileName = fileName.replace(".glb", "_draco.glb");
            BABYLON.SceneLoader.ImportMesh("", path, dracoFileName, this.scene, (meshes) => {
                if (meshes.length > 0) {
                    console.log(`loadModel: Successfully loaded Draco compressed model: ${dracoFileName}`, meshes);
                    resolve(meshes);
                }
            }, null, (scene, message, exception) => {
                console.log(`loadModel: Draco model not found, falling back to standard GLB: ${fileName}`);
                BABYLON.SceneLoader.ImportMesh("", path, fileName, this.scene, (meshes) => {
                    if (meshes.length > 0) {
                        console.log(`loadModel: Successfully loaded standard model: ${fileName}`, meshes);
                        resolve(meshes);
                    } else {
                        console.error(`loadModel: Failed to load model: ${fileName}`);
                        reject(`Failed to load model: ${fileName}`);
                    }
                }, null, (scene, message, exception) => {
                    console.error(`loadModel: Failed to load model: ${fileName}`, exception);
                    reject(`Failed to load model: ${fileName}`);
                });
            });
        });
    }

    async createTower(position, type) {
        const towerData = this.towerTypes[type];
        let modelFileName = "";
        
        if (type === 'light') {
            // Create a simple rectangular tower for light
            const base = BABYLON.MeshBuilder.CreateBox("lightTowerBase", {
                height: 8,
                width: 2,
                depth: 2
            }, this.scene);
            base.position = position.clone();
            
            // Create light emitter at the top with enhanced properties
            const light = new BABYLON.PointLight("towerLight", new BABYLON.Vector3(0, 9, 0), this.scene);
            light.parent = base;
            light.intensity = 2.5; // Increased intensity
            light.diffuse = BABYLON.Color3.FromHexString(towerData.color);
            light.specular = BABYLON.Color3.FromHexString(towerData.color); // Added specular
            light.range = towerData.range * 1.5; // Increased range
            
            // Add volumetric light effect
            const volumetricLight = new BABYLON.VolumetricLightScatteringPostProcess(
                'volumetric', 1.0, this.scene.activeCamera, light, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, this.engine
            );
            volumetricLight.exposure = 0.15;
            volumetricLight.decay = 0.95;
            volumetricLight.weight = 0.15;
            volumetricLight.density = 0.5;
            
            // Create a glowing sphere at the top with enhanced effects
            const glowSphere = BABYLON.MeshBuilder.CreateSphere("lightEmitter", {
                diameter: 1.2 // Slightly larger
            }, this.scene);
            glowSphere.position = new BABYLON.Vector3(0, 4.5, 0);
            glowSphere.parent = base;
            
            // Create enhanced glowing material for the sphere
            const glowMaterial = new BABYLON.StandardMaterial("lightMaterial", this.scene);
            glowMaterial.emissiveColor = BABYLON.Color3.FromHexString(towerData.color);
            glowMaterial.diffuseColor = BABYLON.Color3.FromHexString(towerData.color);
            glowMaterial.specularColor = BABYLON.Color3.FromHexString(towerData.color);
            glowMaterial.ambientColor = BABYLON.Color3.FromHexString(towerData.color);
            glowMaterial.disableLighting = true;
            
            // Add glow layer for enhanced effect
            const glowLayer = new BABYLON.GlowLayer("lightGlow", this.scene);
            glowLayer.intensity = 1.0;
            glowLayer.addIncludedOnlyMesh(glowSphere);
            
            glowSphere.material = glowMaterial;
            
            // Create base material
            const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", this.scene);
            baseMaterial.diffuseColor = BABYLON.Color3.FromHexString("#444444");
            base.material = baseMaterial;
            
            const lightTower = {
                base: base,
                turret: base,
                type: type,
                data: towerData,
                health: 100,
                maxHealth: 100,
                light: light,
                glowSphere: glowSphere
            };
            
            this.createTowerHealthBar(lightTower);
            return lightTower;
        }
        
        switch (type) {
            case "basic":
                modelFileName = "basic_tower.glb";
                break;
            case "missile":
                modelFileName = "missile_tower.glb";
                break;
            case "laser":
                modelFileName = "laser_tower.glb";
                break;
        }

        const meshes = await this.loadModel("assets/models/", modelFileName);
        console.log(`createTower: Loaded meshes for ${modelFileName}:`, meshes);
        const towerMesh = meshes[0];
        console.log(`createTower: towerMesh for ${modelFileName}:`, towerMesh);
        towerMesh.position = position.clone();

        const tower = {
            base: towerMesh,
            turret: towerMesh, // Assuming the whole model is the turret for now
            type: type,
            data: towerData,
            lastFired: 0,
            target: null,
            health: 100,
            maxHealth: 100
        };
        this.createTowerHealthBar(tower);
        return tower;
    }

    createTowerHealthBar(tower) {
        const healthBar = BABYLON.MeshBuilder.CreatePlane("towerHealthBar", {width: 2, height: 0.3}, this.scene);
        healthBar.position.y = 4;
        healthBar.parent = tower.base;
        healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const healthMat = new BABYLON.StandardMaterial("towerHealthMat", this.scene);
        healthMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        healthMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
        healthBar.material = healthMat;
        
        tower.healthBar = healthBar;
    }

    async createColony(position) {
        const colony = new Colony(this.scene, position, this);
        await colony.loadModel();
        return colony;
    }

    async createFarmingUnitMesh(position) {
        const meshes = await this.loadModel("assets/models/", "farm.glb");
        const farmingUnitMesh = meshes[0];
        farmingUnitMesh.position = position.clone();
        return farmingUnitMesh;
    }

    createLedDots(container) {
        const dotSize = 0.03; // Size of each LED dot as a percentage of handsImage's smaller dimension
        const dotColor = new BABYLON.Color3(0, 1, 0); // Green color for LEDs
        const glowColor = new BABYLON.Color4(0, 1, 0, 0.5); // Semi-transparent green for glow

        const handPositions = [
            { x: 0.35, y: 0.65 }, // Left hand Dot 1
            { x: 0.3, y: 0.7 },  // Left hand Dot 2
            { x: 0.25, y: 0.65 }, // Left hand Dot 3

            { x: 0.65, y: 0.65 }, // Right hand Dot 1
            { x: 0.7, y: 0.7 },  // Right hand Dot 2
            { x: 0.75, y: 0.65 }   // Right hand Dot 3
        ];

        handPositions.forEach((pos, index) => {
            const dot = new BABYLON.GUI.Ellipse(`ledDot${index}`, "100%", "100%");
            dot.width = `${dotSize * 100}%`;
            dot.height = `${dotSize * 100}%`;
            dot.thickness = 0;
            dot.background = dotColor.toHexString();
            dot.color = dotColor.toHexString();

            dot.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            dot.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            dot.left = `${pos.x * 100}%`;
            dot.top = `${pos.y * 100}%`;

            dot.shadowColor = glowColor;
            dot.shadowBlur = 10;
            dot.shadowOffsetX = 0;
            dot.shadowOffsetY = 0;

            container.addControl(dot);

            const dotPulseAnimation = new BABYLON.Animation(
                `ledDotPulseAnimation${index}`,
                "alpha",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            const dotPulseKeys = [];
            dotPulseKeys.push({ frame: 0, value: 1.0 });
            dotPulseKeys.push({ frame: 15, value: 0.3 });
            dotPulseKeys.push({ frame: 30, value: 1.0 });
            dotPulseAnimation.setKeys(dotPulseKeys);

            this.scene.beginDirectAnimation(dot, [dotPulseAnimation], 0, 30, true);
        });
    }

    async spawnDestructibleEggs() {
        // Spawn eggs at the entry points
        const positions = this.entryPoints;
        const count = positions.length;

        try {
            const meshes = await this.loadModel("assets/models/", "egg.glb");
            if (!meshes || meshes.length === 0) {
                console.error("❌ Failed to load egg.glb for spawning multiple eggs");
                return;
            }

            const base = meshes[0];

            // Ensure arrays exist
            this.destructibleEggs = [];

            for (let i = 0; i < count; i++) {
                // Clone the loaded mesh so each egg is an independent mesh
                const clone = base.clone(`destructibleEgg_${i}`);
                if (!clone) continue;
                
                // Use the position from the entry points array
                let pos = positions[i];
                
                const ray = new BABYLON.Ray(new BABYLON.Vector3(pos.x, 1000, pos.z), new BABYLON.Vector3(0, -1, 0));
                const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);
                if (hit.hit) {
                    pos.y = hit.pickedPoint.y;
                }

                clone.position = pos.clone();
                clone.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                clone.name = `destructibleEgg_${i}`;
                clone.metadata = { isDestructibleEgg: true, index: i };

                // Ensure the mesh and its children are pickable and carry parent index metadata
                try {
                    clone.isPickable = true;
                    const children = clone.getChildMeshes ? clone.getChildMeshes() : [];
                    children.forEach((m) => {
                        m.isPickable = true;
                        m.metadata = m.metadata || {};
                        m.metadata.parentEggIndex = i;
                    });
                } catch (e) {}

                // Create a glowing material for visibility
                const glowMaterial = new BABYLON.StandardMaterial(`glowMat_egg_${i}`, this.scene);
                glowMaterial.emissiveColor = new BABYLON.Color3(1, 0.6, 0.1);
                glowMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0);
                clone.material = glowMaterial;

                // Add highlight layer if available
                try {
                    const hl = new BABYLON.HighlightLayer(`egg_hl_${i}`, this.scene);
                    hl.addMesh(clone, BABYLON.Color3.FromHexString("#FFD700"));
                } catch (e) {}

                this.destructibleEggs.push(clone);
            }

            console.log(`🥚 Spawned ${this.destructibleEggs.length} eggs at the entry points.`);
        } catch (err) {
            console.error('Error spawning multiple eggs:', err);
        }
    }

    async spawnLoreCube() {
        console.log("Attempting to spawn Lore Cube (tentacle_ship.glb)...");
        try {
            const meshes = await this.loadModel("assets/models/", "tentacle_ship.glb");
            if (!meshes || meshes.length === 0) {
                console.error("❌ Failed to load tentacle_ship.glb for lore cube: No meshes returned.");
                return;
            }

            this.loreCubeMesh = meshes[0];
            this.loreCubeMesh.name = "loreCube";
            console.log("tentacle_ship.glb loaded successfully. Mesh name:", this.loreCubeMesh.name);

            // Position near an entry point, for example, the first one
            let pos = new BABYLON.Vector3(0, 0, 0); // Spawn at origin
            console.log("Target spawn position (before raycast):", pos.x, pos.y, pos.z);

            const ray = new BABYLON.Ray(new BABYLON.Vector3(pos.x, 1000, pos.z), new BABYLON.Vector3(0, -1, 0));
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);
            if (hit.hit) {
                pos.y = hit.pickedPoint.y + 0.1; // Very slightly above ground
                console.log("Raycast hit ground. Adjusted Y position:", pos.y);
            } else {
                pos.y = 0.5; // Fallback if raycast fails, adjusted for visibility
                console.warn("Raycast did not hit ground. Using fallback Y position:", pos.y);
            }
            this.loreCubeMesh.position = pos;
            this.loreCubeMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2); // Significantly smaller size

            // Make it glow for visibility
            const glowMaterial = new BABYLON.StandardMaterial("loreCubeGlowMat", this.scene);
            glowMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0); // Greenish glow
            glowMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0);
            this.loreCubeMesh.material = glowMaterial;

            // Add highlight layer
            try {
                const hl = new BABYLON.HighlightLayer("loreCube_hl", this.scene);
                hl.addMesh(this.loreCubeMesh, BABYLON.Color3.FromHexString("#00FF00"));
                console.log("Highlight layer added.");
            } catch (e) {
                console.error("Error adding highlight layer:", e);
            }

            console.log("✨ Lore Cube (tentacle_ship.glb) spawned successfully at:", this.loreCubeMesh.position.x, this.loreCubeMesh.position.y, this.loreCubeMesh.position.z);
        } catch (err) {
            console.error('Error spawning lore cube:', err);
        }
    }

    // Create a short particle burst when an egg is destroyed
    createEggBurstParticles(position) {
        const ps = new BABYLON.ParticleSystem("eggBurst", 200, this.scene);
        ps.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        ps.emitter = position.clone();
        ps.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        ps.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        ps.color1 = new BABYLON.Color4(1.0, 0.7, 0.2, 1.0);
        ps.color2 = new BABYLON.Color4(1.0, 0.4, 0.0, 1.0);
        ps.colorDead = new BABYLON.Color4(0.2, 0.05, 0.0, 0.0);
        ps.minSize = 0.4;
        ps.maxSize = 1.2;
        ps.minLifeTime = 0.6;
        ps.maxLifeTime = 1.4;
        ps.emitRate = 200;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        ps.gravity = new BABYLON.Vector3(0, -6, 0);
        ps.direction1 = new BABYLON.Vector3(-2, 2, -2);
        ps.direction2 = new BABYLON.Vector3(2, 4, 2);
        ps.minEmitPower = 2;
        ps.maxEmitPower = 6;
        ps.updateSpeed = 0.02;
        ps.targetStopDuration = 0.8;
        ps.disposeOnStop = true;
        ps.start();

        // Small delay to allow particles to emit before disposing
        setTimeout(() => {
            try { ps.stop(); } catch (e) {}
        }, 900);
    }

    activateLoreCube() {
        if (this.isPaused) return; // Don't activate if already paused

        console.log("Activating Lore Cube...");
        this.togglePause(); // Pause the game

        // Show datalog container and load content
        if (this.datalogContainer && this.datalogIframe) {
            this.datalogContainer.style.display = 'flex'; // Use flex to center iframe
            this.datalogIframe.src = 'datalogs/1.html';
            if (this.eggSound) {
                this.eggSound.play().catch(e => console.error("Error playing egg audio:", e));
            }

            // Set timeout to return to game after 20 seconds
            setTimeout(() => {
                console.log("Returning to game from Lore Cube.");
                this.datalogContainer.style.display = 'none';
                this.datalogIframe.src = ''; // Clear iframe src
                if (this.loreSound) {
                    this.loreSound.pause();
                    this.loreSound.currentTime = 0;
                }
                this.togglePause(); // Unpause the game
                if (this.loreCubeMesh) {
                    this.loreCubeMesh.dispose(); // Dispose of the cube after interaction
                    this.loreCubeMesh = null;
                }
            }, 60000); // 60 seconds (1 minute)
        }
    }

    

    startGameLoop() {
        this.scene.registerBeforeRender(() => {
            if (this.isPaused) return; 
            
            this.updateCamera();
            this.updateEnemies();
            this.updateTowers();
            this.updateProjectiles();
            this.updateEnemyProjectiles();
            this.spawnEnemies();
            this.checkWaveComplete();
            this.manageUFOVisibility(); // New: Manage UFO visibility
        });
    }

    manageUFOVisibility() {
        const now = Date.now();
        const visibleUFOs = this.ufos.filter(ufo => ufo.isVisible);
        const hiddenUFOs = this.ufos.filter(ufo => !ufo.isVisible);

        // Hide UFOs that have been visible for 1 minute (60 seconds)
        visibleUFOs.forEach(ufo => {
            if (now - ufo.lastVisibilityToggleTime > 60 * 1000) {
                ufo.hide();
            }
        });

        // Show up to 2 UFOs that have been hidden for at least 1 minute (60 seconds)
        // and if there are currently less than 2 UFOs visible
        if (visibleUFOs.length < 2) {
            const availableToShow = hiddenUFOs.filter(ufo => now - ufo.lastVisibilityToggleTime > 60 * 1000);
            
            // Shuffle and pick up to 2
            availableToShow.sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(2 - visibleUFOs.length, availableToShow.length); i++) {
                availableToShow[i].show();
            }
        }
    }

    updateCamera() {
        if (this.isPaused) return;

        const deltaTime = this.engine.getDeltaTime() / 1000.0; // Delta time in seconds

        // Smooth camera rotation
        if (this.playerControlState === 'camera') {
            // Smooth camera rotation
            if (this.targetCameraRotation) {
                this.camera.rotation.y += (this.targetCameraRotation.y - this.camera.rotation.y) * this.cameraRotationSpeed;
                this.camera.rotation.x += (this.targetCameraRotation.x - this.camera.rotation.x) * this.cameraRotationSpeed;
            }
            
            const speed = 60.0; // Adjusted speed for delta time
            const movement = new BABYLON.Vector3(0, 0, 0);
            
            if (this.keys['KeyW']) movement.z += 1;
            if (this.keys['KeyS']) movement.z -= 1;
            if (this.keys['KeyA']) movement.x -= 1;
            if (this.keys['KeyD']) movement.x += 1;

            if (this.joystick && ('ontouchstart' in window)) {
                movement.x += this.joystick.x;
                movement.z -= this.joystick.y;
            }
            
            if (movement.length() > 0) {
                movement.normalize(); // Ensure consistent speed in all directions
                const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
                const right = this.camera.getDirection(BABYLON.Vector3.Right());
                
                // Project movement to XZ plane to prevent flying
                const forwardXZ = forward.clone();
                forwardXZ.y = 0;
                forwardXZ.normalize();

                const rightXZ = right.clone();
                rightXZ.y = 0;
                rightXZ.normalize();

                const worldMovement = forwardXZ.scale(movement.z).add(rightXZ.scale(movement.x));
                worldMovement.scaleInPlace(speed * deltaTime);
                this.camera.position.addInPlace(worldMovement);
            }

            // Ground collision and sticking
            if (this.ground) {
                // Ray starts from high above the camera's XZ position and goes down.
                const ray = new BABYLON.Ray(new BABYLON.Vector3(this.camera.position.x, 1000, this.camera.position.z), new BABYLON.Vector3(0, -1, 0));
                
                const hit = this.scene.pickWithRay(ray, (mesh) => {
                    let current = mesh;
                    while (current) {
                        if (current === this.ground) {
                            return true;
                        }
                        current = current.parent;
                    }
                    return false;
                });

                if (hit && hit.pickedPoint) {
                    const playerHeight = 12.0; // How high the camera is above the ground
                    const targetY = hit.pickedPoint.y + playerHeight;
                    // Smoothly interpolate to the target height
                    this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
                }
            }

            // Hands movement based on walking
            if (this.handsImage) {
                const isMoving = (this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']);
                const targetTop = isMoving ? -30 : -50; // Move down to -30px when walking, up to -50px when idle
                const currentTop = parseFloat(this.handsImage.top || -50); // Default to -50 if not set
                const newTop = currentTop + (targetTop - currentTop) * 0.1; // Smooth interpolation
                this.handsImage.top = `${newTop}px`;
            }
        } else if (this.playerControlState === 'vehicle') {
            // Vehicle controls
            if (this.keys['KeyW']) this.vehicleSpeed += 0.1;
            if (this.keys['KeyS']) this.vehicleSpeed -= 0.1;
            if (this.keys['KeyA']) this.drivableVehicle.rotation.y -= 0.05;
            if (this.keys['KeyD']) this.drivableVehicle.rotation.y += 0.05;

            this.drivableVehicle.position.x += Math.sin(this.drivableVehicle.rotation.y) * this.vehicleSpeed;
            this.drivableVehicle.position.z += Math.cos(this.drivableVehicle.rotation.y) * this.vehicleSpeed;

            this.vehicleSpeed *= 0.95; // friction

            // Ground collision for vehicle
            if (this.ground) {
                const ray = new BABYLON.Ray(new BABYLON.Vector3(this.drivableVehicle.position.x, 1000, this.drivableVehicle.position.z), new BABYLON.Vector3(0, -1, 0));
                const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.ground);

                if (hit.hit) {
                    this.drivableVehicle.position.y = hit.pickedPoint.y;
                }
            }

            // Third-person camera logic
            const cameraOffset = new BABYLON.Vector3(0, 15, -30); // Offset behind and above the vehicle
            const rotatedOffset = cameraOffset.rotateByQuaternionToRef(this.drivableVehicle.rotationQuaternion || BABYLON.Quaternion.FromEulerAngles(0, this.drivableVehicle.rotation.y, 0), new BABYLON.Vector3());
            const targetCameraPosition = this.drivableVehicle.position.add(rotatedOffset);

            // Smoothly interpolate camera position
            this.camera.position = BABYLON.Vector3.Lerp(this.camera.position, targetCameraPosition, 0.1);
            this.camera.setTarget(this.drivableVehicle.position.add(new BABYLON.Vector3(0, 5, 0))); // Look slightly above the vehicle

            // Play fart sound when moving, pause when stopped
            const movementThreshold = 0.01; // Small threshold to detect movement
            if (Math.abs(this.vehicleSpeed) > movementThreshold) {
                if (this.fartSound && this.fartSound.paused) {
                    this.fartSound.loop = true; // Loop the sound while moving
                    this.fartSound.play().catch(e => console.error("Error playing fart sound:", e));
                }
            } else {
                if (this.fartSound && !this.fartSound.paused) {
                    this.fartSound.pause();
                }
            }
        }
    }

    async spawnEnemies() {
        if (!this.gameStarted || this.enemiesSpawned >= this.enemiesInWave || this.isPaused) return; 
        
        // Slower spawn rate
        if (Math.random() < 0.008) {
            await this.spawnEnemy();
        }
    }

    async spawnEnemy() {
        if (!this.targetColony) return; // Don't spawn until a colony exists

        const startPoint = this.entryPoints[Math.floor(Math.random() * this.entryPoints.length)];
        this.createEnhancedPath(startPoint, this.targetColony.mesh.position);

        if (this.path.length === 0) return;

        let modelFileName = "enemy.glb";
        let baseHealth = 60;
        let baseSpeed = 0.002;
        let baseReward = 15;

        if (this.wave > 1) {
            modelFileName = "enemy2.glb";
            baseHealth = 100; // Example: stronger enemy
            baseSpeed = 0.0025; // Example: slightly faster
            baseReward = 25; // Example: better reward
        }

        const meshes = await this.loadModel("assets/models/", modelFileName);
        const enemyMesh = meshes[0];
        enemyMesh.position = this.path[0].clone();

        const enemyData = {
            mesh: enemyMesh,
            health: baseHealth + (this.wave * 20),
            maxHealth: baseHealth + (this.wave * 20),
            speed: baseSpeed + (this.wave * 0.0004),
            pathIndex: 0,
            pathProgress: 0,
            reward: baseReward + this.wave * 2,
            lastShot: 0,
            fireRate: 2000, // ms
            range: 15,
            target: null
        };

        this.createHealthBar(enemyData);
        this.enemies.push(enemyData);
        this.enemiesSpawned++;
        
        console.log(`👹 Enemy spawned from ${modelFileName} (${this.enemiesSpawned}/${this.enemiesInWave})`);

        // Display first encounter message for new enemy types
        if (!this.encounteredEnemyTypes) {
            this.encounteredEnemyTypes = {};
        }

        if (!this.encounteredEnemyTypes[modelFileName]) {
            const description = this.assetDescriptions[modelFileName];
            if (description) {
                this.displayTemporaryMessage(`New Enemy: ${description.title} - ${description.description}`, 5000);
                this.encounteredEnemyTypes[modelFileName] = true;
            }
        }
    }

    createHealthBar(enemyData) {
        const healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", {width: 2, height: 0.3}, this.scene);
        healthBar.position.y = 2.5;
        healthBar.parent = enemyData.mesh;
        healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        
        const healthMat = new BABYLON.StandardMaterial("healthMat", this.scene);
        healthMat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        healthMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
        healthBar.material = healthMat;
        
        enemyData.healthBar = healthBar;
    }

    createHitParticles(position) {
        const particleEffects = [
            // Effect 1: Small, quick orange/red sparks
            (pos) => {
                const ps = new BABYLON.ParticleSystem("hitParticles1", 100, this.scene); // Increased capacity
                ps.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
                ps.emitter = pos.clone().add(new BABYLON.Vector3(0, 0.5, 0)); // Offset emitter slightly
                ps.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5); // Increased emit box
                ps.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5); // Increased emit box
                ps.color1 = new BABYLON.Color4(1.0, 0.5, 0.0, 1.0);
                ps.color2 = new BABYLON.Color4(1.0, 0.0, 0.0, 1.0);
                ps.colorDead = new BABYLON.Color4(0.5, 0.0, 0.0, 0.0);
                ps.minSize = 0.5; // Significantly increased size
                ps.maxSize = 1.0; // Significantly increased size
                ps.minLifeTime = 0.5; // Increased lifetime
                ps.maxLifeTime = 1.0; // Increased lifetime
                ps.emitRate = 100; // Increased emit rate
                ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                ps.gravity = new BABYLON.Vector3(0, -10, 0); // Increased gravity
                ps.direction1 = new BABYLON.Vector3(-2, -2, -2);
                ps.direction2 = new BABYLON.Vector3(2, 2, 2);
                ps.minEmitPower = 2;
                ps.maxEmitPower = 5;
                ps.updateSpeed = 0.1; // Increased speed
                ps.disposeOnStop = true;
                ps.targetStopDuration = 0.5; // Increased duration
                return ps;
            },
            // Effect 2: Slightly larger, more yellow/white flash
            (pos) => {
                const ps = new BABYLON.ParticleSystem("hitParticles2", 80, this.scene); // Increased capacity
                ps.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
                ps.emitter = pos.clone().add(new BABYLON.Vector3(0, 0.5, 0)); // Offset emitter slightly
                ps.minEmitBox = new BABYLON.Vector3(-0.7, -0.7, -0.7);
                ps.maxEmitBox = new BABYLON.Vector3(0.7, 0.7, 0.7);
                ps.color1 = new BABYLON.Color4(1.0, 1.0, 0.5, 1.0);
                ps.color2 = new BABYLON.Color4(1.0, 0.8, 0.0, 1.0);
                ps.colorDead = new BABYLON.Color4(0.8, 0.8, 0.0, 0.0);
                ps.minSize = 0.6; // Significantly increased size
                ps.maxSize = 1.2; // Significantly increased size
                ps.minLifeTime = 0.6;
                ps.maxLifeTime = 1.2;
                ps.emitRate = 80; // Increased emit rate
                ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                ps.gravity = new BABYLON.Vector3(0, -12, 0); // Increased gravity
                ps.direction1 = new BABYLON.Vector3(-2.5, -2.5, -2.5);
                ps.direction2 = new BABYLON.Vector3(2.5, 2.5, 2.5);
                ps.minEmitPower = 2.0;
                ps.maxEmitPower = 6.0;
                ps.updateSpeed = 0.12; // Increased speed
                ps.disposeOnStop = true;
                ps.targetStopDuration = 0.6; // Increased duration
                return ps;
            },
            // Effect 3: Blue/purple energy burst (for laser hits, but can be randomized)
            (pos) => {
                const ps = new BABYLON.ParticleSystem("hitParticles3", 120, this.scene);
                ps.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
                ps.emitter = pos.clone().add(new BABYLON.Vector3(0, 0.5, 0)); // Offset emitter slightly
                ps.minEmitBox = new BABYLON.Vector3(-0.8, -0.8, -0.8);
                ps.maxEmitBox = new BABYLON.Vector3(0.8, 0.8, 0.8);
                ps.color1 = new BABYLON.Color4(0.5, 0.0, 1.0, 1.0);
                ps.color2 = new BABYLON.Color4(0.0, 0.0, 1.0, 1.0);
                ps.colorDead = new BABYLON.Color4(0.0, 0.0, 0.5, 0.0);
                ps.minSize = 0.7; // Significantly increased size
                ps.maxSize = 1.5; // Significantly increased size
                ps.minLifeTime = 0.8;
                ps.maxLifeTime = 1.5;
                ps.emitRate = 100; // Increased emit rate
                ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                ps.gravity = new BABYLON.Vector3(0, -15, 0); // Increased gravity
                ps.direction1 = new BABYLON.Vector3(-3, -3, -3);
                ps.direction2 = new BABYLON.Vector3(3, 3, 3);
                ps.minEmitPower = 3.0;
                ps.maxEmitPower = 8.0;
                ps.updateSpeed = 0.15; // Increased speed
                ps.disposeOnStop = true;
                ps.targetStopDuration = 0.8; // Increased duration
                return ps;
            }
        ];

        const randomIndex = Math.floor(Math.random() * particleEffects.length);
        const selectedEffect = particleEffects[randomIndex](position);
        selectedEffect.start();
    }

    createExplosionParticles(position) {
        const explosionParticles = new BABYLON.ParticleSystem("explosionParticles", 500, this.scene); // Increased capacity
        explosionParticles.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        explosionParticles.emitter = position.clone().add(new BABYLON.Vector3(0, 1, 0)); // Offset emitter slightly higher
        explosionParticles.minEmitBox = new BABYLON.Vector3(-2, -2, -2); // Larger emit box
        explosionParticles.maxEmitBox = new BABYLON.Vector3(2, 2, 2); // Larger emit box
        explosionParticles.color1 = new BABYLON.Color4(1.0, 0.5, 0.0, 1.0);
        explosionParticles.color2 = new BABYLON.Color4(1.0, 0.0, 0.0, 1.0);
        explosionParticles.colorDead = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0);
        explosionParticles.minSize = 2.0; // Significantly increased size
        explosionParticles.maxSize = 5.0; // Significantly increased size
        explosionParticles.minLifeTime = 1.0; // Increased lifetime
        explosionParticles.maxLifeTime = 3.0; // Increased lifetime
        explosionParticles.emitRate = 500; // Increased for larger burst
        explosionParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        explosionParticles.gravity = new BABYLON.Vector3(0, -20, 0); // Increased gravity
        explosionParticles.direction1 = new BABYLON.Vector3(-10, -10, -10); // Wider spread
        explosionParticles.direction2 = new BABYLON.Vector3(10, 10, 10); // Wider spread
        explosionParticles.minEmitPower = 15; // Increased power
        explosionParticles.maxEmitPower = 30; // Increased power
        explosionParticles.updateSpeed = 0.15; // Increased speed
        explosionParticles.disposeOnStop = true;
        explosionParticles.targetStopDuration = 1.0; // Increased duration
        explosionParticles.start();
    }

    updateEnemies() {
        if (this.isPaused) return; 
        
        const currentTime = Date.now();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move along path
            if (enemy.pathIndex < this.path.length - 1) {
                enemy.pathProgress += enemy.speed;
                if (enemy.pathProgress >= 1) {
                    enemy.pathIndex++;
                    enemy.pathProgress = 0;
                }
                
                if (enemy.pathIndex < this.path.length - 1) {
                    enemy.mesh.position = BABYLON.Vector3.Lerp(
                        this.path[enemy.pathIndex],
                        this.path[enemy.pathIndex + 1],
                        enemy.pathProgress
                    );
                    
                    // Face movement direction
                    const direction = this.path[enemy.pathIndex + 1].subtract(this.path[enemy.pathIndex]);
                    enemy.mesh.lookAt(enemy.mesh.position.add(direction));
                }
            } else {
                // Reached end - lose life
                this.lives--;
                enemy.mesh.dispose();
                if (enemy.healthBar) enemy.healthBar.dispose();
                this.enemies.splice(i, 1);
                this.updateUI();
                console.log(`💔 Lost a life! Lives remaining: ${this.lives}`);
                
                if (this.lives <= 0) {
                    document.body.style.backgroundImage = 'url(\'assets/images/bg4.jpg\")';
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundPosition = 'center';
                    alert(`💀 GAME OVER!\n\nFinal Score: ${this.score}\nWaves Survived: ${this.wave}\n\nPress OK to restart`);
                    location.reload();
                }
                continue;
            }
            
            // Check if dead
            if (enemy.health <= 0) {
                // Play lore2.mp3 if it's the first enemy killed
                if (!this.firstEnemyKilled && this.lore2Sound) {
                    this.lore2Sound.play().catch(e => console.error("Error playing lore2 audio:", e));
                    this.firstEnemyKilled = true; // Set flag to true so it only plays once
                }

                this.gold += enemy.reward;
                this.score += enemy.reward * 15;
                enemy.mesh.dispose();
                if (enemy.healthBar) enemy.healthBar.dispose();
                this.enemies.splice(i, 1);
                this.updateUI();
                console.log(`💰 +${enemy.reward} gold! Enemy defeated`);
                enemyKilled();
                continue;
            }
            
            // Update health bar
            if (enemy.healthBar) {
                const healthPercent = enemy.health / enemy.maxHealth;
                enemy.healthBar.scaling.x = healthPercent;
                const healthMat = enemy.healthBar.material;
                healthMat.diffuseColor = new BABYLON.Color3(1 - healthPercent, healthPercent, 0);
                healthMat.emissiveColor = new BABYLON.Color3((1 - healthPercent) * 0.3, healthPercent * 0.3, 0);
            }

            // Enemy shooting logic
            let target = null;
            let closestDist = enemy.range;

            for (let tower of this.towers) {
                const dist = BABYLON.Vector3.Distance(enemy.mesh.position, tower.base.position);
                if (dist < closestDist) {
                    target = tower;
                    closestDist = dist;
                }
            }
            enemy.target = target;

            if (enemy.target) {
                if (currentTime - enemy.lastShot > enemy.fireRate) {
                    this.fireEnemyProjectile(enemy);
                    enemy.lastShot = currentTime;
                }
            }
        }
    }

    updateTowers() {
        if (this.isPaused) return; 
        
        const currentTime = Date.now();
        
        for (let i = this.towers.length - 1; i >= 0; i--) {
            const tower = this.towers[i];
            let target = null;
            let closestDist = tower.data.range;
            
            // Find closest enemy in range
            for (let enemy of this.enemies) {
                const dist = BABYLON.Vector3.Distance(tower.base.position, enemy.mesh.position);
                if (dist < closestDist) {
                    target = enemy;
                    closestDist = dist;
                }
            }
            
            tower.target = target;
            
            if (tower.target) {
                // Aim turret at target
                tower.turret.lookAt(tower.target.mesh.position);
                
                // Fire if ready
                if (currentTime - tower.lastFired > tower.data.fireRate) {
                    this.fireProjectile(tower);
                    tower.lastFired = currentTime;
                }
            }

            // Update health bar
            if (tower.healthBar) {
                const healthPercent = tower.health / tower.maxHealth;
                tower.healthBar.scaling.x = healthPercent;
                const healthMat = tower.healthBar.material;
                healthMat.diffuseColor = new BABYLON.Color3(1 - healthPercent, healthPercent, 0);
                healthMat.emissiveColor = new BABYLON.Color3((1 - healthPercent) * 0.3, healthPercent * 0.3, 0);
            }

            if (tower.health <= 0) {
                this.towers.splice(i, 1);
                tower.base.dispose();
                tower.healthBar.dispose();
            }
        }
    }

    fireProjectile(tower) {
        if (!tower.target || this.isPaused) return; 
        
        const projectile = BABYLON.MeshBuilder.CreateSphere("projectile", {diameter: 0.8}, this.scene);
        projectile.position = tower.turret.getAbsolutePosition().clone();
        projectile.position.y += 0.5;
        
        const projMat = new BABYLON.StandardMaterial("projMat", this.scene);
        projMat.diffuseColor = BABYLON.Color3.FromHexString(tower.data.color);
        projMat.emissiveColor = BABYLON.Color3.FromHexString(tower.data.color).scale(0.8);
        projectile.material = projMat;
        
        const direction = tower.target.mesh.position.subtract(projectile.position).normalize();
        
        // Play shot sound based on tower type
        switch (tower.type) {
            case 'basic':
                if (this.shotBasicSound) { this.shotBasicSound.currentTime = 0; this.shotBasicSound.play(); }
                break;
            case 'missile':
                if (this.shotMissileSound) { this.shotMissileSound.currentTime = 0; this.shotMissileSound.play(); }
                break;
            case 'laser':
                if (this.shotLaserSound) { this.shotLaserSound.currentTime = 0; this.shotLaserSound.play(); }
                break;
        }

        this.projectiles.push({
            mesh: projectile,
            direction: direction,
            speed: 2.2, // Faster projectiles
            damage: tower.data.damage,
            target: tower.target,
            life: 0,
            type: tower.type // Add projectile type
        });
    }

    fireEnemyProjectile(enemy) {
        if (!enemy.target || this.isPaused) return;

        const projectile = BABYLON.MeshBuilder.CreateSphere("enemyProjectile", {diameter: 0.6}, this.scene);
        projectile.position = enemy.mesh.getAbsolutePosition().clone();
        projectile.position.y += 0.5;

        const projMat = new BABYLON.StandardMaterial("enemyProjMat", this.scene);
        projMat.diffuseColor = new BABYLON.Color3(1, 0, 1); // Magenta color for enemy shots
        projMat.emissiveColor = new BABYLON.Color3(0.8, 0, 0.8);
        projectile.material = projMat;

        const direction = enemy.target.base.position.subtract(projectile.position).normalize();

        if (this.enemyShotSound) {
            this.enemyShotSound.currentTime = 0;
            this.enemyShotSound.play();
        }

        this.enemyProjectiles.push({
            mesh: projectile,
            direction: direction,
            speed: 1.5,
            target: enemy.target,
            life: 0
        });
    }

    updateProjectiles() {
        if (this.isPaused) return; 
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.mesh.position.addInPlace(proj.direction.scale(proj.speed));
            proj.life++;
            
            // Check hit
            if (proj.target && !proj.target.mesh.isDisposed() && 
                BABYLON.Vector3.Distance(proj.mesh.position, proj.target.mesh.position) < 1.8) {
                proj.target.health -= proj.damage;
                if (this.damageSound) {
                    this.damageSound.currentTime = 0;
                    this.damageSound.play();
                }
                this.createHitParticles(proj.target.mesh.position); // Create hit particles

                if (proj.type === 'missile') {
                    this.createExplosionParticles(proj.mesh.position); // Create explosion for missile
                }

                proj.mesh.dispose();
                this.projectiles.splice(i, 1);
            } 
            // Remove old projectiles
            else if (proj.life > 100) {
                proj.mesh.dispose();
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemyProjectiles() {
        if (this.isPaused) return;

        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const proj = this.enemyProjectiles[i];
            proj.mesh.position.addInPlace(proj.direction.scale(proj.speed));
            proj.life++;

            // Check hit
            if (proj.target && !proj.target.base.isDisposed() &&
                BABYLON.Vector3.Distance(proj.mesh.position, proj.target.base.position) < 1.8) {
                
                this.createEnemyBombParticles(proj.mesh.position);

                proj.mesh.dispose();
                this.enemyProjectiles.splice(i, 1);
            }
            // Remove old projectiles
            else if (proj.life > 150) {
                proj.mesh.dispose();
                this.enemyProjectiles.splice(i, 1);
            }
        }
    }
    
    createEnemyBombParticles(position) {
        const particleSystem = new BABYLON.ParticleSystem("particles", 200, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.color1 = new BABYLON.Color4(1, 0, 1, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.5, 0, 0.5, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        particleSystem.minSize = 0.5;
        particleSystem.maxSize = 1.0;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.0;
        particleSystem.emitRate = 200;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.005;
        particleSystem.targetStopDuration = 0.2;
        particleSystem.disposeOnStop = true;
        particleSystem.start();
    }

    displayTemporaryMessage(message, duration = 3000) {
        const panel = document.getElementById('temporaryMessagePanel');
        const text = document.getElementById('temporaryMessageText');
        if (panel && text) {
            text.textContent = message;
            panel.style.display = 'block';
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => {
                panel.style.display = 'none';
            }, duration);
        }
    }

    checkWaveComplete() {
        if (this.gameStarted && this.enemiesSpawned >= this.enemiesInWave && this.enemies.length === 0) {
            document.getElementById('nextWaveBtn').disabled = false;
            document.getElementById('nextWaveBtn').textContent = '🚀 NEXT WAVE';
            this.gameStarted = false;
            
            // Wave completion bonus
            const waveBonus = 25 + (this.wave * 10);
            this.gold += waveBonus;
            this.score += waveBonus * 5;
            console.log(`🎉 Wave ${this.wave} complete! +${waveBonus} bonus`);
            this.updateUI();
            document.body.style.backgroundImage = 'url(\'assets/images/bg4.jpg\')';
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
        }
    }

    initMusic() {
        this.currentMusic = new Audio();
        this.currentMusic.loop = false; // Play once, then pick new random
        this.currentMusic.volume = 0.3; // Adjust volume as needed

        this.currentMusic.addEventListener('ended', () => {
            this.playRandomMusic();
        });
    }

    playRandomMusic() {
        if (this.musicFiles.length === 0) {
            console.warn("No music files found.");
            return;
        }

        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.musicFiles.length);
        } while (newIndex === this.currentMusicIndex);

        this.currentMusicIndex = newIndex;
        this.currentMusic.src = this.musicFiles[this.currentMusicIndex];
        this.currentMusic.play().catch(e => console.error("Error playing music:", e));
        console.log(`🎶 Playing: ${this.musicFiles[this.currentMusicIndex]}`);
    }

    switchWeather() {
        if (this.weatherSystem) {
            this.weatherSystem.dispose();
        }

        this.isEnhancedWeather = !this.isEnhancedWeather;

        if (this.isEnhancedWeather) {
            this.weatherSystem = new EnhancedWeatherSystem(this.scene, this.engine);
        } else {
            this.weatherSystem = new SimpleWeatherSystem(this.scene);
        }
        console.log(`Switched to ${this.isEnhancedWeather ? 'Enhanced' : 'Simple'} Weather System.`);
    }

    setupDatalogControls() {
        const openDatalogBtn = document.getElementById('openDatalogBtn');
        const datalogContainer = document.getElementById('datalogContainer');
        const datalogIframe = document.getElementById('datalogIframe');
        const datalogCloseBtn = document.getElementById('datalogCloseBtn');

        if (openDatalogBtn && datalogContainer && datalogIframe && datalogCloseBtn) {
            openDatalogBtn.addEventListener('click', () => {
                this.togglePause(); // Pause game when datalog opens
                datalogIframe.src = 'datalogs/datalog.html';
                datalogContainer.style.display = 'flex';
            });

            datalogCloseBtn.addEventListener('click', () => {
                datalogContainer.style.display = 'none';
                datalogIframe.src = ''; // Clear iframe src
                this.togglePause(); // Unpause game when datalog closes
            });
        }
    }
}

// Global functions
function selectTowerType(type) { 
    if (game && !game.isPaused) game.selectTowerType(type); 
}

function startNextWave() {
    if (!game || game.isPaused) return; 
    
    game.wave++;
    game.enemiesInWave = Math.min(3 + game.wave * 2, 25); // Better wave progression
    game.enemiesSpawned = 0;
    game.gameStarted = true;
    
    document.getElementById('nextWaveBtn').disabled = true;
    document.getElementById('nextWaveBtn').textContent = '⚔️ Wave Active...';
    
    
    game.updateUI();
    console.log(`🌊 Wave ${game.wave} starting! ${game.enemiesInWave} incoming`);

    // Spawn eggs only on the first wave
    if (game.wave === 1) {
        console.log("🥚 Spawning destructible eggs for the first wave.");
        game.spawnDestructibleEggs();
    }

    // Start objectives when the player engages the wave (if objectives module is loaded)
    try {
        if (typeof window.startObjectives === 'function') {
            window.startObjectives();
        } else if (typeof window.engageObjectives === 'function') {
            window.engageObjectives();
        }
    } catch (e) {
        console.warn('Objectives not available to start:', e);
    }

    game.playRandomMusic();
    document.body.style.backgroundImage = 'url(\'assets/images/bg3.jpg\')';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    
    // Play random lore audio after wave 3 starts
    if (game.wave >= 3) {
        const loreAudios = [];
        if (!game.lore4Played && game.lore4Sound) {
            loreAudios.push(game.lore4Sound);
        }
        if (!game.lore5Played && game.lore5Sound) {
            loreAudios.push(game.lore5Sound);
        }

        if (loreAudios.length > 0) {
            const randomLore = loreAudios[Math.floor(Math.random() * loreAudios.length)];
            if (randomLore) {
                randomLore.play().catch(e => console.error("Error playing random lore audio:", e));
                if (randomLore === game.lore4Sound) {
                    game.lore4Played = true;
                } else if (randomLore === game.lore5Sound) {
                    game.lore5Played = true;
                }
            }
        }
    }
    
    // Start weather effects
    if (game.weatherSystem) {
        if (typeof game.weatherSystem.startRain === 'function') {
            try { game.weatherSystem.startRain(); } catch (e) { console.warn('Weather startRain failed:', e); }
        }
        if (typeof game.weatherSystem.startLightning === 'function') {
            try { game.weatherSystem.startLightning(); } catch (e) { console.warn('Weather startLightning failed:', e); }
        }
    }
}

function buyResearchStation() {
    if (game && !game.isPaused) {
        const researchStationCost = game.towerTypes.researchStation.cost;
        if (game.gold >= researchStationCost) {
            game.gold -= researchStationCost;
            this.updateUI();
            this.selectTowerType('researchStation'); // Set selected type for placement
            console.log(`🔬 Research Station selected for placement. Cost: ${researchStationCost}.`);
        } else {
            alert(`Need ${researchStationCost - game.gold} more gold to buy Research Station.`);
        }
    }
}

function buyFarmingUnit() {
    if (game && !game.isPaused) {
        const farmingUnitCost = game.towerTypes.farmingUnit.cost;
        if (game.gold >= farmingUnitCost) {
            game.gold -= farmingUnitCost;
            this.updateUI();
            this.selectTowerType('farmingUnit'); // Set selected type for placement
            console.log(`🌾 Farming Unit selected for placement. Cost: ${farmingUnitCost}.`);
        } else {
            alert(`Need ${farmingUnitCost - game.gold} more gold to buy Farming Unit.`);
        }
    }
}


// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log("🎮 Starting Enhanced Tower Defense Game...");
    game = new TowerDefenseGame();
});

// Handle window resize
window.addEventListener('resize', () => { 
    if (game && game.engine) game.engine.resize(); 
});

// Prevent right-click context menu
document.addEventListener('contextmenu', e => e.preventDefault());
