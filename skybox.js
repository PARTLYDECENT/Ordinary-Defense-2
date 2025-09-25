// Procedural Backrooms Skybox System for Babylon.js
// Natively uses 'WarSkybox' and 'createWarSkybox' for direct compatibility.

class WarSkybox {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
        this.material = null;
        this.time = 0;

        // State variables are repurposed for Backrooms effects.
        this.state = {
            flickerIntensity: 0.7,      // Formerly nebulaPulsation
            wallPatternIntensity: 0.8,  // Formerly crystallineFormations
            glitchIntensity: 0.2,       // Formerly interdimensionalPortals
            hazeDensity: 0.4,           // Formerly cosmicAnomalies
            stainIntensity: 0.6,        // Formerly plasmaClouds
            shadowIntensity: 0.5,       // Formerly energyFields
            voidRifts: 0.0,
            realityWarp: 0.1,           // Formerly quantumFluctuations
            chromaticAberration: 0.1,
            temporalDistortion: 0.0,
            gravitationalLensing: 0.0,
            overallBrightness: 0.9,     // Formerly atmosphericDensity
            weather: 'Level0_Quiet',
            phase: 'stable'
        };

        this.init();
        this.startAnimation();
    }

    init() {
        this.skybox = BABYLON.MeshBuilder.CreateSphere("backroomsSkybox", {
            diameter: 2000.0,
            segments: 128
        }, this.scene);

        this.createBackroomsShaderMaterial();
        this.skybox.material = this.material;
        this.skybox.infiniteDistance = true;
        this.startCycle();
    }

    createBackroomsShaderMaterial() {
        const vertexShader = `
            precision highp float;
            attribute vec3 position;
            uniform mat4 worldViewProjection;
            varying vec3 vPosition;

            void main(void) {
                vPosition = position;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;

            varying vec3 vPosition;
            uniform vec3 cameraPosition;
            uniform float time;

            // --- REPURPOSED UNIFORMS FOR BACKROOMS ---
            uniform float nebulaPulsation;      // flickerIntensity
            uniform float crystallineFormations;// wallPatternIntensity
            uniform float interdimensionalPortals;// glitchIntensity
            uniform float cosmicAnomalies;      // hazeDensity
            uniform float plasmaClouds;         // stainIntensity
            uniform float energyFields;         // shadowIntensity
            uniform float quantumFluctuations;  // realityWarp
            uniform float atmosphericDensity;   // overallBrightness

            #define MAX_STEPS 100
            #define MAX_DIST 100.0
            #define SURF_DIST 0.001

            // --- COLOR PALETTE ---
            #define WALL_COLOR vec3(0.9, 0.8, 0.5)
            #define FLOOR_COLOR vec3(0.6, 0.5, 0.3)
            #define CEILING_COLOR vec3(0.7)
            #define LIGHT_COLOR vec3(1.0, 1.0, 0.85)

            // --- NOISE FUNCTIONS ---
            float hash(float n) { return fract(sin(n) * 43758.5453); }
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f*f*(3.0-2.0*f);
                float a = hash(i.x + i.y*57.0);
                float b = hash(i.x + 1.0 + i.y*57.0);
                float c = hash(i.x + (i.y+1.0)*57.0);
                float d = hash(i.x + 1.0 + (i.y+1.0)*57.0);
                return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
            }
            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                for (int i=0; i<4; i++) {
                    v += a * noise(p);
                    p *= 2.0;
                    a *= 0.5;
                }
                return v;
            }

            // --- SDF (Signed Distance Function) FOR THE SCENE ---
            float sdf(vec3 p) {
                p.xz += sin(p.y * 0.5 + time) * quantumFluctuations * 0.2;
                p.y += cos(length(p.xz) * 0.2) * quantumFluctuations * 0.1;
                vec3 q = mod(p, 8.0) - 4.0;
                vec3 d = abs(q) - vec3(4.0, 2.5, 4.0);
                float room = length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
                float pillar = length(q.xz - vec2(2.5, 2.5)) - 0.5;
                pillar = min(pillar, length(q.xz - vec2(-2.5, 2.5)) - 0.5);
                pillar = min(pillar, length(q.xz - vec2(2.5, -2.5)) - 0.5);
                pillar = min(pillar, length(q.xz - vec2(-2.5, -2.5)) - 0.5);
                return min(room, pillar);
            }

            vec3 getNormal(vec3 p) {
                vec2 e = vec2(0.001, 0.0);
                return normalize(vec3(
                    sdf(p + e.xyy) - sdf(p - e.xyy),
                    sdf(p + e.yxy) - sdf(p - e.yxy),
                    sdf(p + e.yyx) - sdf(p - e.yyx)
                ));
            }

            // --- RAYMARCHING ---
            float rayMarch(vec3 ro, vec3 rd) {
                float d = 0.0;
                for (int i = 0; i < MAX_STEPS; i++) {
                    vec3 p = ro + rd * d;
                    float ds = sdf(p);
                    d += ds;
                    if (d > MAX_DIST || ds < SURF_DIST) break;
                }
                return d;
            }

            void main(void) {
                vec3 dir = normalize(vPosition);
                vec3 ro = cameraPosition;
                vec3 rd = dir;
                rd.xz += (noise(rd.xz * 50.0 + time * 20.0) - 0.5) * interdimensionalPortals * 0.02;
                float d = rayMarch(ro, rd);
                vec3 col = vec3(0.0);

                if (d < MAX_DIST) {
                    vec3 p = ro + rd * d;
                    vec3 n = getNormal(p);
                    vec3 materialColor;
                    if (n.y > 0.95) { materialColor = CEILING_COLOR; } 
                    else if (n.y < -0.95) { 
                        materialColor = FLOOR_COLOR;
                        materialColor *= 0.8 + 0.2 * fbm(p.xz * 2.0);
                    } else { 
                        materialColor = WALL_COLOR;
                        float pattern = mix(0.9, 1.0, step(0.5, fract(fbm(p.xz * 0.5) * 5.0)));
                        pattern *= mix(0.95, 1.0, step(0.5, fract(p.y * 3.0)));
                        materialColor *= pattern * crystallineFormations + (1.0 - crystallineFormations);
                    }
                    vec3 lightPos = floor(p/8.0)*8.0 + vec3(0.0, 2.4, 0.0);
                    vec3 lightDir = normalize(lightPos - p);
                    float flicker = hash(floor(time * 10.0) + lightPos.x * 13.0 + lightPos.z * 29.0);
                    flicker = mix(1.0, flicker, nebulaPulsation);
                    float buzz = 0.95 + (hash(time * 50.0) - 0.5) * 0.1 * nebulaPulsation;
                    float diffuse = max(0.0, dot(n, lightDir)) * flicker * buzz;
                    float ao = clamp(sdf(p + n * 0.2) * 2.0, 0.0, 1.0);
                    float shadow = rayMarch(p + n * 0.01, lightDir) < length(lightPos - p) ? 0.0 : 1.0;
                    shadow = mix(shadow, 1.0, 1.0 - energyFields);
                    vec3 finalLight = (diffuse * shadow * ao) * LIGHT_COLOR;
                    col = materialColor * finalLight * atmosphericDensity;
                    float stains = fbm(p.xz * 0.3 + p.y) * fbm(p.yz * 0.5);
                    stains = smoothstep(0.5, 0.8, stains);
                    col = mix(col, col * 0.3, stains * plasmaClouds);
                }
                col = mix(col, vec3(0.1, 0.1, 0.05), 1.0 - exp(-d * 0.05 * (1.0 + cosmicAnomalies * 5.0)));
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;
        BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;
        
        this.material = new BABYLON.ShaderMaterial("warShaderMaterial", this.scene, {
            vertex: "custom",
            fragment: "custom"
        }, {
            attributes: ["position"],
            uniforms: [
                "world", "worldViewProjection", "cameraPosition", "time",
                "nebulaPulsation", "crystallineFormations", "interdimensionalPortals",
                "cosmicAnomalies", "plasmaClouds", "energyFields", "voidRifts",
                "quantumFluctuations", "chromaticAberration", "temporalDistortion",
                "gravitationalLensing", "darkMatterClouds", "stellarNurseries",
                "wormholeActivity", "alienStructures", "bioLuminescence", "atmosphericDensity"
            ]
        });

        this.material.backFaceCulling = false;
    }

    startAnimation() {
        this.scene.registerBeforeRender(() => {
            this.time += this.scene.getEngine().getDeltaTime() / 1000.0;
            if (this.material) {
                this.material.setFloat("time", this.time);
                this.material.setVector3("cameraPosition", this.scene.activeCamera.position);
                this.material.setFloat("nebulaPulsation", this.state.flickerIntensity);
                this.material.setFloat("crystallineFormations", this.state.wallPatternIntensity);
                this.material.setFloat("interdimensionalPortals", this.state.glitchIntensity);
                this.material.setFloat("cosmicAnomalies", this.state.hazeDensity);
                this.material.setFloat("plasmaClouds", this.state.stainIntensity);
                this.material.setFloat("energyFields", this.state.shadowIntensity);
                this.material.setFloat("quantumFluctuations", this.state.realityWarp);
                this.material.setFloat("atmosphericDensity", this.state.overallBrightness);
            }
        });
    }

    startCycle() {
        const cycleDuration = 45000;
        const cycle = () => {
            if (this.state.phase === 'override') return;
            const cycleTime = (Date.now() % cycleDuration) / cycleDuration;
            if (cycleTime < 0.3) { this.setWeather('Level0_Quiet'); } 
            else if (cycleTime < 0.5) { this.setWeather('Flicker_Event'); } 
            else if (cycleTime < 0.7) { this.setWeather('Entity_Presence'); } 
            else { this.setWeather('Level0_Quiet'); }
        };
        setInterval(cycle, 10000);
    }

    transitionToState(targetWeather, duration = 5000) {
        const startState = { ...this.state };
        const targetState = this.getWeatherState(targetWeather);
        const startTime = Date.now();
        this.state.phase = 'transitioning';

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);
            const easedProgress = this.easeInOutCubic(progress);
            for (const key in targetState) {
                if (typeof targetState[key] === 'number' && typeof startState[key] === 'number') {
                    this.state[key] = this.lerp(startState[key], targetState[key], easedProgress);
                } else {
                    this.state[key] = targetState[key];
                }
            }
            if (progress < 1) { requestAnimationFrame(animate); } 
            else { this.state.phase = 'stable'; }
        };
        requestAnimationFrame(animate);
    }

    getWeatherState(weather) {
        const states = {
            Level0_Quiet: { flickerIntensity: 0.5, wallPatternIntensity: 0.8, glitchIntensity: 0.1, hazeDensity: 0.4, stainIntensity: 0.6, shadowIntensity: 0.5, realityWarp: 0.0, overallBrightness: 2.5, },
            Flicker_Event: { flickerIntensity: 1.0, wallPatternIntensity: 0.8, glitchIntensity: 0.3, hazeDensity: 0.5, stainIntensity: 0.7, shadowIntensity: 0.9, realityWarp: 0.1, overallBrightness: 2.5, },
            Entity_Presence: { flickerIntensity: 0.2, wallPatternIntensity: 0.4, glitchIntensity: 0.9, hazeDensity: 0.8, stainIntensity: 0.9, shadowIntensity: 1.0, realityWarp: 0.8, overallBrightness: 2.5, },
            Structural_Collapse: { flickerIntensity: 1.0, wallPatternIntensity: 0.1, glitchIntensity: 1.0, hazeDensity: 1.0, stainIntensity: 1.0, shadowIntensity: 1.0, realityWarp: 1.0, overallBrightness: 2.5, }
        };
        return states[weather] || states.Level0_Quiet;
    }

    lerp(a, b, t) { return a + (b - a) * t; }
    easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    // --- PUBLIC API ---
    setWeather(weather) {
        this.transitionToState(weather);
        this.state.weather = weather;
    }

    triggerEvent(eventName) {
        const events = {
            'entity': { state: 'Entity_Presence', duration: 15000, transition: 2000, msg: "Backrooms Event: Entity Presence Detected..." },
            'collapse': { state: 'Structural_Collapse', duration: 20000, transition: 4000, msg: "Backrooms Event: Structural Collapse Imminent..." },
            'flicker': { state: 'Flicker_Event', duration: 10000, transition: 1000, msg: "Backrooms Event: Severe Flicker Event..." }
        };
        const event = events[eventName];
        if (event) {
            console.log(event.msg);
            this.state.phase = 'override';
            this.transitionToState(event.state, event.transition);
            setTimeout(() => this.state.phase = 'stable', event.duration);
        }
    }
    
    restoreBalance() {
        console.log("Restoring reality to baseline...");
        this.state.phase = 'override';
        this.setWeather('Level0_Quiet');
        setTimeout(() => this.state.phase = 'stable', 5000);
    }

    dispose() {
        if (this.skybox) this.skybox.dispose();
        if (this.material) this.material.dispose();
        console.log("WarSkybox (Backrooms) disposed.");
    }
}


// --- FACTORY FUNCTIONS ---
function createWarSkybox(scene, options = {}) {
    const config = {
        autoStart: true,
        initialWeather: 'Level0_Quiet',
        intensity: 1.0,
        enableLogging: false,
        enableWeatherCycle: true,
        ...options
    };

    const warSky = new WarSkybox(scene);
    
    if (config.initialWeather !== 'Level0_Quiet') {
        setTimeout(() => warSky.setWeather(config.initialWeather), 1000);
    }

    if(config.enableWeatherCycle) {
        warSky.startCycle();
    }
    
    if (typeof window !== 'undefined') {
        window.warSky = warSky; // For easy debugging
        if (config.enableLogging) {
            console.log("WarSkybox created and exposed as window.warSky");
            console.log("Available 'weathers':", ['Level0_Quiet', 'Flicker_Event', 'Entity_Presence', 'Structural_Collapse']);
            console.log("Use warSky.setWeather('weather_name') to change the environment.");
        }
    }
    return warSky;
}