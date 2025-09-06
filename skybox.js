// Enhanced Nightmarish Alien Weather Skybox System for Babylon.js
// Darker, grittier biomechanical horror inspired by H.R. Giger and cosmic dread

class NightmareSpaceSky {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.material = null;
        this.time = 0;
        this.weatherState = {
            biomassGrowth: 0.2,
            veinPulsing: 0.6,
            corruptionLevel: 0.1,
            alienBreathing: 0.2,
            shadowInfection: 0.0,
            voidTears: 0.0,
            necroticDecay: 0.0,
            weatherType: 'dormant' // 'dormant', 'infected', 'consuming', 'nightmare', 'void', 'decay', 'shadow'
        };
        
        this.init();
        this.startAnimation();
    }

    init() {
        // Create skybox with higher tessellation for organic distortions
        this.skybox = BABYLON.MeshBuilder.CreateSphere("nightmareSkybox", {
            diameter: 2000.0,
            segments: 96
        }, this.scene);
        
        this.createShaderMaterial();
        this.skybox.material = this.material;
        this.skybox.infiniteDistance = true;
        this.startWeatherCycle();
    }

    createShaderMaterial() {
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
            uniform float shadowInfection;
            uniform float necroticDecay;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            varying float vDistortion;
            varying float vCorruption;
            
            // Enhanced organic noise functions
            float hash(float n) { return fract(sin(n) * 43758.5453123); }
            
            float noise(vec3 x) {
                vec3 p = floor(x);
                vec3 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                float n = p.x + p.y * 157.0 + 113.0 * p.z;
                return mix(mix(mix(hash(n), hash(n + 1.0), f.x),
                              mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                          mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                              mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
            }
            
            float fbm(vec3 p) {
                float f = 0.0;
                f += 0.500000 * noise(p); p *= 2.32;
                f += 0.250000 * noise(p); p *= 2.23;
                f += 0.125000 * noise(p); p *= 2.41;
                f += 0.062500 * noise(p); p *= 2.17;
                f += 0.031250 * noise(p);
                return f / 0.96875;
            }
            
            void main(void) {
                vec3 pos = position;
                vec3 norm = normal;
                
                // Alien breathing creates slow, organic pulsing
                float breathePhase = time * 0.4 + length(position) * 0.008;
                float breathe = (sin(breathePhase) + sin(breathePhase * 1.7) * 0.5) * alienBreathing * 0.08;
                
                // Biomechanical growth creates tumor-like bulges
                float growthNoise = fbm(position * 0.03 + time * 0.05);
                float growth = pow(max(0.0, growthNoise - 0.4), 2.0) * biomassGrowth * 0.25;
                
                // Shadow infection creates writhing tentacle distortions
                float shadowPhase = time * 0.6 + dot(position, vec3(1.0, 0.7, 0.3)) * 0.01;
                float shadowDistort = sin(shadowPhase) * cos(shadowPhase * 1.3) * shadowInfection * 0.12;
                
                // Necrotic decay creates collapsing, rotting sections
                float decayNoise = fbm(position * 0.08 - time * 0.02);
                float decay = -pow(max(0.0, decayNoise - 0.3), 1.5) * necroticDecay * 0.2;
                
                // Combine distortions for maximum horror
                vDistortion = breathe + growth + shadowDistort + decay;
                vCorruption = growthNoise * shadowInfection + decayNoise * necroticDecay;
                
                pos += norm * vDistortion;
                
                vec4 worldPos = world * vec4(pos, 1.0);
                vPositionW = vec3(worldPos);
                vNormalW = normalize(vec3(world * vec4(norm, 0.0)));
                vDirectionW = normalize(vPositionW - cameraPosition);
                
                gl_Position = worldViewProjection * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            varying float vDistortion;
            varying float vCorruption;
            
            uniform float time;
            uniform float biomassGrowth;
            uniform float veinPulsing;
            uniform float corruptionLevel;
            uniform float alienBreathing;
            uniform float shadowInfection;
            uniform float voidTears;
            uniform float necroticDecay;
            uniform vec3 cameraPosition;
            
            // Enhanced hash functions for better randomness
            float hash21(vec2 p) {
                p = fract(p * vec2(234.34, 435.345));
                p += dot(p, p + 34.23);
                return fract(p.x * p.y);
            }
            
            float hash31(vec3 p) {
                p = fract(p * vec3(443.897, 441.423, 437.195));
                p += dot(p, p.yxz + 19.19);
                return fract((p.x + p.y) * p.z);
            }
            
            vec3 hash33(vec3 p) {
                p = fract(p * vec3(443.897, 441.423, 437.195));
                p += dot(p, p.yxz + 19.19);
                return fract((p.xxy + p.yxx) * p.zyx);
            }
            
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x),
                          mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);
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
                f += 0.5000 * noise(p); p *= 2.17;
                f += 0.2500 * noise(p); p *= 2.33;
                f += 0.1250 * noise(p); p *= 2.11;
                f += 0.0625 * noise(p);
                return f / 0.9375;
            }
            
            float fbm3d(vec3 p) {
                float f = 0.0;
                f += 0.5000 * noise3d(p); p *= 2.13;
                f += 0.2500 * noise3d(p); p *= 2.27;
                f += 0.1250 * noise3d(p); p *= 2.19;
                f += 0.0625 * noise3d(p);
                return f / 0.9375;
            }
            
            // Dark alien parasites and infection nodes
            float alienParasites(vec2 uv, float density, float corruptionMod) {
                vec2 grid = floor(uv * density);
                vec2 gridUv = fract(uv * density);
                
                float parasites = 0.0;
                for(int i = -1; i <= 1; i++) {
                    for(int j = -1; j <= 1; j++) {
                        vec2 offset = vec2(float(i), float(j));
                        vec2 cellGrid = grid + offset;
                        vec2 cellUv = gridUv - offset;
                        
                        float cellHash = hash21(cellGrid);
                        vec2 cellCenter = vec2(0.5) + 0.3 * (hash33(vec3(cellGrid, 0.0)).xy - 0.5);
                        
                        float dist = length(cellUv - cellCenter);
                        
                        if(cellHash > 0.75) {
                            // Slow, menacing pulse
                            float pulse = 0.3 + 0.7 * sin(time * 2.0 + cellHash * 15.0);
                            pulse *= (0.5 + 0.5 * sin(time * 0.8 + cellHash * 8.0));
                            
                            // Creeping tentacle extensions
                            float angle = atan(cellUv.y - cellCenter.y, cellUv.x - cellCenter.x);
                            float tentacles = sin(angle * 6.0 + time * 1.2 + cellHash * 10.0) * 0.015;
                            
                            float parasite = (1.0 - smoothstep(0.0, 0.04 + tentacles, dist)) * pulse;
                            
                            // Add infection spread
                            float infectionSpread = fbm(cellUv * 40.0 + time * 0.3) * 0.2;
                            parasites += parasite * cellHash * (1.0 + infectionSpread) * corruptionMod;
                        }
                    }
                }
                return parasites;
            }
            
            // Biomechanical circulatory system
            vec3 biomechanicalVeins(vec3 dir, float timeOffset) {
                vec3 p = dir * 6.0;
                
                // Primary arterial network - slow, organic flow
                float arteries = fbm3d(p + timeOffset * 0.08);
                float capillaries = fbm3d(p * 3.0 + timeOffset * 0.05);
                float mainVein = fbm3d(p * 0.8 - timeOffset * 0.03);
                
                // Create vein structure with organic branching
                float veinPattern = pow(abs(sin(arteries * 8.0 + timeOffset * 0.5)), 0.3) * 
                                   pow(abs(sin(capillaries * 12.0)), 0.4) *
                                   smoothstep(0.4, 0.85, mainVein);
                
                // Slow, hypnotic pulsing - like alien heartbeat
                float heartbeat = sin(timeOffset * 1.8 + arteries * 6.0) * 0.5 + 0.5;
                heartbeat *= sin(timeOffset * 0.9 + mainVein * 4.0) * 0.3 + 0.7;
                
                // Dark alien blood colors - no bright colors
                vec3 darkIchor = vec3(0.4, 0.08, 0.05); // Dark red
                vec3 toxicPlasma = vec3(0.08, 0.25, 0.03); // Sickly dark green
                vec3 shadowBlood = vec3(0.15, 0.02, 0.2); // Dark purple
                vec3 necroticFluid = vec3(0.2, 0.15, 0.05); // Rotting yellow-brown
                
                vec3 bloodColor = mix(darkIchor, toxicPlasma, sin(timeOffset * 0.4 + capillaries * 2.0) * 0.5 + 0.5);
                bloodColor = mix(bloodColor, shadowBlood, shadowInfection * 0.8);
                bloodColor = mix(bloodColor, necroticFluid, necroticDecay * 0.6);
                
                return bloodColor * veinPattern * heartbeat * veinPulsing * 0.8;
            }
            
            // Consuming nightmare maw
            vec3 nightmareConsumption(vec3 dir, float timeOffset, float intensity) {
                if(intensity < 0.01) return vec3(0.0);
                
                vec3 p = dir * 4.0;
                
                // Writhing digestive chambers
                float chamber = fbm3d(p + timeOffset * 0.7);
                chamber = pow(max(0.0, chamber - 0.2), 2.0);
                
                // Slowly opening and closing maws
                float maw = 0.0;
                if(chamber > 0.6) {
                    float teeth = sin(chamber * 30.0 + timeOffset * 8.0);
                    float jaw = sin(timeOffset * 1.5 + chamber * 10.0) * 0.5 + 0.5;
                    maw = max(0.0, teeth * jaw);
                    maw = pow(maw, 3.0);
                }
                
                // Dark digestive colors
                vec3 gastricAcid = vec3(0.3, 0.2, 0.05) * maw;
                vec3 digestiveEnzymes = vec3(0.25, 0.08, 0.02) * chamber * 0.6;
                vec3 consumedMatter = vec3(0.05, 0.15, 0.08) * pow(chamber, 1.5) * 0.4;
                
                vec3 consumptionColor = (gastricAcid + digestiveEnzymes + consumedMatter) * intensity;
                return consumptionColor;
            }
            
            // Shadow infection tendrils
            vec3 shadowInfectionEffect(vec3 dir, float timeOffset) {
                vec3 p = dir * 7.0;
                
                // Creeping shadow tendrils
                float tendrils = fbm3d(p + timeOffset * 0.6);
                tendrils = smoothstep(0.3, 0.9, tendrils);
                
                // Shadow nodes pulsing with malevolent energy
                float shadowNodes = noise3d(p * 15.0 + timeOffset * 1.2);
                shadowNodes = step(0.92, shadowNodes);
                
                // Dark network spreading like infection
                float network = fbm3d(p * 4.0) * fbm3d(p * 8.0 + timeOffset * 0.2);
                
                // Shadow colors - deep, ominous
                vec3 shadowTendril = vec3(0.02, 0.01, 0.08); // Deep shadow blue
                vec3 voidNode = vec3(0.1, 0.02, 0.15); // Void purple
                vec3 darkNetwork = vec3(0.05, 0.08, 0.02); // Sickly dark green
                
                vec3 finalShadow = shadowTendril * tendrils +
                                 voidNode * shadowNodes * 1.5 +
                                 darkNetwork * network * 0.6;
                
                return finalShadow * shadowInfection;
            }
            
            // Void tears revealing cosmic horror
            vec3 voidTearEffect(vec3 dir, float timeOffset) {
                vec2 uv = vec2(atan(dir.z, dir.x) / 6.28318, asin(dir.y) / 3.14159 + 0.5);
                
                // Reality distortion around tears
                float distortion = fbm(uv * 12.0 + timeOffset * 0.2);
                
                // Slowly widening tears in spacetime
                float tear1 = abs(sin(uv.x * 15.0 + timeOffset * 1.5)) < 0.025 ? 1.0 : 0.0;
                float tear2 = abs(sin(uv.y * 12.0 - timeOffset * 1.0)) < 0.035 ? 1.0 : 0.0;
                float tear3 = abs(sin((uv.x + uv.y) * 8.0 + timeOffset * 0.8)) < 0.02 ? 1.0 : 0.0;
                
                float voidMask = (tear1 + tear2 + tear3) * smoothstep(0.3, 0.9, distortion);
                
                // What glimpses through from beyond
                vec3 cosmicVoid = vec3(0.0, 0.0, 0.0); // Absolute void
                vec3 eldritchGlow = vec3(0.08, 0.0, 0.12); // Faint eldritch purple
                vec3 unknownColor = vec3(0.02, 0.05, 0.08); // Impossible dark cyan
                
                float flicker = sin(timeOffset * 25.0 + distortion * 12.0) * 0.5 + 0.5;
                flicker *= sin(timeOffset * 3.0) * 0.3 + 0.7;
                
                vec3 tearColor = mix(cosmicVoid, eldritchGlow, flicker * 0.6);
                tearColor = mix(tearColor, unknownColor, sin(timeOffset * 2.0) * 0.5 + 0.5);
                
                return tearColor * voidMask * voidTears;
            }
            
            // Necrotic decay and rot
            vec3 necroticDecayEffect(vec3 dir, float timeOffset) {
                vec3 p = dir * 5.0;
                
                // Spreading rot and decay
                float rot = fbm3d(p + timeOffset * 0.4);
                rot = smoothstep(0.2, 0.8, rot);
                
                // Putrefying matter
                float putrefaction = noise3d(p * 12.0 - timeOffset * 0.6);
                putrefaction = pow(max(0.0, putrefaction - 0.3), 1.2);
                
                // Decomposing organic matter
                float decomp = fbm3d(p * 2.0) * fbm3d(p * 6.0 + timeOffset * 0.1);
                
                // Decay colors - sickly, rotting
                vec3 rotColor = vec3(0.15, 0.08, 0.02); // Rotting brown
                vec3 putridColor = vec3(0.12, 0.12, 0.03); // Putrid yellow-green
                vec3 decomposedColor = vec3(0.08, 0.03, 0.08); // Decomposed purple-gray
                
                vec3 finalDecay = rotColor * rot +
                                putridColor * putrefaction * 0.8 +
                                decomposedColor * decomp * 0.5;
                
                return finalDecay * necroticDecay;
            }
            
            void main(void) {
                vec3 dir = normalize(vDirectionW);
                
                // Base void color - deeper, more terrifying
                vec3 baseColor = vec3(0.008, 0.005, 0.012);
                
                // Distortion affects overall intensity
                float distortionMod = 1.0 + vDistortion * 3.0 + vCorruption * 2.0;
                
                // Add alien parasites and infection nodes
                vec2 parasiteUV = vec2(atan(dir.z, dir.x) / 6.28318, asin(dir.y) / 3.14159);
                float mainParasites = alienParasites(parasiteUV * 25.0, 120.0, distortionMod);
                float smallerNodes = alienParasites(parasiteUV * 60.0, 300.0, distortionMod * 0.6);
                
                // Dark alien colors for parasites
                vec3 parasiteColor = vec3(0.3, 0.05, 0.2) * mainParasites;
                parasiteColor += vec3(0.08, 0.2, 0.05) * smallerNodes;
                
                // Add all nightmare effects
                vec3 veinColor = biomechanicalVeins(dir, time);
                vec3 consumptionColor = nightmareConsumption(dir, time, corruptionLevel);
                vec3 shadowColor = shadowInfectionEffect(dir, time);
                vec3 voidColor = voidTearEffect(dir, time);
                vec3 decayColor = necroticDecayEffect(dir, time);
                
                // Combine all horror elements
                vec3 finalColor = baseColor + parasiteColor + veinColor + 
                                consumptionColor + shadowColor + voidColor + decayColor;
                
                // Slow, ominous breathing modulation
                float breatheMod = 1.0 + sin(time * 0.5) * alienBreathing * 0.15;
                breatheMod *= (0.8 + 0.2 * sin(time * 0.3));
                finalColor *= breatheMod;
                
                // Corruption darkens and makes everything more wrong
                finalColor = mix(finalColor, finalColor * vec3(0.8, 0.7, 1.2), corruptionLevel * 0.3);
                
                // Subtle organic rim lighting
                float rim = 1.0 - abs(dot(dir, normalize(vNormalW)));
                rim = pow(rim, 3.0);
                finalColor += vec3(0.08, 0.02, 0.05) * rim * biomassGrowth * 0.4;
                
                // Dark horror tone mapping
                finalColor = finalColor / (finalColor + vec3(0.9));
                finalColor = pow(max(finalColor, vec3(0.0)), vec3(1.0/2.2));
                
                // Film grain for unease
                float grain = hash21(gl_FragCoord.xy * 0.1 + time * 0.1) * 0.015;
                finalColor += grain - 0.0075;
                
                // Ensure minimum darkness
                finalColor = max(finalColor, vec3(0.002));
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        this.material = new BABYLON.ShaderMaterial("nightmareShader", this.scene, {
            vertex: "custom",
            fragment: "custom"
        }, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", 
                      "time", "biomassGrowth", "veinPulsing", "corruptionLevel", 
                      "alienBreathing", "shadowInfection", "voidTears", 
                      "necroticDecay", "cameraPosition"]
        });

        this.material.backFaceCulling = false;
        this.material.disableDepthWrite = true;

        BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;
        BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;

        this.updateUniforms();
    }

    updateUniforms() {
        if (!this.material) return;
        
        this.material.setFloat("time", this.time);
        this.material.setFloat("biomassGrowth", this.weatherState.biomassGrowth);
        this.material.setFloat("veinPulsing", this.weatherState.veinPulsing);
        this.material.setFloat("corruptionLevel", this.weatherState.corruptionLevel);
        this.material.setFloat("alienBreathing", this.weatherState.alienBreathing);
        this.material.setFloat("shadowInfection", this.weatherState.shadowInfection);
        this.material.setFloat("voidTears", this.weatherState.voidTears);
        this.material.setFloat("necroticDecay", this.weatherState.necroticDecay);
        this.material.setVector3("cameraPosition", this.scene.activeCamera.position);
    }

    startAnimation() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.time += this.scene.getEngine().getDeltaTime() / 1000.0;
            this.updateUniforms();
        });
    }

    startWeatherCycle() {
        setInterval(() => {
            this.evolveHorror();
        }, Math.random() * 30000 + 25000);
    }

    evolveHorror() {
        const horrorStates = ['dormant', 'infected', 'consuming', 'nightmare', 'void', 'decay', 'shadow'];
        const newHorror = horrorStates[Math.floor(Math.random() * horrorStates.length)];
        
        console.log(`The nightmare evolves to: ${newHorror}`);
        this.transitionToHorror(newHorror);
    }

    transitionToHorror(horrorType) {
        const duration = 12000; // Slower 12-second transitions for more dread
        const startTime = Date.now();
        
        const startState = { ...this.weatherState };
        const targetState = this.getHorrorState(horrorType);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuart(progress);
            
            // Interpolate all state values
            Object.keys(targetState).forEach(key => {
                if (key !== 'weatherType') {
                    this.weatherState[key] = this.lerp(startState[key], targetState[key], eased);
                }
            });
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
                veinPulsing: 0.4,
                corruptionLevel: 0.05,
                alienBreathing: 0.15,
                shadowInfection: 0.0,
                voidTears: 0.0,
                necroticDecay: 0.0
            },
            infected: {
                biomassGrowth: 0.7,
                veinPulsing: 0.9,
                corruptionLevel: 0.3,
                alienBreathing: 0.4,
                shadowInfection: 0.2,
                voidTears: 0.0,
                necroticDecay: 0.1
            },
            consuming: {
                biomassGrowth: 0.5,
                veinPulsing: 1.3,
                corruptionLevel: 0.8,
                alienBreathing: 0.7,
                shadowInfection: 0.1,
                voidTears: 0.2,
                necroticDecay: 0.0
            },
            nightmare: {
                biomassGrowth: 0.9,
                veinPulsing: 0.6,
                corruptionLevel: 0.9,
                alienBreathing: 0.8,
                shadowInfection: 0.7,
                voidTears: 0.3,
                necroticDecay: 0.2
            },
            void: {
                biomassGrowth: 0.2,
                veinPulsing: 0.2,
                corruptionLevel: 1.0,
                alienBreathing: 0.3,
                shadowInfection: 0.1,
                voidTears: 0.9,
                necroticDecay: 0.0
            },
            decay: {
                biomassGrowth: 0.3,
                veinPulsing: 0.3,
                corruptionLevel: 0.6,
                alienBreathing: 0.2,
                shadowInfection: 0.0,
                voidTears: 0.1,
                necroticDecay: 0.9
            },
            shadow: {
                biomassGrowth: 0.4,
                veinPulsing: 0.7,
                corruptionLevel: 0.5,
                alienBreathing: 0.5,
                shadowInfection: 0.9,
                voidTears: 0.2,
                necroticDecay: 0.2
            }
        };
        
        return states[horrorType] || states.dormant;
    }

    // Utility functions
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
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

    setShadowInfection(infection) {
        this.weatherState.shadowInfection = Math.max(0, Math.min(1, infection));
    }

    setVoidTears(tears) {
        this.weatherState.voidTears = Math.max(0, Math.min(1, tears));
    }

    setNecroticDecay(decay) {
        this.weatherState.necroticDecay = Math.max(0, Math.min(1, decay));
    }

    // Trigger specific nightmare events
    triggerConsumption() {
        console.log("Triggering consumption phase...");
        this.setHorrorType('consuming');
    }

    triggerInfection() {
        console.log("Triggering infection spread...");
        this.setHorrorType('infected');
    }

    triggerVoidTear() {
        console.log("Tearing holes in reality...");
        this.setHorrorType('void');
    }

    triggerShadowInfection() {
        console.log("Shadow tendrils spreading...");
        this.setHorrorType('shadow');
    }

    triggerNecroticDecay() {
        console.log("Initiating necrotic decay...");
        this.setHorrorType('decay');
    }

    triggerNightmare() {
        console.log("Unleashing pure nightmare...");
        this.setHorrorType('nightmare');
    }

    // Get current state for debugging
    getCurrentState() {
        return { ...this.weatherState, time: this.time };
    }

    // Manual horror intensity scaling
    setOverallIntensity(intensity) {
        const clampedIntensity = Math.max(0, Math.min(1, intensity));
        this.weatherState.biomassGrowth *= clampedIntensity;
        this.weatherState.veinPulsing *= clampedIntensity;
        this.weatherState.corruptionLevel *= clampedIntensity;
        this.weatherState.alienBreathing *= clampedIntensity;
        this.weatherState.shadowInfection *= clampedIntensity;
        this.weatherState.voidTears *= clampedIntensity;
        this.weatherState.necroticDecay *= clampedIntensity;
    }

    // Cycle through all horror states in sequence
    cycleAllHorrors() {
        const sequence = ['dormant', 'infected', 'shadow', 'consuming', 'decay', 'nightmare', 'void'];
        let currentIndex = 0;
        
        const nextPhase = () => {
            this.setHorrorType(sequence[currentIndex]);
            currentIndex = (currentIndex + 1) % sequence.length;
            
            setTimeout(nextPhase, 15000); // 15 seconds per phase
        };
        
        nextPhase();
    }

    // Emergency horror reset
    resetToCalm() {
        console.log("Resetting nightmare to dormant state...");
        this.transitionToHorror('dormant');
    }

    // Destroy the nightmare (cleanup)
    dispose() {
        if (this.skybox) {
            this.skybox.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        console.log("Nightmare skybox disposed.");
    }
}

