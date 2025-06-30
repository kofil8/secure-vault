import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Request, Response } from 'express';
import fsSync from 'fs';
import fs from 'fs/promises';
import httpStatus from 'http-status';
import path from 'path';
import config from '../../../config';
import {
  generateBlankDocx,
  generateBlankPdf,
  generateBlankXlsx,
} from '../../../helpars/fileGenerator';
import { googleDocsService } from './googleDocsService';
import { googleSheetsService } from './googleSheetsService';
import ApiError from '../../errors/ApiError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { fileService } from './file.service';
import { OAuth2Client } from 'google-auth-library';
const prisma = new PrismaClient();

// Create a file (either single or multiple files)
const createFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const uploadedFiles: Express.Multer.File[] = [];

  // Handle file fields uploaded in the request
  const filesField = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;

  // Collect files from request
  if (filesField) {
    if (Array.isArray(filesField['file']))
      uploadedFiles.push(...filesField['file']);
    if (Array.isArray(filesField['files']))
      uploadedFiles.push(...filesField['files']);
  }

  // If more than 1 file is uploaded, create multiple file records
  if (uploadedFiles.length > 1) {
    const files = uploadedFiles.map((file) => {
      const ext = path.extname(file.originalname); // Get the file's original extension
      return {
        fileName: file.originalname, // Save the original file name
        fileType: getFileType(file.mimetype), // Use updated file type function
        fileSize: file.size,
        fileUrl: `${config.backend_file_url}/uploads/${file.filename}`,
        filePath: file.path,
        version: 1,
        user: { connect: { id: userId } },
      };
    });

    try {
      const result = await fileService.createMultipleFiles(files);
      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Multiple files uploaded successfully',
        data: result,
      });
    } catch (err) {
      await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            await fs.unlink(file.path); // Clean up if an error occurs
          } catch (_) {
            console.warn(`Failed to delete file ${file.path}`);
          }
        }),
      );
      throw err;
    }
  }

  // If only one file is uploaded, create a single file record
  if (uploadedFiles.length === 1) {
    const file = uploadedFiles[0];
    const ext = path.extname(file.originalname); // Get the file's original extension
    const payload = {
      fileName: file.originalname, // Save the original file name
      fileType: getFileType(file.mimetype), // Use updated file type function
      fileSize: file.size,
      fileUrl: `${config.backend_file_url}/uploads/${file.filename}`,
      filePath: file.path,
      version: 1,
      user: { connect: { id: userId } },
    };

    try {
      const result = await fileService.createFile(payload);
      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'File uploaded successfully',
        data: result,
      });
    } catch (err) {
      try {
        await fs.unlink(file.path); // Clean up on error
      } catch (_) {
        console.warn(`Failed to delete file ${file.path}`);
      }
      throw err;
    }
  }

  throw new Error('No file uploaded');
});

// Helper function to determine file type based on MIME type
const getFileType = (mimeType: string) => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('msword') || mimeType.includes('wordprocessingml'))
    return 'docx';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheetml'))
    return 'xlsx';
  if (mimeType.includes('image/png')) return 'png';
  if (mimeType.includes('image/jpg') || mimeType.includes('image/jpeg'))
    return 'jpg';
  if (mimeType.includes('image/webp')) return 'webp';
  throw new Error(`Unsupported file type: ${mimeType}`);
};

// Get all files (not deleted)
const getAllFiles = catchAsync(async (req: Request, res: Response) => {
  const files = await fileService.getAllFiles(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Files fetched successfully',
    data: files,
  });
});

// Get a file by its ID
const getFileById = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.getFileById(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File fetched successfully',
    data: file,
  });
});

// Get all files uploaded by a specific user
const getFilesByUserId = catchAsync(async (req: Request, res: Response) => {
  const files = await fileService.getFilesByUserId(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User files fetched successfully',
    data: files,
  });
});

// Soft delete a file
const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.deleteFile(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File deleted successfully',
    data: file,
  });
});

