// War-Torn Planet Dynamic Skybox System for Babylon.js
// Epic battlefield weather with orbital bombardments, toxic storms, and plasma warfare

class WarTornPlanetSky {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.material = null;
        this.time = 0;
        this.battleState = {
            smokeIntensity: 0.3,
            plasmaStorms: 0.2,
            orbitalBombardment: 0.1,
            toxicClouds: 0.15,
            electricalStorms: 0.0,
            ashfall: 0.2,
            nuclearWinter: 0.0,
            battlePhase: 'skirmish'
        };
        
        this.init();
        this.startAnimation();
    }

    init() {
        this.skybox = BABYLON.MeshBuilder.CreateSphere("warTornSkybox", {
            diameter: 2500.0,
            segments: 128
        }, this.scene);
        
        this.createWarShaderMaterial();
        this.skybox.material = this.material;
        this.skybox.infiniteDistance = true;
        this.startBattleCycle();
    }

    createWarShaderMaterial() {
        const vertexShader = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform vec3 cameraPosition;
            uniform float time;
            uniform float smokeIntensity;
            uniform float plasmaStorms;
            uniform float orbitalBombardment;
            uniform float electricalStorms;
            uniform float ashfall;
            uniform float nuclearWinter;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            varying float vWarDistortion;
            varying float vBattleDamage;
            
            float hash(float n) { return fract(sin(n) * 1399763.5453123); }
            
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
                f += 0.500000 * noise(p); p *= 2.17;
                f += 0.250000 * noise(p); p *= 2.32;
                f += 0.125000 * noise(p); p *= 2.41;
                f += 0.062500 * noise(p); p *= 2.23;
                f += 0.031250 * noise(p);
                return f / 0.96875;
            }
            
            void main(void) {
                vec3 pos = position;
                vec3 norm = normal;
                
                float explosionWaves = time * 3.0 + length(position) * 0.015;
                float turbulence = (sin(explosionWaves) + sin(explosionWaves * 2.3) * 0.3) * orbitalBombardment * 0.12;
                
                float plasmaField = fbm(position * 0.025 + time * 0.8);
                float plasma = pow(max(0.0, plasmaField - 0.3), 2.0) * plasmaStorms * 0.18;
                
                float electricPhase = time * 8.0 + dot(position, vec3(0.7, 1.0, 0.3)) * 0.02;
                float electrical = sin(electricPhase) * cos(electricPhase * 1.7) * electricalStorms * 0.08;
                
                float shockwaveNoise = fbm(position * 0.04 + time * 0.3);
                float shockwave = pow(max(0.0, shockwaveNoise - 0.4), 1.8) * nuclearWinter * 0.25;
                
                float smokeDisp = fbm(position * 0.06 - time * 0.2) * smokeIntensity * 0.06;
                
                vWarDistortion = turbulence + plasma + electrical + shockwave + smokeDisp;
                vBattleDamage = plasmaField * orbitalBombardment + shockwaveNoise * nuclearWinter;
                
                pos += norm * vWarDistortion;
                
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
            varying float vWarDistortion;
            varying float vBattleDamage;
            
            uniform float time;
            uniform float smokeIntensity;
            uniform float plasmaStorms;
            uniform float orbitalBombardment;
            uniform float toxicClouds;
            uniform float electricalStorms;
            uniform float ashfall;
            uniform float nuclearWinter;
            uniform vec3 cameraPosition;
            
            float hash21(vec2 p) {
                p = fract(p * vec2(127.1, 311.7));
                p += dot(p, p + 33.33);
                return fract(p.x * p.y);
            }
            
            float hash31(vec3 p) {
                p = fract(p * vec3(443.8971, 397.2973, 491.1871));
                p += dot(p, p.yxz + 19.19);
                return fract((p.x + p.y) * p.z);
            }
            
            vec3 hash33(vec3 p) {
                p = fract(p * vec3(443.8971, 397.2973, 491.1871));
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
                f += 0.5000 * noise(p); p *= 2.32;
                f += 0.2500 * noise(p); p *= 2.23;
                f += 0.1250 * noise(p); p *= 2.17;
                f += 0.0625 * noise(p);
                return f / 0.9375;
            }
            
            float fbm3d(vec3 p) {
                float f = 0.0;
                f += 0.5000 * noise3d(p); p *= 2.13;
                f += 0.2500 * noise3d(p); p *= 2.27;
                f += 0.1250 * noise3d(p); p *= 2.41;
                f += 0.0625 * noise3d(p);
                return f / 0.9375;
            }
            
            float orbitalExplosions(vec2 uv, float density, float intensity) {
                vec2 grid = floor(uv * density);
                vec2 gridUv = fract(uv * density);
                
                float explosions = 0.0;
                for(int i = -1; i <= 1; i++) {
                    for(int j = -1; j <= 1; j++) {
                        vec2 offset = vec2(float(i), float(j));
                        vec2 cellGrid = grid + offset;
                        vec2 cellUv = gridUv - offset;
                        
                        float cellHash = hash21(cellGrid + floor(time * 2.0));
                        vec2 explosionCenter = vec2(0.5) + 0.4 * (hash33(vec3(cellGrid, floor(time * 1.5))).xy - 0.5);
                        
                        float dist = length(cellUv - explosionCenter);
                        
                        if(cellHash > 0.85) {
                            float explosionTime = fract(time * 3.0 + cellHash * 10.0);
                            float shockwave = 1.0 - smoothstep(0.0, 0.3, abs(dist - explosionTime * 0.4));
                            float fireball = 1.0 - smoothstep(0.0, 0.15 * (1.0 - explosionTime), dist);
                            
                            explosions += (shockwave * 0.8 + fireball * 1.5) * intensity * cellHash;
                        }
                    }
                }
                return explosions;
            }
            
            vec3 toxicCloudSystem(vec3 dir, float timeOffset) {
                vec3 p = dir * 4.0;
                
                float toxicBase = fbm3d(p + timeOffset * 0.1);
                float density = fbm3d(p * 2.0 + timeOffset * 0.05);
                float swirls = fbm3d(p * 6.0 - timeOffset * 0.15);
                
                float reaction1 = sin(toxicBase * 8.0 + timeOffset * 2.0);
                float reaction2 = cos(density * 12.0 + timeOffset * 1.5);
                
                vec3 chlorineGas = vec3(0.4, 0.6, 0.2);
                vec3 mustardGas = vec3(0.6, 0.5, 0.1);
                vec3 acidVapor = vec3(0.5, 0.3, 0.7);
                vec3 plasmaGas = vec3(0.8, 0.4, 0.2);
                
                vec3 baseCloud = mix(chlorineGas, mustardGas, reaction1 * 0.5 + 0.5);
                baseCloud = mix(baseCloud, acidVapor, reaction2 * 0.3 + 0.3);
                baseCloud = mix(baseCloud, plasmaGas, swirls * 0.2);
                
                float cloudMask = smoothstep(0.2, 0.8, toxicBase) * 
                                 smoothstep(0.1, 0.9, density) * 
                                 (0.7 + 0.3 * swirls);
                
                return baseCloud * cloudMask * toxicClouds;
            }
            
            vec3 plasmaStormSystem(vec3 dir, float timeOffset) {
                vec3 p = dir * 7.0;
                
                float energy = fbm3d(p + timeOffset * 1.2);
                energy = pow(max(0.0, energy - 0.3), 1.5);
                
                float arc1 = abs(sin(p.x * 15.0 + timeOffset * 10.0)) < 0.02 ? 1.0 : 0.0;
                float arc2 = abs(sin(p.y * 12.0 - timeOffset * 8.0)) < 0.025 ? 1.0 : 0.0;
                float arc3 = abs(sin((p.x + p.z) * 20.0 + timeOffset * 12.0)) < 0.015 ? 1.0 : 0.0;
                
                float plasmaBalls = noise3d(p * 8.0 + timeOffset * 2.0);
                plasmaBalls = step(0.88, plasmaBalls);
                
                vec3 coreEnergy = vec3(1.2, 0.8, 1.5);
                vec3 arcColor = vec3(0.8, 1.2, 1.8);
                vec3 fieldColor = vec3(1.0, 0.6, 0.8);
                
                float flicker = sin(timeOffset * 30.0 + energy * 20.0) * 0.3 + 0.7;
                
                vec3 plasmaColor = coreEnergy * energy * 0.6 +
                                  arcColor * (arc1 + arc2 + arc3) * flicker +
                                  fieldColor * plasmaBalls * 2.0;
                
                return plasmaColor * plasmaStorms * 0.8;
            }
            
            vec3 warSmokeColumns(vec3 dir, float timeOffset) {
                vec2 uv = vec2(atan(dir.z, dir.x) / 6.28318, asin(dir.y) / 3.14159 + 0.5);
                
                float column1 = smoothstep(0.02, 0.15, abs(uv.x - 0.3));
                float column2 = smoothstep(0.015, 0.12, abs(uv.x - 0.7));
                float column3 = smoothstep(0.025, 0.18, abs(uv.x + 0.1));
                
                column1 *= smoothstep(0.3, 0.8, uv.y);
                column2 *= smoothstep(0.2, 0.9, uv.y);
                column3 *= smoothstep(0.25, 0.85, uv.y);
                
                float totalColumn = 1.0 - (column1 * column2 * column3);
                
                float turbulence = fbm(uv * 20.0 + timeOffset * 0.3);
                float billowing = fbm(uv * 8.0 - timeOffset * 0.1);
                
                totalColumn *= (0.7 + 0.3 * turbulence) * (0.8 + 0.2 * billowing);
                
                vec3 blackSmoke = vec3(0.1, 0.08, 0.05);
                vec3 graySmoke = vec3(0.3, 0.3, 0.25);
                vec3 toxicSmoke = vec3(0.4, 0.3, 0.1);
                vec3 oilSmoke = vec3(0.15, 0.1, 0.08);
                
                vec3 smokeColor = mix(blackSmoke, graySmoke, turbulence);
                smokeColor = mix(smokeColor, toxicSmoke, billowing * 0.4);
                smokeColor = mix(smokeColor, oilSmoke, sin(timeOffset * 0.5) * 0.5 + 0.5);
                
                return smokeColor * totalColumn * smokeIntensity;
            }
            
            vec3 electricalStormSystem(vec3 dir, float timeOffset) {
                vec2 uv = vec2(atan(dir.z, dir.x) / 6.28318, asin(dir.y) / 3.14159 + 0.5);
                
                float bolt1 = 0.0;
                float bolt2 = 0.0;
                float bolt3 = 0.0;
                
                for(int i = 0; i < 8; i++) {
                    float fi = float(i);
                    float lightning = abs(sin(uv.x * (30.0 + fi * 5.0) + timeOffset * (15.0 + fi * 2.0))) < (0.002 + fi * 0.001) ? 1.0 : 0.0;
                    lightning *= abs(sin(uv.y * (25.0 + fi * 3.0) - timeOffset * (12.0 + fi * 1.5))) < 0.8 ? 1.0 : 0.0;
                    
                    if(i < 3) bolt1 += lightning;
                    else if(i < 6) bolt2 += lightning;
                    else bolt3 += lightning;
                }
                
                vec3 mainBolt = vec3(1.5, 1.8, 2.2);
                vec3 sideBolt = vec3(1.0, 1.2, 1.8);
                vec3 afterglow = vec3(0.6, 0.8, 1.4);
                
                float intensity = sin(timeOffset * 25.0) * 0.5 + 0.5;
                intensity *= sin(timeOffset * 7.0) * 0.3 + 0.7;
                
                vec3 lightningColor = mainBolt * bolt1 * intensity +
                                     sideBolt * bolt2 * intensity * 0.7 +
                                     afterglow * bolt3 * intensity * 0.4;
                
                return lightningColor * electricalStorms;
            }
            
            vec3 nuclearWinterSystem(vec3 dir, float timeOffset) {
                vec3 p = dir * 3.0;
                
                float fallout = fbm3d(p - timeOffset * 0.05);
                fallout = smoothstep(0.4, 0.9, fallout);
                
                float ashClouds = fbm3d(p * 2.0 + timeOffset * 0.02);
                ashClouds = pow(max(0.0, ashClouds - 0.2), 1.2);
                
                float radiation = noise3d(p * 12.0 + timeOffset * 1.0);
                radiation = step(0.9, radiation);
                
                vec3 falloutGray = vec3(0.2, 0.18, 0.15);
                vec3 ashCloud = vec3(0.15, 0.12, 0.1);
                vec3 radiationGlow = vec3(0.3, 0.5, 0.2);
                vec3 coldAtmosphere = vec3(0.1, 0.15, 0.2);
                
                vec3 winterColor = falloutGray * fallout +
                                  ashCloud * ashClouds * 0.8 +
                                  radiationGlow * radiation * 1.2 +
                                  coldAtmosphere * 0.3;
                
                return winterColor * nuclearWinter;
            }
            
            vec3 ashfallSystem(vec3 dir, float timeOffset) {
                vec3 p = dir * 10.0;
                
                float ashParticles = fbm3d(p + vec3(0, -timeOffset * 0.8, 0));
                ashParticles = smoothstep(0.3, 0.8, ashParticles);
                
                float ashDrift = fbm3d(p * 0.5 + timeOffset * 0.1);
                
                float embers = noise3d(p * 15.0 + timeOffset * 0.5);
                embers = step(0.95, embers);
                
                vec3 ashGray = vec3(0.25, 0.22, 0.18);
                vec3 darkAsh = vec3(0.12, 0.1, 0.08);
                vec3 emberGlow = vec3(0.8, 0.3, 0.1);
                
                vec3 ashColor = ashGray * ashParticles * 0.6 +
                               darkAsh * ashDrift * 0.8 +
                               emberGlow * embers * 2.0;
                
                return ashColor * ashfall;
            }
            
            void main(void) {
                vec3 dir = normalize(vDirectionW);
                
                vec3 baseColor = vec3(0.08, 0.06, 0.05);
                
                float warMod = 1.0 + vWarDistortion * 2.0 + vBattleDamage * 1.5;
                
                vec2 bombUV = vec2(atan(dir.z, dir.x) / 6.28318, asin(dir.y) / 3.14159);
                float majorExplosions = orbitalExplosions(bombUV * 8.0, 40.0, warMod);
                float minorExplosions = orbitalExplosions(bombUV * 20.0, 100.0, warMod * 0.7);
                
                vec3 explosionColor = vec3(1.5, 0.8, 0.3) * majorExplosions +
                                     vec3(1.0, 0.6, 0.2) * minorExplosions;
                
                vec3 smokeColor = warSmokeColumns(dir, time);
                vec3 toxicColor = toxicCloudSystem(dir, time);
                vec3 plasmaColor = plasmaStormSystem(dir, time);
                vec3 lightningColor = electricalStormSystem(dir, time);
                vec3 nuclearColor = nuclearWinterSystem(dir, time);
                vec3 ashColor = ashfallSystem(dir, time);
                
                vec3 finalColor = baseColor + explosionColor + smokeColor + 
                                toxicColor + plasmaColor + lightningColor + 
                                nuclearColor + ashColor;
                
                float haze = 1.0 + sin(time * 0.3) * 0.1;
                haze *= (0.9 + 0.1 * sin(time * 0.7));
                finalColor *= haze;
                
                finalColor = mix(finalColor, finalColor * vec3(0.6, 0.7, 0.8), vBattleDamage * 0.2);
                
                float rim = 1.0 - abs(dot(dir, normalize(vNormalW)));
                rim = pow(rim, 2.0);
                vec3 rimColor = vec3(0.4, 0.2, 0.1) * orbitalBombardment * 0.8 +
                               vec3(0.2, 0.4, 0.6) * electricalStorms * 0.6 +
                               vec3(0.6, 0.3, 0.8) * plasmaStorms * 0.5;
                finalColor += rimColor * rim * 0.3;
                
                finalColor = finalColor / (finalColor + vec3(0.5));
                finalColor = pow(max(finalColor, vec3(0.0)), vec3(1.0/2.2));
                
                float dust = hash21(gl_FragCoord.xy * 0.1 + time * 0.2) * 0.02;
                finalColor += dust - 0.01;
                
                finalColor = max(finalColor, vec3(0.01));
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        this.material = new BABYLON.ShaderMaterial("warShader", this.scene, {
            vertex: "custom",
            fragment: "custom"
        }, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", 
                      "time", "smokeIntensity", "plasmaStorms", "orbitalBombardment", 
                      "toxicClouds", "electricalStorms", "ashfall", 
                      "nuclearWinter", "cameraPosition"]
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
        this.material.setFloat("smokeIntensity", this.battleState.smokeIntensity);
        this.material.setFloat("plasmaStorms", this.battleState.plasmaStorms);
        this.material.setFloat("orbitalBombardment", this.battleState.orbitalBombardment);
        this.material.setFloat("toxicClouds", this.battleState.toxicClouds);
        this.material.setFloat("electricalStorms", this.battleState.electricalStorms);
        this.material.setFloat("ashfall", this.battleState.ashfall);
        this.material.setFloat("nuclearWinter", this.battleState.nuclearWinter);
        this.material.setVector3("cameraPosition", this.scene.activeCamera.position);
    }

    startAnimation() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.time += (this.scene.getEngine().getDeltaTime() / 1000.0) / 5.0;
            this.updateUniforms();
        });
    }

    startBattleCycle() {
        setInterval(() => {
            this.escalateBattle();
        }, Math.random() * 20000 + 15000);
    }

    escalateBattle() {
        const battlePhases = ['calm', 'skirmish', 'assault', 'bombardment', 'apocalypse', 'nuclear', 'aftermath'];
        const newPhase = battlePhases[Math.floor(Math.random() * battlePhases.length)];
        
        console.log(`Battle phase escalating to: ${newPhase}`);
        this.transitionToBattle(newPhase);
    }

    transitionToBattle(battlePhase) {
        const duration = 8000;
        const startTime = Date.now();
        
        const startState = { ...this.battleState };
        const targetState = this.getBattlePhaseState(battlePhase);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);
            
            Object.keys(targetState).forEach(key => {
                if (key !== 'battlePhase') {
                    this.battleState[key] = this.lerp(startState[key], targetState[key], eased);
                }
            });
            this.battleState.battlePhase = battlePhase;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    getBattlePhaseState(battlePhase) {
        const states = {
            calm: {
                smokeIntensity: 0.2,
                plasmaStorms: 0.0,
                orbitalBombardment: 0.0,
                toxicClouds: 0.1,
                electricalStorms: 0.0,
                ashfall: 0.15,
                nuclearWinter: 0.0
            },
            skirmish: {
                smokeIntensity: 0.4,
                plasmaStorms: 0.2,
                orbitalBombardment: 0.15,
                toxicClouds: 0.2,
                electricalStorms: 0.1,
                ashfall: 0.3,
                nuclearWinter: 0.0
            },
            assault: {
                smokeIntensity: 0.7,
                plasmaStorms: 0.5,
                orbitalBombardment: 0.4,
                toxicClouds: 0.4,
                electricalStorms: 0.3,
                ashfall: 0.5,
                nuclearWinter: 0.0
            },
            bombardment: {
                smokeIntensity: 0.9,
                plasmaStorms: 0.3,
                orbitalBombardment: 0.9,
                toxicClouds: 0.6,
                electricalStorms: 0.2,
                ashfall: 0.7,
                nuclearWinter: 0.1
            },
            apocalypse: {
                smokeIntensity: 1.0,
                plasmaStorms: 0.8,
                orbitalBombardment: 1.0,
                toxicClouds: 0.8,
                electricalStorms: 0.7,
                ashfall: 0.9,
                nuclearWinter: 0.3
            },
            nuclear: {
                smokeIntensity: 0.6,
                plasmaStorms: 0.2,
                orbitalBombardment: 0.4,
                toxicClouds: 0.3,
                electricalStorms: 0.8,
                ashfall: 0.4,
                nuclearWinter: 1.0
            },
            aftermath: {
                smokeIntensity: 0.5,
                plasmaStorms: 0.1,
                orbitalBombardment: 0.1,
                toxicClouds: 0.7,
                electricalStorms: 0.2,
                ashfall: 0.8,
                nuclearWinter: 0.6
            }
        };
        
        return states[battlePhase] || states.calm;
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    setBattlePhase(battlePhase) {
        this.transitionToBattle(battlePhase);
    }

    setSmokeIntensity(intensity) {
        this.battleState.smokeIntensity = Math.max(0, Math.min(1, intensity));
    }

    setPlasmaStorms(intensity) {
        this.battleState.plasmaStorms = Math.max(0, Math.min(1, intensity));
    }

    setOrbitalBombardment(intensity) {
        this.battleState.orbitalBombardment = Math.max(0, Math.min(1, intensity));
    }

    setToxicClouds(intensity) {
        this.battleState.toxicClouds = Math.max(0, Math.min(1, intensity));
    }

    setElectricalStorms(intensity) {
        this.battleState.electricalStorms = Math.max(0, Math.min(1, intensity));
    }

    setAshfall(intensity) {
        this.battleState.ashfall = Math.max(0, Math.min(1, intensity));
    }

    setNuclearWinter(intensity) {
        this.battleState.nuclearWinter = Math.max(0, Math.min(1, intensity));
    }

    triggerOrbitalStrike() {
        console.log("Incoming orbital bombardment...");
        this.setBattlePhase('bombardment');
    }

    triggerPlasmaStorm() {
        console.log("Plasma storm incoming...");
        this.setBattlePhase('assault');
    }

    triggerNuclearLaunch() {
        console.log("Nuclear launch detected...");
        this.setBattlePhase('nuclear');
    }

    triggerApocalypse() {
        console.log("Total war unleashed...");
        this.setBattlePhase('apocalypse');
    }

    triggerToxicStorm() {
        console.log("Chemical weapons deployed...");
        this.setToxicClouds(0.8);
    }

    triggerElectricalStorm() {
        console.log("EMP storm incoming...");
        this.setElectricalStorms(0.9);
    }

    ceasefire() {
        console.log("Temporary ceasefire declared...");
        this.setBattlePhase('calm');
    }

    getCurrentBattleState() {
        return { ...this.battleState, time: this.time };
    }

    setOverallIntensity(intensity) {
        const clampedIntensity = Math.max(0, Math.min(1, intensity));
        this.battleState.smokeIntensity *= clampedIntensity;
        this.battleState.plasmaStorms *= clampedIntensity;
        this.battleState.orbitalBombardment *= clampedIntensity;
        this.battleState.toxicClouds *= clampedIntensity;
        this.battleState.electricalStorms *= clampedIntensity;
        this.battleState.ashfall *= clampedIntensity;
        this.battleState.nuclearWinter *= clampedIntensity;
    }

    cycleAllBattlePhases() {
        const sequence = ['calm', 'skirmish', 'assault', 'bombardment', 'apocalypse', 'nuclear', 'aftermath'];
        let currentIndex = 0;
        
        const nextPhase = () => {
            this.setBattlePhase(sequence[currentIndex]);
            currentIndex = (currentIndex + 1) % sequence.length;
            
            setTimeout(nextPhase, 12000);
        };
        
        nextPhase();
    }

    startDayNightCycle() {
        const dayDuration = 180000;
        
        const cycle = () => {
            const timeOfDay = (Date.now() % dayDuration) / dayDuration;
            
            if (timeOfDay < 0.25) {
                this.setBattlePhase('skirmish');
            } else if (timeOfDay < 0.5) {
                this.setBattlePhase('assault');
            } else if (timeOfDay < 0.75) {
                this.setBattlePhase('bombardment');
            } else {
                this.setBattlePhase('aftermath');
            }
            
            setTimeout(cycle, 5000);
        };
        
        cycle();
    }

    enableRandomWarEvents() {
        const events = [
            () => this.triggerOrbitalStrike(),
            () => this.triggerPlasmaStorm(),
            () => this.triggerToxicStorm(),
            () => this.triggerElectricalStorm(),
            () => this.ceasefire(),
            () => this.setBattlePhase('skirmish')
        ];
        
        const triggerRandomEvent = () => {
            const event = events[Math.floor(Math.random() * events.length)];
            event();
            
            const nextEventTime = Math.random() * 45000 + 15000;
            setTimeout(triggerRandomEvent, nextEventTime);
        };
        
        setTimeout(triggerRandomEvent, 10000);
    }

    resetToPeace() {
        console.log("Resetting to peaceful state...");
        this.transitionToBattle('calm');
    }

    dispose() {
        if (this.skybox) {
            this.skybox.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        console.log("War-torn skybox disposed.");
    }
}

function createWarSkybox(scene, options = {}) {
    const config = {
        autoStart: true,
        initialBattle: 'calm',
        battleSpeed: 'normal',
        intensity: .70,
        enableLogging: false,
        enableRandomEvents: false,
        enableDayNightCycle: false,
        ...options
    };
    
    const warSky = new WarTornPlanetSky(scene);
    
    if (config.initialBattle !== 'calm') {
        setTimeout(() => {
            warSky.setBattlePhase(config.initialBattle);
        }, 2000);
    }
    
    if (config.intensity !== 1.0) {
        warSky.setOverallIntensity(config.intensity);
    }
    
    if (config.enableRandomEvents) {
        warSky.enableRandomWarEvents();
    }
    
    if (config.enableDayNightCycle) {
        warSky.startDayNightCycle();
    }
    
    if (typeof window !== 'undefined') {
        window.warSky = warSky;
        
        if (config.enableLogging) {
            console.log("War-torn skybox created and exposed as window.warSky");
            console.log("Available battle phases:", ['calm', 'skirmish', 'assault', 'bombardment', 'apocalypse', 'nuclear', 'aftermath']);
            console.log("Use warSky.setBattlePhase('phase') to change battle intensity");
            console.log("Use warSky.triggerOrbitalStrike() for instant bombardment");
        }
    }
    
    return warSky;
}

function createWarPresetSkybox(scene, preset = 'random') {
    const presets = {
        peaceful: { initialBattle: 'calm', intensity: 0.3 },
        skirmish: { initialBattle: 'skirmish', intensity: 0.6 },
        warzone: { initialBattle: 'assault', intensity: 0.8 },
        bombardment: { initialBattle: 'bombardment', intensity: 0.9 },
        apocalypse: { initialBattle: 'apocalypse', intensity: 1.0 },
        nuclear: { initialBattle: 'nuclear', intensity: 1.0 },
        aftermath: { initialBattle: 'aftermath', intensity: 0.7 },
        chaos: { 
            initialBattle: ['assault', 'bombardment', 'apocalypse'][Math.floor(Math.random() * 3)], 
            intensity: 0.8 + Math.random() * 0.2,
            enableRandomEvents: true
        },
        daynight: {
            initialBattle: 'calm',
            intensity: 0.8,
            enableDayNightCycle: true
        },
        random: { 
            initialBattle: ['skirmish', 'assault', 'bombardment'][Math.floor(Math.random() * 3)], 
            intensity: 0.6 + Math.random() * 0.4 
        }
    };
    
    const config = presets[preset] || presets.random;
    return createWarSkybox(scene, { ...config, enableLogging: true });
}

function createWarScenario(scene, scenario) {
    const scenarios = {
        'planetary-invasion': {
            phases: [
                { phase: 'calm', duration: 10000 },
                { phase: 'skirmish', duration: 15000 },
                { phase: 'assault', duration: 20000 },
                { phase: 'bombardment', duration: 25000 },
                { phase: 'apocalypse', duration: 30000 },
                { phase: 'aftermath', duration: 20000 }
            ]
        },
        'nuclear-war': {
            phases: [
                { phase: 'skirmish', duration: 8000 },
                { phase: 'assault', duration: 12000 },
                { phase: 'nuclear', duration: 40000 },
                { phase: 'aftermath', duration: 60000 }
            ]
        },
        'siege-warfare': {
            phases: [
                { phase: 'bombardment', duration: 30000 },
                { phase: 'assault', duration: 20000 },
                { phase: 'bombardment', duration: 25000 },
                { phase: 'aftermath', duration: 15000 }
            ]
        }
    };
    
    const warSky = createWarSkybox(scene, { enableLogging: true });
    
    if (scenarios[scenario]) {
        let phaseIndex = 0;
        const phases = scenarios[scenario].phases;
        
        const nextPhase = () => {
            const currentPhase = phases[phaseIndex];
            console.log(`War scenario: ${scenario} - Phase: ${currentPhase.phase}`);
            warSky.setBattlePhase(currentPhase.phase);
            
            phaseIndex = (phaseIndex + 1) % phases.length;
            setTimeout(nextPhase, currentPhase.duration);
        };
        
        setTimeout(nextPhase, 2000);
    }
    
    return warSky;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        WarTornPlanetSky, 
        createWarSkybox, 
        createWarPresetSkybox,
        createWarScenario
    };
} else if (typeof window !== 'undefined') {
    window.WarTornPlanetSky = WarTornPlanetSky;
    window.createWarSkybox = createWarSkybox;
    window.createWarPresetSkybox = createWarPresetSkybox;
    window.createWarScenario = createWarScenario;
}