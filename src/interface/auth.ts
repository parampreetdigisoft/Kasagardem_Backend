import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: JwtPayload | string | unknown;
}

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  userEmail: string;
  role: string;
}

export interface AuthUserPayload {
  userEmail?: string;
  role?: string;
}
