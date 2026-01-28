// Simple WebDAV-like HTTP file server for media streaming
// This runs inside Electron and serves library files over HTTP

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

class MediaServer {
  constructor() {
    this.server = null;
    this.port = 8765;
    this.libraryPaths = new Map(); // mediaId -> filePath mapping
  }

  // Start the media server
  start(port = 8765) {
    if (this.server) {
      console.log('Media server already running');
      return this.getServerUrl();
    }

    this.port = port;
    
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`Media server started on port ${this.port}`);
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${this.port} in use, trying ${this.port + 1}`);
        this.start(this.port + 1);
      } else {
        console.error('Media server error:', err);
      }
    });

    return this.getServerUrl();
  }

  // Stop the media server
  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('Media server stopped');
    }
  }

  // Get the server URL
  getServerUrl() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    // Find local IP address
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
    }

    return `http://${localIp}:${this.port}`;
  }

  // Update library paths
  updateLibrary(library) {
    this.libraryPaths.clear();
    library.forEach(item => {
      // Use a simple key: mediaType-mediaId
      const key = `${item.mediaType}-${item.mediaId}`;
      this.libraryPaths.set(key, item.filePath);
    });
    console.log(`Media server library updated: ${this.libraryPaths.size} items`);
  }

  // Handle incoming requests
  handleRequest(req, res) {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // Route: /media/:mediaType-:mediaId
    if (pathname.startsWith('/media/')) {
      const key = pathname.replace('/media/', '');
      const filePath = this.libraryPaths.get(key);

      if (filePath && fs.existsSync(filePath)) {
        this.streamFile(req, res, filePath);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
      return;
    }

    // Route: /stream?path=<encoded_path>
    if (pathname === '/stream') {
      const filePath = url.searchParams.get('path');
      if (filePath && fs.existsSync(filePath)) {
        this.streamFile(req, res, filePath);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
      return;
    }

    // Route: /library - list available media
    if (pathname === '/library') {
      const library = [];
      this.libraryPaths.forEach((filePath, key) => {
        const [mediaType, mediaId] = key.split('-');
        library.push({
          mediaType,
          mediaId: parseInt(mediaId),
          streamUrl: `${this.getServerUrl()}/media/${key}`,
        });
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(library));
      return;
    }

    // Default: 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }

  // Stream a file with range support (for video seeking)
  streamFile(req, res, filePath) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.m4v': 'video/x-m4v',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Full file request
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });

      fs.createReadStream(filePath).pipe(res);
    }
  }
}

module.exports = MediaServer;
