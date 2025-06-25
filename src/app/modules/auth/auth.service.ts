import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import prisma from '../../helpers/prisma';

const loginUserFromDB = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  const isCorrectPassword = await bcrypt.compare(
    password,
    user.password as string,
  );
  if (!isCorrectPassword)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid credentials');

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return {
    accessToken,
    refreshToken,
    id: user.id,
    email: user.email,
    name: user.name,
    phoneNumber: user.phoneNumber,
  };
};

const logoutUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');

  await prisma.user.update({ where: { id }, data: { refreshToken: null } });
};

const refreshAccessToken = async (token: string) => {
  try {
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret,
    );
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
    }

    const newAccessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.expires_in as string,
    );

    const newRefreshToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email },
      config.jwt.refresh_token_secret as Secret,
      config.jwt.refresh_token_expires_in as string,
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Could not refresh token');
  }
};

export const AuthServices = { loginUserFromDB, logoutUser, refreshAccessToken };
