/**
 * Enhanced Babylon.js Weather System - Wild Spectacle Edition
 * A comprehensive weather system with advanced visual effects and dynamic behaviors
 */

class ExtendedWeatherSystem {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.activeWeatherType = 'clear';
        this.intensity = 0.5;
        this.isTransitioning = false;
        this.transitionDuration = 3000; // 3 seconds
        
        // Core weather systems
        this.weatherSystems = new Map();
        this.lightingSystems = new Map();
        this.audioSystems = new Map();
        this.environmentalEffects = new Map();
        
        // Performance monitoring
        this.performanceMonitor = {
            targetFPS: 60,
            currentFPS: 60,
            adaptiveQuality: true,
            qualityLevel: 1.0
        };
        
        // Advanced effects
        this.postProcessing = null;
        this.volumetricLighting = null;
        this.dynamicSkybox = null;
        this.windSystem = null;
        
        // Intervals and timers
        this.intervals = new Map();
        this.animationFrames = new Map();
        
        this.initializeEnhancedSystems();
        this.setupPerformanceMonitoring();
        this.startWeatherCycle();
    }

    initializeEnhancedSystems() {
        this.initPostProcessing();
        this.initVolumetricLighting();
        this.initDynamicSkybox();
        this.initWindSystem();
        this.initWeatherSystems();
        this.initLightingSystems();
        this.initEnvironmentalEffects();
    }

    initPostProcessing() {
        // Enhanced post-processing pipeline
        this.postProcessing = {
            bloom: new BABYLON.BloomEffect(this.scene, 1.0, 2.0, 0.5, 512),
            // colorGrading: new BABYLON.ColorGradingPostProcess("colorGrading", 1.0, null, null, this.engine),
            // motionBlur: new BABYLON.MotionBlurPostProcess("motionBlur", this.scene, 1.0, null),
            // chromaticAberration: new BABYLON.ChromaticAberrationPostProcess("chromatic", 1.0, null, this.engine),
            depthOfField: null // Will be initialized when needed
        };
        
        // Configure color grading for different weather moods
        this.weatherColorGrades = {
            clear: { exposure: 0.0, contrast: 1.0, saturation: 1.0 },
            storm: { exposure: -0.5, contrast: 1.3, saturation: 0.7 },
            bloodRain: { exposure: -0.3, contrast: 1.5, saturation: 0.8 },
            cosmic: { exposure: 0.2, contrast: 1.2, saturation: 1.4 },
            apocalyptic: { exposure: -0.8, contrast: 1.8, saturation: 0.3 }
        };
    }

    initVolumetricLighting() {
        // Volumetric lighting system for god rays and atmospheric effects
        this.volumetricLighting = {
            enabled: true,
            density: 0.1,
            decay: 0.95,
            weight: 0.3,
            samples: 50
        };
        
        // Create volumetric light shaders
        this.createVolumetricShaders();
    }

    createVolumetricShaders() {
        // Custom volumetric lighting shader
        const volumetricVertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            uniform mat4 worldViewProjection;
            varying vec2 vUV;
            
            void main() {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                vUV = uv;
            }
        `;
        
        const volumetricFragmentShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform sampler2D depthSampler;
            uniform vec3 lightPosition;
            uniform float density;
            uniform float decay;
            uniform float weight;
            uniform int samples;
            
            void main() {
                vec2 deltaTextCoord = vec2(vUV - lightPosition.xy);
                vec2 textCoo = vUV;
                deltaTextCoord *= 1.0 / float(samples) * density;
                float illuminationDecay = 1.0;
                vec4 color = vec4(0.0);
                
                for(int i = 0; i < 50; i++) {
                    if(i >= samples) break;
                    textCoo -= deltaTextCoord;
                    vec4 sample = texture2D(textureSampler, textCoo);
                    sample *= illuminationDecay * weight;
                    color += sample;
                    illuminationDecay *= decay;
                }
                
                gl_FragColor = color;
            }
        `;
        
        BABYLON.Effect.ShadersStore["volumetricVertexShader"] = volumetricVertexShader;
        BABYLON.Effect.ShadersStore["volumetricFragmentShader"] = volumetricFragmentShader;
    }

    initDynamicSkybox() {
        // Dynamic skybox that changes with weather
        this.dynamicSkybox = {
            current: null,
            textures: new Map(),
            transitionSpeed: 0.02
        };
        
        // Load skybox textures for different weather conditions
        this.loadSkyboxTextures();
    }

    loadSkyboxTextures() {
        const skyboxConfigs = {
            clear: { 
                url: "https://playground.babylonjs.com/textures/skybox",
                tint: new BABYLON.Color3(1, 1, 1)
            },
            storm: { 
                url: "https://playground.babylonjs.com/textures/skybox2",
                tint: new BABYLON.Color3(0.3, 0.3, 0.4)
            },
            cosmic: { 
                url: "https://playground.babylonjs.com/textures/skybox3",
                tint: new BABYLON.Color3(0.8, 0.4, 1.0)
            },
            apocalyptic: { 
                url: "https://playground.babylonjs.com/textures/skybox4",
                tint: new BABYLON.Color3(0.8, 0.3, 0.1)
            }
        };
        
        Object.entries(skyboxConfigs).forEach(([weather, config]) => {
            const skybox = BABYLON.MeshBuilder.CreateSphere("skybox_" + weather, {diameter: 1000}, this.scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMat_" + weather, this.scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.diffuseColor = config.tint;
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;
            skybox.setEnabled(false);
            
            this.dynamicSkybox.textures.set(weather, skybox);
        });
    }

    initWindSystem() {
        // Advanced wind system affecting all particles and objects
        this.windSystem = {
            direction: new BABYLON.Vector3(1, 0, 0),
            strength: 0.5,
            turbulence: 0.3,
            gustFrequency: 0.1,
            gustStrength: 2.0,
            affectedObjects: new Set()
        };
        
        this.startWindSimulation();
    }

    startWindSimulation() {
        let time = 0;
        const windUpdate = () => {
            time += 0.016; // ~60fps
            
            // Calculate wind with turbulence and gusts
            const baseWind = this.windSystem.strength;
            const turbulence = Math.sin(time * 3) * this.windSystem.turbulence;
            const gust = Math.sin(time * this.windSystem.gustFrequency) * this.windSystem.gustStrength;
            
            const currentWindStrength = baseWind + turbulence + (gust > 0 ? gust : 0);
            
            // Update wind direction with slight variation
            const directionVariation = Math.sin(time * 0.5) * 0.2;
            this.windSystem.direction.x = Math.cos(directionVariation);
            this.windSystem.direction.z = Math.sin(directionVariation);
            
            // Apply wind to all affected systems
            this.applyWindToSystems(currentWindStrength);
            
            this.animationFrames.set('wind', requestAnimationFrame(windUpdate));
        };
        
        windUpdate();
    }

    applyWindToSystems(windStrength) {
        // Apply wind to particle systems
        this.weatherSystems.forEach((system, name) => {
            if (system.isStarted && system.isStarted()) {
                const windForce = this.windSystem.direction.clone().scale(windStrength);
                if (system.gravity) {
                    system.gravity.addInPlace(windForce);
                }
            }
        });
        
        // Apply wind to environmental objects
        this.windSystem.affectedObjects.forEach(obj => {
            if (obj.position) {
                const sway = Math.sin(Date.now() * 0.001 + obj.uniqueId) * windStrength * 0.1;
                obj.rotation.z = sway;
            }
        });
    }

    initWeatherSystems() {
        // Enhanced particle systems with GPU acceleration where possible
        this.initEnhancedRain();
        this.initCosmicStorm();
        this.initFireTornado();
        this.initDimensionalRift();
        this.initApocalypticFallout();
        this.initElementalChaos();
        this.initVolumetricFog();
        this.initMeteorShower();
    }

    initEnhancedRain() {
        const rainSystem = new BABYLON.ParticleSystem("enhancedRain", 15000, this.scene);
        rainSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        // Enhanced rain configuration
        rainSystem.emitter = new BABYLON.Vector3(0, 150, 0);
        rainSystem.minEmitBox = new BABYLON.Vector3(-400, 0, -400);
        rainSystem.maxEmitBox = new BABYLON.Vector3(400, 0, 400);
        
        // Realistic rain colors with variation
        rainSystem.color1 = new BABYLON.Color4(0.6, 0.7, 0.9, 0.8);
        rainSystem.color2 = new BABYLON.Color4(0.3, 0.4, 0.6, 0.9);
        rainSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.2, 0);
        
        rainSystem.minSize = 0.05;
        rainSystem.maxSize = 0.2;
        rainSystem.minLifeTime = 1.5;
        rainSystem.maxLifeTime = 3.0;
        rainSystem.emitRate = 12000;
        
        // Enhanced physics
        rainSystem.gravity = new BABYLON.Vector3(0, -45, 0);
        rainSystem.direction1 = new BABYLON.Vector3(-3, -1, -1);
        rainSystem.direction2 = new BABYLON.Vector3(3, -1, 1);
        
        rainSystem.minEmitPower = 30;
        rainSystem.maxEmitPower = 50;
        rainSystem.updateSpeed = 0.02;
        
        // Add collision detection for ground impact
        this.addRainCollisionEffects(rainSystem);
        
        this.weatherSystems.set('enhancedRain', rainSystem);
    }

    addRainCollisionEffects(rainSystem) {
        // Create splash effects when rain hits surfaces
        const splashSystem = new BABYLON.ParticleSystem("rainSplash", 2000, this.scene);
        splashSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        splashSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        splashSystem.minEmitBox = new BABYLON.Vector3(-200, 0, -200);
        splashSystem.maxEmitBox = new BABYLON.Vector3(200, 0, 200);
        
        splashSystem.color1 = new BABYLON.Color4(0.8, 0.9, 1.0, 0.6);
        splashSystem.color2 = new BABYLON.Color4(0.6, 0.7, 0.8, 0.4);
        splashSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        splashSystem.minSize = 0.1;
        splashSystem.maxSize = 0.3;
        splashSystem.minLifeTime = 0.2;
        splashSystem.maxLifeTime = 0.5;
        splashSystem.emitRate = 1000;
        
        splashSystem.gravity = new BABYLON.Vector3(0, -20, 0);
        splashSystem.direction1 = new BABYLON.Vector3(-2, 2, -2);
        splashSystem.direction2 = new BABYLON.Vector3(2, 4, 2);
        
        this.weatherSystems.set('rainSplash', splashSystem);
    }

    initCosmicStorm() {
        // Cosmic storm with aurora effects and meteor trails
        const cosmicSystem = new BABYLON.ParticleSystem("cosmicStorm", 8000, this.scene);
        cosmicSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        cosmicSystem.emitter = new BABYLON.Vector3(0, 200, 0);
        cosmicSystem.minEmitBox = new BABYLON.Vector3(-500, -50, -500);
        cosmicSystem.maxEmitBox = new BABYLON.Vector3(500, 50, 500);
        
        // Cosmic colors - purples, blues, and stellar whites
        cosmicSystem.color1 = new BABYLON.Color4(0.8, 0.4, 1.0, 0.9);
        cosmicSystem.color2 = new BABYLON.Color4(0.4, 0.8, 1.0, 0.8);
        cosmicSystem.colorDead = new BABYLON.Color4(1.0, 1.0, 1.0, 0);
        
        cosmicSystem.minSize = 0.5;
        cosmicSystem.maxSize = 2.0;
        cosmicSystem.minLifeTime = 3.0;
        cosmicSystem.maxLifeTime = 8.0;
        cosmicSystem.emitRate = 2000;
        
        cosmicSystem.gravity = new BABYLON.Vector3(0, -5, 0);
        cosmicSystem.direction1 = new BABYLON.Vector3(-10, -2, -10);
        cosmicSystem.direction2 = new BABYLON.Vector3(10, -2, 10);
        
        cosmicSystem.minEmitPower = 5;
        cosmicSystem.maxEmitPower = 15;
        cosmicSystem.minAngularSpeed = -2;
        cosmicSystem.maxAngularSpeed = 2;
        
        // Add aurora wave effects
        this.addAuroraEffects();
        
        this.weatherSystems.set('cosmicStorm', cosmicSystem);
    }

    addAuroraEffects() {
        // Create aurora borealis effect with animated waves
        const auroraSystem = new BABYLON.ParticleSystem("aurora", 3000, this.scene);
        auroraSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
        
        auroraSystem.emitter = new BABYLON.Vector3(0, 80, 0);
        auroraSystem.minEmitBox = new BABYLON.Vector3(-300, -20, -50);
        auroraSystem.maxEmitBox = new BABYLON.Vector3(300, 20, 50);
        
        // Aurora colors - greens and blues with transparency
        auroraSystem.color1 = new BABYLON.Color4(0.2, 1.0, 0.4, 0.3);
        auroraSystem.color2 = new BABYLON.Color4(0.4, 0.8, 1.0, 0.2);
        auroraSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        auroraSystem.minSize = 20;
        auroraSystem.maxSize = 50;
        auroraSystem.minLifeTime = 10.0;
        auroraSystem.maxLifeTime = 20.0;
        auroraSystem.emitRate = 100;
        
        auroraSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        auroraSystem.direction1 = new BABYLON.Vector3(-1, 0, 0);
        auroraSystem.direction2 = new BABYLON.Vector3(1, 0, 0);
        
        auroraSystem.minEmitPower = 0.5;
        auroraSystem.maxEmitPower = 2;
        auroraSystem.minAngularSpeed = -0.1;
        auroraSystem.maxAngularSpeed = 0.1;
        
        // Animate aurora waves
        this.animateAurora(auroraSystem);
        
        this.weatherSystems.set('aurora', auroraSystem);
    }

    animateAurora(auroraSystem) {
        let time = 0;
        const auroraAnimation = () => {
            time += 0.016;
            
            // Create wave motion
            const wave1 = Math.sin(time * 0.5) * 30;
            const wave2 = Math.cos(time * 0.3) * 20;
            
            auroraSystem.emitter.y = 80 + wave1;
            auroraSystem.minEmitBox.y = -20 + wave2;
            auroraSystem.maxEmitBox.y = 20 + wave2;
            
            // Color shifting
            const colorShift = (Math.sin(time * 0.2) + 1) * 0.5;
            auroraSystem.color1.g = 0.6 + colorShift * 0.4;
            auroraSystem.color2.b = 0.8 + colorShift * 0.2;
            
            this.animationFrames.set('aurora', requestAnimationFrame(auroraAnimation));
        };
        
        auroraAnimation();
    }

    initFireTornado() {
        // Spectacular fire tornado effect
        const fireSystem = new BABYLON.ParticleSystem("fireTornado", 10000, this.scene);
        fireSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        // Tornado emitter setup
        fireSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        fireSystem.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
        fireSystem.maxEmitBox = new BABYLON.Vector3(2, 0, 2);
        
        // Fire colors - reds, oranges, yellows
        fireSystem.color1 = new BABYLON.Color4(1.0, 0.8, 0.2, 1.0);
        fireSystem.color2 = new BABYLON.Color4(1.0, 0.3, 0.1, 0.9);
        fireSystem.colorDead = new BABYLON.Color4(0.3, 0.1, 0.0, 0);
        
        fireSystem.minSize = 0.5;
        fireSystem.maxSize = 3.0;
        fireSystem.minLifeTime = 2.0;
        fireSystem.maxLifeTime = 5.0;
        fireSystem.emitRate = 5000;
        
        // Tornado physics - spiral upward motion
        fireSystem.gravity = new BABYLON.Vector3(0, 10, 0);
        fireSystem.direction1 = new BABYLON.Vector3(-5, 5, -5);
        fireSystem.direction2 = new BABYLON.Vector3(5, 15, 5);
        
        fireSystem.minEmitPower = 8;
        fireSystem.maxEmitPower = 20;
        fireSystem.minAngularSpeed = -5;
        fireSystem.maxAngularSpeed = 5;
        
        // Add spiral motion
        this.addTornadoSpiral(fireSystem);
        
        this.weatherSystems.set('fireTornado', fireSystem);
    }

    addTornadoSpiral(fireSystem) {
        let angle = 0;
        const spiralAnimation = () => {
            angle += 0.1;
            
            // Create spiral motion for particles
            const radius = 15;
            const spiralX = Math.cos(angle) * radius;
            const spiralZ = Math.sin(angle) * radius;
            
            fireSystem.direction1.x = spiralX - 5;
            fireSystem.direction1.z = spiralZ - 5;
            fireSystem.direction2.x = spiralX + 5;
            fireSystem.direction2.z = spiralZ + 5;
            
            this.animationFrames.set('fireSpiral', requestAnimationFrame(spiralAnimation));
        };
        
        spiralAnimation();
    }

    initDimensionalRift() {
        // Interdimensional portal effect with reality distortion
        const riftSystem = new BABYLON.ParticleSystem("dimensionalRift", 5000, this.scene);
        riftSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        riftSystem.emitter = new BABYLON.Vector3(0, 50, 0);
        riftSystem.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        riftSystem.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        
        // Otherworldly colors - purples, magentas, electric blues
        riftSystem.color1 = new BABYLON.Color4(1.0, 0.2, 1.0, 0.8);
        riftSystem.color2 = new BABYLON.Color4(0.2, 0.8, 1.0, 0.9);
        riftSystem.colorDead = new BABYLON.Color4(0.5, 0, 0.5, 0);
        
        riftSystem.minSize = 0.2;
        riftSystem.maxSize = 4.0;
        riftSystem.minLifeTime = 1.0;
        riftSystem.maxLifeTime = 3.0;
        riftSystem.emitRate = 2000;
        
        // Chaotic motion
        riftSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        riftSystem.direction1 = new BABYLON.Vector3(-20, -10, -20);
        riftSystem.direction2 = new BABYLON.Vector3(20, 10, 20);
        
        riftSystem.minEmitPower = 10;
        riftSystem.maxEmitPower = 30;
        riftSystem.minAngularSpeed = -10;
        riftSystem.maxAngularSpeed = 10;
        
        // Add reality distortion effects
        this.addRealityDistortion();
        
        this.weatherSystems.set('dimensionalRift', riftSystem);
    }

    addRealityDistortion() {
        // Create screen distortion effect
        const distortionPostProcess = new BABYLON.PostProcess("distortion", "distortion", 
            ["time", "strength"], null, 1.0, null, null, this.engine);
        
        let time = 0;
        distortionPostProcess.onApply = (effect) => {
            time += 0.016;
            effect.setFloat("time", time);
            effect.setFloat("strength", 0.02);
        };
        
        // Custom distortion shader
        const distortionShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float time;
            uniform float strength;
            
            void main() {
                vec2 uv = vUV;
                uv.x += sin(uv.y * 10.0 + time * 2.0) * strength;
                uv.y += cos(uv.x * 10.0 + time * 1.5) * strength;
                gl_FragColor = texture2D(textureSampler, uv);
            }
        `;
        
        BABYLON.Effect.ShadersStore["distortionFragmentShader"] = distortionShader;
        
        this.environmentalEffects.set('realityDistortion', distortionPostProcess);
    }

    initApocalypticFallout() {
        // Nuclear fallout with radioactive particles
        const falloutSystem = new BABYLON.ParticleSystem("apocalypticFallout", 12000, this.scene);
        falloutSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        falloutSystem.emitter = new BABYLON.Vector3(0, 120, 0);
        falloutSystem.minEmitBox = new BABYLON.Vector3(-400, 0, -400);
        falloutSystem.maxEmitBox = new BABYLON.Vector3(400, 0, 400);
        
        // Radioactive colors - sickly greens and yellows
        falloutSystem.color1 = new BABYLON.Color4(0.8, 1.0, 0.2, 0.7);
        falloutSystem.color2 = new BABYLON.Color4(0.4, 0.8, 0.1, 0.8);
        falloutSystem.colorDead = new BABYLON.Color4(0.2, 0.3, 0.0, 0);
        
        falloutSystem.minSize = 0.3;
        falloutSystem.maxSize = 1.5;
        falloutSystem.minLifeTime = 5.0;
        falloutSystem.maxLifeTime = 12.0;
        falloutSystem.emitRate = 3000;
        
        falloutSystem.gravity = new BABYLON.Vector3(0, -8, 0);
        falloutSystem.direction1 = new BABYLON.Vector3(-3, -1, -3);
        falloutSystem.direction2 = new BABYLON.Vector3(3, -1, 3);
        
        falloutSystem.minEmitPower = 3;
        falloutSystem.maxEmitPower = 12;
        falloutSystem.minAngularSpeed = -2;
        falloutSystem.maxAngularSpeed = 2;
        
        // Add radiation glow effect
        this.addRadiationGlow();
        
        this.weatherSystems.set('apocalypticFallout', falloutSystem);
    }

    addRadiationGlow() {
        // Create glowing radiation effect
        const glowLayer = new BABYLON.GlowLayer("radiationGlow", this.scene);
        glowLayer.intensity = 0.5;
        glowLayer.customEmissiveColorSelector = (mesh, subMesh, material, result) => {
            if (material.name && material.name.includes("radiation")) {
                result.set(0.8, 1.0, 0.2, 1.0);
            } else {
                result.set(0, 0, 0, 0);
            }
        };
        
        this.environmentalEffects.set('radiationGlow', glowLayer);
    }

    initElementalChaos() {
        // Combination of ice, lightning, and plasma effects
        const chaosSystem = new BABYLON.ParticleSystem("elementalChaos", 8000, this.scene);
        chaosSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        chaosSystem.emitter = new BABYLON.Vector3(0, 80, 0);
        chaosSystem.minEmitBox = new BABYLON.Vector3(-300, -20, -300);
        chaosSystem.maxEmitBox = new BABYLON.Vector3(300, 20, 300);
        
        // Elemental colors - cycling through ice blue, electric white, plasma purple
        chaosSystem.color1 = new BABYLON.Color4(0.2, 0.8, 1.0, 0.9);
        chaosSystem.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
        chaosSystem.colorDead = new BABYLON.Color4(0.8, 0.2, 1.0, 0);
        
        chaosSystem.minSize = 0.5;
        chaosSystem.maxSize = 2.5;
        chaosSystem.minLifeTime = 2.0;
        chaosSystem.maxLifeTime = 6.0;
        chaosSystem.emitRate = 4000;
        
        chaosSystem.gravity = new BABYLON.Vector3(0, -15, 0);
        chaosSystem.direction1 = new BABYLON.Vector3(-15, -5, -15);
        chaosSystem.direction2 = new BABYLON.Vector3(15, -5, 15);
        
        chaosSystem.minEmitPower = 10;
        chaosSystem.maxEmitPower = 25;
        chaosSystem.minAngularSpeed = -8;
        chaosSystem.maxAngularSpeed = 8;
        
        // Add elemental cycling
        this.addElementalCycling(chaosSystem);
        
        this.weatherSystems.set('elementalChaos', chaosSystem);
    }

    addElementalCycling(chaosSystem) {
        let elementPhase = 0;
        const elementalCycle = () => {
            elementPhase += 0.02;
            
            // Cycle through different elemental colors
            const phase = Math.sin(elementPhase);
            if (phase > 0.5) {
                // Ice phase
                chaosSystem.color1.set(0.2, 0.8, 1.0, 0.9);
                chaosSystem.color2.set(0.6, 0.9, 1.0, 0.8);
            } else if (phase > 0) {
                // Lightning phase
                chaosSystem.color1.set(1.0, 1.0, 1.0, 1.0);
                chaosSystem.color2.set(0.8, 0.8, 1.0, 0.9);
            } else {
                // Plasma phase
                chaosSystem.color1.set(1.0, 0.2, 0.8, 0.9);
                chaosSystem.color2.set(0.8, 0.4, 1.0, 0.8);
            }
            
            this.animationFrames.set('elementalCycle', requestAnimationFrame(elementalCycle));
        };
        
        elementalCycle();
    }

    initVolumetricFog() {
        // Enhanced fog with volumetric lighting
        const fogSystem = new BABYLON.ParticleSystem("volumetricFog", 4000, this.scene);
        fogSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
        
        fogSystem.emitter = new BABYLON.Vector3(0, 5, 0);
        fogSystem.minEmitBox = new BABYLON.Vector3(-500, -10, -500);
        fogSystem.maxEmitBox = new BABYLON.Vector3(500, 10, 500);
        
        fogSystem.color1 = new BABYLON.Color4(0.4, 0.4, 0.5, 0.3);
        fogSystem.color2 = new BABYLON.Color4(0.2, 0.3, 0.4, 0.5);
        fogSystem.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
        
        fogSystem.minSize = 25;
        fogSystem.maxSize = 60;
        fogSystem.minLifeTime = 15.0;
        fogSystem.maxLifeTime = 30.0;
        fogSystem.emitRate = 200;
        
        fogSystem.gravity = new BABYLON.Vector3(0, 2, 0);
        fogSystem.direction1 = new BABYLON.Vector3(-2, 0, -2);
        fogSystem.direction2 = new BABYLON.Vector3(2, 0, 2);
        
        fogSystem.minEmitPower = 0.5;
        fogSystem.maxEmitPower = 3;
        fogSystem.minAngularSpeed = -0.1;
        fogSystem.maxAngularSpeed = 0.1;
        
        this.weatherSystems.set('volumetricFog', fogSystem);
    }

    initMeteorShower() {
        // Spectacular meteor shower with trails and impacts
        const meteorSystem = new BABYLON.ParticleSystem("meteorShower", 500, this.scene);
        meteorSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        meteorSystem.emitter = new BABYLON.Vector3(0, 200, 0);
        meteorSystem.minEmitBox = new BABYLON.Vector3(-600, 0, -600);
        meteorSystem.maxEmitBox = new BABYLON.Vector3(600, 0, 600);
        
        // Meteor colors - bright whites and oranges
        meteorSystem.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
        meteorSystem.color2 = new BABYLON.Color4(1.0, 0.6, 0.2, 0.9);
        meteorSystem.colorDead = new BABYLON.Color4(1.0, 0.3, 0.0, 0);
        
        meteorSystem.minSize = 1.0;
        meteorSystem.maxSize = 4.0;
        meteorSystem.minLifeTime = 3.0;
        meteorSystem.maxLifeTime = 8.0;
        meteorSystem.emitRate = 50;
        
        meteorSystem.gravity = new BABYLON.Vector3(0, -80, 0);
        meteorSystem.direction1 = new BABYLON.Vector3(-20, -30, -20);
        meteorSystem.direction2 = new BABYLON.Vector3(20, -30, 20);
        
        meteorSystem.minEmitPower = 40;
        meteorSystem.maxEmitPower = 80;
        
        // Add meteor trails
        this.addMeteorTrails();
        
        this.weatherSystems.set('meteorShower', meteorSystem);
    }

    addMeteorTrails() {
        // Create trailing effect for meteors
        const trailSystem = new BABYLON.ParticleSystem("meteorTrails", 2000, this.scene);
        trailSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        trailSystem.emitter = new BABYLON.Vector3(0, 150, 0);
        trailSystem.minEmitBox = new BABYLON.Vector3(-500, 0, -500);
        trailSystem.maxEmitBox = new BABYLON.Vector3(500, 0, 500);
        
        trailSystem.color1 = new BABYLON.Color4(1.0, 0.8, 0.4, 0.6);
        trailSystem.color2 = new BABYLON.Color4(1.0, 0.4, 0.1, 0.4);
        trailSystem.colorDead = new BABYLON.Color4(0.3, 0.1, 0.0, 0);
        
        trailSystem.minSize = 0.5;
        trailSystem.maxSize = 2.0;
        trailSystem.minLifeTime = 1.0;
        trailSystem.maxLifeTime = 3.0;
        trailSystem.emitRate = 1000;
        
        trailSystem.gravity = new BABYLON.Vector3(0, -40, 0);
        trailSystem.direction1 = new BABYLON.Vector3(-10, -20, -10);
        trailSystem.direction2 = new BABYLON.Vector3(10, -20, 10);
        
        this.weatherSystems.set('meteorTrails', trailSystem);
    }

    initLightingSystems() {
        // Enhanced lightning with multiple types
        this.initSpectacularLightning();
        this.initPlasmaArcs();
        this.initCosmicLightning();
    }

    initSpectacularLightning() {
        // Multiple lightning lights for more dramatic effect
        const lightningLights = [];
        
        for (let i = 0; i < 5; i++) {
            const light = new BABYLON.SpotLight(`spectacularLightning${i}`, 
                new BABYLON.Vector3(0, 100, 0), 
                new BABYLON.Vector3(0, -1, 0), 
                Math.PI / 2, 1, this.scene);
            light.intensity = 0;
            light.diffuse = new BABYLON.Color3(1, 1, 1);
            light.specular = new BABYLON.Color3(1, 1, 1);
            light.range = 300;
            lightningLights.push(light);
        }
        
        this.lightingSystems.set('spectacularLightning', lightningLights);
    }

    initPlasmaArcs() {
        // Plasma arc effects between points
        const arcSystem = new BABYLON.ParticleSystem("plasmaArcs", 1000, this.scene);
        arcSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        arcSystem.emitter = new BABYLON.Vector3(0, 50, 0);
        arcSystem.minEmitBox = new BABYLON.Vector3(-1, -1, -1);
        arcSystem.maxEmitBox = new BABYLON.Vector3(1, 1, 1);
        
        arcSystem.color1 = new BABYLON.Color4(0.8, 0.4, 1.0, 1.0);
        arcSystem.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 0.9);
        arcSystem.colorDead = new BABYLON.Color4(0.4, 0.2, 0.8, 0);
        
        arcSystem.minSize = 0.2;
        arcSystem.maxSize = 1.0;
        arcSystem.minLifeTime = 0.1;
        arcSystem.maxLifeTime = 0.3;
        arcSystem.emitRate = 5000;
        
        this.lightingSystems.set('plasmaArcs', arcSystem);
    }

    initCosmicLightning() {
        // Cosmic lightning with otherworldly colors
        const cosmicLight = new BABYLON.DirectionalLight("cosmicLightning", 
            new BABYLON.Vector3(0, -1, 0), this.scene);
        cosmicLight.intensity = 0;
        cosmicLight.diffuse = new BABYLON.Color3(0.8, 0.4, 1.0);
        cosmicLight.specular = new BABYLON.Color3(1.0, 0.8, 1.0);
        
        this.lightingSystems.set('cosmicLightning', cosmicLight);
    }

    initEnvironmentalEffects() {
        // Screen shake, camera effects, and environmental interactions
        this.initScreenShake();
        this.initCameraEffects();
        this.initEnvironmentalInteractions();
    }

    initScreenShake() {
        this.screenShake = {
            intensity: 0,
            duration: 0,
            originalPosition: null,
            isShaking: false
        };
    }

    initCameraEffects() {
        this.cameraEffects = {
            fov: this.scene.activeCamera ? this.scene.activeCamera.fov : 0.8,
            originalFov: this.scene.activeCamera ? this.scene.activeCamera.fov : 0.8,
            breathing: false,
            pulse: false
        };
    }

    initEnvironmentalInteractions() {
        this.environmentalInteractions = {
            windAffectedObjects: new Set(),
            weatherReactiveObjects: new Set(),
            temperatureEffects: new Map()
        };
    }

    setupPerformanceMonitoring() {
        // Monitor FPS and adjust quality accordingly
        this.intervals.set('performance', setInterval(() => {
            this.performanceMonitor.currentFPS = this.engine.getFps();
            
            if (this.performanceMonitor.adaptiveQuality) {
                this.adjustQualityBasedOnPerformance();
            }
        }, 1000));
    }

    adjustQualityBasedOnPerformance() {
        const targetFPS = this.performanceMonitor.targetFPS;
        const currentFPS = this.performanceMonitor.currentFPS;
        
        if (currentFPS < targetFPS * 0.8) {
            // Reduce quality
            this.performanceMonitor.qualityLevel = Math.max(0.3, this.performanceMonitor.qualityLevel - 0.1);
        } else if (currentFPS > targetFPS * 0.95) {
            // Increase quality
            this.performanceMonitor.qualityLevel = Math.min(1.0, this.performanceMonitor.qualityLevel + 0.05);
        }
        
        this.applyQualitySettings();
    }

    applyQualitySettings() {
        const quality = this.performanceMonitor.qualityLevel;
        
        // Adjust particle counts based on quality
        this.weatherSystems.forEach((system, name) => {
            if (system.emitRate) {
                const baseEmitRate = system._baseEmitRate || system.emitRate;
                system._baseEmitRate = baseEmitRate;
                system.emitRate = Math.floor(baseEmitRate * quality);
            }
        });
        
        // Adjust post-processing quality
        if (this.postProcessing.bloom) {
            this.postProcessing.bloom.threshold = 1.0 - (quality * 0.5);
        }
    }

    // Weather Control Methods
    setWeather(weatherType, intensity = 0.5, transitionDuration = 3000) {
        if (this.isTransitioning) return;
        
        console.log(`🌩️ Transitioning to ${weatherType} weather (intensity: ${intensity})`);
        
        this.isTransitioning = true;
        this.intensity = Math.max(0.1, Math.min(1.0, intensity));
        
        // Smooth transition
        this.transitionToWeather(weatherType, transitionDuration).then(() => {
            this.activeWeatherType = weatherType;
            this.isTransitioning = false;
            console.log(`✅ Weather transition to ${weatherType} complete`);
        });
    }

    async transitionToWeather(weatherType, duration) {
        // Fade out current weather
        await this.fadeOutCurrentWeather(duration / 2);
        
        // Stop all current weather
        this.stopAllWeather();
        
        // Start new weather
        this.startWeatherType(weatherType);
        
        // Fade in new weather
        await this.fadeInNewWeather(duration / 2);
    }

    async fadeOutCurrentWeather(duration) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const fadeOut = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const fadeValue = 1 - progress;
                
                // Fade out all active systems
                this.weatherSystems.forEach((system) => {
                    if (system.isStarted && system.isStarted()) {
                        const baseEmitRate = system._originalEmitRate || system.emitRate;
                        system._originalEmitRate = baseEmitRate;
                        system.emitRate = Math.floor(baseEmitRate * fadeValue);
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(fadeOut);
                } else {
                    resolve();
                }
            };
            fadeOut();
        });
    }

    async fadeInNewWeather(duration) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const fadeIn = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Fade in all active systems
                this.weatherSystems.forEach((system) => {
                    if (system.isStarted && system.isStarted()) {
                        const targetEmitRate = system._targetEmitRate || system.emitRate;
                        system._targetEmitRate = targetEmitRate;
                        system.emitRate = Math.floor(targetEmitRate * progress * this.intensity);
                    }
                });
                
                if (progress < 1) {
                    requestAnimationFrame(fadeIn);
                } else {
                    resolve();
                }
            };
            fadeIn();
        });
    }

    startWeatherType(weatherType) {
        switch (weatherType) {
            case 'enhancedStorm':
                this.startEnhancedStorm();
                break;
            case 'cosmicStorm':
                this.startCosmicStorm();
                break;
            case 'fireTornado':
                this.startFireTornado();
                break;
            case 'dimensionalRift':
                this.startDimensionalRift();
                break;
            case 'apocalypticFallout':
                this.startApocalypticFallout();
                break;
            case 'elementalChaos':
                this.startElementalChaos();
                break;
            case 'meteorShower':
                this.startMeteorShower();
                break;
            case 'nightmareMode':
                this.startNightmareMode();
                break;
            case 'clear':
            default:
                this.setClearWeather();
                break;
        }
        
        this.updateSkybox(weatherType);
        this.updateColorGrading(weatherType);
        this.updateAmbientLighting(weatherType);
    }

    startEnhancedStorm() {
        this.startWeatherSystem('enhancedRain');
        this.startWeatherSystem('rainSplash');
        this.startSpectacularLightning();
        this.startScreenShake(0.5, 200);
        this.startCameraBreathing();
        console.log("⛈️ Enhanced storm unleashed!");
    }

    startCosmicStorm() {
        this.startWeatherSystem('cosmicStorm');
        this.startWeatherSystem('aurora');
        this.startCosmicLightningEffect();
        this.startCameraPulse();
        console.log("🌌 Cosmic storm tears through reality!");
    }

    startFireTornado() {
        this.startWeatherSystem('fireTornado');
        this.startScreenShake(0.8, 100);
        this.startHeatDistortion();
        console.log("🌪️🔥 Fire tornado ignites the sky!");
    }

    startDimensionalRift() {
        this.startWeatherSystem('dimensionalRift');
        this.startRealityDistortion();
        this.startDimensionalLighting();
        console.log("🌀 Dimensional rift opens, reality bends!");
    }

    startApocalypticFallout() {
        this.startWeatherSystem('apocalypticFallout');
        this.startRadiationEffects();
        this.startGeiger();
        console.log("☢️ Apocalyptic fallout descends!");
    }

    startElementalChaos() {
        this.startWeatherSystem('elementalChaos');
        this.startPlasmaArcs();
        this.startElementalLighting();
        console.log("⚡❄️🔥 Elemental chaos erupts!");
    }

    startMeteorShower() {
        this.startWeatherSystem('meteorShower');
        this.startWeatherSystem('meteorTrails');
        this.startMeteorImpacts();
        console.log("☄️ Meteor shower illuminates the darkness!");
    }

    startNightmareMode() {
        // Combination of multiple terrifying effects
        this.startWeatherSystem('dimensionalRift');
        this.startWeatherSystem('apocalypticFallout');
        this.startWeatherSystem('volumetricFog');
        this.startRealityDistortion();
        this.startScreenShake(1.0, 50);
        this.startNightmareLighting();
        console.log("👹 NIGHTMARE MODE ACTIVATED - REALITY COLLAPSES!");
    }

    setClearWeather() {
        this.updateAmbientLighting('clear');
        console.log("☀️ Clear skies return... for now.");
    }

    // Weather System Control
    startWeatherSystem(systemName) {
        const system = this.weatherSystems.get(systemName);
        if (system && !system.isStarted()) {
            system._targetEmitRate = system.emitRate * this.intensity;
            system.start();
        }
    }

    stopWeatherSystem(systemName) {
        const system = this.weatherSystems.get(systemName);
        if (system && system.isStarted()) {
            system.stop();
        }
    }

    stopAllWeather() {
        // Stop all particle systems
        this.weatherSystems.forEach((system) => {
            if (system.isStarted && system.isStarted()) {
                system.stop();
            }
        });
        
        // Stop all lighting effects
        this.lightingSystems.forEach((lights) => {
            if (Array.isArray(lights)) {
                lights.forEach(light => light.intensity = 0);
            } else if (lights.intensity !== undefined) {
                lights.intensity = 0;
            }
        });
        
        // Stop environmental effects
        this.stopScreenShake();
        this.stopCameraEffects();
        this.stopAllIntervals();
    }

    // Lighting Effects
    startSpectacularLightning() {
        const lights = this.lightingSystems.get('spectacularLightning');
        if (!lights) return;
        
        const triggerLightning = () => {
            const lightIndex = Math.floor(Math.random() * lights.length);
            const light = lights[lightIndex];
            
            // Random position
            light.position.x = (Math.random() - 0.5) * 400;
            light.position.z = (Math.random() - 0.5) * 400;
            light.position.y = 80 + Math.random() * 40;
            
            // Random color variation
            const colors = [
                new BABYLON.Color3(1, 1, 1),      // White
                new BABYLON.Color3(0.8, 0.9, 1),  // Blue-white
                new BABYLON.Color3(1, 0.9, 0.8),  // Warm white
                new BABYLON.Color3(0.9, 0.8, 1)   // Purple-white
            ];
            light.diffuse = colors[Math.floor(Math.random() * colors.length)];
            
            // Flash intensity
            light.intensity = 8 + Math.random() * 12;
            
            // Screen shake on lightning
            this.startScreenShake(0.3, 100);
            
            setTimeout(() => {
                light.intensity = 0;
            }, 80 + Math.random() * 120);
            
            // Schedule next lightning
            const delay = 2000 + Math.random() * 8000;
            this.intervals.set(`lightning_${lightIndex}`, setTimeout(triggerLightning, delay));
        };
        
        // Start multiple lightning timers
        lights.forEach((_, index) => {
            setTimeout(() => triggerLightning(), Math.random() * 5000);
        });
    }

    startCosmicLightningEffect() {
        const light = this.lightingSystems.get('cosmicLightning');
        if (!light) return;
        
        let phase = 0;
        const cosmicPulse = () => {
            phase += 0.05;
            
            // Pulsing cosmic light
            light.intensity = (Math.sin(phase) + 1) * 2;
            
            // Color shifting
            const r = 0.5 + Math.sin(phase * 0.7) * 0.3;
            const g = 0.3 + Math.sin(phase * 0.5) * 0.2;
            const b = 0.8 + Math.sin(phase * 0.3) * 0.2;
            light.diffuse.set(r, g, b);
            
            this.animationFrames.set('cosmicLightning', requestAnimationFrame(cosmicPulse));
        };
        
        cosmicPulse();
    }

    startPlasmaArcs() {
        const arcSystem = this.lightingSystems.get('plasmaArcs');
        if (!arcSystem) return;
        
        arcSystem.start();
        
        // Animate arc positions
        let time = 0;
        const arcAnimation = () => {
            time += 0.02;
            
            // Create arcing motion between random points
            const point1 = new BABYLON.Vector3(
                Math.sin(time) * 50,
                30 + Math.cos(time * 1.3) * 20,
                Math.cos(time * 0.7) * 50
            );
            
            const point2 = new BABYLON.Vector3(
                Math.sin(time + Math.PI) * 50,
                30 + Math.cos(time * 1.3 + Math.PI) * 20,
                Math.cos(time * 0.7 + Math.PI) * 50
            );
            
            // Update emitter to create arc between points
            arcSystem.emitter = BABYLON.Vector3.Lerp(point1, point2, 0.5);
            arcSystem.direction1 = point1.subtract(arcSystem.emitter).normalize();
            arcSystem.direction2 = point2.subtract(arcSystem.emitter).normalize();
            
            this.animationFrames.set('plasmaArcs', requestAnimationFrame(arcAnimation));
        };
        
        arcAnimation();
    }

    startElementalLighting() {
        // Cycling through different elemental lighting effects
        let elementPhase = 0;
        const elementalCycle = () => {
            elementPhase += 0.03;
            
            const phase = Math.sin(elementPhase);
            
            if (phase > 0.5) {
                // Ice lighting - cool blues
                this.scene.ambientColor.set(0.2, 0.3, 0.8);
            } else if (phase > 0) {
                // Lightning lighting - bright whites
                this.scene.ambientColor.set(0.9, 0.9, 1.0);
            } else {
                // Fire lighting - warm reds and oranges
                this.scene.ambientColor.set(0.8, 0.4, 0.2);
            }
            
            this.animationFrames.set('elementalLighting', requestAnimationFrame(elementalCycle));
        };
        
        elementalCycle();
    }

    startDimensionalLighting() {
        // Otherworldly lighting that shifts reality
        let phase = 0;
        const dimensionalShift = () => {
            phase += 0.04;
            
            // Shifting between dimensions with different color spaces
            const r = 0.5 + Math.sin(phase * 0.7) * 0.5;
            const g = 0.3 + Math.sin(phase * 1.1) * 0.4;
            const b = 0.8 + Math.sin(phase * 0.9) * 0.2;
            
            this.scene.ambientColor.set(r, g, b);
            
            // Occasional reality flashes
            if (Math.random() < 0.02) {
                this.scene.ambientColor.set(1, 0, 1); // Magenta flash
                setTimeout(() => {
                    this.scene.ambientColor.set(r, g, b);
                }, 50);
            }
            
            this.animationFrames.set('dimensionalLighting', requestAnimationFrame(dimensionalShift));
        };
        
        dimensionalShift();
    }

    startNightmareLighting() {
        // Terrifying lighting that creates dread
        let intensity = 0;
        const nightmareFlicker = () => {
            intensity += 0.1;
            
            // Erratic flickering
            const flicker = Math.random() < 0.3 ? 0.1 : 0.8;
            const red = 0.3 + Math.sin(intensity * 2) * 0.2;
            
            this.scene.ambientColor.set(red * flicker, 0.1 * flicker, 0.1 * flicker);
            
            // Random complete darkness
            if (Math.random() < 0.05) {
                this.scene.ambientColor.set(0, 0, 0);
                setTimeout(() => {
                    this.scene.ambientColor.set(red, 0.1, 0.1);
                }, 100 + Math.random() * 500);
            }
            
            this.animationFrames.set('nightmareLighting', requestAnimationFrame(nightmareFlicker));
        };
        
        nightmareFlicker();
    }

    // Camera Effects
    startScreenShake(intensity, duration) {
        if (!this.scene.activeCamera) return;
        
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.screenShake.originalPosition = this.scene.activeCamera.position.clone();
        this.screenShake.isShaking = true;
        
        const shake = () => {
            if (!this.screenShake.isShaking) return;
            
            const camera = this.scene.activeCamera;
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeZ = (Math.random() - 0.5) * this.screenShake.intensity;
            
            camera.position.x = this.screenShake.originalPosition.x + shakeX;
            camera.position.y = this.screenShake.originalPosition.y + shakeY;
            camera.position.z = this.screenShake.originalPosition.z + shakeZ;
            
            this.animationFrames.set('screenShake', requestAnimationFrame(shake));
        };
        
        shake();
        
        // Stop shaking after duration
        setTimeout(() => {
            this.stopScreenShake();
        }, duration);
    }

    stopScreenShake() {
        this.screenShake.isShaking = false;
        if (this.scene.activeCamera && this.screenShake.originalPosition) {
            this.scene.activeCamera.position = this.screenShake.originalPosition;
        }
        
        if (this.animationFrames.has('screenShake')) {
            cancelAnimationFrame(this.animationFrames.get('screenShake'));
            this.animationFrames.delete('screenShake');
        }
    }

    startCameraBreathing() {
        if (!this.scene.activeCamera) return;
        
        this.cameraEffects.breathing = true;
        let breathPhase = 0;
        
        const breathe = () => {
            if (!this.cameraEffects.breathing) return;
            
            breathPhase += 0.02;
            const breathIntensity = Math.sin(breathPhase) * 0.05;
            
            this.scene.activeCamera.fov = this.cameraEffects.originalFov + breathIntensity;
            
            this.animationFrames.set('cameraBreathing', requestAnimationFrame(breathe));
        };
        
        breathe();
    }

    startCameraPulse() {
        if (!this.scene.activeCamera) return;
        
        this.cameraEffects.pulse = true;
        let pulsePhase = 0;
        
        const pulse = () => {
            if (!this.cameraEffects.pulse) return;
            
            pulsePhase += 0.08;
            const pulseIntensity = Math.sin(pulsePhase) * 0.1;
            
            this.scene.activeCamera.fov = this.cameraEffects.originalFov + pulseIntensity;
            
            this.animationFrames.set('cameraPulse', requestAnimationFrame(pulse));
        };
        
        pulse();
    }

    stopCameraEffects() {
        this.cameraEffects.breathing = false;
        this.cameraEffects.pulse = false;
        
        if (this.scene.activeCamera) {
            this.scene.activeCamera.fov = this.cameraEffects.originalFov;
        }
        
        ['cameraBreathing', 'cameraPulse'].forEach(effect => {
            if (this.animationFrames.has(effect)) {
                cancelAnimationFrame(this.animationFrames.get(effect));
                this.animationFrames.delete(effect);
            }
        });
    }

    // Environmental Effects
    startHeatDistortion() {
        // Heat wave distortion effect
        const heatDistortion = new BABYLON.PostProcess("heatDistortion", "heatDistortion", 
            ["time", "intensity"], null, 1.0, null, null, this.engine);
        
        let time = 0;
        heatDistortion.onApply = (effect) => {
            time += 0.016;
            effect.setFloat("time", time);
            effect.setFloat("intensity", 0.03);
        };
        
        // Heat distortion shader
        const heatShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float time;
            uniform float intensity;
            
            void main() {
                vec2 uv = vUV;
                uv.y += sin(uv.x * 20.0 + time * 3.0) * intensity;
                uv.x += cos(uv.y * 15.0 + time * 2.0) * intensity * 0.5;
                gl_FragColor = texture2D(textureSampler, uv);
            }
        `;
        
        BABYLON.Effect.ShadersStore["heatDistortionFragmentShader"] = heatShader;
        
        this.environmentalEffects.set('heatDistortion', heatDistortion);
    }

    startRealityDistortion() {
        const distortion = this.environmentalEffects.get('realityDistortion');
        if (distortion) {
            // Distortion is already created, just activate it
            console.log("🌀 Reality distortion activated");
        }
    }

    startRadiationEffects() {
        const glowLayer = this.environmentalEffects.get('radiationGlow');
        if (glowLayer) {
            glowLayer.intensity = 0.8;
        }
        
        // Add Geiger counter clicking sound simulation
        this.startGeiger();
    }

    startGeiger() {
        const geigerInterval = setInterval(() => {
            // Simulate Geiger counter clicks with random intervals
            const clickDelay = 100 + Math.random() * 500;
            console.log("📻 *click*");
            
            // In a real implementation, you would play an actual Geiger counter sound
            // this.playSound('geiger_click.wav');
        }, 200 + Math.random() * 800);
        
        this.intervals.set('geiger', geigerInterval);
    }

    startMeteorImpacts() {
        // Create impact effects when meteors hit the ground
        const impactInterval = setInterval(() => {
            const impactX = (Math.random() - 0.5) * 400;
            const impactZ = (Math.random() - 0.5) * 400;
            
            // Create explosion effect at impact point
            this.createExplosionEffect(new BABYLON.Vector3(impactX, 0, impactZ));
            
            // Screen shake on impact
            this.startScreenShake(0.8, 300);
            
            console.log(`☄️💥 Meteor impact at (${impactX.toFixed(1)}, ${impactZ.toFixed(1)})`);
        }, 3000 + Math.random() * 7000);
        
        this.intervals.set('meteorImpacts', impactInterval);
    }

    createExplosionEffect(position) {
        // Create explosion particle system
        const explosion = new BABYLON.ParticleSystem("explosion", 1000, this.scene);
        explosion.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        explosion.emitter = position;
        explosion.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
        explosion.maxEmitBox = new BABYLON.Vector3(2, 0, 2);
        
        explosion.color1 = new BABYLON.Color4(1.0, 0.8, 0.2, 1.0);
        explosion.color2 = new BABYLON.Color4(1.0, 0.4, 0.1, 0.8);
        explosion.colorDead = new BABYLON.Color4(0.3, 0.1, 0.0, 0);
        
        explosion.minSize = 1.0;
        explosion.maxSize = 8.0;
        explosion.minLifeTime = 0.5;
        explosion.maxLifeTime = 2.0;
        explosion.emitRate = 2000;
        
        explosion.gravity = new BABYLON.Vector3(0, -20, 0);
        explosion.direction1 = new BABYLON.Vector3(-10, 5, -10);
        explosion.direction2 = new BABYLON.Vector3(10, 15, 10);
        
        explosion.minEmitPower = 10;
        explosion.maxEmitPower = 30;
        
        explosion.start();
        
        // Stop explosion after short duration
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => {
                explosion.dispose();
            }, 3000);
        }, 500);
    }

    // Skybox and Atmosphere
    updateSkybox(weatherType) {
        // Hide all skyboxes first
        this.dynamicSkybox.textures.forEach(skybox => {
            skybox.setEnabled(false);
        });
        
        // Show appropriate skybox
        const skyboxMap = {
            'clear': 'clear',
            'enhancedStorm': 'storm',
            'cosmicStorm': 'cosmic',
            'apocalypticFallout': 'apocalyptic',
            'nightmareMode': 'apocalyptic'
        };
        
        const skyboxType = skyboxMap[weatherType] || 'clear';
        const skybox = this.dynamicSkybox.textures.get(skyboxType);
        if (skybox) {
            skybox.setEnabled(true);
            this.dynamicSkybox.current = skybox;
        }
    }

    updateColorGrading(weatherType) {
        const grading = this.weatherColorGrades[weatherType] || this.weatherColorGrades.clear;
        const colorGradingPP = this.postProcessing.colorGrading;
        
        if (colorGradingPP) {
            // Animate color grading transition
            this.animateColorGrading(grading);
        }
    }

    animateColorGrading(targetGrading) {
        // Smooth transition to new color grading
        let progress = 0;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            // Interpolate color grading values
            // This would require access to the actual color grading properties
            // In a real implementation, you would lerp between current and target values
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateAmbientLighting(weatherType) {
        const lightingMap = {
            'clear': { intensity: 0.8, color: new BABYLON.Color3(1, 1, 1) },
            'enhancedStorm': { intensity: 0.3, color: new BABYLON.Color3(0.4, 0.4, 0.6) },
            'cosmicStorm': { intensity: 0.5, color: new BABYLON.Color3(0.6, 0.4, 0.8) },
            'fireTornado': { intensity: 0.6, color: new BABYLON.Color3(0.8, 0.4, 0.2) },
            'dimensionalRift': { intensity: 0.4, color: new BABYLON.Color3(0.8, 0.2, 0.8) },
            'apocalypticFallout': { intensity: 0.2, color: new BABYLON.Color3(0.6, 0.8, 0.2) },
            'elementalChaos': { intensity: 0.7, color: new BABYLON.Color3(0.8, 0.8, 0.8) },
            'meteorShower': { intensity: 0.4, color: new BABYLON.Color3(0.8, 0.6, 0.4) },
            'nightmareMode': { intensity: 0.1, color: new BABYLON.Color3(0.4, 0.1, 0.1) }
        };
        
        const lighting = lightingMap[weatherType] || lightingMap.clear;
        
        // Animate ambient lighting transition
        this.animateAmbientLighting(lighting);
    }

    animateAmbientLighting(targetLighting) {
        if (!this.scene.ambientColor) return;
        
        const startColor = this.scene.ambientColor.clone();
        const targetColor = targetLighting.color;
        
        let progress = 0;
        const duration = 3000; // 3 seconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            // Interpolate ambient color
            this.scene.ambientColor = BABYLON.Color3.Lerp(startColor, targetColor, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Weather Cycling
    startWeatherCycle() {
        // Automatic weather cycling for dynamic experience
        const weatherTypes = [
            'clear', 'enhancedStorm', 'cosmicStorm', 'fireTornado',
            'dimensionalRift', 'apocalypticFallout', 'elementalChaos',
            'meteorShower', 'nightmareMode'
        ];
        
        let currentIndex = 0;
        
        const cycleWeather = () => {
            const weatherType = weatherTypes[currentIndex];
            const intensity = 0.3 + Math.random() * 0.7; // Random intensity
            
            this.setWeather(weatherType, intensity);
            
            currentIndex = (currentIndex + 1) % weatherTypes.length;
            
            // Random cycle duration between 30 seconds and 2 minutes
            const cycleDuration = 30000 + Math.random() * 90000;
            this.intervals.set('weatherCycle', setTimeout(cycleWeather, cycleDuration));
        };
        
        // Start first cycle after 10 seconds
        this.intervals.set('weatherCycle', setTimeout(cycleWeather, 10000));
    }

    // Utility Methods
    stopAllIntervals() {
        this.intervals.forEach((interval, name) => {
            clearInterval(interval);
            clearTimeout(interval);
        });
        this.intervals.clear();
        
        this.animationFrames.forEach((frame, name) => {
            cancelAnimationFrame(frame);
        });
        this.animationFrames.clear();
    }

    // Public API Methods
    increaseIntensity() {
        this.intensity = Math.min(1.0, this.intensity + 0.1);
        this.setWeather(this.activeWeatherType, this.intensity);
        console.log(`🔥 Weather intensity increased to ${this.intensity.toFixed(1)}`);
    }

    decreaseIntensity() {
        this.intensity = Math.max(0.1, this.intensity - 0.1);
        this.setWeather(this.activeWeatherType, this.intensity);
        console.log(`❄️ Weather intensity decreased to ${this.intensity.toFixed(1)}`);
    }

    toggleAdaptiveQuality() {
        this.performanceMonitor.adaptiveQuality = !this.performanceMonitor.adaptiveQuality;
        console.log(`🎛️ Adaptive quality ${this.performanceMonitor.adaptiveQuality ? 'enabled' : 'disabled'}`);
    }

    getWeatherState() {
        return {
            type: this.activeWeatherType,
            intensity: this.intensity,
            isActive: this.activeWeatherType !== 'clear',
            isTransitioning: this.isTransitioning,
            performance: {
                fps: this.performanceMonitor.currentFPS,
                quality: this.performanceMonitor.qualityLevel,
                adaptiveQuality: this.performanceMonitor.adaptiveQuality
            }
        };
    }

    getAvailableWeatherTypes() {
        return [
            'clear', 'enhancedStorm', 'cosmicStorm', 'fireTornado',
            'dimensionalRift', 'apocalypticFallout', 'elementalChaos',
            'meteorShower', 'nightmareMode'
        ];
    }

    // Cleanup
    dispose() {
        console.log("🌫️ Disposing enhanced weather system...");
        
        this.stopAllWeather();
        this.stopAllIntervals();

        if (this.environmentalSystems) {
            Object.values(this.environmentalSystems).forEach(system => {
                if (system && system.dispose) {
                    system.dispose();
                }
            });
        }
        
        // Dispose all particle systems
        this.weatherSystems.forEach((system) => {
            if (system && system.dispose) {
                system.dispose();
            }
        });
        
        // Dispose all lighting systems
        this.lightingSystems.forEach((lights) => {
            if (Array.isArray(lights)) {
                lights.forEach(light => {
                    if (light && light.dispose) {
                        light.dispose();
                    }
                });
            } else if (lights && lights.dispose) {
                lights.dispose();
            }
        });
        
        // Dispose environmental effects
        this.environmentalEffects.forEach((effect) => {
            if (effect && effect.dispose) {
                effect.dispose();
            }
        });
        
        // Dispose skyboxes
        this.dynamicSkybox.textures.forEach((skybox) => {
            if (skybox && skybox.dispose) {
                skybox.dispose();
            }
        });
        
        // Dispose post-processing
        Object.values(this.postProcessing).forEach((effect) => {
            if (effect && effect.dispose) {
                effect.dispose();
            }
        });
        
        console.log("✅ Enhanced weather system disposed successfully");
    }
}

// Usage Example:
/*
// Initialize the enhanced weather system
const weatherSystem = new EnhancedWeatherSystem(scene, engine);

// Set specific weather with intensity
weatherSystem.setWeather('cosmicStorm', 0.8);

// Increase/decrease intensity
weatherSystem.increaseIntensity();
weatherSystem.decreaseIntensity();

// Get current state
const state = weatherSystem.getWeatherState();
console.log('Current weather:', state);

// Get available weather types
const types = weatherSystem.getAvailableWeatherTypes();
console.log('Available weather types:', types);

// Toggle adaptive quality for performance
weatherSystem.toggleAdaptiveQuality();

// Cleanup when done
weatherSystem.dispose();
*/

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExtendedWeatherSystem;
}



/**
 * Environmental Interaction Extensions
 * Advanced environmental systems that react to weather conditions
 */

// Extend the EnhancedWeatherSystem class with environmental interactions
EnhancedWeatherSystem.prototype.initAdvancedEnvironmentalSystems = function() {
    this.environmentalSystems = {
        vegetation: new VegetationSystem(this.scene, this),
        water: new WaterSystem(this.scene, this),
        terrain: new TerrainSystem(this.scene, this),
        atmosphere: new AtmosphereSystem(this.scene, this),
        debris: new DebrisSystem(this.scene, this),
        temperature: new TemperatureSystem(this.scene, this)
    };
    
    console.log("🌿 Advanced environmental systems initialized");
};

/**
 * Vegetation System - Trees, grass, and plants that react to weather
 */
class VegetationSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.vegetation = new Map();
        this.windIntensity = 0;
        this.moistureLevel = 0;
        this.temperatureLevel = 0.5; // 0 = freezing, 1 = burning
        
        this.initVegetation();
        this.startVegetationUpdates();
    }
    
    initVegetation() {
        // Create various types of vegetation
        this.createTrees();
        this.createGrass();
        this.createFlowers();
        this.createVines();
    }
    
    createTrees() {
        const treeCount = 20;
        const trees = [];
        
        for (let i = 0; i < treeCount; i++) {
            // Create simple tree geometry
            const trunk = BABYLON.MeshBuilder.CreateCylinder(`treeTrunk_${i}`, {
                height: 8 + Math.random() * 4,
                diameterTop: 0.5,
                diameterBottom: 1 + Math.random() * 0.5
            }, this.scene);
            
            const foliage = BABYLON.MeshBuilder.CreateSphere(`treeFoliage_${i}`, {
                diameter: 4 + Math.random() * 2
            }, this.scene);
            
            // Position tree
            const x = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            trunk.position.set(x, trunk.scaling.y * 4, z);
            foliage.position.set(x, trunk.scaling.y * 6 + 2, z);
            
            // Materials
            const trunkMaterial = new BABYLON.StandardMaterial(`trunkMat_${i}`, this.scene);
            trunkMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);
            trunk.material = trunkMaterial;
            
            const foliageMaterial = new BABYLON.StandardMaterial(`foliageMat_${i}`, this.scene);
            foliageMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.1);
            foliage.material = foliageMaterial;
            
            // Store tree data
            const tree = {
                trunk: trunk,
                foliage: foliage,
                originalRotation: trunk.rotation.clone(),
                swayIntensity: 0.5 + Math.random() * 0.5,
                health: 1.0,
                moistureNeed: 0.3 + Math.random() * 0.4,
                temperatureTolerance: 0.2 + Math.random() * 0.6
            };
            
            trees.push(tree);
            this.weatherSystem.windSystem.affectedObjects.add(trunk);
        }
        
        this.vegetation.set('trees', trees);
    }
    
    createGrass() {
        // Create grass patches that sway in wind
        const grassPatches = [];
        const patchCount = 50;
        
        for (let i = 0; i < patchCount; i++) {
            const grass = BABYLON.MeshBuilder.CreateGround(`grassPatch_${i}`, {
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3
            }, this.scene);
            
            // Position randomly
            grass.position.x = (Math.random() - 0.5) * 300;
            grass.position.z = (Math.random() - 0.5) * 300;
            grass.position.y = 0.1;
            
            // Grass material with transparency
            const grassMaterial = new BABYLON.StandardMaterial(`grassMat_${i}`, this.scene);
            grassMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.2);
            grassMaterial.alpha = 0.8;
            grass.material = grassMaterial;
            
            grassPatches.push({
                mesh: grass,
                originalColor: grassMaterial.diffuseColor.clone(),
                health: 1.0,
                growth: 0.5 + Math.random() * 0.5
            });
        }
        
        this.vegetation.set('grass', grassPatches);
    }
    
    createFlowers() {
        // Create flowers that bloom and wilt based on conditions
        const flowers = [];
        const flowerCount = 30;
        
        for (let i = 0; i < flowerCount; i++) {
            const flower = BABYLON.MeshBuilder.CreateSphere(`flower_${i}`, {
                diameter: 0.3 + Math.random() * 0.2
            }, this.scene);
            
            flower.position.x = (Math.random() - 0.5) * 250;
            flower.position.z = (Math.random() - 0.5) * 250;
            flower.position.y = 0.5;
            
            // Random flower colors
            const colors = [
                new BABYLON.Color3(1, 0.2, 0.2), // Red
                new BABYLON.Color3(1, 1, 0.2),   // Yellow
                new BABYLON.Color3(0.8, 0.2, 1), // Purple
                new BABYLON.Color3(1, 0.6, 0.8), // Pink
                new BABYLON.Color3(1, 0.8, 0.2)  // Orange
            ];
            
            const flowerMaterial = new BABYLON.StandardMaterial(`flowerMat_${i}`, this.scene);
            flowerMaterial.diffuseColor = colors[Math.floor(Math.random() * colors.length)];
            flowerMaterial.emissiveColor = flowerMaterial.diffuseColor.scale(0.2);
            flower.material = flowerMaterial;
            
            flowers.push({
                mesh: flower,
                originalScale: flower.scaling.clone(),
                bloomState: Math.random(),
                bloomSpeed: 0.01 + Math.random() * 0.02,
                originalColor: flowerMaterial.diffuseColor.clone()
            });
        }
        
        this.vegetation.set('flowers', flowers);
    }
    
    createVines() {
        // Create climbing vines that grow and react to weather
        const vines = [];
        const vineCount = 15;
        
        for (let i = 0; i < vineCount; i++) {
            const vine = BABYLON.MeshBuilder.CreateTube(`vine_${i}`, {
                path: this.generateVinePath(),
                radius: 0.1,
                tessellation: 8
            }, this.scene);
            
            const vineMaterial = new BABYLON.StandardMaterial(`vineMat_${i}`, this.scene);
            vineMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.5, 0.1);
            vine.material = vineMaterial;
            
            vines.push({
                mesh: vine,
                growthProgress: 0.3 + Math.random() * 0.7,
                maxGrowth: 1.0,
                growthRate: 0.001 + Math.random() * 0.002
            });
        }
        
        this.vegetation.set('vines', vines);
    }
    
    generateVinePath() {
        // Generate a curved path for vine growth
        const path = [];
        const segments = 20;
        const baseX = (Math.random() - 0.5) * 100;
        const baseZ = (Math.random() - 0.5) * 100;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = baseX + Math.sin(t * Math.PI * 2) * 2;
            const y = t * 10 + Math.sin(t * Math.PI * 4) * 1;
            const z = baseZ + Math.cos(t * Math.PI * 3) * 1.5;
            
            path.push(new BABYLON.Vector3(x, y, z));
        }
        
        return path;
    }
    
    startVegetationUpdates() {
        const updateVegetation = () => {
            this.updateWindEffects();
            this.updateMoistureEffects();
            this.updateTemperatureEffects();
            this.updateGrowth();
            
            requestAnimationFrame(updateVegetation);
        };
        
        updateVegetation();
    }
    
    updateWindEffects() {
        const windStrength = this.weatherSystem.windSystem.strength;
        const windDirection = this.weatherSystem.windSystem.direction;
        
        // Update trees swaying
        const trees = this.vegetation.get('trees') || [];
        trees.forEach((tree, index) => {
            const time = Date.now() * 0.001;
            const sway = Math.sin(time + index) * windStrength * tree.swayIntensity * 0.1;
            
            tree.trunk.rotation.z = tree.originalRotation.z + sway;
            tree.foliage.rotation.z = sway * 1.5;
            
            // Leaves falling in strong wind
            if (windStrength > 0.7) {
                this.createFallingLeaves(tree.foliage.position, windDirection);
            }
        });
        
        // Update grass movement
        const grass = this.vegetation.get('grass') || [];
        grass.forEach((patch, index) => {
            const time = Date.now() * 0.002;
            const grassSway = Math.sin(time + index * 0.5) * windStrength * 0.05;
            patch.mesh.rotation.z = grassSway;
        });
    }
    
    createFallingLeaves(position, windDirection) {
        // Create falling leaf particles
        if (!this.leafSystem) {
            this.leafSystem = new BABYLON.ParticleSystem("fallingLeaves", 500, this.scene);
            this.leafSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
            
            this.leafSystem.color1 = new BABYLON.Color4(0.8, 0.6, 0.2, 0.8);
            this.leafSystem.color2 = new BABYLON.Color4(0.6, 0.4, 0.1, 0.6);
            this.leafSystem.colorDead = new BABYLON.Color4(0.3, 0.2, 0.0, 0);
            
            this.leafSystem.minSize = 0.2;
            this.leafSystem.maxSize = 0.5;
            this.leafSystem.minLifeTime = 3.0;
            this.leafSystem.maxLifeTime = 8.0;
            
            this.leafSystem.gravity = new BABYLON.Vector3(0, -5, 0);
            this.leafSystem.minAngularSpeed = -2;
            this.leafSystem.maxAngularSpeed = 2;
        }
        
        this.leafSystem.emitter = position.clone();
        this.leafSystem.emitRate = 50;
        this.leafSystem.direction1 = windDirection.scale(5);
        this.leafSystem.direction2 = windDirection.scale(10);
        
        if (!this.leafSystem.isStarted()) {
            this.leafSystem.start();
        }
    }
    
    updateMoistureEffects() {
        // Update vegetation based on moisture from rain
        const isRaining = this.weatherSystem.activeWeatherType.includes('Rain') || 
                          this.weatherSystem.activeWeatherType === 'enhancedStorm';
        
        if (isRaining) {
            this.moistureLevel = Math.min(1.0, this.moistureLevel + 0.01);
        } else {
            this.moistureLevel = Math.max(0.0, this.moistureLevel - 0.005);
        }
        
        // Update grass color based on moisture
        const grass = this.vegetation.get('grass') || [];
        grass.forEach(patch => {
            const healthyGreen = patch.originalColor;
            const dryBrown = new BABYLON.Color3(0.6, 0.4, 0.1);
            
            patch.mesh.material.diffuseColor = BABYLON.Color3.Lerp(dryBrown, healthyGreen, this.moistureLevel);
            patch.health = this.moistureLevel;
        });
        
        // Update flower blooming
        const flowers = this.vegetation.get('flowers') || [];
        flowers.forEach(flower => {
            if (this.moistureLevel > 0.3) {
                flower.bloomState = Math.min(1.0, flower.bloomState + flower.bloomSpeed);
            } else {
                flower.bloomState = Math.max(0.2, flower.bloomState - flower.bloomSpeed * 0.5);
            }
            
            flower.mesh.scaling = flower.originalScale.scale(0.5 + flower.bloomState * 0.5);
            flower.mesh.material.alpha = 0.3 + flower.bloomState * 0.7;
        });
    }
    
    updateTemperatureEffects() {
        // Simulate temperature effects based on weather type
        const weatherType = this.weatherSystem.activeWeatherType;
        
        if (weatherType === 'fireTornado' || weatherType === 'apocalypticFallout') {
            this.temperatureLevel = Math.min(1.0, this.temperatureLevel + 0.02);
        } else if (weatherType === 'elementalChaos') {
            this.temperatureLevel = 0.5; // Neutral
        } else {
            this.temperatureLevel = Math.max(0.0, this.temperatureLevel - 0.01);
        }
        
        // Update vegetation based on temperature
        const trees = this.vegetation.get('trees') || [];
        trees.forEach(tree => {
            if (this.temperatureLevel > 0.8) {
                // Wilting in extreme heat
                tree.foliage.material.diffuseColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(0.2, 0.6, 0.1),
                    new BABYLON.Color3(0.6, 0.3, 0.1),
                    this.temperatureLevel
                );
            } else if (this.temperatureLevel < 0.2) {
                // Frost effects
                tree.foliage.material.diffuseColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(0.2, 0.6, 0.1),
                    new BABYLON.Color3(0.8, 0.9, 1.0),
                    1 - this.temperatureLevel
                );
            }
        });
    }
    
    updateGrowth() {
        // Update vine growth
        const vines = this.vegetation.get('vines') || [];
        vines.forEach(vine => {
            if (this.moistureLevel > 0.4 && this.temperatureLevel > 0.2 && this.temperatureLevel < 0.8) {
                vine.growthProgress = Math.min(vine.maxGrowth, vine.growthProgress + vine.growthRate);
                
                // Update vine visibility based on growth
                vine.mesh.scaling.y = vine.growthProgress;
            }
        });
    }

    dispose() {
        this.vegetation.forEach(group => {
            group.forEach(item => {
                if (item.mesh) {
                    item.mesh.dispose();
                } else if (item.trunk) {
                    item.trunk.dispose();
                    item.foliage.dispose();
                }
            });
        });
        if (this.leafSystem) {
            this.leafSystem.dispose();
        }
    }
}

