// A Node.js server to handle file uploads and video conversion.
const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

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

// --- FFmpeg Setup ---
const setupFFmpeg = async () => {
  // Use the FFmpeg binary from your repository regardless of environment
  const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg');
  
  // Make sure it's executable
  try {
    const { execSync } = require('child_process');
    execSync(`chmod +x ${ffmpegPath}`);
    console.log('Made FFmpeg executable');
    return ffmpegPath;
  } catch (error) {
    console.error('Error setting up FFmpeg:', error);
    // Fallback to global ffmpeg as last resort
    return 'ffmpeg';
  }
};

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
    
    // *** KEY CHANGE: Point to the local ffmpeg and shell script ***
    const ffmpegPath = await setupFFmpeg();
    const scriptPath = path.join(__dirname, 'convert-to-mp4_02.sh');

    console.log(`\n▶️  Received a request on /convert endpoint.`);
    console.log(`   - Input file: ${inputFile.path}`);
    console.log(`   - Output path: ${outputPath}`);
    console.log(`   - Bitrate: ${bitrate}`);
    console.log(`   - Executing conversion script...`);

    // We now pass the path to our local ffmpeg as the FIRST argument to the shell script
    const conversionProcess = spawn('sh', [scriptPath, ffmpegPath, inputFile.path, bitrate]);

    let scriptOutput = '';
    conversionProcess.stdout.on('data', (data) => {
        scriptOutput += data.toString();
    });
    
    conversionProcess.stderr.on('data', (data) => {
        console.error(`   - Script error (stderr): ${data.toString().trim()}`);
    });

    conversionProcess.on('close', (code) => {
        console.log(`   - Script output (stdout): \n--------------------------------------------------\n${scriptOutput.trim()}\n--------------------------------------------------`);
        if (code === 0) {
            console.log(`✅ Conversion successful. Sending file back to user.`);
            res.download(outputPath, outputFileName, (err) => {
                if (err) {
                    console.error('❌ Error sending file to user:', err);
                }
                // Cleanup both the original upload and the converted file
                fs.unlink(inputFile.path, (err) => err && console.error('Cleanup error (upload):', err));
                fs.unlink(outputPath, (err) => err && console.error('Cleanup error (converted):', err));
            });
        } else {
            console.error(`❌ Conversion failed with exit code ${code}.`);
            fs.unlink(inputFile.path, (err) => err && console.error('Cleanup error (failed upload):', err));
            res.status(500).send('Conversion failed.');
        }
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`\n🎉 SUCCESS: Backend server is running on port ${PORT}`);
});

