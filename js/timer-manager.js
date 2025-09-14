/**
 * Timer Manager Module
 * Handles countdown logic, beat scheduling, and timing coordination
 */
class TimerManager {
    constructor(audioManager, callbacks) {
        this.audioManager = audioManager;
        this.callbacks = callbacks; // Object containing callback functions from main app
        this.getCurrentSound = null; // Function to get current sound from UI manager
        
        // Timer state
        this.countdown = 0;
        this.originalCountdown = 0;
        this.targetDurationMinutes = 30;
        this.remainingTimeSeconds = 0;
        this.bpm = 120;
        this.isRunning = false;
        
        // MIDI-like scheduling system
        this.animationFrameId = null;
        this.scheduledBeats = [];
        this.scheduledVisualBeats = []; // Separate queue for visual countdown updates
        this.nextBeatTime = 0;
        this.beatInterval = 0;
        this.lastScheduledBeat = 0;
        this.lookaheadTime = 0.5; // Schedule beats ahead (seconds)
        
        // Timer interval for countdown display
        this.timerInterval = null;
        
        // Disable timer state
        this.isDisabled = false;
        this.disableTimeout = null;
    }
    
    /**
     * Start the countdown timer
     */
    startCountdown(targetDurationMinutes, initialBpm, selectedSound) {
        this.targetDurationMinutes = targetDurationMinutes;
        this.remainingTimeSeconds = targetDurationMinutes * 60;
        this.bpm = initialBpm;
        
        // Calculate how many beats we need based on the BPM
        this.countdown = this.calculateRequiredBeats();
        this.originalCountdown = this.countdown;
        
        this.isRunning = true;
        
        // Resume audio context if suspended
        this.audioManager.resumeAudioContext();
        
        // Start the timer systems
        this.startTimer(selectedSound);
        this.startCountdownTimer();
        
        // Notify UI
        if (this.callbacks.onCountdownStarted) {
            this.callbacks.onCountdownStarted();
        }
    }
    
    /**
     * Calculate required beats based on duration and BPM
     */
    calculateRequiredBeats() {
        return Math.ceil((this.remainingTimeSeconds * this.bpm) / 60);
    }
    
    /**
     * Start the beat timing system
     */
    startTimer(selectedSound) {
        // Calculate beat interval in seconds
        this.beatInterval = 60 / this.bpm;
        this.startTime = this.audioManager.getCurrentTime();
        this.nextBeatTime = this.startTime;
        this.lastScheduledBeat = 0;
        
        // Start the MIDI-like scheduling loop
        this.scheduleBeats(selectedSound);
        this.animationFrameId = requestAnimationFrame(() => this.schedulerLoop(selectedSound));
        
        // Trigger first beat animation immediately
        this.triggerBeatAnimation();
    }
    
    /**
     * Schedule beats ahead of time
     */
    scheduleBeats(selectedSound) {
        const currentTime = this.audioManager.getCurrentTime();
        const scheduleEndTime = currentTime + this.lookaheadTime;
        
        // Get current sound from UI manager if available, otherwise use passed parameter
        const currentSound = this.getCurrentSound ? this.getCurrentSound() : selectedSound;
        
        // Schedule beats up to the lookahead time
        while (this.nextBeatTime < scheduleEndTime && this.countdown > 0) {
            const beatNumber = this.originalCountdown - this.countdown + 1;
            
            // Schedule visual countdown for every beat
            this.scheduledVisualBeats.push({
                time: this.nextBeatTime,
                beatNumber: beatNumber
            });
            
            // Schedule audio for every beat
            this.scheduledBeats.push({
                time: this.nextBeatTime,
                beatNumber: beatNumber
            });
            
            // Schedule the audio with current sound
            this.audioManager.scheduleBeatAudio(currentSound, this.nextBeatTime);
            
            this.nextBeatTime += this.beatInterval;
            this.countdown--;
            
            if (this.countdown <= 0) {
                break;
            }
        }
    }
    
    
    /**
     * Main scheduling loop
     */
    schedulerLoop(selectedSound) {
        if (!this.isRunning) return;
        
        const currentTime = this.audioManager.getCurrentTime();
        
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
        this.scheduleBeats(selectedSound);
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame(() => this.schedulerLoop(selectedSound));
    }
    
