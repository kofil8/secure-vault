<<<<<<< Updated upstream
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/events/'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const profile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/profile/'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const eventUpload = multer({ storage: eventStorage });
const uploadprofile = multer({ storage: profile });

const uploadprofileImage = uploadprofile.single('profileImage');
const uploadEventImage = eventUpload.single('eventImage');
const uploadPostImage = upload.single('postImage');

export const fileUploader = {
  upload,
  uploadprofileImage,
  uploadEventImage,
  uploadPostImage,
=======
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

// ✅ Allowed extensions
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

// ✅ Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ✅ Memory storage (use diskStorage if you want files on server)
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${ext}. Only ${allowedExtensions.join(', ')} allowed.`,
      ),
    );
  }
>>>>>>> Stashed changes
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ✅ Exports for single and multiple usage
export const uploadSingle = upload.single('file'); // Accepts a single file
export const uploadMultiple = upload.array('files', 10); // Accepts up to 10 files
export default upload;
