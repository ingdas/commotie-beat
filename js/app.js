/**
 * Main Application Class
 * Orchestrates all managers and maintains the original functionality
 */
class BeatCountdownTimer {
    constructor() {
        // Initialize core modules
        this.soundConfig = new SoundConfig();
        this.audioManager = new AudioManager(this.soundConfig);
        this.uiManager = new UIManager(this.soundConfig, this.getUICallbacks());
        this.timerManager = new TimerManager(this.audioManager, this.getTimerCallbacks());
        this.midiManager = new MIDIManager(this.soundConfig, this.getMIDICallbacks());
        
        // Set up timer manager to get current sound from UI manager
        this.timerManager.getCurrentSound = () => this.uiManager.getSelectedSound();
        
        // Store reference to opening sound audio objects
        this.openingSoundAudio = null;
        this.openingSound2Audio = null;
        
        // Opening sound 2 sequence properties
        this.openingSound2TotalBeats = 0;
        this.openingSound2RemainingBeats = 0;
        this.openingSound2VisualCount = 0;
        this.openingSound2Bpm = 60;
        this.openingSound2IsRunning = false;
        this.openingSound2BeatInterval = 0;
        this.openingSound2NextBeatTime = 0;
        this.openingSound2StartTime = 0;
        this.openingSound2AnimationFrameId = null;
        
        // WebSocket for broadcasting to display devices
        this.ws = null;
        this.wsReconnectInterval = null;
        this.wsReconnectAttempts = 0;
        this.maxWsReconnectAttempts = 10;
        
        // Track previous countdown value to only broadcast when it changes
        this.previousCountdown = null;
        
        // Initialize the application
        this.initialize();
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        // Load audio files
        await this.audioManager.loadAudioFiles();
        
        // Set up opening sound button
        this.setupOpeningSoundButton();
        
        // Set up audio initialization on first click
        this.setupAudioInitialization();
        
        // Initialize WebSocket connection
        this.initializeWebSocket();
        
        // Log available sounds for debugging
        console.log('Available sounds:', this.soundConfig.getAvailableSounds());
        console.log('Sound configuration:', this.soundConfig.sounds);
    }
    
    /**
     * Set up the opening sound button functionality
     */
    setupOpeningSoundButton() {
        const playOpeningSoundBtn = document.getElementById('playOpeningSoundBtn');
        const playOpeningSound2Btn = document.getElementById('playOpeningSound2Btn');
        const stopOpeningSoundBtn = document.getElementById('stopOpeningSoundBtn');
        
        if (playOpeningSoundBtn) {
            playOpeningSoundBtn.addEventListener('click', () => {
                this.playOpeningSound();
            });
        }
        
        if (playOpeningSound2Btn) {
            playOpeningSound2Btn.addEventListener('click', () => {
                this.playOpeningSound2();
            });
        }
        
        if (stopOpeningSoundBtn) {
            stopOpeningSoundBtn.addEventListener('click', () => {
                this.stopAllOpeningSounds();
            });
        }
    }
    
    /**
     * Set up audio initialization on first click anywhere on the page
     */
    setupAudioInitialization() {
        // Add a one-time click listener to the document
        const handleFirstClick = () => {
            // Initialize audio device with silent sound
            this.audioManager.initializeAudioDevice();
            
            // Remove the event listener after first use
            document.removeEventListener('click', handleFirstClick);
            document.removeEventListener('touchstart', handleFirstClick);
        };
        
        // Listen for both click and touchstart events to cover all user interactions
        document.addEventListener('click', handleFirstClick, { once: true });
        document.addEventListener('touchstart', handleFirstClick, { once: true });
    }
    
    /**
     * Play the opening sound 1
     */
    playOpeningSound() {
        // Stop any currently playing opening sounds
        this.stopAllOpeningSounds();
        
        // Create new audio object and store reference
        this.openingSoundAudio = new Audio('./sounds/open1.mp3');
        this.openingSoundAudio.volume = 1;
        
        this.openingSoundAudio.play().catch(error => {
            console.warn('Could not play opening sound 1:', error);
        });
    }
    
    /**
     * Play the opening sound 2
     */
    playOpeningSound2() {
        // Stop any currently playing opening sounds
        this.stopAllOpeningSounds();
        
        // Create new audio object and store reference
        this.openingSound2Audio = new Audio('./sounds/open2.mp3');
        this.openingSound2Audio.volume = 1;
        
        this.openingSound2Audio.play().catch(error => {
            console.warn('Could not play opening sound 2:', error);
        });
        
        // Start the special opening sound 2 sequence
        this.startOpeningSound2Sequence();
    }
    
