import { z } from 'zod';

const updateProfile = z.object({
  body: z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
  }),
});

const changePassword = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Old password is required' }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'Password must be at least 6 characters long'),
  }),
});

export const profileValidation = {
  updateProfile,
  changePassword,
};
