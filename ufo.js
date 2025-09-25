// Enhanced UFO System with Advanced AI Behaviors
// Drop-in replacement for ufo.js with realistic piloted behaviors

class UFO {
    constructor(scene, game, initialPosition) {
        this.scene = scene;
        this.game = game;
        this.mesh = null;
        this.initialPosition = initialPosition;
        this.position = initialPosition.clone();
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.acceleration = new BABYLON.Vector3(0, 0, 0);
        
        // AI State Machine
        this.state = 'patrol'; // patrol, investigate, stalk, retreat, attack, explode
        this.stateTimer = 0;
        this.nextStateChange = Math.random() * 10 + 5; // 5-15 seconds
        
        // Movement properties
        this.maxSpeed = 1.0 + Math.random() * 0.5; // Increased max speed
        this.turnSpeed = 0.05 + Math.random() * 0.02; // Faster turning
        this.hoverAmplitude = 1.5 + Math.random() * 2.5; // More pronounced hover
        this.hoverFrequency = 0.4 + Math.random() * 0.6; // Faster hover
        this.hoverTime = Math.random() * Math.PI * 2;
        
        // Patrol pattern
        this.patrolType = Math.floor(Math.random() * 4); // 0: circle, 1: figure8, 2: random, 3: perimeter
        this.patrolRadius = 30 + Math.random() * 70;
        this.patrolCenter = initialPosition.clone();
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolWaypoints = [];
        this.currentWaypoint = 0;
        
        // Investigation behavior
        this.investigationTarget = null;
        this.lastPlayerPosition = null;
        this.playerDetectionRange = 80 + Math.random() * 40;
        this.curiosityLevel = Math.random(); // How likely to investigate
        
        // Combat behavior
        this.aggressionLevel = Math.random() * 0.3; // Low aggression initially
        this.retreatThreshold = 20; // Distance to retreat when too close
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        
        // Visual properties
        this.isVisible = false;
        this.lastVisibilityToggleTime = Date.now();
        this.lightBeam = null;
        this.engineGlow = null;
        
        // Audio (if available)
        this.engineSound = null;
        this.beamSound = null;
        
        this.initializePatrolPattern();
        this.loadModel();
    }

    initializePatrolPattern() {
        switch(this.patrolType) {
            case 0: // Circle patrol
                // No waypoints needed, uses mathematical circle
                break;
            case 1: // Figure-8 patrol
                // Uses mathematical figure-8
                break;
            case 2: // Random waypoints
                this.generateRandomWaypoints(5);
                break;
            case 3: // Perimeter patrol
                this.generatePerimeterWaypoints();
                break;
        }
    }

    generateRandomWaypoints(count) {
        this.patrolWaypoints = [];
        for(let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const distance = this.patrolRadius * (0.5 + Math.random() * 0.5);
            const x = this.patrolCenter.x + Math.cos(angle) * distance;
            const z = this.patrolCenter.z + Math.sin(angle) * distance;
            const y = this.initialPosition.y + (Math.random() - 0.5) * 10;
            this.patrolWaypoints.push(new BABYLON.Vector3(x, y, z));
        }
    }

    generatePerimeterWaypoints() {
        this.patrolWaypoints = [];
        const corners = [
            new BABYLON.Vector3(-150, this.initialPosition.y, -150),
            new BABYLON.Vector3(150, this.initialPosition.y, -150),
            new BABYLON.Vector3(150, this.initialPosition.y, 150),
            new BABYLON.Vector3(-150, this.initialPosition.y, 150)
        ];
        
        // Add some random points along the perimeter
        for(let i = 0; i < corners.length; i++) {
            this.patrolWaypoints.push(corners[i]);
            // Add a random point between this corner and the next
            const next = corners[(i + 1) % corners.length];
            const mid = corners[i].add(next).scale(0.5);
            mid.x += (Math.random() - 0.5) * 50;
            mid.z += (Math.random() - 0.5) * 50;
            mid.y += (Math.random() - 0.5) * 20;
            this.patrolWaypoints.push(mid);
        }
    }

