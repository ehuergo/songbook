# Digital Songbook

A modern, web-based songbook application for managing your musical library, editing chords visually, and transposing songs on the fly. Designed for musicians who need a clean, responsive, and easy-to-use tool for their chords and lyrics.

## Features

*   **Library Management**: Automatically loads songs from a server-side library. Search by title.
*   **Visual Editor**: 
    *   **Drag & Drop**: Intuitively place chords exactly where they belong over lyrics.
    *   **Smart Editing**: Double-click lyrics to split text; double-click chords to remove them.
    *   **Metadata**: Edit Title, Artist, and Capo information directly.
    *   **Chord Palette**: Built-in major/minor chords plus a custom chord generator.
*   **Smart Import**: Import `.txt` files with intelligent chord detection that merges chord lines with lyrics automatically.
*   **Transposition**: Instantly transpose songs to any key and save the transposed version permanently.
*   **Capo Support**: Visual indication of Capo position.
*   **Responsive Design**: Optimized for tablets and desktop, perfect for live performance.

## Tech Stack

*   **Frontend**: Vanilla JavaScript (ES Modules), CSS3 (Custom Properties), SortableJS.
*   **Backend**: Node.js, Express (for file system operations).
*   **Tooling**: Vite (Dev Server), Concurrently.

## Getting Started

### Prerequisites

*   Node.js (v14+ recommended)
*   npm (comes with Node.js)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ehuergo/songbook.git
    cd songbook
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

Start both the frontend and backend servers with a single command:

```bash
npm run dev
```

*   Open your browser at **http://localhost:5173** to use the app.
*   The backend API runs on port `3001`.

## Usage Guide

### Creating/Importing Songs
*   Click **"+ New Song"** to start from scratch.
*   Click **"Import TXT"** to upload a text file. The system will try to auto-format chords (e.g., `[C]`) and merge chord lines with lyrics.

### Editing
*   **Visual Mode**: Drag chords from the top palette onto the lyrics. Double-click a word to split it if you need to insert a chord in the middle. Double-click a chord to delete it.
*   **Code Mode**: Edit the raw ChordPro text directly.

### Transposing
*   Use the **+ / -** buttons in the song view to change keys.
*   Click the **Floppy Disk 💾** icon to save the song in the currently displayed key (overwriting or saving as new).

## Project Structure

*   `songs/`: Directory where song files (`.chordpro`) are stored.
*   `js/`:
    *   `app.js`: Main application logic.
    *   `store.js`: API client for backend communication.
    *   `editor.js`: Visual editor logic using SortableJS.
    *   `chordpro.js`: Parsing and transposition engine.
    *   `ui.js`: DOM manipulation helpers.
*   `server.js`: Express server for handling file operations.

## License

[MIT](LICENSE)
