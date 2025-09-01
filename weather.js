class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeWeatherType = 'clear';
        this.intensity = 0.5;
        this.isTransitioning = false;
        
        // Weather systems
        this.rainSystem = null;
        this.fogSystem = null;
        this.bloodRainSystem = null;
        this.ashSystem = null;
        this.shadowSystem = null;
        
        // Lighting
        this.lightningLight = null;
        this.ambientDarkness = null;
        this.flickeringLights = [];
        
        // Audio and atmosphere
        this.windAudio = null;
        this.thunderAudio = null;
        this.whispersAudio = null;
        
        // Intervals and states
        this.weatherInterval = null;
        this.lightningInterval = null;
        this.flickerInterval = null;
        this.whisperInterval = null;
        this.shadowMovementInterval = null;
        
        // Creepy effects
        this.shadowEntities = [];
        this.ghostlyOrbs = [];
        this.cursedClouds = [];
        
        this.initWeatherSystems();
        this.initCreepyEffects();
        this.startRandomWeatherCycles();
    }

    initWeatherSystems() {
        this.initRain();
        this.initBloodRain();
        this.initFog();
        this.initAshfall();
        this.initLightning();
        this.initAmbientEffects();
    }

    initRain() {
        this.rainSystem = new BABYLON.ParticleSystem("rain", 6000, this.scene);
        this.rainSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        
        this.rainSystem.emitter = new BABYLON.Vector3(0, 120, 0);
        this.rainSystem.minEmitBox = new BABYLON.Vector3(-300, 0, -300);
        this.rainSystem.maxEmitBox = new BABYLON.Vector3(300, 0, 300);
        
        this.rainSystem.color1 = new BABYLON.Color4(0.4, 0.5, 0.7, 0.9);
        this.rainSystem.color2 = new BABYLON.Color4(0.1, 0.1, 0.3, 0.9);
        this.rainSystem.colorDead = new BABYLON.Color4(0, 0, 0.1, 0);
        
        this.rainSystem.minSize = 0.1;
        this.rainSystem.maxSize = 0.3;
        this.rainSystem.minLifeTime = 1.2;
        this.rainSystem.maxLifeTime = 2.5;
        this.rainSystem.emitRate = 7000;
        
        this.rainSystem.gravity = new BABYLON.Vector3(0, -35, 0);
        this.rainSystem.direction1 = new BABYLON.Vector3(-2, -1, 0);
        this.rainSystem.direction2 = new BABYLON.Vector3(2, -1, 0);
        
        this.rainSystem.minEmitPower = 25;
        this.rainSystem.maxEmitPower = 40;
        this.rainSystem.updateSpeed = 0.03;
    }

    initBloodRain() {
        this.bloodRainSystem = new BABYLON.ParticleSystem("bloodRain", 4000, this.scene);
        this.bloodRainSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        
        this.bloodRainSystem.emitter = new BABYLON.Vector3(0, 120, 0);
        this.bloodRainSystem.minEmitBox = new BABYLON.Vector3(-250, 0, -250);
        this.bloodRainSystem.maxEmitBox = new BABYLON.Vector3(250, 0, 250);
        
        this.bloodRainSystem.color1 = new BABYLON.Color4(0.8, 0.1, 0.1, 0.85);
        this.bloodRainSystem.color2 = new BABYLON.Color4(0.4, 0.0, 0.0, 0.85);
        this.bloodRainSystem.colorDead = new BABYLON.Color4(0.2, 0, 0, 0);
        
        this.bloodRainSystem.minSize = 0.2;
        this.bloodRainSystem.maxSize = 0.6;
        this.bloodRainSystem.minLifeTime = 2.0;
        this.bloodRainSystem.maxLifeTime = 3.5;
        this.bloodRainSystem.emitRate = 3500;
        
        this.bloodRainSystem.gravity = new BABYLON.Vector3(0, -28, 0);
        this.bloodRainSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
        this.bloodRainSystem.direction2 = new BABYLON.Vector3(1, -1, 1);
        
        this.bloodRainSystem.minEmitPower = 15;
        this.bloodRainSystem.maxEmitPower = 30;
    }

    initFog() {
        this.fogSystem = new BABYLON.ParticleSystem("creepyFog", 2000, this.scene);
        this.fogSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
        
        this.fogSystem.emitter = new BABYLON.Vector3(0, 2, 0);
        this.fogSystem.minEmitBox = new BABYLON.Vector3(-400, -5, -400);
        this.fogSystem.maxEmitBox = new BABYLON.Vector3(400, 5, 400);
        
        this.fogSystem.color1 = new BABYLON.Color4(0.3, 0.3, 0.35, 0.4);
        this.fogSystem.color2 = new BABYLON.Color4(0.15, 0.2, 0.15, 0.6);
        this.fogSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
        
        this.fogSystem.minSize = 15;
        this.fogSystem.maxSize = 35;
        this.fogSystem.minLifeTime = 8.0;
        this.fogSystem.maxLifeTime = 15.0;
        this.fogSystem.emitRate = 150;
        
        this.fogSystem.gravity = new BABYLON.Vector3(0, 1, 0);
        this.fogSystem.direction1 = new BABYLON.Vector3(-3, 0, -3);
        this.fogSystem.direction2 = new BABYLON.Vector3(3, 0, 3);
        
        this.fogSystem.minEmitPower = 0.5;
        this.fogSystem.maxEmitPower = 2;
        this.fogSystem.minAngularSpeed = -0.2;
        this.fogSystem.maxAngularSpeed = 0.2;
    }

    initAshfall() {
        this.ashSystem = new BABYLON.ParticleSystem("ash", 3000, this.scene);
        this.ashSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        
        this.ashSystem.emitter = new BABYLON.Vector3(0, 100, 0);
        this.ashSystem.minEmitBox = new BABYLON.Vector3(-350, 0, -350);
        this.ashSystem.maxEmitBox = new BABYLON.Vector3(350, 0, 350);
        
        this.ashSystem.color1 = new BABYLON.Color4(0.4, 0.4, 0.4, 0.7);
        this.ashSystem.color2 = new BABYLON.Color4(0.2, 0.2, 0.2, 0.8);
        this.ashSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
        
        this.ashSystem.minSize = 0.3;
        this.ashSystem.maxSize = 1.2;
        this.ashSystem.minLifeTime = 4.0;
        this.ashSystem.maxLifeTime = 8.0;
        this.ashSystem.emitRate = 800;
        
        this.ashSystem.gravity = new BABYLON.Vector3(0, -5, 0);
        this.ashSystem.direction1 = new BABYLON.Vector3(-5, -1, -5);
        this.ashSystem.direction2 = new BABYLON.Vector3(5, -1, 5);
        
        this.ashSystem.minEmitPower = 2;
        this.ashSystem.maxEmitPower = 8;
        this.ashSystem.minAngularSpeed = -1;
        this.ashSystem.maxAngularSpeed = 1;
    }

    initLightning() {
        this.lightningLight = new BABYLON.SpotLight("lightningLight", 
            new BABYLON.Vector3(0, 80, 0), 
            new BABYLON.Vector3(0, -1, 0), 
            Math.PI / 3, 2, this.scene);
        this.lightningLight.intensity = 0;
        this.lightningLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
        this.lightningLight.specular = new BABYLON.Color3(1, 1, 1);
        this.lightningLight.range = 200;
    }

    initAmbientEffects() {
        // Ambient darkness overlay
        this.ambientDarkness = new BABYLON.HemisphericLight("darkness", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.ambientDarkness.intensity = 0.8;
        this.ambientDarkness.diffuse = new BABYLON.Color3(0.6, 0.6, 0.7);
        this.ambientDarkness.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    }

    initCreepyEffects() {
        this.createGhostlyOrbs();
        this.createShadowEntities();
        this.startFlickeringEffects();
    }

    createGhostlyOrbs() {
        for (let i = 0; i < 5; i++) {
            const orb = new BABYLON.ParticleSystem(`ghostOrb${i}`, 50, this.scene);
            orb.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
            
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            orb.emitter = new BABYLON.Vector3(x, 20 + Math.random() * 30, z);
            
            orb.minEmitBox = new BABYLON.Vector3(-2, -2, -2);
            orb.maxEmitBox = new BABYLON.Vector3(2, 2, 2);
            
            orb.color1 = new BABYLON.Color4(0.8, 1.0, 0.8, 0.3);
            orb.color2 = new BABYLON.Color4(0.6, 0.9, 1.0, 0.2);
            orb.colorDead = new BABYLON.Color4(0, 0, 0, 0);
            
            orb.minSize = 2;
            orb.maxSize = 5;
            orb.minLifeTime = 2;
            orb.maxLifeTime = 4;
            orb.emitRate = 20;
            
            orb.direction1 = new BABYLON.Vector3(-1, -0.2, -1);
            orb.direction2 = new BABYLON.Vector3(1, 0.2, 1);
            orb.minEmitPower = 1;
            orb.maxEmitPower = 3;
            
            this.ghostlyOrbs.push(orb);
        }
    }

    createShadowEntities() {
        // Create moving shadow particle systems
        for (let i = 0; i < 3; i++) {
            const shadow = new BABYLON.ParticleSystem(`shadow${i}`, 200, this.scene);
            shadow.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
            
            shadow.emitter = new BABYLON.Vector3(0, 0, 0);
            shadow.minEmitBox = new BABYLON.Vector3(-5, 0, -5);
            shadow.maxEmitBox = new BABYLON.Vector3(5, 15, 5);
            
            shadow.color1 = new BABYLON.Color4(0.1, 0.1, 0.1, 0.6);
            shadow.color2 = new BABYLON.Color4(0.05, 0.05, 0.05, 0.8);
            shadow.colorDead = new BABYLON.Color4(0, 0, 0, 0);
            
            shadow.minSize = 3;
            shadow.maxSize = 8;
            shadow.minLifeTime = 3;
            shadow.maxLifeTime = 6;
            shadow.emitRate = 30;
            
            shadow.direction1 = new BABYLON.Vector3(-2, 0, -2);
            shadow.direction2 = new BABYLON.Vector3(2, 2, 2);
            shadow.minEmitPower = 1;
            shadow.maxEmitPower = 4;
            
            this.shadowEntities.push(shadow);
        }
    }

    startFlickeringEffects() {
        this.flickerInterval = setInterval(() => {
            if (this.activeWeatherType !== 'clear') {
                // Randomly flicker ambient lighting
                const originalIntensity = this.ambientDarkness.intensity;
                this.ambientDarkness.intensity = originalIntensity * (0.3 + Math.random() * 0.4);
                
                setTimeout(() => {
                    this.ambientDarkness.intensity = originalIntensity;
                }, 50 + Math.random() * 200);
            }
        }, 2000 + Math.random() * 5000);
    }

    // Weather control methods
    setWeather(weatherType, intensity = 0.5) {
        if (this.isTransitioning) return;
        
        this.stopAllWeather();
        this.activeWeatherType = weatherType;
        this.intensity = Math.max(0.1, Math.min(1.0, intensity));
        
        switch (weatherType) {
            case 'storm':
                this.startStorm();
                break;
            case 'bloodRain':
                this.startBloodRain();
                break;
            case 'fog':
                this.startFog();
                break;
            case 'ashfall':
                this.startAshfall();
                break;
            case 'nightmare':
                this.startNightmare();
                break;
            case 'clear':
            default:
                this.setClearWeather();
                break;
        }
        
        this.adjustAmbientLighting();
        console.log(`🌩️ Weather changed to: ${weatherType} (intensity: ${this.intensity})`);
    }

    startStorm() {
        this.rainSystem.emitRate = 7000 * this.intensity;
        this.rainSystem.start();
        this.startLightning(3000, 8000);
        this.startGhostlyOrbs();
        console.log("⛈️ Storm brewing...");
    }

    startBloodRain() {
        this.bloodRainSystem.emitRate = 3500 * this.intensity;
        this.bloodRainSystem.start();
        this.startShadowMovement();
        this.startCreepyLightning();
        console.log("🩸 The blood rain falls...");
    }

    startFog() {
        this.fogSystem.emitRate = 150 * this.intensity;
        this.fogSystem.start();
        this.startShadowMovement();
        this.startGhostlyOrbs();
        console.log("🌫️ Fog rolls in, obscuring reality...");
    }

    startAshfall() {
        this.ashSystem.emitRate = 800 * this.intensity;
        this.ashSystem.start();
        this.startCreepyLightning();
        console.log("🌋 Ash falls like the remnants of hope...");
    }

    startNightmare() {
        // Combination of multiple effects
        this.bloodRainSystem.emitRate = 2000;
        this.fogSystem.emitRate = 100;
        this.ashSystem.emitRate = 400;
        
        this.bloodRainSystem.start();
        this.fogSystem.start();
        this.ashSystem.start();
        
        this.startShadowMovement();
        this.startCreepyLightning();
        this.startGhostlyOrbs();
        this.startWhispers();
        
        console.log("👹 Nightmare mode activated... reality bends...");
    }

    setClearWeather() {
        this.ambientDarkness.intensity = 0.9;
        console.log("☀️ Clear skies... for now.");
    }

    // Creepy effect methods
    startShadowMovement() {
        this.shadowMovementInterval = setInterval(() => {
            this.shadowEntities.forEach((shadow, index) => {
                const angle = (Date.now() * 0.001 + index * 2) % (Math.PI * 2);
                const radius = 50 + Math.sin(Date.now() * 0.002 + index) * 30;
                
                shadow.emitter.x = Math.cos(angle) * radius;
                shadow.emitter.z = Math.sin(angle) * radius;
                shadow.emitter.y = 5 + Math.sin(Date.now() * 0.003 + index) * 10;
                
                if (!shadow.isStarted()) {
                    shadow.start();
                }
            });
        }, 100);
    }

    startGhostlyOrbs() {
        this.ghostlyOrbs.forEach((orb, index) => {
            if (!orb.isStarted()) {
                orb.start();
                
                // Animate orb movement
                setInterval(() => {
                    const time = Date.now() * 0.001;
                    orb.emitter.x += Math.sin(time + index) * 0.5;
                    orb.emitter.z += Math.cos(time + index) * 0.3;
                    orb.emitter.y = 20 + Math.sin(time * 2 + index) * 15;
                }, 50);
            }
        });
    }

    startCreepyLightning() {
        this.lightningInterval = setInterval(() => {
            this.flashCreepyLightning();
        }, 4000 + Math.random() * 8000);
    }

    flashCreepyLightning() {
        const x = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        this.lightningLight.position = new BABYLON.Vector3(x, 80, z);
        
        // Random creepy colors
        const colors = [
            new BABYLON.Color3(1, 0.2, 0.2), // Red
            new BABYLON.Color3(0.2, 1, 0.2), // Green
            new BABYLON.Color3(0.8, 0.2, 1), // Purple
            new BABYLON.Color3(1, 1, 0.2)    // Yellow
        ];
        
        this.lightningLight.diffuse = colors[Math.floor(Math.random() * colors.length)];
        this.lightningLight.intensity = 8 + Math.random() * 5;
        
        setTimeout(() => {
            this.lightningLight.intensity = 0;
        }, 80 + Math.random() * 120);
        
        console.log("⚡ Unnatural lightning tears through the darkness...");
    }

    startLightning(minDelay = 5000, maxDelay = 15000) {
        if (this.lightningInterval) {
            clearInterval(this.lightningInterval);
        }
        
        const triggerFlash = () => {
            this.flashNormalLightning();
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;
            this.lightningInterval = setTimeout(triggerFlash, delay);
        };
        
        triggerFlash();
    }

    flashNormalLightning() {
        const x = (Math.random() - 0.5) * 250;
        const z = (Math.random() - 0.5) * 250;
        this.lightningLight.position = new BABYLON.Vector3(x, 80, z);
        this.lightningLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
        this.lightningLight.intensity = 6;
        
        setTimeout(() => {
            this.lightningLight.intensity = 0;
        }, 120);
    }

    startWhispers() {
        this.whisperInterval = setInterval(() => {
            // Trigger subtle visual whisper effects
            this.ghostlyOrbs.forEach(orb => {
                const currentRate = orb.emitRate;
                orb.emitRate = currentRate * 2;
                setTimeout(() => {
                    orb.emitRate = currentRate;
                }, 1000);
            });
            
            console.log("👻 Whispers echo through the void...");
        }, 15000 + Math.random() * 20000);
    }

    adjustAmbientLighting() {
        const intensityMap = {
            'clear': 0.9,
            'storm': 0.4,
            'bloodRain': 0.2,
            'fog': 0.3,
            'ashfall': 0.35,
            'nightmare': 0.15
        };
        
        this.ambientDarkness.intensity = (intensityMap[this.activeWeatherType] || 0.8) * (0.5 + this.intensity * 0.5);
    }

    startRandomWeatherCycles() {
        const weatherTypes = ['storm', 'fog', 'ashfall', 'bloodRain', 'nightmare', 'clear'];
        
        this.weatherInterval = setInterval(() => {
            if (!this.isTransitioning) {
                const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
                const randomIntensity = 0.3 + Math.random() * 0.7;
                this.setWeather(randomWeather, randomIntensity);
            }
        }, 30000 + Math.random() * 60000); // 30-90 second cycles
    }

    stopAllWeather() {
        // Stop all particle systems
        [this.rainSystem, this.bloodRainSystem, this.fogSystem, this.ashSystem].forEach(system => {
            if (system && system.isStarted()) {
                system.stop();
            }
        });
        
        this.ghostlyOrbs.forEach(orb => {
            if (orb.isStarted()) {
                orb.stop();
            }
        });
        
        this.shadowEntities.forEach(shadow => {
            if (shadow.isStarted()) {
                shadow.stop();
            }
        });
        
        // Clear intervals
        [this.lightningInterval, this.shadowMovementInterval, this.whisperInterval].forEach(interval => {
            if (interval) {
                clearInterval(interval);
            }
        });
        
        this.lightningInterval = null;
        this.shadowMovementInterval = null;
        this.whisperInterval = null;
        this.lightningLight.intensity = 0;
    }

    // Public control methods
    increaseIntensity() {
        this.intensity = Math.min(1.0, this.intensity + 0.1);
        this.setWeather(this.activeWeatherType, this.intensity);
    }

    decreaseIntensity() {
        this.intensity = Math.max(0.1, this.intensity - 0.1);
        this.setWeather(this.activeWeatherType, this.intensity);
    }

    getWeatherState() {
        return {
            type: this.activeWeatherType,
            intensity: this.intensity,
            isActive: this.activeWeatherType !== 'clear'
        };
    }

    dispose() {
        this.stopAllWeather();
        
        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
        }
        
        if (this.flickerInterval) {
            clearInterval(this.flickerInterval);
        }
        
        // Dispose all particle systems and lights
        [this.rainSystem, this.bloodRainSystem, this.fogSystem, this.ashSystem, 
         ...this.ghostlyOrbs, ...this.shadowEntities].forEach(system => {
            if (system) {
                system.dispose();
            }
        });
        
        if (this.lightningLight) {
            this.lightningLight.dispose();
        }
        
        if (this.ambientDarkness) {
            this.ambientDarkness.dispose();
        }
        
        console.log("🌫️ Weather system disposed... silence returns.");
    }
}