    /**
     * Start the opening sound 2 sequence: 4s delay, then 30 visual beats at 60bpm, then start regular timer
     */
    startOpeningSound2Sequence() {
        // Get the configured total beats from UI
        this.openingSound2TotalBeats = this.uiManager.getTotalBeatsValue();
        this.openingSound2RemainingBeats = this.openingSound2TotalBeats;
        
        // Show countdown panel immediately with configured beats
        this.uiManager.showCountdownPanel();
        this.uiManager.updateDisplay(this.openingSound2RemainingBeats, 60, 60);
        
        // After 4 seconds, start the 60bpm visual beat sequence
        setTimeout(() => {
            this.startOpeningSound2VisualSequence();
        }, 7200);
    }
    
    /**
     * Start the 60bpm visual beat sequence for 30 beats
     */
    startOpeningSound2VisualSequence() {
        this.openingSound2VisualCount = 32;
        this.openingSound2Bpm = 60;
        this.openingSound2IsRunning = true;
        
        // Calculate beat interval for 60bpm
        this.openingSound2BeatInterval = 60 / this.openingSound2Bpm;
        
        // Start the visual beat scheduling
        this.startOpeningSound2VisualScheduling();
    }
    
    /**
     * Start the visual beat scheduling for opening sound 2
     */
    startOpeningSound2VisualScheduling() {
        if (!this.openingSound2IsRunning) return;
        
        const currentTime = this.audioManager.getCurrentTime();
        this.openingSound2NextBeatTime = currentTime;
        this.openingSound2StartTime = currentTime;
        
        // Start the animation frame loop for visual beat scheduling
        this.openingSound2AnimationFrameId = requestAnimationFrame(() => this.openingSound2VisualSchedulerLoop());
    }
    
    /**
     * Main scheduling loop for opening sound 2 visual beats
     */
    openingSound2VisualSchedulerLoop() {
        if (!this.openingSound2IsRunning) return;
        
        const currentTime = this.audioManager.getCurrentTime();
        
        // Check if it's time for the next visual beat
        if (currentTime >= this.openingSound2NextBeatTime && this.openingSound2VisualCount > 0) {
            // NO SOUND - this is visual only
            // Just update the remaining beats count
            this.openingSound2RemainingBeats--;
            
            // Update display with remaining beats
            this.uiManager.updateDisplay(this.openingSound2RemainingBeats, this.openingSound2Bpm, this.openingSound2Bpm);
            this.uiManager.triggerBeatAnimation();
            
            // Broadcast to display devices
            this.broadcastBeatData();
            
            // Schedule next visual beat
            this.openingSound2NextBeatTime += this.openingSound2BeatInterval;
            
            // Decrement visual count
            this.openingSound2VisualCount--;
            
            // Check if we're done with the 30 visual beats
            if (this.openingSound2VisualCount <= 0) {
                this.openingSound2IsRunning = false;
                this.startRegularTimerAfterVisualSequence();
                return;
            }
        }
        
        // Continue the loop
        if (this.openingSound2IsRunning) {
            this.openingSound2AnimationFrameId = requestAnimationFrame(() => this.openingSound2VisualSchedulerLoop());
        }
    }
    
    /**
     * Start the regular timer after the visual sequence completes
     */
    startRegularTimerAfterVisualSequence() {
        // Clean up the animation frame
        if (this.openingSound2AnimationFrameId) {
            cancelAnimationFrame(this.openingSound2AnimationFrameId);
            this.openingSound2AnimationFrameId = null;
        }
        
        // Get the remaining beats after 30 visual beats
        const remainingBeats = this.openingSound2RemainingBeats;
        const durationValue = this.uiManager.getDurationValue();
        const selectedSound = this.uiManager.getSelectedSound();
        
        // Start the regular timer with remaining beats at 110 BPM
        this.timerManager.startCountdown(durationValue, 110, selectedSound, remainingBeats);
        
        // Update UI to show the regular timer state
        this.uiManager.setBpm(110);
        this.uiManager.updateSliderPosition(110);
        this.uiManager.updateVolumeSliderPosition(this.uiManager.getVolume());
        
        // Broadcast the new state
        this.broadcastBeatData();
    }
    
