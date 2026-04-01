// Tipos personalizados para la sesión
// Estos tipos se aplican a través de next-auth

export interface CustomUser {
  id: string;
  email: string;
  name: string;
  rol: string;
}

export interface CustomSession {
  user: CustomUser;
}

// Helper para obtener el usuario de la sesión
export function getUserFromSession(session: unknown): CustomUser | null {
  const s = session as { user?: CustomUser } | null;
  if (!s?.user) return null;
  return {
    id: s.user.id,
    email: s.user.email,
    name: s.user.name,
    rol: s.user.rol,
  };
}
