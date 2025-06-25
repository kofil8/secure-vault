import z from 'zod';

const loginUser = z.object({
    email: z
      .string({ required_error: 'Email is required!' })
      .email({ message: 'Invalid email format!' }),
    password: z.string({ required_error: 'Password is required!' }),
});

const refreshToken = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required!' }),
});

export const authValidation = {
  loginUser,
  refreshToken,
};
