import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import prisma from '../../helpers/prisma';

const getMyProfileFromDB = async (id: string) => {
  const profile = await prisma.user.findUnique({ where: { id } });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  const { password, ...rest } = profile;
  return Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== null),
  );
};

const updateMyProfileIntoDB = async (id: string, payload: any, file: any) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser)
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  const profileImage =
    file && file.originalname
      ? `${config.backend_image_url}/uploads/profile/${file.originalname}`
      : existingUser.profileImage;

  const parsedPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      profileImage,
      ...parsedPayload,
    },
  });

  const { password, ...rest } = updatedUser;
  return Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== null),
  );
};

export const ProfileServices = {
  getMyProfileFromDB,
  updateMyProfileIntoDB,
};
