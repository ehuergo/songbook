/**
 * Main Application Module
 */
import { Store } from './store.js';
import { ChordPro } from './chordpro.js';
import { UI } from './ui.js';
import { Editor } from './editor.js';

let currentFileHandle = null;
let currentSongObject = null;
let transposeLevel = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    Editor.init();
    setupEventListeners();
    refreshLibrary(); // Auto-load library
});

function setupEventListeners() {
    // Sidebar
    // Open Library button removed

    document.getElementById('new-song-btn').addEventListener('click', () => {
        createNewSong();
    });

    // TXT Import
    const txtInput = document.getElementById('txt-upload-input');
    document.getElementById('import-txt-btn').addEventListener('click', () => {
        txtInput.click();
    });

    txtInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await Store.importText(file);
        if (result.success && result.text) {
            // Heuristic conversion to ChordPro
            const chordProText = convertTextToChordPro(result.text);

            // Create new song with this content
            currentFileHandle = null;
            currentSongObject = ChordPro.parse(chordProText);
            currentSongObject.title = file.name.replace(/\.(txt|text)$/i, '');

            // Open Editor
            UI.elements.codeEditor.value = ChordPro.toText(currentSongObject);
            Editor.renderVisualEditor(currentSongObject);
            UI.showScreen('editor-screen');
        } else {
            alert("Error importing text file: " + (result.error || "Unknown error"));
        }
        txtInput.value = ''; // Reset
    });

    // Paste TXT
    document.getElementById('paste-txt-btn').addEventListener('click', () => {
        document.getElementById('paste-title-input').value = 'Nueva Canción';
        document.getElementById('paste-txt-textarea').value = '';
        UI.showScreen('paste-txt-screen');
    });

    document.getElementById('cancel-paste-btn').addEventListener('click', () => {
        UI.showScreen('welcome-screen');
    });

    document.getElementById('confirm-paste-btn').addEventListener('click', () => {
        const text = document.getElementById('paste-txt-textarea').value;
        let title = document.getElementById('paste-title-input').value.trim();
        
        if (!text.trim()) {
            alert("Por favor, pega el texto de la canción primero.");
            return;
        }
        
        if (!title) {
            title = 'Nueva Canción';
        }
        
        const chordProText = convertTextToChordPro(text);
        
        currentFileHandle = null;
        currentSongObject = ChordPro.parse(chordProText);
        currentSongObject.title = title;
        
        UI.elements.codeEditor.value = ChordPro.toText(currentSongObject);
        Editor.renderVisualEditor(currentSongObject);
        UI.showScreen('editor-screen');
    });


    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allSongs.filter(song => song.title.toLowerCase().includes(query));
        renderLibraryList(filtered);
    });

    // Song View
    document.getElementById('transpose-up-btn').addEventListener('click', () => {
        transposeLevel++;
        updateSongView();
    });

    document.getElementById('transpose-down-btn').addEventListener('click', () => {
        transposeLevel--;
        updateSongView();
    });

    document.getElementById('save-transposed-btn').addEventListener('click', async () => {
        if (transposeLevel === 0) {
            alert("No transposition applied.");
            return;
        }

        const transposedSong = ChordPro.transpose(currentSongObject, transposeLevel);
        const text = ChordPro.toText(transposedSong);

        // Confirm overwrite or save as new
        const filename = prompt("Save transposed song as:", currentFileHandle);
        if (filename) {
            await Store.createFile(filename, text);
            if (filename === currentFileHandle) {
                // If overwritten, reset transpose level because the file itself is now transposed
                currentSongObject = transposedSong;
                transposeLevel = 0;
                updateSongView();
            }
            refreshLibrary();
        }
    });

    document.getElementById('edit-btn').addEventListener('click', () => {
        openEditor();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        // On mobile, open sidebar
        document.getElementById('sidebar').classList.add('open');
    });

    // Editor
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        UI.showScreen('song-view-screen');
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
        await saveSong();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const tab = e.target.dataset.tab;
            document.querySelectorAll('.editor-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`editor-${tab}`).classList.add('active');

            // Sync content when switching tabs
            if (tab === 'code') {
                // Visual -> Code
                const song = Editor.getSongFromVisual();
                UI.elements.codeEditor.value = ChordPro.toText(song);
            } else {
                // Code -> Visual
                const text = UI.elements.codeEditor.value;
                const song = ChordPro.parse(text);
                Editor.renderVisualEditor(song);
            }
        });
    });
}

let allSongs = [];

async function refreshLibrary() {
    try {
        allSongs = await Store.listSongs();
        // Sort alphabetically by title
        allSongs.sort((a, b) => a.title.localeCompare(b.title));
        renderLibraryList(allSongs);
    } catch (err) {
        console.error("Error refreshing library:", err);
        alert("Error loading songs. Check console for details.");
    }
}

function renderLibraryList(songs) {
    UI.renderSongList(songs, async (songItem) => {
        currentFileHandle = songItem.filename; // Use filename as handle/id
        const text = await Store.readFile(currentFileHandle);
        currentSongObject = ChordPro.parse(text);
        transposeLevel = 0;
        updateSongView();
        UI.showScreen('song-view-screen');
    });
}

