/**
 * UI Manager Module
 * Handles all DOM manipulation, event handling, and display updates
 */
class UIManager {
    constructor(soundConfig, callbacks) {
        this.soundConfig = soundConfig;
        this.callbacks = callbacks; // Object containing callback functions from main app
        
        // UI state
        this.selectedSound = 'Opening Loop';
        this.selectedEndingSound = 'Boom';
        this.bpm = 110;
        this.volume = 80;
        
        // Tap tempo state
        this.tapTimes = [];
        this.tapCount = 0;
        this.suggestedBpm = null;
        this.isTapTempoMode = false;
        
        // DOM elements
        this.elements = {};
        
        this.initializeElements();
        this.generateSoundButtons();
        this.setupEventListeners();
    }
    
    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            setupPanel: document.getElementById('setupPanel'),
            countdownPanel: document.getElementById('countdownPanel'),
            durationInput: document.getElementById('durationInput'),
            totalBeatsInput: document.getElementById('totalBeatsInput'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            disableBtn: document.getElementById('disableBtn'),
            resetBtn: document.getElementById('resetBtn'),
            countdownNumber: document.getElementById('countdownNumber'),
            timerDisplay: document.getElementById('timerDisplay'),
            requiredBpmDisplay: document.getElementById('requiredBpmDisplay'),
            currentBpm: document.getElementById('currentBpm'),
            bpmNumber: document.querySelector('.bpm-number'),
            
            // Slider elements
            sliderTrack: document.getElementById('sliderTrack'),
            sliderThumb: document.getElementById('sliderThumb'),
            sliderFill: document.getElementById('sliderFill'),
            
            // Volume slider elements
            volumeSliderTrack: document.getElementById('volumeSliderTrack'),
            volumeSliderThumb: document.getElementById('volumeSliderThumb'),
            volumeSliderFill: document.getElementById('volumeSliderFill'),
            currentVolume: document.getElementById('currentVolume'),
            volumeNumber: document.querySelector('.volume-number'),
            
            // BPM control buttons
            bpmMultiplyBtn: document.getElementById('bpmMultiplyBtn'),
            bpmDivideBtn: document.getElementById('bpmDivideBtn'),
            setRequiredBpmBtn: document.getElementById('setRequiredBpmBtn'),
            
            // BPM preset buttons
            set60BpmBtn: document.getElementById('set60BpmBtn'),
            set110BpmBtn: document.getElementById('set110BpmBtn'),
            
            // MIDI status elements
            midiStatus: document.getElementById('midiStatus'),
            midiIndicator: document.getElementById('midiIndicator'),
            midiText: document.getElementById('midiText'),
            
            // Oneshot stop button
            stopOneshotBtn: document.getElementById('stopOneshotBtn'),
            
            // Tap tempo elements
            tapTempoIndicator: document.getElementById('tapTempoIndicator'),
            suggestedBpmDisplay: document.getElementById('suggestedBpmDisplay')
        };
        
