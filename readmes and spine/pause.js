class PauseMenu {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.menuElement = null;
        this.createMenu();
    }

    createMenu() {
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'pauseOverlay';
        this.menuElement.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.95); z-index: 1000;
            background-image: url('assets/images/pause1.jpg');
            background-size: cover;
            background-position: center;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #ff8c00; font-family: 'Share Tech Mono', monospace;
            text-shadow: 0 0 5px #ff8c00;
            display: none; /* Hidden by default */
        `;

        this.menuElement.innerHTML = `
            <div style="background: rgba(10, 10, 10, 0.85); border-image: linear-gradient(45deg, #ff8c00, #ff4500) 1; border-width: 2px; border-style: solid; padding: 25px 50px; box-shadow: 0 0 25px rgba(255, 140, 0, 0.6); text-align: center; backdrop-filter: blur(5px);">
                <h1 style="font-size: 3em; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 6px; color: #ffaf40;">Ordianry Defense 2</h1>
                <h2 style="font-size: 1.5em; margin-bottom: 30px; color: #ff8c00; font-weight: normal;">SYSTEM PAUSED</h2>
                <div class="menu-options" style="display: flex; flex-direction: column; gap: 18px;">
                    <button id="resumeBtn" class="menu-btn">RESUME</button>
                    <button id="restartBtn" class="menu-btn">RESTART</button>
                    <button id="inspectorBtn" class="menu-btn">DEBUG INSPECTOR</button>
                    <button id="exitBtn" class="menu-btn">EXIT</button>
                </div>
                <div style="margin-top: 40px; font-size: 1em; color: #ff8c00;">
                    <p>Current Wave: <span id="pauseWave">${this.game.wave}</span></p>
                    <p>Gold: <span id="pauseGold">${this.game.gold}</span> | Lives: <span id="pauseLives">${this.game.lives}</span></p>
                </div>
            </div>
            <style>
                .menu-btn {
                    background: linear-gradient(45deg, #ff8c00, #ff4500);
                    border: none;
                    color: #fff;
                    padding: 12px 25px;
                    font-family: 'Share Tech Mono', monospace;
                    font-size: 1.2em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    box-shadow: 0 0 10px rgba(255, 140, 0, 0.7);
                    border-radius: 5px;
                }
                .menu-btn:hover {
                    box-shadow: 0 0 20px rgba(255, 140, 0, 1);
                    transform: translateY(-2px);
                }
                .menu-btn:active {
                    transform: translateY(0px);
                    box-shadow: 0 0 5px rgba(255, 140, 0, 0.7);
                }
            </style>
        `;
        document.body.appendChild(this.menuElement);

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('resumeBtn').onclick = () => this.game.togglePause();
        document.getElementById('restartBtn').onclick = () => location.reload();
        document.getElementById('exitBtn').onclick = () => window.close(); // Or redirect to a main menu
        document.getElementById('inspectorBtn').onclick = () => {
            if (this.game.scene.debugLayer.isVisible()) {
                this.game.scene.debugLayer.hide();
            } else {
                this.game.scene.debugLayer.show();
            }
        };
    }

    show() {
        this.menuElement.style.display = 'flex';
        // Update stats
        document.getElementById('pauseWave').textContent = this.game.wave;
        document.getElementById('pauseGold').textContent = this.game.gold;
        document.getElementById('pauseLives').textContent = this.game.lives;
    }

    hide() {
        this.menuElement.style.display = 'none';
    }
}