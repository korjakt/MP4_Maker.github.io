// Create a simple loading animation/indicator
function showLoading(message) {
    document.getElementById('conversionStatus').textContent = message || 'Loading...';
    document.getElementById('progressBar').style.display = 'block';
    document.getElementById('progressBarFill').style.width = '10%';
    document.getElementById('progressBarFill').textContent = 'Loading...';
}

async function startConversion() {
    const fileInput = document.getElementById('videoFile');
    const bitrateInput = document.getElementById('bitrate');
    
    if (!fileInput.files.length) {
        alert('Please select a file first');
        return;
    }
    
    const file = fileInput.files[0];
    const bitrate = bitrateInput.value;
    
    await realConversion(file, bitrate);
}

async function realConversion(file, bitrate) {
    try {
        // Show loading state
        showLoading('Starting conversion...');
        
        // Convert using FFmpeg.wasm
        const downloadUrl = await convertWithFFmpegWasm(file, bitrate);
        
        // Update UI for success
        document.getElementById('conversionStatus').textContent = 'Conversion complete!';
        document.getElementById('progressBar').style.display = 'none';
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = file.name.replace(/\.[^/.]+$/, "") + ".mp4";
        downloadLink.innerHTML = 'Download Converted MP4';
        downloadLink.className = 'download-button';
        
        // Add download button to page
        const downloadContainer = document.getElementById('downloadContainer');
        downloadContainer.innerHTML = '';
        downloadContainer.appendChild(downloadLink);
        
        return true;
    } catch (error) {
        // Handle errors
        console.error('Conversion failed:', error);
        document.getElementById('conversionStatus').textContent = 'Conversion failed: ' + error.message;
        document.getElementById('progressBar').style.display = 'none';
        return false;
    }
}

async function convertWithFFmpegWasm(file, bitrate) {
    // Make sure FFmpeg is defined
    if (typeof FFmpeg === 'undefined') {
        throw new Error('FFmpeg.wasm is not loaded. Please check your internet connection and try again.');
    }
    
    const { createFFmpeg, fetchFile } = FFmpeg;
    
    showLoading('Loading FFmpeg.wasm core...');
    
    // Create FFmpeg instance with more reliable settings
    const ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        progress: ({ ratio }) => {
            if (ratio && ratio > 0) {
                const percent = Math.round(ratio * 100);
                document.getElementById('progressBarFill').style.width = percent + '%';
                document.getElementById('progressBarFill').textContent = percent + '%';
            }
        }
    });
    
    try {
        // Load FFmpeg core
        await ffmpeg.load();
        showLoading('Processing video...');
        
        // Get the file extension
        const fileExt = file.name.split('.').pop().toLowerCase();
        const inputName = `input.${fileExt}`;
        const outputName = 'output.mp4';
        
        // Write file to FFmpeg virtual filesystem
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));
        
        // Run FFmpeg command with proper parameters for MP4 conversion
        await ffmpeg.run(
            '-i', inputName,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            '-b:a', `${bitrate}k`,
            '-movflags', '+faststart',
            outputName
        );
        
        // Read the result
        const data = ffmpeg.FS('readFile', outputName);
        
        // Create a download URL
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        // Clean up
        try {
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);
        } catch (e) {
            console.warn('Failed to clean up FFmpeg filesystem:', e);
        }
        
        return url;
    } catch (error) {
        console.error("FFmpeg processing error:", error);
        throw new Error('Video processing failed. Please try a different file or check your browser compatibility.');
    }
}
