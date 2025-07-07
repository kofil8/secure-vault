import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';

const createFile = async (data: Prisma.FileCreateInput) => {
  const file = await prisma.file.create({ data });
  if (!file) throw new ApiError(500, 'File creation failed');
  return file;
};

const createMultipleFiles = async (data: Prisma.FileCreateInput[]) => {
  try {
    const result = await Promise.all(
      data.map((file) => prisma.file.create({ data: file })),
    );
    return result;
  } catch (error) {
    throw new ApiError(500, 'Multiple file upload failed');
  }
};

const getAllFiles = async ({
  trash,
  filetype,
  isFavourite,
  searchTerm,
  paginations = { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
}: {
  trash?: boolean;
  filetype?: string;
  isFavourite?: boolean;
  searchTerm?: string;
  paginations?: IPaginationOptions;
}) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginations);

  const whereCondition: Prisma.FileWhereInput = {
    isDeleted: trash || false,
    ...(filetype && { fileType: filetype }),
    ...(isFavourite !== undefined && { isFavorite: isFavourite }),
    ...(searchTerm && {
      fileName: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    }),
  };

  const result = await prisma.file.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
  });

  return {
    result,
    meta: { page, limit, skip, total: result.length, sortBy, sortOrder },
  };
};

const getFileById = async (id: string) => {
  const file = await prisma.file.findUnique({
    where: { id },
    select: {
      id: true,
      fileName: true,
      filePath: true,
      fileUrl: true,
      fileType: true,
      fileSize: true,
      version: true,
      lastSavedAt: true,
      updatedAt: true,
    },
  });

  if (!file) throw new ApiError(404, 'File not found');
  return file;
};

const getFilesByUserId = async (userId: string) => {
  return await prisma.file.findMany({
    where: { userId, deletedAt: null },
  });
};

const deleteFile = async (id: string) => {
  const file = await prisma.file.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  if (!file) throw new ApiError(404, 'File not found');
  return file;
};

const restoreFile = async (id: string) => {
  const file = await prisma.file.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });
  if (!file) throw new ApiError(404, 'File not found');
  return file;
};

const restoreMultipleFiles = async (ids: string[]) => {
  const result = await prisma.file.updateMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
      isDeleted: true,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
  return result.count;
};

const deleteFilePermanently = async (id: string) => {
  // 1. Find file
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new ApiError(404, 'File not found');

  // 2. Resolve full path
  const absolutePath = path.isAbsolute(file.filePath!)
    ? file.filePath!
    : path.join(process.cwd(), file.filePath!);

  // 3. Delete from disk
  try {
    await fs.access(absolutePath); // Confirm existence
    await fs.unlink(absolutePath); // Delete
  } catch (err) {
    console.error('⚠️ Error deleting file:', err);
    throw new ApiError(500, 'Failed to delete file from system');
  }

  // 4. Delete from DB
  await prisma.file.delete({ where: { id } });

  return file;
};

const updateFile = async (
  id: string,
  data: Partial<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    filePath: string | null;
    fileBlob: string;
    version: number;
    lastSavedAt: Date;
    lastSavedById: string;
  }>,
) => {
  const updateData: Prisma.FileUpdateInput = { ...data };

  if ('filePath' in data) {
    updateData.filePath = { set: data.filePath ?? null };
  }

  const updated = await prisma.file.update({
    where: { id },
    data: updateData,
  });

  if (!updated) throw new ApiError(500, 'File update failed');
  return updated;
};

const makeFavourite = async (id: string) => {
  const file = await prisma.file.update({
    where: { id },
    data: { isFavorite: true },
  });
  if (!file) throw new ApiError(404, 'File not found');
  return file;
};

export const fileService = {
  createFile,
  createMultipleFiles,
  getAllFiles,
  getFileById,
  getFilesByUserId,
  deleteFile,
  restoreFile,
  restoreMultipleFiles,
  deleteFilePermanently,
  updateFile,
  makeFavourite,
};