/**
 * Water System - Rivers, puddles, and water effects that react to weather
 */
class WaterSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.waterBodies = new Map();
        this.puddleLevel = 0;
        this.waveIntensity = 0;
        
        this.initWaterBodies();
        this.startWaterUpdates();
    }
    
    initWaterBodies() {
        this.createRiver();
        this.createPuddles();
        this.createWaterDroplets();
    }
    
    createRiver() {
        // Create a flowing river
        const river = BABYLON.MeshBuilder.CreateGround("river", {
            width: 200,
            height: 20
        }, this.scene);
        
        river.position.set(0, -0.5, 0);
        
        // Water material with animation
        const waterMaterial = new BABYLON.StandardMaterial("waterMaterial", this.scene);
        waterMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.8);
        waterMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 1.0);
        waterMaterial.alpha = 0.7;
        river.material = waterMaterial;
        
        this.waterBodies.set('river', {
            mesh: river,
            material: waterMaterial,
            originalLevel: river.position.y,
            flowSpeed: 0.02,
            waveHeight: 0.1
        });
    }
    
    createPuddles() {
        // Create puddles that appear during rain
        const puddles = [];
        const puddleCount = 20;
        
        for (let i = 0; i < puddleCount; i++) {
            const puddle = BABYLON.MeshBuilder.CreateGround(`puddle_${i}`, {
                width: 1 + Math.random() * 3,
                height: 1 + Math.random() * 3
            }, this.scene);
            
            puddle.position.x = (Math.random() - 0.5) * 300;
            puddle.position.z = (Math.random() - 0.5) * 300;
            puddle.position.y = 0.01;
            
            const puddleMaterial = new BABYLON.StandardMaterial(`puddleMat_${i}`, this.scene);
            puddleMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
            puddleMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
            puddleMaterial.alpha = 0;
            puddle.material = puddleMaterial;
            
            puddles.push({
                mesh: puddle,
                material: puddleMaterial,
                maxAlpha: 0.6,
                growthRate: 0.02,
                evaporationRate: 0.005
            });
        }
        
        this.waterBodies.set('puddles', puddles);
    }
    
    createWaterDroplets() {
        // Create water droplet effects for surfaces
        this.dropletSystem = new BABYLON.ParticleSystem("waterDroplets", 1000, this.scene);
        this.dropletSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        this.dropletSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        this.dropletSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        this.dropletSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        
        this.dropletSystem.color1 = new BABYLON.Color4(0.8, 0.9, 1.0, 0.6);
        this.dropletSystem.color2 = new BABYLON.Color4(0.6, 0.8, 1.0, 0.4);
        this.dropletSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        this.dropletSystem.minSize = 0.05;
        this.dropletSystem.maxSize = 0.15;
        this.dropletSystem.minLifeTime = 0.5;
        this.dropletSystem.maxLifeTime = 2.0;
        this.dropletSystem.emitRate = 0;
        
        this.dropletSystem.gravity = new BABYLON.Vector3(0, -10, 0);
        this.dropletSystem.direction1 = new BABYLON.Vector3(-1, 0, -1);
        this.dropletSystem.direction2 = new BABYLON.Vector3(1, 0, 1);
    }
    
    startWaterUpdates() {
        const updateWater = () => {
            this.updateRainEffects();
            this.updateWaveMotion();
            this.updateReflections();
            
            requestAnimationFrame(updateWater);
        };
        
        updateWater();
    }
    
    updateRainEffects() {
        const isRaining = this.weatherSystem.activeWeatherType.includes('Rain') || 
                          this.weatherSystem.activeWeatherType === 'enhancedStorm';
        
        if (isRaining) {
            // Increase puddle levels
            this.puddleLevel = Math.min(1.0, this.puddleLevel + 0.02);
            
            // Start water droplets
            this.dropletSystem.emitRate = 500 * this.weatherSystem.intensity;
            if (!this.dropletSystem.isStarted()) {
                this.dropletSystem.start();
            }
        } else {
            // Decrease puddle levels (evaporation)
            this.puddleLevel = Math.max(0.0, this.puddleLevel - 0.005);
            
            // Stop water droplets
            this.dropletSystem.emitRate = 0;
        }
        
        // Update puddle visibility
        const puddles = this.waterBodies.get('puddles') || [];
        puddles.forEach(puddle => {
            puddle.material.alpha = puddle.maxAlpha * this.puddleLevel;
            puddle.mesh.setEnabled(puddle.material.alpha > 0.1);
        });
        
        // Update river level
        const river = this.waterBodies.get('river');
        if (river) {
            river.mesh.position.y = river.originalLevel + (this.puddleLevel * 0.5);
        }
    }
    
    updateWaveMotion() {
        const windStrength = this.weatherSystem.windSystem.strength;
        this.waveIntensity = windStrength * 0.5;
        
        const time = Date.now() * 0.001;
        
        // Update river waves
        const river = this.waterBodies.get('river');
        if (river) {
            // Animate water surface with waves
            const waveOffset = Math.sin(time * river.flowSpeed * 10) * river.waveHeight * this.waveIntensity;
            river.mesh.position.y = river.originalLevel + waveOffset;
            
            // Update water color based on weather
            const weatherType = this.weatherSystem.activeWeatherType;
            if (weatherType === 'bloodRain') {
                river.material.diffuseColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(0.1, 0.3, 0.8),
                    new BABYLON.Color3(0.6, 0.1, 0.1),
                    0.7
                );
            } else if (weatherType === 'apocalypticFallout') {
                river.material.diffuseColor = BABYLON.Color3.Lerp(
                    new BABYLON.Color3(0.1, 0.3, 0.8),
                    new BABYLON.Color3(0.4, 0.6, 0.2),
                    0.5
                );
            } else {
                river.material.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.8);
            }
        }
        
        // Update puddle ripples
        const puddles = this.waterBodies.get('puddles') || [];
        puddles.forEach((puddle, index) => {
            if (puddle.material.alpha > 0.1) {
                const ripple = Math.sin(time * 2 + index) * 0.02 * this.waveIntensity;
                puddle.mesh.scaling.x = 1 + ripple;
                puddle.mesh.scaling.z = 1 + ripple;
            }
        });
    }
    
    updateReflections() {
        // Update water reflections based on lighting conditions
        const river = this.waterBodies.get('river');
        if (river) {
            const lightingIntensity = this.scene.ambientColor.r + this.scene.ambientColor.g + this.scene.ambientColor.b;
            river.material.specularPower = 32 + lightingIntensity * 64;
        }
    }

    dispose() {
        this.waterBodies.forEach(group => {
            if (Array.isArray(group)) {
                group.forEach(item => {
                    if (item.mesh) item.mesh.dispose();
                });
            } else if (group.mesh) {
                group.mesh.dispose();
            }
        });
        if (this.dropletSystem) {
            this.dropletSystem.dispose();
        }
    }
}

