// Nightmarish Alien Weather Skybox System for Babylon.js
// Inspired by H.R. Giger's biomechanical aesthetic

class NightmareSpaceSky {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.material = null;
        this.time = 0;
        this.weatherState = {
            biomassGrowth: 0.3,
            veinPulsing: 0.8,
            corruptionLevel: 0.0,
            alienBreathing: 0.0,
            weatherType: 'dormant' // 'dormant', 'infected', 'consuming', 'nightmare', 'void'
        };
        
        this.init();
        this.startAnimation();
    }

    init() {
        // Create skybox geometry with higher tessellation for organic distortions
        this.skybox = BABYLON.MeshBuilder.CreateSphere("nightmareSkybox", {
            diameter: 2000.0,
            segments: 64
        }, this.scene);
        
        // Create custom shader material
        this.createShaderMaterial();
        
        // Apply material to skybox
        this.skybox.material = this.material;
        this.skybox.infiniteDistance = true;
        
        // Weather cycle
        this.startWeatherCycle();
    }

    createShaderMaterial() {
        // Vertex shader with organic distortions
        const vertexShader = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform vec3 cameraPosition;
            uniform float time;
            uniform float biomassGrowth;
            uniform float alienBreathing;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            varying float vDistortion;
            
            // Organic noise for vertex displacement
            float hash(float n) { return fract(sin(n) * 43758.5453); }
            float noise(vec3 x) {
                vec3 p = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                float n = p.x + p.y * 57.0 + 113.0 * p.z;
                return mix(mix(mix(hash(n), hash(n + 1.0), f.x),
                              mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
                          mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                              mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
            }
            
            void main(void) {
                vec3 pos = position;
                
                // Organic breathing distortion
                float breathe = sin(time * 0.8 + length(position) * 0.01) * alienBreathing * 0.1;
                
                // Biomechanical growth distortion
                float growth = noise(position * 0.05 + time * 0.1) * biomassGrowth * 0.2;
                
                // Alien tumor-like bulges
                float bulge = pow(abs(sin(position.x * 0.02 + time * 0.3)), 8.0) * 
                             pow(abs(sin(position.y * 0.025 + time * 0.4)), 6.0) * 
                             biomassGrowth * 0.15;
                
                vDistortion = growth + bulge + breathe;
                pos += normal * vDistortion;
                
                vec4 worldPos = world * vec4(pos, 1.0);
                vPositionW = vec3(worldPos);
                vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
                vDirectionW = normalize(vPositionW - cameraPosition);
                
                gl_Position = worldViewProjection * vec4(pos, 1.0);
            }
        `;

        // Fragment shader with nightmarish alien effects
        const fragmentShader = `
            precision highp float;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            varying float vDistortion;
            
            uniform float time;
            uniform float biomassGrowth;
            uniform float veinPulsing;
            uniform float corruptionLevel;
            uniform float alienBreathing;
            uniform vec3 cameraPosition;
            
            // Enhanced noise functions for organic horror
            float hash21(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float hash31(vec3 p) {
                return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float a = hash21(i);
                float b = hash21(i + vec2(1.0, 0.0));
                float c = hash21(i + vec2(0.0, 1.0));
                float d = hash21(i + vec2(1.0, 1.0));
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            float noise3d(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
                              mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
                          mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                              mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
            }
            
            float fbm(vec2 p) {
                float f = 0.0;
                f += 0.5000 * noise(p); p *= 2.02;
                f += 0.2500 * noise(p); p *= 2.03;
                f += 0.1250 * noise(p); p *= 2.01;
                f += 0.0625 * noise(p);
                return f / 0.9375;
            }
            
            float fbm3d(vec3 p) {
                float f = 0.0;
                f += 0.5000 * noise3d(p); p *= 2.02;
                f += 0.2500 * noise3d(p); p *= 2.03;
                f += 0.1250 * noise3d(p); p *= 2.01;
                f += 0.0625 * noise3d(p);
                return f / 0.9375;
            }
            
            // Alien star parasites instead of normal stars
            float alienStars(vec2 uv, float density) {
                vec2 grid = floor(uv * density);
                vec2 gridUv = fract(uv * density);
                
                float parasites = 0.0;
                for(int i = -1; i <= 1; i++) {
                    for(int j = -1; j <= 1; j++) {
                        vec2 offset = vec2(float(i), float(j));
                        vec2 cellGrid = grid + offset;
                        vec2 cellCenter = vec2(0.5) + 0.4 * (vec2(hash21(cellGrid), hash21(cellGrid + vec2(1.0))) - 0.5);
                        vec2 cellUv = gridUv - offset;
                        
                        float dist = length(cellUv - cellCenter);
                        float infection = hash21(cellGrid + vec2(2.0));
                        
                        if(infection > 0.7) {
                            // Pulsing alien infection nodes
                            float pulse = 0.5 + 0.5 * sin(time * 5.0 + infection * 30.0);
                            float tentacles = sin(atan(cellUv.y - cellCenter.y, cellUv.x - cellCenter.x) * 8.0 + time * 2.0) * 0.02;
                            float parasite = (1.0 - smoothstep(0.0, 0.03 + tentacles, dist)) * infection * pulse;
                            
                            // Add creepy tendrils
                            float tendrils = fbm(cellUv * 50.0 + time * 0.5) * 0.3;
                            parasites += parasite * (1.0 + tendrils);
                        }
                    }
                }
                return parasites;
            }
            
            // Biomechanical veins and arteries
            vec3 biomechanicalVeins(vec3 dir, float time) {
                vec3 p = dir * 8.0;
                
                // Main arterial network
                float veins1 = fbm3d(p + time * 0.1);
                float veins2 = fbm3d(p * 2.5 + time * 0.08);
                float veins3 = fbm3d(p * 6.0 - time * 0.05);
                
                // Create vein-like structures
                float veinMask = pow(abs(sin(veins1 * 6.28 + time)), 0.1) * 
                                pow(abs(sin(veins2 * 8.0)), 0.2) *
                                smoothstep(0.6, 0.9, veins3);
                
                // Pulsing blood/ichor flow
                float pulse = sin(time * 3.0 + veins1 * 10.0) * 0.5 + 0.5;
                
                // Alien blood colors
                vec3 ichor = vec3(0.8, 0.1, 0.0); // Deep red
                vec3 plasma = vec3(0.2, 0.8, 0.1); // Sickly green
                vec3 corruption = vec3(0.6, 0.0, 0.9); // Purple corruption
                
                vec3 veinColor = mix(ichor, plasma, sin(time * 0.7 + veins2 * 3.0) * 0.5 + 0.5);
                veinColor = mix(veinColor, corruption, corruptionLevel);
                
                return veinColor * veinMask * pulse * veinPulsing;
            }
            
            // Nightmare consumption effect
            vec3 nightmareConsumption(vec3 dir, float time, float intensity) {
                if(intensity < 0.01) return vec3(0.0);
                
                vec3 p = dir * 3.0;
                
                // Writhing tentacle-like structures
                float tentacles = fbm3d(p + time * 1.2);
                tentacles = pow(tentacles, 3.0);
                
                // Consuming maw effects
                float maw = 0.0;
                if(tentacles > 0.8) {
                    float teeth = sin(tentacles * 50.0 + time * 20.0);
                    maw = max(0.0, teeth) * sin(time * 30.0 + tentacles * 15.0);
                    maw = pow(maw, 5.0);
                }
                
                // Digestive acid colors
                vec3 acidColor = vec3(1.0, 0.8, 0.0) * maw;
                acidColor += vec3(0.9, 0.2, 0.1) * tentacles * 0.4;
                acidColor += vec3(0.1, 0.9, 0.3) * pow(tentacles, 2.0) * 0.2;
                
                return acidColor * intensity;
            }
            
            // Void tears in reality
            vec3 voidTears(vec3 dir, float time) {
                vec2 uv = vec2(atan(dir.z, dir.x), asin(dir.y));
                
                // Reality distortion
                float distortion = fbm(uv * 15.0 + time * 0.4);
                
                // Tears in spacetime
                float tear1 = abs(sin(uv.x * 20.0 + time * 3.0)) < 0.02 ? 1.0 : 0.0;
                float tear2 = abs(sin(uv.y * 15.0 - time * 2.0)) < 0.03 ? 1.0 : 0.0;
                
                float voidMask = (tear1 + tear2) * smoothstep(0.4, 0.8, distortion);
                
                // What lurks beyond
                vec3 voidColor = vec3(0.0, 0.0, 0.0); // Pure void
                vec3 beyondColor = vec3(1.0, 0.0, 1.0); // Impossible colors
                
                float flicker = sin(time * 60.0 + distortion * 20.0) * 0.5 + 0.5;
                vec3 tearColor = mix(voidColor, beyondColor, flicker);
                
                return tearColor * voidMask;
            }
            
            // Alien infection spreading
            vec3 alienInfection(vec3 dir, float time) {
                vec3 p = dir * 5.0;
                
                // Infection spread pattern
                float infection = fbm3d(p + time * 0.6);
                infection = smoothstep(0.3, 0.7, infection);
                
                // Spore-like particles
                float spores = noise3d(p * 20.0 + time * 2.0);
                spores = step(0.95, spores);
                
                // Mycelium network
                float network = fbm3d(p * 8.0) * fbm3d(p * 12.0 + time * 0.3);
                
                vec3 infectionColor = vec3(0.1, 0.6, 0.2); // Sickly green
                vec3 sporeColor = vec3(0.8, 0.8, 0.2); // Yellow spores
                vec3 networkColor = vec3(0.3, 0.1, 0.7); // Purple networks
                
                vec3 finalInfection = infectionColor * infection +
                                    sporeColor * spores * 2.0 +
                                    networkColor * network * 0.5;
                
                return finalInfection * biomassGrowth;
            }
            
            void main(void) {
                vec3 dir = normalize(vDirectionW);
                
                // Base nightmare void color
                vec3 baseColor = vec3(0.02, 0.01, 0.03);
                
                // Distortion from vertex shader affects color intensity
                float distortionEffect = vDistortion * 5.0;
                
                // Add alien star parasites
                vec2 parasiteUV = vec2(atan(dir.z, dir.x), asin(dir.y));
                float alienParasites = alienStars(parasiteUV * 30.0, 150.0);
                vec3 parasiteColor = vec3(0.8, 0.2, 0.9) * alienParasites * (1.0 + distortionEffect);
                
                // Add smaller infection nodes
                parasiteColor += vec3(0.2, 0.9, 0.1) * alienStars(parasiteUV * 80.0, 400.0) * 0.4;
                
                // Add biomechanical veins
                vec3 veinColor = biomechanicalVeins(dir, time);
                
                // Add nightmare consumption
                vec3 consumptionColor = nightmareConsumption(dir, time, corruptionLevel);
                
                // Add void tears
                vec3 voidColor = voidTears(dir, time);
                
                // Add alien infection
                vec3 infectionColor = alienInfection(dir, time);
                
                // Combine all nightmare effects
                vec3 finalColor = baseColor + parasiteColor + veinColor + 
                                consumptionColor + voidColor + infectionColor;
                
                // Breathing modulation
                float breatheMod = 1.0 + sin(time * 0.8) * alienBreathing * 0.2;
                finalColor *= breatheMod;
                
                // Corruption shift - makes everything more wrong
                finalColor = mix(finalColor, finalColor.rbg * vec3(1.2, 0.8, 1.5), corruptionLevel * 0.4);
                
                // Add organic rim lighting effect
                float rim = 1.0 - abs(dot(dir, normalize(vNormalW)));
                rim = pow(rim, 2.0);
                finalColor += vec3(0.3, 0.1, 0.2) * rim * biomassGrowth * 0.3;
                
                // Nightmare HDR tone mapping - keeps the horror vivid
                finalColor = finalColor / (finalColor + vec3(0.7));
                finalColor = pow(finalColor, vec3(1.0/1.8)); // Darker gamma for horror
                
                // Subtle film grain for unease
                float grain = hash21(gl_FragCoord.xy + time) * 0.02;
                finalColor += grain;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Create shader material
        this.material = new BABYLON.ShaderMaterial("nightmareShader", this.scene, {
            vertex: "custom",
            fragment: "custom"
        }, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", 
                      "time", "biomassGrowth", "veinPulsing", 
                      "corruptionLevel", "alienBreathing", "cameraPosition"]
        });

        // Store shaders
        BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;
        BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;

        // Set initial uniform values
        this.updateUniforms();
    }

    updateUniforms() {
        if (!this.material) return;
        
        this.material.setFloat("time", this.time);
        this.material.setFloat("biomassGrowth", this.weatherState.biomassGrowth);
        this.material.setFloat("veinPulsing", this.weatherState.veinPulsing);
        this.material.setFloat("corruptionLevel", this.weatherState.corruptionLevel);
        this.material.setFloat("alienBreathing", this.weatherState.alienBreathing);
        this.material.setVector3("cameraPosition", this.scene.activeCamera.position);
    }

    startAnimation() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.time += this.scene.getEngine().getDeltaTime() / 1000.0;
            this.updateUniforms();
        });
    }

    startWeatherCycle() {
        // Change weather every 20-45 seconds for more unsettling experience
        setInterval(() => {
            this.evolveHorror();
        }, Math.random() * 25000 + 20000);
    }

    evolveHorror() {
        const horrorStates = ['dormant', 'infected', 'consuming', 'nightmare', 'void'];
        const newHorror = horrorStates[Math.floor(Math.random() * horrorStates.length)];
        
        console.log(`The nightmare evolves to: ${newHorror}`);
        this.transitionToHorror(newHorror);
    }

    transitionToHorror(horrorType) {
        const duration = 8000; // 8 seconds transition for more dread
        const startTime = Date.now();
        
        const startState = { ...this.weatherState };
        const targetState = this.getHorrorState(horrorType);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress); // More dramatic easing
            
            // Interpolate between start and target states
            this.weatherState.biomassGrowth = this.lerp(startState.biomassGrowth, targetState.biomassGrowth, eased);
            this.weatherState.veinPulsing = this.lerp(startState.veinPulsing, targetState.veinPulsing, eased);
            this.weatherState.corruptionLevel = this.lerp(startState.corruptionLevel, targetState.corruptionLevel, eased);
            this.weatherState.alienBreathing = this.lerp(startState.alienBreathing, targetState.alienBreathing, eased);
            this.weatherState.weatherType = horrorType;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    getHorrorState(horrorType) {
        const states = {
            dormant: {
                biomassGrowth: 0.1,
                veinPulsing: 0.3,
                corruptionLevel: 0.0,
                alienBreathing: 0.1
            },
            infected: {
                biomassGrowth: 0.6,
                veinPulsing: 0.8,
                corruptionLevel: 0.2,
                alienBreathing: 0.3
            },
            consuming: {
                biomassGrowth: 0.4,
                veinPulsing: 1.2,
                corruptionLevel: 0.9,
                alienBreathing: 0.6
            },
            nightmare: {
                biomassGrowth: 0.9,
                veinPulsing: 0.4,
                corruptionLevel: 0.7,
                alienBreathing: 0.9
            },
            void: {
                biomassGrowth: 0.2,
                veinPulsing: 0.1,
                corruptionLevel: 1.0,
                alienBreathing: 0.2
            }
        };
        
        return states[horrorType] || states.dormant;
    }

    // Utility functions
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Public API methods for controlling the nightmare
    setHorrorType(horrorType) {
        this.transitionToHorror(horrorType);
    }

    setCorruptionLevel(level) {
        this.weatherState.corruptionLevel = Math.max(0, Math.min(1, level));
    }

    setBiomassGrowth(growth) {
        this.weatherState.biomassGrowth = Math.max(0, Math.min(1, growth));
    }

    setVeinPulsing(intensity) {
        this.weatherState.veinPulsing = Math.max(0, Math.min(2, intensity));
    }

    setAlienBreathing(breathing) {
        this.weatherState.alienBreathing = Math.max(0, Math.min(1, breathing));
    }

    // Trigger specific nightmare events
    triggerConsumption() {
        this.setHorrorType('consuming');
    }

    triggerInfection() {
        this.setHorrorType('infected');
    }

    triggerVoidTear() {
        this.setHorrorType('void');
    }
}

// Updated createSkybox function
function createSkybox(scene) {
    // Create the nightmare space sky
    const nightmareSky = new NightmareSpaceSky(scene);
    
    // Optional: Add manual horror control
    window.nightmareSky = nightmareSky; // For debugging/manual control
    
    // Example of manual horror evolution (remove if not needed)
    /*
    setTimeout(() => nightmareSky.setHorrorType('infected'), 10000);
    setTimeout(() => nightmareSky.setHorrorType('consuming'), 25000);
    setTimeout(() => nightmareSky.setHorrorType('nightmare'), 40000);
    setTimeout(() => nightmareSky.setHorrorType('void'), 55000);
    */
    
    return nightmareSky;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NightmareSpaceSky, createSkybox };
}