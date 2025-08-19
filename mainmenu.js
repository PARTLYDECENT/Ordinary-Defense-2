window.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('mainMenu');
    const startGameBtn = document.getElementById('startGameBtn');
    const videoContainer = document.getElementById('videoContainer');
    const introVideo = document.getElementById('introVideo');

    if (mainMenu && startGameBtn && videoContainer && introVideo) {
        mainMenu.style.display = 'flex';
        document.body.classList.add('custom-main-menu-cursor'); // Add custom cursor class

        startGameBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            document.body.classList.remove('custom-main-menu-cursor'); // Remove custom cursor class
            videoContainer.style.display = 'flex';
            introVideo.play().catch(e => {
                console.error("Error playing intro video:", e);
                if (window.game) {
                    game.startGameAfterVideo();
                }
            });
        });
    }
});
