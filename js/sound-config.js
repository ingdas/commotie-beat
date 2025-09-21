/**
 * Sound Configuration Module
 * Defines all available sounds and their properties
 */
class SoundConfig {
    constructor() {
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
                label: 'Extra Suggestie',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot2.mp3',
                label: 'Pose Suggestie',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot3.mp3',
                label: 'Blijdschap suggestie',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot4.mp3',
                label: 'Vertel Verhaal',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot5.mp3',
                label: 'Einde Stress',
                type: 'oneshot'
            },
            {
                url: './sounds/oneshot6.mp3',
                label: 'Nudge Publiek',
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
    
}
