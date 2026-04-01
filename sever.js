const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas securely
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)

// Database Schema for Downloads
const DownloadSchema = new mongoose.Schema({
    title: String,
    videoId: String,
    downloadedAt: { type: Date, default: Date.now }
});
const VideoModel = mongoose.model('Video', DownloadSchema);

// The Download API
app.get('/api/download', async (req, res) => {
    const videoId = req.query.id;
    const title = req.query.title || 'video';

    if (!videoId) return res.status(400).send("No video ID provided");

    try {
        // Save to MongoDB
        await VideoModel.create({ title: title, videoId: videoId });

        // Format the file name and tell the browser to download it
        const safeTitle = title.replace(/[^\w\s]/gi, '');
        res.header('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Stream from YouTube directly to the response
        ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
            quality: 'highest',
            filter: 'audioandvideo'
        }).pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing video");
    }
});

// API to fetch MongoDB History
app.get('/api/history', async (req, res) => {
    try {
        const history = await VideoModel.find().sort({ downloadedAt: -1 }).limit(50);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// Health check route for Render
app.get('/', (req, res) => res.send("Videmate Backend is Live!"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