    async loadModel() {
        try {
            const meshes = await this.game.loadModel("assets/models/", "enemy.glb");
            this.mesh = meshes[0];
            this.mesh.position = this.initialPosition.clone();
            this.mesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            this.mesh.name = "ufo";
            this.mesh.isVisible = this.isVisible;
            
            // Add engine glow effect
            this.createEngineGlow();
            
            console.log("🛸 Enhanced UFO loaded at:", this.mesh.position);

            // Start AI update loop
            this.scene.onBeforeRenderObservable.add(() => {
                if (this.mesh && this.mesh.isVisible) {
                    this.updateAI();
                    this.updateMovement();
                    this.updateEffects();
                }
            });

        } catch (error) {
            console.error("❌ Failed to load UFO model:", error);
        }
    }

    createEngineGlow() {
        // Create a glowing effect under the UFO
        const glowMaterial = new BABYLON.StandardMaterial("ufoGlow", this.scene);
        glowMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.6, 1.0);
        glowMaterial.alpha = 0.3;
        
        const glow = BABYLON.MeshBuilder.CreateSphere("engineGlow", {diameter: 2}, this.scene);
        glow.material = glowMaterial;
        glow.parent = this.mesh;
        glow.position.y = -1;
        this.engineGlow = glow;
    }

    updateAI() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        this.stateTimer += deltaTime;
        
        // Check for player nearby
        const playerDistance = this.getDistanceToPlayer();
        const canSeePlayer = playerDistance < this.playerDetectionRange;
        
        // State machine
        switch(this.state) {
            case 'patrol':
                this.updatePatrolBehavior(deltaTime);
                
                if (canSeePlayer && Math.random() < this.curiosityLevel) {
                    this.setState('investigate');
                } else if (this.stateTimer > this.nextStateChange) {
                    // Randomly change patrol pattern
                    if (Math.random() < 0.3) {
                        this.patrolType = Math.floor(Math.random() * 4);
                        this.initializePatrolPattern();
                    }
                    this.resetStateTimer();
                }
                break;
                
            case 'investigate':
                this.updateInvestigateBehavior(deltaTime);
                
                if (!canSeePlayer && this.stateTimer > 5) {
                    this.setState('patrol');
                } else if (playerDistance < 30 && Math.random() < this.aggressionLevel) {
                    this.setState('stalk');
                } else if (this.stateTimer > 15) {
                    this.setState('patrol');
                }
                break;
                
            case 'stalk':
                this.updateStalkBehavior(deltaTime);
                
                if (playerDistance > this.playerDetectionRange) {
                    this.setState('patrol');
                } else if (playerDistance < this.retreatThreshold) {
                    this.setState('retreat');
                } else if (this.stateTimer > 20 && Math.random() < 0.1) {
                    this.setState('attack');
                }
                break;
                
            case 'retreat':
                this.updateRetreatBehavior(deltaTime);
                
                if (playerDistance > 50) {
                    this.setState('patrol');
                }
                break;
                
            case 'attack':
                this.updateAttackBehavior(deltaTime);
                
                if (this.stateTimer > 3) {
                    if (Math.random() < 0.1) {
                        this.setState('explode');
                    } else {
                        this.setState('retreat');
                    }
                }
                break;
        }
        
        // Random chance to explode (much lower now)
        if (Math.random() < 0.0001) {
            this.setState('explode');
        }
    }

    setState(newState) {
        console.log(`🛸 UFO changing state: ${this.state} -> ${newState}`);
        this.state = newState;
        this.resetStateTimer();
        
        // State-specific initialization
        switch(newState) {
            case 'investigate':
                if (this.game.camera) {
                    this.investigationTarget = this.game.camera.position.clone();
                }
                break;
            case 'attack':
                this.createLightBeam();
                break;
            case 'explode':
                this.explode();
                break;
        }
    }

    resetStateTimer() {
        this.stateTimer = 0;
        this.nextStateChange = Math.random() * 15 + 5;
    }

    updatePatrolBehavior(deltaTime) {
        let targetPosition;
        
        switch(this.patrolType) {
            case 0: // Circle patrol
                this.patrolAngle += 0.5 * deltaTime;
                targetPosition = new BABYLON.Vector3(
                    this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius,
                    this.patrolCenter.y,
                    this.patrolCenter.z + Math.sin(this.patrolAngle) * this.patrolRadius
                );
                break;
                
            case 1: // Figure-8 patrol
                this.patrolAngle += 0.3 * deltaTime;
                const scale = Math.sin(this.patrolAngle);
                targetPosition = new BABYLON.Vector3(
                    this.patrolCenter.x + Math.cos(this.patrolAngle) * this.patrolRadius * scale,
                    this.patrolCenter.y,
                    this.patrolCenter.z + Math.sin(this.patrolAngle * 2) * this.patrolRadius * 0.5
                );
                break;
                
            case 2: // Random waypoints
            case 3: // Perimeter patrol
                if (this.patrolWaypoints.length > 0) {
                    targetPosition = this.patrolWaypoints[this.currentWaypoint];
                    const distance = BABYLON.Vector3.Distance(this.position, targetPosition);
                    if (distance < 5) {
                        this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolWaypoints.length;
                    }
                }
                break;
        }
        
        if (targetPosition) {
            this.moveToward(targetPosition, this.maxSpeed * 0.5);
        }
    }

    updateInvestigateBehavior(deltaTime) {
        if (this.game.camera && this.investigationTarget) {
            const playerPos = this.game.camera.position;
            
            // Update investigation target to follow player loosely
            if (Math.random() < 0.1) {
                this.investigationTarget = playerPos.clone();
                // Add some offset so it doesn't go directly to player
                this.investigationTarget.x += (Math.random() - 0.5) * 20;
                this.investigationTarget.z += (Math.random() - 0.5) * 20;
            }
            
            this.moveToward(this.investigationTarget, this.maxSpeed * 0.7);
            
            // Look at player occasionally
            if (Math.random() < 0.05) {
                this.lookAt(playerPos);
            }
        }
    }

    updateStalkBehavior(deltaTime) {
        if (this.game.camera) {
            const playerPos = this.game.camera.position;
            
            // Maintain distance while following
            const direction = playerPos.subtract(this.position).normalize();
            const idealDistance = 40 + Math.sin(this.stateTimer) * 10;
            const targetPos = playerPos.subtract(direction.scale(idealDistance));
            targetPos.y = this.position.y + Math.sin(this.stateTimer * 2) * 5; // Bobbing motion
            
            this.moveToward(targetPos, this.maxSpeed);
            this.lookAt(playerPos);
        }
    }

    updateRetreatBehavior(deltaTime) {
        if (this.game.camera) {
            const playerPos = this.game.camera.position;
            const direction = this.position.subtract(playerPos).normalize();
            const retreatTarget = this.position.add(direction.scale(20));
            
            this.moveToward(retreatTarget, this.maxSpeed * 1.2);
        }
    }

    updateAttackBehavior(deltaTime) {
        if (this.game.camera) {
            const playerPos = this.game.camera.position;
            
            // Aggressive approach
            this.moveToward(playerPos, this.maxSpeed * 1.5);
            this.lookAt(playerPos);
            
            // Erratic movement during attack
            this.acceleration.x += (Math.random() - 0.5) * 0.5;
            this.acceleration.z += (Math.random() - 0.5) * 0.5;
        }
    }

    moveToward(targetPosition, speed) {
        const direction = targetPosition.subtract(this.position);
        const distance = direction.length();
        const normalizedDir = direction.normalize();

        // Dynamic acceleration based on distance
        let accelerationScale;
        if (distance > 50) {
            accelerationScale = speed * 0.4; // High acceleration when far
        } else if (distance > 20) {
            accelerationScale = speed * 0.3; // Medium acceleration at medium range
        } else {
            accelerationScale = speed * 0.2; // Lower acceleration when close
        }

        // Add a small random component for more organic movement
        const randomOffset = new BABYLON.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
        );

        this.acceleration = normalizedDir.scale(accelerationScale).add(randomOffset);
    }

    lookAt(targetPosition) {
        if (this.mesh) {
            this.mesh.lookAt(targetPosition, Math.PI, Math.PI, 0, BABYLON.Space.WORLD);
        }
    }

    updateMovement() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        
        // Enhanced physics with momentum
        this.velocity.addInPlace(this.acceleration.scale(deltaTime * 4)); // Increased acceleration influence
        
        // Adaptive drag based on speed
        const currentSpeed = this.velocity.length();
        const dragFactor = Math.min(0.98, 0.95 + (currentSpeed / this.maxSpeed) * 0.03);
        this.velocity.scaleInPlace(dragFactor);
        
        // Smooth speed limiting with cushioning
        if (currentSpeed > this.maxSpeed) {
            const scaleFactor = BABYLON.Scalar.Lerp(
                1,
                this.maxSpeed / currentSpeed,
                deltaTime * 10
            );
            this.velocity.scaleInPlace(scaleFactor);
        }
        
        // Update position with enhanced momentum
        const movement = this.velocity.scale(deltaTime * 1.2); // Slightly increased movement speed
        this.position.addInPlace(movement);
        
        // Complex hovering effect combining multiple frequencies
        this.hoverTime += deltaTime;
        const primaryHover = Math.sin(this.hoverTime * this.hoverFrequency) * this.hoverAmplitude;
        const secondaryHover = Math.sin(this.hoverTime * this.hoverFrequency * 2.5) * (this.hoverAmplitude * 0.3);
        const hoverOffset = primaryHover + secondaryHover;
        
        // Apply to mesh with adaptive smoothing
        if (this.mesh) {
            // Faster smoothing when moving quickly, slower when moving slowly
            const speedFactor = Math.min(1, currentSpeed / (this.maxSpeed * 0.5));
            const baseSmoothingFactor = 0.15;
            const adaptiveSmoothing = baseSmoothingFactor + (speedFactor * 0.2);
            
            // Position interpolation with predicted position
            const predictedPosition = this.position.add(this.velocity.scale(deltaTime * 0.5));
            this.mesh.position = BABYLON.Vector3.Lerp(
                this.mesh.position,
                new BABYLON.Vector3(
                    predictedPosition.x,
                    predictedPosition.y + hoverOffset,
                    predictedPosition.z
                ),
                adaptiveSmoothing
            );
            
            // Enhanced tilt based on movement and acceleration
            if (currentSpeed > 0.01) {
                const tiltAmount = Math.min(Math.PI / 6, currentSpeed / this.maxSpeed * Math.PI / 4);
                const movementDir = this.velocity.normalize();
                const accelerationDir = this.acceleration.normalize();
                
                // Combine velocity and acceleration influence for tilting
                this.mesh.rotation.x = BABYLON.Scalar.Lerp(
                    this.mesh.rotation.x,
                    (-movementDir.y * 0.7 - accelerationDir.y * 0.3) * tiltAmount,
                    adaptiveSmoothing
                );
                this.mesh.rotation.z = BABYLON.Scalar.Lerp(
                    this.mesh.rotation.z,
                    (-movementDir.x * 0.7 - accelerationDir.x * 0.3) * tiltAmount,
                    adaptiveSmoothing
                );
                
                // Add slight banking effect during turns
                const turnRate = BABYLON.Vector3.Cross(movementDir, accelerationDir).y;
                this.mesh.rotation.y = BABYLON.Scalar.Lerp(
                    this.mesh.rotation.y,
                    turnRate * Math.PI / 4,
                    adaptiveSmoothing * 0.5
                );
            }
        }
        
        // Reset acceleration for next frame
        this.acceleration.setAll(0);
    }

    updateEffects() {
        // Update engine glow intensity based on speed
        if (this.engineGlow) {
            const intensity = 0.3 + (this.velocity.length() / this.maxSpeed) * 0.4;
            this.engineGlow.material.alpha = intensity;
        }
        
        // Update light beam if active
        if (this.lightBeam && this.state === 'attack') {
            this.updateLightBeam();
        }
    }

    createLightBeam() {
        if (this.lightBeam) return;
        
        // Create a tractor beam effect
        const beamMaterial = new BABYLON.StandardMaterial("beamMat", this.scene);
        beamMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.5);
        beamMaterial.alpha = 0.6;
        
        const beam = BABYLON.MeshBuilder.CreateCylinder("beam", {
            height: 50,
            diameterTop: 2,
            diameterBottom: 15,
            tessellation: 8
        }, this.scene);
        
        beam.material = beamMaterial;
        beam.position.y = -25;
        beam.parent = this.mesh;
        this.lightBeam = beam;
        
        console.log("🔦 UFO activated tractor beam!");
    }

    updateLightBeam() {
        if (this.lightBeam) {
            // Pulsating effect
            const pulse = Math.sin(this.stateTimer * 10) * 0.2 + 0.8;
            this.lightBeam.material.alpha = 0.4 * pulse;
        }
    }

    getDistanceToPlayer() {
        if (!this.game.camera) return Infinity;
        return BABYLON.Vector3.Distance(this.position, this.game.camera.position);
    }

    show() {
        if (this.mesh) {
            this.mesh.isVisible = true;
            this.isVisible = true;
            this.lastVisibilityToggleTime = Date.now();
            console.log("🛸 UFO materialized.");
        }
    }

    hide() {
        if (this.mesh) {
            this.mesh.isVisible = false;
            this.isVisible = false;
            this.lastVisibilityToggleTime = Date.now();
            console.log("🛸 UFO cloaked.");
        }
    }

    explode() {
        if (this.state !== 'explode') {
            console.log("💥 UFO initiating kamikaze attack!");
            this.setState('explode');
            return;
        }
        
        const center = new BABYLON.Vector3(0, 10, 0);
        
        // Dramatic approach to center
        const anim = new BABYLON.Animation("ufoKamikaze", "position", 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [];
        keys.push({ frame: 0, value: this.mesh.position.clone() });
        keys.push({ frame: 90, value: center });
        anim.setKeys(keys);
        
        // Add spinning effect
        const spinAnim = new BABYLON.Animation("ufoSpin", "rotation.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const spinKeys = [];
        spinKeys.push({ frame: 0, value: 0 });
        spinKeys.push({ frame: 90, value: Math.PI * 6 });
        spinAnim.setKeys(spinKeys);
        
        this.mesh.animations.push(anim, spinAnim);
        
        this.scene.beginAnimation(this.mesh, 0, 90, false, 2, () => {
            this.createExplosionParticles(this.mesh.position);
            this.dispose();
        });
    }

    createExplosionParticles(position) {
        // Create multiple particle systems for a better explosion
        this.createFireParticles(position);
        this.createSmokeParticles(position);
        this.createSparkParticles(position);
    }

    createFireParticles(position) {
        const ps = new BABYLON.ParticleSystem("ufoFire", 1000, this.scene);
        ps.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        ps.emitter = position;
        ps.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        ps.maxEmitBox = new BABYLON.Vector3(1, 0, 1);

        ps.color1 = new BABYLON.Color4(1.0, 0.8, 0.0, 1.0);
        ps.color2 = new BABYLON.Color4(1.0, 0.2, 0.0, 1.0);
        ps.colorDead = new BABYLON.Color4(0.2, 0.0, 0.0, 0.0);

        ps.minSize = 2.0;
        ps.maxSize = 8.0;
        ps.minLifeTime = 1.0;
        ps.maxLifeTime = 3.0;
        ps.emitRate = 500;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        ps.gravity = new BABYLON.Vector3(0, -9.81, 0);
        ps.direction1 = new BABYLON.Vector3(-10, 15, -10);
        ps.direction2 = new BABYLON.Vector3(10, 15, 10);
        ps.minEmitPower = 8;
        ps.maxEmitPower = 20;
        ps.updateSpeed = 0.02;

        ps.targetStopDuration = 1.0;
        ps.disposeOnStop = true;
        ps.start();
    }

    createSmokeParticles(position) {
        const ps = new BABYLON.ParticleSystem("ufoSmoke", 500, this.scene);
        ps.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        ps.emitter = position;
        ps.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
        ps.maxEmitBox = new BABYLON.Vector3(2, 0, 2);

        ps.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.8);
        ps.color2 = new BABYLON.Color4(0.1, 0.1, 0.1, 0.6);
        ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        ps.minSize = 5.0;
        ps.maxSize = 15.0;
        ps.minLifeTime = 3.0;
        ps.maxLifeTime = 8.0;
        ps.emitRate = 100;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        ps.gravity = new BABYLON.Vector3(0, -2, 0);
        ps.direction1 = new BABYLON.Vector3(-5, 5, -5);
        ps.direction2 = new BABYLON.Vector3(5, 10, 5);
        ps.minEmitPower = 2;
        ps.maxEmitPower = 8;
        ps.updateSpeed = 0.05;

        ps.targetStopDuration = 2.0;
        ps.disposeOnStop = true;
        ps.start();
    }

    createSparkParticles(position) {
        const ps = new BABYLON.ParticleSystem("ufoSparks", 200, this.scene);
        ps.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        ps.emitter = position;
        ps.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5);
        ps.maxEmitBox = new BABYLON.Vector3(0.5, 0, 0.5);

        ps.color1 = new BABYLON.Color4(1.0, 1.0, 0.5, 1.0);
        ps.color2 = new BABYLON.Color4(1.0, 0.5, 0.0, 1.0);
        ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);

        ps.minSize = 0.5;
        ps.maxSize = 2.0;
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 1.5;
        ps.emitRate = 400;
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        ps.gravity = new BABYLON.Vector3(0, -20, 0);
        ps.direction1 = new BABYLON.Vector3(-15, 20, -15);
        ps.direction2 = new BABYLON.Vector3(15, 25, 15);
        ps.minEmitPower = 15;
        ps.maxEmitPower = 30;
        ps.updateSpeed = 0.01;

        ps.targetStopDuration = 0.3;
        ps.disposeOnStop = true;
        ps.start();
    }

    dispose() {
        if (this.lightBeam) {
            this.lightBeam.dispose();
        }
        if (this.engineGlow) {
            this.engineGlow.dispose();
        }
        if (this.mesh) {
            this.mesh.dispose();
        }
        console.log("🛸 UFO completely destroyed.");
    }
}

function spawnUFOs(scene, game, count = 3) {
    const ufos = [];
    const spawnRangeX = 200;
    const spawnRangeZ = 200;
    const spawnHeight = 50;

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * spawnRangeX;
        const z = (Math.random() - 0.5) * spawnRangeZ;
        const y = spawnHeight + (Math.random() - 0.5) * 20;
        const initialPosition = new BABYLON.Vector3(x, y, z);
        ufos.push(new UFO(scene, game, initialPosition));
    }
    
    console.log(`🛸 Squadron of ${count} intelligent UFOs deployed.`);
    return ufos;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UFO, spawnUFOs };
} else if (typeof window !== 'undefined') {
    window.UFO = UFO;
    window.spawnUFOs = spawnUFOs;
}