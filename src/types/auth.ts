// Custom types for the session
// These types are applied through next-auth

export interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CustomSession {
  user: CustomUser;
}

// Helper to get user from session
export function getUserFromSession(session: unknown): CustomUser | null {
  const s = session as { user?: CustomUser } | null;
  if (!s?.user) {
    return null;
  }
  return {
    id: s.user.id,
    email: s.user.email,
    name: s.user.name,
    role: s.user.role,
  };
}