    /**
     * Stop all opening sounds
     */
    stopAllOpeningSounds() {
        if (this.openingSoundAudio) {
            this.openingSoundAudio.pause();
            this.openingSoundAudio.currentTime = 0;
            this.openingSoundAudio = null;
        }
        
        if (this.openingSound2Audio) {
            this.openingSound2Audio.pause();
            this.openingSound2Audio.currentTime = 0;
            this.openingSound2Audio = null;
        }
        
        // Stop opening sound 2 sequence if running
        if (this.openingSound2IsRunning) {
            this.openingSound2IsRunning = false;
            if (this.openingSound2AnimationFrameId) {
                cancelAnimationFrame(this.openingSound2AnimationFrameId);
                this.openingSound2AnimationFrameId = null;
            }
        }
    }
    
    /**
     * Get UI manager callbacks
     */
    getUICallbacks() {
        return {
            startCountdown: () => this.startCountdown(),
            toggleStopResume: () => this.toggleStopResume(),
            disableTimer: () => this.disableTimer(),
            resetCountdown: () => this.resetCountdown(),
            multiplyBpm: () => this.multiplyBpm(),
            divideBpm: () => this.divideBpm(),
            setToRequiredBpm: () => this.setToRequiredBpm(),
            set60Bpm: () => this.set60Bpm(),
            set110Bpm: () => this.set110Bpm(),
            applyBpmChange: (bpm) => this.applyBpmChange(bpm),
            onSoundTypeChanged: (soundType) => this.onSoundTypeChanged(soundType),
            onEndingSoundTypeChanged: (soundType) => this.onEndingSoundTypeChanged(soundType),
            onOneshotSoundPlay: (soundType) => this.onOneshotSoundPlay(soundType),
            onComboSoundPlay: (soundType, bpm) => this.onComboSoundPlay(soundType, bpm),
            onVolumeChanged: (volume) => this.onVolumeChanged(volume)
        };
    }
    
    /**
     * Get timer manager callbacks
     */
    getTimerCallbacks() {
        return {
            onCountdownStarted: () => this.onCountdownStarted(),
            onCountdownStopped: () => this.onCountdownStopped(),
            onCountdownResumed: () => this.onCountdownResumed(),
            onCountdownReset: () => this.onCountdownReset(),
            onTimerDisabled: () => this.onTimerDisabled(),
            onTimerEnabled: () => this.onTimerEnabled(),
            updateDisplay: (countdown, bpm, requiredBpm) => {
                this.uiManager.updateDisplay(countdown, bpm, requiredBpm);
                this.broadcastBeatDataIfCounterChanged(countdown);
            },
            updateTimerDisplay: (remainingTimeSeconds) => {
                this.uiManager.updateTimerDisplay(remainingTimeSeconds);
            },
            triggerBeatAnimation: () => this.uiManager.triggerBeatAnimation(),
            showCompletion: () => {
                this.uiManager.showCompletion();
                this.sendExplosionSignal();
            },
            playEndingSound: () => this.playEndingSound(),
            resetCountdown: () => this.resetCountdown()
        };
    }
    
    /**
     * Get MIDI manager callbacks
     */
    getMIDICallbacks() {
        return {
            setSoundType: (soundType) => this.uiManager.setSoundType(soundType),
            setEndingSoundType: (soundType) => this.uiManager.setEndingSoundType(soundType),
            increaseBPM: () => this.increaseBPM(),
            decreaseBPM: () => this.decreaseBPM(),
            increaseVolume: () => this.increaseVolume(),
            decreaseVolume: () => this.decreaseVolume(),
            disableTimer: () => this.disableTimer(),
            updateMIDIStatus: (isConnected, text) => this.uiManager.updateMIDIStatus(isConnected, text)
        };
    }
    
    /**
     * Start the countdown timer
     */
    startCountdown() {
        const durationValue = this.uiManager.getDurationValue();
        const totalBeatsValue = this.uiManager.getTotalBeatsValue();
        
        if (durationValue < 1) {
            alert('Please enter a valid duration (1-999 minutes)');
            return;
        }
        
        if (totalBeatsValue < 1 || totalBeatsValue > 9999) {
            alert('Please enter a valid total beats (1-9999)');
            return;
        }
        
        const selectedSound = this.uiManager.getSelectedSound();
        
        // Always start at 110 BPM regardless of input field value
        const startingBpm = 110;
        
        // Start the timer
        this.timerManager.startCountdown(durationValue, startingBpm, selectedSound, totalBeatsValue);
        
        // Reset counter tracking for new countdown
        this.previousCountdown = null;
        
        // Update UI
        this.uiManager.setBpm(startingBpm);
        this.uiManager.updateSliderPosition(startingBpm);
        this.uiManager.updateVolumeSliderPosition(this.uiManager.getVolume());
        this.uiManager.showCountdownPanel();
    }
    
