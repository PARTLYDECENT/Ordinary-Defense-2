/**
 * sprawlingPlant.js (Fully Organic Growth System)
 *
 * Defines the SprawlingPlant entity that grows and spreads across the map over time.
 * Features dynamic vine growth, procedural spreading, and organic visual effects.
 * Plants start small and grow into massive interconnected networks!
 *
 * FEATURES:
 * - Organic growth patterns that spread across terrain
 * - Dynamic vine networks that connect plant nodes
 * - Size variation from tiny seedlings to massive ancient plants
 * - Procedural spreading with environmental awareness
 * - Beautiful green materials with animated growth effects
 */

(function () {
  class SprawlingPlant {
    // --- STATIC PROPERTIES FOR SHARED SYSTEMS ---
    static allPlants = [];
    static growthObserver = null;
    static vineConnections = [];

    /**
     * Initializes the global plant growth system
     * @param {BABYLON.Scene} scene The Babylon.js scene
     */
    static initializeGrowthSystem(scene) {
        if (this.growthObserver) return; // Already initialized

        this.growthObserver = scene.registerBeforeRender(() => {
            if (game.isPaused) return;

            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            const currentTime = performance.now() * 0.001;

            // Update all plants in the ecosystem
            this.allPlants.forEach(plant => {
                if (!plant.isDead) {
                    plant.updateGrowth(deltaTime, currentTime);
                    plant.updateVines(currentTime);
                    plant.updateSporeSpread(deltaTime);
                }
            });

            // Update vine connections between plants
            this.updateVineNetwork(currentTime);
        });
        
        console.log("SprawlingPlant Growth System Initialized.", "SprawlingPlant");
    }

    /**
     * Updates the vine network connecting nearby plants
     */
    static updateVineNetwork(time) {
        // Clean up old connections
        this.vineConnections.forEach(connection => {
            if (connection.mesh && !connection.mesh.isDisposed()) {
                // Animate the vine with organic motion
                const segments = connection.segments;
                if (segments && segments.length > 0) {
                    const newPoints = segments.map((point, i) => {
                        const waveX = Math.sin(time * 0.5 + i * 0.3) * 0.2;
                        const waveY = Math.sin(time * 0.7 + i * 0.4) * 0.1;
                        return point.add(new BABYLON.Vector3(waveX, waveY, 0));
                    });
                    BABYLON.MeshBuilder.CreateTube(null, { 
                        path: newPoints, 
                        instance: connection.mesh 
                    });
                }
            }
        });
    }

    /**
     * Creates a new sprawling plant
     * @param {BABYLON.Scene} scene The Babylon.js scene
     * @param {BABYLON.Vector3} position Spawn position
     * @param {Object} config Configuration options
     */
    constructor(scene, position, config = {}) {
      this.scene = scene;
      this.position = position || new BABYLON.Vector3(
        (Math.random() - 0.5) * 100, 
        0, 
        (Math.random() - 0.5) * 100
      );

      // Ground snapping for organic placement
      this.snapToGround();

      // Plant configuration with organic growth parameters
      this.config = Object.assign({
        // Size and Growth
        initialSize: 0.1 + Math.random() * 0.3,
        maxSize: 2.0 + Math.random() * 3.0,
        growthRate: 0.02 + Math.random() * 0.03,
        
        // Vine System
        vineCount: 3 + Math.floor(Math.random() * 8),
        maxVineLength: 3 + Math.random() * 5,
        vineThickness: 0.05 + Math.random() * 0.1,
        vineSegments: 12,
        
        // Spreading Behavior
        spreadRadius: 8 + Math.random() * 12,
        spreadChance: 0.0001, // Per frame chance to spread
        maxOffspring: 3 + Math.floor(Math.random() * 4),
        
        // Visual Properties
        leafDensity: 0.5 + Math.random() * 0.5,
        flowerChance: 0.3,
        glowIntensity: 0.1 + Math.random() * 0.2,
        
        // Health and Lifecycle
        health: 100,
        maxAge: 300 + Math.random() * 200, // seconds
        maturityAge: 30 + Math.random() * 20,
        
        // Environmental Adaptation
        sunlightPreference: Math.random(), // 0 = shade, 1 = full sun
        moisturePreference: Math.random(), // 0 = dry, 1 = wet
        
        // Performance
        updateFrequency: 2
      }, config);

      // Initialize plant state
      this.currentSize = this.config.initialSize;
      this.age = 0;
      this.maturity = 0; // 0 = seedling, 1 = mature
      this.offspring = [];
      this.vines = [];
      this.isDead = false;
      this.isPlant = true;

      // Growth animation properties
      this.growthPhase = Math.random() * Math.PI * 2;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.updateCounter = Math.floor(Math.random() * this.config.updateFrequency);

      // Create plant components
      this.createMaterials();
      this.createMainBody();
      this.createVineSystem();
      this.createLeafSystem();
      
      // Position the plant
      this.mesh = this.mainBody;
      this.mesh.position = this.position;
      
      // Add to global systems
      SprawlingPlant.allPlants.push(this);

      // Initialize growth system if needed
      SprawlingPlant.initializeGrowthSystem(this.scene);

      // Cleanup on disposal
      this.mesh.onDisposeObservable.add(() => this.cleanup());
      
      console.log(`Spawned SprawlingPlant at [${this.position.x.toFixed(2)}, ${this.position.z.toFixed(2)}] with max size ${this.config.maxSize.toFixed(2)}`, "SprawlingPlant");
    }

    /**
     * Snaps the plant to the ground surface
     */
    snapToGround() {
        const groundRay = new BABYLON.Ray(
            new BABYLON.Vector3(this.position.x, this.position.y + 50, this.position.z),
            new BABYLON.Vector3(0, -1, 0),
            100
        );
        
        const pickInfo = this.scene.pickWithRay(groundRay, mesh => mesh.checkCollisions);
        
        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            this.position.y = pickInfo.pickedPoint.y;
            this.groundHeight = pickInfo.pickedPoint.y;
        } else {
            this.position.y = 0;
            this.groundHeight = 0;
            console.log(`Warning: No ground found for SprawlingPlant at [${this.position.x.toFixed(2)}, ${this.position.z.toFixed(2)}]`, "SprawlingPlant");
        }
    }

    /**
     * Creates organic plant materials with green variations
     */
    createMaterials() {
        // Main body material - rich green with organic variation
        this.bodyMaterial = new BABYLON.StandardMaterial("plantBodyMat", this.scene);
        const greenVariation = 0.3 + Math.random() * 0.4;
        this.bodyMaterial.diffuseColor = new BABYLON.Color3(
            0.1 + greenVariation * 0.2, 
            greenVariation, 
            0.1 + greenVariation * 0.3
        );
        this.bodyMaterial.specularColor = new BABYLON.Color3(0.1, 0.2, 0.1);
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.05, 0.02);

        // Vine material - darker green
        this.vineMaterial = new BABYLON.StandardMaterial("plantVineMat", this.scene);
        this.vineMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.2);
        this.vineMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Leaf material - bright green with transparency
        this.leafMaterial = new BABYLON.StandardMaterial("plantLeafMat", this.scene);
        this.leafMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.3);
        this.leafMaterial.specularColor = new BABYLON.Color3(0.2, 0.3, 0.2);
        this.leafMaterial.alpha = 0.8;
        this.leafMaterial.backFaceCulling = false;

        // Flower material - colorful accent
        this.flowerMaterial = new BABYLON.StandardMaterial("plantFlowerMat", this.scene);
        const flowerHue = Math.random();
        this.flowerMaterial.diffuseColor = new BABYLON.Color3(
            0.5 + flowerHue * 0.5,
            0.2 + (1 - flowerHue) * 0.6,
            0.3 + Math.random() * 0.4
        );
        this.flowerMaterial.emissiveColor = this.flowerMaterial.diffuseColor.scale(0.3);
    }

    /**
     * Creates the main plant body
     */
    createMainBody() {
        // Create organic-looking main body using a deformed sphere
        this.mainBody = BABYLON.MeshBuilder.CreateSphere("plantBody", {
            diameter: this.currentSize,
            segments: 16
        }, this.scene);
        
        // Deform the sphere to make it more organic
        const positions = this.mainBody.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < positions.length; i += 3) {
            const deformX = (Math.random() - 0.5) * 0.1;
            const deformY = (Math.random() - 0.5) * 0.1;
            const deformZ = (Math.random() - 0.5) * 0.1;
            positions[i] += deformX;
            positions[i + 1] += deformY;
            positions[i + 2] += deformZ;
        }
        this.mainBody.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        
        this.mainBody.material = this.bodyMaterial;
        this.mainBody.checkCollisions = false; // Plants don't block movement
    }

    /**
     * Creates the vine system that sprawls outward
     */
    createVineSystem() {
        this.vines = [];
        
        for (let i = 0; i < this.config.vineCount; i++) {
            const vine = this.createVine(i);
            this.vines.push(vine);
        }
    }

    /**
     * Creates a single vine with organic curves
     */
    createVine(index) {
        const angle = (index / this.config.vineCount) * Math.PI * 2 + Math.random() * 0.5;
        const vineLength = this.config.maxVineLength * (0.5 + Math.random() * 0.5);
        
        // Generate organic vine path
        const points = [];
        const segments = this.config.vineSegments;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const distance = t * vineLength;
            
            // Base direction with organic deviation
            const baseX = Math.cos(angle) * distance;
            const baseZ = Math.sin(angle) * distance;
            
            // Add organic curves and height variation
            const curve = Math.sin(t * Math.PI * 2) * 0.5;
            const height = Math.sin(t * Math.PI) * 0.8 * this.currentSize;
            
            points.push(new BABYLON.Vector3(
                baseX + curve * Math.cos(angle + Math.PI/2),
                height,
                baseZ + curve * Math.sin(angle + Math.PI/2)
            ));
        }
        
        // Create the vine mesh
        const vineMesh = BABYLON.MeshBuilder.CreateTube(`vine${index}`, {
            path: points,
            radius: this.config.vineThickness,
            updatable: true
        }, this.scene);
        
        vineMesh.material = this.vineMaterial;
        vineMesh.parent = this.mainBody;
        
        return {
            mesh: vineMesh,
            basePoints: points,
            angle: angle,
            length: vineLength,
            growthProgress: 0 // Vines grow over time
        };
    }

    /**
     * Creates leaves along the vines
     */
    createLeafSystem() {
        this.leaves = [];
        
        this.vines.forEach((vine, vineIndex) => {
            const leafCount = Math.floor(this.config.leafDensity * 8);
            
            for (let i = 0; i < leafCount; i++) {
                const leaf = this.createLeaf(vine, i / leafCount);
                this.leaves.push(leaf);
            }
        });

        // Add flowers if mature enough
        if (Math.random() < this.config.flowerChance) {
            this.createFlowers();
        }
    }

    /**
     * Creates a single leaf
     */
    createLeaf(vine, position) {
        const leaf = BABYLON.MeshBuilder.CreateDisc("leaf", {
            radius: 0.1 + Math.random() * 0.1,
            segments: 6
        }, this.scene);
        
        leaf.material = this.leafMaterial;
        leaf.parent = vine.mesh;
        
        // Position along vine
        const vinePoint = vine.basePoints[Math.floor(position * (vine.basePoints.length - 1))];
        if (vinePoint) {
            leaf.position = vinePoint.clone();
            leaf.rotation.x = Math.random() * Math.PI;
            leaf.rotation.y = Math.random() * Math.PI * 2;
            leaf.rotation.z = Math.random() * Math.PI;
        }
        
        return leaf;
    }

    /**
     * Creates flowers on mature plants
     */
    createFlowers() {
        const flowerCount = 1 + Math.floor(Math.random() * 3);
        this.flowers = [];
        
        for (let i = 0; i < flowerCount; i++) {
            const flower = BABYLON.MeshBuilder.CreateSphere("flower", {
                diameter: 0.1 + Math.random() * 0.1
            }, this.scene);
            
            flower.material = this.flowerMaterial;
            flower.parent = this.mainBody;
            
            // Random position on plant
            const angle = Math.random() * Math.PI * 2;
            const height = 0.5 + Math.random() * 0.5;
            flower.position = new BABYLON.Vector3(
                Math.cos(angle) * this.currentSize * 0.6,
                height * this.currentSize,
                Math.sin(angle) * this.currentSize * 0.6
            );
            
            this.flowers.push(flower);
        }
    }

    /**
     * Updates plant growth over time
     */
    updateGrowth(deltaTime, time) {
        this.age += deltaTime;
        
        // Calculate maturity (0 to 1)
        this.maturity = Math.min(1, this.age / this.config.maturityAge);
        
        // Grow the main body
        if (this.currentSize < this.config.maxSize) {
            const growthAmount = this.config.growthRate * deltaTime * (1 + Math.sin(time * 0.5) * 0.1);
            this.currentSize += growthAmount;
            
            // Update main body size with organic pulsing
            const pulseScale = 1 + Math.sin(time * 2 + this.pulsePhase) * 0.02;
            this.mainBody.scaling = new BABYLON.Vector3(
                this.currentSize * pulseScale,
                this.currentSize * pulseScale * (0.8 + Math.sin(time * 0.3) * 0.1),
                this.currentSize * pulseScale
            );
        }
        
        // Update material glow based on health and maturity
        const glowIntensity = this.config.glowIntensity * this.maturity;
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(
            0.02 * glowIntensity + Math.sin(time + this.growthPhase) * 0.01,
            0.05 * glowIntensity + Math.sin(time + this.growthPhase) * 0.02,
            0.02 * glowIntensity
        );
    }

    /**
     * Updates vine animation and growth
     */
    updateVines(time) {
        this.vines.forEach((vine, index) => {
            // Grow vines progressively
            if (vine.growthProgress < 1) {
                vine.growthProgress += 0.01;
            }
            
            // Animate vine movement
            const newPoints = vine.basePoints.map((point, i) => {
                const t = i / (vine.basePoints.length - 1);
                const wave = Math.sin(time * 1.5 + index + t * Math.PI) * 0.1 * this.currentSize;
                const sway = Math.cos(time * 0.8 + index * 2) * 0.05 * this.currentSize;
                
                return new BABYLON.Vector3(
                    point.x + sway,
                    point.y + wave,
                    point.z + sway * 0.5
                );
            });
            
            // Only show grown portion of vine
            const visiblePoints = newPoints.slice(0, Math.floor(newPoints.length * vine.growthProgress));
            if (visiblePoints.length >= 2) {
                BABYLON.MeshBuilder.CreateTube(null, {
                    path: visiblePoints,
                    instance: vine.mesh
                });
            }
        });
    }

    /**
     * Handles plant spreading and reproduction
     */
    updateSporeSpread(deltaTime) {
        // Only mature plants can spread
        if (this.maturity < 0.8 || this.offspring.length >= this.config.maxOffspring) return;
        
        if (Math.random() < this.config.spreadChance * deltaTime) {
            this.spreadToNewLocation();
        }
    }

    /**
     * Spreads the plant to a new location
     */
    spreadToNewLocation() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * this.config.spreadRadius;
        
        const newPosition = new BABYLON.Vector3(
            this.position.x + Math.cos(angle) * distance,
            this.position.y,
            this.position.z + Math.sin(angle) * distance
        );
        
        // Create offspring with slight genetic variation
        const childConfig = { ...this.config };
        childConfig.initialSize *= 0.8 + Math.random() * 0.4;
        childConfig.maxSize *= 0.9 + Math.random() * 0.2;
        childConfig.vineCount = Math.max(2, this.config.vineCount + Math.floor((Math.random() - 0.5) * 3));
        
        const offspring = new SprawlingPlant(this.scene, newPosition, childConfig);
        this.offspring.push(offspring);
        
        // Create spore effect
        this.createSporeEffect(newPosition);
        
        console.log(`SprawlingPlant spread to new location! ${this.offspring.length}/${this.config.maxOffspring} offspring`, "SprawlingPlant");
    }

    /**
     * Creates visual effect for spore spreading
     */
    createSporeEffect(targetPosition) {
        // Create floating spore particles
        const particleSystem = new BABYLON.ParticleSystem("spores", 100, this.scene);
        
        // Handle texture loading gracefully
        particleSystem.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null,
            (message) => {
                console.log(`Spore texture not found, using default. ${message}`, "SprawlingPlant");
                particleSystem.particleTexture = null;
            });
        
        particleSystem.emitter = this.mainBody.position.clone();
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        
        particleSystem.color1 = new BABYLON.Color4(0.3, 0.8, 0.3, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.1, 0.6, 0.1, 0.0);
        
        particleSystem.minSize = 0.02;
        particleSystem.maxSize = 0.08;
        particleSystem.minLifeTime = 2;
        particleSystem.maxLifeTime = 4;
        
        particleSystem.emitRate = 50;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        
        // Make spores float toward target
        const direction = targetPosition.subtract(this.mainBody.position).normalize();
        particleSystem.direction1 = direction.scale(0.5);
        particleSystem.direction2 = direction.scale(1.5);
        
        particleSystem.gravity = new BABYLON.Vector3(0, 0.5, 0); // Light upward drift
        particleSystem.targetStopDuration = 1;
        particleSystem.disposeOnStop = true;
        particleSystem.start();
    }

    /**
     * Handles plant destruction
     */
    destroy() {
        if (this.isDead) return;
        this.isDead = true;
        
        this.createDeathEffect();
        
        // Remove from global lists
        const plantIndex = SprawlingPlant.allPlants.indexOf(this);
        if (plantIndex !== -1) {
            SprawlingPlant.allPlants.splice(plantIndex, 1);
        }
        
        this.cleanup();
    }

    /**
     * Creates withering death effect
     */
    createDeathEffect() {
        // Wither effect - plant turns brown and crumbles
        this.bodyMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        
        // Create leaf particles falling
        const leafParticles = new BABYLON.ParticleSystem("leaves", 200, this.scene);
        leafParticles.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null,
            () => leafParticles.particleTexture = null);
        
        leafParticles.emitter = this.mainBody.position.clone();
        leafParticles.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        leafParticles.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        
        leafParticles.color1 = new BABYLON.Color4(0.4, 0.3, 0.2, 1.0);
        leafParticles.color2 = new BABYLON.Color4(0.2, 0.6, 0.2, 0.0);
        
        leafParticles.minSize = 0.05;
        leafParticles.maxSize = 0.15;
        leafParticles.minLifeTime = 1;
        leafParticles.maxLifeTime = 3;
        
        leafParticles.emitRate = 100;
        leafParticles.gravity = new BABYLON.Vector3(0, -2, 0);
        leafParticles.targetStopDuration = 2;
        leafParticles.disposeOnStop = true;
        leafParticles.start();
        
        console.log("SprawlingPlant withered away", "SprawlingPlant");
    }

    /**
     * Cleans up all plant resources
     */
    cleanup() {
        this.vines.forEach(vine => {
            if (vine.mesh && !vine.mesh.isDisposed()) {
                vine.mesh.dispose();
            }
        });
        
        if (this.leaves) {
            this.leaves.forEach(leaf => {
                if (leaf && !leaf.isDisposed()) {
                    leaf.dispose();
                }
            });
        }
        
        if (this.flowers) {
            this.flowers.forEach(flower => {
                if (flower && !flower.isDisposed()) {
                    flower.dispose();
                }
            });
        }
        
        if (this.mainBody && !this.mainBody.isDisposed()) {
            this.mainBody.dispose();
        }
        
        // Clean up offspring (they become independent)
        this.offspring.forEach(child => {
            // Remove parent reference but don't destroy offspring
            child.parent = null;
        });
        
        console.log("SprawlingPlant cleaned up", "SprawlingPlant");
    }

    /**
     * Creates different plant variants
     */
    static createVariant(scene, position, variant = 'normal', level = 1) {
        const variants = {
            normal: { 
                maxSize: 2.0, 
                vineCount: 6, 
                spreadRadius: 10 
            },
            seedling: { 
                initialSize: 0.05, 
                maxSize: 0.8, 
                vineCount: 3, 
                spreadRadius: 5,
                growthRate: 0.01 
            },
            ancient: { 
                initialSize: 1.0,
                maxSize: 5.0, 
                vineCount: 12, 
                spreadRadius: 20,
                maxOffspring: 8,
                glowIntensity: 0.4 
            },
            flowering: { 
                maxSize: 3.0, 
                vineCount: 8, 
                flowerChance: 0.9,
                glowIntensity: 0.3,
                spreadRadius: 15 
            },
            creeper: { 
                maxSize: 1.5, 
                vineCount: 15, 
                maxVineLength: 8,
                spreadRadius: 25,
                spreadChance: 0.002 
            }
        };
        
        const config = variants[variant] || variants.normal;
        
        // Scale with level
        config.maxSize = (config.maxSize || 2.0) * (1 + level * 0.2);
        config.spreadRadius = (config.spreadRadius || 10) * (1 + level * 0.1);
        config.health = (config.health || 100) * level;
        
        return new SprawlingPlant(scene, position, config);
    }

    /**
     * Spawns a plant ecosystem across the map
     */
    static spawnEcosystem(scene, count = 10, bounds = 100) {
        const plants = [];
        
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * bounds;
            const z = (Math.random() - 0.5) * bounds;
            const position = new BABYLON.Vector3(x, 0, z);
            
            // Choose variant based on location and randomness
            const variants = ['seedling', 'normal', 'flowering', 'creeper'];
            if (i === 0) variants.push('ancient'); // One ancient plant
            
            const variant = variants[Math.floor(Math.random() * variants.length)];
            const level = 1 + Math.floor(Math.random() * 3);
            
            const plant = SprawlingPlant.createVariant(scene, position, variant, level);
            plants.push(plant);

            // Spawn a predator nearby
            const predatorPosition = new BABYLON.Vector3(x + (Math.random() - 0.5) * 10, 0, z + (Math.random() - 0.5) * 10);
            new PredatoryThornvine(scene, predatorPosition);
        }
        
        console.log(`Spawned plant ecosystem with ${count} plants and ${count} predators`, "SprawlingPlant");
        return plants;
    }
  }

  class PredatoryThornvine {
    // --- STATIC PROPERTIES FOR PREDATOR SYSTEMS ---
    static allPredators = [];
    static huntingSystem = null;
    static territoryMap = new Map();
    static preyTargets = new Set();

    /**
     * Initializes the global predator hunting system
     * @param {BABYLON.Scene} scene The Babylon.js scene
     */
    static initializeHuntingSystem(scene) {
        if (this.huntingSystem) return;

        this.huntingSystem = scene.registerBeforeRender(() => {
            if (game.isPaused) return;

            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            const currentTime = performance.now() * 0.001;

            // Update all predatory plants
            this.allPredators.forEach(predator => {
                if (!predator.isDead) {
                    predator.updateHuntingBehavior(deltaTime, currentTime);
                    predator.updateTerritorialControl(currentTime);
                    predator.updateThreatDisplay(currentTime);
                    predator.updateToxicAura(deltaTime);
                }
            });

            // Update territorial conflicts between predators
            this.resolveTerritorialDisputes(currentTime);
        });
        
        console.log("PredatoryThornvine Hunting System Initialized.", "PredatoryThornvine");
    }

    /**
     * Resolves conflicts between overlapping territories
     */
    static resolveTerritorialDisputes(time) {
        this.allPredators.forEach((predatorA, indexA) => {
            this.allPredators.forEach((predatorB, indexB) => {
                if (indexA >= indexB || predatorA.isDead || predatorB.isDead) return;

                const distance = BABYLON.Vector3.Distance(predatorA.position, predatorB.position);
                const territoryOverlap = (predatorA.config.territoryRadius + predatorB.config.territoryRadius) - distance;

                if (territoryOverlap > 0) {
                    predatorA.engageInTerritorialConflict(predatorB, time);
                    predatorB.engageInTerritorialConflict(predatorA, time);
                }
            });
        });
    }

    /**
     * Creates a new predatory thornvine
     * @param {BABYLON.Scene} scene The Babylon.js scene
     * @param {BABYLON.Vector3} position Spawn position
     * @param {Object} config Configuration options
     */
    constructor(scene, position, config = {}) {
      this.scene = scene;
      this.position = position || new BABYLON.Vector3(
        (Math.random() - 0.5) * 100, 
        0, 
        (Math.random() - 0.5) * 100
      );

      // Ground snapping for menacing emergence
      this.snapToGround();

      // Predatory plant configuration
      this.config = Object.assign({
        // Size and Aggression
        initialSize: 0.3 + Math.random() * 0.5,
        maxSize: 4.0 + Math.random() * 6.0,
        growthRate: 0.08 + Math.random() * 0.05, // Faster growth
        aggressionLevel: 0.7 + Math.random() * 0.3,
        
        // Thorny Appendages
        thornCount: 8 + Math.floor(Math.random() * 12),
        maxThornLength: 4 + Math.random() * 6,
        thornThickness: 0.15 + Math.random() * 0.1,
        thornSharpness: 0.8 + Math.random() * 0.2,
        
        // Hunting Behavior
        detectionRadius: 15 + Math.random() * 10,
        attackRadius: 8 + Math.random() * 5,
        huntingSpeed: 2.0 + Math.random() * 1.5,
        preyPreference: Math.random(), // 0 = small prey, 1 = large prey
        
        // Territory Control
        territoryRadius: 12 + Math.random() * 8,
        territoryAggression: 0.6 + Math.random() * 0.4,
        expansionRate: 0.05 + Math.random() * 0.03,
        
        // Visual Menace
        thornyDensity: 0.8 + Math.random() * 0.2,
        glowIntensity: 0.3 + Math.random() * 0.4,
        pulseRate: 1.5 + Math.random() * 1.0,
        
        // Toxic Properties
        toxicityLevel: 0.5 + Math.random() * 0.5,
        sporeRadius: 6 + Math.random() * 4,
        toxicDamage: 10 + Math.random() * 15,
        
        // Health and Dominance
        health: 200 + Math.random() * 150,
        maxAge: 500 + Math.random() * 300,
        maturityAge: 20 + Math.random() * 15, // Faster maturity
        dominanceLevel: Math.random(),
        
        // Environmental Adaptation
        hostilityToOtherPlants: 0.8 + Math.random() * 0.2,
        territorialInstinct: 0.9 + Math.random() * 0.1,
        
        // Performance
        updateFrequency: 1 // More frequent updates for aggression
      }, config);

      // Initialize predator state
      this.currentSize = this.config.initialSize;
      this.age = 0;
      this.maturity = 0;
      this.thorns = [];
      this.preyList = [];
      this.territoryMarkers = [];
      this.isDead = false;
      this.isPredatoryPlant = true;
      this.isHunting = false;
      this.currentTarget = null;
      this.threatLevel = 0; // 0 = calm, 1 = maximum threat

      // Behavioral animation properties
      this.huntingPhase = Math.random() * Math.PI * 2;
      this.threatPhase = Math.random() * Math.PI * 2;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.lastAttackTime = 0;

      // Create predatory components
      this.createMenacingMaterials();
      this.createMainBody();
      this.createThornSystem();
      this.createTerritoryMarkers();
      
      // Position the plant
      this.mesh = this.mainBody;
      this.mesh.position = this.position;
      
      // Add to global predator systems
      PredatoryThornvine.allPredators.push(this);
      PredatoryThornvine.territoryMap.set(this, {
        center: this.position.clone(),
        radius: this.config.territoryRadius,
        hostility: this.config.territorialInstinct
      });

      // Initialize hunting system
      PredatoryThornvine.initializeHuntingSystem(this.scene);

      // Create initial threat display
      this.createEmergenceEffect();

      // Cleanup on disposal
      this.mesh.onDisposeObservable.add(() => this.cleanup());
      
      console.log(`Spawned PredatoryThornvine at [${this.position.x.toFixed(2)}, ${this.position.z.toFixed(2)}] with aggression ${this.config.aggressionLevel.toFixed(2)}`, "PredatoryThornvine");
    }

    /**
     * Snaps the predator to ground with menacing emergence
     */
    snapToGround() {
        const groundRay = new BABYLON.Ray(
            new BABYLON.Vector3(this.position.x, this.position.y + 50, this.position.z),
            new BABYLON.Vector3(0, -1, 0),
            100
        );
        
        const pickInfo = this.scene.pickWithRay(groundRay, mesh => mesh.checkCollisions);
        
        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            this.position.y = pickInfo.pickedPoint.y;
            this.groundHeight = pickInfo.pickedPoint.y;
        } else {
            this.position.y = 0;
            this.groundHeight = 0;
        }
    }

    /**
     * Creates menacing dark materials with threatening accents
     */
    createMenacingMaterials() {
        // Main body material - dark, menacing with red pulsing
        this.bodyMaterial = new BABYLON.StandardMaterial("predatorBodyMat", this.scene);
        this.bodyMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.05, 0.05); // Dark reddish
        this.bodyMaterial.specularColor = new BABYLON.Color3(0.3, 0.1, 0.1);
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.02);

        // Thorn material - menacing black with red tips
        this.thornMaterial = new BABYLON.StandardMaterial("thornMat", this.scene);
        this.thornMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.thornMaterial.specularColor = new BABYLON.Color3(0.4, 0.1, 0.1);
        this.thornMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.01, 0.01);

        // Toxic aura material - sickly green glow
        this.auraMaterial = new BABYLON.StandardMaterial("toxicAuraMat", this.scene);
        this.auraMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.1);
        this.auraMaterial.specularColor = new BABYLON.Color3(0.1, 0.2, 0.05);
        this.auraMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.05);
        this.auraMaterial.alpha = 0.3;

        // Territory marker material - warning red
        this.territoryMaterial = new BABYLON.StandardMaterial("territoryMat", this.scene);
        this.territoryMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.1, 0.1);
        this.territoryMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.05);
    }

    /**
     * Creates the menacing main body
     */
    createMainBody() {
        // Create aggressive-looking main body with jagged edges
        this.mainBody = BABYLON.MeshBuilder.CreateSphere("predatorBody", {
            diameter: this.currentSize,
            segments: 12
        }, this.scene);
        
        // Heavily deform for menacing appearance
        const positions = this.mainBody.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < positions.length; i += 3) {
            const deformX = (Math.random() - 0.5) * 0.3;
            const deformY = (Math.random() - 0.5) * 0.2;
            const deformZ = (Math.random() - 0.5) * 0.3;
            
            // Create more dramatic spikes
            const spikeChance = Math.random();
            if (spikeChance > 0.7) {
                const spikeMult = 1 + Math.random() * 0.5;
                positions[i] *= spikeMult;
                positions[i + 1] *= spikeMult;
                positions[i + 2] *= spikeMult;
            }
            
            positions[i] += deformX;
            positions[i + 1] += deformY;
            positions[i + 2] += deformZ;
        }
        this.mainBody.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        
        this.mainBody.material = this.bodyMaterial;
        this.mainBody.checkCollisions = false;

        // Create toxic aura around the plant
        this.toxicAura = BABYLON.MeshBuilder.CreateSphere("toxicAura", {
            diameter: this.config.sporeRadius * 2
        }, this.scene);
        this.toxicAura.material = this.auraMaterial;
        this.toxicAura.parent = this.mainBody;
        this.toxicAura.isVisible = false; // Will show during threats
    }

    /**
     * Creates the aggressive thorn system
     */
    createThornSystem() {
        this.thorns = [];
        
        for (let i = 0; i < this.config.thornCount; i++) {
            const thorn = this.createThorn(i);
            this.thorns.push(thorn);
        }
    }

    /**
     * Creates a single menacing thorn
     */
    createThorn(index) {
        const angle = (index / this.config.thornCount) * Math.PI * 2 + Math.random() * 0.3;
        const thornLength = this.config.maxThornLength * (0.6 + Math.random() * 0.4);
        
        // Create jagged thorn path
        const points = [];
        const segments = 8;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const distance = t * thornLength;
            
            // Base direction with aggressive curve
            const baseX = Math.cos(angle) * distance;
            const baseZ = Math.sin(angle) * distance;
            
            // Add menacing curves and height variation
            const curve = Math.sin(t * Math.PI * 3) * 0.3;
            const height = Math.sin(t * Math.PI) * 0.4 * this.currentSize + t * this.currentSize * 0.8;
            
            // Make thorns more jagged
            const jag = (Math.random() - 0.5) * 0.2 * t;
            
            points.push(new BABYLON.Vector3(
                baseX + curve * Math.cos(angle + Math.PI/2) + jag,
                height,
                baseZ + curve * Math.sin(angle + Math.PI/2) + jag
            ));
        }
        
        // Create the thorn mesh with tapering
        const thornMesh = BABYLON.MeshBuilder.CreateTube(`thorn${index}`, {
            path: points,
            radiusFunction: (i, distance) => {
                const t = i / (points.length - 1);
                return this.config.thornThickness * (1 - t * 0.8); // Tapers to sharp point
            },
            updatable: true,
            cap: BABYLON.Mesh.CAP_END
        }, this.scene);
        
        thornMesh.material = this.thornMaterial;
        thornMesh.parent = this.mainBody;
        
        return {
            mesh: thornMesh,
            basePoints: points,
            angle: angle,
            length: thornLength,
            aggressionState: 0, // 0 = retracted, 1 = fully extended
            isAttacking: false
        };
    }

    /**
     * Creates territory markers around the plant
     */
    createTerritoryMarkers() {
        this.territoryMarkers = [];
        const markerCount = 6;
        
        for (let i = 0; i < markerCount; i++) {
            const angle = (i / markerCount) * Math.PI * 2;
            const distance = this.config.territoryRadius * 0.8;
            
            const marker = BABYLON.MeshBuilder.CreateCylinder("territoryMarker", {
                height: 1,
                diameterTop: 0.1,
                diameterBottom: 0.3,
                tessellation: 6
            }, this.scene);
            
            marker.material = this.territoryMaterial;
            marker.position = new BABYLON.Vector3(
                Math.cos(angle) * distance,
                0.5,
                Math.sin(angle) * distance
            );
            marker.parent = this.mainBody;
            marker.isVisible = false; // Show during territorial disputes
            
            this.territoryMarkers.push(marker);
        }
    }

    /**
     * Creates dramatic emergence effect
     */
    createEmergenceEffect() {
        // Ground cracking effect
        const crackParticles = new BABYLON.ParticleSystem("emergence", 200, this.scene);
        
        crackParticles.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null, () => crackParticles.particleTexture = null);
        
        crackParticles.emitter = this.mainBody.position.clone();
        crackParticles.minEmitBox = new BABYLON.Vector3(-2, -0.1, -2);
        crackParticles.maxEmitBox = new BABYLON.Vector3(2, 0.1, 2);
        
        crackParticles.color1 = new BABYLON.Color4(0.4, 0.2, 0.1, 1.0);
        crackParticles.color2 = new BABYLON.Color4(0.2, 0.1, 0.05, 0.0);
        
        crackParticles.minSize = 0.1;
        crackParticles.maxSize = 0.3;
        crackParticles.minLifeTime = 1;
        crackParticles.maxLifeTime = 2;
        
        crackParticles.emitRate = 150;
        crackParticles.gravity = new BABYLON.Vector3(0, -5, 0);
        crackParticles.targetStopDuration = 1.5;
        crackParticles.disposeOnStop = true;
        crackParticles.start();
        
        console.log("PredatoryThornvine emerged with menacing presence!", "PredatoryThornvine");
    }

    /**
     * Updates hunting behavior and prey detection
     */
    updateHuntingBehavior(deltaTime, time) {
        this.age += deltaTime;
        this.maturity = Math.min(1, this.age / this.config.maturityAge);
        
        if (this.maturity < 0.5) return; // Not mature enough to hunt
        
        // Detect potential prey in range
        this.detectPrey();
        
        // Update hunting state
        if (this.currentTarget && !this.currentTarget.isDisposed()) {
            const distanceToTarget = BABYLON.Vector3.Distance(this.position, this.currentTarget.position);
            
            if (distanceToTarget <= this.config.attackRadius) {
                this.executeAttack(time);
            } else if (distanceToTarget <= this.config.detectionRadius) {
                this.stalkPrey(deltaTime);
            } else {
                this.currentTarget = null;
                this.isHunting = false;
            }
        }
        
        // Grow more aggressive over time
        this.updateGrowth(deltaTime, time);
    }

    /**
     * Detects potential prey within range
     */
    detectPrey() {
        // Scan for other entities in range
        const nearbyEntities = this.scene.meshes.filter(mesh => {
            if (!mesh.position || mesh === this.mainBody) return false;
            
            const distance = BABYLON.Vector3.Distance(this.position, mesh.position);
            return distance <= this.config.detectionRadius && distance > 1;
        });
        
        if (nearbyEntities.length > 0 && !this.currentTarget) {
            this.currentTarget = nearbyEntities[Math.floor(Math.random() * nearbyEntities.length)];
            this.isHunting = true;
            this.threatLevel = Math.min(1, this.threatLevel + 0.5);
            
            console.log("PredatoryThornvine detected prey and began hunting!", "PredatoryThornvine");
        }
    }

    /**
     * Stalks prey with intimidating behavior
     */
    stalkPrey(deltaTime) {
        // Extend thorns menacingly
        this.thorns.forEach(thorn => {
            thorn.aggressionState = Math.min(1, thorn.aggressionState + deltaTime * 2);
        });
        
        // Intensify toxic aura
        this.toxicAura.isVisible = true;
        this.threatLevel = Math.min(1, this.threatLevel + deltaTime);
    }

    /**
     * Executes attack on prey
     */
    executeAttack(time) {
        if (time - this.lastAttackTime < 2) return; // Attack cooldown
        
        this.lastAttackTime = time;
        
        // Lash out with thorns
        this.thorns.forEach((thorn, index) => {
            thorn.isAttacking = true;
            
            // Animate thorn lashing
            setTimeout(() => {
                thorn.isAttacking = false;
            }, 500 + index * 100);
        });
        
        // Create attack effect
        this.createAttackEffect();
        
        // Set maximum threat level
        this.threatLevel = 1;
        
        console.log("PredatoryThornvine launched aggressive attack!", "PredatoryThornvine");
    }

    /**
     * Updates territorial control behavior
     */
    updateTerritorialControl(time) {
        // Show territory markers when threatened or aggressive
        const showMarkers = this.threatLevel > 0.3;
        this.territoryMarkers.forEach(marker => {
            marker.isVisible = showMarkers;
            
            if (showMarkers) {
                // Pulse warning markers
                const pulse = 1 + Math.sin(time * 4 + marker.position.x) * 0.3;
                marker.scaling.y = pulse;
            }
        });
        
        // Expand territory based on dominance
        if (this.maturity > 0.8) {
            const territory = PredatoryThornvine.territoryMap.get(this);
            if (territory) {
                territory.radius = Math.min(
                    this.config.territoryRadius * 1.5,
                    territory.radius + this.config.expansionRate * 0.016 // ~60fps
                );
            }
        }
    }

    /**
     * Engages in territorial conflict with another predator
     */
    engageInTerritorialConflict(rival, time) {
        // Increase threat level
        this.threatLevel = Math.min(1, this.threatLevel + 0.01);
        
        // Display aggressive posturing
        this.thorns.forEach(thorn => {
            thorn.aggressionState = 1;
        });
        
        // Show toxic aura as warning
        this.toxicAura.isVisible = true;
        
        // Territorial dominance battle (based on size and age)
        const myPower = this.currentSize * this.maturity * this.config.dominanceLevel;
        const rivalPower = rival.currentSize * rival.maturity * rival.config.dominanceLevel;
        
        if (myPower > rivalPower * 1.2) {
            // I'm clearly dominant - rival should back down
            console.log("PredatoryThornvine asserted territorial dominance!", "PredatoryThornvine");
        }
    }

    /**
     * Updates threatening visual display
     */
    updateThreatDisplay(time) {
        // Decrease threat level over time when not actively threatened
        if (!this.isHunting && this.currentTarget === null) {
            this.threatLevel = Math.max(0, this.threatLevel - 0.005);
        }
        
        // Update materials based on threat level
        const threatIntensity = this.threatLevel;
        
        // Pulsing red glow based on threat
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(
            0.1 + threatIntensity * 0.4 + Math.sin(time * this.config.pulseRate + this.pulsePhase) * 0.1,
            0.02 + Math.sin(time * this.config.pulseRate + this.pulsePhase) * 0.01,
            0.02
        );
        
        // Thorn animation based on aggression
        this.thorns.forEach((thorn, index) => {
            if (!thorn.isAttacking) {
                // Retract thorns when calm, extend when aggressive
                thorn.aggressionState = Math.max(0, thorn.aggressionState - 0.01);
                thorn.aggressionState = Math.min(thorn.aggressionState + threatIntensity * 0.02, 1);
            }
            
            // Animate thorn menacingly
            const threatWave = Math.sin(time * 2 + index + this.threatPhase) * 0.1 * threatIntensity;
            const newPoints = thorn.basePoints.map((point, i) => {
                const t = i / (thorn.basePoints.length - 1);
                return new BABYLON.Vector3(
                    point.x + threatWave,
                    point.y + threatWave * 0.5,
                    point.z + threatWave * 0.3
                );
            });
            
            // Scale thorn extension based on aggression
            const extensionScale = 0.3 + thorn.aggressionState * 0.7;
            const scaledPoints = newPoints.slice(0, Math.floor(newPoints.length * extensionScale));
            
            if (scaledPoints.length >= 2) {
                BABYLON.MeshBuilder.CreateTube(null, {
                    path: scaledPoints,
                    radiusFunction: (i, distance) => {
                        const t = i / (scaledPoints.length - 1);
                        return this.config.thornThickness * (1 - t * 0.8) * (0.5 + thorn.aggressionState * 0.5);
                    },
                    instance: thorn.mesh
                });
            }
        });
    }

    /**
     * Updates toxic aura effects
     */
    updateToxicAura(deltaTime) {
        if (!this.toxicAura.isVisible) return;
        
        // Pulse toxic aura
        const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.2;
        this.toxicAura.scaling = new BABYLON.Vector3(pulse, pulse, pulse);
        
        // Gradually hide aura when not threatened
        if (this.threatLevel < 0.2) {
            this.toxicAura.isVisible = false;
        }
    }

    /**
     * Updates plant growth with aggressive scaling
     */
    updateGrowth(deltaTime, time) {
        // Grow more aggressively when hunting or threatened
        const aggressionBonus = 1 + this.threatLevel * 0.5;
        
        if (this.currentSize < this.config.maxSize) {
            const growthAmount = this.config.growthRate * deltaTime * aggressionBonus;
            this.currentSize += growthAmount;
            
            // Menacing scaling with aggressive pulsing
            const menacingPulse = 1 + Math.sin(time * this.config.pulseRate + this.pulsePhase) * 0.05 * this.threatLevel;
            this.mainBody.scaling = new BABYLON.Vector3(
                this.currentSize * menacingPulse,
                this.currentSize * menacingPulse * (0.9 + Math.sin(time * 0.5) * 0.1),
                this.currentSize * menacingPulse
            );
        }
    }

    /**
     * Creates aggressive attack visual effect
     */
    createAttackEffect() {
        // Explosive attack particles
        const attackParticles = new BABYLON.ParticleSystem("attack", 300, this.scene);
        
        attackParticles.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null, () => attackParticles.particleTexture = null);
        
        attackParticles.emitter = this.mainBody.position.clone();
        attackParticles.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        attackParticles.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        
        attackParticles.color1 = new BABYLON.Color4(0.8, 0.2, 0.1, 1.0);
        attackParticles.color2 = new BABYLON.Color4(0.4, 0.1, 0.05, 0.0);
        
        attackParticles.minSize = 0.1;
        attackParticles.maxSize = 0.4;
        attackParticles.minLifeTime = 0.5;
        attackParticles.maxLifeTime = 1.5;
        
        attackParticles.emitRate = 200;
        
        // Explosive outward direction
        attackParticles.minEmitPower = 5;
        attackParticles.maxEmitPower = 15;
        attackParticles.updateSpeed = 0.01;
        
        attackParticles.targetStopDuration = 0.3;
        attackParticles.disposeOnStop = true;
        attackParticles.start();
    }

    /**
     * Handles predator destruction with dramatic effect
     */
    destroy() {
        if (this.isDead) return;
        this.isDead = true;
        
        this.createDeathThrows();
        
        // Remove from global systems
        const predatorIndex = PredatoryThornvine.allPredators.indexOf(this);
        if (predatorIndex !== -1) {
            PredatoryThornvine.allPredators.splice(predatorIndex, 1);
        }
        
        this.cleanup();
    }

    /**
     * Creates dramatic death effect
     */
    createDeathThrows() {
        // Violent death throes effect
        this.bodyMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.05, 0.05);
        this.bodyMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        
        // Create explosive particles
        const deathParticles = new BABYLON.ParticleSystem("deathThrows", 500, this.scene);
        deathParticles.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene, true, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            null, () => deathParticles.particleTexture = null);
        
        deathParticles.emitter = this.mainBody.position.clone();
        deathParticles.minEmitBox = new BABYLON.Vector3(-2, -2, -2);
        deathParticles.maxEmitBox = new BABYLON.Vector3(2, 2, 2);
        
        deathParticles.color1 = new BABYLON.Color4(0.8, 0.1, 0.1, 1.0);
        deathParticles.color2 = new BABYLON.Color4(0.2, 0.05, 0.05, 0.0);
        
        deathParticles.minSize = 0.2;
        deathParticles.maxSize = 0.8;
        deathParticles.minLifeTime = 1;
        deathParticles.maxLifeTime = 2.5;
        
        deathParticles.emitRate = 300;
        deathParticles.gravity = new BABYLON.Vector3(0, -10, 0);
        deathParticles.targetStopDuration = 1;
        deathParticles.disposeOnStop = true;
        deathParticles.start();
        
        console.log("PredatoryThornvine has been destroyed!", "PredatoryThornvine");
    }

    /**
     * Cleans up all predator resources
     */
    cleanup() {
        this.thorns.forEach(thorn => {
            if (thorn.mesh && !thorn.mesh.isDisposed()) {
                thorn.mesh.dispose();
            }
        });
        
        if (this.territoryMarkers) {
            this.territoryMarkers.forEach(marker => {
                if (marker && !marker.isDisposed()) {
                    marker.dispose();
                }
            });
        }
        
        if (this.toxicAura && !this.toxicAura.isDisposed()) {
            this.toxicAura.dispose();
        }
        
        if (this.mainBody && !this.mainBody.isDisposed()) {
            this.mainBody.dispose();
        }
        
        console.log("PredatoryThornvine cleaned up", "PredatoryThornvine");
    }
  }

  // Expose to global namespace
  window.SprawlingPlant = SprawlingPlant;
  window.PredatoryThornvine = PredatoryThornvine;
})();