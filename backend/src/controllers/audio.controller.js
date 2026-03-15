exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = `${req.protocol}://${req.get("host")}/audio/${req.file.filename}`;

    res.json({
      audioUrl: url,
      fileName: req.file.filename,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
};