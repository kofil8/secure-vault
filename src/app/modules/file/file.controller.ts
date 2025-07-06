import { Request, Response } from 'express';
import fs from 'fs/promises';
import httpStatus from 'http-status';
import path from 'path';
import ApiError from '../../errors/ApiError';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { fileService } from './file.service';

import config from '../../../config';
import { fileGenerator } from '../../../helpars/fileGenerator';
import prisma from '../../helpers/prisma';

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

  if (uploadedFiles.length > 1) {
    const files = uploadedFiles.map((file) => {
      const ext = path.extname(file.originalname);
      const baseName = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, '-');
      const cleanFileName = `${baseName}${ext}`;

      return {
        fileName: cleanFileName,
        fileType: getFileType(file.mimetype),
        fileSize: file.size,
        fileUrl: `${config.backend_base_url}/uploads/${file.filename}`,
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
      fileName: file.filename,
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

// Helper function to determine file type
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
  const { fileId } = req.params;
  const file = await fileService.getFileById(fileId);
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
  const { fileId } = req.params;
  const file = await fileService.hardDeleteFile(fileId);
  sendResponse(res, {
    statusCode: 200,
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

const createBlankFile = catchAsync(async (req: Request, res: Response) => {
  const { type } = req.params as { type: 'docx' | 'xlsx' | 'pdf' };
  const user = req.user as { id: string };

  let buffer: Buffer;
  if (type === 'docx') {
    buffer = await fileGenerator.generateBlankDocx();
  } else if (type === 'xlsx') {
    buffer = await fileGenerator.generateBlankXlsx();
  } else if (type === 'pdf') {
    buffer = fileGenerator.generateBlankPdf();
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type');
  }

  const file = await prisma.file.create({
    data: {
      userId: user.id,
      fileName: `Untitled.${type}`,
      fileType: type,
      fileSize: buffer.length,
      version: 1,
      fileBlob: buffer.toString('base64'),
      fileUrl: '',
      filePath: '',
    },
  });

  const uploadsDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, `${file.id}.${type}`);
  await fs.writeFile(filePath, buffer);

  await prisma.file.update({
    where: { id: file.id },
    data: {
      fileUrl: `${config.backend_base_url}/uploads/${file.id}.${type}`,
      filePath,
    },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File created successfully',
    data: { url: `/uploads/${file.id}.${type}` },
  });
});

const downloadFile = catchAsync(async (req, res) => {
  const { fileId } = req.params;
  const file = await fileService.getFileById(fileId);

  if (!file || !file.filePath) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  res.download(file.filePath, file.fileName);
});

const getExcelData = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const excelData = await fileService.getExcelData(fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Excel data retrieved successfully',
    data: excelData,
  });
});

const updateExcelData = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { sheets } = req.body;
  const userId = req.user?.id;

  const updatedFile = await fileService.updateExcelFile(
    fileId,
    { sheets },
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Excel file updated successfully',
    data: updatedFile,
  });
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
  createBlankFile,
  downloadFile,
  getExcelData,
  updateExcelData,
};
