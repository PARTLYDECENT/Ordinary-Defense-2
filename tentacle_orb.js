// --- NEW: Custom Shader Code for Tentacles ---
// This GLSL code will run on the GPU to create the advanced coloring effect.

// -- Vertex Shader --
// Passes the vertex's local Z-position to the fragment shader.
BABYLON.Effect.ShadersStore["tentacleVertexShader"] = `
    precision highp float;
    attribute vec3 position;
    uniform mat4 worldViewProjection;
    varying float v_localZ;

    void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);
        v_localZ = position.z;
    }
`;

// -- Fragment Shader --
// Calculates the color for each pixel based on its position and the current time.
BABYLON.Effect.ShadersStore["tentacleFragmentShader"] = `
    precision highp float;
    uniform float time;
    uniform float length;
    uniform float orbSize;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    varying float v_localZ;

    void main(void) {
        // Normalize position along the tentacle from 0 (base) to 1 (tip)
        float normalizedPos = (v_localZ - (orbSize / 2.0)) / length;

        // Create a scrolling, repeating pattern for the segments
        float pattern = fract(normalizedPos * 5.0 - time * 0.7);

        // Create the tonal gradient within each segment
        vec3 gradientColor = mix(colorStart, colorEnd, pattern);

        // Create sharp cutoffs for the "detached" look, leaving black gaps
        float segmentIntensity = smoothstep(0.0, 0.1, pattern) * (1.0 - smoothstep(0.8, 0.95, pattern));

        // The final color is the gradient multiplied by the segment's intensity
        vec3 finalColor = gradientColor * segmentIntensity;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;


// --- REVISED TENTACLE ORB (VISUALS ONLY) ---
class TentacleOrb {
    constructor(scene, position, config = {}) {
      this.scene = scene;
      this.position = position || new BABYLON.Vector3(0, 0, 0);

      this.snapToGround();

      this.config = Object.assign({
        count: 12, orbSize: 0.5, length: 1.666, thickness: 0.02233, wriggle: 1.0, segments: 10,
        bobHeight: 0.2, bobSpeed: 1,
        glowIntensity: 0.3,
        tentacleUpdateFrequency: 1,
        colorTheme: { // Default to original red if no theme is provided
            orb: new BABYLON.Color3(0.4, 0.1, 0.1),
            tentacleStart: new BABYLON.Color3(0.5, 0.0, 0.0),
            tentacleEnd: new BABYLON.Color3(1.0, 0.3, 0.1)
        },
        patrol: { // NEW: Patrol behavior
            enabled: true,
            radius: 15 + Math.random() * 10,
            speed: 0.3 + Math.random() * 0.4
        },
        reactiveTentacles: { // NEW: Reactive Tentacles
            enabled: true,
            reactivity: 0.5, // How strongly tentacles react to target
            detectionRadius: 10 // How far the orb can detect targets
        },
        spikeShot: { // NEW: Spike Shot Ability
            enabled: true,
            cooldown: 5, // seconds
            spikeSpeed: 0.5,
            spikeLifetime: 3 // seconds
        },
        stealthMode: { // NEW: Stealth Mode Ability
            enabled: true,
            duration: 5, // seconds
            cooldown: 10 // seconds
        }
      }, config);

      this.tentacles = [];
      this.isDead = false;
      this.glowPhase = Math.random() * Math.PI * 2;
      this.tentacleUpdateCounter = 0;

      this.patrolPoints = [];
      this.currentPatrolPointIndex = 0;

      this.spikes = []; // For spike shot ability
      this.lastSpikeShotTime = 0;
      this.isInStealthMode = false;
      this.stealthStartTime = 0;

      this.createMaterials();

      (async () => {
        await this.createOrb();
        this.createTentacles();
        
        this.orb.position = this.position;
        this.basePosition = this.position.clone();
        
        if (this.config.patrol.enabled) {
            this.generatePatrolPoints();
        }
        
        this.mesh = this.orb;
        
        this.updateObserver = this.scene.registerBeforeRender(() => {
          if (!this.isDead && !game.isPaused && this.orb) {
            const time = performance.now() * 0.001;
            const deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

            if (this.config.patrol.enabled) {
                this.updatePatrol(deltaTime);
            }
            
            this.orb.position.x = this.basePosition.x;
            this.orb.position.z = this.basePosition.z;
            this.orb.position.y = this.basePosition.y + Math.sin(time * this.config.bobSpeed) * this.config.bobHeight;

            this.updateTentacles(time);
            this.updateEffects(time);
            this.updateSpikes(deltaTime);
            this.updateStealthMode(time);
          }
        });
      })();
    }

    snapToGround() {
        const groundRay = new BABYLON.Ray(
            new BABYLON.Vector3(this.position.x, this.position.y + 50, this.position.z),
            new BABYLON.Vector3(0, -1, 0),
            100
        );
        
        const pickInfo = this.scene.pickWithRay(groundRay, mesh => mesh.checkCollisions && mesh.name === "ground");
        
        if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
            this.position.y = pickInfo.pickedPoint.y;
        } else {
            this.position.y = 0;
        }
    }

    generatePatrolPoints() {
        const patrolConfig = this.config.patrol;
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = patrolConfig.radius * Math.sqrt(Math.random());
            const point = new BABYLON.Vector3(
                this.position.x + Math.cos(angle) * distance,
                this.position.y,
                this.position.z + Math.sin(angle) * distance
            );
            this.patrolPoints.push(point);
        }
        this.patrolPoints.push(this.position.clone()); // Return to start
    }

    updatePatrol(deltaTime) {
        if (this.patrolPoints.length === 0) return;

        const targetPoint = this.patrolPoints[this.currentPatrolPointIndex];
        const distance = BABYLON.Vector3.Distance(this.basePosition, targetPoint);

        if (distance < 1.0) {
            this.currentPatrolPointIndex = (this.currentPatrolPointIndex + 1) % this.patrolPoints.length;
        }

        const direction = targetPoint.subtract(this.basePosition).normalize();
        const moveVector = direction.scale(this.config.patrol.speed * deltaTime);

        this.basePosition.addInPlace(moveVector);
    }

    createMaterials() {
        this.orbMaterial = new BABYLON.StandardMaterial("orbMat", this.scene);
        this.orbMaterial.diffuseColor = this.config.colorTheme.orb;
        this.orbMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        this.orbMaterial.emissiveColor = this.config.colorTheme.orb.scale(0.5);

        this.tentacleMaterial = new BABYLON.ShaderMaterial("tentacleShader", this.scene, {
            vertex: "tentacle",
            fragment: "tentacle",
        }, {
            attributes: ["position"],
            uniforms: ["worldViewProjection", "time", "length", "orbSize", "colorStart", "colorEnd"]
        });

        this.tentacleMaterial.setFloat("length", this.config.length);
        this.tentacleMaterial.setFloat("orbSize", this.config.orbSize);
        this.tentacleMaterial.setColor3("colorStart", this.config.colorTheme.tentacleStart);
        this.tentacleMaterial.setColor3("colorEnd", this.config.colorTheme.tentacleEnd);

        this.spikeMaterial = new BABYLON.StandardMaterial("spikeMat", this.scene);
        this.spikeMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        this.spikeMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    }

    async createOrb() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "orb1.glb", this.scene);
            
            const mainMesh = result.meshes[0];

            if (mainMesh) {
                this.orb = mainMesh;
                this.orb.name = "tentacleOrb_from_glb";
                
                this.orb.getChildMeshes().forEach(m => m.material = this.orbMaterial);
                this.orb.material = this.orbMaterial;

                const boundingInfo = this.orb.getHierarchyBoundingVectors();
                const size = boundingInfo.max.subtract(boundingInfo.min);
                const maxDimension = Math.max(size.x, size.y, size.z);
                if (maxDimension > 0) {
                    const scaleFactor = this.config.orbSize / maxDimension;
                    this.orb.scaling.scaleInPlace(scaleFactor);
                }
            } else {
                throw new Error("orb1.glb was loaded but contained no meshes.");
            }
        } catch (e) {
            this.orb = BABYLON.MeshBuilder.CreateSphere("tentacleOrb_fallback", { diameter: this.config.orbSize }, this.scene);
            this.orb.material = this.orbMaterial;
        }
    }

    createTentacles() {
        // Create a single spike mesh to be instanced
        this.spikeInstanceMesh = BABYLON.MeshBuilder.CreateCylinder("spikeInstance", { height: 0.5, diameterBottom: this.config.thickness * 2.5, diameterTop: 0, tessellation: 6 }, this.scene);
        this.spikeInstanceMesh.material = this.spikeMaterial;
        this.spikeInstanceMesh.isVisible = false; // Hide the original mesh

        for (let i = 0; i < this.config.count; i++) {
            const angle = (i / this.config.count) * Math.PI * 2;
            const parent = new BABYLON.TransformNode("tentacleParent" + i);
            parent.parent = this.orb;
            parent.rotation.y = angle;

            const points = [];
            for (let j = 0; j <= this.config.segments; j++) {
                const radius = this.config.orbSize / 2;
                points.push(new BABYLON.Vector3(0, 0, radius + j * (this.config.length / this.config.segments)));
            }

            const tentacleMesh = BABYLON.MeshBuilder.CreateTube("tentacle" + i, {
                path: points,
                radius: this.config.thickness,
                updatable: true
            }, this.scene);
            tentacleMesh.material = this.tentacleMaterial;
            tentacleMesh.parent = parent;

            // Create an instance of the spike mesh
            const spike = this.spikeInstanceMesh.createInstance("spikeInstance" + i);
            spike.parent = parent;
            spike.rotationQuaternion = new BABYLON.Quaternion();

            this.tentacles.push({ mesh: tentacleMesh, parent: parent, points: points, type: 'equatorial', spike: spike });
        }

        const createPolarTentacle = (name, rotation) => {
            const parent = new BABYLON.TransformNode(name + "Parent");
            parent.parent = this.orb;
            parent.rotation = rotation;

            const points = [];
            for (let j = 0; j <= this.config.segments; j++) {
                const radius = this.config.orbSize / 2;
                points.push(new BABYLON.Vector3(0, 0, radius + j * (this.config.length / this.config.segments)));
            }

            const tentacleMesh = BABYLON.MeshBuilder.CreateTube(name, {
                path: points,
                radius: this.config.thickness,
                updatable: true
            }, this.scene);
            tentacleMesh.material = this.tentacleMaterial;
            tentacleMesh.parent = parent;

            // Create an instance of the spike mesh
            const spike = this.spikeInstanceMesh.createInstance(name + "SpikeInstance");
            spike.parent = parent;
            spike.rotationQuaternion = new BABYLON.Quaternion();

            this.tentacles.push({ mesh: tentacleMesh, parent: parent, points: points, type: 'polar', spike: spike });
        };

        createPolarTentacle("topTentacle", new BABYLON.Vector3(-Math.PI / 2, 0, 0));
        createPolarTentacle("bottomTentacle", new BABYLON.Vector3(Math.PI / 2, 0, 0));
    }

    updateTentacles(time) {
        this.tentacleMaterial.setFloat("time", time);

        // Reactive Tentacles: Find a target if enabled
        let targetPosition = null;
        if (this.config.reactiveTentacles.enabled) {
            // For demonstration, let's assume a global 'player' object exists
            // In a real scenario, you'd have a way to find nearby entities
            if (typeof game !== 'undefined' && game.player && BABYLON.Vector3.Distance(this.orb.position, game.player.position) < this.config.reactiveTentacles.detectionRadius) {
                targetPosition = game.player.position;
            }
        }

        this.tentacles.forEach((t, i) => {
            const newPoints = [];

            if (t.type === 'equatorial') {
                for (let j = 0; j <= this.config.segments; j++) {
                    const basePoint = t.points[j];
                    let wriggleX = Math.sin(time * 3 + j * 0.5 + i) * this.config.wriggle * (j / this.config.segments);
                    let wriggleY = Math.cos(time * 2 + j * 0.5 + i) * this.config.wriggle * (j / this.config.segments);

                    // Apply reactivity
                    if (targetPosition) {
                        const directionToTarget = targetPosition.subtract(t.mesh.absolutePosition).normalize();
                        wriggleX += directionToTarget.x * this.config.reactiveTentacles.reactivity * (j / this.config.segments);
                        wriggleY += directionToTarget.y * this.config.reactiveTentacles.reactivity * (j / this.config.segments);
                    }

                    newPoints.push(new BABYLON.Vector3(basePoint.x + wriggleX, basePoint.y + wriggleY, basePoint.z));
                }
            } else {
                for (let j = 0; j <= this.config.segments; j++) {
                    const basePoint = t.points[j];
                    const wriggleAmount = this.config.wriggle * 0.7;
                    let wriggleX = Math.sin(time * 1.5 + j * 0.4 + i) * wriggleAmount * (j / this.config.segments);
                    let wriggleY = Math.cos(time * 1.5 + j * 0.4 + i) * wriggleAmount * (j / this.config.segments);

                    // Apply reactivity
                    if (targetPosition) {
                        const directionToTarget = targetPosition.subtract(t.mesh.absolutePosition).normalize();
                        wriggleX += directionToTarget.x * this.config.reactiveTentacles.reactivity * (j / this.config.segments);
                        wriggleY += directionToTarget.y * this.config.reactiveTentacles.reactivity * (j / this.config.segments);
                    }

                    newPoints.push(new BABYLON.Vector3(basePoint.x + wriggleX, basePoint.y + wriggleY, basePoint.z));
                }
            }
            
            // Update the existing tube mesh instead of recreating it
            BABYLON.MeshBuilder.CreateTube(null, { path: newPoints, instance: t.mesh, updatable: true });

            if (t.spike && newPoints.length > 1) {
                const tipPoint = newPoints[newPoints.length - 1];
                const preTipPoint = newPoints[newPoints.length - 2];

                t.spike.position.copyFrom(tipPoint);

                const direction = tipPoint.subtract(preTipPoint).normalize();
                
                const up = BABYLON.Vector3.Up();
                const angle = Math.acos(BABYLON.Vector3.Dot(up, direction));
                const axis = BABYLON.Vector3.Cross(up, direction).normalize();
                
                if (axis.lengthSquared() > 0.001) {
                    BABYLON.Quaternion.RotationAxisToRef(axis, angle, t.spike.rotationQuaternion);
                }
            }
        });
    }

    updateEffects(time) {
        const baseEmissive = this.config.colorTheme.orb.scale(0.5);
        let currentGlowIntensity = this.config.glowIntensity + Math.sin(this.glowPhase + time) * 0.1;

        if (this.isInStealthMode) {
            currentGlowIntensity *= 0.1; // Reduce glow significantly in stealth mode
            this.orb.visibility = 0.3; // Make orb semi-transparent
            this.tentacles.forEach(t => t.mesh.visibility = 0.3);
        } else {
            this.orb.visibility = 1.0;
            this.tentacles.forEach(t => t.mesh.visibility = 1.0);
        }

        this.orbMaterial.emissiveColor = baseEmissive.scale(currentGlowIntensity);
    }

    // NEW: Spike Shot Ability
    shootSpikes() {
        if (!this.config.spikeShot.enabled) return;

        const currentTime = performance.now() * 0.001;
        if (currentTime - this.lastSpikeShotTime < this.config.spikeShot.cooldown) {
            console.log("Spike shot on cooldown.");
            return;
        }

        this.lastSpikeShotTime = currentTime;
        console.log("Shooting spikes!");

        this.tentacles.forEach(t => {
            if (t.spike) {
                const spikeMesh = t.spike.createInstance("shotSpike");
                spikeMesh.position.copyFrom(t.spike.absolutePosition);
                spikeMesh.rotationQuaternion.copyFrom(t.spike.rotationQuaternion);
                spikeMesh.isVisible = true;

                const direction = t.spike.forward.normalize(); // Assuming spike's forward is its pointing direction
                const speed = this.config.spikeShot.spikeSpeed;
                const lifetime = this.config.spikeShot.spikeLifetime;

                this.spikes.push({
                    mesh: spikeMesh,
                    direction: direction,
                    speed: speed,
                    spawnTime: currentTime,
                    lifetime: lifetime
                });
            }
        });
    }

    updateSpikes(deltaTime) {
        const currentTime = performance.now() * 0.001;
        this.spikes = this.spikes.filter(spike => {
            spike.mesh.position.addInPlace(spike.direction.scale(spike.speed * deltaTime));
            if (currentTime - spike.spawnTime > spike.lifetime) {
                spike.mesh.dispose();
                return false;
            }
            return true;
        });
    }

    // NEW: Stealth Mode Ability
    activateStealthMode() {
        if (!this.config.stealthMode.enabled) return;

        const currentTime = performance.now() * 0.001;
        if (this.isInStealthMode || (currentTime - this.stealthStartTime < this.config.stealthMode.cooldown && this.stealthStartTime !== 0)) {
            console.log("Stealth mode on cooldown or already active.");
            return;
        }

        this.isInStealthMode = true;
        this.stealthStartTime = currentTime;
        console.log("Activating stealth mode!");
    }

    updateStealthMode(time) {
        if (this.isInStealthMode) {
            if (time - this.stealthStartTime > this.config.stealthMode.duration) {
                this.isInStealthMode = false;
                console.log("Stealth mode deactivated.");
            }
        }
    }
}

function spawnTentacleOrbs(scene, count = 3, bounds = 100) {
    const orbs = [];

    // --- NEW: Color Themes for Variation ---
    const colorThemes = [
        { // Original Red/Orange
            orb: new BABYLON.Color3(0.4, 0.1, 0.1),
            tentacleStart: new BABYLON.Color3(0.5, 0.0, 0.0),
            tentacleEnd: new BABYLON.Color3(1.0, 0.3, 0.1)
        },
        { // Toxic Green
            orb: new BABYLON.Color3(0.1, 0.4, 0.1),
            tentacleStart: new BABYLON.Color3(0.0, 0.5, 0.1),
            tentacleEnd: new BABYLON.Color3(0.3, 1.0, 0.2)
        },
        { // Arcane Purple
            orb: new BABYLON.Color3(0.2, 0.1, 0.4),
            tentacleStart: new BABYLON.Color3(0.3, 0.0, 0.5),
            tentacleEnd: new BABYLON.Color3(0.6, 0.2, 1.0)
        },
        { // Icy Blue
            orb: new BABYLON.Color3(0.1, 0.2, 0.4),
            tentacleStart: new BABYLON.Color3(0.0, 0.3, 0.6),
            tentacleEnd: new BABYLON.Color3(0.2, 0.8, 1.0)
        }
    ];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * bounds;
        const z = (Math.random() - 0.5) * bounds;
        const position = new BABYLON.Vector3(x, 0, z);

        // Select a random theme for this orb
        const randomTheme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
        const orbConfig = { colorTheme: randomTheme };

        const orb = new TentacleOrb(scene, position, orbConfig);
        orbs.push(orb);
    }
    return orbs;
}
