import { z } from 'zod';

const updateProfile = z.object({
  body: z.object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    // You can include more fields as needed
  }),
});

const changePassword = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: 'Current password is required',
    }),
    newPassword: z.string({ required_error: 'New password is required' }),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format'),
    securityAnswer1: z.string({
      required_error: 'Security answer 1 is required',
    }),
    securityAnswer2: z.string({
      required_error: 'Security answer 2 is required',
    }),
    securityAnswer3: z.string({
      required_error: 'Security answer 3 is required',
    }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format'),
    newPassword: z.string({ required_error: 'New password is required' }),
  }),
});

const updateSecurityAnswers = z.object({
  body: z.object({
    securityAnswer1: z.string({
      required_error: 'Security answer 1 is required',
    }),
    securityAnswer2: z.string({
      required_error: 'Security answer 2 is required',
    }),
    securityAnswer3: z.string({
      required_error: 'Security answer 3 is required',
    }),
  }),
});

export const profileValidation = {
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  updateSecurityAnswers,
};
