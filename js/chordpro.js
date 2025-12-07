/**
 * ChordPro Engine
 * Parses, transposes, and generates ChordPro format.
 */

export const ChordPro = {
    /**
     * Parses a ChordPro string into a structured object.
     * @param {string} text 
     * @returns {object} Song object
     */
    parse(text) {
        const song = {
            title: '',
            artist: '',
            meta: {},
            lines: []
        };

        const lines = text.split('\n');

        lines.forEach(line => {
            line = line.trim();
            if (!line) return; // Skip empty lines

            // Meta directives: {title: ...}, {t: ...}
            if (line.startsWith('{') && line.endsWith('}')) {
                const content = line.slice(1, -1);
                const colonIndex = content.indexOf(':');
                if (colonIndex !== -1) {
                    const key = content.slice(0, colonIndex).trim().toLowerCase();
                    const value = content.slice(colonIndex + 1).trim();

                    if (key === 'title' || key === 't') song.title = value;
                    else if (key === 'artist' || key === 'a') song.artist = value;
                    else song.meta[key] = value;
                }
                return;
            }

            // Comment lines starting with #
            if (line.startsWith('#')) return;

            // Lyrics and Chords
            // Example: "Hello [C]World" -> parts: [{lyric: "Hello ", chord: null}, {lyric: "World", chord: "C"}]
            // Regex to find [chord]
            const parts = [];
            let lastIndex = 0;
            const regex = /\[([^\]]+)\]/g;
            let match;

            // We need to capture text *before* the first chord, and text *between* chords.

            while ((match = regex.exec(line)) !== null) {
                // Text before this chord
                const textBefore = line.slice(lastIndex, match.index);

                if (textBefore.length > 0) {
                    // If we have a pending chord from the previous iteration, append this text to it?
                    // No, the structure is: [{chord: "C", lyric: "Text"}].
                    // If we just encountered [C], the *next* text belongs to it.
                    // So "TextBefore" belongs to the *previous* chord or is standalone.

                    if (parts.length > 0 && parts[parts.length - 1].lyric === "") {
                        // This shouldn't really happen with the logic below, 
                        // unless we have [C][D] (two chords adjacent).
                        // In that case, [C] has no lyric.
                        parts[parts.length - 1].lyric = textBefore;
                    } else {
                        parts.push({ chord: null, lyric: textBefore });
                    }
                }

                // Now push the new chord with empty lyric, waiting for next text
                parts.push({ chord: match[1], lyric: "" });

                lastIndex = regex.lastIndex;
            }

            // Text after the last chord
            if (lastIndex < line.length) {
                const textAfter = line.slice(lastIndex);
                if (parts.length > 0 && parts[parts.length - 1].lyric === "") {
                    parts[parts.length - 1].lyric = textAfter;
                } else {
                    parts.push({ chord: null, lyric: textAfter });
                }
            }

            // Cleanup: If we have [C][D]Text, we get [{C, ""}, {D, "Text"}]. This is correct.
            // If we have Text[C], we get [{null, "Text"}, {C, ""}]. Correct.

            song.lines.push({ type: 'lyric', parts });
        });

        return song;
    },

    /**
     * Transposes the song by a number of semitones.
     * @param {object} song Song object
     * @param {number} semitones Number of semitones (can be negative)
     * @returns {object} New song object
     */
    transpose(song, semitones) {
        if (semitones === 0) return song;

        const newSong = JSON.parse(JSON.stringify(song)); // Deep copy

        newSong.lines.forEach(line => {
            if (line.type === 'lyric') {
                line.parts.forEach(part => {
                    if (part.chord) {
                        part.chord = this.transposeChord(part.chord, semitones);
                    }
                });
            }
        });

        return newSong;
    },

    transposeChord(chord, semitones) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        // Handle flats by converting to sharps for calculation
        const normalize = (c) => {
            const map = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
            return map[c] || c;
        };

        // Split root from quality (e.g., "Am7" -> "A", "m7")
        // Regex: Start with A-G, optional #/b, then the rest
        const match = chord.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return chord; // Can't parse, return as is

        let root = normalize(match[1]);
        const quality = match[2];

        let index = notes.indexOf(root);
        if (index === -1) return chord;

        let newIndex = (index + semitones) % 12;
        if (newIndex < 0) newIndex += 12;

        return notes[newIndex] + quality;
    },

    /**
     * Converts the song object back to ChordPro text.
     * @param {object} song 
     * @returns {string}
     */
    toText(song) {
        let text = '';
        if (song.title) text += `{title: ${song.title}}\n`;
        if (song.artist) text += `{artist: ${song.artist}}\n`;

        for (const [key, value] of Object.entries(song.meta)) {
            text += `{${key}: ${value}}\n`;
        }

        song.lines.forEach(line => {
            if (line.type === 'lyric') {
                let lineText = '';
                line.parts.forEach(part => {
                    if (part.chord) lineText += `[${part.chord}]`;
                    lineText += part.lyric;
                });
                text += lineText + '\n';
            }
        });

        return text;
    }
};
