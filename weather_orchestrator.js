/**
 * Weather Orchestrator - Manages the switching between weather.js and weather2.js systems
 */
class WeatherOrchestrator {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        
        // Initialize both weather systems
        this.normalWeather = new EnhancedWeatherSystem(scene); // from weather.js
        this.spectacularWeather = new EnhancedWeatherSystem(scene, engine); // from weather2.js
        
        // Initially disable spectacular weather
        this.spectacularWeather.stopAllWeather();
        
        // State tracking
        this.activeSystem = 'normal';
        this.lastSpectacularTime = 0;
        this.isInitialGreeting = true;

        // Start the orchestration
        this.startOrchestration();
    }

    startOrchestration() {
        // Start with normal weather from weather.js
        this.switchToNormal();

        // After 3 minutes, show the initial weather2.js greeting
        setTimeout(() => {
            this.switchToSpectacular();
            
            // After 20 seconds, switch back to normal
            setTimeout(() => {
                this.switchToNormal();
                this.isInitialGreeting = false;
                
                // Start the random switches after the initial greeting
                this.startRandomSwitches();
            }, 20000);
        }, 180000); // 3 minutes
    }

    startRandomSwitches() {
        // Check for random weather switches every 15 seconds
        setInterval(() => {
            const timeSinceLastSpectacular = Date.now() - this.lastSpectacularTime;
            
            // Only consider switching if it's been at least 2 minutes since the last spectacular weather
            if (timeSinceLastSpectacular >= 120000) { // 2 minutes
                if (Math.random() < 0.25) { // 25% chance to switch (averages to about every 2 minutes)
                    this.switchToSpectacular();
                    
                    // Switch back to normal after 15 seconds
                    setTimeout(() => {
                        this.switchToNormal();
                    }, 15000);
                }
            }
        }, 15000); // Check every 15 seconds
    }

    switchToNormal() {
        if (this.activeSystem !== 'normal') {
            this.spectacularWeather.stopAllWeather();
            this.normalWeather.setWeather('rain', 0.7); // or any default weather
            this.activeSystem = 'normal';
        }
    }

    switchToSpectacular() {
        if (this.activeSystem !== 'spectacular') {
            this.normalWeather.stopAllWeather();
            
            // Choose a random spectacular weather type
            const spectacularTypes = [
                'cosmicStorm',
                'fireTornado',
                'dimensionalRift',
                'elementalChaos',
                'meteorShower'
            ];
            const randomType = spectacularTypes[Math.floor(Math.random() * spectacularTypes.length)];
            
            this.spectacularWeather.setWeather(randomType, 0.8);
            this.activeSystem = 'spectacular';
            this.lastSpectacularTime = Date.now();
        }
    }

    dispose() {
        this.normalWeather.dispose();
        this.spectacularWeather.dispose();
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherOrchestrator;
}
