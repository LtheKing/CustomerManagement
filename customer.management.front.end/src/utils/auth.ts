/**
 * Authentication and authorization utilities
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * Get current user's role
 */
export const getUserRole = (): string | null => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Check if user has a specific role
 */
export const hasRole = (requiredRoles: string[]): boolean => {
  const userRole = getUserRole();
  return userRole ? requiredRoles.includes(userRole) : false;
};

/**
 * Check if user is Admin
 */
export const isAdmin = (): boolean => {
  return hasRole(["Admin"]);
};

/**
 * Check if user is Sales (SalesManager or SalesRep)
 */
export const isSales = (): boolean => {
  return hasRole(["SalesManager", "SalesRep"]);
};

/**
 * Check if user can access a specific feature
 */
export const canAccess = (feature: string): boolean => {
  const role = getUserRole();
  
  if (!role) return false;
  
  // Admin can access everything
  if (role === "Admin") return true;
  
  // Sales can only access Cashier
  if (isSales()) {
    return feature === "cashier";
  }
  
  return false;
};

