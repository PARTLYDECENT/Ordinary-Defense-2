async function createPlayer(scene, game) {
    const meshes = await game.loadModel("assets/models/", "player.glb");
    const playerMesh = meshes[0];
    return playerMesh;
}