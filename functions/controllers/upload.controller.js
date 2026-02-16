const { bucket } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const blob = bucket.file(`uploads/${uuidv4()}-${req.file.originalname}`);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    blobStream.on('error', (err) => {
        console.error('Blob stream error:', err);
        res.status(500).json({ error: 'Could not upload the file.' });
    });

    blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(200).json({ url: publicUrl });
    });

    blobStream.end(req.file.buffer);
};

module.exports = {
    uploadFile,
};
