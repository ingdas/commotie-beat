class BeatCountdownTimer {
    constructor() {
        this.countdown = 0;
        this.bpm = 120;
        this.volume = 50; // Default volume 50%
        this.interval = null;
        this.audioContext = null;
        this.isRunning = false;
        this.originalCountdown = 0;
        this.lastBeatTime = 0;
        this.targetDurationMinutes = 30;
        this.remainingTimeSeconds = 0;
        this.timerInterval = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeElements() {
        this.setupPanel = document.getElementById('setupPanel');
        this.countdownPanel = document.getElementById('countdownPanel');
        this.durationInput = document.getElementById('durationInput');
        this.initialBpmInput = document.getElementById('initialBpmInput');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.countdownNumber = document.getElementById('countdownNumber');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.requiredBpmDisplay = document.getElementById('requiredBpmDisplay');
        this.currentBpm = document.getElementById('currentBpm');
        this.beatIndicator = document.getElementById('beatIndicator');
        this.sliderTrack = document.getElementById('sliderTrack');
        this.sliderThumb = document.getElementById('sliderThumb');
        this.sliderFill = document.getElementById('sliderFill');
        
        // Volume slider elements
        this.volumeSliderTrack = document.getElementById('volumeSliderTrack');
        this.volumeSliderThumb = document.getElementById('volumeSliderThumb');
        this.volumeSliderFill = document.getElementById('volumeSliderFill');
        this.currentVolume = document.getElementById('currentVolume');
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCountdown());
        this.stopBtn.addEventListener('click', () => this.toggleStopResume());
        this.resetBtn.addEventListener('click', () => this.resetCountdown());
        
        // Prevent non-numeric input for duration
        this.durationInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) e.target.value = 1;
            if (value > 999) e.target.value = 999;
        });
        
        // Prevent non-numeric input for initial BPM
        this.initialBpmInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 30) e.target.value = 30;
            if (value > 200) e.target.value = 200;
        });
        
        // BPM Slider functionality
        this.setupBpmSlider();
        
        // Volume Slider functionality
        this.setupVolumeSlider();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized successfully');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    setupBpmSlider() {
        let isDragging = false;
        
        const getSliderPosition = (e) => {
            const rect = this.sliderTrack.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const position = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(1, position));
        };
        
        const updateBpmFromPosition = (position) => {
            const newBpm = Math.round(30 + position * 170);
            const clampedBpm = Math.max(30, Math.min(200, newBpm));
            
            this.bpm = clampedBpm;
            this.currentBpm.textContent = clampedBpm;
            this.updateSliderPosition(clampedBpm);
        };
        
        const applyBpmChange = () => {
            // Update the interval timing without restarting the countdown
            if (this.isRunning && this.interval) {
                // Store the current time to maintain synchronization
                const now = Date.now();
                const timeSinceLastBeat = now - this.lastBeatTime;
                const newIntervalMs = (60 / this.bpm) * 1000;
                
                // Calculate when the next beat should occur
                const nextBeatTime = this.lastBeatTime + newIntervalMs;
                const timeUntilNextBeat = Math.max(0, nextBeatTime - now);
                
                // Clear current interval
                clearInterval(this.interval);
                
                // Set a timeout for the next beat, then start the regular interval
                setTimeout(() => {
                    this.countdown--;
                    this.playBassDrum();
                    this.triggerBeatAnimation();
                    this.lastBeatTime = Date.now();
                    
                    if (this.countdown <= 0) {
                        this.stopCountdown();
                        this.showCompletion();
                    } else {
                        this.updateDisplay();
                        
                        // Start the regular interval after the first beat
                        this.interval = setInterval(() => {
                            this.countdown--;
                            this.playBassDrum();
                            this.triggerBeatAnimation();
                            this.lastBeatTime = Date.now();
                            
                            if (this.countdown <= 0) {
                                this.stopCountdown();
                                this.showCompletion();
                            } else {
                                this.updateDisplay();
                            }
                        }, newIntervalMs);
                    }
                }, timeUntilNextBeat);
            }
            
            // Update the required BPM display
            this.updateDisplay();
        };
        
        // Mouse events
        this.sliderTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        this.sliderThumb.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                applyBpmChange();
            }
            isDragging = false;
        });
        
        // Touch events for mobile
        this.sliderTrack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        this.sliderThumb.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                applyBpmChange();
            }
            isDragging = false;
        });
        
        // Initialize slider position
        this.updateSliderPosition(this.bpm);
    }
    
    setupVolumeSlider() {
        let isDragging = false;
        
        const getVolumeSliderPosition = (e) => {
            const rect = this.volumeSliderTrack.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const position = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(1, position));
        };
        
        const updateVolumeFromPosition = (position) => {
            const newVolume = Math.round(20 + position * 80); // Map 0-1 to 20-100
            const clampedVolume = Math.max(20, Math.min(100, newVolume));
            
            this.volume = clampedVolume;
            this.currentVolume.textContent = clampedVolume;
            this.updateVolumeSliderPosition(clampedVolume);
        };
        
        // Mouse events
        this.volumeSliderTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        this.volumeSliderThumb.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Touch events for mobile
        this.volumeSliderTrack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        this.volumeSliderThumb.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDragging = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Initialize volume slider position
        this.updateVolumeSliderPosition(this.volume);
    }
    
    updateSliderPosition(bpm) {
        // Convert BPM to position (0-1)
        const position = (bpm - 30) / 170;
        const percentage = position * 100;
        
        this.sliderThumb.style.left = `${percentage}%`;
        this.sliderFill.style.width = `${percentage}%`;
    }
    
    updateVolumeSliderPosition(volume) {
        // Convert volume (20-100) to position (0-100%)
        const percentage = ((volume - 20) / 80) * 100;
        
        this.volumeSliderThumb.style.left = `${percentage}%`;
        this.volumeSliderFill.style.width = `${percentage}%`;
    }
    
    playBassDrum() {
        if (!this.audioContext) return;
        
        // Create a more realistic kick drum sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Connect the audio chain
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set filter for kick drum character
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        
        // Kick drum frequency sweep
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
        
        // Volume envelope with user-controlled volume
        const volumeMultiplier = this.volume / 100; // Convert percentage to 0-1 range
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volumeMultiplier, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        // Start and stop the oscillator
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    startCountdown() {
        const durationValue = parseInt(this.durationInput.value);
        const initialBpmValue = parseInt(this.initialBpmInput.value);
        
        if (durationValue < 1) {
            alert('Please enter a valid duration (1-999 minutes)');
            return;
        }
        
        if (initialBpmValue < 30 || initialBpmValue > 200) {
            alert('Please enter a valid BPM (30-200)');
            return;
        }
        
        this.targetDurationMinutes = durationValue;
        this.remainingTimeSeconds = durationValue * 60;
        
        // Use the initial BPM from user input
        this.bpm = initialBpmValue;
        
        // Calculate how many beats we need based on the BPM
        this.countdown = this.calculateRequiredBeats();
        this.originalCountdown = this.countdown;
        
        this.isRunning = true;
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.updateDisplay();
        this.updateTimerDisplay();
        this.updateSliderPosition(this.bpm);
        this.updateVolumeSliderPosition(this.volume);
        this.showCountdownPanel();
        this.startTimer();
        this.startCountdownTimer();
    }
    
    calculateRequiredBeats() {
        // Calculate how many beats we need to count down from
        // Based on the target duration and BPM
        return Math.ceil((this.remainingTimeSeconds * this.bpm) / 60);
    }
    

    
    startTimer() {
        const intervalMs = (60 / this.bpm) * 1000; // Convert BPM to milliseconds
        
        // Initialize the last beat time
        this.lastBeatTime = Date.now();
        
        this.interval = setInterval(() => {
            this.countdown--;
            this.playBassDrum();
            this.triggerBeatAnimation();
            this.lastBeatTime = Date.now();
            
            if (this.countdown <= 0) {
                this.stopCountdown();
                this.showCompletion();
            } else {
                this.updateDisplay();
            }
        }, intervalMs);
        
        // Play first beat immediately
        this.playBassDrum();
        this.triggerBeatAnimation();
    }
    
    startCountdownTimer() {
        this.timerInterval = setInterval(() => {
            this.remainingTimeSeconds--;
            this.updateTimerDisplay();
            
            if (this.remainingTimeSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTimeSeconds / 60);
        const seconds = this.remainingTimeSeconds % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    toggleStopResume() {
        if (this.isRunning) {
            this.stopCountdown();
        } else {
            this.resumeCountdown();
        }
    }
    
    stopCountdown() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        this.beatIndicator.classList.remove('active');
        this.stopBtn.textContent = 'Resume';
        this.stopBtn.classList.remove('stop-btn');
        this.stopBtn.classList.add('resume-btn');
    }
    
    resumeCountdown() {
        if (this.countdown > 0) {
            this.isRunning = true;
            this.startTimer();
            this.startCountdownTimer();
            this.stopBtn.textContent = 'Stop';
            this.stopBtn.classList.remove('resume-btn');
            this.stopBtn.classList.add('stop-btn');
        }
    }
    
    restartTimer() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.startTimer();
    }
    
    resetCountdown() {
        this.stopCountdown();
        this.countdown = this.originalCountdown;
        this.remainingTimeSeconds = this.targetDurationMinutes * 60;
        this.bpm = parseInt(this.initialBpmInput.value);
        this.updateDisplay();
        this.updateTimerDisplay();
        this.updateSliderPosition(this.bpm);
        this.showSetupPanel();
        // Reset button to Stop state
        this.stopBtn.textContent = 'Stop';
        this.stopBtn.classList.remove('resume-btn');
        this.stopBtn.classList.add('stop-btn');
    }
    
    updateDisplay() {
        this.countdownNumber.textContent = this.countdown;
        this.currentBpm.textContent = this.bpm;
        
        // Calculate the BPM needed to finish exactly when timer reaches zero
        const requiredBpm = Math.round((this.countdown * 60) / this.remainingTimeSeconds);
        this.requiredBpmDisplay.textContent = `Required BPM: ${requiredBpm}`;
    }
    
    triggerBeatAnimation() {
        this.countdownNumber.classList.add('beat');
        this.beatIndicator.classList.add('active');
        
        setTimeout(() => {
            this.countdownNumber.classList.remove('beat');
            this.beatIndicator.classList.remove('active');
        }, 200);
    }
    
    showCountdownPanel() {
        this.setupPanel.style.display = 'none';
        this.countdownPanel.style.display = 'block';
    }
    
    showSetupPanel() {
        this.countdownPanel.style.display = 'none';
        this.setupPanel.style.display = 'block';
    }
    
    showCompletion() {
        this.countdownNumber.textContent = 'Done!';
        this.countdownNumber.style.color = '#48bb78';
        this.countdownNumber.style.textShadow = '0 4px 8px rgba(72, 187, 120, 0.3)';
        this.timerDisplay.textContent = '00:00';
        
        setTimeout(() => {
            this.resetCountdown();
        }, 2000);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeatCountdownTimer();
});
