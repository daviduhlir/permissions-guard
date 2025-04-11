import { AsyncLocalStorage } from 'async_hooks'
import { OwnerType, PermissionRule, PermissionsGuardContextMetadata } from '../interfaces'
import { PermissionError, PermissionRuleError } from '../utils/errors'

/**
 * Rights can be specified like paths, basically like entity/write.
 * The last part of the path should be the action, specifying what you can do with the entity.
 * If you have rights like `/`, it means you can do everything.
 */
export class PermissionsGuard {
  /**
   * AsyncLocalStorage to store permission context for the current execution flow.
   */
  protected static contextStorage = new AsyncLocalStorage<PermissionsGuardContextMetadata>()

  /**
   * Decorator to enforce required permissions on a method.
   * @param required Array of required permission rules.
   * @returns A method decorator.
   */
  public static PermissionRequired = (required: PermissionRule[] = []) => {
    return (target: any, memberName: string, descriptor) => {
      const originalFunction = descriptor.value
      descriptor.value = async (...args) => {
        PermissionsGuard.checkRequiredPermissions(required)
        return originalFunction.bind(target)(...args)
      }
    }
  }

  /**
   * Runs a callback within a permission context.
   * @param rules Array of permission rules to set in the context.
   * @param owner Owner of the context.
   * @param callback Callback function to execute within the context.
   * @returns The result of the callback function.
   */
  public static async runWithPermissions<T>(rules: PermissionRule[], owner: OwnerType, callback: () => Promise<T>) {
    return PermissionsGuard.contextStorage.run({ rules, owner }, callback)
  }

  /**
   * Retrieves the current context's permission rules.
   * @returns Array of permission rules or undefined if no context exists.
   */
  public static async getContextRules() {
    return PermissionsGuard.contextStorage.getStore()?.rules
  }

  /**
   * Retrieves the current context's owner.
   * @returns The owner of the current context or null if no context exists.
   */
  public static async getContextOwner(): Promise<OwnerType | null> {
    return PermissionsGuard.contextStorage.getStore()?.owner
  }

  /**
   * Checks if the current context has the required permissions.
   * @param required Array of required permission rules.
   * @throws PermissionError if no context exists or required permissions are not matched.
   */
  public static async checkRequiredPermissions(required: PermissionRule[]) {
    const contextRules = await PermissionsGuard.getContextRules()
    if (!contextRules) {
      throw new PermissionError('Unauthorized')
    }
    await PermissionsGuard.match(required, contextRules)
  }

  /**
   * Checks if the current context's owner matches the specified entity owner.
   * @param entityOwner The owner of the entity to check against.
   * @throws PermissionError if the owners do not match.
   */
  public static async checkRequiredOwner(entityOwner: OwnerType) {
    if (entityOwner !== (await PermissionsGuard.getContextOwner())) {
      throw new PermissionError('Unauthorized owner')
    }
  }

  /****************************
   *
   * Internal methods
   *
   ****************************/

  /**
   * Matches required permission rules against available rules.
   * @param requiredRules Array of required permission rules.
   * @param rules Array of available permission rules.
   * @returns Array of matched rules.
   * @throws PermissionRuleError if any required rules are not matched.
   */
  protected static match(requiredRules: PermissionRule[], rules: PermissionRule[]) {
    const notMatched = []
    const matched = []
    for (const requiredRule of requiredRules) {
      let matchedRule = null
      for (const rule of rules) {
        if (PermissionsGuard.matchRule(requiredRule, rule)) {
          matchedRule = rule
          break
        }
      }
      if (!matchedRule) {
        notMatched.push(requiredRule)
      } else {
        matched.push([requiredRule, matchedRule])
      }
    }

    if (notMatched.length) {
      throw new PermissionRuleError({
        required: requiredRules,
        notMatched,
      })
    }

    return matched
  }

  /**
   * Parses a permission rule into its components.
   * @param rule The permission rule to parse.
   * @returns Array of rule components.
   */
  protected static parseRule(rule: PermissionRule) {
    return rule
      .split(`/`)
      .filter(Boolean)
      .map(i => i.trim())
  }

  /**
   * Matches a single required rule against an available rule.
   * @param requiredRule The required permission rule.
   * @param rule The available permission rule.
   * @returns True if the rules match, false otherwise.
   */
  protected static matchRule(requiredRule: PermissionRule, rule: PermissionRule) {
    const requiredRuleParts = PermissionsGuard.parseRule(requiredRule)
    const ruleParts = PermissionsGuard.parseRule(rule)

    if (requiredRuleParts.length < ruleParts.length) {
      return false
    }

    for (let i = 0; i < ruleParts.length; i++) {
      if (ruleParts[i] !== '*' && ruleParts[i] !== requiredRuleParts[i]) {
        return false
      }
    }

    return true
  }
}
