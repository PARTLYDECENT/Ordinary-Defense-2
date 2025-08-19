class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.rainParticleSystem = null;
        this.lightningLight = null;
        this.isRaining = false;
        this.lightningInterval = null;

        this.initRain();
        this.initLightning();
    }

    initRain() {
        // Create a particle system for rain
        this.rainParticleSystem = new BABYLON.ParticleSystem("rain", 5000, this.scene); // Increased capacity
        this.rainParticleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", this.scene);

        // Emitter at the top of the scene
        this.rainParticleSystem.emitter = new BABYLON.Vector3(0, 100, 0); // Y-position high above the scene
        this.rainParticleSystem.minEmitBox = new BABYLON.Vector3(-200, 0, -200); // Area of rain
        this.rainParticleSystem.maxEmitBox = new BABYLON.Vector3(200, 0, 200);

        // Colors of all particles
        this.rainParticleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 0.8); // Slightly transparent
        this.rainParticleSystem.color2 = new BABYLON.Color4(0.2, 0.2, 0.5, 0.8); // Slightly transparent
        this.rainParticleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...) 
        this.rainParticleSystem.minSize = 0.2;
        this.rainParticleSystem.maxSize = 0.5;

        // Life time of each particle (random between...) 
        this.rainParticleSystem.minLifeTime = 1.0;
        this.rainParticleSystem.maxLifeTime = 2.0;

        // Emission rate
        this.rainParticleSystem.emitRate = 8000; // Increased for denser rain

        // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
        this.rainParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD; // Changed to standard for better blending

        // Set the gravity of all particles
        this.rainParticleSystem.gravity = new BABYLON.Vector3(0, -30, 0); // Increased gravity for faster fall

        // Direction of each particle (random between...) 
        this.rainParticleSystem.direction1 = new BABYLON.Vector3(0, -1, 0); // Straight down
        this.rainParticleSystem.direction2 = new BABYLON.Vector3(0, -1, 0); // Straight down

        // Angular speed, in radians
        this.rainParticleSystem.minAngularSpeed = 0;
        this.rainParticleSystem.maxAngularSpeed = 0;

        // Speed
        this.rainParticleSystem.minEmitPower = 20; // Increased speed
        this.rainParticleSystem.maxEmitPower = 35; // Increased speed
        this.rainParticleSystem.updateSpeed = 0.05; // Increased update speed
    }

    initLightning() {
        this.lightningLight = new BABYLON.PointLight("lightningLight", new BABYLON.Vector3(0, 0, 0), this.scene);
        this.lightningLight.intensity = 0; // Start off
        this.lightningLight.diffuse = new BABYLON.Color3(1, 1, 1);
        this.lightningLight.specular = new BABYLON.Color3(1, 1, 1);
    }

    startRain() {
        if (!this.isRaining) {
            this.rainParticleSystem.start();
            this.isRaining = true;
            console.log("🌧️ Rain started.");
        }
    }

    stopRain() {
        if (this.isRaining) {
            this.rainParticleSystem.stop();
            this.isRaining = false;
            console.log("☀️ Rain stopped.");
        }
    }

    flashLightning() {
        // Random position for the lightning flash
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        this.lightningLight.position = new BABYLON.Vector3(x, 50, z); // High up

        this.lightningLight.intensity = 5; // Bright flash
        setTimeout(() => {
            this.lightningLight.intensity = 0; // Turn off quickly
        }, 100); // Flash duration
        console.log("⚡ Lightning flashed!");
    }

    startLightning(minDelay = 5000, maxDelay = 15000) {
        if (this.lightningInterval) {
            clearInterval(this.lightningInterval);
        }
        const triggerFlash = () => {
            this.flashLightning();
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;
            this.lightningInterval = setTimeout(triggerFlash, delay);
        };
        triggerFlash(); // Initial flash
        console.log("⚡ Lightning simulation started.");
    }

    stopLightning() {
        if (this.lightningInterval) {
            clearInterval(this.lightningInterval);
            this.lightningInterval = null;
            this.lightningLight.intensity = 0;
            console.log("⚡ Lightning simulation stopped.");
        }
    }

    // Optional: Toggle weather for demonstration
    toggleWeather() {
        if (this.isRaining) {
            this.stopRain();
            this.stopLightning();
        } else {
            this.startRain();
            this.startLightning();
        }
    }
}