/**
 * Terrain System - Ground that reacts to weather conditions
 */
class TerrainSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.terrainElements = new Map();
        this.erosionLevel = 0;
        this.temperatureLevel = 0.5;
        
        this.initTerrain();
        this.startTerrainUpdates();
    }
    
    initTerrain() {
        this.createGround();
        this.createRocks();
        this.createSand();
        this.createSnow();
    }
    
    createGround() {
        // Main ground plane
        const ground = BABYLON.MeshBuilder.CreateGround("mainGround", {
            width: 500,
            height: 500,
            subdivisions: 50
        }, this.scene);
        
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        ground.material = groundMaterial;
        
        this.terrainElements.set('ground', {
            mesh: ground,
            material: groundMaterial,
            originalColor: groundMaterial.diffuseColor.clone(),
            wetness: 0,
            temperature: 0.5
        });
    }
    
    createRocks() {
        // Scattered rocks
        const rocks = [];
        const rockCount = 30;
        
        for (let i = 0; i < rockCount; i++) {
            const rock = BABYLON.MeshBuilder.CreateSphere(`rock_${i}`, {
                diameter: 1 + Math.random() * 2
            }, this.scene);
            
            rock.position.x = (Math.random() - 0.5) * 400;
            rock.position.z = (Math.random() - 0.5) * 400;
            rock.position.y = rock.scaling.y * 0.3;
            
            // Deform for more natural look
            rock.scaling.y = 0.5 + Math.random() * 0.5;
            
            const rockMaterial = new BABYLON.StandardMaterial(`rockMat_${i}`, this.scene);
            rockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            rock.material = rockMaterial;
            
            rocks.push({
                mesh: rock,
                material: rockMaterial,
                originalColor: rockMaterial.diffuseColor.clone(),
                weathering: 0
            });
        }
        
        this.terrainElements.set('rocks', rocks);
    }
    
    createSand() {
        // Sand patches for desert effects
        const sandPatches = [];
        const patchCount = 15;
        
        for (let i = 0; i < patchCount; i++) {
            const sand = BABYLON.MeshBuilder.CreateGround(`sand_${i}`, {
                width: 5 + Math.random() * 10,
                height: 5 + Math.random() * 10
            }, this.scene);
            
            sand.position.x = (Math.random() - 0.5) * 300;
            sand.position.z = (Math.random() - 0.5) * 300;
            sand.position.y = 0.05;
            
            const sandMaterial = new BABYLON.StandardMaterial(`sandMat_${i}`, this.scene);
            sandMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.6);
            sandMaterial.alpha = 0;
            sand.material = sandMaterial;
            
            sandPatches.push({
                mesh: sand,
                material: sandMaterial,
                visibility: 0,
                maxAlpha: 0.8
            });
        }
        
        this.terrainElements.set('sand', sandPatches);
    }
    
    createSnow() {
        // Snow accumulation
        const snowPatches = [];
        const patchCount = 25;
        
        for (let i = 0; i < patchCount; i++) {
            const snow = BABYLON.MeshBuilder.CreateGround(`snow_${i}`, {
                width: 3 + Math.random() * 5,
                height: 3 + Math.random() * 5
            }, this.scene);
            
            snow.position.x = (Math.random() - 0.5) * 400;
            snow.position.z = (Math.random() - 0.5) * 400;
            snow.position.y = 0.02;
            
            const snowMaterial = new BABYLON.StandardMaterial(`snowMat_${i}`, this.scene);
            snowMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 1.0);
            snowMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.15);
            snowMaterial.alpha = 0;
            snow.material = snowMaterial;
            
            snowPatches.push({
                mesh: snow,
                material: snowMaterial,
                accumulation: 0,
                maxAlpha: 0.9
            });
        }
        
        this.terrainElements.set('snow', snowPatches);
    }
    
    startTerrainUpdates() {
        const updateTerrain = () => {
            this.updateWeatherEffects();
            this.updateErosion();
            this.updateTemperatureEffects();
            
            requestAnimationFrame(updateTerrain);
        };
        
        updateTerrain();
    }
    
    updateWeatherEffects() {
        const weatherType = this.weatherSystem.activeWeatherType;
        const intensity = this.weatherSystem.intensity;
        
        // Update ground wetness
        const ground = this.terrainElements.get('ground');
        if (ground) {
            if (weatherType.includes('Rain') || weatherType === 'enhancedStorm') {
                ground.wetness = Math.min(1.0, ground.wetness + 0.02 * intensity);
            } else {
                ground.wetness = Math.max(0.0, ground.wetness - 0.005);
            }
            
            // Update ground color based on wetness
            const dryColor = ground.originalColor;
            const wetColor = new BABYLON.Color3(0.2, 0.15, 0.1);
            ground.material.diffuseColor = BABYLON.Color3.Lerp(dryColor, wetColor, ground.wetness);
            ground.material.specularPower = 16 + ground.wetness * 48;
        }
        
        // Update sand visibility for desert weather
        const sandPatches = this.terrainElements.get('sand') || [];
        if (weatherType === 'ashfall' || weatherType === 'apocalypticFallout') {
            sandPatches.forEach(sand => {
                sand.visibility = Math.min(1.0, sand.visibility + 0.01 * intensity);
                sand.material.alpha = sand.maxAlpha * sand.visibility;
                sand.mesh.setEnabled(sand.material.alpha > 0.1);
            });
        } else {
            sandPatches.forEach(sand => {
                sand.visibility = Math.max(0.0, sand.visibility - 0.005);
                sand.material.alpha = sand.maxAlpha * sand.visibility;
                sand.mesh.setEnabled(sand.material.alpha > 0.1);
            });
        }
    }
    
    updateErosion() {
        // Simulate erosion effects from wind and water
        const windStrength = this.weatherSystem.windSystem.strength;
        const isRaining = this.weatherSystem.activeWeatherType.includes('Rain');
        
        if (windStrength > 0.5 || isRaining) {
            this.erosionLevel = Math.min(1.0, this.erosionLevel + 0.001);
        }
        
        // Update rock weathering
        const rocks = this.terrainElements.get('rocks') || [];
        rocks.forEach(rock => {
            rock.weathering = this.erosionLevel;
            
            // Change rock color based on weathering
            const originalColor = rock.originalColor;
            const weatheredColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            rock.material.diffuseColor = BABYLON.Color3.Lerp(originalColor, weatheredColor, rock.weathering);
        });
    }
    
    updateTemperatureEffects() {
        const weatherType = this.weatherSystem.activeWeatherType;
        
        // Update temperature based on weather
        if (weatherType === 'fireTornado') {
            this.temperatureLevel = Math.min(1.0, this.temperatureLevel + 0.02);
        } else if (weatherType === 'elementalChaos') {
            // Cycling temperature
            this.temperatureLevel = 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
        } else {
            this.temperatureLevel = Math.max(0.0, this.temperatureLevel - 0.01);
        }
        
        // Update snow accumulation
        const snowPatches = this.terrainElements.get('snow') || [];
        if (this.temperatureLevel < 0.3) {
            snowPatches.forEach(snow => {
                snow.accumulation = Math.min(1.0, snow.accumulation + 0.01);
                snow.material.alpha = snow.maxAlpha * snow.accumulation;
                snow.mesh.setEnabled(snow.material.alpha > 0.1);
            });
        } else if (this.temperatureLevel > 0.7) {
            snowPatches.forEach(snow => {
                snow.accumulation = Math.max(0.0, snow.accumulation - 0.02);
                snow.material.alpha = snow.maxAlpha * snow.accumulation;
                snow.mesh.setEnabled(snow.material.alpha > 0.1);
            });
        }
    }

    dispose() {
        this.terrainElements.forEach(group => {
            if (Array.isArray(group)) {
                group.forEach(item => {
                    if (item.mesh) item.mesh.dispose();
                });
            } else if (group.mesh) {
                group.mesh.dispose();
            }
        });
    }
}