// Enhanced createSkybox function with more options
function createSkybox(scene, options = {}) {
    const config = {
        autoStart: true,
        initialHorror: 'dormant',
        cycleSpeed: 'normal', // 'slow', 'normal', 'fast'
        intensity: 1.0,
        enableLogging: false,
        ...options
    };
    
    // Create the nightmare space sky
    const nightmareSky = new NightmareSpaceSky(scene);
    
    // Apply initial configuration
    if (config.initialHorror !== 'dormant') {
        setTimeout(() => {
            nightmareSky.setHorrorType(config.initialHorror);
        }, 2000);
    }
    
    // Set intensity
    if (config.intensity !== 1.0) {
        nightmareSky.setOverallIntensity(config.intensity);
    }
    
    // Expose to window for manual control if needed
    if (typeof window !== 'undefined') {
        window.nightmareSky = nightmareSky;
        
        if (config.enableLogging) {
            console.log("Nightmare skybox created and exposed as window.nightmareSky");
            console.log("Available methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(nightmareSky)));
        }
    }
    
    return nightmareSky;
}

// Utility function for quick horror presets
function createPresetSkybox(scene, preset = 'random') {
    const presets = {
        calm: { initialHorror: 'dormant', intensity: 0.3 },
        infected: { initialHorror: 'infected', intensity: 0.7 },
        consuming: { initialHorror: 'consuming', intensity: 0.9 },
        nightmare: { initialHorror: 'nightmare', intensity: 1.0 },
        void: { initialHorror: 'void', intensity: 0.8 },
        decay: { initialHorror: 'decay', intensity: 0.6 },
        shadow: { initialHorror: 'shadow', intensity: 0.75 },
        random: { 
            initialHorror: ['infected', 'consuming', 'nightmare', 'shadow'][Math.floor(Math.random() * 4)], 
            intensity: 0.6 + Math.random() * 0.4 
        }
    };
    
    const config = presets[preset] || presets.random;
    return createSkybox(scene, { ...config, enableLogging: true });
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        NightmareSpaceSky, 
        createSkybox, 
        createPresetSkybox 
    };
} else if (typeof window !== 'undefined') {
    window.NightmareSpaceSky = NightmareSpaceSky;
    window.createSkybox = createSkybox;
    window.createPresetSkybox = createPresetSkybox;
}