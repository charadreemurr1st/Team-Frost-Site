// Audio Controller System
class AudioController {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.isPlaying = false;
        this.currentVolume = 0.3;
        this.init();
    }

    init() {
        if (this.audio) {
            this.audio.volume = this.currentVolume;
            this.setupEventListeners();
            this.setupAutoplay();
        }
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('music-toggle');
        const volumeSlider = document.getElementById('volume-slider');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleMusic());
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.currentVolume = e.target.value / 100;
                if (this.audio) {
                    this.audio.volume = this.currentVolume;
                }
            });
        }
    }

    setupAutoplay() {
        const playAudio = () => {
            if (this.audio && !this.isPlaying) {
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updateUI();
                }).catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            }
            document.removeEventListener('click', playAudio);
        };

        document.addEventListener('click', playAudio, { once: true });
    }

    toggleMusic() {
        if (!this.audio) return;

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audio.play().then(() => {
                this.isPlaying = true;
            }).catch(err => {
                console.log('Play failed:', err);
            });
        }
        this.updateUI();
    }

    updateUI() {
        const toggleBtn = document.getElementById('music-toggle');
        const status = document.getElementById('audio-status');

        if (toggleBtn) {
            toggleBtn.textContent = this.isPlaying ? 'MUSIC: ON' : 'MUSIC: OFF';
            toggleBtn.classList.toggle('active', this.isPlaying);
        }

        if (status) {
            status.textContent = this.isPlaying ? '♪' : '♪♪';
        }
    }
}

// Background Animation System
class BackgroundAnimationSystem {
    constructor(pageType) {
        this.pageType = pageType;
        this.container = this.createContainer();
        this.setup();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'background-animation';
        document.body.appendChild(container);
        return container;
    }

    setup() {
        switch(this.pageType) {
            case 'home':
                this.createStarfield();
                break;
            case 'gamedev':
                this.createParticles();
                break;
            case 'team':
                this.createWaves();
                break;
            default:
                this.createStarfield();
        }
    }

    createStarfield() {
        const numStars = 100;
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.opacity = Math.random() * 0.6 + 0.3;
            this.container.appendChild(star);
        }
    }

    createParticles() {
        const numParticles = 30;
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = Math.random() * 40 + 20 + 'px';
            particle.style.height = Math.random() * 40 + 20 + 'px';
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            this.container.appendChild(particle);
        }
    }

    createWaves() {
        const numWaves = 5;
        for (let i = 0; i < numWaves; i++) {
            const wave = document.createElement('div');
            wave.style.position = 'absolute';
            wave.style.width = '200%';
            wave.style.height = '100px';
            wave.style.top = (i * 80) + 'px';
            wave.style.left = '0';
            wave.style.borderTop = '2px solid #00D9FF';
            wave.style.borderBottom = '1px dashed #00D9FF';
            wave.style.opacity = 0.3 - (i * 0.05);
            wave.style.animation = `wave-flow ${60 + (i * 20)}s linear infinite`;
            wave.style.animationDelay = (i * -10) + 's';
            this.container.appendChild(wave);
        }
    }
}

// Get current page type
function getCurrentPageType() {
    const fileName = window.location.pathname.split('/').pop() || 'index.html';
    if (fileName.includes('index') || fileName === '') return 'home';
    if (fileName.includes('gamedev')) return 'gamedev';
    if (fileName.includes('team')) return 'team';
    return 'home';
}

// Check if we're on the secret page and play the secret audio
function checkSecretPage() {
    if (window.location.pathname.includes('secret.html')) {
        const audio = new Audio('Z.wav');
        setTimeout(() => {
            audio.play().catch(err => console.log('Audio play failed:', err));
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const pageType = getCurrentPageType();
    
    // Set page attribute for CSS targeting
    document.body.setAttribute('data-page', pageType);
    
    // Initialize background animations (skip on secret page)
    if (!window.location.pathname.includes('secret.html')) {
        new BackgroundAnimationSystem(pageType);
    }
    
    // Initialize audio controller (skip on secret page)
    if (!window.location.pathname.includes('secret.html')) {
        new AudioController();
    }
    
    // Check for secret page audio
    checkSecretPage();
});

// Make the first letter clickable for easter egg (set on specific element)
function initializeEasterEgg(elementSelector) {
    const element = document.querySelector(elementSelector);
    if (element) {
        const firstLetter = element.textContent.charAt(0);
        const html = element.innerHTML;
        const newHtml = `<a href="secret.html" class="easter-egg-link" style="display: inline; border: none;">${firstLetter}</a>` + html.substring(1);
        element.innerHTML = newHtml;
    }
}