/**
 * Atmosphere System - Air effects and atmospheric phenomena
 */
class AtmosphereSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.atmosphericEffects = new Map();
        this.visibility = 1.0;
        this.pressure = 1.0;
        this.humidity = 0.5;
        
        this.initAtmosphericEffects();
        this.startAtmosphereUpdates();
    }
    
    initAtmosphericEffects() {
        this.createHeatShimmer();
        this.createAtmosphericPerspective();
        this.createCloudShadows();
    }
    
    createHeatShimmer() {
        // Heat shimmer effect for hot weather
        this.heatShimmer = new BABYLON.ParticleSystem("heatShimmer", 1000, this.scene);
        this.heatShimmer.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
        
        this.heatShimmer.emitter = new BABYLON.Vector3(0, 0, 0);
        this.heatShimmer.minEmitBox = new BABYLON.Vector3(-200, 0, -200);
        this.heatShimmer.maxEmitBox = new BABYLON.Vector3(200, 0, 200);
        
        this.heatShimmer.color1 = new BABYLON.Color4(1, 1, 1, 0.1);
        this.heatShimmer.color2 = new BABYLON.Color4(1, 1, 1, 0.05);
        this.heatShimmer.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        this.heatShimmer.minSize = 5;
        this.heatShimmer.maxSize = 15;
        this.heatShimmer.minLifeTime = 3.0;
        this.heatShimmer.maxLifeTime = 8.0;
        this.heatShimmer.emitRate = 0;
        
        this.heatShimmer.gravity = new BABYLON.Vector3(0, 2, 0);
        this.heatShimmer.direction1 = new BABYLON.Vector3(-1, 1, -1);
        this.heatShimmer.direction2 = new BABYLON.Vector3(1, 3, 1);
        
        this.atmosphericEffects.set('heatShimmer', this.heatShimmer);
    }
    
    createAtmosphericPerspective() {
        // Atmospheric perspective for depth
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogStart = 100;
        this.scene.fogEnd = 400;
        this.scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        this.scene.fogDensity = 0.01;
        
        this.atmosphericEffects.set('fog', {
            originalStart: this.scene.fogStart,
            originalEnd: this.scene.fogEnd,
            originalColor: this.scene.fogColor.clone(),
            originalDensity: this.scene.fogDensity
        });
    }
    
    createCloudShadows() {
        // Moving cloud shadows
        this.cloudShadows = [];
        const shadowCount = 5;
        
        for (let i = 0; i < shadowCount; i++) {
            const shadow = BABYLON.MeshBuilder.CreateGround(`cloudShadow_${i}`, {
                width: 20 + Math.random() * 30,
                height: 20 + Math.random() * 30
            }, this.scene);
            
            shadow.position.x = (Math.random() - 0.5) * 400;
            shadow.position.z = (Math.random() - 0.5) * 400;
            shadow.position.y = 0.1;
            
            const shadowMaterial = new BABYLON.StandardMaterial(`shadowMat_${i}`, this.scene);
            shadowMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            shadowMaterial.alpha = 0.3;
            shadow.material = shadowMaterial;
            
            this.cloudShadows.push({
                mesh: shadow,
                speed: 0.1 + Math.random() * 0.2,
                direction: new BABYLON.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
            });
        }
        
        this.atmosphericEffects.set('cloudShadows', this.cloudShadows);
    }
    
    startAtmosphereUpdates() {
        const updateAtmosphere = () => {
            this.updateVisibility();
            this.updatePressure();
            this.updateHumidity();
            this.updateCloudShadows();
            
            requestAnimationFrame(updateAtmosphere);
        };
        
        updateAtmosphere();
    }
    
    updateVisibility() {
        const weatherType = this.weatherSystem.activeWeatherType;
        const intensity = this.weatherSystem.intensity;
        
        // Update visibility based on weather
        if (weatherType === 'volumetricFog' || weatherType.includes('fog')) {
            this.visibility = Math.max(0.1, this.visibility - 0.02 * intensity);
        } else if (weatherType === 'ashfall' || weatherType === 'apocalypticFallout') {
            this.visibility = Math.max(0.3, this.visibility - 0.01 * intensity);
        } else {
            this.visibility = Math.min(1.0, this.visibility + 0.01);
        }
        
        // Update fog based on visibility
        const fogSettings = this.atmosphericEffects.get('fog');
        if (fogSettings) {
            this.scene.fogStart = fogSettings.originalStart * this.visibility;
            this.scene.fogEnd = fogSettings.originalEnd * this.visibility;
            this.scene.fogDensity = fogSettings.originalDensity * (2 - this.visibility);
            
            // Update fog color based on weather
            if (weatherType === 'apocalypticFallout') {
                this.scene.fogColor = new BABYLON.Color3(0.6, 0.8, 0.2);
            } else if (weatherType === 'fireTornado') {
                this.scene.fogColor = new BABYLON.Color3(0.8, 0.4, 0.2);
            } else {
                this.scene.fogColor = fogSettings.originalColor;
            }
        }
    }
    
    updatePressure() {
        const weatherType = this.weatherSystem.activeWeatherType;
        
        // Simulate atmospheric pressure changes
        if (weatherType === 'enhancedStorm' || weatherType === 'cosmicStorm') {
            this.pressure = Math.max(0.7, this.pressure - 0.01);
        } else {
            this.pressure = Math.min(1.0, this.pressure + 0.005);
        }
        
        // Pressure affects particle behavior
        this.weatherSystem.weatherSystems.forEach((system) => {
            if (system.gravity) {
                const pressureEffect = this.pressure * 0.5 + 0.5;
                system.gravity.y = system.gravity.y * pressureEffect;
            }
        });
    }
    
    updateHumidity() {
        const weatherType = this.weatherSystem.activeWeatherType;
        
        // Update humidity based on weather
        if (weatherType.includes('Rain') || weatherType === 'enhancedStorm') {
            this.humidity = Math.min(1.0, this.humidity + 0.02);
        } else if (weatherType === 'fireTornado' || weatherType === 'ashfall') {
            this.humidity = Math.max(0.0, this.humidity - 0.01);
        }
        
        // Humidity affects heat shimmer
        const heatShimmer = this.atmosphericEffects.get('heatShimmer');
        if (heatShimmer) {
            if (this.humidity < 0.3 && weatherType === 'fireTornado') {
                heatShimmer.emitRate = 200;
                if (!heatShimmer.isStarted()) {
                    heatShimmer.start();
                }
            } else {
                heatShimmer.emitRate = 0;
            }
        }
    }
    
    updateCloudShadows() {
        const windDirection = this.weatherSystem.windSystem.direction;
        const windStrength = this.weatherSystem.windSystem.strength;
        
        this.cloudShadows.forEach(shadow => {
            // Move shadows with wind
            const movement = windDirection.clone().scale(shadow.speed * windStrength);
            shadow.mesh.position.addInPlace(movement);
            
            // Wrap around the scene
            if (shadow.mesh.position.x > 250) shadow.mesh.position.x = -250;
            if (shadow.mesh.position.x < -250) shadow.mesh.position.x = 250;
            if (shadow.mesh.position.z > 250) shadow.mesh.position.z = -250;
            if (shadow.mesh.position.z < -250) shadow.mesh.position.z = 250;
        });
    }

    dispose() {
        this.atmosphericEffects.forEach(effect => {
            if (effect && effect.dispose) {
                effect.dispose();
            }
        });
        this.cloudShadows.forEach(shadow => {
            if (shadow.mesh) {
                shadow.mesh.dispose();
            }
        });
    }
}

