import { cookies } from 'next/headers'
import { verifyToken } from '../auth'
import { assertPermission, Permission, getDossierCapabilities } from './rbac'

/**
 * Récupère l'utilisateur connecté depuis les cookies
 * @throws {Error} si non authentifié ou token invalide
 */
export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  
  const payload = await verifyToken(token)
  if (!payload) throw new Error('Token invalide')
  
  return payload
}

/**
 * Vérifie que l'utilisateur est authentifié ET possède la permission
 * @throws {Error} si refusé
 */
export async function requirePermission(permission: Permission) {
  const payload = await requireAuth()
  assertPermission(payload.role as string, permission)
  return payload
}

/**
 * Racourci pour récupérer les capacités d'un dossier basé sur l'auth
 */
export async function getAuthCapabilities() {
  const payload = await requireAuth()
  return getDossierCapabilities(payload.role as string)
}
