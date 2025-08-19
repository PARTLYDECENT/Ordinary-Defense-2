// colony.js

class Colony {
    constructor(scene, position, game) {
        this.scene = scene;
        this.mesh = null;
        this.position = position;
        this.game = game;
        this.loadModel();
    }

    async loadModel() {
        const meshes = await this.game.loadModel("assets/models/", "colony1.glb");
        this.mesh = meshes[0];
        this.mesh.position = this.position.clone();
        this.mesh.position.y = 0.1; // Adjust Y position as needed
        this.mesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Adjust scaling as needed
        console.log("Colony model loaded:", this.mesh.name);
        return this.mesh;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}