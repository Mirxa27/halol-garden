import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { UserType } from "@prisma/client"

export async function getSession() {
  const session = await auth()
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  
  return user
}

export async function requireRole(allowedRoles: UserType[]) {
  const user = await getCurrentUser()
  
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  
  if (!allowedRoles.includes(user.role as UserType)) {
    return new NextResponse("Forbidden", { status: 403 })
  }
  
  return user
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === UserType.ADMIN
}

export async function isSupplier() {
  const user = await getCurrentUser()
  return user?.role === UserType.EQUIPMENT_SUPPLIER
}

export async function isHealthcareProvider() {
  const user = await getCurrentUser()
  return user?.role === UserType.HEALTHCARE_PROVIDER
}

export async function isCustomerService() {
  const user = await getCurrentUser()
  return user?.role === UserType.CUSTOMER_SERVICE
}