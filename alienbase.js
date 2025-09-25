class AlienBase {
    constructor(scene) {
        this.scene = scene;
        this.progress = 0;
        this.maxProgress = 100;
        this.mesh = null;

        this.createMesh();
    }

    createMesh() {
        // Create a placeholder mesh for the base
        this.mesh = BABYLON.MeshBuilder.CreateCylinder("alienBase", {height: 0.5, diameter: 10}, this.scene);
        this.mesh.position = new BABYLON.Vector3(0, 0.25, 0); // Example position

        const material = new BABYLON.StandardMaterial("alienBaseMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0, 0.5); // Purple
        this.mesh.material = material;
    }

    addProgress(amount) {
        this.progress += amount;
        if (this.progress >= this.maxProgress) {
            this.progress = this.maxProgress;
            this.onComplete();
        }

        // Update the visual representation of the base
        const scale = this.progress / this.maxProgress;
        this.mesh.scaling.y = scale;
        this.mesh.position.y = scale * 0.25;
    }

    onComplete() {
        console.log("Alien base construction complete!");
        // End the game
        alert("GAME OVER - The aliens have built their base!");
        location.reload();
    }
}
