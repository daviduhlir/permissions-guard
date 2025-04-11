export type PermissionRule = string

export interface PermissionsGuardContextMetadata<OwnerType> {
  rules: PermissionRule[]
  owner: OwnerType
}
