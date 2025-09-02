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
        document.getElementById('conversionStatus').textContent = 'Converting... This may take a while depending on the file size.';
        document.getElementById('progressBar').style.display = 'block';
        
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
    const { createFFmpeg, fetchFile } = FFmpeg;
    
    // Create and load ffmpeg instance with progress handler
    const ffmpeg = createFFmpeg({ 
        log: true,
        progress: ({ ratio }) => {
            const percent = Math.round(ratio * 100);
            document.getElementById('progressBarFill').style.width = percent + '%';
            document.getElementById('progressBarFill').textContent = percent + '%';
        }
    });
    
    await ffmpeg.load();
    
    // Get the file data
    const inputName = 'input_video';
    const outputName = 'output.mp4';
    ffmpeg.FS('writeFile', inputName, await fetchFile(file));
    
    // Run conversion with the specified bitrate
    await ffmpeg.run(
        '-i', inputName, 
        '-c:v', 'libx264', 
        '-crf', '23', 
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', `${bitrate}k`,
        '-movflags', '+faststart',
        outputName
    );
    
    // Get the output file data
    const data = ffmpeg.FS('readFile', outputName);
    
    // Create a download URL
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    // Clean up
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
    
    return url;
}
