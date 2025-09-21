/**
 * Sound Configuration Module
 * Defines all available sounds and their properties
 */
class SoundConfig {
    constructor() {
        // Configuration for oneshot button labels (can be customized)
        this.oneshotLabels = {
            'OneShot 1': 'Extra Suggestie',
            'OneShot 2': 'Pose Suggestie', 
            'OneShot 3': 'Blijdschap suggestie',
            'OneShot 4': 'Vertel Verhaal',
            'OneShot 5': 'Einde Stress',
            'OneShot 6': 'Nudge Publiek'
        };
        
        this.sounds = [
            {
                generator: 'scheduleKickDrumAudio',
                label: 'Thump'
            },
            {
                urls: ['./sounds/drumloop1.mp3', './sounds/drumloop2.mp3'],
                label: 'Opening Loop'
            },
            {
                url: './sounds/kickdrum.wav',
                label: 'Kick Drum'
            },
            {
                url: './sounds/dream.wav',
                label: 'Dreamy'
            },
            {
                generator: 'scheduleHeartbeatAudio',
                label: 'Heart Beat'
            },
            {
                urls: ['./sounds/clock1.wav', './sounds/clock2.wav'],
                label: 'Clock'
            },
            {
                url: './sounds/metronome.wav',
                label: 'Metronome'
            },
            {
                url: './sounds/water.mp3',
                label: 'Water Drop'
            },
            {
                generator: 'scheduleBellAudio',
                label: 'Alarm'
            },
            {
                url: './sounds/boom.mp3',
                label: 'Boom',
                type: 'end'
            },
            {
                label: 'Silent',
                type: 'end'
            },
            {
                url: './sounds/oneshot1.mp3',
                label: 'OneShot 1',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot2.mp3',
                label: 'OneShot 2',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot3.mp3',
                label: 'OneShot 3',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot4.mp3',
                label: 'OneShot 4',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot5.mp3',
                label: 'OneShot 5',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot6.mp3',
                label: 'OneShot 6',
                type: 'oneshot'
            },
            {
                generator: 'scheduleKickDrumAudio',
                label: 'Thump 50',
                type: 'combo',
                bpm: 50
            },
            {
                generator: 'scheduleHeartbeatAudio',
                label: 'Heartbeat 50',
                type: 'combo',
                bpm: 50
            },
            {
                urls: ['./sounds/clock1.wav', './sounds/clock2.wav'],
                label: 'Clock 60',
                type: 'combo',
                bpm: 60
            },
            {
                urls: ['./sounds/drumloop1.mp3', './sounds/drumloop2.mp3'],
                label: 'Opening Loop 110',
                type: 'combo',
                bpm: 110
            }
        ];
        
        // MIDI note mappings for sound selection
        this.midiNoteMap = {
            44: 0, // G#2 -> Thump
            45: 1, // A2 -> Kick Drum
            46: 2, // A#2 -> Dreamy
            47: 3, // B2 -> Heart Beat
            48: 4, // C3 -> Clock
            49: 5, // C#3 -> Metronome
            50: 6, // D3 -> Water Drop
            51: 7, // D#3 -> Alarm
            52: 8, // E3 -> Boom
            53: 9  // F3 -> Silent
        };
    }
    
    /**
     * Get all available sound labels
     */
    getAvailableSounds() {
        return this.sounds.map(sound => sound.label);
    }
    
    /**
     * Get sound configuration by label
     */
    getSoundInfo(soundType) {
        return this.sounds.find(sound => sound.label === soundType) || null;
    }
    
    /**
     * Get regular sounds (not ending sounds)
     */
    getRegularSounds() {
        return this.sounds.filter(sound => sound.type !== 'end');
    }
    
    /**
     * Get ending sounds only
     */
    getEndingSounds() {
        return this.sounds.filter(sound => sound.type === 'end');
    }
    
    /**
     * Get oneshot sounds only
     */
    getOneshotSounds() {
        return this.sounds.filter(sound => sound.type === 'oneshot');
    }
    
    /**
     * Get combo sounds only (sound + BPM combinations)
     */
    getComboSounds() {
        return this.sounds.filter(sound => sound.type === 'combo');
    }
    
    /**
     * Get sound by MIDI note
     */
    getSoundByMidiNote(note) {
        const soundIndex = this.midiNoteMap[note];
        if (soundIndex !== undefined && soundIndex < this.sounds.length) {
            return this.sounds[soundIndex];
        }
        return null;
    }
    
    /**
     * Validate if a sound type exists and is of the specified type
     */
    validateSoundType(soundType, expectedType = null) {
        const soundConfig = this.getSoundInfo(soundType);
        if (!soundConfig) {
            return false;
        }
        
        if (expectedType === null) {
            return true; // Any valid sound
        }
        
        if (expectedType === 'end') {
            return soundConfig.type === 'end';
        }
        
        if (expectedType === 'regular') {
            return soundConfig.type !== 'end' && soundConfig.type !== 'oneshot';
        }
        
        if (expectedType === 'oneshot') {
            return soundConfig.type === 'oneshot';
        }
        
        if (expectedType === 'combo') {
            return soundConfig.type === 'combo';
        }
        
        return false;
    }
    
    /**
     * Get the display label for a oneshot sound
     */
    getOneshotLabel(soundLabel) {
        return this.oneshotLabels[soundLabel] || soundLabel;
    }
    
    /**
     * Set a custom label for a oneshot sound
     */
    setOneshotLabel(soundLabel, customLabel) {
        if (this.oneshotLabels.hasOwnProperty(soundLabel)) {
            this.oneshotLabels[soundLabel] = customLabel;
        }
    }
    
    /**
     * Get all oneshot labels configuration
     */
    getOneshotLabels() {
        return { ...this.oneshotLabels };
    }
}
