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

/**
 * Request model for creating a user
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

/**
 * Request model for updating a user
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

