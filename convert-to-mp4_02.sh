#!/bin/bash
# filepath: convert-to-mp4_02.sh

# Parameters:
# $1 - FFmpeg path (can be just "ffmpeg" for global install on Render)
# $2 - Input file path
# $3 - Bitrate (optional, defaults to 1M)

# Exit on any error
set -e

# Log function for debugging
log_message() {
  echo "[MP4 Converter] $1"
}

# Check if we have required parameters
if [ -z "$2" ]; then
  log_message "Error: Missing parameters. Usage: $0 <ffmpeg_path> <input_file> [bitrate]"
  exit 1
fi

# Setup variables
FFMPEG_PATH="$1"
INPUT_FILE="$2"
BITRATE="${3:-1M}"  # Default to 1M if not specified
FILENAME=$(basename "$INPUT_FILE")
FILENAME_NO_EXT="${FILENAME%.*}"
OUTPUT_DIR=$(dirname "$INPUT_FILE")
OUTPUT_FILE="$OUTPUT_DIR/${FILENAME_NO_EXT}_converted.mp4"

# Log settings for debugging
log_message "FFmpeg path: $FFMPEG_PATH"
log_message "Input file: $INPUT_FILE"
log_message "Output file: $OUTPUT_FILE"
log_message "Bitrate: $BITRATE"

# Verify FFmpeg works
if ! command -v "$FFMPEG_PATH" &> /dev/null && [ "$FFMPEG_PATH" != "ffmpeg" ]; then
  # Try global ffmpeg as fallback (for Render environment)
  log_message "FFmpeg not found at specified path, trying global ffmpeg..."
  FFMPEG_PATH="ffmpeg"
  
  if ! command -v "$FFMPEG_PATH" &> /dev/null; then
    log_message "Error: FFmpeg not found. Please ensure FFmpeg is installed."
    exit 1
  fi
fi

log_message "Using FFmpeg at: $FFMPEG_PATH"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
  log_message "Error: Input file not found: $INPUT_FILE"
  exit 1
fi

# Create temporary directory for render environments
TEMP_DIR="${OUTPUT_DIR}/temp_$(date +%s)"
mkdir -p "$TEMP_DIR"

log_message "Starting conversion..."

# Run FFmpeg conversion
"$FFMPEG_PATH" -i "$INPUT_FILE" -c:v libx264 -preset slow -b:v "$BITRATE" -pass 1 -f mp4 -y /dev/null 2> "$TEMP_DIR/ffmpeg_log_pass1.txt"
"$FFMPEG_PATH" -i "$INPUT_FILE" -c:v libx264 -preset slow -b:v "$BITRATE" -pass 2 -c:a aac -b:a 128k "$OUTPUT_FILE" 2> "$TEMP_DIR/ffmpeg_log_pass2.txt"

# Check if conversion was successful
if [ -f "$OUTPUT_FILE" ]; then
  log_message "Conversion successful: $OUTPUT_FILE"
  
  # Get file size
  OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
  log_message "Output file size: $OUTPUT_SIZE"
  
  # Cleanup temp directory
  rm -rf "$TEMP_DIR"
  
  # Return the output file path
  echo "$OUTPUT_FILE"
  exit 0
else
  log_message "Error: Conversion failed. Check logs in $TEMP_DIR"
  exit 1
fi