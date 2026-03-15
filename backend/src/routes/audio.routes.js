const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for audio files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav', 
    'audio/ogg', 'audio/webm', 'audio/aac', 
    'audio/m4a', 'audio/x-m4a'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload audio endpoint
router.post('/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const fileName = req.file.filename;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const audioUrl = `/audio/${fileName}`;

    res.json({
      fileName: fileName,
      audioUrl: audioUrl,
      message: 'Upload successful'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve audio files
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadDir, filename);
  
  // Security: prevent directory traversal
  if (!filepath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.sendFile(filepath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Audio file not found' });
    }
  });
});

// Delete audio file
router.delete('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(uploadDir, filename);
  
  // Security: prevent directory traversal
  if (!filepath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  fs.unlink(filepath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(500).json({ error: 'Delete failed' });
    }
    res.json({ message: 'File deleted successfully' });
  });
});

module.exports = router;