    /**
     * Toggle stop/resume
     */
    toggleStopResume() {
        if (this.timerManager.isRunning) {
            this.timerManager.stopCountdown();
        } else {
            const selectedSound = this.uiManager.getSelectedSound();
            this.timerManager.resumeCountdown(selectedSound);
        }
    }
    
    /**
     * Disable timer for 5 seconds
     */
    disableTimer() {
        this.timerManager.disableTimer();
    }
    
    /**
     * Reset the countdown
     */
    resetCountdown(sendBlankSignal = true) {
        const totalBeatsValue = this.uiManager.getTotalBeatsValue();
        
        // Always reset to 110 BPM regardless of input field value
        const startingBpm = 110;
        
        this.timerManager.resetCountdown(startingBpm, totalBeatsValue);
        this.uiManager.setBpm(startingBpm);
        this.uiManager.updateSliderPosition(startingBpm);
        this.uiManager.reset();
        this.uiManager.showSetupPanel();
        
        // Reset counter tracking
        this.previousCountdown = null;
        
        // Send blank screen signal when reset (only for manual resets)
        if (sendBlankSignal) {
            this.sendBlankScreenSignal();
        }
    }
    
    /**
     * Multiply BPM by 2
     */
    multiplyBpm() {
        const selectedSound = this.uiManager.getSelectedSound();
        const newBpm = this.timerManager.multiplyBpm(selectedSound);
        this.uiManager.setBpm(newBpm);
    }
    
    /**
     * Divide BPM by 2
     */
    divideBpm() {
        const selectedSound = this.uiManager.getSelectedSound();
        const newBpm = this.timerManager.divideBpm(selectedSound);
        this.uiManager.setBpm(newBpm);
    }
    
    /**
     * Set BPM to required value
     */
    setToRequiredBpm() {
        const selectedSound = this.uiManager.getSelectedSound();
        const newBpm = this.timerManager.setToRequiredBpm(selectedSound);
        this.uiManager.setBpm(newBpm);
    }
    
    /**
     * Set BPM to 60
     */
    set60Bpm() {
        const selectedSound = this.uiManager.getSelectedSound();
        this.timerManager.updateBpm(60, selectedSound);
        this.uiManager.setBpm(60);
    }
    
    /**
     * Set BPM to 110
     */
    set110Bpm() {
        const selectedSound = this.uiManager.getSelectedSound();
        this.timerManager.updateBpm(110, selectedSound);
        this.uiManager.setBpm(110);
    }
    
    /**
     * Apply BPM change from slider
     */
    applyBpmChange(bpm) {
        const selectedSound = this.uiManager.getSelectedSound();
        this.timerManager.updateBpm(bpm, selectedSound);
    }
    
    /**
     * Handle sound type change
     */
    onSoundTypeChanged(soundType) {
        // Update audio manager volume
        this.audioManager.setVolume(this.uiManager.getVolume());
        
        // Notify timer manager about sound change if it's running
        if (this.timerManager.isRunning) {
            // The timer manager will use the new sound for future beats
            console.log(`Sound type changed to: ${soundType}`);
        }
    }
    
    /**
     * Handle ending sound type change
     */
    onEndingSoundTypeChanged(soundType) {
        // No additional action needed for ending sound changes
    }
    
    /**
     * Handle oneshot sound play
     */
    onOneshotSoundPlay(soundType) {
        // Play the oneshot sound immediately
        this.audioManager.playOneshotSound(soundType);
    }
    
    /**
     * Handle combo sound play (sound + BPM combination)
     */
    onComboSoundPlay(soundType, bpm) {
        // Apply the BPM change to the timer manager
        this.applyBpmChange(bpm);
        
        // The UI manager already handles setting the sound type and BPM
        // This callback is mainly for any additional logic needed
        console.log(`Combo sound activated: ${soundType} at ${bpm} BPM`);
    }
    
    /**
     * Handle volume change
     */
    onVolumeChanged(volume) {
        // Update audio manager volume
        this.audioManager.setVolume(volume);
    }
    
    /**
     * Handle countdown started
     */
    onCountdownStarted() {
        this.uiManager.updateStopButton(true);
        this.broadcastBeatData();
    }
    
    /**
     * Handle countdown stopped
     */
    onCountdownStopped() {
        this.uiManager.updateStopButton(false);
        this.broadcastBeatData();
    }
    
