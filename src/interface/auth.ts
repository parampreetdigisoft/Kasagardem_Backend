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
export interface AppleJwtPayload {
  sub: string;
  email?: string;
  email_verified?: string;
  auth_time?: number;
  nonce?: string;
  nonce_supported?: boolean;
  c_hash?: string;
}