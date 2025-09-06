class EnhancedWeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.rainParticles = null;
        this.light = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.7; // Adjust intensity as needed
    }

    startRain() {
        if (this.rainParticles) {
            this.rainParticles.start();
            return;
        }

        // Keep same particle count but expand area by 5x and lower the emitter so drops reach the ground quicker
        const baseArea = 50; // original half-extent
        const expandedArea = baseArea * 5; // 5x larger area
        const emitterHeight = 40; // lower than previous 100 so drops reach ground quicker

        this.rainParticles = new BABYLON.ParticleSystem("rain", 2000, this.scene);
        this.rainParticles.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.rainParticles.emitter = new BABYLON.Vector3(0, emitterHeight, 0);

        // Expand horizontal coverage without increasing particle count
        this.rainParticles.minEmitBox = new BABYLON.Vector3(-expandedArea, 0, -expandedArea);
        this.rainParticles.maxEmitBox = new BABYLON.Vector3(expandedArea, 0, expandedArea);

        // Color and appearance
        this.rainParticles.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.rainParticles.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.rainParticles.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);

        // Slightly smaller sizes to keep perceived density stable over larger area
        this.rainParticles.minSize = 0.08;
        this.rainParticles.maxSize = 0.18;

        // Increase lifetime so drops can travel from the lowered emitter to the ground
        this.rainParticles.minLifeTime = 1.0;
        this.rainParticles.maxLifeTime = 2.2;

        // Keep same emit rate (do not increase particle count) — will appear sparser over larger area as requested
        this.rainParticles.emitRate = 1500;
        this.rainParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Stronger gravity so particles fall faster and appear to hit the ground
        this.rainParticles.gravity = new BABYLON.Vector3(0, -40, 0);

        // Narrower directional spread vertically so drops fall mostly downwards
        this.rainParticles.direction1 = new BABYLON.Vector3(-2, -12, 2);
        this.rainParticles.direction2 = new BABYLON.Vector3(2, -12, -2);

        // Keep some angular speed for natural motion
        this.rainParticles.minAngularSpeed = 0;
        this.rainParticles.maxAngularSpeed = Math.PI;

        // Emit power controls initial velocity — tuned to match increased gravity/lifetime
        this.rainParticles.minEmitPower = 6;
        this.rainParticles.maxEmitPower = 10;

        // A slightly faster update to keep physics smooth
        this.rainParticles.updateSpeed = 0.01;

        // Make sure particles loop indefinitely
        this.rainParticles.targetStopDuration = 0;
        this.rainParticles.disposeOnStop = false;

        this.rainParticles.start();
    }

    stopRain() {
        if (this.rainParticles) {
            this.rainParticles.stop();
        }
    }

    dispose() {
        if (this.rainParticles) {
            this.rainParticles.dispose();
            this.rainParticles = null;
        }
        if (this.light) {
            this.light.dispose();
            this.light = null;
        }
    }
}