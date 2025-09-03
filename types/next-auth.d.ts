import { UserType } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role: UserType
    }
  }

  interface User {
    role: UserType
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserType
  }
}