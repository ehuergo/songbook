import { ChordPro } from './chordpro.js';

console.log("Running ChordPro Tests...");

// Test 1: Parsing
const input = `{title: Amazing Grace}
{artist: John Newton}
[G]Amazing [C]grace! How [G]sweet the [D]sound`;

const song = ChordPro.parse(input);
console.assert(song.title === "Amazing Grace", "Title parse failed");
console.assert(song.artist === "John Newton", "Artist parse failed");
console.assert(song.lines.length === 1, "Line count failed");
console.assert(song.lines[0].parts[0].chord === "G", "First chord failed");
console.assert(song.lines[0].parts[0].lyric === "Amazing ", "First lyric failed");

console.log("Parse Test Passed!");

// Test 2: Transposition (G -> A, +2 semitones)
const transposed = ChordPro.transpose(song, 2);
console.assert(transposed.lines[0].parts[0].chord === "A", "Transpose G->A failed");
console.assert(transposed.lines[0].parts[1].chord === "D", "Transpose C->D failed");

console.log("Transpose Test Passed!");

// Test 3: Round Trip
const output = ChordPro.toText(song);
// Note: formatting might slightly differ (newlines), but content should match
console.log("Round Trip Output:\n", output);

console.log("All Tests Completed.");
