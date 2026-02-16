const express = require('express');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { randomUUID } = require('crypto');
const authMiddleware = require('../middleware/auth');
const { bucket } = require('../config/firebase');

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Firebase Storage. Compatible with both local Express and Firebase Functions.
// @access  Private (Authenticated users)
router.post('/', authMiddleware.verifyToken, (req, res) => {
  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  const tmpdir = os.tmpdir();
  const fields = {};
  const uploads = {};
  let uploadError = null;

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  busboy.on('file', (fieldname, file, info) => {
    // We only expect a field named 'image' from our client
    if (fieldname !== 'image') {
        file.resume();
        return;
    }
    
    const { filename, mimeType } = info;

    const allowedMimeTypes = /jpeg|jpg|png|gif|webp/;
    if (!allowedMimeTypes.test(mimeType)) {
      uploadError = `Invalid file type: ${mimeType}. Only images are allowed.`;
      file.resume();
      return;
    }

    const uniqueFilename = `${randomUUID()}-${filename}`;
    const filepath = path.join(tmpdir, uniqueFilename);
    uploads[fieldname] = { filepath, mimeType };

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);

    file.on('limit', () => {
      uploadError = 'File size limit reached (5MB).';
      file.unpipe(writeStream);
      fs.unlink(filepath, () => {});
    });
  });

  busboy.on('finish', async () => {
    if (uploadError) {
      Object.values(uploads).forEach((fileInfo) => {
        if (fs.existsSync(fileInfo.filepath)) {
          fs.unlinkSync(fileInfo.filepath);
        }
      });
      return res.status(400).json({ error: uploadError });
    }

    const fileToWrite = uploads['image'];
    if (!fileToWrite) {
      return res.status(400).json({ error: 'No file uploaded or file was invalid.' });
    }

    const destinationPath = fields.path || 'general';
    const uniqueFilenameForStorage = `${randomUUID()}${path.extname(fileToWrite.filepath)}`;
    const gcsPath = `${destinationPath}/${uniqueFilenameForStorage}`;

    try {
      await bucket.upload(fileToWrite.filepath, {
        destination: gcsPath,
        metadata: {
          contentType: fileToWrite.mimeType,
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsPath}`;
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Firebase upload failed:', error);
      res.status(500).json({ error: 'Error uploading to Firebase Storage.' });
    } finally {
      if (fs.existsSync(fileToWrite.filepath)) {
        fs.unlinkSync(fileToWrite.filepath);
      }
    }
  });
  
  if (req.rawBody) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
});

// @route   DELETE /api/upload
// @desc    Delete an image from Firebase Storage using its URL
// @access  Private (Admin only)
router.delete('/', authMiddleware.verifyToken, authMiddleware.isAdmin, async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'File URL is required.' });
    }

    try {
        const urlParts = new URL(url);
        const gcsPath = urlParts.pathname.substring(1).replace(`${bucket.name}/`, '');

        if (!gcsPath) {
          throw new Error('Could not parse file path from URL.');
        }

        await bucket.file(gcsPath).delete();
        res.status(204).send();

    } catch (error) {
        if (error.code === 404) {
             console.warn(`Attempted to delete non-existent file from Firebase: ${url}`);
             return res.status(204).send(); // Still success if file doesn't exist
        }
        console.error('Error deleting file from Firebase:', error);
        return res.status(500).json({ error: 'Error deleting file.' });
    }
});

module.exports = router;
