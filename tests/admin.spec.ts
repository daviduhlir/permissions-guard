import { expect } from 'chai'
import { PermissionsGuard, PermissionError } from '../dist'

describe('Admin', () => {
  const adminRules = ['entity/read', 'entity/write', 'admin/manage']
  const userRules = ['entity/read']
  const owner = 'user123'
  const otherOwner = 'user456'

  it('should allow admin to access entities owned by others', async () => {
    await PermissionsGuard.runWithPermissionsBypassOwner(adminRules, async () => {
      // Admin should be able to access entities owned by others
      await PermissionsGuard.checkRequiredOwner(otherOwner)
    })
  })

  it('should not allow normal user to access entities owned by others', async () => {
    await PermissionsGuard.runWithPermissions(userRules, owner, async () => {
      try {
        // Normal user should not be able to access entities owned by others
        await PermissionsGuard.checkRequiredOwner(otherOwner)
        throw new Error('Expected PermissionError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionError)
        expect(err.message).to.equal('Unauthorized owner')
      }
    })
  })

  it('should allow normal user to access their own entities', async () => {
    await PermissionsGuard.runWithPermissions(userRules, owner, async () => {
      // Normal user should be able to access their own entities
      await PermissionsGuard.checkRequiredOwner(owner)
    })
  })
})