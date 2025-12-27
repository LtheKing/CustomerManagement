/**
 * Response model for seed data operation
 */
export interface SeedDataResponse {
  message: string;
}

/**
 * Response model for connection test
 */
export interface TestConnectionResponse {
  message: string;
  canConnect: boolean;
  timestamp: string;
}

