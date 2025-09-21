/**
 * BPM Configuration Module
 * Centralized configuration for BPM limits and ranges
 */
class BPMConfig {
    constructor() {
        // BPM limits
        this.MIN_BPM = 15;
        this.MAX_BPM = 300;
        
        // BPM range for calculations
        this.BPM_RANGE = this.MAX_BPM - this.MIN_BPM;
    }
    
    /**
     * Clamp BPM value to valid range
     * @param {number} bpm - BPM value to clamp
     * @returns {number} - Clamped BPM value
     */
    clampBpm(bpm) {
        return Math.max(this.MIN_BPM, Math.min(this.MAX_BPM, bpm));
    }
    
    /**
     * Check if BPM is within valid range
     * @param {number} bpm - BPM value to check
     * @returns {boolean} - True if within range
     */
    isValidBpm(bpm) {
        return bpm >= this.MIN_BPM && bpm <= this.MAX_BPM;
    }
    
    /**
     * Get BPM range for slider calculations
     * @returns {number} - BPM range (max - min)
     */
    getBpmRange() {
        return this.BPM_RANGE;
    }
    
    /**
     * Calculate slider position from BPM
     * @param {number} bpm - BPM value
     * @returns {number} - Position (0-1)
     */
    bpmToSliderPosition(bpm) {
        return (bpm - this.MIN_BPM) / this.BPM_RANGE;
    }
    
    /**
     * Calculate BPM from slider position
     * @param {number} position - Slider position (0-1)
     * @returns {number} - BPM value
     */
    sliderPositionToBpm(position) {
        return Math.round(this.MIN_BPM + position * this.BPM_RANGE);
    }
}

// Create global instance
window.bpmConfig = new BPMConfig();
