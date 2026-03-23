import { NextResponse } from 'next/server'

export enum Role {
  ADMIN = 'ADMIN',
  CS_MEMBER = 'CS_MEMBER',
  COPROPRIETAIRE = 'COPROPRIETAIRE',
}

export enum Permission {
  SETTINGS_READ_SELF = 'SETTINGS_READ_SELF',
  SETTINGS_UPDATE_SELF = 'SETTINGS_UPDATE_SELF',
  SETTINGS_READ_APP = 'SETTINGS_READ_APP',
  SETTINGS_UPDATE_APP = 'SETTINGS_UPDATE_APP',
  WORKFLOW_READ = 'WORKFLOW_READ',
  WORKFLOW_UPDATE = 'WORKFLOW_UPDATE',
  LOGBOOK_READ = 'LOGBOOK_READ',
  LOGBOOK_EXPORT = 'LOGBOOK_EXPORT',
  LOGBOOK_DELETE = 'LOGBOOK_DELETE',
}

const ROLE_MAPPING: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.SETTINGS_READ_SELF,
    Permission.SETTINGS_UPDATE_SELF,
    Permission.SETTINGS_READ_APP,
    Permission.SETTINGS_UPDATE_APP,
    Permission.WORKFLOW_READ,
    Permission.WORKFLOW_UPDATE,
    Permission.LOGBOOK_READ,
    Permission.LOGBOOK_EXPORT,
    Permission.LOGBOOK_DELETE,
  ],
  [Role.CS_MEMBER]: [
    Permission.SETTINGS_READ_SELF,
    Permission.SETTINGS_UPDATE_SELF,
    Permission.SETTINGS_READ_APP,
    Permission.WORKFLOW_READ,
  ],
  [Role.COPROPRIETAIRE]: [
    Permission.SETTINGS_READ_SELF,
    Permission.SETTINGS_UPDATE_SELF,
  ],
}

/**
 * Maps the session payload role to the strict Role enum.
 */
function mapRole(roleStr: string | undefined): Role {
  if (!roleStr) return Role.COPROPRIETAIRE
  const r = roleStr.toLowerCase()
  if (r === 'admin' || r === 'president_cs') return Role.ADMIN
  if (r === 'cs' || r === 'membre_cs') return Role.CS_MEMBER
  return Role.COPROPRIETAIRE
}

export function hasPermission(user: { role?: string } | null | undefined, permission: Permission): boolean {
  if (!user) return false
  const mappedRole = mapRole(user.role)
  return ROLE_MAPPING[mappedRole].includes(permission)
}

export function requirePermission(user: { role?: string } | null | undefined, permission: Permission) {
  if (!hasPermission(user, permission)) {
    const error = new Error('Accès interdit - 403')
    // We can attach a status property for handlers to catch
    ;(error as any).status = 403
    throw error
  }
}
