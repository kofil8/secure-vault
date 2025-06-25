import { NextFunction, Request, RequestHandler, Response } from 'express';

type CustomRequest = Request & { user?: { id: string; email: string } };

const catchAsync = (
  fn: (req: CustomRequest, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req as CustomRequest, res, next).catch(next);
  };
};

export default catchAsync;
