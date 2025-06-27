import { Prisma, fileType } from '@prisma/client';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';
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
  filetype?: fileType;
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
  const file = await prisma.file.findUnique({ where: { id } });
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

const hardDeleteFile = async (id: string) => {
  const file = await prisma.file.delete({ where: { id } });
  if (!file) throw new ApiError(404, 'File not found');
  return file;
};

const updateFile = async (
  id: string,
  data: Partial<{
    fileName: string;
    fileType: fileType;
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

  // Special handling for optional fields
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
  hardDeleteFile,
  updateFile,
  makeFavourite,
};
