import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { fileService } from './file.service';
import sendResponse from '../../utils/sendResponse';
import { fileType } from '@prisma/client';
import config from '../../../config';
import fs from 'fs/promises';
import axios from 'axios';
import ApiError from '../../errors/ApiError';

const createFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const uploadedFiles: Express.Multer.File[] = [];

  const filesField = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;

  if (filesField) {
    if (Array.isArray(filesField['file']))
      uploadedFiles.push(...filesField['file']);
    if (Array.isArray(filesField['files']))
      uploadedFiles.push(...filesField['files']);
  }

  if (uploadedFiles.length > 1) {
    const files = uploadedFiles.map((file) => ({
      fileName: file.originalname,
      fileType: getFileType(file.mimetype),
      fileSize: file.size,
      fileUrl: `${config.backend_base_url}/uploads/${file.filename}`,
      filePath: file.path,
      version: 1,
      user: { connect: { id: userId } },
    }));

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
            await fs.unlink(file.path);
          } catch (_) {
            console.warn(`Failed to delete file ${file.path}`);
          }
        }),
      );
      throw err;
    }
  }

  if (uploadedFiles.length === 1) {
    const file = uploadedFiles[0];
    const payload = {
      fileName: file.originalname,
      fileType: getFileType(file.mimetype),
      fileSize: file.size,
      fileUrl: `${config.backend_base_url}/uploads/${file.filename}`,
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
        await fs.unlink(file.path);
      } catch (_) {
        console.warn(`Failed to delete file ${file.path}`);
      }
      throw err;
    }
  }

  throw new Error('No file uploaded');
});

const getFileType = (mimeType: string): fileType => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('msword') || mimeType.includes('wordprocessingml'))
    return 'docx';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheetml'))
    return 'excel';
  if (mimeType.includes('image')) return 'png';
  throw new Error(`Unsupported file type: ${mimeType}`);
};

const getAllFiles = catchAsync(async (req: Request, res: Response) => {
  const files = await fileService.getAllFiles(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Files fetched successfully',
    data: files,
  });
});

const getFileById = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.getFileById(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File fetched successfully',
    data: file,
  });
});

const getFilesByUserId = catchAsync(async (req: Request, res: Response) => {
  const files = await fileService.getFilesByUserId(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User files fetched successfully',
    data: files,
  });
});

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.deleteFile(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File deleted successfully',
    data: file,
  });
});

const restoreFile = catchAsync(async (req: Request, res: Response) => {
  const file = await fileService.restoreFile(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File restored successfully',
    data: file,
  });
});

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

const hardDeleteFile = catchAsync(async (req: Request, res: Response) => {
  await fileService.hardDeleteFile(req.params.fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File permanently deleted',
    data: null,
  });
});

const updateFile = catchAsync(async (req: Request, res: Response) => {
  const updated = await fileService.updateFile(req.params.fileId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File updated successfully',
    data: updated,
  });
});

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
    documentType: file.fileType === 'excel' ? 'spreadsheet' : 'text',
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
};
