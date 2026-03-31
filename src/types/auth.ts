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
export function getUserFromSession(session: any): CustomUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    rol: session.user.rol,
  };
}
