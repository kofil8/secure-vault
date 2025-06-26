import { Prisma, fileType, File } from '@prisma/client';
import prisma from '../../helpers/prisma';
import ApiError from '../../errors/ApiError';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';

const createFile = async (data: Prisma.FileCreateInput) => {
  const file = await prisma.file.create({ data });
  if (!file) throw new ApiError(500, 'File creation failed');
  return file;
};

const createMultipleFiles = async (data: Prisma.FileCreateManyInput[]) => {
  const files = await prisma.file.createMany({ data });
  if (!files) throw new ApiError(500, 'Multiple file upload failed');
  return files;
};

const getAllFiles = async ({
  trash,
  filetype,
  isFavourite,
  searchTerm,
  paginations,
}: {
  trash?: boolean;
  filetype?: fileType;
  isFavourite?: boolean;
  searchTerm?: string;
  paginations: IPaginationOptions;
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
  return await prisma.file.findUnique({ where: { id } });
};

const getFilesByUserId = async (userId: string) => {
  return await prisma.file.findMany({
    where: { userId, deletedAt: null },
  });
};

const deleteFile = async (id: string) => {
  return await prisma.file.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const restoreFile = async (id: string) => {
  return await prisma.file.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });
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
  return await prisma.file.delete({ where: { id } });
};

const updateFile = async (
  id: string,
  data: Partial<{
    fileName: string;
    fileType: fileType;
    fileSize: number;
    fileUrl: string;
    filePath: string | null;
  }>,
) => {
  const updated = await prisma.file.update({ where: { id }, data });
  if (!updated) throw new ApiError(500, 'File update failed');
  return updated;
};

const makeFavourite = async (id: string) => {
  return await prisma.file.update({
    where: { id },
    data: { isFavorite: true },
  });
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
