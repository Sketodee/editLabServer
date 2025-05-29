import { Request, Response, NextFunction } from 'express';

// Extend Request to include the roles property
interface CustomRequest extends Request {
  userType?: number;
}

const verifyRoles = (...allowedRoles: number[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {

    if (req.userType === undefined || req.userType === null) {
      res.sendStatus(401);
      return;
    }

    const rolesArray = [...allowedRoles];

    if (!rolesArray.includes(req.userType)) {
      res.sendStatus(401);
      return;
    }

    next();
  };
};

export default verifyRoles;
