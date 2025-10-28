/**
 * User entity interface matching PostgreSQL table
 */
export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  firebase_uid?: string;
  role_id: string;
  phone_number?: string;
  is_email_verified?: boolean;
  profile_picture?: string;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IRole {
  id?: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}
