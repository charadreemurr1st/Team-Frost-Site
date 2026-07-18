// Audio Controller System
class AudioController {
    constructor() {
        this.audio = document.getElementById('bg-music');
        this.audioContext = null;
        this.mediaSource = null;
        this.bufferSource = null;
        this.reversedBuffer = null;
        this.isUsingBufferSource = false;
        this.gainNode = null;
        this.delayNode = null;
        this.delayGain = null;
        this.feedbackGain = null;
        this.convolver = null;
        this.reverbGain = null;
        this.isPlaying = false;
        this.isCorrupted = false;
        this.currentVolume = 0.3;
        this.init();
    }

    init() {
        if (this.audio) {
            this.audio.muted = false;
            this.audio.preload = 'auto';
            this.audio.crossOrigin = 'anonymous';
            this.audio.load();
            this.setupAudioGraph();
            this.setupEventListeners();
            this.setupAutoplay();
            this.setVolume(this.currentVolume);
            this.audio.addEventListener('error', (e) => {
                console.log('Audio loading error:', e);
            });
        }
    }

    setupAudioGraph() {
        if (this.audioContext) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            this.audioContext = new AudioContext();
            this.mediaSource = this.audioContext.createMediaElementSource(this.audio);
        } catch (error) {
            console.log('Audio graph initialization failed:', error);
            return;
        }
        this.gainNode = this.audioContext.createGain();
        this.delayNode = this.audioContext.createDelay();
        this.delayGain = this.audioContext.createGain();
        this.feedbackGain = this.audioContext.createGain();
        this.convolver = this.audioContext.createConvolver();
        this.reverbGain = this.audioContext.createGain();

        this.convolver.buffer = this.createReverbBuffer();
        this.delayNode.delayTime.value = 0.16;
        this.feedbackGain.gain.value = 0.45;
        this.delayGain.gain.value = 0;
        this.reverbGain.gain.value = 0;

        this.mediaSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.mediaSource.connect(this.delayNode);
        this.delayNode.connect(this.feedbackGain);
        this.feedbackGain.connect(this.delayNode);
        this.delayNode.connect(this.delayGain);
        this.delayGain.connect(this.audioContext.destination);

