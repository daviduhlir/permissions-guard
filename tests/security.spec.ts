import { expect } from 'chai'
import { PermissionsGuard, PermissionError, PermissionRuleError } from '../dist'

describe('Security', () => {
  const owner = 'user123'

  it('should not allow directory traversal-like patterns to escalate permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using directory traversal-like pattern
        await PermissionsGuard.checkRequiredPermissions(['entity/../../admin'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow wildcard abuse to escalate permissions', async () => {
    const rules = ['entity/*']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule outside the allowed scope
        await PermissionsGuard.checkRequiredPermissions(['admin'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow special characters to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using special characters
        await PermissionsGuard.checkRequiredPermissions(['entity/!@#$%^&*()'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow encoded patterns to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using URL-encoded patterns
        await PermissionsGuard.checkRequiredPermissions(['entity/%2E%2E%2Fadmin'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow case-insensitive matching to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule with different casing
        await PermissionsGuard.checkRequiredPermissions(['ENTITY/READ'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow partial matches to escalate permissions', async () => {
    const rules = ['entity/read']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule that partially matches an allowed rule
        await PermissionsGuard.checkRequiredPermissions(['entity/re'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow context to be broken by setTimeout', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10)) // Simulate async delay
      await PermissionsGuard.checkRequiredPermissions(['entity/read']) // Should still work
    })
  })
})

describe('Security - Escaped Characters', () => {
  const owner = 'user123'

  it('should not allow escaped characters to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using escaped characters
        await PermissionsGuard.checkRequiredPermissions(['entity/\\read'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow Unicode escape sequences to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using Unicode escape sequences
        await PermissionsGuard.checkRequiredPermissions(['entity/\u0061dmin']) // 'admin' in Unicode
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })

  it('should not allow newline or tab characters to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using newline or tab characters
        await PermissionsGuard.checkRequiredPermissions(['entity/\nread'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionError)
        expect(err.message).to.include('Invalid characters in permission rule')
      }

      try {
        await PermissionsGuard.checkRequiredPermissions(['entity/\twrite'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionError)
        expect(err.message).to.include('Invalid characters in permission rule')
      }
    })
  })

  it('should not allow mixed escaped and normal characters to bypass permissions', async () => {
    const rules = ['entity/read', 'entity/write']

    await PermissionsGuard.runWithPermissions(rules, owner, async () => {
      try {
        // Attempt to access a rule using mixed escaped and normal characters
        await PermissionsGuard.checkRequiredPermissions(['entity/re\\ad'])
        throw new Error('Expected PermissionRuleError was not thrown')
      } catch (err) {
        expect(err).to.be.instanceOf(PermissionRuleError)
        expect(err.message).to.include('Permissions denied')
      }
    })
  })
})