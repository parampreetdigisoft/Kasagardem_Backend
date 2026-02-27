import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface csvUser {
  // ── Identity ──────────────────────────────────────────────
  /** Legal or trade name of the business. */
  company_name?: string;

  /** Primary contact email. Required — used as a unique identifier during import. */
  email: string;

  // ── Classification ────────────────────────────────────────
  /** Business category (e.g. "Electrician", "Plumber"). */
  category?: string;

  /** Short description of the professional or service offered. */
  description?: string;

  // ── Location ──────────────────────────────────────────────
  city?: string;
  state?: string;
  address?: string;

  /**
   * Decimal latitude (-90 to 90).
   * Must be a finite number; NaN / Infinity are not valid.
   */
  latitude?: number;

  /**
   * Decimal longitude (-180 to 180).
   * Must be a finite number; NaN / Infinity are not valid.
   */
  longitude?: number;

  // ── Contact ───────────────────────────────────────────────
  /** Local phone number (no strict format — validated downstream). */
  telefone?: string;

  /** WhatsApp-enabled number. */
  whatsapp?: string;

  /** Full URL including protocol, e.g. "https://example.com". */
  website?: string;

  /** Instagram handle without "@", e.g. "mybusiness". */
  instagram?: string;

  // ── Ratings ───────────────────────────────────────────────
  /**
   * Aggregate rating score (0.00 – 5.00).
   * Stored as NUMERIC(3,2) in the DB — values outside this range will fail insertion.
   */
  assessment?: number;

  /** Total number of ratings received. Must be a non-negative integer. */
  num_avaliacoes?: number;

  /** Source that verified this profile (e.g. "Google", "Manual"). */
  verified_source?: string;

  // ── Import Metadata ───────────────────────────────────────
  /**
   * 1-based row number from the source CSV.
   * Never persisted to the DB — used only for error reporting during import.
   */
  __rowNumber?: number;
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

export interface ProfessionalProfileResponse {
    id: string;
    companyName: string | null;
    email: string | null;
    category: string | null;
    description: string | null;

    location: {
        city: string | null;
        state: string | null;
        address: string | null;
        latitude: number | null;
        longitude: number | null;
    };

    contact: {
        telefone: string | null;
        whatsapp: string | null;
        website: string | null;
        instagram: string | null;
    };

    ratings: {
        assessment: number | null;
        numAvaliacoes: number;
    };

    verifiedSource: string | null;
    createdAt: Date;
    updatedAt: Date;
}