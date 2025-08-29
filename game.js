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
        this.score = 0;
        this.wave = 0;
        this.enemiesInWave = 4;
        this.enemiesSpawned = 0;
        this.selectedTowerType = 'basic';
        this.gameStarted = false;
        this.isPaused = false;
        this.lastPauseToggle = 0;
        
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

        // Game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = []; // Added for enemy projectiles
        this.colonies = []; // New: Array to store colonies
        this.path = [];
        this.pathMeshes = [];
        this.ground = null;
        this.player = null;

        // Input
        this.keys = {};
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
            basic: { cost: 40, damage: 25, range: 10, fireRate: 900, color: '#ff6b35', name: 'BASIC' },
            missile: { cost: 85, damage: 60, range: 12, fireRate: 1400, color: '#e74c3c', name: 'MISSILE' },
            laser: { cost: 130, damage: 40, range: 18, fireRate: 350, color: '#3498db', name: 'LASER' },
            colony: { cost: 200, name: 'COLONY' }, // New: Colony definition
            playerAttack: { cost: 1000, name: 'PLAYER ATTACK' } // New: Player Attack special weapon
        };
        
        this.init();
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
        this.weatherSystem = new WeatherSystem(this.scene);
        this.createTerrain();
        SprawlingPlant.spawnEcosystem(this.scene, 1, 200);
        this.createEnhancedPath();
        this.createCamera();
        this.setupControls();
        this.setupUI();
        this.startGameLoop();
        this.initMusic();
        this.damageSound = document.getElementById('damageSound');
        this.shotBasicSound = document.getElementById('shotBasicSound');
        this.shotMissileSound = document.getElementById('shotMissileSound');
        this.shotLaserSound = document.getElementById('shotLaserSound');
        this.enemyShotSound = document.getElementById('enemyShotSound');
        this.loreSound = document.getElementById('loreSound');
        this.lore2Sound = document.getElementById('lore2Sound'); // Initialize lore2Sound
        this.lore3Sound = document.getElementById('lore3Sound'); // Initialize lore3Sound
        this.lore4Sound = document.getElementById('lore4Sound'); // Initialize lore4Sound
        this.lore5Sound = document.getElementById('lore5Sound'); // Initialize lore5Sound
        
        // Initialize pause menu
        this.pauseMenu = new PauseMenu(this); // Pass game instance to pause menu

        // Show UI
        document.getElementById('ui').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
        document.getElementById('waveInfo').style.display = 'block';
        
        // Setup collapsible menu
        const toggleWeaponSystemsBtn = document.getElementById('toggleWeaponSystems');
        const weaponSystemsContent = document.getElementById('weaponSystemsContent');
        if (toggleWeaponSystemsBtn && weaponSystemsContent) {
            toggleWeaponSystemsBtn.addEventListener('click', () => {
                weaponSystemsContent.classList.toggle('collapsed');
                toggleWeaponSystemsBtn.textContent = weaponSystemsContent.classList.contains('collapsed') ? '▼' : '▲';
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
        
        // Enhanced lighting with better atmosphere
        const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.07;
        hemiLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
        hemiLight.specular = new BABYLON.Color3(0.6, 0.6, 0.8);
        
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.8, -1, -0.6), this.scene);
        dirLight.intensity = 0.9;
        dirLight.diffuse = new BABYLON.Color3(1.0, 0.95, 0.8);
        
        // Subtle fog
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.010;
        this.scene.fogColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        
        // Skybox with HDR texture
        const hdrTexture = new BABYLON.HDRCubeTexture("assets/images/sky.hdr", this.scene, 512);
        this.scene.environmentTexture = hdrTexture;
        this.scene.createDefaultSkybox(hdrTexture, true, 2000);

        console.log("🌍 Enhanced scene created");
    }

    async createTerrain() {
        const meshes = await this.loadModel("assets/models/", "map.glb");

        if (meshes.length > 0) {
            this.ground = meshes[0];
            console.log("🌱 Terrain loaded from map.glb", this.ground);

        } else {
            console.error("❌ No meshes found in map.glb");
        }
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
            point.y = 0.15; // Slightly above ground
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
                document.body.style.cursor = 'none'; // Hide cursor when pointer is locked
                document.getElementById('crosshair').style.display = 'block'; // Show crosshair
            } else {
                document.body.style.cursor = 'default'; // Show default cursor when pointer is unlocked
                document.getElementById('crosshair').style.display = 'none'; // Hide crosshair
            }
        });

        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && !this.isPaused) {
                this.targetCameraRotation.y += e.movementX * this.cameraSensitivity;
                this.targetCameraRotation.x += e.movementY * this.cameraSensitivity; // Corrected inversion
                this.targetCameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetCameraRotation.x));
            }
        });

        console.log("🎮 Controls setup with pause system");
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
        const emojis = { basic: '🔫', missile: '🚀', laser: '⚡', colony: '🏡', playerAttack: '🛸' }; // Added playerAttack emoji
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
                } else if (this.selectedTowerType === 'playerAttack') {
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🚀 Activating ${itemData.name} for ${itemData.cost}!`);
                    await this.activatePlayerAttack();
                } else {
                    const tower = await this.createTower(position, this.selectedTowerType);
                    this.towers.push(tower);
                    this.gold -= itemData.cost;
                    this.updateUI();
                    console.log(`🏗️ Built ${itemData.name} tower for ${itemData.cost}!`);
                }
            }
            else {
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
                    console.log(`Successfully loaded Draco compressed model: ${dracoFileName}`);
                    resolve(meshes);
                }
            }, null, (scene, message, exception) => {
                console.log(`Draco model not found, falling back to standard GLB: ${fileName}`);
                BABYLON.SceneLoader.ImportMesh("", path, fileName, this.scene, (meshes) => {
                    if (meshes.length > 0) {
                        console.log(`Successfully loaded standard model: ${fileName}`);
                        resolve(meshes);
                    } else {
                        console.error(`Failed to load model: ${fileName}`);
                        reject(`Failed to load model: ${fileName}`);
                    }
                }, null, (scene, message, exception) => {
                    console.error(`Failed to load model: ${fileName}`, exception);
                    reject(`Failed to load model: ${fileName}`);
                });
            });
        });
    }

    async createTower(position, type) {
        const towerData = this.towerTypes[type];
        let modelFileName = "";
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
        const towerMesh = meshes[0];
        towerMesh.position = position.clone();
        towerMesh.position.y = 1;

        const tower = {
            base: towerMesh,
            turret: towerMesh, // Assuming the whole model is the turret for now
            type: type,
            data: towerData,
            lastFired: 0,
            target: null
        };
        return tower;
    }

    async createColony(position) {
        const colony = new Colony(this.scene, position, this);
        await colony.loadModel();
        return colony;
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
        });
    }

    updateCamera() {
        if (this.isPaused) return;

        const deltaTime = this.engine.getDeltaTime() / 1000.0; // Delta time in seconds

        // Smooth camera rotation
        if (this.targetCameraRotation) {
            this.camera.rotation.y += (this.targetCameraRotation.y - this.camera.rotation.y) * this.cameraRotationSpeed;
            this.camera.rotation.x += (this.targetCameraRotation.x - this.camera.rotation.x) * this.cameraRotationSpeed;
        }
        
        const speed = 20.0; // Adjusted speed for delta time
        const movement = new BABYLON.Vector3(0, 0, 0);
        
        if (this.keys['KeyW']) movement.z += 1;
        if (this.keys['KeyS']) movement.z -= 1;
        if (this.keys['KeyA']) movement.x -= 1;
        if (this.keys['KeyD']) movement.x += 1;
        
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
                const playerHeight = 4.0; // How high the camera is above the ground
                const targetY = hit.pickedPoint.y + playerHeight;
                // Smoothly interpolate to the target height
                this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
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
        enemyMesh.position.y = 1;

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
        explosionParticles.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
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
                    enemy.mesh.position.y = 1;
                    
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
        
        for (let tower of this.towers) {
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
        particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
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


    checkWaveComplete() {
        if (this.gameStarted && this.enemiesSpawned >= this.enemiesInWave && this.enemies.length === 0) {
            document.getElementById('nextWaveBtn').disabled = false;
            document.getElementById('nextWaveBtn').textContent = '🚀 NEXT WAVE';
            this.gameStarted = false;
            
            // Wave completion bonus
            const waveBonus = 25 + (this.wave * 10);
            this.gold += waveBonus;
            this.score += waveBonus * 5;
            console.log(`🎉 Wave ${this.wave} complete! +$${waveBonus} bonus`);
            this.updateUI();
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
    game.playRandomMusic();
    
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
        game.weatherSystem.startRain();
        game.weatherSystem.startLightning();
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