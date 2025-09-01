# Commotie: The Beat

A rhythmic countdown timer that synchronizes beats with a countdown timer.

## Features

- **Duration Input**: Set your target duration in minutes
- **Initial BPM Input**: Set your desired initial BPM (30-200)
- **Countdown Timer**: Visual countdown showing minutes and seconds remaining
- **Beat Counter**: Countdown number that decreases with each beat
- **BPM Calculation**: Displays the required BPM to finish exactly when the timer reaches zero
- **Interactive BPM Slider**: Adjust the BPM in real-time (30-200 BPM)
- **Volume Control**: Adjust the volume of the beat sound (20-100%)
- **Audio Feedback**: Bass drum sound on each beat
- **Visual Feedback**: Beat indicator animation and number scaling

## How It Works

1. Enter your target duration in minutes
2. Enter your desired initial BPM (30-200)
3. Click "Start Timer" to begin
4. The app will:
   - Start a countdown timer showing minutes:seconds
   - Calculate the required BPM to finish exactly when the timer reaches zero
   - Display a beat counter that decreases with each beat
   - Play a bass drum sound on each beat
5. You can adjust the BPM using the slider to change the beat timing
6. The required BPM display shows what BPM is needed to finish exactly when the timer reaches zero

## Usage

- **Start**: Enter duration and initial BPM, then click "Start Timer"
- **Stop/Resume**: Pause and resume the countdown
- **Reset**: Return to the setup screen
- **Heartbeat Mode**: Toggle between regular kick drum and heartbeat sound
- **Beat Frequency**: Choose how often to hear beats (every count, every 2nd, 3rd, or 4th)
- **BPM Slider**: Drag to adjust the beat timing
- **Volume Slider**: Drag to adjust the sound volume

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Web Audio API for sound generation
- Responsive design for mobile and desktop
- Real-time BPM calculation based on remaining time and beats

## Running the App

Simply open `index.html` in a web browser, or serve it using a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.
