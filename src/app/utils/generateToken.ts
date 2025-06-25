import jwt, { Secret } from 'jsonwebtoken';

export const generateToken = (
  payload: {
    id: string;
    email: string;
  },
  secret: Secret,
  expiresIn: string,
) => {
  const token = jwt.sign({ id: payload.id, email: payload.email }, secret, {
    expiresIn: expiresIn,
    algorithm: 'HS256' as jwt.Algorithm,
  });
  return token;
};
