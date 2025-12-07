/**
 * Editor Module
 * Handles Visual and Code editing.
 */
import { ChordPro } from './chordpro.js';
import { UI } from './ui.js';

export const Editor = {
    currentSong: null,
    sortables: [],

    init() {
        // Initialize palette draggable
        new Sortable(document.querySelector('.chord-palette'), {
            group: {
                name: 'chords',
                pull: 'clone',
                put: false
            },
            sort: false,
            onClone: (evt) => {
                // Ensure the clone has the right class
                evt.clone.classList.add('chord-token');
            }
        });

        // Custom Chord Button
        document.getElementById('add-custom-chord-btn').addEventListener('click', () => {
            const chordName = prompt("Enter chord name (e.g., Cmaj7):");
            if (chordName) {
                const palette = document.querySelector('.chord-palette');
                const chordElem = document.createElement('div');
                chordElem.className = 'draggable-chord chord-token';
                chordElem.draggable = true;
                chordElem.textContent = chordName;

                // Insert before the button
                palette.insertBefore(chordElem, document.getElementById('add-custom-chord-btn'));
            }
        });
    },

    renderVisualEditor(song) {
        this.currentSong = song;
        const canvas = UI.elements.visualEditorCanvas;
        canvas.innerHTML = '';
        this.destroySortables();

        // 1. Metadata Section
        const metaDiv = document.createElement('div');
        metaDiv.className = 'editor-metadata';

        // Title
        const titleGroup = document.createElement('div');
        titleGroup.className = 'form-group';
        titleGroup.innerHTML = `<label>Title</label><input type="text" value="${song.title || ''}">`;
        titleGroup.querySelector('input').oninput = (e) => song.title = e.target.value;
        metaDiv.appendChild(titleGroup);

        // Artist
        const artistGroup = document.createElement('div');
        artistGroup.className = 'form-group';
        artistGroup.innerHTML = `<label>Artist</label><input type="text" value="${song.artist || ''}">`;
        artistGroup.querySelector('input').oninput = (e) => song.artist = e.target.value;
        metaDiv.appendChild(artistGroup);

        // Capo
        const capoGroup = document.createElement('div');
        capoGroup.className = 'form-group';
        capoGroup.innerHTML = `<label>Capo (Fret)</label><input type="text" value="${song.meta.capo || ''}" placeholder="e.g. 2">`;
        capoGroup.querySelector('input').oninput = (e) => {
            if (e.target.value) song.meta.capo = e.target.value;
            else delete song.meta.capo;
        };
        metaDiv.appendChild(capoGroup);

        canvas.appendChild(metaDiv);

        song.lines.forEach((line, lineIndex) => {
            if (line.type === 'lyric') {
                const lineRow = document.createElement('div');
                lineRow.className = 'editor-line-row';

                // Create a container for the lyrics/chords
                // We want to be able to drop chords ONTO lyrics or BETWEEN them.
                // Approach: Render each "part" as a drop zone?
                // Or render the text as a sequence of words, each with a potential chord slot.

                // Let's try a simpler approach first:
                // Render the line as a Sortable list of "Tokens".
                // A Token can be a Lyric or a Chord.
                // But ChordPro binds chords to lyrics.

                // Better approach for Visual Editor:
                // Render the text. Allow dropping chords ABOVE the text.
                // We can use the same structure as the viewer:
                // [Chord][Lyric] blocks.

                line.parts.forEach((part, partIndex) => {
                    const partContainer = document.createElement('div');
                    partContainer.className = 'editor-part-container';
                    partContainer.dataset.lineIndex = lineIndex;
                    partContainer.dataset.partIndex = partIndex;

                    // Chord Slot (Sortable)
                    const chordSlot = document.createElement('div');
                    chordSlot.className = 'chord-slot';
                    if (part.chord) {
                        const chordElem = document.createElement('div');
                        chordElem.className = 'draggable-chord';
                        chordElem.textContent = part.chord;
                        chordElem.title = "Double-click to remove";

                        // Double-click to remove chord
                        chordElem.addEventListener('dblclick', (e) => {
                            e.stopPropagation(); // Prevent splitting text below
                            part.chord = null;
                            this.renderVisualEditor(this.currentSong);
                        });

                        chordSlot.appendChild(chordElem);
                    }
                    partContainer.appendChild(chordSlot);

                    // Lyric Input (Editable)
                    const lyricInput = document.createElement('span');
                    lyricInput.className = 'lyric-input';
                    lyricInput.contentEditable = true;
                    lyricInput.textContent = part.lyric;
                    lyricInput.oninput = (e) => {
                        part.lyric = e.target.textContent;
                    };

                    // Double-click to split text and add new chord slot
                    lyricInput.addEventListener('dblclick', (e) => {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const preCaretRange = range.cloneRange();
                            preCaretRange.selectNodeContents(lyricInput);
                            preCaretRange.setEnd(range.endContainer, range.endOffset);
                            const caretOffset = preCaretRange.toString().length;

                            if (caretOffset > 0 && caretOffset < part.lyric.length) {
                                // Split logic
                                const textBefore = part.lyric.slice(0, caretOffset);
                                const textAfter = part.lyric.slice(caretOffset);

                                // Update current part
                                part.lyric = textBefore;

                                // Create new part
                                const newPart = {
                                    chord: null,
                                    lyric: textAfter
                                };

                                // Insert new part after current part
                                line.parts.splice(partIndex + 1, 0, newPart);

                                // Re-render
                                this.renderVisualEditor(this.currentSong);
                            }
                        }
                    });

                    partContainer.appendChild(lyricInput);

                    lineRow.appendChild(partContainer);

                    // Make chord slot sortable
                    const sortable = new Sortable(chordSlot, {
                        group: 'chords',
                        sort: true,
                        onAdd: (evt) => {
                            // Chord dropped here
                            const chordName = evt.item.textContent;
                            // Update model
                            part.chord = chordName;
                            // Remove other items if multiple (replace)
                            if (chordSlot.children.length > 1) {
                                // Keep the new one, remove old
                                // Sortable appends the new one.
                                // If we dropped on top of existing, we might have 2.
                                // Actually Sortable just adds it to the list.
                                // We should ensure only 1 chord per slot.
                                while (chordSlot.children.length > 1) {
                                    if (chordSlot.children[0] !== evt.item) {
                                        chordSlot.removeChild(chordSlot.children[0]);
                                    }
                                }
                            }
                        },
                        onRemove: (evt) => {
                            // Chord removed
                            part.chord = null;
                        }
                    });
                    this.sortables.push(sortable);
                });

                canvas.appendChild(lineRow);
            }
        });
    },

    destroySortables() {
        this.sortables.forEach(s => s.destroy());
        this.sortables = [];
    },

    getSongFromVisual() {
        // The 'currentSong' object is updated in real-time via references (part.chord, part.lyric)
        // So we just return it.
        return this.currentSong;
    }
};
