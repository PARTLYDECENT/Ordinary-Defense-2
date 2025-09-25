/**
 * Enhanced Autonomous Weather System for Babylon.js
 * Manages clear, rain, snow, and storm effects with smooth transitions and an automatic cycle.
 * The system is self-contained and runs autonomously after initialization.
 */
class EnhancedWeatherSystem {
    /**
     * @param {BABYLON.Scene} scene The Babylon.js scene.
     */
    constructor(scene) {
        this.scene = scene;
        this.activeWeather = 'clear';
        this.intensity = 1.0;
        this._weatherCycleTimer = null; // Timer for the autonomous cycle

        // Particle systems and lighting
        this._rainParticles = null;
        this._snowParticles = null;
        this._lightningLight = null;
        this._lightningTimer = null;

        // Main ambient light for the scene
        this.ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), this.scene);

        // Initialize all weather assets
        this._createRainSystem();
        this._createSnowSystem();
        this._createLightning();
        
        // Start the autonomous weather cycle
        this._startWeatherCycle();
        console.log("🌦️ Enhanced Autonomous Weather System is now running.");
    }

    // =================================================================================================
    // INITIALIZATION METHODS
    // =================================================================================================

    _createRainSystem() {
        this._rainParticles = new BABYLON.ParticleSystem("rain", 4000, this.scene);
        this._rainParticles.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        this._rainParticles.emitter = new BABYLON.Vector3(0, 80, 0);
        this._rainParticles.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        this._rainParticles.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        this._rainParticles.color1 = new BABYLON.Color4(1.0, 0.2, 0.2, 1.0); // Bright red
        this._rainParticles.color2 = new BABYLON.Color4(0.8, 0.0, 0.0, 1.0); // Deep red
        this._rainParticles.colorDead = new BABYLON.Color4(0.2, 0, 0, 0.0); // Dark red fade
        this._rainParticles.minSize = 0.1;
        this._rainParticles.maxSize = 0.3;
        this._rainParticles.minLifeTime = 0.5;
        this._rainParticles.maxLifeTime = 1.5;
        this._rainParticles.gravity = new BABYLON.Vector3(0, -25, 0);
        this._rainParticles.direction1 = new BABYLON.Vector3(-7, -8, 3);
        this._rainParticles.direction2 = new BABYLON.Vector3(7, -8, -3);
        this._rainParticles.minEmitPower = 1;
        this._rainParticles.maxEmitPower = 3;
        this._rainParticles.updateSpeed = 0.005;
        this._rainParticles.emitRate = 0;
        this._rainParticles.start();
    }

    _createSnowSystem() {
        this._snowParticles = new BABYLON.ParticleSystem("snow", 3000, this.scene);
        this._snowParticles.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);
        this._snowParticles.emitter = new BABYLON.Vector3(0, 80, 0);
        this._snowParticles.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        this._snowParticles.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        this._snowParticles.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
        this._snowParticles.color2 = new BABYLON.Color4(0.9, 0.9, 0.9, 1.0);
        this._snowParticles.colorDead = new BABYLON.Color4(1.0, 1.0, 1.0, 0.0);
        this._snowParticles.minSize = 0.2;
        this._snowParticles.maxSize = 0.5;
        this._snowParticles.minLifeTime = 4;
        this._snowParticles.maxLifeTime = 8;
        this._snowParticles.gravity = new BABYLON.Vector3(0, -2, 0);
        this._snowParticles.direction1 = new BABYLON.Vector3(-1, -4, -1);
        this._snowParticles.direction2 = new BABYLON.Vector3(1, -4, 1);
        this._snowParticles.minAngularSpeed = -1;
        this._snowParticles.maxAngularSpeed = 1;
        this._snowParticles.minEmitPower = 0.5;
        this._snowParticles.maxEmitPower = 1.5;
        this._snowParticles.updateSpeed = 0.004;
        this._snowParticles.emitRate = 0;
        this._snowParticles.start();
    }

    _createLightning() {
        this._lightningLight = new BABYLON.PointLight("lightning", new BABYLON.Vector3(0, 100, 0), this.scene);
        this._lightningLight.diffuse = new BABYLON.Color3(1, 1, 1);
        this._lightningLight.intensity = 0;
    }

    // =================================================================================================
    // AUTONOMOUS CYCLE
    // =================================================================================================
    
    _startWeatherCycle() {
        const cycle = () => {
            const weatherTypes = ['clear', 'rain', 'snow', 'storm'];
            let newWeather;

            // Pick a new weather type that is different from the current one
            do {
                newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
            } while (newWeather === this.activeWeather);

            const newIntensity = (Math.random() * 0.5 + 0.3) * 0.8; // Reduced intensity range from 0.24 to 0.64

            this.setWeather(newWeather, newIntensity);

            // Schedule the next weather change with a longer random delay (between 3 and 9 minutes)
            const nextChangeDelay = (180000 + Math.random() * 360000); // 3-9 minutes
            this._weatherCycleTimer = setTimeout(cycle, nextChangeDelay);
        };

        // Start the first cycle after a longer initial delay
        this._weatherCycleTimer = setTimeout(cycle, 45000); // Wait 45 seconds before first change
    }

    // =================================================================================================
    // PUBLIC CONTROL METHODS (Can still be used to override the cycle)
    // =================================================================================================

    setWeather(weatherType, intensity = 1.0) {
        if (this.activeWeather === weatherType) return;

        this.intensity = Math.max(0.1, Math.min(1.0, intensity));
        this._stopStorm();
        this._transitionWeather(this.activeWeather, weatherType);
        this.activeWeather = weatherType;
    }

    dispose() {
        clearTimeout(this._weatherCycleTimer);
        this._stopStorm();

        if (this._rainParticles) this._rainParticles.dispose();
        if (this._snowParticles) this._snowParticles.dispose();
        if (this._lightningLight) this._lightningLight.dispose();
        if (this.ambientLight) this.ambientLight.dispose();
        console.log("Weather system disposed.");
    }

    // =================================================================================================
    // PRIVATE LOGIC
    // =================================================================================================

    _transitionWeather(from, to) {
        console.log(`Autonomous transition from ${from} to ${to} with intensity ${this.intensity.toFixed(2)}`);

        const transitionTime = 5000; // 5 seconds for a slower, more natural transition
        const totalFrames = (transitionTime / 1000) * 30;

        const maxRainRate = 4000;
        const maxSnowRate = 1500;
        let targetRainRate = 0;
        let targetSnowRate = 0;
        let targetLight = {
            intensity: 1.0,
            diffuse: new BABYLON.Color3(1, 1, 1),
            ground: new BABYLON.Color3(0.7, 0.7, 0.7)
        };

        switch (to) {
            case 'rain':
                targetRainRate = maxRainRate * this.intensity;
                targetLight = { intensity: 0.6, diffuse: new BABYLON.Color3.FromHexString("#AABBDD"), ground: new BABYLON.Color3.FromHexString("#556677") };
                break;
            case 'storm':
                targetRainRate = maxRainRate * this.intensity;
                targetLight = { intensity: 0.3, diffuse: new BABYLON.Color3.FromHexString("#8899AA"), ground: new BABYLON.Color3.FromHexString("#334455") };
                this._startStorm();
                break;
            case 'snow':
                targetSnowRate = maxSnowRate * this.intensity;
                targetLight = { intensity: 0.8, diffuse: new BABYLON.Color3.FromHexString("#DDDDFF"), ground: new BABYLON.Color3.FromHexString("#BBDDFF") };
                break;
        }

        this._animateValue(this._rainParticles, "emitRate", targetRainRate, totalFrames);
        this._animateValue(this._snowParticles, "emitRate", targetSnowRate, totalFrames);
        this._animateValue(this.ambientLight, "intensity", targetLight.intensity, totalFrames);
        this._animateColor(this.ambientLight, "diffuse", targetLight.diffuse, totalFrames);
        this._animateColor(this.ambientLight, "groundColor", targetLight.ground, totalFrames);
    }

    _startStorm() {
        const flash = () => {
            this._lightningLight.position = new BABYLON.Vector3((Math.random() - 0.5) * 200, 80 + Math.random() * 40, (Math.random() - 0.5) * 200);
            this._lightningLight.intensity = 15;
            setTimeout(() => { this._lightningLight.intensity = 0; }, 50 + Math.random() * 100);
            const nextFlashDelay = 4000 + Math.random() * 8000;
            this._lightningTimer = setTimeout(flash, nextFlashDelay);
        };
        this._lightningTimer = setTimeout(flash, 1000 + Math.random() * 3000);
    }

    _stopStorm() {
        if (this._lightningTimer) clearTimeout(this._lightningTimer);
        this._lightningTimer = null;
        this._lightningLight.intensity = 0;
    }

    _animateValue(object, property, targetValue, totalFrames) {
        BABYLON.Animation.CreateAndStartAnimation(`${property}Anim`, object, property, 30, totalFrames, object[property], targetValue, 0);
    }

    _animateColor(object, property, targetColor, totalFrames) {
        BABYLON.Animation.CreateAndStartAnimation(`${property}Anim`, object, property, 30, totalFrames, object[property], targetColor, 0);
    }
}


// =================================================================================================
// HOW TO USE
// =================================================================================================
/*
// In your main game file, after you create your scene:

// 1. Create an instance of the system. That's it. It now runs by itself.
const weatherSystem = new EnhancedWeatherSystem(scene);

// 2. (Optional) If you need to force a specific weather for a cutscene or event,
// you can still call setWeather(). The autonomous cycle will eventually take over again.
//
//    exampleButton.onClick = function() {
//        console.log("Forcing a storm for this event!");
//        weatherSystem.setWeather('storm', 1.0);
//    };

// 3. When you are done with your scene (e.g., loading a new level),
//    make sure to dispose of the system to clean up all resources.
//
//    window.onbeforeunload = function() {
//        weatherSystem.dispose();
//    };
*/