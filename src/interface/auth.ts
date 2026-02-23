import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface csvUser {
  name: string;
  category: string;
  description: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  website?: string;
  __rowNumber?: number; // optional, for error reporting
}

export interface responseProfessional  extends csvUser {
  id: string;
  created_at: string;
  updated_at: string;
}
// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: JwtPayload | string | unknown;
  professional?: csvUser[];
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