/**
 * Debris System - Objects and debris affected by weather
 */
class DebrisSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.debrisObjects = new Map();
        
        this.initDebris();
        this.startDebrisUpdates();
    }
    
    initDebris() {
        this.createLeaves();
        this.createPapers();
        this.createDust();
        this.createEmbers();
    }
    
    createLeaves() {
        // Flying leaves affected by wind
        this.leavesSystem = new BABYLON.ParticleSystem("flyingLeaves", 200, this.scene);
        this.leavesSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        this.leavesSystem.emitter = new BABYLON.Vector3(0, 10, 0);
        this.leavesSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        this.leavesSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        
        this.leavesSystem.color1 = new BABYLON.Color4(0.8, 0.6, 0.2, 0.8);
        this.leavesSystem.color2 = new BABYLON.Color4(0.6, 0.4, 0.1, 0.6);
        this.leavesSystem.colorDead = new BABYLON.Color4(0.3, 0.2, 0.0, 0);
        
        this.leavesSystem.minSize = 0.3;
        this.leavesSystem.maxSize = 0.8;
        this.leavesSystem.minLifeTime = 5.0;
        this.leavesSystem.maxLifeTime = 15.0;
        this.leavesSystem.emitRate = 0;
        
        this.leavesSystem.gravity = new BABYLON.Vector3(0, -2, 0);
        this.leavesSystem.minAngularSpeed = -3;
        this.leavesSystem.maxAngularSpeed = 3;
        
        this.debrisObjects.set('leaves', this.leavesSystem);
    }
    
    createPapers() {
        // Flying papers and debris
        this.papersSystem = new BABYLON.ParticleSystem("flyingPapers", 50, this.scene);
        this.papersSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        this.papersSystem.emitter = new BABYLON.Vector3(0, 5, 0);
        this.papersSystem.minEmitBox = new BABYLON.Vector3(-50, 0, -50);
        this.papersSystem.maxEmitBox = new BABYLON.Vector3(50, 0, 50);
        
        this.papersSystem.color1 = new BABYLON.Color4(0.9, 0.9, 0.8, 0.8);
        this.papersSystem.color2 = new BABYLON.Color4(0.8, 0.8, 0.7, 0.6);
        this.papersSystem.colorDead = new BABYLON.Color4(0.5, 0.5, 0.4, 0);
        
        this.papersSystem.minSize = 0.5;
        this.papersSystem.maxSize = 1.5;
        this.papersSystem.minLifeTime = 8.0;
        this.papersSystem.maxLifeTime = 20.0;
        this.papersSystem.emitRate = 0;
        
        this.papersSystem.gravity = new BABYLON.Vector3(0, -1, 0);
        this.papersSystem.minAngularSpeed = -5;
        this.papersSystem.maxAngularSpeed = 5;
        
        this.debrisObjects.set('papers', this.papersSystem);
    }
    
    createDust() {
        // Dust clouds
        this.dustSystem = new BABYLON.ParticleSystem("dustClouds", 1000, this.scene);
        this.dustSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/cloud.png", this.scene);
        
        this.dustSystem.emitter = new BABYLON.Vector3(0, 1, 0);
        this.dustSystem.minEmitBox = new BABYLON.Vector3(-200, 0, -200);
        this.dustSystem.maxEmitBox = new BABYLON.Vector3(200, 0, 200);
        
        this.dustSystem.color1 = new BABYLON.Color4(0.7, 0.6, 0.5, 0.3);
        this.dustSystem.color2 = new BABYLON.Color4(0.6, 0.5, 0.4, 0.2);
        this.dustSystem.colorDead = new BABYLON.Color4(0.3, 0.3, 0.2, 0);
        
        this.dustSystem.minSize = 2;
        this.dustSystem.maxSize = 8;
        this.dustSystem.minLifeTime = 3.0;
        this.dustSystem.maxLifeTime = 10.0;
        this.dustSystem.emitRate = 0;
        
        this.dustSystem.gravity = new BABYLON.Vector3(0, 1, 0);
        this.dustSystem.minAngularSpeed = -1;
        this.dustSystem.maxAngularSpeed = 1;
        
        this.debrisObjects.set('dust', this.dustSystem);
    }
    
    createEmbers() {
        // Glowing embers for fire weather
        this.embersSystem = new BABYLON.ParticleSystem("glowingEmbers", 300, this.scene);
        this.embersSystem.particleTexture = new BABYLON.Texture("assets/images/flare.png", this.scene);
        
        this.embersSystem.emitter = new BABYLON.Vector3(0, 2, 0);
        this.embersSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        this.embersSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
        
        this.embersSystem.color1 = new BABYLON.Color4(1.0, 0.6, 0.2, 1.0);
        this.embersSystem.color2 = new BABYLON.Color4(1.0, 0.3, 0.1, 0.8);
        this.embersSystem.colorDead = new BABYLON.Color4(0.3, 0.1, 0.0, 0);
        
        this.embersSystem.minSize = 0.1;
        this.embersSystem.maxSize = 0.5;
        this.embersSystem.minLifeTime = 2.0;
        this.embersSystem.maxLifeTime = 8.0;
        this.embersSystem.emitRate = 0;
        
        this.embersSystem.gravity = new BABYLON.Vector3(0, 3, 0);
        this.embersSystem.minAngularSpeed = -2;
        this.embersSystem.maxAngularSpeed = 2;
        
        this.debrisObjects.set('embers', this.embersSystem);
    }
    
    startDebrisUpdates() {
        const updateDebris = () => {
            this.updateWindEffects();
            this.updateWeatherSpecificDebris();
            
            requestAnimationFrame(updateDebris);
        };
        
        updateDebris();
    }
    
    updateWindEffects() {
        const windStrength = this.weatherSystem.windSystem.strength;
        const windDirection = this.weatherSystem.windSystem.direction;
        
        // Update leaves
        const leavesSystem = this.debrisObjects.get('leaves');
        if (windStrength > 0.3) {
            leavesSystem.emitRate = Math.floor(windStrength * 100);
            leavesSystem.direction1 = windDirection.scale(5);
            leavesSystem.direction2 = windDirection.scale(15);
            
            if (!leavesSystem.isStarted()) {
                leavesSystem.start();
            }
        } else {
            leavesSystem.emitRate = 0;
        }
        
        // Update papers
        const papersSystem = this.debrisObjects.get('papers');
        if (windStrength > 0.5) {
            papersSystem.emitRate = Math.floor(windStrength * 20);
            papersSystem.direction1 = windDirection.scale(8);
            papersSystem.direction2 = windDirection.scale(20);
            
            if (!papersSystem.isStarted()) {
                papersSystem.start();
            }
        } else {
            papersSystem.emitRate = 0;
        }
        
        // Update dust
        const dustSystem = this.debrisObjects.get('dust');
        if (windStrength > 0.4) {
            dustSystem.emitRate = Math.floor(windStrength * 200);
            dustSystem.direction1 = windDirection.scale(3);
            dustSystem.direction2 = windDirection.scale(8);
            
            if (!dustSystem.isStarted()) {
                dustSystem.start();
            }
        } else {
            dustSystem.emitRate = 0;
        }
    }
    
    updateWeatherSpecificDebris() {
        const weatherType = this.weatherSystem.activeWeatherType;
        const intensity = this.weatherSystem.intensity;
        
        // Update embers for fire weather
        const embersSystem = this.debrisObjects.get('embers');
        if (weatherType === 'fireTornado') {
            embersSystem.emitRate = Math.floor(intensity * 150);
            
            if (!embersSystem.isStarted()) {
                embersSystem.start();
            }
        } else {
            embersSystem.emitRate = 0;
        }
    }

    dispose() {
        this.debrisObjects.forEach(system => {
            if (system && system.dispose) {
                system.dispose();
            }
        });
    }
}

