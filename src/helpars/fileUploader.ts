import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ✅ Use project root reliably
const uploadPath = path.join(process.cwd(), 'uploads');

// Create the upload folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Allowed file extensions for upload
const allowedExtensions = [
  '.pdf',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Save in the "uploads" folder
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // Get extension
    let baseName = path.basename(file.originalname, ext); // Remove extension
    baseName = baseName.replace(/\s+/g, '-'); // Replace spaces with hyphens

    let finalName = `${baseName}${ext}`;
    let counter = 1;

    while (fs.existsSync(path.join(uploadPath, finalName))) {
      finalName = `${baseName}-${counter}${ext}`;
      counter++;
    }

    cb(null, finalName);
  },
});

// File filter to restrict allowed file types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true); // File type is allowed
  } else {
    cb(new Error(`Invalid file type: ${ext}`)); // Reject if file type is not allowed
  }
};

// Multer configuration
const upload = multer({
  dest: uploadPath, // Temporary file storage path
  storage, // Use custom storage configuration
  fileFilter, // Apply file filter for type validation
  limits: { fileSize: MAX_FILE_SIZE }, // Set file size limit
});

export const uploadSingle = upload.single('file'); // For handling single file upload
export const uploadMultiple = upload.array('files', 10); // For handling multiple file uploads
export default upload; // Default export of the upload instance
