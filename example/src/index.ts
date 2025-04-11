import { PermissionsGuard } from '@david.uhlir/permissions-guard'

// Define permission rules
const rules = ['entity/read', 'entity/write']
const owner = 'user123'

async function main() {
  // Run a function within a permission context
  await PermissionsGuard.runWithPermissions(rules, owner, async () => {
    // Check if the current context has the required permissions
    await PermissionsGuard.checkRequiredPermissions(['entity/read'])

    // Check if the current context's owner matches a specific owner
    await PermissionsGuard.checkRequiredOwner('user123')

    console.log('Permissions validated successfully!')
  })
}

main()
