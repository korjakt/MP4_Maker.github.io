# Browser-based MP4 Converter

This is a browser-based MP4 converter using FFmpeg.wasm that runs entirely client-side. No server is required for the conversion process itself, as all processing happens in the user's browser.

## Features

- Convert any video format to MP4 format
- Custom audio bitrate settings
- 100% client-side processing (files never leave your browser)
- Progress bar for conversion status

## Important: CORS and SharedArrayBuffer Requirements

FFmpeg.wasm requires [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer), which has specific security requirements:

1. The page must be served with these HTTP headers:
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

2. GitHub Pages does not support custom HTTP headers, so this app won't work properly when hosted there.

## Deployment Options

### Option 1: Run Locally

```bash
# Install a simple HTTP server
npm install -g http-server

# Run with proper CORS headers
http-server --cors '*' -p 8080

# Open in your browser
open http://localhost:8080
```

### Option 2: Deploy to Netlify or Vercel

This repository includes a `netlify.toml` file that sets the required headers for Netlify. Simply push to GitHub and connect to Netlify for automatic deployment with the correct headers.

For Vercel, create a `vercel.json` file with:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

## Technologies Used

- FFmpeg.wasm - WebAssembly version of FFmpeg
- HTML5 File API
- Modern JavaScript (async/await)
