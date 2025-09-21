/**
 * Audio Manager Module
 * Handles all audio-related functionality including Web Audio API, sound generation, and buffer management
 */
class AudioManager {
    constructor(soundConfig) {
        this.soundConfig = soundConfig;
        this.audioContext = null;
        this.audioBuffers = {};
        this.soundAlternationCounters = {};
        this.volume = 50; // Default volume 50%
        this.audioInitialized = false; // Track if audio has been initialized
        this.activeOneshotSources = []; // Track active oneshot audio sources for stopping
        
        this.initializeAudio();
    }
    
    /**
     * Initialize the Web Audio API context
     */
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized successfully');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    /**
     * Load all audio files from the sound configuration
     */
    async loadAudioFiles() {
        if (!this.audioContext) return;
        
        try {
            // Load URL-based sounds from configuration
            for (const soundConfig of this.soundConfig.sounds) {
                if (soundConfig.url) {
                    await this.loadUrlBasedSound(soundConfig.label, soundConfig);
                } else if (soundConfig.urls) {
                    await this.loadUrlArrayBasedSound(soundConfig.label, soundConfig);
                }
            }
        } catch (error) {
            console.error('Error loading audio files:', error);
        }
    }
    
    /**
     * Load a single URL-based sound
     */
    async loadUrlBasedSound(soundKey, soundConfig) {
        try {
            this.audioBuffers[soundKey] = await this.loadAudioBuffer(soundConfig.url);
            console.log(`${soundKey} sound loaded successfully`);
        } catch (e) {
            console.warn(`Failed to load ${soundKey} from URL:`, e);
            console.log(`Using fallback generated ${soundKey} sound`);
        }
    }
    
    /**
     * Load multiple URL-based sounds for alternation
     */
    async loadUrlArrayBasedSound(soundKey, soundConfig) {
        try {
            this.audioBuffers[soundKey] = [];
            this.soundAlternationCounters[soundKey] = 0;
            
            // Load all URLs in the array
            for (const url of soundConfig.urls) {
                const buffer = await this.loadAudioBuffer(url);
                this.audioBuffers[soundKey].push(buffer);
            }
            
            console.log(`${soundKey} sounds loaded successfully (${soundConfig.urls.length} files)`);
        } catch (e) {
            console.warn(`Failed to load ${soundKey} from URLs:`, e);
            console.log(`Using fallback generated ${soundKey} sound`);
        }
    }
    
    /**
     * Load an audio buffer from a URL
     */
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
    
    /**
     * Play an audio buffer at a scheduled time
     */
    playAudioBuffer(audioBuffer, scheduledTime, isOneshot = false) {
        if (!audioBuffer || !this.audioContext) return;
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Apply volume control
        const volumeMultiplier = this.volume / 100;
        gainNode.gain.setValueAtTime(volumeMultiplier, scheduledTime);
        
        // Track oneshot sources for stopping
        if (isOneshot) {
            this.activeOneshotSources.push(source);
            
            // Remove from tracking when the sound ends
            source.onended = () => {
                const index = this.activeOneshotSources.indexOf(source);
                if (index > -1) {
                    this.activeOneshotSources.splice(index, 1);
                }
            };
        }
        
        // Schedule playback
        source.start(scheduledTime);
    }
    
    /**
     * Schedule audio for a beat based on the selected sound type
     */
    scheduleBeatAudio(selectedSound, scheduledTime) {
        const soundConfig = this.soundConfig.getSoundInfo(selectedSound);
        
        if (!soundConfig) {
            console.warn(`Unknown sound type: ${selectedSound}, falling back to Thump`);
            this.scheduleKickDrumAudio(scheduledTime);
            return;
        }
        
        if (soundConfig.url) {
            // Single URL-based sound: try to use loaded audio buffer first
            if (this.audioBuffers[selectedSound]) {
                this.playAudioBuffer(this.audioBuffers[selectedSound], scheduledTime);
            } else {
                // Fall back to generated sound
                this[soundConfig.generator](scheduledTime);
            }
        } else if (soundConfig.urls) {
            // Multiple URL-based sound: alternate between loaded audio buffers
            if (this.audioBuffers[selectedSound] && this.audioBuffers[selectedSound].length > 0) {
                const currentIndex = this.soundAlternationCounters[selectedSound] % this.audioBuffers[selectedSound].length;
                const currentBuffer = this.audioBuffers[selectedSound][currentIndex];
                this.playAudioBuffer(currentBuffer, scheduledTime);
                
                // Increment alternation counter for next time
                this.soundAlternationCounters[selectedSound]++;
            } else {
                // Fall back to generated sound
                this[soundConfig.generator](scheduledTime);
            }
        } else if (soundConfig.generator) {
            // Function-based sound: use the generator function
            this[soundConfig.generator](scheduledTime);
        }
    }
    
    /**
     * Generate a kick drum sound
     */
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
    
