window.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('mainMenu');
    const startGameBtn = document.getElementById('startGameBtn');
    const videoContainer = document.getElementById('videoContainer');
    const introVideo = document.getElementById('introVideo');
    const emojiRainContainer = document.getElementById('emojiRainContainer');
    const nightvisionOverlay = document.getElementById('nightvisionOverlay');
    const introMusicSound = document.getElementById('introMusicSound'); // Get the introMusicSound element

    if (mainMenu && startGameBtn && videoContainer && introVideo) {
        mainMenu.style.display = 'flex';
        document.body.classList.add('custom-main-menu-cursor'); // Add custom cursor class

        startGameBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            document.body.classList.remove('custom-main-menu-cursor'); // Remove custom cursor class
            videoContainer.style.display = 'flex';
            introVideo.muted = true; // Mute video to allow autoplay
            introVideo.play().catch(e => {
                console.error("Error playing intro video:", e);
                if (window.game) {
                    game.startGameAfterVideo();
                }
            });

            // Play introMusicSound when start button is pressed
            if (introMusicSound) {
                introMusicSound.play().catch(e => {
                    console.error("Error playing intro music sound:", e);
                });
            }
        });
    }

    // --- Background Slideshow ---
    const backgrounds = [];
    for (let i = 1; i <= 10; i++) {
        backgrounds.push(`assets/images/bg${i}.jpg`);
    }

    let currentBgIndex = 0;

    function changeBackground() {
        if (!mainMenu) return;

        let nextBgIndex;
        do {
            nextBgIndex = Math.floor(Math.random() * backgrounds.length);
        } while (nextBgIndex === currentBgIndex);

        currentBgIndex = nextBgIndex;
        mainMenu.style.backgroundImage = `url('${backgrounds[currentBgIndex]}')`;

        // Call itself again with a new random delay
        setTimeout(changeBackground, Math.random() * 5000 + 3000); // 3-8 seconds
    }

    // Start the slideshow after an initial delay
    setTimeout(changeBackground, Math.random() * 3000 + 2000); // 2-5 seconds


    // --- Emoji Rain Effect ---
    const emojis = ['🚀', '🌌', '🌠', '🛰️', '👽', '✨', '💫', '☄️', '👾'];

    function createEmoji() {
        if (!emojiRainContainer) return;

        const emoji = document.createElement('span');
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.position = 'absolute';
        emoji.style.fontSize = `${Math.random() * 2 + 1}rem`; // 1 to 3rem
        emoji.style.left = `${Math.random() * 100}vw`;
        emoji.style.top = '-50px'; // Start above the screen
        emoji.style.opacity = '1';
        emoji.style.pointerEvents = 'none';
        emoji.style.transition = 'transform linear, opacity linear'; // Smooth transition for falling

        emojiRainContainer.appendChild(emoji);

        // Animate falling
        const duration = Math.random() * 5 + 5; // 5 to 10 seconds
        const delay = Math.random() * 2; // 0 to 2 seconds delay
        const endY = window.innerHeight + 50; // End below the screen

        emoji.style.transitionDuration = `${duration}s`;
        emoji.style.transitionDelay = `${delay}s`;
        emoji.style.transform = `translateY(${endY}px)`;
        emoji.style.opacity = '0'; // Fade out as it falls

        // Remove emoji after animation
        emoji.addEventListener('transitionend', () => {
            emoji.remove();
        });
    }

    // Start emoji rain
    if (emojiRainContainer) {
        setInterval(createEmoji, Math.random() * 500 + 100); // Create an emoji every 100-600ms
    }

    // --- Nightvision Flickering Effect ---
    function toggleNightvision() {
        if (!nightvisionOverlay) return;

        const isActive = nightvisionOverlay.classList.contains('nightvision-active');
        if (!isActive) {
            nightvisionOverlay.classList.add('nightvision-active');
            // Turn off after a random short duration
            setTimeout(() => {
                nightvisionOverlay.classList.remove('nightvision-active');
            }, Math.random() * 300 + 100); // Active for 100-400ms
        }
    }

    // Start nightvision flickering
    if (nightvisionOverlay) {
        setInterval(toggleNightvision, Math.random() * 2000 + 1000); // Flicker every 1-3 seconds
    }
});