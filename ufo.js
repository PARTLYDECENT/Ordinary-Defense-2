// Plan:
// 1. Define a UFO class (UFO) that extends BABYLON.Mesh or manages a BABYLON.Mesh.
//    - Constructor will take scene, initial position, and game instance.
//    - Load the 'ufo.glb' model.
//    - Implement basic movement (e.g., hovering, slow patrol).
//    - Implement 'antagonize' behavior (e.g., slowly approach player, emit light/sound).
//    - Implement 'explode' method: move to center, create fiery particles, dispose.
// 2. Define a function `spawnUFOs(scene, game, count)` to create multiple UFO instances.
// 3. Export the UFO class and spawn function.

// Implementation Steps (to be done incrementally):
// Step 1: Create the UFO class with basic model loading and hovering.
// Step 2: Implement spawning multiple UFOs in the sky.
// Step 3: Implement menacing movement/antagonizing behavior.
// Step 4: Implement the random chance explosion at the center of the map with particles.

class UFO {
    constructor(scene, game, initialPosition) {
        this.scene = scene;
        this.game = game;
        this.mesh = null;
        this.initialPosition = initialPosition;
        this.hoverTime = 0;
        this.speed = 0.1; // Movement speed
        this.target = null; // Player's camera or vehicle
        this.isVisible = false; // New: UFO is initially hidden
        this.lastVisibilityToggleTime = Date.now(); // New: Track last visibility change
        this.loadModel();
    }

    async loadModel() {
        try {
            const meshes = await this.game.loadModel("assets/models/", "enemy.glb");
            this.mesh = meshes[0];
            this.mesh.position = this.initialPosition;
            this.mesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Adjust scale as needed
            this.mesh.name = "ufo";
            this.mesh.isVisible = this.isVisible; // Set initial visibility
            console.log("🛸 UFO model loaded at:", this.mesh.position);

            // Set initial target to player camera
            this.target = this.game.camera;

            // Start hovering and antagonizing animation
            this.scene.onBeforeRenderObservable.add(() => {
                if (this.mesh && this.target && this.mesh.isVisible) { // Only update if visible
                    this.hoverTime += this.scene.getEngine().getDeltaTime() / 1000;
                    
                    // Hovering effect
                    this.mesh.position.y = this.initialPosition.y + Math.sin(this.hoverTime * 0.5) * 2;

                    // Menacing movement towards target
                    const direction = this.target.position.subtract(this.mesh.position).normalize();
                    this.mesh.position.addInPlace(direction.scale(this.speed));

                    // Look at target
                    this.mesh.lookAt(this.target.position);

                    // Subtle random movement (perlin noise or similar could be better)
                    this.mesh.position.x += (Math.random() - 0.5) * 0.05;
                    this.mesh.position.z += (Math.random() - 0.5) * 0.05;

                    // Random chance to fly to center and explode
                    if (Math.random() < 0.0005) { // Adjust probability as needed
                        this.explode();
                    }
                }
            });

        } catch (error) {
            console.error("❌ Failed to load UFO model:", error);
        }
    }

    show() {
        if (this.mesh) {
            this.mesh.isVisible = true;
            this.isVisible = true;
            this.lastVisibilityToggleTime = Date.now();
            console.log("🛸 UFO shown.");
        }
    }

    hide() {
        if (this.mesh) {
            this.mesh.isVisible = false;
            this.isVisible = false;
            this.lastVisibilityToggleTime = Date.now();
            console.log("🛸 UFO hidden.");
        }
    }

    explode() {
        console.log("💥 UFO exploding at center!");
        const center = new BABYLON.Vector3(0, 5, 0); // Center of the map, slightly above ground

        // Animate UFO moving to center
        const anim = new BABYLON.Animation("ufoExplodeAnim", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [];
        keys.push({ frame: 0, value: this.mesh.position.clone() });
        keys.push({ frame: 60, value: center }); // Fly to center over 2 seconds
        anim.setKeys(keys);
        this.mesh.animations.push(anim);

        this.scene.beginAnimation(this.mesh, 0, 60, false, 1, () => {
            // After reaching center, create explosion particles
            this.createExplosionParticles(this.mesh.position);
            this.dispose(); // Dispose UFO mesh
        });
    }

    createExplosionParticles(position) {
        const ps = new BABYLON.ParticleSystem("ufoExplosion", 2000, this.scene);
        ps.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        ps.emitter = position; // The point where the particles are emitted.
        ps.minEmitBox = new BABYLON.Vector3(-1, 0, -1); // Shape of the emitter
        ps.maxEmitBox = new BABYLON.Vector3(1, 0, 1); // Shape of the emitter

        // Colors of all particles
        ps.color1 = new BABYLON.Color4(1.0, 0.5, 0.0, 1.0);
        ps.color2 = new BABYLON.Color4(1.0, 0.0, 0.0, 1.0);
        ps.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

        // Size of each particle (random between...) 
        ps.minSize = 1.0;
        ps.maxSize = 5.0;

        // Life time of each particle (random between...) 
        ps.minLifeTime = 0.5;
        ps.maxLifeTime = 2.0;

        // Emission rate
        ps.emitRate = 1000;

        // Blend mode : BLENDMODE_ONEONE additive
        ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        // Set the gravity of all particles
        ps.gravity = new BABYLON.Vector3(0, -9.81, 0);

        // Direction of each particle after it has been emitted
        ps.direction1 = new BABYLON.Vector3(-7, 8, -7);
        ps.direction2 = new BABYLON.Vector3(7, 8, 7);

        // Power and speed
        ps.minEmitPower = 5;
        ps.maxEmitPower = 15;
        ps.updateSpeed = 0.05;

        // Start the particle system
        ps.targetStopDuration = 0.5; // Stop emitting after 0.5 seconds
        ps.disposeOnStop = true; // Dispose the particle system once it has finished
        ps.start();
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        console.log("UFO disposed.");
    }
}

function spawnUFOs(scene, game, count = 3) { // Changed count to 3
    const ufos = [];
    const spawnRangeX = 200; // Max X distance from center
    const spawnRangeZ = 200; // Max Z distance from center
    const spawnHeight = 50; // Height in the sky

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * spawnRangeX;
        const z = (Math.random() - 0.5) * spawnRangeZ;
        const initialPosition = new BABYLON.Vector3(x, spawnHeight + (Math.random() - 0.5) * 10, z);
        ufos.push(new UFO(scene, game, initialPosition));
    }
    console.log(`🛸 Spawned ${count} UFOs.`);
    return ufos;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UFO, spawnUFOs };
} else if (typeof window !== 'undefined') {
    window.UFO = UFO;
    window.spawnUFOs = spawnUFOs;
}