import { expect } from 'chai'
import { PermissionsGuard, PermissionError, PermissionRuleError } from '../dist'

describe('Basics', () => {
  const rules = ['entity/read', 'entity/write']
  const owner = 'user123'

  it('should throw an error when called outside of a permissions context', async () => {
    try {
      await PermissionsGuard.checkRequiredPermissions(['entity/read'])
      throw new Error('Expected PermissionError was not thrown')
    } catch (err) {
      expect(err).to.be.instanceOf(PermissionError)
      expect(err.message).to.equal('Unauthorized')
    }
  })

  it('should validate permissions within a context', async () => {
    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      await PermissionsGuard.checkRequiredPermissions(['entity/read'])
    })
  })

  it('should throw an error if required permissions are not matched', async () => {
    try {
      await PermissionsGuard.runWithPermissions(rules, owner, async () => {
        await PermissionsGuard.checkRequiredPermissions(['entity/delete'])
      })
      throw new Error('Expected PermissionRuleError was not thrown')
    } catch (err) {
      expect(err).to.be.instanceOf(PermissionRuleError)
      expect(err.message).to.include('Permissions denied')
      expect(err.details.notMatched).to.include('entity/delete')
    }
  })

  it('should validate hierarchical permissions (e.g., entity includes entity/write)', async () => {
    await PermissionsGuard.runWithPermissions(['entity/*'], owner, async () => {
      await PermissionsGuard.checkRequiredPermissions(['entity/write'])
    })
  })

  it('should throw an error if owner does not match', async () => {
    try {
      await PermissionsGuard.runWithPermissions(rules, owner, async () => {
        await PermissionsGuard.checkRequiredOwner('user456')
      })
      throw new Error('Expected PermissionError was not thrown')
    } catch (err) {
      expect(err).to.be.instanceOf(PermissionError)
      expect(err.message).to.equal('Unauthorized owner')
    }
  })

  it('should validate owner correctly', async () => {
    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      await PermissionsGuard.checkRequiredOwner('user123')
    })
  })

  it('should throw an error when nested permissions context is attempted', async () => {
    try {
      await PermissionsGuard.runWithPermissions(rules, owner, async () => {
        await PermissionsGuard.runWithPermissions(rules, owner, async () => {
          // This should not be reached
        })
      })
      throw new Error('Expected Error was not thrown')
    } catch (err) {
      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.equal('Nested permissions context is dangerous, and it is not allowed.')
    }
  })
})