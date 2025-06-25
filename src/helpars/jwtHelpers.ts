import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

const generateToken = (
  payload: object,
  secret: Secret,
  expiresIn: number,
): string => {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn });
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = { generateToken, verifyToken };
