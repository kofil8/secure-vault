import z from 'zod';

const loginUser = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required!' })
      .email({ message: 'Invalid email format!' }),
    password: z.string({ required_error: 'Password is required!' }),
  }),
});

const refreshToken = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required!' }),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required!' })
      .email({ message: 'Invalid email format!' }),
  }),
});

const verifySecurityAnswers = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required!' })
      .email({ message: 'Invalid email format!' }),
    answers: z
      .array(z.string().min(1, 'Answer cannot be empty'))
      .length(3, 'Exactly 3 answers are required'),
  }),
});

const resetPassword = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: 'New password is required!' })
      .min(6, 'Password must be at least 6 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
        'Password must include uppercase, lowercase, number, and special character',
      ),
  }),
});

const setSecurityAnswers = z.object({
  body: z.object({
    questions: z
      .array(z.string().min(5, 'Question must be at least 5 characters'))
      .length(3, 'Exactly 3 questions are required'),
    answers: z
      .array(z.string().min(1, 'Answer cannot be empty'))
      .length(3, 'Exactly 3 answers are required'),
  }),
});

export const authValidation = {
  loginUser,
  refreshToken,
  forgotPassword,
  verifySecurityAnswers,
  resetPassword,
  setSecurityAnswers,
};
