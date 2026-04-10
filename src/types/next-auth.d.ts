import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { Rol } from "@prisma/client";

declare module "next-auth" {
  /**
   * Extension of User type to include custom properties
   * The role is optional at authorization time but is added in the JWT callback
   */
  interface User {
    id: string;
    rol?: Rol;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    rol?: Rol;
  }
}
