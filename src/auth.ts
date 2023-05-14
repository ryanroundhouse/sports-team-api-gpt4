import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secrtufjklas';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const validatePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: {
  id: number;
  role: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'No token provided.' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    return res.status(401).send({ message: 'Token error.' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).send({ message: 'Malformatted token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded === undefined) {
      return res.status(401).send({ message: 'Invalid token.' });
    }

    const decodedJwt = decoded as jwt.JwtPayload; // Type-cast decoded to JwtPayload

    req.userId = decodedJwt.id;
    req.userRole = decodedJwt.role;

    return next();
  });
};

export const authorize = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.userRole !== role) {
      return res
        .status(403)
        .send({ message: 'Forbidden. You do not have the required role.' });
    }

    return next();
  };
};
