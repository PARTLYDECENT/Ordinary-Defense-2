// Visual-only directional flashlight for Babylon.js
// Creates a semi-transparent cone attached to the camera that does NOT affect scene lighting.
class Flashlight {
    constructor(scene, camera, opts = {}) {
        this.scene = scene;
        this.camera = camera;
        this.enabled = opts.enabled !== undefined ? opts.enabled : true;
        this.color = opts.color || new BABYLON.Color3(1, 1, 0.9);
        // Visual mode: 'opaque' (solid cone) or 'transparent' (alpha blended cone)
        this.opaque = opts.opaque !== undefined ? opts.opaque : true;
        this.alpha = opts.alpha !== undefined ? opts.alpha : 0.65;
        this.angle = opts.angle || (Math.PI / 12); // cone half-angle
        this.distance = opts.distance || 50;
        this.renderingGroup = opts.renderGroup || 2;
        this.invertZ = !!opts.invert; // if forward is -Z, invert to correct orientation

        this._createMesh();
        this._attach();
    }

    _createMesh() {
        // Create a unit cone (cylinder with top diameter 0, bottom diameter 2, height 1)
        const params = { diameterTop: 0, diameterBottom: 2, height: 1, tessellation: 32 };
        this.cone = BABYLON.MeshBuilder.CreateCylinder("visualFlashlight_cone", params, this.scene);

        // Material: emissive and unlit so it doesn't react to scene lights
        const mat = new BABYLON.StandardMaterial("visualFlashlight_mat", this.scene);
        // If opaque, allow the cone to be lit by scene lights; otherwise use an emissive translucent cone
        if (this.opaque) {
            mat.disableLighting = false;
            mat.diffuseColor = this.color.scale(0.6);
            mat.emissiveColor = this.color.scale(0.15);
            mat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
            mat.alpha = 1.0;
        } else {
            mat.disableLighting = true; // unlit glow cone
            mat.backFaceCulling = false; // show inside of cone as well
            mat.emissiveColor = this.color;
            mat.alpha = this.alpha;
        }
        mat.zOffset = -1;
        this.cone.material = mat;

        this.cone.isPickable = false;
        this.cone.receiveShadows = false;
        this.cone.renderingGroupId = this.renderingGroup; // render after default geometry

        // Start invisible until enabled
        this.cone.isVisible = !!this.enabled;

        this._applyAngleAndDistance();
    }

    _applyAngleAndDistance() {
        // We created a unit cone with bottom diameter 2 and height 1 along Y axis.
        // We'll scale so that height == distance and bottom radius == tan(angle) * distance
        const bottomRadius = Math.tan(this.angle) * this.distance; // radius
        const scaleX = bottomRadius; // x radius
        const scaleZ = bottomRadius; // z radius
        const scaleY = this.distance; // height

        this.cone.scaling = new BABYLON.Vector3(scaleX, scaleY, scaleZ);
    }

    _attach() {
        if (!this.camera) return;
        // Rotate cone so its local Y axis aligns with camera +Z (forward).
        // Cylinder default axis is Y; rotate -90deg around X to point along +Z, then parent to camera.
        this.cone.rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0);

        // Position cone in front of camera at half the distance (because cone's pivot is at center)
        // When parented, setting position in local camera space places it correctly.
        this.cone.parent = this.camera;
        this.cone.position = new BABYLON.Vector3(0, 0, this.distance * 0.5);

        // If the forward axis in this project is -Z, allow inversion
        if (this.invertZ) {
            this.cone.position.z *= -1;
            this.cone.rotation.x *= -1;
        }

        // Keep cone following camera orientation and update on every frame if params change
        this._beforeRenderObservable = this.scene.onBeforeRenderObservable.add(() => {
            // Ensure visibility matches enabled flag
            if (this.cone) this.cone.isVisible = !!this.enabled;

            // In case user changed angle or distance dynamically, keep mesh updated
            this._applyAngleAndDistance();
            // Recompute position (in case distance changed)
            const z = this.invertZ ? -this.distance * 0.5 : this.distance * 0.5;
            this.cone.position.copyFromFloats(0, 0, z);
        });
    }

    set enabled(v) {
        this._enabled = !!v;
        if (this.cone) this.cone.isVisible = !!this._enabled;
    }
    get enabled() { return !!this._enabled; }

    setAngle(radians) { this.angle = radians; this._applyAngleAndDistance(); }
    setDistance(m) { this.distance = m; this._applyAngleAndDistance(); }
    setAlpha(a) { if (this.cone && this.cone.material) this.cone.material.alpha = a; this.alpha = a; }
    setColor(color3) { if (this.cone && this.cone.material) this.cone.material.emissiveColor = color3; this.color = color3; }

    dispose() {
        if (this.scene && this._beforeRenderObservable) this.scene.onBeforeRenderObservable.remove(this._beforeRenderObservable);
        if (this.cone) { try { this.cone.dispose(); } catch (e) {} }
    }
}

// Expose globally for simple script usage
if (typeof window !== 'undefined') window.Flashlight = Flashlight;
