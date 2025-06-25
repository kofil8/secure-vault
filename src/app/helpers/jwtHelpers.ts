import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

const generateToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expiresIn: string,
): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: expiresIn,
  };

  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};

export const jwtHelpers = {
  generateToken,
  verifyToken,
};
