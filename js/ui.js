/**
 * UI Helper Module
 */
import { ChordPro } from './chordpro.js';

export const UI = {
    elements: {
        songList: document.getElementById('song-list'),
        songDisplay: document.getElementById('song-display'),
        songTitle: document.getElementById('song-title'),
        screens: document.querySelectorAll('.screen'),
        transposeValue: document.getElementById('transpose-value'),
        visualEditorCanvas: document.getElementById('visual-editor-canvas'),
        codeEditor: document.getElementById('code-editor-textarea')
    },

    showScreen(screenId) {
        this.elements.screens.forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');

        // Mobile sidebar handling
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    },

    renderSongList(songs, onSelect) {
        this.elements.songList.innerHTML = '';
        songs.forEach(song => {
            const li = document.createElement('li');
            // Remove extension for display
            li.textContent = song.title;
            li.onclick = () => onSelect(song);
            this.elements.songList.appendChild(li);
        });
    },

    renderSong(songObject) {
        this.elements.songTitle.textContent = songObject.title || 'Untitled';

        // Remove existing metadata header if present (to avoid duplication on re-render)
        const existingMeta = this.elements.songDisplay.querySelector('.song-metadata');
        if (existingMeta) existingMeta.remove();

        const metaDiv = document.createElement('div');
        metaDiv.className = 'song-metadata';

        if (songObject.artist) {
            const artistElem = document.createElement('p');
            artistElem.className = 'song-artist';
            artistElem.textContent = songObject.artist;
            metaDiv.appendChild(artistElem);
        }

        if (songObject.meta.capo) {
            const capoElem = document.createElement('p');
            capoElem.className = 'song-capo';
            capoElem.textContent = `Capo: ${songObject.meta.capo}`;
            metaDiv.appendChild(capoElem);
        }

        this.elements.songDisplay.innerHTML = '';
        this.elements.songDisplay.appendChild(metaDiv);

        songObject.lines.forEach(line => {
            if (line.type === 'lyric') {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'chord-line';

                line.parts.forEach(part => {
                    const partDiv = document.createElement('div');
                    partDiv.className = 'lyric-part';

                    if (part.chord) {
                        const chordSpan = document.createElement('span');
                        chordSpan.className = 'chord';
                        chordSpan.textContent = part.chord;
                        partDiv.appendChild(chordSpan);
                    }

                    const lyricSpan = document.createElement('span');
                    lyricSpan.className = 'lyric';
                    lyricSpan.textContent = part.lyric || '\u00A0'; // Non-breaking space if empty
                    partDiv.appendChild(lyricSpan);

                    lineDiv.appendChild(partDiv);
                });

                this.elements.songDisplay.appendChild(lineDiv);
            }
        });
    },

    updateTransposeDisplay(value) {
        this.elements.transposeValue.textContent = value > 0 ? `+${value}` : value;
    }
};
