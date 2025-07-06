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
      ? `${config.backend_file_url}/uploads/${file.originalname}`
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

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

export const ProfileServices = {
  getMyProfileFromDB,
  updateMyProfileIntoDB,
  changePassword,
};
