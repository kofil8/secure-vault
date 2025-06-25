/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

const verifySecretQuestions = async (email: string, answers: string[]) => {

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const correctAnswers = [
    user.securityAnswer1,
    user.securityAnswer2,
    user.securityAnswer3,
  ];

  const matched = correctAnswers.every((ans, idx) => ans === answers[idx]);

  if (!matched)
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect security answers');
  return user;
};

const resetPassword = async (email: string, newPassword: string) => {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  const { password, ...rest } = user;
  return rest;
};

const changePassword = async (
  id: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Old password is incorrect');

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  const updatedUser = await prisma.user.update({
    where: { id },
    data: { password: hashedNewPassword },
  });

  const { password, ...rest } = updatedUser;
  return rest;
};

const updateSecurityAnswers = async (id: string, answers: string[]) => {
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  const updated = await prisma.user.update({
    where: { id },
    data: {
      securityAnswer1: answers[0],
      securityAnswer2: answers[1],
      securityAnswer3: answers[2],
    },
  });

  const { password, ...rest } = updated;
  return rest;
};

export const ProfileServices = {
  getMyProfileFromDB,
  updateMyProfileIntoDB,
  forgotPassword: verifySecretQuestions,
  resetPassword,
  changePassword,
  updateSecurityAnswers,
};
