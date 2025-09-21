# Commotie: The Beat

A rhythmic countdown timer that synchronizes beats with a countdown timer, now with synchronized display devices.

## Features

- **Duration Input**: Set your target duration in minutes
- **Initial BPM Input**: Set your desired initial BPM (15-300)
- **Countdown Timer**: Visual countdown showing minutes and seconds remaining
- **Beat Counter**: Countdown number that decreases with each beat
- **BPM Calculation**: Displays the required BPM to finish exactly when the timer reaches zero
- **Interactive BPM Slider**: Adjust the BPM in real-time (15-300 BPM)
- **Volume Control**: Adjust the volume of the beat sound (20-100%)
- **Audio Feedback**: Bass drum sound on each beat
- **Visual Feedback**: Beat indicator animation and number scaling
- **MIDI Support**: Control the timer with MIDI devices
- **Disable Timer**: Temporarily pause the timer for 5 seconds
- **Synchronized Display**: Secondary display page for showing beat count on other devices
- **Real-time Communication**: WebSocket-based synchronization between main app and display devices

## How It Works

1. Enter your target duration in minutes
2. Enter your desired initial BPM (15-300)
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
- **Disable 5s**: Temporarily disable the timer for 5 seconds
- **Reset**: Return to the setup screen
- **Sound Selection**: Choose from various beat sounds
- **BPM Slider**: Drag to adjust the beat timing
- **Volume Slider**: Drag to adjust the sound volume

## MIDI Controls

The app supports MIDI input for hands-free control:

- **Sound Selection**: Play MIDI notes G#2-F3 to select different beat sounds
- **BPM Control**: Use CC#20 to increase/decrease BPM
- **Volume Control**: Use CC#21 to increase/decrease volume
- **Disable Timer**: Play G2 note to disable timer for 5 seconds

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Web Audio API for sound generation
- Responsive design for mobile and desktop
- Real-time BPM calculation based on remaining time and beats

## Setup and Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Access the Application**:
   - Main application: `http://localhost:8080`
   - Display page: `http://localhost:8080/display.html`

## Display Devices

The application now supports synchronized display devices:

1. Open `http://localhost:8080/display.html` on any device (phone, tablet, laptop)
2. The display will automatically connect to the main application
3. Shows real-time beat count, BPM, and remaining time
4. Automatically reconnects if connection is lost
5. Perfect for showing the beat count to an audience or on a separate screen

## File Structure

```
commotie-beat/
├── index.html              # Main application page
├── display.html            # Display-only page for other devices
├── server.js               # WebSocket server
├── package.json            # Node.js dependencies
├── styles.css              # Main application styles
├── js/
│   ├── app.js              # Main application logic
│   ├── audio-manager.js    # Audio handling
│   ├── midi-manager.js     # MIDI device support
│   ├── sound-config.js     # Sound configuration
│   ├── timer-manager.js    # Timer logic
│   └── ui-manager.js       # User interface management
└── sounds/                 # Audio files
    ├── boom.mp3
    ├── clock1.wav
    ├── clock2.wav
    ├── dream.wav
    ├── kickdrum.wav
    ├── metronome.wav
    ├── open1.mp3
    ├── open2.mp3
    └── water.mp3
```

## Technical Details

- **WebSocket Server**: Handles real-time communication between main app and display devices
- **Beat Scheduling**: Uses Web Audio API for precise timing
- **MIDI Integration**: Supports MIDI input devices for control
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-reconnection**: Display devices automatically reconnect if connection is lost

## Requirements

- Node.js (for WebSocket server)
- Modern web browser with Web Audio API support
- Optional: MIDI device for enhanced control
