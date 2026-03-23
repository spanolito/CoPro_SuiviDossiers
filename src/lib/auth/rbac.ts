export type UserRole = 'admin' | 'cs' | 'coproprietaire';

export type Permission =
  | 'dossier.read'
  | 'dossier.create'
  | 'dossier.update'
  | 'dossier.advance'
  | 'dossier.validate'
  | 'dossier.block'
  | 'dossier.comment.internal'
  | 'dossier.document.add'
  | 'dossier.step.add'
  | 'dossier.step.update'
  | 'dossier.delete'
  | 'user.admin'
  | 'settings.update.self'
  | 'settings.update.app'
  | 'workflow.update'
  | 'logbook.read'
  | 'logbook.export'
  | 'logbook.delete';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'dossier.read',
    'dossier.create',
    'dossier.update',
    'dossier.advance',
    'dossier.validate',
    'dossier.block',
    'dossier.comment.internal',
    'dossier.document.add',
    'dossier.step.add',
    'dossier.step.update',
    'dossier.delete',
    'user.admin',
    'settings.update.self',
    'settings.update.app',
    'workflow.update',
    'logbook.read',
    'logbook.export',
    'logbook.delete'
  ],
  cs: [
    'dossier.read',
    'dossier.create',
    'dossier.update',
    'dossier.advance',
    'dossier.comment.internal',
    'dossier.document.add',
    'dossier.step.add',
    'dossier.step.update',
    'settings.update.self'
  ],
  coproprietaire: [
    'dossier.read',
    'settings.update.self'
  ]
};

export function getPermissionsForRole(role: UserRole | string | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as UserRole] || [];
}

export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function assertPermission(role: UserRole | string | undefined, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission non accordée : ${permission}`);
  }
}

export function getDossierCapabilities(role: UserRole | string | undefined) {
  return {
    canRead: hasPermission(role, 'dossier.read'),
    canCreate: hasPermission(role, 'dossier.create'),
    canEdit: hasPermission(role, 'dossier.update'),
    canAdvance: hasPermission(role, 'dossier.advance'),
    canValidate: hasPermission(role, 'dossier.validate'),
    canBlock: hasPermission(role, 'dossier.block'),
    canCommentInternal: hasPermission(role, 'dossier.comment.internal'),
    canAddDocument: hasPermission(role, 'dossier.document.add'),
    canAddStep: hasPermission(role, 'dossier.step.add'),
  };
}
