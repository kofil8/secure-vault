import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { fileService } from './file.service';
import sendResponse from '../../utils/sendResponse';
import pick from '../../../helpars/pick';
import { fileType } from '@prisma/client';

// Create a new file
const createFile = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const userId = req.user.id;
  payload.userId = userId;
  const file = await fileService.createFile(payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'File uploaded successfully',
    data: file,
  });
});

// Get all files (non-deleted)
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

// Get single file by ID
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

// Get all files by user ID
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

// Soft delete a file
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

// Restore a soft-deleted file
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

// Restore multiple soft-deleted files
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

// Permanently delete a file (hard delete)
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

// Update file metadata
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

// Mark file as favorite
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
