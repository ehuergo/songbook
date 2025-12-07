/**
 * Storage Module
 * Uses Backend API to interact with files.
 */

const API_URL = 'http://localhost:3001/api';

export const Store = {
    /**
     * List all songs from the server.
     */
    async listSongs() {
        try {
            const response = await fetch(`${API_URL}/songs`);
            if (!response.ok) throw new Error('Failed to fetch songs');
            return await response.json();
        } catch (err) {
            console.error("Error listing songs:", err);
            alert("Error connecting to server. Is it running?");
            return [];
        }
    },

    /**
     * Read the content of a file.
     * @param {string} filename 
     */
    async readFile(filename) {
        try {
            const response = await fetch(`${API_URL}/songs/${encodeURIComponent(filename)}`);
            if (!response.ok) throw new Error('Failed to read file');
            return await response.text();
        } catch (err) {
            console.error("Error reading file:", err);
            return "";
        }
    },

    /**
     * Save content to a file.
     * @param {string} filename 
     * @param {string} content 
     */
    async saveFile(filename, content) {
        try {
            const response = await fetch(`${API_URL}/songs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filename, content })
            });
            if (!response.ok) throw new Error('Failed to save file');
            return true;
        } catch (err) {
            console.error("Error saving file:", err);
            return false;
        }
    },

    /**
     * Create a new file (same as saveFile for this API).
     */
    async createFile(filename, content) {
        // Ensure extension
        const validExts = ['.pro', '.chopro', '.txt', '.chordpro'];
        const hasExt = validExts.some(ext => filename.toLowerCase().endsWith(ext));
        if (!hasExt) filename += '.pro';

        return await this.saveFile(filename, content);
    },

    /**
     * Import text from file.
     * @param {File} file 
     */
    async importText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ success: true, text: e.target.result });
            reader.onerror = (e) => resolve({ success: false, error: "Failed to read file" });
            reader.readAsText(file);
        });
    }
};
