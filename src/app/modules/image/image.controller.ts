// Image.controller: Module file for the Image.controller functionality.
import httpStatus from "http-status"; 
import { Request, Response } from "express";
import { imageServices } from "./image.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Controller for creating an image
const createImage = catchAsync(async (req: Request, res: Response) => {
  const result = await imageServices.createImage(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "File uploaded successfully!",
    data: result,
  });
});

// Controller for creating images
const createMultipleImage = catchAsync(async (req: Request, res: Response) => {
  const result = await imageServices.createImages(req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Files uploaded successfully!",
    data: result,
  });
});

// Controller for deleting an image
const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const result = await imageServices.deleteImage(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "File deleted successfully!",
    data: result,
  });
});

// Controller for deleting multiple images
const deleteMultipleImages = catchAsync(async (req: Request, res: Response) => {

  const { urls } = req.body;

  const result = await imageServices.deleteMultipleImages(urls);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Files Deleted successfully",
    data: result,
  });
});

export const ImageController = {
  createImage,
  deleteImage,
  createMultipleImage,
  deleteMultipleImages,
};
