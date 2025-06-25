// Image.service: Module file for the Image.service functionality.
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { Request } from 'express';
import {
  deleteFromDigitalOceanAWS,
  deleteMultipleFromDigitalOceanAWS,
  uploadToDigitalOceanAWS,
} from '../../utils/uploadToS3';

// create image
const createImage = async (req: Request) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No image provided');
  }

  const file = req.file;

  console.log('file', file);

  const imageUrl = await uploadToDigitalOceanAWS(file!);

  if (!imageUrl) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Image upload failed');
  }

  return { imageUrl:imageUrl.Location };
};

// Service for creating images//multiple images creation
const createImages = async (req: Request) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No images provided');
  }

  const imageUrls = [];

  for (const file of files) {
    const url = await uploadToDigitalOceanAWS(file);
    imageUrls.push(url.Location);
  }

  return { imageUrls };
};

//delete single image
const deleteImage = async (payload: { url: string }) => {
  if (!payload.url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No image provided');
  }
  const result = deleteFromDigitalOceanAWS(payload.url);
  return result;
};

//delete multiple images
const deleteMultipleImages = async (urls: string[]) => {
  if (!urls || urls.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'No images provided for deletion',
    );
  }
  const result = deleteMultipleFromDigitalOceanAWS(urls);
  return result;
};

export const imageServices = {
  createImage,
  createImages,
  deleteImage,
  deleteMultipleImages,
};
