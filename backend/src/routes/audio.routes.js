const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// ─── Vercel serverless: filesystem read-only → dùng memoryStorage ─────────
const IS_VERCEL = !!process.env.VERCEL;

let upload;
let uploadDir;

if (IS_VERCEL) {
  // Trên Vercel: lưu vào memory (không ghi disk)
  // Lưu ý: file sẽ mất sau mỗi request — cần dùng cloud storage (S3/Cloudinary)
  // cho production thực sự. Đây là fix tạm để app không crash.
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: audioFileFilter,
  });
} else {
  // Local dev: lưu vào disk như cũ
  uploadDir = path.join(__dirname, '../../uploads/audio');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create upload dir:', e.message);
  }

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, uniqueSuffix + ext);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: audioFileFilter,
  });
}

function audioFileFilter(req, file, cb) {
  const allowedTypes = [
    'audio/mpeg', 'audio/mp3', 'audio/wav',
    'audio/ogg', 'audio/webm', 'audio/aac',
    'audio/m4a', 'audio/x-m4a',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────
router.post('/upload', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    if (IS_VERCEL) {
      // Vercel: không có persistent storage — trả về thông báo
      return res.status(501).json({
        error: 'Audio upload to local disk is not supported on Vercel. Please configure cloud storage (S3/Cloudinary).',
      });
    }

    const fileName = req.file.filename;
    const audioUrl = `/audio/${fileName}`;
    res.json({ fileName, audioUrl, message: 'Upload successful' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── Serve audio (chỉ hoạt động local) ───────────────────────────────────────
router.get('/:filename', (req, res) => {
  if (IS_VERCEL) {
    return res.status(501).json({ error: 'File serving not supported on Vercel' });
  }

  const filename = req.params.filename;
  const filepath = path.join(uploadDir, filename);

  if (!filepath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.sendFile(filepath, (err) => {
    if (err) res.status(404).json({ error: 'Audio file not found' });
  });
});

// ─── Delete audio (chỉ hoạt động local) ──────────────────────────────────────
router.delete('/:filename', (req, res) => {
  if (IS_VERCEL) {
    return res.status(200).json({ message: 'File deleted (no-op on Vercel)' });
  }

  const filename = req.params.filename;
  const filepath = path.join(uploadDir, filename);

  if (!filepath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  fs.unlink(filepath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
      return res.status(500).json({ error: 'Delete failed' });
    }
    res.json({ message: 'File deleted successfully' });
  });
});

module.exports = router;