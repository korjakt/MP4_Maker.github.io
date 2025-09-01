// A Node.js script to start the backend server and launch the frontend HTML file.
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting application...');

// --- Configuration ---
const serverFile = 'server.js';
const frontendFile = 'MP4_03.html'; // Make sure this is the correct name of your HTML file
const successMessage = 'SUCCESS: Backend server is running';

const htmlFilePath = path.join(__dirname, frontendFile);
let isBrowserOpened = false;

// --- Start the Backend Server ---
// We use 'spawn' instead of 'exec' to get a continuous stream of output.
// 'node' is the command, and [serverFile] is its argument.
const serverProcess = spawn('node', [serverFile]);

console.log(`\nAttempting to start backend server from "${serverFile}"...`);

// --- Listen for Server Output (stdout) ---
// This is how we know if the server started successfully.
serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Server Log]: ${output.trim()}`);

    // Check if the output contains our success message and if we haven't opened the browser yet.
    if (output.includes(successMessage) && !isBrowserOpened) {
        isBrowserOpened = true;
        console.log('\n✅ Server is running. Launching frontend...');
        
        // Open the HTML file in the default browser using a dynamic import for the 'open' package.
        import('open').then(({ default: open }) => {
            open(htmlFilePath).catch(err => {
                console.error('❌ ERROR: Could not open the HTML file.', err);
                console.error(`   Please manually open this file in your browser: ${htmlFilePath}`);
            });
        }).catch(err => {
            console.error('❌ FATAL: Could not dynamically import the "open" package.', err);
        });
    }
});

// --- Listen for Server Errors (stderr) ---
// This will "alert" you to any errors the server reports.
serverProcess.stderr.on('data', (data) => {
    const errorOutput = data.toString();
    console.error(`❌ [SERVER ERROR]: ${errorOutput.trim()}`);
});

// --- Handle Server Exit ---
// This will "alert" you if the server process crashes unexpectedly.
serverProcess.on('close', (code) => {
    if (code !== 0 && !isBrowserOpened) {
        console.error(`\n❌ CRITICAL: The server process failed to start and exited with code ${code}.`);
        console.error('   Please check the [SERVER ERROR] messages above for details.');
    } else if (code !== 0) {
        console.error(`\n❗️ The server process has stopped unexpectedly with code ${code}.`);
    } else {
        console.log('\nServer process has stopped.');
    }
});

// --- Handle Launcher Script Errors ---
serverProcess.on('error', (err) => {
    console.error('❌ FATAL: Failed to start the server process itself.', err);
    console.error('   Please ensure Node.js is installed correctly and the file paths are correct.');
});
