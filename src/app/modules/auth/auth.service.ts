import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret, SignOptions } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import prisma from '../../helpers/prisma';

const SALT_ROUNDS = 10;

// Helper to normalize (lowercase & trim) answers before hashing/comparing
const normalizeAnswer = (answer: string) => answer.trim().toLowerCase();

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
    config.jwt.expires_in as SignOptions['expiresIn'],
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.expires_in as SignOptions['expiresIn'],
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
      config.jwt.expires_in as SignOptions['expiresIn'],
    );

    const newRefreshToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email },
      config.jwt.refresh_token_secret as Secret,
      config.jwt.expires_in as SignOptions['expiresIn'],
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Could not refresh token');
  }
};

// --- New services for security questions ---

// Check if user exists by email
const doesUserExist = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  return !!user;
};

// Verify the answers and generate a reset token if valid
const verifyAnswersAndCreateToken = async (
  email: string,
  answers: [string, string, string],
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  // Normalize answers
  const normalizedAnswers = answers.map(normalizeAnswer);

  // Extract hashed answers from user
  const { securityAnswer1Hash, securityAnswer2Hash, securityAnswer3Hash } =
    user as {
      securityAnswer1Hash: string | null;
      securityAnswer2Hash: string | null;
      securityAnswer3Hash: string | null;
    };

  if (!securityAnswer1Hash || !securityAnswer2Hash || !securityAnswer3Hash) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Security answers not set');
  }

  // Verify each answer with bcrypt.compare
  const valid1 = await bcrypt.compare(
    normalizedAnswers[0],
    securityAnswer1Hash,
  );
  const valid2 = await bcrypt.compare(
    normalizedAnswers[1],
    securityAnswer2Hash,
  );
  const valid3 = await bcrypt.compare(
    normalizedAnswers[2],
    securityAnswer3Hash,
  );

  if (!(valid1 && valid2 && valid3)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid security answers');
  }

  // Generate a JWT token for password reset valid for, e.g., 15 mins
  const resetToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.jwt_secret as Secret,
    '15m',
  );

  return resetToken;
};

// Reset password by verifying reset token
const resetPassword = async (userId: string, newPassword: string) => {
  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired reset token',
    );
  }
};

// Set or update security answers for authenticated user
const setSecurityAnswers = async (
  userId: string,
  answers: [string, string, string],
) => {
  const normalizedAnswers = answers.map(normalizeAnswer);

  const hashedAnswers = await Promise.all(
    normalizedAnswers.map((ans) => bcrypt.hash(ans, SALT_ROUNDS)),
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      securityAnswer1Hash: hashedAnswers[0],
      securityAnswer2Hash: hashedAnswers[1],
      securityAnswer3Hash: hashedAnswers[2],
    },
  });
};

// Get status of security answers (true if set, false if not)
const getSecurityStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  return {
    securityAnswer1Set: !!user.securityAnswer1Hash,
    securityAnswer2Set: !!user.securityAnswer2Hash,
    securityAnswer3Set: !!user.securityAnswer3Hash,
  };
};

export const AuthServices = {
  loginUserFromDB,
  logoutUser,
  refreshAccessToken,
  doesUserExist,
  verifyAnswersAndCreateToken,
  resetPassword,
  setSecurityAnswers,
  getSecurityStatus,
};