/**
 * Temperature System - Global temperature effects
 */
class TemperatureSystem {
    constructor(scene, weatherSystem) {
        this.scene = scene;
        this.weatherSystem = weatherSystem;
        this.globalTemperature = 20; // Celsius
        this.temperatureEffects = new Map();
        
        this.initTemperatureEffects();
        this.startTemperatureUpdates();
    }
    
    initTemperatureEffects() {
        this.createHeatWaves();
        this.createFrostEffects();
        this.createThermalDistortion();
    }
    
    createHeatWaves() {
        // Visual heat wave distortion
        this.heatWaveEffect = new BABYLON.PostProcess("heatWave", "heatWave", 
            ["time", "temperature"], null, 1.0, null, null, this.weatherSystem.engine);
        
        let time = 0;
        this.heatWaveEffect.onApply = (effect) => {
            time += 0.016;
            effect.setFloat("time", time);
            effect.setFloat("temperature", Math.max(0, this.globalTemperature - 25) / 50);
        };
        
        // Heat wave shader
        const heatWaveShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float time;
            uniform float temperature;
            
            void main() {
                vec2 uv = vUV;
                if (temperature > 0.0) {
                    uv.y += sin(uv.x * 30.0 + time * 4.0) * temperature * 0.01;
                    uv.x += cos(uv.y * 25.0 + time * 3.0) * temperature * 0.005;
                }
                gl_FragColor = texture2D(textureSampler, uv);
            }
        `;
        
        BABYLON.Effect.ShadersStore["heatWaveFragmentShader"] = heatWaveShader;
        
        this.temperatureEffects.set('heatWave', this.heatWaveEffect);
    }
    
    createFrostEffects() {
        // Frost overlay for cold weather
        this.frostOverlay = new BABYLON.PostProcess("frost", "frost", 
            ["frostIntensity"], null, 1.0, null, null, this.weatherSystem.engine);
        
        this.frostOverlay.onApply = (effect) => {
            const frostIntensity = Math.max(0, (5 - this.globalTemperature) / 20);
            effect.setFloat("frostIntensity", frostIntensity);
        };
        
        // Frost shader
        const frostShader = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform float frostIntensity;
            
            void main() {
                vec4 color = texture2D(textureSampler, vUV);
                if (frostIntensity > 0.0) {
                    float frost = sin(vUV.x * 100.0) * sin(vUV.y * 100.0) * 0.5 + 0.5;
                    frost = pow(frost, 3.0) * frostIntensity;
                    color.rgb = mix(color.rgb, vec3(0.9, 0.95, 1.0), frost * 0.3);
                }
                gl_FragColor = color;
            }
        `;
        
        BABYLON.Effect.ShadersStore["frostFragmentShader"] = frostShader;
        
        this.temperatureEffects.set('frost', this.frostOverlay);
    }
    
