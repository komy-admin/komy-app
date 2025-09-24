/**
 * Route mappings for different user roles
 * Centralized to ensure consistency across the app
 */

export const HOME_ROUTES = {
  server: '/(server)',
  admin: '/(admin)',
  superadmin: '/(admin)', // Superadmin uses admin routes
  chef: '/(cook)',
  manager: '/(admin)',   // Manager uses admin routes
  barman: '/(barman)',
} as const;


export type ProtectedRoutes = {
  server: string[];
  admin: string[];
  superadmin: string[];
  chef: string[];
  manager: string[];
  barman: string[];
};

export const PROTECTED_ROUTES = {
  server: ['(server)'],
  admin: ['(admin)'],
  superadmin: ['(admin)'],
  chef: ['(cook)'],
  manager: ['(admin)'],
  barman: ['(barman)'],
} as ProtectedRoutes;

export const LOGIN_ROUTE = '/login';

export type UserRole = keyof typeof HOME_ROUTES;

/**
 * Get the home route for a given user role
 * @param role - The user's role
 * @returns The appropriate home route
 */
export function getHomeRoute(role?: string | null): string {
  if (!role) return HOME_ROUTES.server;
  return HOME_ROUTES[role as UserRole] || HOME_ROUTES.server;
}