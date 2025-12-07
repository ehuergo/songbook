import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const SONGS_DIR = path.join(__dirname, 'songs');

app.use(cors());
app.use(express.json());
app.use(express.text());

// Ensure songs directory exists
try {
    await fs.access(SONGS_DIR);
} catch {
    await fs.mkdir(SONGS_DIR);
    console.log('Created songs directory');
}

// List songs with metadata
app.get('/api/songs', async (req, res) => {
    try {
        const files = await fs.readdir(SONGS_DIR);
        const songFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.pro', '.chopro', '.txt', '.chordpro'].includes(ext);
        });

        const songs = await Promise.all(songFiles.map(async (file) => {
            try {
                const content = await fs.readFile(path.join(SONGS_DIR, file), 'utf-8');
                // Simple regex to find {title: ...} or {t: ...}
                const match = content.match(/\{(?:title|t):\s*(.*?)\}/i);
                const title = match ? match[1].trim() : null;
                return {
                    filename: file,
                    title: title || file // Fallback to filename if no title
                };
            } catch (e) {
                return { filename: file, title: file };
            }
        }));

        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get song content
app.get('/api/songs/:filename', async (req, res) => {
    try {
        const filePath = path.join(SONGS_DIR, req.params.filename);
        const content = await fs.readFile(filePath, 'utf-8');
        res.send(content);
    } catch (err) {
        res.status(404).json({ error: 'File not found' });
    }
});

// Save song
app.post('/api/songs', async (req, res) => {
    try {
        const { filename, content } = req.body;
        if (!filename || !content) {
            return res.status(400).json({ error: 'Filename and content required' });
        }

        // Basic sanitization
        const safeFilename = path.basename(filename);
        const filePath = path.join(SONGS_DIR, safeFilename);

        await fs.writeFile(filePath, content, 'utf-8');
        res.json({ success: true, filename: safeFilename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