    /**
     * Handle countdown resumed
     */
    onCountdownResumed() {
        this.uiManager.updateStopButton(true);
        this.broadcastBeatData();
    }
    
    /**
     * Handle countdown reset
     */
    onCountdownReset() {
        this.uiManager.updateStopButton(true);
        this.broadcastBeatData();
    }
    
    /**
     * Handle timer disabled
     */
    onTimerDisabled() {
        this.uiManager.updateDisableButton(true);
        this.broadcastBeatData();
    }
    
    /**
     * Handle timer enabled
     */
    onTimerEnabled() {
        this.uiManager.updateDisableButton(false);
        this.broadcastBeatData();
    }
    
    /**
     * Play ending sound
     */
    playEndingSound() {
        const selectedEndingSound = this.uiManager.getSelectedEndingSound();
        this.audioManager.playEndingSound(selectedEndingSound);
    }
    
    /**
     * Increase BPM (for MIDI)
     */
    increaseBPM() {
        const newBpm = Math.min(200, this.timerManager.bpm + 1);
        const selectedSound = this.uiManager.getSelectedSound();
        this.timerManager.updateBpm(newBpm, selectedSound);
        this.uiManager.setBpm(newBpm);
    }
    
    /**
     * Decrease BPM (for MIDI)
     */
    decreaseBPM() {
        const newBpm = Math.max(15, this.timerManager.bpm - 1);
        const selectedSound = this.uiManager.getSelectedSound();
        this.timerManager.updateBpm(newBpm, selectedSound);
        this.uiManager.setBpm(newBpm);
    }
    
    /**
     * Increase Volume (for MIDI)
     */
    increaseVolume() {
        const newVolume = Math.min(100, this.uiManager.getVolume() + 1);
        this.uiManager.setVolume(newVolume);
        this.audioManager.setVolume(newVolume);
    }
    
    /**
     * Decrease Volume (for MIDI)
     */
    decreaseVolume() {
        const newVolume = Math.max(5, this.uiManager.getVolume() - 1);
        this.uiManager.setVolume(newVolume);
        this.audioManager.setVolume(newVolume);
    }
    
    /**
     * Initialize WebSocket connection for broadcasting to display devices
     */
    initializeWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.hostname}:8080`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to WebSocket server for display broadcasting');
                this.wsReconnectAttempts = 0;
                
                if (this.wsReconnectInterval) {
                    clearInterval(this.wsReconnectInterval);
                    this.wsReconnectInterval = null;
                }
                
                // Send blank screen signal when connected
                this.sendBlankScreenSignal();
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from WebSocket server');
                this.scheduleWebSocketReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleWebSocketReconnect();
        }
    }
    
    /**
     * Schedule WebSocket reconnection
     */
    scheduleWebSocketReconnect() {
        if (this.wsReconnectAttempts >= this.maxWsReconnectAttempts) {
            console.log('Max WebSocket reconnection attempts reached');
            return;
        }
        
        this.wsReconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000);
        
        console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.wsReconnectAttempts}/${this.maxWsReconnectAttempts})`);
        
        this.wsReconnectInterval = setTimeout(() => {
            this.initializeWebSocket();
        }, delay);
    }
    
    /**
     * Broadcast beat data to display devices only when counter changes
     */
    broadcastBeatDataIfCounterChanged(countdown) {
        if (this.previousCountdown !== countdown) {
            this.previousCountdown = countdown;
            this.broadcastBeatData();
        }
    }
    
    /**
     * Send blank screen signal to display devices
     */
    sendBlankScreenSignal() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const data = {
                type: 'blank',
                countdown: null,
                timestamp: Date.now()
            };
            
            this.ws.send(JSON.stringify(data));
        }
    }
    
    /**
     * Send explosion signal to display devices
     */
    sendExplosionSignal() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const data = {
                type: 'explosion',
                timestamp: Date.now()
            };
            
            this.ws.send(JSON.stringify(data));
        }
    }
    
    /**
     * Broadcast beat data to display devices
     */
    broadcastBeatData() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            let countdown = null;
            
            // Check if opening sound 2 sequence is running
            if (this.openingSound2IsRunning) {
                countdown = this.openingSound2RemainingBeats;
            } else {
                // Use regular timer state
                const state = this.timerManager.getState();
                countdown = state.countdown;
            }
            
            const data = {
                type: 'countdown',
                countdown: countdown,
                timestamp: Date.now()
            };
            
            this.ws.send(JSON.stringify(data));
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeatCountdownTimer();
});
