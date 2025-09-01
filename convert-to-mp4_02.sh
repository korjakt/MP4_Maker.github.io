#!/bin/bash
# =============================================================================
#
# A macOS script to convert video files to H.264 MP4 using ffmpeg.
#
# This script will take one or more video files as input and convert them
# into MP4 files with the H.264 video codec and AAC audio codec. These
# settings provide excellent quality and compatibility across devices.
#
# Author: Gemini
# Version: 1.0
#
# =============================================================================

# --- PRE-REQUISITES CHECK ---
# Check if ffmpeg is installed on the system.
#if ! command -v ffmpeg &> /dev/null
#then
    #echo "Error: ffmpeg is not installed or not in your PATH." >&2
    #echo "Please install it to use this script." >&2
    #echo "On macOS with Homebrew, you can run: brew install ffmpeg" >&2
    #exit 1
#fi

# --- USAGE CHECK / INTERACTIVE INPUT ---
# Check if at least one file path has been provided as an argument.
if [ "$#" -eq 0 ]; then
    echo "No input files provided as arguments."
    echo "Please select a video file using the Finder dialog..."
    input_file=$(osascript -e 'POSIX path of (choose file with prompt "Select a video file to convert:")')
    if [ -z "$input_file" ]; then
        echo "No file selected. Exiting." >&2
        exit 1
    fi
    set -- "$input_file"
fi

# --- CONVERSION LOOP ---
# Loop through every file provided as an argument to the script.
for input_file in "$@"; do

    # Check if the provided argument is actually a file.
    if [ ! -f "$input_file" ]; then
        echo "Warning: Input file not found: '$input_file'. Skipping."
        continue
    fi

    # Define the output filename.
    # It takes the original filename without its extension and appends .mp4
    # Example: "My Vacation.mov" becomes "My Vacation.mp4"
    output_file="${input_file%.*}.mp4"

    # Display conversion information to the user.
    echo "--------------------------------------------------"
    echo "Input:    $input_file"
    echo "Output:   $output_file"
    echo "--------------------------------------------------"

    # Execute the ffmpeg command with recommended settings for quality and compatibility.
    #
    # -i "$input_file"    : Specifies the input file. Quoted to handle spaces.
    # -c:v libx264        : Sets the video codec to H.264. Widely compatible.
    # -crf 23             : Constant Rate Factor. A good balance between quality and file size.
    #                       (Lower is higher quality, 18-28 is a sane range).
    # -preset medium      : A balance between encoding speed and compression efficiency.
    # -c:a aac            : Sets the audio codec to AAC. Standard for MP4.
    # -b:a 128k           : Sets the audio bitrate to 128 kbps. Good for stereo audio.
    # -movflags +faststart: Moves metadata to the start of the file, which helps when
    #                       streaming the video over the web.
    # -y                  : Overwrite output file without asking.
    # "$output_file"      : Specifies the output file. Quoted to handle spaces.
    
    #ffmpeg  -i "$input_file" -c:v libx264 -crf 30 -preset medium -c:a aac -b:a 128k -movflags +faststart -y "$output_file"

    # The third argument ($3) is the target bitrate in Mb. Default to 30 if not provided.
    target_bitrate_mb=${3:-30}

    # The ffmpeg -b:v flag expects a unit, like 'M' for Megabits.
    ffmpeg  -i "$input_file" -c:v libx264 -b:v "${target_bitrate_mb}M" -preset medium -c:a aac -b:a 128k -movflags +faststart -y "$output_file"

    # Check the exit code of the ffmpeg command to see if it succeeded.
    if [ $? -eq 0 ]; then
        echo "✅ Successfully converted '$input_file'"
    else
        echo "❌ Error converting '$input_file'. Please check the ffmpeg output above for details." >&2
    fi
    echo "" # Add a blank line for readability between conversions.
done

echo "All conversion tasks are complete."

