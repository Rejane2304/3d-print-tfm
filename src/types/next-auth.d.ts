import { DefaultSession } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"
import { Rol } from "@prisma/client"

declare module "next-auth" {
  /**
   * Extensión del tipo User para incluir propiedades personalizadas
   * El rol es opcional en el momento de autorización pero se añade en el callback JWT
   */
  interface User {
    id: string
    rol?: Rol
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      rol: Rol
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    rol?: Rol
  }
}
