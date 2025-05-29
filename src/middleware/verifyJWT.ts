import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Extend Request to include user info
interface CustomRequest extends Request {
  email?: string;
  id?: string;
  userType?: number;
}

interface DecodedToken extends JwtPayload {
  UserInfo: {
    email: string;
    id: string;
    userType: number;
  };
}

const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization || (req.headers.Authorization as string);

if (!authHeader?.startsWith('Bearer ')) {
  res.sendStatus(401);
  console.log('Unauthorized: No Bearer token provided');
  return;
}

  const token = authHeader.split(' ')[1];
  const secret = process.env.ACCESS_TOKEN_SECRET!;

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.sendStatus(403)};
    

    const decodedToken = decoded as DecodedToken;

    req.email = decodedToken.UserInfo.email;
    req.id = decodedToken.UserInfo.id;
    req.userType = decodedToken.UserInfo.userType;

    next();
  });
};

export default verifyJWT;