    /**
     * Start the countdown timer for display
     */
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
    
    /**
     * Stop the countdown
     */
    stopCountdown() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.disableTimeout) {
            clearTimeout(this.disableTimeout);
            this.disableTimeout = null;
        }
        this.isRunning = false;
        this.isDisabled = false;
        
        // Notify UI
        if (this.callbacks.onCountdownStopped) {
            this.callbacks.onCountdownStopped();
        }
    }
    
    /**
     * Resume the countdown
     */
    resumeCountdown(selectedSound) {
        if (this.countdown > 0) {
            this.isRunning = true;
            // Recalculate timing for resume
            this.beatInterval = 60 / this.bpm;
            this.startTime = this.audioManager.getCurrentTime();
            this.nextBeatTime = this.startTime;
            this.scheduledBeats = [];
            this.scheduledVisualBeats = [];
            
            this.startTimer(selectedSound);
            this.startCountdownTimer();
            
            // Notify UI
            if (this.callbacks.onCountdownResumed) {
                this.callbacks.onCountdownResumed();
            }
        }
    }
    
    /**
     * Reset the countdown to initial state
     */
    resetCountdown(initialBpm) {
        this.stopCountdown();
        this.countdown = this.originalCountdown;
        this.remainingTimeSeconds = this.targetDurationMinutes * 60;
        this.bpm = initialBpm;
        
        this.updateDisplay();
        this.updateTimerDisplay();
        
        // Notify UI
        if (this.callbacks.onCountdownReset) {
            this.callbacks.onCountdownReset();
        }
    }
    
    /**
     * Update BPM and recalculate timing
     */
    updateBpm(newBpm, selectedSound) {
        this.bpm = newBpm;
        
        // Update the beat interval for MIDI-like scheduling
        if (this.isRunning) {
            const oldBeatInterval = this.beatInterval;
            this.beatInterval = 60 / this.bpm;
            
            // Clear scheduled beats to prevent duplicate audio when tempo changes
            this.scheduledBeats = [];
            this.scheduledVisualBeats = [];
            
            // Update nextBeatTime to maintain rhythm continuity
            // Calculate how many beats have passed since the last scheduled beat
            const currentTime = this.audioManager.getCurrentTime();
            const timeSinceLastBeat = currentTime - (this.nextBeatTime - oldBeatInterval);
            const beatsSinceLastBeat = Math.floor(timeSinceLastBeat / this.beatInterval);
            
            // Set nextBeatTime to the next beat in the new tempo
            this.nextBeatTime = currentTime + (this.beatInterval - (timeSinceLastBeat % this.beatInterval));
        }
        
        this.updateDisplay();
    }
    
    /**
     * Calculate required BPM to finish exactly when timer reaches zero
     */
    calculateRequiredBpm() {
        return Math.round((this.countdown * 60) / this.remainingTimeSeconds);
    }
    
    /**
     * Set BPM to required value to finish on time
     */
    setToRequiredBpm(selectedSound) {
        const requiredBpm = this.calculateRequiredBpm();
        const clampedBpm = Math.max(30, Math.min(200, requiredBpm));
        
        this.updateBpm(clampedBpm, selectedSound);
        return clampedBpm;
    }
    
    /**
     * Multiply BPM by 2
     */
    multiplyBpm(selectedSound) {
        const newBpm = Math.min(200, this.bpm * 2);
        this.updateBpm(newBpm, selectedSound);
        return newBpm;
    }
    
    /**
     * Divide BPM by 2
     */
    divideBpm(selectedSound) {
        const newBpm = Math.max(30, Math.round(this.bpm / 2));
        this.updateBpm(newBpm, selectedSound);
        return newBpm;
    }
    
    /**
     * Update display information
     */
    updateDisplay() {
        const requiredBpm = this.calculateRequiredBpm();
        
        // Notify UI manager
        if (this.callbacks.updateDisplay) {
            this.callbacks.updateDisplay(this.countdown, this.bpm, requiredBpm);
        }
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        // Notify UI manager
        if (this.callbacks.updateTimerDisplay) {
            this.callbacks.updateTimerDisplay(this.remainingTimeSeconds);
        }
    }
    
    /**
     * Trigger beat animation
     */
    triggerBeatAnimation() {
        // Notify UI manager
        if (this.callbacks.triggerBeatAnimation) {
            this.callbacks.triggerBeatAnimation();
        }
    }
    
    /**
     * Show completion state
     */
    showCompletion() {
        // Notify UI manager
        if (this.callbacks.showCompletion) {
            this.callbacks.showCompletion();
        }
        
        // Play ending sound
        if (this.callbacks.playEndingSound) {
            this.callbacks.playEndingSound();
        }
        
        // Auto-reset after 2 seconds
        setTimeout(() => {
            if (this.callbacks.resetCountdown) {
                this.callbacks.resetCountdown();
            }
        }, 2000);
    }
    
    /**
     * Disable timer for 5 seconds
     */
    disableTimer() {
        if (!this.isRunning || this.isDisabled) {
            return; // Can't disable if not running or already disabled
        }
        
        this.isDisabled = true;
        
        // Stop only the beat scheduling (audio and visual beats)
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear scheduled beats to prevent them from being processed when we resume
        this.scheduledBeats = [];
        this.scheduledVisualBeats = [];
        
        // Keep the countdown timer running - don't stop timerInterval
        
        // Notify UI
        if (this.callbacks.onTimerDisabled) {
            this.callbacks.onTimerDisabled();
        }
        
        // Re-enable after 5 seconds
        this.disableTimeout = setTimeout(() => {
            this.enableTimer();
        }, 5000);
    }
    
    /**
     * Re-enable timer after disable period
     */
    enableTimer() {
        if (!this.isDisabled) {
            return; // Already enabled
        }
        
        this.isDisabled = false;
        this.disableTimeout = null;
        
        // Resume beat scheduling with proper timing recalculation
        const selectedSound = this.getCurrentSound ? this.getCurrentSound() : 'Thump';
        this.resumeBeatScheduling(selectedSound);
        // Don't restart startCountdownTimer() - it should still be running
        
        // Notify UI
        if (this.callbacks.onTimerEnabled) {
            this.callbacks.onTimerEnabled();
        }
    }
    
    /**
     * Resume beat scheduling with proper timing recalculation
     */
    resumeBeatScheduling(selectedSound) {
        // Recalculate timing based on current time and BPM
        const currentTime = this.audioManager.getCurrentTime();
        this.beatInterval = 60 / this.bpm;
        
        // Calculate the next beat time based on current time
        // This ensures we don't have a gap or jump in timing
        const timeSinceLastBeat = (currentTime - this.startTime) % this.beatInterval;
        this.nextBeatTime = currentTime + (this.beatInterval - timeSinceLastBeat);
        
        // Restart the animation frame loop
        this.animationFrameId = requestAnimationFrame(() => this.schedulerLoop(selectedSound));
    }
    
    /**
     * Get current timer state
     */
    getState() {
        return {
            countdown: this.countdown,
            originalCountdown: this.originalCountdown,
            targetDurationMinutes: this.targetDurationMinutes,
            remainingTimeSeconds: this.remainingTimeSeconds,
            bpm: this.bpm,
            isRunning: this.isRunning,
            isDisabled: this.isDisabled,
            requiredBpm: this.calculateRequiredBpm()
        };
    }
}
