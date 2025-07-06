import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';
import { IPaginationOptions } from '../../interfaces/paginations';
import { calculatePagination } from '../../utils/calculatePagination';

/**
 * Excel Data Structures
 */
interface ExcelRow {
  number: number;
  values: any[];
}

interface ExcelSheet {
  id: string;
  name: string;
  rows: ExcelRow[];
  properties?: ExcelJS.WorksheetProperties;
}

interface ExcelWorkbook {
  id: string;
  fileName: string;
  fileType: string;
  version: number;
  lastSavedAt?: Date | null;
  updatedAt: Date;
  sheets: ExcelSheet[];
}

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

const hardDeleteFile = async (id: string) => {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new ApiError(404, 'File not found');

  await prisma.file.delete({ where: { id } });

  const filePath = path.join(process.cwd(), file.filePath as string);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Error deleting file:', err);
    throw new ApiError(500, 'Failed to delete file from system');
  }

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

// EXCEL-SPECIFIC METHODS

const getExcelData = async (fileId: string): Promise<ExcelWorkbook> => {
  const file = await getFileById(fileId);

  // Verify file exists on disk
  try {
    await fs.access(file.filePath as string);
  } catch {
    throw new ApiError(404, 'Excel file not found on server');
  }

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(file.filePath as string);
  } catch (error) {
    throw new ApiError(500, 'Failed to read Excel file');
  }

  const sheets: ExcelSheet[] = workbook.worksheets.map((worksheet) => {
    const rows: ExcelRow[] = [];
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      rows.push({
        number: rowNumber,
        values: row.values,
      });
    });

    // Ensure at least one row exists
    if (rows.length === 0) {
      rows.push({ number: 1, values: [] });
    }

    return {
      id: worksheet.id.toString(),
      name: worksheet.name,
      rows,
      properties: worksheet.properties,
    };
  });

  // Ensure at least one sheet exists
  if (sheets.length === 0) {
    sheets.push({
      id: 'default-sheet',
      name: 'Sheet1',
      rows: [{ number: 1, values: [] }],
      properties: {},
    });
  }

  return {
    id: file.id,
    fileName: file.fileName,
    fileType: file.fileType,
    version: file.version || 1,
    lastSavedAt: file.lastSavedAt || null,
    updatedAt: file.updatedAt,
    sheets,
  };
};

const updateExcelFile = async (
  fileId: string,
  updates: { sheetUpdates: Array<{ sheetId: string; data: any[][] }> },
  userId: string,
) => {
  const file = await getFileById(fileId);

  // Verify file exists on disk
  try {
    await fs.access(file.filePath as string);
  } catch {
    throw new ApiError(404, 'Excel file not found on server');
  }

  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(process.cwd(), file.filePath as string);

  try {
    await workbook.xlsx.readFile(filePath);

    updates.sheetUpdates.forEach((sheetUpdate) => {
      const worksheet = workbook.getWorksheet(sheetUpdate.sheetId);
      if (!worksheet) {
        throw new ApiError(404, `Worksheet ${sheetUpdate.sheetId} not found`);
      }

      // Clear existing data
      worksheet.spliceRows(1, worksheet.rowCount);

      // Add updated data
      sheetUpdate.data.forEach((row) => {
        if (row && row.length > 0) {
          worksheet.addRow(row);
        }
      });
    });

    await workbook.xlsx.writeFile(filePath);

    const stats = await fs.stat(filePath);
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        lastSavedAt: new Date(),
        lastSavedById: userId,
        fileSize: stats.size,
        version: { increment: 1 },
      },
    });

    return updatedFile;
  } catch (error) {
    console.error('Excel update error:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Failed to update Excel file');
  }
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
  getExcelData,
  updateExcelFile,
};
