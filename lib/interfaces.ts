export type PermissionRule = string
export type OwnerType = string

export interface PermissionsGuardContextMetadata {
  rules: PermissionRule[];
  owner: OwnerType
}