    /**
     * Generate a heartbeat sound
     */
    scheduleHeartbeatAudio(scheduledTime) {
        const volumeMultiplier = this.volume / 100;
        
        // Calculate the beat interval in seconds
        const beatInterval = 60 / 120; // Default BPM for heartbeat calculation
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
    
    /**
     * Generate a clock tick sound
     */
    scheduleClockAudio(scheduledTime) {
        // Use WAV file if available, otherwise fall back to generated sound
        if (this.audioBuffers['Clock'] && this.audioBuffers['Clock'].length > 0) {
            const currentIndex = this.soundAlternationCounters['Clock'] % this.audioBuffers['Clock'].length;
            const currentBuffer = this.audioBuffers['Clock'][currentIndex];
            this.playAudioBuffer(currentBuffer, scheduledTime);
            
            // Increment alternation counter for next time
            this.soundAlternationCounters['Clock']++;
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
    
    /**
     * Generate a bell sound
     */
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
        gainNode.gain.linearRampToValueAtTime(volumeMultiplier * 0.4, scheduledTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 1.0);
        
        oscillator.start(scheduledTime);
        oscillator.stop(scheduledTime + 1.0);
    }
    
    /**
     * Play ending sound
     */
    playEndingSound(selectedEndingSound) {
        if (!this.audioContext) return;
        
        const soundConfig = this.soundConfig.getSoundInfo(selectedEndingSound);
        
        if (!soundConfig) {
            console.warn(`Unknown ending sound type: ${selectedEndingSound}`);
            return;
        }
        
        // Don't play anything for Silent
        if (selectedEndingSound === 'Silent') {
            return;
        }
        
        const scheduledTime = this.audioContext.currentTime;
        
        if (soundConfig.url) {
            // Single URL-based sound: try to use loaded audio buffer first
            if (this.audioBuffers[selectedEndingSound]) {
                this.playAudioBuffer(this.audioBuffers[selectedEndingSound], scheduledTime);
            } else {
                console.warn(`Audio buffer not loaded for ending sound: ${selectedEndingSound}`);
            }
        } else if (soundConfig.urls) {
            // Multiple URL-based sound: use first available buffer
            if (this.audioBuffers[selectedEndingSound] && this.audioBuffers[selectedEndingSound].length > 0) {
                const currentBuffer = this.audioBuffers[selectedEndingSound][0];
                this.playAudioBuffer(currentBuffer, scheduledTime);
            } else {
                console.warn(`Audio buffers not loaded for ending sound: ${selectedEndingSound}`);
            }
        } else if (soundConfig.generator) {
            // Function-based sound: use the generator function
            this[soundConfig.generator](scheduledTime);
        }
    }
    
    /**
     * Play oneshot sound immediately (plays on top of other sounds)
     */
    playOneshotSound(selectedOneshotSound) {
        if (!this.audioContext) return;
        
        const soundConfig = this.soundConfig.getSoundInfo(selectedOneshotSound);
        
        if (!soundConfig) {
            console.warn(`Unknown oneshot sound type: ${selectedOneshotSound}`);
            return;
        }
        
        const scheduledTime = this.audioContext.currentTime;
        
        if (soundConfig.url) {
            // Single URL-based sound: try to use loaded audio buffer first
            if (this.audioBuffers[selectedOneshotSound]) {
                this.playAudioBuffer(this.audioBuffers[selectedOneshotSound], scheduledTime, true);
            } else {
                console.warn(`Audio buffer not loaded for oneshot sound: ${selectedOneshotSound}`);
            }
        } else if (soundConfig.urls) {
            // Multiple URL-based sound: use first available buffer
            if (this.audioBuffers[selectedOneshotSound] && this.audioBuffers[selectedOneshotSound].length > 0) {
                const currentBuffer = this.audioBuffers[selectedOneshotSound][0];
                this.playAudioBuffer(currentBuffer, scheduledTime, true);
            } else {
                console.warn(`Audio buffers not loaded for oneshot sound: ${selectedOneshotSound}`);
            }
        } else if (soundConfig.generator) {
            // Function-based sound: use the generator function
            this[soundConfig.generator](scheduledTime);
        }
    }
    
    /**
     * Stop all currently playing oneshot sounds
     */
    stopAllOneshotSounds() {
        // Stop all active oneshot sources
        this.activeOneshotSources.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // Source might already be stopped, ignore error
                console.warn('Error stopping oneshot source:', error);
            }
        });
        
        // Clear the array
        this.activeOneshotSources = [];
    }
    
    /**
     * Set the volume level
     */
    setVolume(volume) {
        this.volume = volume;
    }
    
    /**
     * Get the current volume
     */
    getVolume() {
        return this.volume;
    }
    
    /**
     * Resume audio context if suspended
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Get current audio context time
     */
    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }
    
    /**
     * Initialize audio device by playing a silent sound
     * This ensures the audio device is properly started for future audio playback
     */
    initializeAudioDevice() {
        if (this.audioInitialized || !this.audioContext) {
            return;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Create a very short silent audio buffer
            const bufferLength = this.audioContext.sampleRate * 0.1; // 0.1 seconds
            const buffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
            
            // Play the silent buffer
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start();
            
            this.audioInitialized = true;
            console.log('Audio device initialized with silent sound');
        } catch (error) {
            console.warn('Failed to initialize audio device:', error);
        }
    }
    
    /**
     * Check if audio has been initialized
     */
    isAudioInitialized() {
        return this.audioInitialized;
    }
}