function updateSongView() {
    if (!currentSongObject) return;
    const transposedSong = ChordPro.transpose(currentSongObject, transposeLevel);
    UI.renderSong(transposedSong);
    UI.updateTransposeDisplay(transposeLevel);
}

function createNewSong() {
    currentFileHandle = null;
    currentSongObject = {
        title: 'New Song',
        artist: 'Unknown',
        meta: {},
        lines: [{ type: 'lyric', parts: [{ chord: null, lyric: 'Start typing here...' }] }]
    };

    // Open Editor directly
    UI.elements.codeEditor.value = ChordPro.toText(currentSongObject);
    Editor.renderVisualEditor(currentSongObject);

    UI.showScreen('editor-screen');
}

async function openEditor() {
    // Reset transpose before editing to avoid saving transposed chords
    // Or should we allow editing transposed? Usually no, we edit the original key.
    // So we use currentSongObject (original).

    UI.elements.codeEditor.value = ChordPro.toText(currentSongObject);
    Editor.renderVisualEditor(currentSongObject);
    UI.showScreen('editor-screen');
}

async function saveSong() {
    // Get content from active tab
    let text = '';
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;

    if (activeTab === 'visual') {
        const song = Editor.getSongFromVisual();
        text = ChordPro.toText(song);
    } else {
        text = UI.elements.codeEditor.value;
    }

    // Update current object
    currentSongObject = ChordPro.parse(text);

    if (!currentFileHandle) {
        // Save as new
        const filename = prompt("Enter filename:", currentSongObject.title || "song");
        if (filename) {
            await Store.createFile(filename, text);
            currentFileHandle = filename; // Update current handle
            refreshLibrary();
        }
    } else {
        await Store.saveFile(currentFileHandle, text);
    }

    updateSongView();
    UI.showScreen('song-view-screen');
}

/**
 * Heuristic to convert raw text (likely from PDF) to ChordPro.
 * Attempts to identify lines that are mostly chords.
 */
/**
 * Heuristic to convert raw text (likely from PDF/TXT) to ChordPro.
 * Attempts to identify lines that are mostly chords and merge them with the following lyric line.
 */
function convertTextToChordPro(text) {
    const lines = text.split('\n');
    let result = [];

    // Regex for chords. Matches "C", "C#m", "[C]", "[A7]" etc.
    const chordTokenRegex = /^(\[)?[A-G][#b]?(m|min|maj|dim|aug|sus|add|M|2|5|6|7|9|11|13)*(\/[A-G][#b]?)?(\])?$/;

    // Helper to check if a line is a "chord line"
    const isChordLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        const words = trimmed.split(/\s+/);
        const chords = words.filter(w => chordTokenRegex.test(w));
        // If > 50% of words are chords, treat as chord line
        return chords.length > 0 && chords.length >= words.length * 0.5;
    };

    // Helper to extract chords and their indices from a line
    const getChordsFromLine = (line) => {
        const chords = [];
        // We scan by token to preserve "word" logic, but we need start indices.
        // Simple regex matchAll approach for tokens
        const tokenRegex = /\S+/g;
        let match;
        while ((match = tokenRegex.exec(line)) !== null) {
            const word = match[0];
            const index = match.index;
            if (chordTokenRegex.test(word)) {
                // Strip existing brackets if any for normalization
                const cleanChord = word.replace(/^\[|\]$/g, '');
                chords.push({ chord: cleanChord, index: index });
            }
        }
        return chords;
    };

    for (let i = 0; i < lines.length; i++) {
        // Don't trimStart yet, alignment matters!
        const currentLine = lines[i];

        // Skip empty lines (but preserve them in output?)
        if (!currentLine.trim()) {
            result.push('');
            continue;
        }

        if (isChordLine(currentLine)) {
            // Check if next line exists and is NOT a chord line
            const nextLine = lines[i + 1];

            if (nextLine && !isChordLine(nextLine) && nextLine.trim()) {
                // MERGE STRATEGY
                const chords = getChordsFromLine(currentLine);
                let mergedLine = nextLine;

                // Insert from right to left to avoid index shift issues
                chords.sort((a, b) => b.index - a.index);

                chords.forEach(({ chord, index }) => {
                    const chordStr = `[${chord}]`;
                    if (index >= mergedLine.length) {
                        // Append if beyond length (padding with spaces if needed? or just append)
                        // Simple append for now
                        mergedLine += " " + chordStr;
                    } else {
                        // Insert at index
                        // Note: If multiple chords are close, this might get crowded, but standard logic holds.
                        mergedLine = mergedLine.slice(0, index) + chordStr + mergedLine.slice(index);
                    }
                });

                result.push(mergedLine);
                i++; // Skip the next line since we merged it
            } else {
                // Standalone chord line (e.g. Intro, or ends of verses)
                // Just wrap chords in brackets
                const chords = getChordsFromLine(currentLine);
                // Reconstruct line with brackets
                // This converts "C G" -> "[C] [G]"
                const words = currentLine.trim().split(/\s+/);
                const formatted = words.map(w => {
                    if (chordTokenRegex.test(w)) {
                        return `[${w.replace(/^\[|\]$/g, '')}]`;
                    }
                    return w;
                }).join(' ');
                result.push(formatted);
            }
        } else {
            // Normal lyric line (or unknown), pass through
            result.push(currentLine);
        }
    }

    return result.join('\n');
}
