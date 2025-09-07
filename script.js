class BeatCountdownTimer {
    constructor() {
        this.countdown = 0;
        this.bpm = 120;
        this.volume = 50; // Default volume 50%
        this.audioContext = null;
        this.isRunning = false;
        this.originalCountdown = 0;
        this.startTime = 0;
        this.targetDurationMinutes = 30;
        this.remainingTimeSeconds = 0;
        this.timerInterval = null;
        this.isHeartbeatMode = false;
        this.beatFrequency = 1; // Default: every beat
        this.selectedSound = 'Thump'; // Default sound type
        
        // MIDI-like scheduling system
        this.animationFrameId = null;
        this.scheduledBeats = [];
        this.scheduledVisualBeats = []; // Separate queue for visual countdown updates
        this.nextBeatTime = 0;
        this.beatInterval = 0;
        this.lastScheduledBeat = 0;
        this.lookaheadTime = 0.5; // Schedule beats ahead (seconds)
        
        // Sound configuration data structure
        this.soundConfig = [
            {
                generator: 'scheduleKickDrumAudio',
                label: 'Thump'
            },
            {
                url: './kickdrum.wav',
                label: 'Kick Drum'
            },
            {
                generator: 'scheduleHeartbeatAudio',
                label: 'Heart Beat'
            },
            {
                generator: 'scheduleClockAudio',
                label: 'Clock'
            },
            {
                url: './metronome.wav',
                label: 'Metronome'
            },
            {
                generator: 'scheduleBellAudio',
                label: 'Bell'
            }
        ];
        
        // Audio buffers for URL-based sounds
        this.audioBuffers = {
            clock: null,
            metronome: null
        };
        
        this.initializeElements();
        this.generateSoundButtons();
        this.setupEventListeners();
        this.initializeAudio();
        this.loadAudioFiles();
        
        // Log available sounds for debugging
        console.log('Available sounds:', this.getAvailableSounds());
        console.log('Sound configuration:', this.soundConfig);
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

        // Sound buttons will be generated dynamically
        this.soundButtons = {};
        this.freq1Btn = document.getElementById('freq1Btn');
        this.freq2Btn = document.getElementById('freq2Btn');
        this.freq3Btn = document.getElementById('freq3Btn');
        this.freq4Btn = document.getElementById('freq4Btn');
        this.sliderTrack = document.getElementById('sliderTrack');
        this.sliderThumb = document.getElementById('sliderThumb');
        this.sliderFill = document.getElementById('sliderFill');
        
        // Volume slider elements
        this.volumeSliderTrack = document.getElementById('volumeSliderTrack');
        this.volumeSliderThumb = document.getElementById('volumeSliderThumb');
        this.volumeSliderFill = document.getElementById('volumeSliderFill');
        this.currentVolume = document.getElementById('currentVolume');
    }
    
    generateSoundButtons() {
        const soundButtonsContainer = document.querySelector('.sound-buttons');
        
        // Clear existing buttons
        soundButtonsContainer.innerHTML = '';
        
        // Generate buttons from sound configuration
        this.soundConfig.forEach(soundConfig => {
            const button = document.createElement('button');
            button.id = `${soundConfig.label.replace(/\s+/g, '')}Btn`;
            button.className = 'sound-btn';
            button.textContent = soundConfig.label;
            button.dataset.soundType = soundConfig.label;
            
            // Set first button as active by default
            if (soundConfig.label === this.selectedSound) {
                button.classList.add('active');
            }
            
            soundButtonsContainer.appendChild(button);
            this.soundButtons[soundConfig.label] = button;
        });
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCountdown());
        this.stopBtn.addEventListener('click', () => this.toggleStopResume());
        this.resetBtn.addEventListener('click', () => this.resetCountdown());

        
        // Sound selection controls - use event delegation for dynamic buttons
        document.querySelector('.sound-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-btn')) {
                const soundType = e.target.dataset.soundType;
                this.setSoundType(soundType);
            }
        });
        
        // Beat frequency controls
        this.freq1Btn.addEventListener('click', () => this.setBeatFrequency(1));
        this.freq2Btn.addEventListener('click', () => this.setBeatFrequency(2));
        this.freq3Btn.addEventListener('click', () => this.setBeatFrequency(3));
        this.freq4Btn.addEventListener('click', () => this.setBeatFrequency(4));
        
        // Handle duration input - only clean non-numeric characters, validate on blur
        this.durationInput.addEventListener('input', (e) => {
            // Only remove non-numeric characters, don't enforce min/max while typing
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.durationInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) {
                e.target.value = 1;
            } else if (value > 999) {
                e.target.value = 999;
            }
        });
        
        // Handle initial BPM input - only clean non-numeric characters, validate on blur
        this.initialBpmInput.addEventListener('input', (e) => {
            // Only remove non-numeric characters, don't enforce min/max while typing
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.initialBpmInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 30) {
                e.target.value = 30;
            } else if (value > 200) {
                e.target.value = 200;
            }
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
    
    async loadAudioFiles() {
        if (!this.audioContext) return;
        
        try {
            // Load URL-based sounds from configuration
            for (const soundConfig of this.soundConfig) {
                if (soundConfig.url) {
                    await this.loadUrlBasedSound(soundConfig.label, soundConfig);
                }
            }
        } catch (error) {
            console.error('Error loading audio files:', error);
        }
    }
    
    async loadUrlBasedSound(soundKey, soundConfig) {
        try {
            this.audioBuffers[soundKey] = await this.loadAudioBuffer(soundConfig.url);
            console.log(`${soundKey} sound loaded successfully`);
        } catch (e) {
            console.warn(`Failed to load ${soundKey} from URL:`, e);
            console.log(`Using fallback generated ${soundKey} sound`);
        }
    }
    
    async loadAudioBuffer(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading audio from ${url}:`, error);
            throw error;
        }
    }
    
    playAudioBuffer(audioBuffer, scheduledTime) {
        if (!audioBuffer || !this.audioContext) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Apply volume control
        const volumeMultiplier = this.volume / 100;
        gainNode.gain.setValueAtTime(volumeMultiplier, scheduledTime);
        
        // Schedule playback
        source.start(scheduledTime);
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
            // Update the beat interval for MIDI-like scheduling
            if (this.isRunning) {
                this.beatInterval = 60 / this.bpm;
                // Clear existing scheduled beats and reschedule with new timing
                this.scheduledBeats = [];
                this.nextBeatTime = this.audioContext.currentTime;
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
        // This method is kept for the immediate first beat
        // All other beats are handled by the scheduled audio system
        if (!this.audioContext) return;
        
        this.scheduleBeatAudio(this.audioContext.currentTime);
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
        // Calculate beat interval in seconds
        this.beatInterval = 60 / this.bpm;
        this.startTime = this.audioContext.currentTime;
        this.nextBeatTime = this.startTime;
        this.lastScheduledBeat = 0;
        
        // Start the MIDI-like scheduling loop
        this.scheduleBeats();
        this.animationFrameId = requestAnimationFrame(() => this.schedulerLoop());
        
        // Play first beat immediately if it matches frequency
        if (this.countdown % this.beatFrequency === 0) {
            this.playBassDrum();
            this.triggerBeatAnimation();
        }
    }
    
    scheduleBeats() {
        const currentTime = this.audioContext.currentTime;
        const scheduleEndTime = currentTime + this.lookaheadTime;
        
        // Schedule beats up to the lookahead time
        while (this.nextBeatTime < scheduleEndTime && this.countdown > 0) {
            const beatNumber = this.originalCountdown - this.countdown + 1;
            
            // Schedule visual countdown for every beat
            this.scheduledVisualBeats.push({
                time: this.nextBeatTime,
                beatNumber: beatNumber
            });
            
            // Only schedule audio for beats that match the frequency
            if (beatNumber % this.beatFrequency === 0) {
                this.scheduledBeats.push({
                    time: this.nextBeatTime,
                    beatNumber: beatNumber
                });
                
                // Schedule the audio
                this.scheduleBeatAudio(this.nextBeatTime);
            }
            
            this.nextBeatTime += this.beatInterval;
            this.countdown--;
            
            if (this.countdown <= 0) {
                break;
            }
        }
    }
    
    scheduleBeatAudio(scheduledTime) {
        const soundConfig = this.soundConfig.find(sound => sound.label === this.selectedSound);
        
        if (!soundConfig) {
            console.warn(`Unknown sound type: ${this.selectedSound}, falling back to Thump`);
            this.scheduleKickDrumAudio(scheduledTime);
            return;
        }
        
        if (soundConfig.url) {
            // URL-based sound: try to use loaded audio buffer first
            if (this.audioBuffers[this.selectedSound]) {
                this.playAudioBuffer(this.audioBuffers[this.selectedSound], scheduledTime);
            } else {
                // Fall back to generated sound
                this[soundConfig.generator](scheduledTime);
            }
        } else if (soundConfig.generator) {
            // Function-based sound: use the generator function
            this[soundConfig.generator](scheduledTime);
        }
    }
    
    scheduleKickDrumAudio(scheduledTime) {
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
        filter.frequency.setValueAtTime(200, scheduledTime);
        filter.frequency.exponentialRampToValueAtTime(50, scheduledTime + 0.1);
        
        // Kick drum frequency sweep
        oscillator.frequency.setValueAtTime(80, scheduledTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, scheduledTime + 0.1);
        
        // Volume envelope with user-controlled volume
        const volumeMultiplier = this.volume / 100;
        gainNode.gain.setValueAtTime(0, scheduledTime);
        gainNode.gain.linearRampToValueAtTime(volumeMultiplier, scheduledTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.3);
        
        // Start and stop the oscillator
        oscillator.start(scheduledTime);
        oscillator.stop(scheduledTime + 0.3);
    }
    
    scheduleHeartbeatAudio(scheduledTime) {
        const volumeMultiplier = this.volume / 100;
        
        // Calculate the beat interval in seconds
        const beatInterval = 60 / this.bpm;
        // Second beat occurs at 1/4 of the beat interval
        const secondBeatDelay = beatInterval * 0.25;
        
        // First beat (stronger)
        const oscillator1 = this.audioContext.createOscillator();
        const gainNode1 = this.audioContext.createGain();
        const filter1 = this.audioContext.createBiquadFilter();
        
        oscillator1.connect(filter1);
        filter1.connect(gainNode1);
        gainNode1.connect(this.audioContext.destination);
        
        // Heartbeat character - lower frequency, softer attack
        filter1.type = 'lowpass';
        filter1.frequency.setValueAtTime(150, scheduledTime);
        filter1.frequency.exponentialRampToValueAtTime(40, scheduledTime + 0.15);
        
        oscillator1.frequency.setValueAtTime(60, scheduledTime);
        oscillator1.frequency.exponentialRampToValueAtTime(15, scheduledTime + 0.15);
        
        // Volume envelope for first beat
        gainNode1.gain.setValueAtTime(0, scheduledTime);
        gainNode1.gain.linearRampToValueAtTime(volumeMultiplier * 2, scheduledTime + 0.02);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.4);
        
        oscillator1.start(scheduledTime);
        oscillator1.stop(scheduledTime + 0.4);
        
        // Second beat (softer, slightly higher pitch)
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode2 = this.audioContext.createGain();
        const filter2 = this.audioContext.createBiquadFilter();
        
        oscillator2.connect(filter2);
        filter2.connect(gainNode2);
        gainNode2.connect(this.audioContext.destination);
        
        filter2.type = 'lowpass';
        filter2.frequency.setValueAtTime(180, scheduledTime + secondBeatDelay);
        filter2.frequency.exponentialRampToValueAtTime(50, scheduledTime + secondBeatDelay + 0.15);
        
        oscillator2.frequency.setValueAtTime(70, scheduledTime + secondBeatDelay);
        oscillator2.frequency.exponentialRampToValueAtTime(20, scheduledTime + secondBeatDelay + 0.15);
        
        // Volume envelope for second beat (softer)
        gainNode2.gain.setValueAtTime(0, scheduledTime + secondBeatDelay);
        gainNode2.gain.linearRampToValueAtTime(volumeMultiplier * 1.5, scheduledTime + secondBeatDelay + 0.02);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, scheduledTime + secondBeatDelay + 0.35);
        
        oscillator2.start(scheduledTime + secondBeatDelay);
        oscillator2.stop(scheduledTime + secondBeatDelay + 0.35);
    }
    
    scheduleClockAudio(scheduledTime) {
        // Use WAV file if available, otherwise fall back to generated sound
        if (this.audioBuffers.clock) {
            this.playAudioBuffer(this.audioBuffers.clock, scheduledTime);
        } else {
            // Fallback to generated clock tick sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Clock tick character - sharp, metallic
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(2000, scheduledTime);
            filter.frequency.exponentialRampToValueAtTime(800, scheduledTime + 0.05);
            
            oscillator.frequency.setValueAtTime(3000, scheduledTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, scheduledTime + 0.05);
            
            // Sharp, quick envelope
            const volumeMultiplier = this.volume / 100;
            gainNode.gain.setValueAtTime(0, scheduledTime);
            gainNode.gain.linearRampToValueAtTime(volumeMultiplier * 0.6, scheduledTime + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.1);
            
            oscillator.start(scheduledTime);
            oscillator.stop(scheduledTime + 0.1);
        }
    }
    
    scheduleMetronomeAudio(scheduledTime) {
        // Use WAV file if available, otherwise fall back to generated sound
        if (this.audioBuffers.metronome) {
            this.playAudioBuffer(this.audioBuffers.metronome, scheduledTime);
        } else {
            // Fallback to generated metronome click sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Metronome character - clean, precise
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2000, scheduledTime);
            filter.Q.setValueAtTime(5, scheduledTime);
            
            oscillator.frequency.setValueAtTime(2000, scheduledTime);
            
            // Clean, precise envelope
            const volumeMultiplier = this.volume / 100;
            gainNode.gain.setValueAtTime(0, scheduledTime);
            gainNode.gain.linearRampToValueAtTime(volumeMultiplier * 0.7, scheduledTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.15);
            
            oscillator.start(scheduledTime);
            oscillator.stop(scheduledTime + 0.15);
        }
    }
    
    scheduleBellAudio(scheduledTime) {
        // Create a bell sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Bell character - bright, resonant
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, scheduledTime);
        filter.frequency.exponentialRampToValueAtTime(1000, scheduledTime + 0.5);
        
        oscillator.frequency.setValueAtTime(800, scheduledTime);
        
        // Bell envelope - quick attack, long decay
        const volumeMultiplier = this.volume / 100;
        gainNode.gain.setValueAtTime(0, scheduledTime);
        gainNode.gain.linearRampToValueAtTime(volumeMultiplier * 0.8, scheduledTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 1.0);
        
        oscillator.start(scheduledTime);
        oscillator.stop(scheduledTime + 1.0);
    }
    
    schedulerLoop() {
        if (!this.isRunning) return;
        
        const currentTime = this.audioContext.currentTime;
        
        // Check for visual countdown beats (every beat interval)
        while (this.scheduledVisualBeats.length > 0 && this.scheduledVisualBeats[0].time <= currentTime) {
            const visualBeat = this.scheduledVisualBeats.shift();
            this.updateDisplay();
        }
        
        // Check for audio beats (only beats that match frequency)
        while (this.scheduledBeats.length > 0 && this.scheduledBeats[0].time <= currentTime) {
            const audioBeat = this.scheduledBeats.shift();
            // Log timing accuracy for debugging
            const timingError = Math.abs(currentTime - audioBeat.time);
            if (timingError > 0.01) { // Log if timing error is > 10ms
                console.log(`Timing error: ${(timingError * 1000).toFixed(2)}ms`);
            }
            this.triggerBeatAnimation();
        }
        
        // Check if we're done
        if (this.countdown <= 0) {
            this.stopCountdown();
            this.showCompletion();
            return;
        }
        
        // Schedule more beats if needed
        this.scheduleBeats();
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame(() => this.schedulerLoop());
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
    

    
    getAvailableSounds() {
        return this.soundConfig.map(sound => sound.label);
    }
    
    getSoundInfo(soundType) {
        return this.soundConfig.find(sound => sound.label === soundType) || null;
    }
    
    setSoundType(soundType) {
        // Validate sound type exists in configuration
        const soundExists = this.soundConfig.some(sound => sound.label === soundType);
        if (!soundExists) {
            console.warn(`Invalid sound type: ${soundType}, falling back to Thump`);
            soundType = 'Thump';
        }
        
        this.selectedSound = soundType;
        
        // Remove active class from all sound buttons
        Object.values(this.soundButtons).forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        if (this.soundButtons[soundType]) {
            this.soundButtons[soundType].classList.add('active');
        }
    }
    
    setBeatFrequency(frequency) {
        this.beatFrequency = frequency;
        
        // Update button states
        this.freq1Btn.classList.remove('active');
        this.freq2Btn.classList.remove('active');
        this.freq3Btn.classList.remove('active');
        this.freq4Btn.classList.remove('active');
        
        switch(frequency) {
            case 1:
                this.freq1Btn.classList.add('active');
                break;
            case 2:
                this.freq2Btn.classList.add('active');
                break;
            case 3:
                this.freq3Btn.classList.add('active');
                break;
            case 4:
                this.freq4Btn.classList.add('active');
                break;
        }
    }
    
    toggleStopResume() {
        if (this.isRunning) {
            this.stopCountdown();
        } else {
            this.resumeCountdown();
        }
    }
    
    stopCountdown() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
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
            // Recalculate timing for resume
            this.beatInterval = 60 / this.bpm;
            this.startTime = this.audioContext.currentTime;
            this.nextBeatTime = this.startTime;
            this.scheduledBeats = [];
            this.scheduledVisualBeats = [];
            
            this.startTimer();
            this.startCountdownTimer();
            this.stopBtn.textContent = 'Stop';
            this.stopBtn.classList.remove('resume-btn');
            this.stopBtn.classList.add('stop-btn');
        }
    }
    

    
    resetCountdown() {
        this.stopCountdown();
        this.countdown = this.originalCountdown;
        this.remainingTimeSeconds = this.targetDurationMinutes * 60;
        this.bpm = parseInt(this.initialBpmInput.value);
        this.isHeartbeatMode = false;
        this.beatFrequency = 1;
        this.selectedSound = 'kick';
        this.updateDisplay();
        this.updateTimerDisplay();
        this.updateSliderPosition(this.bpm);

        this.setBeatFrequency(1); // Reset to every beat
        this.setSoundType('Thump'); // Reset to Thump
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