        this.mediaSource.connect(this.convolver);
        this.convolver.connect(this.reverbGain);
        this.reverbGain.connect(this.audioContext.destination);
    }

    createReverbBuffer() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2.2;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        return impulse;
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
                this.setVolume(this.currentVolume);
            });
        }
    }

    setVolume(value) {
        this.currentVolume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = this.currentVolume;
        }
    }

    setupAutoplay() {
        const playAudio = () => {
            if (this.audio && !this.isPlaying) {
                this.setupAudioGraph();
                this.audioContext && this.audioContext.resume();
                this.playAudioElement();
            }
            document.removeEventListener('click', playAudio);
        };

        document.addEventListener('click', playAudio, { once: true });
    }

    playAudioElement() {
        if (!this.audio) return;

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
            }).catch(err => {
                console.log('Audio play failed:', err);
            });
        } else {
            this.isPlaying = true;
            this.updateUI();
        }
    }

    async loadReversedBuffer() {
        if (this.reversedBuffer) {
            return this.reversedBuffer;
        }

        if (!this.audioContext || !this.audio) return null;

        const response = await fetch(this.audio.currentSrc || this.audio.src);
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
        const reversedBuffer = this.audioContext.createBuffer(decoded.numberOfChannels, decoded.length, decoded.sampleRate);

        for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
            const channelData = decoded.getChannelData(channel);
            const reversedData = reversedBuffer.getChannelData(channel);
            for (let i = 0; i < decoded.length; i++) {
                reversedData[i] = channelData[decoded.length - 1 - i];
            }
        }

        this.reversedBuffer = reversedBuffer;
        return reversedBuffer;
    }

    toggleMusic() {
        if (!this.audio) return;

        if (!this.audioContext) {
            this.setupAudioGraph();
        }

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.audioContext && this.audioContext.resume();
            this.playAudioElement();
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
            status.textContent = this.isPlaying ? (this.isCorrupted ? '!!!' : '♪') : '♪♪';
        }
    }

    stopMusicForCurse() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
            this.isPlaying = false;
            this.updateUI();
        }
        this.clearCorruptionEffect();
    }

    async resumeMusicWithCorruption() {
        if (!this.audio) return;
        this.isCorrupted = true;
        this.setCorruptionMode(true);
        document.title = 'QUART PANIC UNRECOVERABLE';
        enableCreepyAftermath();

        if (!this.audioContext) {
            this.setupAudioGraph();
        }

        if (this.delayGain) {
            this.delayGain.gain.setValueAtTime(0.28, this.audioContext.currentTime);
        }
        if (this.reverbGain) {
            this.reverbGain.gain.setValueAtTime(0.35, this.audioContext.currentTime);
        }

        if (this.audio && !this.audio.paused) {
            this.audio.pause();
        }

        const reversed = await this.loadReversedBuffer();
        if (reversed && this.audioContext) {
            if (this.bufferSource) {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
            }

            this.bufferSource = this.audioContext.createBufferSource();
            this.bufferSource.buffer = reversed;
            this.bufferSource.loop = true;
            this.bufferSource.connect(this.gainNode);
            this.bufferSource.connect(this.delayNode);
            this.bufferSource.connect(this.convolver);
            this.bufferSource.start();
            this.isUsingBufferSource = true;
            this.isPlaying = true;
            this.updateUI();
            this.startCorruptionEffect();
            return;
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateUI();
                this.startCorruptionEffect();
            }).catch(err => {
                console.log('Corrupted music play failed:', err);
            });
        } else {
            this.isPlaying = true;
            this.updateUI();
            this.startCorruptionEffect();
        }
    }

    startCorruptionEffect() {
        if (this.corruptionTimer) return;

        this.corruptionTimer = setInterval(() => {
            if (!this.audio) return;
            this.audio.playbackRate = 0.85 + Math.random() * 0.35;
            if (Math.random() > 0.7) {
                this.audio.currentTime = Math.max(0, this.audio.currentTime - 0.15);
            }
        }, 180);
    }

    clearCorruptionEffect() {
        if (this.corruptionTimer) {
            clearInterval(this.corruptionTimer);
            this.corruptionTimer = null;
        }
        if (this.audio) {
            this.audio.playbackRate = 1;
        }
        if (this.bufferSource) {
            this.bufferSource.stop();
            this.bufferSource.disconnect();
            this.bufferSource = null;
            this.isUsingBufferSource = false;
        }
        if (this.delayGain) {
            this.delayGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
        if (this.reverbGain) {
            this.reverbGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
        this.isCorrupted = false;
        this.setCorruptionMode(false);
        disableCreepyAftermath();
    }

    setCorruptionMode(enabled) {
        if (enabled) {
            document.body.classList.add('team-corrupted');
        } else {
            document.body.classList.remove('team-corrupted');
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

function showCurseErrorPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';

    const popup = document.createElement('div');
    popup.className = 'error-popup';

    popup.innerHTML = `
        <div class="error-titlebar">
            <span>FATAL EXCEPTION</span>
            <span style="font-weight: normal; color: #444;">X</span>
        </div>
        <div class="error-body">
            <div class="error-heading">QUART PANIC UNRECOVERABLE - FILES MISSING</div>
            <div class="error-subtext">OS HAS ENCOUNTERED A FATAL ERROR</div>
        </div>
        <div class="error-buttons">
            <button class="error-btn" type="button">ABORT</button>
            <button class="error-btn" type="button">OK</button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    document.body.classList.add('popup-dimmed');

    window.requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    const audio = document.getElementById('curse-error-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('Curse sound failed:', err));
    }

    popup.querySelectorAll('.error-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            document.body.classList.remove('popup-dimmed');
            if (window.pageAudioController) {
                window.pageAudioController.resumeMusicWithCorruption();
            }
        });
    });

    triggerHorrorWarning();
}

function triggerHorrorWarning() {
    const warning = document.createElement('div');
    warning.className = 'horror-warning';
    warning.textContent = 'YOU SHOULD NOT HAVE CLICKED THAT.';
    document.body.appendChild(warning);

    window.setTimeout(() => {
        warning.classList.add('fade-out');
    }, 2000);

    window.setTimeout(() => {
        if (document.body.contains(warning)) {
            document.body.removeChild(warning);
        }
    }, 3400);
}

function initializeCurseClick() {
    const curseLink = document.querySelector('.curse-link');
    if (curseLink) {
        curseLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.pageAudioController) {
                window.pageAudioController.stopMusicForCurse();
            }
            showCurseErrorPopup();
        });
    }
}

function enableCreepyAftermath() {
    document.body.classList.add('creepy-after-popup');

    const glitchSelectors = ['header h1', '.section h2', '.team-member h3', '.team-member .role'];
    glitchSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.dataset.text = el.textContent;
            el.classList.add('glitch-text');
        });
    });

    if (window.creepyInterval) {
        clearInterval(window.creepyInterval);
    }

    window.creepyInterval = setInterval(() => {
        const options = document.querySelectorAll('.glitch-text');
        if (!options.length) return;
        const choice = options[Math.floor(Math.random() * options.length)];
        choice.classList.add('glitch-active');
        setTimeout(() => choice.classList.remove('glitch-active'), 120);
    }, 600 + Math.random() * 400);
}

function disableCreepyAftermath() {
    document.body.classList.remove('creepy-after-popup');
    document.querySelectorAll('.glitch-text').forEach(el => {
        el.classList.remove('glitch-text', 'glitch-active');
    });
    if (window.creepyInterval) {
        clearInterval(window.creepyInterval);
        window.creepyInterval = null;
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
        window.pageAudioController = new AudioController();
    }
    
    // Initialize curse click on team page
    if (pageType === 'team') {
        initializeCurseClick();
    }

    // Check for secret page audio
    checkSecretPage();
});

// Make the first letter clickable for easter egg (set on specific element)
function initializeCurseClick() {
    const curseLink = document.querySelector('.curse-link');
    if (curseLink) {
        curseLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.pageAudioController) {
                window.pageAudioController.stopMusicForCurse();
            }
            showCurseErrorPopup();
        });
    }
}