        // Sound buttons will be generated dynamically
        this.soundButtons = {};
    }
    
    /**
     * Generate sound selection buttons dynamically
     */
    generateSoundButtons() {
        const soundButtonsContainer = document.querySelector('.sound-buttons');
        const endingButtonsContainer = document.querySelector('.ending-buttons');
        const oneshotButtonsContainer = document.querySelector('.oneshot-buttons');
        const comboButtonsContainer = document.querySelector('.combo-buttons');
        
        // Clear existing buttons
        soundButtonsContainer.innerHTML = '';
        endingButtonsContainer.innerHTML = '';
        oneshotButtonsContainer.innerHTML = '';
        comboButtonsContainer.innerHTML = '';
        
        // Generate buttons from sound configuration
        this.soundConfig.sounds.forEach((soundConfig, index) => {
            const button = document.createElement('button');
            button.id = `${soundConfig.label.replace(/\s+/g, '')}Btn`;
            button.className = 'sound-btn';
            
            // Add number prefix for regular sounds (not ending sounds or oneshot sounds)
            if (soundConfig.type === 'end') {
                button.textContent = soundConfig.label;
            } else if (soundConfig.type === 'oneshot') {
                button.textContent = soundConfig.label;
            } else {
                button.textContent = `${index + 1}. ${soundConfig.label}`;
            }
            
            button.dataset.soundType = soundConfig.label;
            
            // Separate sounds by type
            if (soundConfig.type === 'end') {
                // Add to ending buttons container
                if (soundConfig.label === this.selectedEndingSound) {
                    button.classList.add('active');
                }
                endingButtonsContainer.appendChild(button);
            } else if (soundConfig.type === 'oneshot') {
                // Add to oneshot buttons container
                button.classList.add('oneshot-btn');
                oneshotButtonsContainer.appendChild(button);
            } else if (soundConfig.type === 'combo') {
                // Add to combo buttons container
                button.classList.add('combo-btn');
                comboButtonsContainer.appendChild(button);
            } else {
                // Add to regular sound buttons container
                if (soundConfig.label === this.selectedSound) {
                    button.classList.add('active');
                }
                soundButtonsContainer.appendChild(button);
            }
            
            this.soundButtons[soundConfig.label] = button;
        });
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Main control buttons
        this.elements.startBtn.addEventListener('click', () => this.callbacks.startCountdown());
        this.elements.stopBtn.addEventListener('click', () => this.callbacks.toggleStopResume());
        this.elements.disableBtn.addEventListener('click', () => this.callbacks.disableTimer());
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.callbacks.resetCountdown());
        }
        
        // Sound selection controls - use event delegation for dynamic buttons
        document.querySelector('.sound-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-btn')) {
                const soundType = e.target.dataset.soundType;
                this.setSoundType(soundType);
            }
        });
        
        // Ending selection controls - use event delegation for dynamic buttons
        document.querySelector('.ending-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-btn')) {
                const soundType = e.target.dataset.soundType;
                this.setEndingSoundType(soundType);
            }
        });
        
        // OneShot selection controls - use event delegation for dynamic buttons
        document.querySelector('.oneshot-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-btn')) {
                const soundType = e.target.dataset.soundType;
                this.playOneshotSound(soundType);
            }
        });
        
        // Combo selection controls - use event delegation for dynamic buttons
        document.querySelector('.combo-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('sound-btn')) {
                const soundType = e.target.dataset.soundType;
                this.playComboSound(soundType);
            }
        });
        
        // Duration input validation
        this.elements.durationInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.elements.durationInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) {
                e.target.value = 1;
            } else if (value > 999) {
                e.target.value = 999;
            }
        });
        
        // Total beats input validation
        this.elements.totalBeatsInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.elements.totalBeatsInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 1) {
                e.target.value = 1;
            } else if (value > 9999) {
                e.target.value = 9999;
            }
        });
        
        // BPM Slider functionality
        this.setupBpmSlider();
        
        // Volume Slider functionality
        this.setupVolumeSlider();
        
        // BPM control buttons
        this.elements.bpmMultiplyBtn.addEventListener('click', () => this.callbacks.multiplyBpm());
        this.elements.bpmDivideBtn.addEventListener('click', () => this.callbacks.divideBpm());
        this.elements.setRequiredBpmBtn.addEventListener('click', () => this.callbacks.setToRequiredBpm());
        
        // BPM preset buttons
        this.elements.set60BpmBtn.addEventListener('click', () => this.callbacks.set60Bpm());
        this.elements.set110BpmBtn.addEventListener('click', () => this.callbacks.set110Bpm());
        
        // Oneshot stop button
        if (this.elements.stopOneshotBtn) {
            this.elements.stopOneshotBtn.addEventListener('click', () => this.callbacks.onOneshotSoundStop());
        }
        
        // Keyboard event listeners for tap tempo
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    /**
     * Set up BPM slider functionality
     */
    setupBpmSlider() {
        let isDragging = false;
        
        const getSliderPosition = (e) => {
            const rect = this.elements.sliderTrack.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const position = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(1, position));
        };
        
        const updateBpmFromPosition = (position) => {
            const newBpm = window.bpmConfig.sliderPositionToBpm(position);
            const clampedBpm = window.bpmConfig.clampBpm(newBpm);
            
            this.bpm = clampedBpm;
            this.elements.bpmNumber.textContent = clampedBpm;
            this.updateSliderPosition(clampedBpm);
        };
        
        const applyBpmChange = () => {
            if (this.callbacks.applyBpmChange) {
                this.callbacks.applyBpmChange(this.bpm);
            }
        };
        
        // Mouse events
        this.elements.sliderTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        this.elements.sliderThumb.addEventListener('mousedown', (e) => {
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
        this.elements.sliderTrack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const position = getSliderPosition(e);
            updateBpmFromPosition(position);
        });
        
        this.elements.sliderThumb.addEventListener('touchstart', (e) => {
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
    
    /**
     * Set up volume slider functionality
     */
    setupVolumeSlider() {
        let isDragging = false;
        
        const getVolumeSliderPosition = (e) => {
            const rect = this.elements.volumeSliderTrack.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const position = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(1, position));
        };
        
        const updateVolumeFromPosition = (position) => {
            const newVolume = Math.round(5 + position * 95); // Map 0-1 to 5-100
            const clampedVolume = Math.max(5, Math.min(100, newVolume));
            
            this.volume = clampedVolume;
            this.elements.volumeNumber.textContent = clampedVolume;
            this.updateVolumeSliderPosition(clampedVolume);
            
            // Notify audio manager of volume change
            if (this.callbacks.onVolumeChanged) {
                this.callbacks.onVolumeChanged(clampedVolume);
            }
        };
        
        // Mouse events
        this.elements.volumeSliderTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        this.elements.volumeSliderThumb.addEventListener('mousedown', (e) => {
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
        this.elements.volumeSliderTrack.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const position = getVolumeSliderPosition(e);
            updateVolumeFromPosition(position);
        });
        
        this.elements.volumeSliderThumb.addEventListener('touchstart', (e) => {
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
    
    /**
     * Update BPM slider position
     */
    updateSliderPosition(bpm) {
        const position = window.bpmConfig.bpmToSliderPosition(bpm);
        const percentage = position * 100;
        
        this.elements.sliderThumb.style.left = `${percentage}%`;
        this.elements.sliderFill.style.width = `${percentage}%`;
    }
    
    /**
     * Update volume slider position
     */
    updateVolumeSliderPosition(volume) {
        const percentage = ((volume - 5) / 95) * 100;
        
        this.elements.volumeSliderThumb.style.left = `${percentage}%`;
        this.elements.volumeSliderFill.style.width = `${percentage}%`;
    }
    
    /**
     * Set sound type and update UI
     */
    setSoundType(soundType) {
        if (!this.soundConfig.validateSoundType(soundType, 'regular')) {
            console.warn(`Invalid sound type: ${soundType}, falling back to Thump`);
            soundType = 'Thump';
        }
        
        this.selectedSound = soundType;
        
        // Remove active class from all regular sound buttons
        const regularSounds = this.soundConfig.getRegularSounds();
        regularSounds.forEach(sound => {
            if (this.soundButtons[sound.label]) {
                this.soundButtons[sound.label].classList.remove('active');
            }
        });
        
        // Add active class to selected button
        if (this.soundButtons[soundType]) {
            this.soundButtons[soundType].classList.add('active');
        }
        
        // Notify main app
        if (this.callbacks.onSoundTypeChanged) {
            this.callbacks.onSoundTypeChanged(soundType);
        }
    }
    
    /**
     * Set ending sound type and update UI
     */
    setEndingSoundType(soundType) {
        if (!this.soundConfig.validateSoundType(soundType, 'end')) {
            console.warn(`Invalid ending sound type: ${soundType}, falling back to Silent`);
            soundType = 'Silent';
        }
        
        this.selectedEndingSound = soundType;
        
        // Remove active class from all ending sound buttons
        const endingSounds = this.soundConfig.getEndingSounds();
        endingSounds.forEach(sound => {
            if (this.soundButtons[sound.label]) {
                this.soundButtons[sound.label].classList.remove('active');
            }
        });
        
        // Add active class to selected button
        if (this.soundButtons[soundType]) {
            this.soundButtons[soundType].classList.add('active');
        }
        
        // Notify main app
        if (this.callbacks.onEndingSoundTypeChanged) {
            this.callbacks.onEndingSoundTypeChanged(soundType);
        }
    }
    
    /**
     * Play oneshot sound immediately
     */
    playOneshotSound(soundType) {
        if (!this.soundConfig.validateSoundType(soundType, 'oneshot')) {
            console.warn(`Invalid oneshot sound type: ${soundType}`);
            return;
        }
        
        // Notify main app to play the oneshot sound
        if (this.callbacks.onOneshotSoundPlay) {
            this.callbacks.onOneshotSoundPlay(soundType);
        }
    }
    
    /**
     * Play combo sound and set BPM
     */
    playComboSound(soundType) {
        if (!this.soundConfig.validateSoundType(soundType, 'combo')) {
            console.warn(`Invalid combo sound type: ${soundType}`);
            return;
        }
        
        const soundConfig = this.soundConfig.getSoundInfo(soundType);
        if (soundConfig && soundConfig.bpm) {
            // Extract the base sound name by removing the BPM suffix
            let baseSoundName = soundConfig.label.replace(/\s+\d+$/, '');
            
            // Handle special cases where the base sound name might be different
            if (baseSoundName === 'Heartbeat') {
                baseSoundName = 'Heart Beat';
            }
            
            // Set the sound type and BPM
            this.setSoundType(baseSoundName);
            this.setBpm(soundConfig.bpm);
            
            // Notify main app to apply the changes
            if (this.callbacks.onComboSoundPlay) {
                this.callbacks.onComboSoundPlay(soundType, soundConfig.bpm);
            }
        }
    }
    
    
    /**
     * Update display with countdown and BPM information
     */
    updateDisplay(countdown, bpm, requiredBpm) {
        this.elements.countdownNumber.textContent = countdown;
        this.elements.bpmNumber.textContent = bpm;
        this.elements.requiredBpmDisplay.textContent = `Required BPM: ${requiredBpm}`;
        this.elements.setRequiredBpmBtn.textContent = `${requiredBpm} BPM`;
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay(remainingTimeSeconds) {
        const minutes = Math.floor(remainingTimeSeconds / 60);
        const seconds = remainingTimeSeconds % 60;
        this.elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Trigger beat animation
     */
    triggerBeatAnimation() {
        this.elements.countdownNumber.classList.add('beat');
        
        setTimeout(() => {
            this.elements.countdownNumber.classList.remove('beat');
        }, 200);
    }
    
    /**
     * Show countdown panel
     */
    showCountdownPanel() {
        this.elements.setupPanel.style.display = 'none';
        this.elements.countdownPanel.style.display = 'block';
    }
    
    /**
     * Show setup panel
     */
    showSetupPanel() {
        this.elements.countdownPanel.style.display = 'none';
        this.elements.setupPanel.style.display = 'block';
    }
    
    /**
     * Show completion state
     */
    showCompletion() {
        this.elements.countdownNumber.textContent = 'Done!';
        this.elements.countdownNumber.style.color = '#48bb78';
        this.elements.countdownNumber.style.textShadow = '0 4px 8px rgba(72, 187, 120, 0.3)';
        this.elements.timerDisplay.textContent = '00:00';
    }
    
    /**
     * Update stop/resume button state
     */
    updateStopButton(isRunning) {
        if (isRunning) {
            this.elements.stopBtn.textContent = 'Stop';
            this.elements.stopBtn.classList.remove('resume-btn');
            this.elements.stopBtn.classList.add('stop-btn');
        } else {
            this.elements.stopBtn.textContent = 'Resume';
            this.elements.stopBtn.classList.remove('stop-btn');
            this.elements.stopBtn.classList.add('resume-btn');
        }
    }
    
    /**
     * Update disable button state
     */
    updateDisableButton(isDisabled) {
        if (isDisabled) {
            this.elements.disableBtn.textContent = 'Disabled';
            this.elements.disableBtn.disabled = true;
            this.elements.disableBtn.classList.add('disabled');
        } else {
            this.elements.disableBtn.textContent = 'Disable 5s';
            this.elements.disableBtn.disabled = false;
            this.elements.disableBtn.classList.remove('disabled');
        }
    }
    
    /**
     * Update MIDI status display
     */
    updateMIDIStatus(isConnected, text) {
        if (this.elements.midiStatus && this.elements.midiIndicator && this.elements.midiText) {
            this.elements.midiStatus.className = `midi-status ${isConnected ? 'connected' : 'disconnected'}`;
            this.elements.midiIndicator.textContent = isConnected ? '🎹' : '🔌';
            this.elements.midiText.textContent = text;
        }
    }
    
    /**
     * Get current UI state values
     */
    getDurationValue() {
        return parseInt(this.elements.durationInput.value);
    }
    
    getTotalBeatsValue() {
        return parseInt(this.elements.totalBeatsInput.value);
    }
    
    getSelectedSound() {
        return this.selectedSound;
    }
    
    getSelectedEndingSound() {
        return this.selectedEndingSound;
    }
    
    getBpm() {
        return this.bpm;
    }
    
    getVolume() {
        return this.volume;
    }
    
    /**
     * Set BPM and update UI
     */
    setBpm(bpm) {
        this.bpm = bpm;
        this.elements.bpmNumber.textContent = bpm;
        this.updateSliderPosition(bpm);
    }
    
    /**
     * Set volume and update UI
     */
    setVolume(volume) {
        this.volume = volume;
        this.elements.volumeNumber.textContent = volume;
        this.updateVolumeSliderPosition(volume);
        
        // Notify audio manager of volume change
        if (this.callbacks.onVolumeChanged) {
            this.callbacks.onVolumeChanged(volume);
        }
    }
    
    /**
     * Handle keyboard input for tap tempo
     */
    handleKeyDown(e) {
        // Handle Shift key for tap tempo
        if (e.key === 'Shift' && !e.repeat) {
            this.handleTapTempo();
        }
        
        // Handle Enter key to confirm suggested BPM
        if (e.key === 'Enter' && this.isTapTempoMode && this.suggestedBpm) {
            this.confirmSuggestedBpm();
        }
    }
    
    /**
     * Handle tap tempo input
     */
    handleTapTempo() {
        const currentTime = Date.now();
        this.tapTimes.push(currentTime);
        this.tapCount++;
        
        // Keep only the last 4 taps
        if (this.tapTimes.length > 4) {
            this.tapTimes.shift();
        }
        
        // Show tap tempo mode indicator
        this.isTapTempoMode = true;
        this.showTapTempoIndicator();
        
        // Calculate BPM if we have at least 2 taps
        if (this.tapTimes.length >= 2) {
            this.calculateSuggestedBpm();
        }
        
        // Reset after 3 seconds of inactivity
        clearTimeout(this.tapTempoTimeout);
        this.tapTempoTimeout = setTimeout(() => {
            this.resetTapTempo();
        }, 3000);
    }
    
    /**
     * Calculate suggested BPM from tap intervals
     */
    calculateSuggestedBpm() {
        if (this.tapTimes.length < 2) return;
        
        // Calculate average interval between taps
        let totalInterval = 0;
        for (let i = 1; i < this.tapTimes.length; i++) {
            totalInterval += this.tapTimes[i] - this.tapTimes[i - 1];
        }
        
        const averageInterval = totalInterval / (this.tapTimes.length - 1);
        
        // Convert milliseconds to BPM (60,000 ms per minute)
        const calculatedBpm = Math.round(60000 / averageInterval);
        
        // Clamp BPM to valid range
        this.suggestedBpm = window.bpmConfig.clampBpm(calculatedBpm);
        
        // Update display
        this.updateSuggestedBpmDisplay();
    }
    
    /**
     * Show tap tempo mode indicator
     */
    showTapTempoIndicator() {
        if (this.elements.tapTempoIndicator) {
            this.elements.tapTempoIndicator.style.display = 'block';
            this.elements.tapTempoIndicator.textContent = `Tap Tempo: ${this.tapCount}/4`;
        }
    }
    
    /**
     * Update suggested BPM display
     */
    updateSuggestedBpmDisplay() {
        if (this.elements.suggestedBpmDisplay && this.suggestedBpm) {
            this.elements.suggestedBpmDisplay.style.display = 'block';
            this.elements.suggestedBpmDisplay.textContent = `Suggested: ${this.suggestedBpm} BPM (Press Enter to apply)`;
        }
    }
    
    /**
     * Confirm and apply suggested BPM
     */
    confirmSuggestedBpm() {
        if (this.suggestedBpm) {
            // Apply the suggested BPM
            this.setBpm(this.suggestedBpm);
            
            // Notify main app to apply the BPM change
            if (this.callbacks.applyBpmChange) {
                this.callbacks.applyBpmChange(this.suggestedBpm);
            }
            
            // Reset tap tempo mode
            this.resetTapTempo();
        }
    }
    
    /**
     * Reset tap tempo mode
     */
    resetTapTempo() {
        this.tapTimes = [];
        this.tapCount = 0;
        this.suggestedBpm = null;
        this.isTapTempoMode = false;
        
        // Hide indicators
        if (this.elements.tapTempoIndicator) {
            this.elements.tapTempoIndicator.style.display = 'none';
        }
        if (this.elements.suggestedBpmDisplay) {
            this.elements.suggestedBpmDisplay.style.display = 'none';
        }
        
        // Clear timeout
        if (this.tapTempoTimeout) {
            clearTimeout(this.tapTempoTimeout);
            this.tapTempoTimeout = null;
        }
    }
    
    /**
     * Reset UI to initial state
     */
    reset() {
        this.selectedSound = 'Opening Loop';
        this.selectedEndingSound = 'Boom';
        this.setSoundType('Opening Loop');
        this.setEndingSoundType('Boom');
        this.updateStopButton(true);
        this.resetTapTempo();
    }
}