// Restore a soft-deleted file
const restoreFile = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.restoreFile(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File restored successfully',
    data: file,
  });
});

// Restore multiple files
const restoreMultipleFiles = catchAsync(async (req: Request, res: Response) => {
  const ids = req.body.ids || [];
  const count = await fileService.restoreMultipleFiles(ids);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${count} file(s) restored successfully`,
    data: null,
  });
});

// Hard delete a file (permanent removal)
const hardDeleteFile = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;

  // Step 1: Fetch the file from the database
  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  // Step 2: Delete the file from the database
  await prisma.file.delete({
    where: { id: fileId },
  });

  // Step 3: Delete the file from the local file system
  let filePath = file.filePath as string;

  // Ensure that the file path is correct and not duplicated
  if (!filePath.startsWith(process.cwd())) {
    // If the file path does not include the full path, prepend the base directory
    filePath = path.join(process.cwd(), filePath);
  }

  try {
    // Delete the file from the file system
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Error deleting file from file system', err);
    throw new ApiError(500, 'Failed to delete file from the system');
  }

  // Step 4: Send response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File permanently deleted from the system and database',
    data: null,
  });
});

// Update file metadata (name, type, size, etc.)
const updateFile = catchAsync(async (req: Request, res: Response) => {
  const updated = await fileService.updateFile(req.params.fileId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File updated successfully',
    data: updated,
  });
});

// Mark/unmark a file as a favorite
const makeFavourite = catchAsync(async (req: Request, res: Response) => {
  const result = await fileService.makeFavourite(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isFavorite
      ? 'File marked as favourite'
      : 'File removed from favourites',
    data: result,
  });
});

// Get OnlyOffice editor configuration for a specific file
const getEditorConfig = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const user = req.user;

  const file = await fileService.getFileById(fileId);
  if (!file || !file.fileUrl) {
    throw new ApiError(404, 'File not found or missing fileUrl');
  }

  const configData = {
    document: {
      title: file.fileName,
      fileType: file.fileType,
      url: `${file.fileUrl}`,
      key: `${file.id}-${file.version}`,
      permissions: { edit: true },
    },
    documentType: file.fileType === 'xlsx' ? 'spreadsheet' : 'text',
    editorConfig: {
      callbackUrl: `${config.backend_base_url}/api/files/save-callback/${file.id}`,
      user: {
        id: user?.id,
        email: user?.email || 'Anonymous',
      },
    },
  };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Editor config generated',
    data: configData,
  });
});

// Handle file save callback from OnlyOffice
const handleSaveCallback = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { status, url, users = [] } = req.body;

  if (status !== 2 || !url) {
    return res.status(200).send('Nothing to save');
  }

  const file = await fileService.getFileById(fileId);
  if (!file) throw new ApiError(404, 'File not found');

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data as ArrayBuffer);
  const base64 = buffer.toString('base64');

  await fileService.updateFile(fileId, {
    fileBlob: base64,
    version: file.version + 1,
    lastSavedAt: new Date(),
    lastSavedById: users[0] || undefined,
  });

  res.status(200).json({ message: 'File saved successfully' });
});

const createBlankFile = async (req: Request, res: Response): Promise<void> => {
  const { type } = req.params as { type: 'docx' | 'xlsx' | 'pdf' };
  const user = req.user as { id: string; email: string };

  if (!user || !user.id) {
    res.status(401).send('Unauthorized');
    return;
  }

  let buffer: Buffer;
  if (type === 'docx') {
    buffer = await generateBlankDocx();
  } else if (type === 'xlsx') {
    buffer = await generateBlankXlsx();
  } else if (type === 'pdf') {
    buffer = generateBlankPdf();
  } else {
    res.status(400).send('Invalid file type');
    return;
  }

  // 1. Create DB record first (with empty fileUrl/filePath)
  const file = await prisma.file.create({
    data: {
      userId: user.id,
      fileName: `Untitled.${type}`,
      fileType: type,
      fileSize: buffer.length,
      version: 1,
      fileBlob: buffer.toString('base64'),
      fileUrl: '', // Temporary, will update after file is written
      filePath: '', // Temporary, will update after file is written
    },
  });

  // 2. Use file.id for the filename
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, `${file.id}.${type}`);
  await fs.writeFile(filePath, buffer);

  // 3. Update DB record with fileUrl and filePath
  await prisma.file.update({
    where: { id: file.id },
    data: {
      fileUrl: `${config.backend_base_url}/uploads/${file.id}.${type}`,
      filePath,
    },
  });

  // 4. Return a response with the file URL to open
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File created successfully',
    data: { url: `/uploads/${file.id}.${type}` },
  });
};

const downloadFile = catchAsync(async (req, res) => {
  const { fileId } = req.params;
  const file = await fileService.getFileById(fileId);

  if (!file || !file.filePath) {
    throw new ApiError(404, 'File not found or missing file path');
  }

  const filePath = file.filePath;
  const fileName = file.fileName;
  const fileExtension = path.extname(filePath);

  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', `application/octet-stream`);
  const fileStream = fsSync.createReadStream(filePath);
  fileStream.pipe(res);
  fileStream.pipe(res);

  interface DownloadFileStream extends NodeJS.ReadableStream {
    on(event: 'error', listener: (error: Error) => void): this;
  }

  (fileStream as DownloadFileStream).on('error', (error: Error) => {
    throw new ApiError(500, 'Error while downloading the file');
  });
});

// Controller to create a Google Doc
const createGoogleDoc = catchAsync(async (req: Request, res: Response) => {
  const tokens = req.session.tokens; // Get tokens from session

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens available' });
  }

  const auth = new OAuth2Client();
  auth.setCredentials(tokens);

  try {
    const doc = await googleDocsService.createGoogleDoc(auth);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Google Doc created successfully',
      data: doc,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: message });
  }
});

// Controller to update a Google Doc
const updateGoogleDoc = catchAsync(async (req: Request, res: Response) => {
  const { docId, content } = req.body; // Get document ID and content from the request
  const tokens = req.session.tokens;

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens available' });
  }

  const auth = new OAuth2Client();
  auth.setCredentials(tokens);

  try {
    const updatedDoc = await googleDocsService.updateGoogleDoc(
      docId,
      auth,
      content,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Google Doc updated successfully',
      data: updatedDoc,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: message });
  }
});

// Controller to create a Google Sheet
const createGoogleSheet = catchAsync(async (req: Request, res: Response) => {
  const tokens = req.session.tokens;

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens available' });
  }

  const auth = new OAuth2Client();
  auth.setCredentials(tokens);

  try {
    const sheet = await googleSheetsService.createGoogleSheet(auth);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Google Sheet created successfully',
      data: sheet,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: message });
  }
});

// Controller to update a Google Sheet
const updateGoogleSheet = catchAsync(async (req: Request, res: Response) => {
  const { sheetId, range, values } = req.body; // Get sheet ID, range, and values from the request
  const tokens = req.session.tokens;

  if (!tokens) {
    return res.status(401).json({ error: 'No tokens available' });
  }

  const auth = new OAuth2Client();
  auth.setCredentials(tokens);

  try {
    const updatedSheet = await googleSheetsService.updateGoogleSheet(
      sheetId,
      auth,
      range,
      values,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Google Sheet updated successfully',
      data: updatedSheet,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: message });
  }
});

export const fileController = {
  createFile,
  getAllFiles,
  getFileById,
  getFilesByUserId,
  deleteFile,
  restoreFile,
  restoreMultipleFiles,
  hardDeleteFile,
  updateFile,
  makeFavourite,
  getEditorConfig,
  handleSaveCallback,
  createBlankFile,
  downloadFile,
  createGoogleDoc,
  updateGoogleDoc,
  createGoogleSheet,
  updateGoogleSheet,
};
