const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists (ephemeral local temp before Cloudinary upload)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    try { fs.mkdirSync(uploadDir); } catch (e) { /* ignore */ }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename to avoid collisions
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

// Allowed mime types (extend as needed). We still allow generic image/video/audio via prefix checks below.
const allowedExplicit = new Set([
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
]);

function fileFilter(req, file, cb) {
    const { mimetype } = file;
    if (
        mimetype.startsWith('image/') ||
        mimetype.startsWith('video/') ||
        mimetype.startsWith('audio/') ||
        allowedExplicit.has(mimetype)
    ) {
        return cb(null, true);
    }
    return cb(new Error('Unsupported file type'), false);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;