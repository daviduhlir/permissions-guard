import { PermissionRule } from '../interfaces'

/**
 * Error thrown when required permission rules are not matched.
 */
export class PermissionRuleError extends Error {
  /**
   * @param details Details about the required and unmatched rules.
   * @param message Error message.
   */
  constructor(
    public readonly details: {
      required: PermissionRule[]
      notMatched: PermissionRule[]
    },
    public readonly message: string = 'Permissions denied',
  ) {
    super(`${message}${details.notMatched.length ? ` [missing rules: ${details.notMatched.join(', ')}]` : ``}`)
    const actualProto = new.target.prototype
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      ;(this as any).__proto__ = actualProto
    }
  }
}

/**
 * Error thrown when a user is unauthorized.
 */
export class PermissionError extends Error {
  /**
   * @param message Error message.
   */
  constructor(public readonly message: string = 'Permissions denied') {
    super(`${message}`)
    const actualProto = new.target.prototype
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto)
    } else {
      ;(this as any).__proto__ = actualProto
    }
  }
}
