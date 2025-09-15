class EnhancedWeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.rainParticles = null;
        this.bloodDroplets = null;
        this.ambientDrip = null;
        this.organicChunks = null;
        this.mist = null;
        this.sparks = null;
        this.shadowEntities = null;
        this.pulseMembrane = null;
        
        this.flickerInterval = null;
        this.pulseInterval = null;
        this.ambientSoundTimer = null;
        this.entitySpawnTimer = null;
        
        // Multiple light sources for maximum unsettling effect
        this.mainLight = new BABYLON.HemisphericLight("MainLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.mainLight.intensity = 0.02;
        this.mainLight.diffuse = new BABYLON.Color3(0.7, 0.9, 0.3); // Sickly green-yellow
        
        this.redLight = new BABYLON.HemisphericLight("BloodLight", new BABYLON.Vector3(0, -1, 0), this.scene);
        this.redLight.intensity = 0.015;
        this.redLight.diffuse = new BABYLON.Color3(0.8, 0.1, 0.1); // Deep red undertone
        
        this.strobeLight = new BABYLON.DirectionalLight("StrobeLight", new BABYLON.Vector3(0, -1, 0), this.scene);
        this.strobeLight.intensity = 0;
        this.strobeLight.diffuse = new BABYLON.Color3(1, 1, 1);
        
        this.startLightSystem();
        this.startAmbientHorror();
    }

    startLightSystem() {
        let flickerPhase = 0;
        this.flickerInterval = setInterval(() => {
            flickerPhase += 0.1;
            
            // Main fluorescent flicker
            if (Math.random() < 0.25) {
                this.mainLight.intensity = Math.random() * 0.06 + 0.005;
                setTimeout(() => {
                    this.mainLight.intensity = 0.02 + Math.sin(flickerPhase) * 0.01;
                }, Math.random() * 200 + 30);
            }
            
            // Occasional harsh strobe
            if (Math.random() < 0.03) {
                this.strobeLight.intensity = 0.3;
                setTimeout(() => { this.strobeLight.intensity = 0; }, 80);
                setTimeout(() => {
                    if (Math.random() < 0.5) {
                        this.strobeLight.intensity = 0.2;
                        setTimeout(() => { this.strobeLight.intensity = 0; }, 40);
                    }
                }, 120);
            }
            
            // Red light pulse with the "heartbeat" of the place
            this.redLight.intensity = 0.015 + Math.sin(flickerPhase * 2) * 0.008;
            
        }, 150);
    }

    startAmbientHorror() {
        // Simulate distant sounds through light variations
        this.ambientSoundTimer = setInterval(() => {
            if (Math.random() < 0.08) {
                // "Distant scream" - brief light dim
                let originalIntensity = this.mainLight.intensity;
                this.mainLight.intensity *= 0.3;
                setTimeout(() => {
                    this.mainLight.intensity = originalIntensity;
                }, 800 + Math.random() * 1200);
            }
        }, 3000);
    }

    startRain() {
        if (this.rainParticles) {
            this.startAllSystems();
            return;
        }

        const baseArea = 60;
        const expandedArea = baseArea * 12; // Massive coverage
        const emitterHeight = 80;
        const highEmitter = emitterHeight + 60;

        // 1. MAIN GELATINOUS BLOOD RAIN
        this.rainParticles = new BABYLON.ParticleSystem("bloodRain", 4500, this.scene);
        this.rainParticles.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.rainParticles.emitter = new BABYLON.Vector3(0, emitterHeight, 0);

        this.rainParticles.minEmitBox = new BABYLON.Vector3(-expandedArea, 0, -expandedArea);
        this.rainParticles.maxEmitBox = new BABYLON.Vector3(expandedArea, 0, expandedArea);

        this.rainParticles.color1 = new BABYLON.Color4(0.9, 0.03, 0.03, 0.95);
        this.rainParticles.color2 = new BABYLON.Color4(0.4, 0.01, 0.01, 0.98);
        this.rainParticles.colorDead = new BABYLON.Color4(0.2, 0.005, 0.005, 0.4);

        this.rainParticles.minSize = 0.18;
        this.rainParticles.maxSize = 0.45;
        this.rainParticles.minLifeTime = 3.0;
        this.rainParticles.maxLifeTime = 5.5;
        this.rainParticles.emitRate = 3200;
        this.rainParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.rainParticles.gravity = new BABYLON.Vector3(0, -12, 0);
        this.rainParticles.direction1 = new BABYLON.Vector3(-4, -10, 4);
        this.rainParticles.direction2 = new BABYLON.Vector3(4, -10, -4);
        this.rainParticles.minAngularSpeed = -Math.PI * 0.8;
        this.rainParticles.maxAngularSpeed = Math.PI * 0.8;
        this.rainParticles.minEmitPower = 2;
        this.rainParticles.maxEmitPower = 5;
        this.rainParticles.updateSpeed = 0.007;
        this.rainParticles.targetStopDuration = 0;
        this.rainParticles.disposeOnStop = false;

        // 2. HEAVY ORGANIC CHUNKS
        this.bloodDroplets = new BABYLON.ParticleSystem("organicMatter", 1200, this.scene);
        this.bloodDroplets.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.bloodDroplets.emitter = new BABYLON.Vector3(0, highEmitter, 0);

        this.bloodDroplets.minEmitBox = new BABYLON.Vector3(-expandedArea * 0.8, 0, -expandedArea * 0.8);
        this.bloodDroplets.maxEmitBox = new BABYLON.Vector3(expandedArea * 0.8, 0, expandedArea * 0.8);

        this.bloodDroplets.color1 = new BABYLON.Color4(0.25, 0.008, 0.008, 1.0);
        this.bloodDroplets.color2 = new BABYLON.Color4(0.12, 0.003, 0.003, 1.0);
        this.bloodDroplets.colorDead = new BABYLON.Color4(0.06, 0, 0, 0.9);

        this.bloodDroplets.minSize = 0.3;
        this.bloodDroplets.maxSize = 0.8;
        this.bloodDroplets.minLifeTime = 4.0;
        this.bloodDroplets.maxLifeTime = 7.0;
        this.bloodDroplets.emitRate = 600;
        this.bloodDroplets.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.bloodDroplets.gravity = new BABYLON.Vector3(0, -30, 0);
        this.bloodDroplets.direction1 = new BABYLON.Vector3(-1.5, -18, 1.5);
        this.bloodDroplets.direction2 = new BABYLON.Vector3(1.5, -18, -1.5);
        this.bloodDroplets.minAngularSpeed = -Math.PI * 0.3;
        this.bloodDroplets.maxAngularSpeed = Math.PI * 0.3;
        this.bloodDroplets.minEmitPower = 0.5;
        this.bloodDroplets.maxEmitPower = 2;
        this.bloodDroplets.updateSpeed = 0.005;
        this.bloodDroplets.targetStopDuration = 0;
        this.bloodDroplets.disposeOnStop = false;

        // 3. CEILING MEMBRANE DRIPS
        this.ambientDrip = new BABYLON.ParticleSystem("membraneDrips", 400, this.scene);
        this.ambientDrip.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.ambientDrip.emitter = new BABYLON.Vector3(0, highEmitter + 20, 0);

        this.ambientDrip.minEmitBox = new BABYLON.Vector3(-expandedArea * 1.5, 0, -expandedArea * 1.5);
        this.ambientDrip.maxEmitBox = new BABYLON.Vector3(expandedArea * 1.5, 0, expandedArea * 1.5);

        this.ambientDrip.color1 = new BABYLON.Color4(0.08, 0.02, 0.02, 0.85);
        this.ambientDrip.color2 = new BABYLON.Color4(0.04, 0.01, 0.01, 0.95);
        this.ambientDrip.colorDead = new BABYLON.Color4(0.02, 0, 0, 0.5);

        this.ambientDrip.minSize = 0.12;
        this.ambientDrip.maxSize = 0.5;
        this.ambientDrip.minLifeTime = 5.0;
        this.ambientDrip.maxLifeTime = 8.5;
        this.ambientDrip.emitRate = 150;
        this.ambientDrip.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.ambientDrip.gravity = new BABYLON.Vector3(0, -22, 0);
        this.ambientDrip.direction1 = new BABYLON.Vector3(0, -25, 0);
        this.ambientDrip.direction2 = new BABYLON.Vector3(0, -25, 0);
        this.ambientDrip.minAngularSpeed = 0;
        this.ambientDrip.maxAngularSpeed = 0;
        this.ambientDrip.minEmitPower = 0.3;
        this.ambientDrip.maxEmitPower = 1;
        this.ambientDrip.updateSpeed = 0.004;
        this.ambientDrip.targetStopDuration = 0;
        this.ambientDrip.disposeOnStop = false;

        // 4. FLESHY ORGANIC CHUNKS (NEW)
        this.organicChunks = new BABYLON.ParticleSystem("fleshChunks", 800, this.scene);
        this.organicChunks.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.organicChunks.emitter = new BABYLON.Vector3(0, highEmitter + 40, 0);

        this.organicChunks.minEmitBox = new BABYLON.Vector3(-expandedArea * 0.6, 0, -expandedArea * 0.6);
        this.organicChunks.maxEmitBox = new BABYLON.Vector3(expandedArea * 0.6, 0, expandedArea * 0.6);

        // Sickly flesh tones mixed with blood
        this.organicChunks.color1 = new BABYLON.Color4(0.4, 0.15, 0.08, 1.0);
        this.organicChunks.color2 = new BABYLON.Color4(0.6, 0.05, 0.02, 1.0);
        this.organicChunks.colorDead = new BABYLON.Color4(0.2, 0.03, 0.01, 0.7);

        this.organicChunks.minSize = 0.4;
        this.organicChunks.maxSize = 1.2; // Massive chunks
        this.organicChunks.minLifeTime = 3.5;
        this.organicChunks.maxLifeTime = 6.0;
        this.organicChunks.emitRate = 120; // Infrequent but horrifying
        this.organicChunks.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.organicChunks.gravity = new BABYLON.Vector3(0, -35, 0);
        this.organicChunks.direction1 = new BABYLON.Vector3(-2, -20, 2);
        this.organicChunks.direction2 = new BABYLON.Vector3(2, -20, -2);
        this.organicChunks.minAngularSpeed = -Math.PI;
        this.organicChunks.maxAngularSpeed = Math.PI;
        this.organicChunks.minEmitPower = 1;
        this.organicChunks.maxEmitPower = 4;
        this.organicChunks.updateSpeed = 0.004;
        this.organicChunks.targetStopDuration = 0;
        this.organicChunks.disposeOnStop = false;

        // 5. BLOOD MIST/FOG (NEW)
        this.mist = new BABYLON.ParticleSystem("bloodMist", 2000, this.scene);
        this.mist.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.mist.emitter = new BABYLON.Vector3(0, 10, 0); // Ground level

        this.mist.minEmitBox = new BABYLON.Vector3(-expandedArea * 2, 0, -expandedArea * 2);
        this.mist.maxEmitBox = new BABYLON.Vector3(expandedArea * 2, 0, expandedArea * 2);

        this.mist.color1 = new BABYLON.Color4(0.3, 0.02, 0.02, 0.15);
        this.mist.color2 = new BABYLON.Color4(0.2, 0.01, 0.01, 0.08);
        this.mist.colorDead = new BABYLON.Color4(0.1, 0.005, 0.005, 0.02);

        this.mist.minSize = 2.0;
        this.mist.maxSize = 8.0; // Large misty particles
        this.mist.minLifeTime = 8.0;
        this.mist.maxLifeTime = 15.0;
        this.mist.emitRate = 200;
        this.mist.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.mist.gravity = new BABYLON.Vector3(0, 2, 0); // Rises slowly
        this.mist.direction1 = new BABYLON.Vector3(-1, 1, -1);
        this.mist.direction2 = new BABYLON.Vector3(1, 3, 1);
        this.mist.minAngularSpeed = -Math.PI * 0.1;
        this.mist.maxAngularSpeed = Math.PI * 0.1;
        this.mist.minEmitPower = 0.5;
        this.mist.maxEmitPower = 2;
        this.mist.updateSpeed = 0.003;
        this.mist.targetStopDuration = 0;
        this.mist.disposeOnStop = false;

        // 6. ELECTRICAL SPARKS (NEW)
        this.sparks = new BABYLON.ParticleSystem("electricSparks", 600, this.scene);
        this.sparks.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.sparks.emitter = new BABYLON.Vector3(0, emitterHeight + 30, 0);

        this.sparks.minEmitBox = new BABYLON.Vector3(-expandedArea * 0.3, 0, -expandedArea * 0.3);
        this.sparks.maxEmitBox = new BABYLON.Vector3(expandedArea * 0.3, 0, expandedArea * 0.3);

        this.sparks.color1 = new BABYLON.Color4(1.0, 1.0, 0.8, 1.0);
        this.sparks.color2 = new BABYLON.Color4(0.8, 0.9, 1.0, 1.0);
        this.sparks.colorDead = new BABYLON.Color4(0.3, 0.3, 0.5, 0.0);

        this.sparks.minSize = 0.05;
        this.sparks.maxSize = 0.15;
        this.sparks.minLifeTime = 0.3;
        this.sparks.maxLifeTime = 1.2;
        this.sparks.emitRate = 80; // Occasional sparks
        this.sparks.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        this.sparks.gravity = new BABYLON.Vector3(0, -50, 0);
        this.sparks.direction1 = new BABYLON.Vector3(-8, -10, -8);
        this.sparks.direction2 = new BABYLON.Vector3(8, -5, 8);
        this.sparks.minAngularSpeed = -Math.PI * 3;
        this.sparks.maxAngularSpeed = Math.PI * 3;
        this.sparks.minEmitPower = 8;
        this.sparks.maxEmitPower = 15;
        this.sparks.updateSpeed = 0.02;
        this.sparks.targetStopDuration = 0;
        this.sparks.disposeOnStop = false;

        // 7. SHADOW ENTITIES (NEW)
        this.shadowEntities = new BABYLON.ParticleSystem("shadowFigures", 300, this.scene);
        this.shadowEntities.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.shadowEntities.emitter = new BABYLON.Vector3(0, 20, 0);

        this.shadowEntities.minEmitBox = new BABYLON.Vector3(-expandedArea * 3, 0, -expandedArea * 3);
        this.shadowEntities.maxEmitBox = new BABYLON.Vector3(expandedArea * 3, 0, expandedArea * 3);

        this.shadowEntities.color1 = new BABYLON.Color4(0.0, 0.0, 0.0, 0.4);
        this.shadowEntities.color2 = new BABYLON.Color4(0.02, 0.0, 0.02, 0.6);
        this.shadowEntities.colorDead = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0);

        this.shadowEntities.minSize = 1.5;
        this.shadowEntities.maxSize = 4.0; // Large shadow figures
        this.shadowEntities.minLifeTime = 12.0;
        this.shadowEntities.maxLifeTime = 25.0;
        this.shadowEntities.emitRate = 8; // Very rare appearances
        this.shadowEntities.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.shadowEntities.gravity = new BABYLON.Vector3(0, 0, 0); // Float
        this.shadowEntities.direction1 = new BABYLON.Vector3(-0.5, 0, -0.5);
        this.shadowEntities.direction2 = new BABYLON.Vector3(0.5, 0, 0.5);
        this.shadowEntities.minAngularSpeed = -Math.PI * 0.05;
        this.shadowEntities.maxAngularSpeed = Math.PI * 0.05;
        this.shadowEntities.minEmitPower = 0.2;
        this.shadowEntities.maxEmitPower = 1.0;
        this.shadowEntities.updateSpeed = 0.001;
        this.shadowEntities.targetStopDuration = 0;
        this.shadowEntities.disposeOnStop = false;

        // 8. PULSING MEMBRANE EFFECT (NEW)
        this.pulseMembrane = new BABYLON.ParticleSystem("pulseMembrane", 1500, this.scene);
        this.pulseMembrane.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.pulseMembrane.emitter = new BABYLON.Vector3(0, highEmitter + 50, 0);

        this.pulseMembrane.minEmitBox = new BABYLON.Vector3(-expandedArea * 4, -5, -expandedArea * 4);
        this.pulseMembrane.maxEmitBox = new BABYLON.Vector3(expandedArea * 4, 5, expandedArea * 4);

        this.pulseMembrane.color1 = new BABYLON.Color4(0.15, 0.08, 0.12, 0.1);
        this.pulseMembrane.color2 = new BABYLON.Color4(0.08, 0.04, 0.06, 0.05);
        this.pulseMembrane.colorDead = new BABYLON.Color4(0.02, 0.01, 0.02, 0.01);

        this.pulseMembrane.minSize = 5.0;
        this.pulseMembrane.maxSize = 15.0;
        this.pulseMembrane.minLifeTime = 20.0;
        this.pulseMembrane.maxLifeTime = 40.0;
        this.pulseMembrane.emitRate = 30;
        this.pulseMembrane.blendMode = BABYLON.ParticleSystem.BLENDMODE_ALPHABLEND;
        this.pulseMembrane.gravity = new BABYLON.Vector3(0, -1, 0);
        this.pulseMembrane.direction1 = new BABYLON.Vector3(-0.2, -0.5, -0.2);
        this.pulseMembrane.direction2 = new BABYLON.Vector3(0.2, -0.5, 0.2);
        this.pulseMembrane.minAngularSpeed = -Math.PI * 0.02;
        this.pulseMembrane.maxAngularSpeed = Math.PI * 0.02;
        this.pulseMembrane.minEmitPower = 0.1;
        this.pulseMembrane.maxEmitPower = 0.5;
        this.pulseMembrane.updateSpeed = 0.002;
        this.pulseMembrane.targetStopDuration = 0;
        this.pulseMembrane.disposeOnStop = false;

        this.startAllSystems();
        this.startEntityEvents();
    }

    startAllSystems() {
        if (this.rainParticles) this.rainParticles.start();
        if (this.bloodDroplets) this.bloodDroplets.start();
        if (this.ambientDrip) this.ambientDrip.start();
        if (this.organicChunks) this.organicChunks.start();
        if (this.mist) this.mist.start();
        if (this.sparks) this.sparks.start();
        if (this.shadowEntities) this.shadowEntities.start();
        if (this.pulseMembrane) this.pulseMembrane.start();
    }

    startEntityEvents() {
        // Periodic "entity movement" events
        this.entitySpawnTimer = setInterval(() => {
            if (Math.random() < 0.15) {
                // Temporary burst of shadow entities
                if (this.shadowEntities) {
                    let originalRate = this.shadowEntities.emitRate;
                    this.shadowEntities.emitRate = 25;
                    setTimeout(() => {
                        this.shadowEntities.emitRate = originalRate;
                    }, 2000);
                }
                
                // Increase organic chunk fall during "events"
                if (this.organicChunks) {
                    let originalRate = this.organicChunks.emitRate;
                    this.organicChunks.emitRate = 400;
                    setTimeout(() => {
                        this.organicChunks.emitRate = originalRate;
                    }, 3000);
                }
            }
        }, 8000);
    }

    stopRain() {
        if (this.rainParticles) this.rainParticles.stop();
        if (this.bloodDroplets) this.bloodDroplets.stop();
        if (this.ambientDrip) this.ambientDrip.stop();
        if (this.organicChunks) this.organicChunks.stop();
        if (this.mist) this.mist.stop();
        if (this.sparks) this.sparks.stop();
        if (this.shadowEntities) this.shadowEntities.stop();
        if (this.pulseMembrane) this.pulseMembrane.stop();
    }

    dispose() {
        // Clear all timers
        if (this.flickerInterval) {
            clearInterval(this.flickerInterval);
            this.flickerInterval = null;
        }
        if (this.ambientSoundTimer) {
            clearInterval(this.ambientSoundTimer);
            this.ambientSoundTimer = null;
        }
        if (this.entitySpawnTimer) {
            clearInterval(this.entitySpawnTimer);
            this.entitySpawnTimer = null;
        }
        
        // Dispose all particle systems
        const systems = [
            'rainParticles', 'bloodDroplets', 'ambientDrip', 
            'organicChunks', 'mist', 'sparks', 
            'shadowEntities', 'pulseMembrane'
        ];
        
        systems.forEach(system => {
            if (this[system]) {
                this[system].dispose();
                this[system] = null;
            }
        });
        
        // Dispose lights
        if (this.mainLight) {
            this.mainLight.dispose();
            this.mainLight = null;
        }
        if (this.redLight) {
            this.redLight.dispose();
            this.redLight = null;
        }
        if (this.strobeLight) {
            this.strobeLight.dispose();
            this.strobeLight = null;
        }
    }
}