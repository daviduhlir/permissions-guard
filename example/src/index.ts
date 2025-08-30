import { PermissionsGuard } from '@david.uhlir/permissions-guard'

// Define permission rules
const ownerPermissions = ['entity/read', 'entity/:ownedEntities/read']
const owner = 'user123'

const ownedEntities = [
  'entity1',
  'entity2',
  //'entity3'
]

class Test {
  @PermissionsGuard.PermissionRequired(['entity/read'])
  async readEntity(id: string) {
    await PermissionsGuard.checkRequiredPermissions([`entity/${id}/read`])
    // Simulate reading an entity
    return { id, data: 'Some data' }
  }
}


async function main() {
  const testInstance = new Test()

  // Run a function within a permission context
  await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {

    const data = await testInstance.readEntity('entity1')
    console.log('Permissions validated successfully!', data)

    const data2 = await testInstance.readEntity('entity2')
    console.log('Permissions validated successfully!', data2)

    // grant this access here
    await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
      const data3 = await testInstance.readEntity('entity3')
      console.log('Permissions validated successfully!', data3)
    }, { ownedEntities: ['entity3'] }, true)


  }, { ownedEntities } )
}

main()
