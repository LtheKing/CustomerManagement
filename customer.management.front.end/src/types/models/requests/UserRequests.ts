import { User } from "../User";

/**
 * Request model for user login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response model for user login
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  user: User | null;
}

