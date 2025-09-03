# Start with Node.js base image
FROM node:18

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create uploads directory (if not already created by the server.js)
RUN mkdir -p uploads && chmod 777 uploads

# Create bin directory for ffmpeg (if it doesn't exist)
RUN mkdir -p bin

# If using the installed ffmpeg, create a symlink to the bin directory
RUN which ffmpeg > /dev/null && ln -sf $(which ffmpeg) ./bin/ffmpeg || echo "FFmpeg not found"

# Make shell script executable
RUN chmod +x convert-to-mp4_02.sh

# Expose the port that matches the server.js default
EXPOSE 3000

# Environment variable for the port
ENV PORT=3000

# Command to run the Express server
CMD ["node", "server.js"]