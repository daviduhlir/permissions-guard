import { expect } from 'chai'
import { PermissionsGuard, PermissionRuleError } from '../dist'

const ownerPermissions = ['entity/read', 'entity/:ownedEntities/read']
const owner = 'user123'

const ownedEntities = [
  'entity1',
  'entity2',
]

class Test {
  @PermissionsGuard.PermissionRequired(['entity/read'])
  async readEntity(id: string) {
    await PermissionsGuard.checkRequiredPermissions([`entity/${id}/read`])
    // Simulate reading an entity
    return { id, data: 'Some data' }
  }
}

describe('variables', () => {
  it('should allow reading owned entities', async () => {
    const testInstance = new Test()
    await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
      const data1 = await testInstance.readEntity('entity1')
      expect(data1).to.deep.equal({ id: 'entity1', data: 'Some data' })

      const data2 = await testInstance.readEntity('entity2')
      expect(data2).to.deep.equal({ id: 'entity2', data: 'Some data' })
    }, { ownedEntities })
  })

  it('should allow reading newly granted entity with inheritRules', async () => {
    const testInstance = new Test()
    await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
      await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
        const data3 = await testInstance.readEntity('entity3')
        expect(data3).to.deep.equal({ id: 'entity3', data: 'Some data' })
      }, { ownedEntities: ['entity3'] }, true)
    }, { ownedEntities })
  })

  it('should deny access to entity not in ownedEntities', async () => {
    const testInstance = new Test()
    await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
      try {
        await testInstance.readEntity('entityX')
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
      }
    }, { ownedEntities })
  })
})