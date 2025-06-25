import { File, fileType, Prisma } from '@prisma/client';
import ApiError from '../../errors/ApiError';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';
import prisma from '../../helpers/prisma';

/**
 * Create a new file record
 */
async function createFile(payload: Prisma.FileCreateInput): Promise<File> {
  const result = await prisma.file.create({
    data: payload,
  });

  if (!result) throw new ApiError(402, 'File creation failed');
  return result;
}

/**
 * Get all active files (not soft-deleted)
 */
async function getAllFiles({
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
}) {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginations);

  const whereCondition: Prisma.FileWhereInput = {
    isDeleted: false,
    deletedAt: null,
  };

  if (searchTerm) {
    whereCondition.OR = [
      {
        fileName: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (trash) {
    whereCondition.isDeleted = true;
    whereCondition.deletedAt = {
      not: null,
    };
  }

  if (isFavourite) {
    whereCondition.isFavorite = isFavourite;
  }

  if (filetype) {
    whereCondition.fileType = filetype;
  }

  const result = await prisma.file.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: sortBy
      ? {
          [String(sortBy)]: sortOrder,
        }
      : undefined,
  });

  return {
    result: result,
    meta: {
      page,
      limit,
      skip,
      total: result.length,
      sortBy,
      sortOrder,
    },
  };
}

/**
 * Get a file by ID (only if not soft-deleted)
 */
async function getFileById(id: string): Promise<File | null> {
  const result = await prisma.file.findUnique({
    where: {
      id,
    },
  });

  if (!result) throw new ApiError(402, 'File creation failed');

  return result;
}

/**
 * Get all files by user ID (only active files)
 */

async function getFilesByUserId(userId: string): Promise<File[]> {
  const result = await prisma.file.findMany({
    where: {
      userId,
      deletedAt: null,
    },
  });

  if (!result) throw new ApiError(402, 'File creation failed');
  return result;
}

/**
 * Soft delete a file
 */
async function deleteFile(id: string): Promise<File> {
  const result = await prisma.file.update({
    where: {
      id,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
}

/**
 * Restore a soft-deleted file
 */

async function restoreFile(id: string): Promise<File> {
  return await prisma.file.update({
    where: {
      id,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });
}

/**
 * Restore multiple soft-deleted files by their IDs
 */
async function restoreMultipleFiles(ids: string[]): Promise<number> {
  const result = await prisma.file.updateMany({
    where: {
      id: {
        in: ids,
      },
      deletedAt: {
        not: null,
      },
      isDeleted: true,
    },
    data: {
      isDeleted: false,
      deletedAt: null,
    },
  });

  return result.count; // Return the number of restored files
}

/**
 * Permanently delete a file (hard delete)
 */
async function hardDeleteFile(id: string): Promise<void> {
  await prisma.file.delete({
    where: {
      id,
    },
  });
}

/**
 * Update file metadata
 */

async function updateFile(
  id: string,
  data: Partial<{
    fileName: string;
    fileType: fileType;
    fileSize: number;
    fileUrl: string;
    filePath: string | null;
  }>,
): Promise<File> {
  const result = await prisma.file.update({
    where: {
      id,
    },
    data,
  });

  if (!result) throw new ApiError(402, 'File update failed');
  return result;
}

async function makeFavourite(id: string): Promise<File> {
  const result = await prisma.file.update({
    where: {
      id,
    },
    data: {
      isFavorite: true,
    },
  });

  if (!result) throw new ApiError(402, 'File update failed');
  return result;
}

export const fileService = {
  createFile,
  getAllFiles,
  getFileById,
  getFilesByUserId,
  deleteFile,
  restoreFile,
  hardDeleteFile,
  updateFile,
  restoreMultipleFiles,
  makeFavourite,
};