    createThermalDistortion() {
        // Thermal distortion for extreme temperatures
        this.thermalDistortion = {
            intensity: 0,
            active: false
        };
    }
    
    startTemperatureUpdates() {
        const updateTemperature = () => {
            this.updateGlobalTemperature();
            this.applyTemperatureEffects();
            
            requestAnimationFrame(updateTemperature);
        };
        
        updateTemperature();
    }
    
    updateGlobalTemperature() {
        const weatherType = this.weatherSystem.activeWeatherType;
        const intensity = this.weatherSystem.intensity;
        
        // Base temperature changes based on weather
        let targetTemperature = 20; // Default 20°C
        
        switch (weatherType) {
            case 'fireTornado':
                targetTemperature = 45 + intensity * 30; // Up to 75°C
                break;
            case 'apocalypticFallout':
                targetTemperature = 35 + intensity * 20; // Up to 55°C
                break;
            case 'elementalChaos':
                targetTemperature = 10 + Math.sin(Date.now() * 0.001) * 40; // -30°C to 50°C
                break;
            case 'enhancedStorm':
                targetTemperature = 15 - intensity * 10; // Down to 5°C
                break;
            case 'cosmicStorm':
                targetTemperature = -10 - intensity * 20; // Down to -30°C
                break;
            default:
                targetTemperature = 20;
        }
        
        // Smooth temperature transition
        const tempDiff = targetTemperature - this.globalTemperature;
        this.globalTemperature += tempDiff * 0.02;
    }
    
