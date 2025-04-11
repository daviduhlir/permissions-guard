import { expect } from 'chai'
import { PermissionsGuard, PermissionRuleError } from '../dist'

describe('Parallel', () => {
  const owner1 = 'user123'
  const owner2 = 'user456'

  it('should isolate contexts in parallel operations', async () => {
    const rules1 = ['entity/read']
    const rules2 = ['entity/write']

    await Promise.all([
      PermissionsGuard.runWithPermissions(rules1, owner1, async () => {
        // Check permissions for the first context
        await PermissionsGuard.checkRequiredPermissions(['entity/read'])
        try {
          await PermissionsGuard.checkRequiredPermissions(['entity/write'])
          throw new Error('Expected PermissionError was not thrown')
        } catch (err) {
          expect(err).to.be.instanceOf(PermissionRuleError)
          expect(err.message).to.equal('Permissions denied')
        }
      }),
      PermissionsGuard.runWithPermissions(rules2, owner2, async () => {
        // Check permissions for the second context
        await PermissionsGuard.checkRequiredPermissions(['entity/write'])
        try {
          await PermissionsGuard.checkRequiredPermissions(['entity/read'])
          throw new Error('Expected PermissionError was not thrown')
        } catch (err) {
          expect(err).to.be.instanceOf(PermissionRuleError)
          expect(err.message).to.equal('Permissions denied')
        }
      }),
    ])
  })
})