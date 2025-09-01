console.log("Server script starting...");

const express = require('express');
console.log("-> Express module loaded.");
const multer = require('multer');
console.log("-> Multer module loaded.");
const { exec } = require('child_process');
console.log("-> Child Process module loaded.");
const cors = require('cors');
console.log("-> CORS module loaded.");
const fs = require('fs');
console.log("-> File System (fs) module loaded.");
const path = require('path');
console.log("-> Path module loaded.");

const app = express();
const port = 3000;

console.log("\nChecking for 'uploads' and 'converted' directories...");
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('converted')) fs.mkdirSync('converted');
console.log("-> Directories checked/created successfully.");


app.use(cors());
console.log("-> CORS middleware enabled.");

const upload = multer({ dest: 'uploads/' });
console.log("-> Multer configured for uploads.");


app.post('/convert', upload.single('videoFile'), (req, res) => {
    console.log("\n✅ Received a request on /convert endpoint.");
    // Check if a file was actually uploaded
    if (!req.file) {
        console.error("❌ No file was uploaded with the request.");
        return res.status(400).send('No file uploaded.');
    }

    const inputFile = req.file;
    const bitrate = req.body.bitrate || '30'; // Use bitrate from request, or default to 30
    // Use a relative path to make the project self-contained
    const scriptPath = path.join(__dirname, 'convert-to-mp4_02.sh');
    
    // Define a user-friendly name for the downloaded file, keeping the original name
    const outputFileName = `${path.basename(inputFile.originalname, path.extname(inputFile.originalname))}.mp4`;
    const outputPath_ignored = path.join('converted', outputFileName); // This path is ignored by the script, but we pass it for consistency.

    console.log(`   - Input file: ${inputFile.originalname} (temp path: ${inputFile.path})`);
    console.log(`   - Bitrate: ${bitrate}`);
    console.log(`   - Script path: ${scriptPath}`);
    console.log("   - Executing conversion script...");

    const command = `sh "${scriptPath}" "${inputFile.path}" "${outputPath_ignored}" "${bitrate}"`;
    
    exec(command, (error, stdout, stderr) => {
        // Based on your log, the actual output path is the input path with .mp4 appended.
        const actualOutputPath = `${inputFile.path}.mp4`;

        if (error) {
            console.error(`❌ Script execution error: ${error.message}`);
            console.error(`   - stderr: ${stderr}`);
            fs.unlinkSync(inputFile.path); // Clean up original upload
            return res.status(500).send(`Conversion script failed: ${stderr}`);
        }

        // Verify that the converted file actually exists where we expect it
        if (!fs.existsSync(actualOutputPath)) {
            console.error(`❌ Conversion failed: Output file not found at ${actualOutputPath}`);
            console.error(`   - This usually means the shell script failed silently.`);
            console.error(`   - stderr: ${stderr}`);
            fs.unlinkSync(inputFile.path); // Clean up original upload
            return res.status(500).send('Conversion failed: Output file not created.');
        }

        console.log(`   - Script output (stdout): ${stdout}`);
        console.log(`✅ Conversion successful. Found output at: ${actualOutputPath}. Sending file back to user.`);
        
        // Send the correctly located file back to the browser for download
        res.download(actualOutputPath, outputFileName, (err) => {
            if (err) {
                console.error('❌ Error sending file to user:', err);
            }
            // After attempting to send, clean up BOTH the original upload and the converted file
            console.log("✅ Cleaning up temporary files...");
            fs.unlinkSync(inputFile.path);
            fs.unlinkSync(actualOutputPath);
            console.log("✅ Cleanup complete.");
        });
    });
});

console.log(`\nAttempting to listen on port ${port}...`);

// Start the server and add error handling for the listener
app.listen(port, () => {
    console.log(`\n✅ SUCCESS: Backend server is running at http://localhost:${port}`);
    console.log("   Waiting for files to convert...");
}).on('error', (err) => {
    console.error("\n❌ FAILED TO START SERVER:", err);
    if (err.code === 'EADDRINUSE') {
        console.error(`   Error: Port ${port} is already in use by another application.`);
    }
});
