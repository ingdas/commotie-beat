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
            applyBpmChange: (bpm) => this.applyBpmChange(bpm),
            onSoundTypeChanged: (soundType) => this.onSoundTypeChanged(soundType),
            onEndingSoundTypeChanged: (soundType) => this.onEndingSoundTypeChanged(soundType)
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
            updateDisplay: (countdown, bpm, requiredBpm) => this.uiManager.updateDisplay(countdown, bpm, requiredBpm),
            updateTimerDisplay: (remainingTimeSeconds) => this.uiManager.updateTimerDisplay(remainingTimeSeconds),
            triggerBeatAnimation: () => this.uiManager.triggerBeatAnimation(),
            showCompletion: () => this.uiManager.showCompletion(),
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
        const initialBpmValue = this.uiManager.getInitialBpmValue();
        
        if (durationValue < 1) {
            alert('Please enter a valid duration (1-999 minutes)');
            return;
        }
        
        if (initialBpmValue < 30 || initialBpmValue > 200) {
            alert('Please enter a valid BPM (30-200)');
            return;
        }
        
        const selectedSound = this.uiManager.getSelectedSound();
        
        // Start the timer
        this.timerManager.startCountdown(durationValue, initialBpmValue, selectedSound);
        
        // Update UI
        this.uiManager.setBpm(initialBpmValue);
        this.uiManager.updateSliderPosition(initialBpmValue);
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
    resetCountdown() {
        const initialBpmValue = this.uiManager.getInitialBpmValue();
        
        this.timerManager.resetCountdown(initialBpmValue);
        this.uiManager.setBpm(initialBpmValue);
        this.uiManager.updateSliderPosition(initialBpmValue);
        this.uiManager.reset();
        this.uiManager.showSetupPanel();
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
     * Handle countdown started
     */
    onCountdownStarted() {
        this.uiManager.updateStopButton(true);
    }
    
    /**
     * Handle countdown stopped
     */
    onCountdownStopped() {
        this.uiManager.updateStopButton(false);
    }
    
    /**
     * Handle countdown resumed
     */
    onCountdownResumed() {
        this.uiManager.updateStopButton(true);
    }
    
    /**
     * Handle countdown reset
     */
    onCountdownReset() {
        this.uiManager.updateStopButton(true);
    }
    
    /**
     * Handle timer disabled
     */
    onTimerDisabled() {
        this.uiManager.updateDisableButton(true);
    }
    
    /**
     * Handle timer enabled
     */
    onTimerEnabled() {
        this.uiManager.updateDisableButton(false);
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
        const newBpm = Math.max(30, this.timerManager.bpm - 1);
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
        const newVolume = Math.max(20, this.uiManager.getVolume() - 1);
        this.uiManager.setVolume(newVolume);
        this.audioManager.setVolume(newVolume);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeatCountdownTimer();
});
