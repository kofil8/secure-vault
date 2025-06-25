import { Request, Response } from 'express';
import httpStatus from 'http-status';
import pick from '../../../shared/pick';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../utils/sendResponse';
import { DonationServices, Filters } from './file.service';

const createDonation = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const payload = req.body.bodyData;
  const files = req.files as any;
  const result = await DonationServices.createDonationIntoDB(
    id,
    payload,
    files,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Donation created successfully',
    data: result,
  });
});

const getAllDonations = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
  ]);
  const filters = pick(req.query, [
    'searchTerm',
    'category',
    'subCategory',
    'condition',
  ]);
  const result = await DonationServices.getAllDonationsFromDB(
    paginationOptions,
    filters as Filters,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Donations Retrieve successfully',
    data: result,
  });
});

const getSingleDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DonationServices.getSingleDonationFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Donation Retrieve successfully',
    data: result,
  });
});

const updateDonation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body.bodyData;
  const files = req.files as any;
  const result = await DonationServices.updateDonationIntoDB(
    id,
    payload,
    files,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Donation updated successfully',
    data: result,
  });
});

const deleteDonation = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await DonationServices.deleteDonationIntoDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Donation deleted successfully',
    data: result,
  });
});
export const DonationControllers = {
  createDonation,
  getAllDonations,
  getSingleDonation,
  updateDonation,
  deleteDonation,
};
