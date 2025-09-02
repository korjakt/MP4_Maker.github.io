#!/bin/bash

# The FIRST argument ($1) is now the path to the ffmpeg executable.
# The SECOND argument ($2) is the input file path.
# The THIRD argument ($3) is the target bitrate in Mb.

ffmpeg_executable="$1"
input_file="$2"
target_bitrate_mb=${3:-30} # Default to 30 if not provided
output_file="${input_file}.mp4"

echo "--------------------------------------------------"
echo "Input:    $input_file"
echo "Output:   $output_file"
echo "Bitrate:  ${target_bitrate_mb}M"
echo "FFmpeg:   $ffmpeg_executable"
echo "--------------------------------------------------"

# Execute ffmpeg using the provided path
"$ffmpeg_executable" -i "$input_file" -c:v libx264 -b:v "${target_bitrate_mb}M" -preset medium -c:a aac -b:a 128k -movflags +faststart -y "$output_file"

if [ $? -eq 0 ]; then
    echo "✅ Successfully converted '$input_file'"
else
    echo "❌ Conversion failed for '$input_file'" >&2
    exit 1
fi