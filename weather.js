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

        this.rainParticles = new BABYLON.ParticleSystem("rain", 2000, this.scene);
        this.rainParticles.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        this.rainParticles.emitter = new BABYLON.Vector3(0, 100, 0);
        this.rainParticles.minEmitBox = new BABYLON.Vector3(-50, 0, -50);
        this.rainParticles.maxEmitBox = new BABYLON.Vector3(50, 0, 50);
        this.rainParticles.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        this.rainParticles.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        this.rainParticles.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        this.rainParticles.minSize = 0.1;
        this.rainParticles.maxSize = 0.2;
        this.rainParticles.minLifeTime = 0.3;
        this.rainParticles.maxLifeTime = 1.5;
        this.rainParticles.emitRate = 1500;
        this.rainParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        this.rainParticles.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.rainParticles.direction1 = new BABYLON.Vector3(-7, -8, 3);
        this.rainParticles.direction2 = new BABYLON.Vector3(7, -8, -3);
        this.rainParticles.minAngularSpeed = 0;
        this.rainParticles.maxAngularSpeed = Math.PI;
        this.rainParticles.minEmitPower = 1;
        this.rainParticles.maxEmitPower = 3;
        this.rainParticles.updateSpeed = 0.005;
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