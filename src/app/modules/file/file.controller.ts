import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { fileService } from './file.service';
import sendResponse from '../../utils/sendResponse';
import pick from '../../../helpars/pick';
import { fileType } from '@prisma/client';

const createFile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const files = req.files.map((file: Express.Multer.File) => ({
      fileName: file.originalname,
      fileType: getFileType(file.mimetype),
      fileSize: file.size,
      fileUrl: `/uploads/${file.filename}`,
      filePath: file.path,
      userId: userId as string,
    }));

    const result = await fileService.createMultipleFiles(files);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Multiple files uploaded successfully',
      data: result,
    });
  } else if (req.file) {
    const file = req.file;
    const payload = {
      fileName: file.originalname,
      fileType: getFileType(file.mimetype),
      fileSize: file.size,
      fileUrl: `/uploads/${file.filename}`,
      filePath: file.path,
      user: { connect: { id: userId } },
    };

    const result = await fileService.createFile(payload);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } else {
    throw new Error('No file uploaded');
  }
});

const getFileType = (mimeType: string): fileType => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('msword') || mimeType.includes('wordprocessingml'))
    return 'docx';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheetml'))
    return 'xlsx';
  if (mimeType.includes('presentationml')) return 'pptx';
  if (mimeType.includes('image')) return 'image';
  throw new Error('Unsupported file type');
};

const getAllFiles = catchAsync(async (req: Request, res: Response) => {
  const { trash, filetype, isFavourite, searchTerm } = req.query || {};
  const paginations = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

  const files = await fileService.getAllFiles({
    trash: typeof trash === 'string' ? true : undefined,
    filetype: filetype as fileType,
    isFavourite: typeof isFavourite === 'string' ? true : undefined,
    searchTerm: typeof searchTerm === 'string' ? searchTerm : undefined,
    paginations,
  });

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
  const { userId } = req.params;
  const files = await fileService.getFilesByUserId(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User files fetched successfully',
    data: files,
  });
});

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  await fileService.deleteFile(fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File deleted successfully',
    data: null,
  });
});

const restoreFile = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const restoredFile = await fileService.restoreFile(fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File restored successfully',
    data: restoredFile,
  });
});

const restoreMultipleFiles = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.query as { ids: string[] };
  const restoredCount = await fileService.restoreMultipleFiles(ids);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${restoredCount} file(s) restored successfully`,
    data: null,
  });
});

const hardDeleteFile = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  await fileService.hardDeleteFile(fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File permanently deleted',
    data: null,
  });
});

const updateFile = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const payload = req.body;
  const updatedFile = await fileService.updateFile(fileId, payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File updated successfully',
    data: updatedFile,
  });
});

const makeFavourite = catchAsync(async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const result = await fileService.makeFavourite(fileId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isFavorite
      ? 'File marked as favourite'
      : 'File removed from favourites',
    data: result,
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
};
