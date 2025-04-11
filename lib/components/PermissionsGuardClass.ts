import { AsyncLocalStorage } from 'async_hooks'
import { PermissionRule, PermissionsGuardContextMetadata } from '../interfaces'
import { PermissionError, PermissionRuleError } from '../utils/errors'

const createStorage = () => {
  const storage = new AsyncLocalStorage<{ [key: symbol]: PermissionsGuardContextMetadata<any> }>();
  return {
    run: storage.run.bind(storage),
    getStore: storage.getStore.bind(storage),
  }
}

const storage = createStorage();

/**
 * Rights can be specified like paths, basically like entity/write.
 * The last part of the path should be the action, specifying what you can do with the entity.
 * If you have rights like `/`, it means you can do everything.
 */
export class PermissionsGuardClass<OwnerType = string> {
  private readonly unique = Symbol('PermissionsGuardClassUnique')
  constructor(
    protected readonly ownerChecker: (contextOwner: OwnerType, requestedOwner: OwnerType) => Promise<boolean> = async (
      contextOwner,
      requestedOwner,
    ) => contextOwner === requestedOwner,
  ) {}

  /**
   * Decorator to enforce required permissions on a method.
   * @param required Array of required permission rules.
   * @returns A method decorator.
   */
  public PermissionRequired = (required: PermissionRule[] = []) => {
    return (target: any, memberName: string, descriptor) => {
      const originalFunction = descriptor.value
      descriptor.value = async (...args) => {
        this.checkRequiredPermissions(required)
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
  public async runWithPermissions<T>(rules: PermissionRule[], owner: OwnerType, callback: () => Promise<T>) {
    const context = await this.getContext()
    if (context) {
      throw new Error('Nested permissions context is dangerous, and it is not allowed.')
    }
    return storage.run({
      ...storage.getStore(),
      [this.unique]: { rules, owner }
    }, callback)
  }

  /**
   * Retrieves the current context's permission rules.
   * @returns Array of permission rules or undefined if no context exists.
   */
  public async getContext() {
    return storage.getStore()?.[this.unique]
  }

  /**
   * Checks if the current context has the required permissions.
   * @param required Array of required permission rules.
   * @throws PermissionError if no context exists or required permissions are not matched.
   */
  public async checkRequiredPermissions(required: PermissionRule[]) {
    const context = await this.getContext()
    if (!context) {
      throw new PermissionError('Unauthorized')
    }
    await PermissionsGuardClass.match(required, context?.rules)
  }

  /**
   * Checks if the current context's owner matches the specified entity owner.
   * @param entityOwner The owner of the entity to check against.
   * @throws PermissionError if the owners do not match.
   */
  public async checkRequiredOwner(entityOwner: OwnerType) {
    const context = await this.getContext()
    if (!context) {
      throw new PermissionError('Unauthorized')
    }
    if (!(await this.ownerChecker(context.owner, entityOwner))) {
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
        if (PermissionsGuardClass.matchRule(requiredRule, rule)) {
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
   * @throws PermissionError if the rule contains invalid characters.
   */
  protected static parseRule(rule: PermissionRule) {
    if (typeof rule !== 'string') {
      throw new PermissionError('Permission rule must be a string')
    }

    if (rule?.length > 2048) {
      throw new PermissionError('Permission rule is too long')
    }

    // Check for invalid characters like newlines, tabs, or control characters
    if (/[\n\r\t]/.test(rule)) {
      throw new PermissionError('Invalid characters in permission rule')
    }

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
    const requiredRuleParts = PermissionsGuardClass.parseRule(requiredRule)
    const ruleParts = PermissionsGuardClass.parseRule(rule)

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
