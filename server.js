// A Node.js server to handle file uploads and video conversion.
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg'); // New FFmpeg library

console.log('✅ Modules loaded. Initializing application...');

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3000; // Use Render's port or default to 3000

// --- Create necessary directories if they don't exist ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

console.log('✅ Directories ensured.');

// --- Middleware Setup ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
const upload = multer({ dest: uploadsDir });

console.log('✅ Middleware configured.');

// --- API Endpoint for Conversion ---
app.post('/convert', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputFile = req.file;
    const bitrate = req.body.bitrate || '30'; // Default bitrate
    const originalName = path.parse(inputFile.originalname).name;
    const outputFileName = `${originalName}.mp4`;
    const outputPath = path.join(uploadsDir, outputFileName);
    
    console.log(`\n▶️  Received a request on /convert endpoint.`);
    console.log(`   - Input file: ${inputFile.path}`);
    console.log(`   - Output path: ${outputPath}`);
    console.log(`   - Bitrate: ${bitrate}`);
    console.log(`   - Starting conversion...`);

    // Using fluent-ffmpeg instead of shell script
    ffmpeg(inputFile.path)
        .output(outputPath)
        .videoBitrate(bitrate)
        .on('start', (commandLine) => {
            console.log(`   - FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
            console.log(`   - Processing: ${progress.percent ? progress.percent.toFixed(1) : '?'}% done`);
        })
        .on('error', (err) => {
            console.error(`❌ Conversion error: ${err.message}`);
            fs.unlink(inputFile.path, (cleanupErr) => cleanupErr && console.error('Cleanup error (failed upload):', cleanupErr));
            res.status(500).send('Conversion failed.');
        })
        .on('end', () => {
            console.log(`✅ Conversion successful. Sending file back to user.`);
            
            // Add proper Content-Type header for better browser handling
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
            
            // Stream the file instead of using res.download
            const fileStream = fs.createReadStream(outputPath);
            fileStream.pipe(res);
            
            // Clean up files after streaming is complete
            fileStream.on('end', () => {
                fs.unlink(inputFile.path, (cleanupErr) => cleanupErr && console.error('Cleanup error (upload):', cleanupErr));
                fs.unlink(outputPath, (cleanupErr) => cleanupErr && console.error('Cleanup error (converted):', cleanupErr));
            });
        })
        .run();
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`\n🎉 SUCCESS: Backend server is running on port ${PORT}`);
});