    applyTemperatureEffects() {
        // Apply visual effects based on temperature
        if (this.globalTemperature > 35) {
            // Hot weather effects
            this.thermalDistortion.intensity = (this.globalTemperature - 35) / 40;
            this.thermalDistortion.active = true;
        } else if (this.globalTemperature < 5) {
            // Cold weather effects
            this.thermalDistortion.intensity = (5 - this.globalTemperature) / 30;
            this.thermalDistortion.active = true;
        } else {
            this.thermalDistortion.active = false;
        }
        
        // Update scene ambient based on temperature
        const tempFactor = (this.globalTemperature + 30) / 80; // Normalize -30°C to 50°C
        const coldColor = new BABYLON.Color3(0.6, 0.7, 1.0);
        const neutralColor = new BABYLON.Color3(1.0, 1.0, 1.0);
        const hotColor = new BABYLON.Color3(1.0, 0.8, 0.6);
        
        if (tempFactor < 0.5) {
            this.scene.ambientColor = BABYLON.Color3.Lerp(coldColor, neutralColor, tempFactor * 2);
        } else {
            this.scene.ambientColor = BABYLON.Color3.Lerp(neutralColor, hotColor, (tempFactor - 0.5) * 2);
        }
    }
    
    getTemperature() {
        return {
            celsius: this.globalTemperature,
            fahrenheit: this.globalTemperature * 9/5 + 32,
            kelvin: this.globalTemperature + 273.15
        };
    }

    dispose() {
        this.temperatureEffects.forEach(effect => {
            if (effect && effect.dispose) {
                effect.dispose();
            }
        });
    }
}

// Initialize environmental systems when weather system is created
EnhancedWeatherSystem.prototype.originalInit = EnhancedWeatherSystem.prototype.initializeEnhancedSystems;
EnhancedWeatherSystem.prototype.initializeEnhancedSystems = function() {
    this.originalInit();
    this.initAdvancedEnvironmentalSystems();
};

console.log("🌍 Environmental interaction systems loaded and ready!");