/**
 * upload.middleware.js
 * Multer configuration for handling file uploads (PDF and Images).
 * Files are stored temporarily in the /uploads folder.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --------------------------------------------------
// Create the uploads directory if it doesn't exist
// --------------------------------------------------
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --------------------------------------------------
// Storage configuration — files saved to disk
// --------------------------------------------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename: userId_timestamp_originalname
        const userId = req.user ? req.user._id : "unknown";
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const safeName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 30);

        cb(null, `${userId}_${timestamp}_${safeName}${ext}`);
    },
});

// --------------------------------------------------
// File type filter — only allow PDFs and images
// --------------------------------------------------
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(
            new Error("Invalid file type. Only PDF, JPEG, PNG, and WEBP files are allowed."),
            false
        );
    }
};

// --------------------------------------------------
// Multer instance — max file size: 10MB
// --------------------------------------------------
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

module.exports = upload;
