const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const uploadController = require('../controllers/upload.controller');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', authMiddleware.verifyToken, upload.single('file'), uploadController.uploadFile);

module.exports = router;
