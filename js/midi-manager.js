/**
 * MIDI Manager Module
 * Handles MIDI device connection, message processing, and control mapping
 */
class MIDIManager {
    constructor(soundConfig, callbacks) {
        this.soundConfig = soundConfig;
        this.callbacks = callbacks; // Object containing callback functions from main app
        this.midiInputs = [];
        this.isConnected = false;
        this.statusText = 'MIDI: Disconnected';
        
        this.initializeMIDI();
    }
    
    /**
     * Initialize MIDI functionality
     */
    async initializeMIDI() {
        // Check if Web MIDI API is supported
        if (!navigator.requestMIDIAccess) {
            console.warn('Web MIDI API not supported in this browser');
            this.updateMIDIStatus(false, 'MIDI: Not Supported');
            return;
        }
        
        try {
            // Request MIDI access
            const midiAccess = await navigator.requestMIDIAccess();
            console.log('MIDI access granted');
            
            // Set up MIDI input handlers
            this.setupMIDIInputs(midiAccess);
            
            // Listen for MIDI device changes
            midiAccess.onstatechange = (event) => {
                console.log('MIDI device state changed:', event.port);
                this.setupMIDIInputs(midiAccess);
            };
            
        } catch (error) {
            console.error('Failed to access MIDI:', error);
            this.updateMIDIStatus(false, 'MIDI: Access Denied');
        }
    }
    
    /**
     * Set up MIDI input handlers
     */
    setupMIDIInputs(midiAccess) {
        // Clear existing handlers
        this.midiInputs = [];
        
        // Set up handlers for all MIDI inputs
        for (let input of midiAccess.inputs.values()) {
            input.onmidimessage = (message) => this.handleMIDIMessage(message);
            this.midiInputs.push(input);
            console.log('MIDI input connected:', input.name);
        }
        
        if (this.midiInputs.length === 0) {
            console.log('No MIDI inputs found');
            this.updateMIDIStatus(false, 'MIDI: No Devices');
        } else {
            this.updateMIDIStatus(true, `MIDI: ${this.midiInputs.length} Device(s)`);
        }
    }
    
    /**
     * Handle incoming MIDI messages
     */
    handleMIDIMessage(message) {
        const [command, noteOrCC, velocity] = message.data;
        
        // Note ON messages (command 144 = 0x90)
        if (command === 144 && velocity > 0) {
            this.handleNoteON(noteOrCC);
        }
        // Control Change messages (command 176 = 0xB0)
        else if (command === 176) {
            this.handleControlChange(noteOrCC, velocity);
        }
    }
    
    /**
     * Handle MIDI Note ON messages for sound selection
     */
    handleNoteON(note) {
        const soundConfig = this.soundConfig.getSoundByMidiNote(note);
        if (soundConfig) {
            console.log(`MIDI Note ${note} -> Sound: ${soundConfig.label}`);
            
            // Set the sound type via callback
            if (soundConfig.type === 'end') {
                if (this.callbacks.setEndingSoundType) {
                    this.callbacks.setEndingSoundType(soundConfig.label);
                }
            } else {
                if (this.callbacks.setSoundType) {
                    this.callbacks.setSoundType(soundConfig.label);
                }
            }
        }
    }
    
    /**
     * Handle MIDI Control Change messages
     */
    handleControlChange(ccNumber, value) {
        switch (ccNumber) {
            case 20: // CC#20 -> BPM
                this.handleBPMControl(value);
                break;
            case 21: // CC#21 -> Volume
                this.handleVolumeControl(value);
                break;
        }
    }
    
    /**
     * Handle BPM control via MIDI CC#20
     */
    handleBPMControl(value) {
        if (value === 65) {
            // Increase BPM
            if (this.callbacks.increaseBPM) {
                this.callbacks.increaseBPM();
            }
            console.log(`MIDI CC#20: Increase BPM`);
        } else if (value === 63) {
            // Decrease BPM
            if (this.callbacks.decreaseBPM) {
                this.callbacks.decreaseBPM();
            }
            console.log(`MIDI CC#20: Decrease BPM`);
        }
    }
    
    /**
     * Handle Volume control via MIDI CC#21
     */
    handleVolumeControl(value) {
        if (value === 65) {
            // Increase Volume
            if (this.callbacks.increaseVolume) {
                this.callbacks.increaseVolume();
            }
            console.log(`MIDI CC#21: Increase Volume`);
        } else if (value === 63) {
            // Decrease Volume
            if (this.callbacks.decreaseVolume) {
                this.callbacks.decreaseVolume();
            }
            console.log(`MIDI CC#21: Decrease Volume`);
        }
    }
    
    /**
     * Update MIDI connection status
     */
    updateMIDIStatus(isConnected, text) {
        this.isConnected = isConnected;
        this.statusText = text;
        
        // Notify UI manager if callback is available
        if (this.callbacks.updateMIDIStatus) {
            this.callbacks.updateMIDIStatus(isConnected, text);
        }
    }
    
    /**
     * Get current MIDI status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            statusText: this.statusText,
            deviceCount: this.midiInputs.length
        };
    }
}
