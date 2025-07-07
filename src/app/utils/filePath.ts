import path from 'path';

/**
 * Resolve the absolute path to a file from its relative path.
 * @param relativePath - Relative path like 'uploads/abc.jpg'
 * @returns Absolute path like '/home/user/app/uploads/abc.jpg'
 */
export const resolveFilePath = (relativePath: string): string => {
  return path.join(process.cwd(), relativePath);
};
