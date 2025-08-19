// Procedural Space Weather Skybox System for Babylon.js

class ProceduralSpaceSky {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.material = null;
        this.time = 0;
        this.weatherState = {
            nebulaDensity: 0.3,
            starBrightness: 0.8,
            cosmicStormIntensity: 0.0,
            colorShift: 0.0,
            weatherType: 'clear' // 'clear', 'nebular', 'storm', 'aurora'
        };
        
        this.init();
        this.startAnimation();
    }

    init() {
        // Create skybox geometry
        this.skybox = BABYLON.MeshBuilder.CreateSphere("spaceSkybox", {
            diameter: 2000.0,
            segments: 32
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
        // Vertex shader
        const vertexShader = `
            precision highp float;
            
            attribute vec3 position;
            attribute vec3 normal;
            
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform vec3 cameraPosition;
            uniform float time;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            
            void main(void) {
                vec4 worldPos = world * vec4(position, 1.0);
                vPositionW = vec3(worldPos);
                vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
                vDirectionW = normalize(vPositionW - cameraPosition);
                
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }
        `;

        // Fragment shader with procedural space effects
        const fragmentShader = `
            precision highp float;
            
            varying vec3 vPositionW;
            varying vec3 vNormalW;
            varying vec3 vDirectionW;
            
            uniform float time;
            uniform float nebulaDensity;
            uniform float starBrightness;
            uniform float cosmicStormIntensity;
            uniform float colorShift;
            uniform vec3 cameraPosition;
            
            // Noise functions
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 6; i++) {
                    value += amplitude * noise(st);
                    st *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            
            // 3D noise for volumetric effects
            float noise3D(vec3 p) {
                return fbm(p.xy) * fbm(p.yz) * fbm(p.xz);
            }
            
            // Star field generation
            float stars(vec2 uv, float density) {
                vec2 grid = floor(uv * density);
                vec2 gridUv = fract(uv * density);
                
                float star = 0.0;
                for(int i = -1; i <= 1; i++) {
                    for(int j = -1; j <= 1; j++) {
                        vec2 offset = vec2(float(i), float(j));
                        vec2 cellGrid = grid + offset;
                        vec2 cellCenter = vec2(0.5) + 0.4 * (vec2(random(cellGrid), random(cellGrid + vec2(1.0))) - 0.5);
                        vec2 cellUv = gridUv - offset;
                        
                        float dist = length(cellUv - cellCenter);
                        float brightness = random(cellGrid + vec2(2.0));
                        
                        if(brightness > 0.8) {
                            float twinkle = 0.5 + 0.5 * sin(time * 3.0 + brightness * 20.0);
                            star += (1.0 - smoothstep(0.0, 0.02, dist)) * brightness * twinkle;
                        }
                    }
                }
                return star;
            }
            
            // Nebula generation
            vec3 nebula(vec3 dir, float time) {
                vec3 p = dir * 10.0;
                
                // Multi-layer nebula
                float n1 = noise3D(p + time * 0.1);
                float n2 = noise3D(p * 2.0 + time * 0.15);
                float n3 = noise3D(p * 4.0 - time * 0.05);
                
                float nebulaMask = n1 * 0.6 + n2 * 0.3 + n3 * 0.1;
                nebulaMask = smoothstep(0.3, 0.8, nebulaMask);
                
                // Nebula colors
                vec3 color1 = vec3(0.2, 0.1, 0.8); // Deep blue
                vec3 color2 = vec3(0.8, 0.2, 0.4); // Pink
                vec3 color3 = vec3(0.1, 0.6, 0.3); // Green
                
                vec3 nebulaColor = mix(color1, color2, sin(time * 0.5 + n1 * 5.0) * 0.5 + 0.5);
                nebulaColor = mix(nebulaColor, color3, n2);
                
                return nebulaColor * nebulaMask * nebulaDensity;
            }
            
            // Cosmic storm effects
            vec3 cosmicStorm(vec3 dir, float time, float intensity) {
                if(intensity < 0.01) return vec3(0.0);
                
                vec3 p = dir * 5.0;
                float storm = noise3D(p + time * 0.8);
                storm = pow(storm, 2.0);
                
                // Lightning-like effects
                float lightning = 0.0;
                if(storm > 0.7) {
                    lightning = sin(time * 50.0 + storm * 10.0) * 0.5 + 0.5;
                    lightning = pow(lightning, 10.0);
                }
                
                vec3 stormColor = vec3(1.0, 0.8, 0.2) * lightning;
                stormColor += vec3(0.5, 0.1, 0.8) * storm * 0.3;
                
                return stormColor * intensity;
            }
            
            // Aurora effects
            vec3 aurora(vec3 dir, float time) {
                float y = dir.y;
                if(y < 0.1) return vec3(0.0);
                
                vec2 uv = vec2(atan(dir.z, dir.x) * 0.5, y);
                
                float wave1 = sin(uv.x * 10.0 + time * 2.0) * 0.1;
                float wave2 = sin(uv.x * 20.0 - time * 1.5) * 0.05;
                float auroraY = uv.y + wave1 + wave2;
                
                float auroral = smoothstep(0.2, 0.4, auroraY) * smoothstep(0.8, 0.6, auroraY);
                auroral *= fbm(uv * 5.0 + time * 0.3);
                
                vec3 auroraColor = vec3(0.2, 1.0, 0.3); // Green
                auroraColor = mix(auroraColor, vec3(0.8, 0.2, 1.0), sin(time + uv.x * 5.0)); // Purple
                
                return auroraColor * auroral * 0.8;
            }
            
            void main(void) {
                vec3 dir = normalize(vDirectionW);
                
                // Base space color (deep space)
                vec3 baseColor = vec3(0.01, 0.02, 0.05);
                
                // Add stars
                vec2 starUV = vec2(atan(dir.z, dir.x), asin(dir.y));
                float starField = stars(starUV * 50.0, 200.0);
                vec3 starColor = vec3(1.0) * starField * starBrightness;
                
                // Add smaller background stars
                starField += stars(starUV * 100.0, 500.0) * 0.3;
                starColor += vec3(0.8, 0.9, 1.0) * stars(starUV * 200.0, 1000.0) * 0.1;
                
                // Add nebula
                vec3 nebulaColor = nebula(dir, time);
                
                // Add cosmic storm
                vec3 stormColor = cosmicStorm(dir, time, cosmicStormIntensity);
                
                // Add aurora (only visible in certain directions)
                vec3 auroraColor = aurora(dir, time);
                
                // Combine all effects
                vec3 finalColor = baseColor + starColor + nebulaColor + stormColor + auroraColor;
                
                // Color shift for different weather moods
                finalColor = mix(finalColor, finalColor.gbr, colorShift * 0.3);
                
                // Atmospheric scattering effect
                float atmosphere = pow(max(0.0, dir.y + 0.2), 0.5) * 0.1;
                finalColor += vec3(0.1, 0.2, 0.4) * atmosphere;
                
                // HDR tone mapping
                finalColor = finalColor / (finalColor + vec3(1.0));
                finalColor = pow(finalColor, vec2(1.0/2.2).xxx);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Create shader material
        this.material = new BABYLON.ShaderMaterial("spaceShader", this.scene, {
            vertex: "custom",
            fragment: "custom"
        }, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldView", "worldViewProjection", 
                      "time", "nebulaDensity", "starBrightness", 
                      "cosmicStormIntensity", "colorShift", "cameraPosition"]
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
        this.material.setFloat("nebulaDensity", this.weatherState.nebulaDensity);
        this.material.setFloat("starBrightness", this.weatherState.starBrightness);
        this.material.setFloat("cosmicStormIntensity", this.weatherState.cosmicStormIntensity);
        this.material.setFloat("colorShift", this.weatherState.colorShift);
        this.material.setVector3("cameraPosition", this.scene.activeCamera.position);
    }

    startAnimation() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.time += this.scene.getEngine().getDeltaTime() / 1000.0;
            this.updateUniforms();
        });
    }

    startWeatherCycle() {
        // Change weather every 30-60 seconds
        setInterval(() => {
            this.changeWeather();
        }, Math.random() * 30000 + 30000);
    }

    changeWeather() {
        const weatherTypes = ['clear', 'nebular', 'storm', 'aurora'];
        const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        console.log(`Weather changing to: ${newWeather}`);
        this.transitionToWeather(newWeather);
    }

    transitionToWeather(weatherType) {
        const duration = 5000; // 5 seconds transition
        const startTime = Date.now();
        
        const startState = { ...this.weatherState };
        const targetState = this.getWeatherState(weatherType);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutQuad(progress);
            
            // Interpolate between start and target states
            this.weatherState.nebulaDensity = this.lerp(startState.nebulaDensity, targetState.nebulaDensity, eased);
            this.weatherState.starBrightness = this.lerp(startState.starBrightness, targetState.starBrightness, eased);
            this.weatherState.cosmicStormIntensity = this.lerp(startState.cosmicStormIntensity, targetState.cosmicStormIntensity, eased);
            this.weatherState.colorShift = this.lerp(startState.colorShift, targetState.colorShift, eased);
            this.weatherState.weatherType = weatherType;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    getWeatherState(weatherType) {
        const states = {
            clear: {
                nebulaDensity: 0.2,
                starBrightness: 1.0,
                cosmicStormIntensity: 0.0,
                colorShift: 0.0
            },
            nebular: {
                nebulaDensity: 0.8,
                starBrightness: 0.3,
                cosmicStormIntensity: 0.0,
                colorShift: 0.2
            },
            storm: {
                nebulaDensity: 0.4,
                starBrightness: 0.1,
                cosmicStormIntensity: 0.9,
                colorShift: 0.8
            },
            aurora: {
                nebulaDensity: 0.1,
                starBrightness: 0.6,
                cosmicStormIntensity: 0.0,
                colorShift: -0.3
            }
        };
        
        return states[weatherType] || states.clear;
    }

    // Utility functions
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    // Public API methods
    setWeatherType(weatherType) {
        this.transitionToWeather(weatherType);
    }

    setStormIntensity(intensity) {
        this.weatherState.cosmicStormIntensity = Math.max(0, Math.min(1, intensity));
    }

    setNebulaDensity(density) {
        this.weatherState.nebulaDensity = Math.max(0, Math.min(1, density));
    }

    setStarBrightness(brightness) {
        this.weatherState.starBrightness = Math.max(0, Math.min(2, brightness));
    }
}

// Updated createSkybox function
function createSkybox(scene) {
    // Create the procedural space sky
    const spaceSky = new ProceduralSpaceSky(scene);
    
    // Optional: Add manual weather control
    window.spaceSky = spaceSky; // For debugging/manual control
    
    // Example of manual weather changes (remove if not needed)
    /*
    setTimeout(() => spaceSky.setWeatherType('storm'), 10000);
    setTimeout(() => spaceSky.setWeatherType('nebular'), 20000);
    setTimeout(() => spaceSky.setWeatherType('aurora'), 30000);
    */
    
    return spaceSky;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProceduralSpaceSky, createSkybox };
}