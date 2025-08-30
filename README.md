# Permissions Guard

`PermissionsGuard` is a utility for managing and enforcing permission rules in an application. It provides a flexible way to define, check, and enforce permissions using `AsyncLocalStorage` to maintain context for the current execution flow. This package is ideal for applications that require fine-grained access control.

## Features

- Define and enforce permission rules.
- Run code within a permission context.
- Validate ownership of entities.
- Decorators for enforcing permissions on methods.
- Flexible rule matching with wildcard and hierarchical path support.

## Permission Rules

Permission rules are defined as hierarchical paths, similar to file system paths. This allows for fine-grained control over permissions. For example:

- `*`: Matches any single segment of a rule (e.g., `entity/*` matches `entity/read` but not `entity/sub/read`).
- `**`: Matches zero or more segments of a rule (e.g., `entity/**` matches `entity/read`, `entity/sub/read`, and `entity`).
- `/`: Matches only when no specific permissions are required (disabled for security reasons in most cases).
- `entity`: Matches only the exact `entity` rule.
- `entity/*`: Matches any single action under `entity`, such as `entity/read` or `entity/write`.
- `entity/**`: Matches all actions and sub-actions under `entity`, such as `entity/read`, `entity/write`, or `entity/sub/action`.

### Wildcard Support

Wildcard rules allow for flexible matching:

- `*`: Matches exactly one segment of a rule.
- `**`: Matches zero or more segments of a rule.

### Examples

```typescript
const rules = ['entity/*', 'entity/**', 'admin/**']

await PermissionsGuard.runWithPermissions(rules, 'user123', async () => {
  await PermissionsGuard.checkRequiredPermissions(['entity/read']) // Matches 'entity/*'
  await PermissionsGuard.checkRequiredPermissions(['entity/sub/read']) // Matches 'entity/**'
  await PermissionsGuard.checkRequiredPermissions(['admin/manage']) // Matches 'admin/**'

  try {
    await PermissionsGuard.checkRequiredPermissions(['otherEntity/action']) // Does NOT match
  } catch (err) {
    console.error('Permission denied for otherEntity/action') // Expected behavior
  }
})
```

## Installation

Install the package using npm or yarn:

```bash
npm install @david.uhlir/permissions-guard
# or
yarn add @david.uhlir/permissions-guard
```

## Usage

### Basic Example

```typescript
import { PermissionsGuard } from '@david.uhlir/permissions-guard'

// Define permission rules
const rules = ['entity/read', 'entity/write']
const owner = 'user123'

// Run a function within a permission context
await PermissionsGuard.runWithPermissions(rules, owner, async () => {
  // Check if the current context has the required permissions
  await PermissionsGuard.checkRequiredPermissions(['entity/read'])

  // Check if the current context's owner matches a specific owner
  await PermissionsGuard.checkRequiredOwner('user123')

  console.log('Permissions validated successfully!')
})
```

### Using the `@PermissionRequired` Decorator

```typescript
import { PermissionsGuard } from '@david.uhlir/permissions-guard'

class ExampleService {
  @PermissionsGuard.PermissionRequired(['entity/write'])
  async updateEntity() {
    console.log('Entity updated!')
  }
}

// Run the method within a permission context
await PermissionsGuard.runWithPermissions(['entity/write'], 'user123', async () => {
  const service = new ExampleService()
  await service.updateEntity() // This will succeed
})
```

### Rule Matching with Wildcards and Hierarchical Paths

Permission rules support wildcards (`*`) and hierarchical paths for flexible matching:

```typescript
const rules = ['entity/*'] // Grants all permissions under "entity"

await PermissionsGuard.runWithPermissions(rules, 'user123', async () => {
  await PermissionsGuard.checkRequiredPermissions(['entity/read']) // Matches
  await PermissionsGuard.checkRequiredPermissions(['entity/write']) // Matches
  try {
    await PermissionsGuard.checkRequiredPermissions(['otherEntity/action']) // Does NOT match
  } catch (err) {
    console.error('Permission denied for otherEntity/action') // Expected behavior
  }
})
```

### Using rule parameters

Permissions can also use context variables. Its useful for checking ownership of entities.

Example:
```typescript
// Define permission rules
const ownerPermissions = ['entity/read', 'entity/:ownedEntities/read']
const owner = 'user123'

const ownedEntities = [
  'entity1',
  'entity2',
]

// Run a function within a permission context
await PermissionsGuard.runWithPermissions(ownerPermissions, owner, async () => {
  const readingId = 'entity1'
  await PermissionsGuard.checkRequiredPermissions([`entity/${readingId}/read`])
}, { ownedEntities } )
```

## API Documentation

### `PermissionsGuard`

#### `PermissionRequired(required: PermissionRule[])`

A decorator to enforce required permissions on a method.

- **Parameters**:
  - `required` (PermissionRule[]): Array of required permission rules.
- **Usage**:
  ```typescript
  @PermissionsGuard.PermissionRequired(['entity/write'])
  async updateEntity() {
    // ...
  }
  ```

#### `runWithPermissions<T>(rules: PermissionRule[], owner: OwnerType, callback: () => Promise<T>, variables: Record<string, string[]> = {}, inheritRule?: boolean): Promise<T>`

Runs a callback within a permission context.

- **Parameters**:
  - `rules` (PermissionRule[]): Array of permission rules to set in the context.
  - `owner` (OwnerType): Owner of the context.
  - `callback` (Function): Callback function to execute within the context.
  - `variables` Context variables that can be used in rules
  - `inheritRule` Allows nested rules to extend actual context
- **Returns**: The result of the callback function.

#### `runWithPermissionsBypassOwner<T>(rules: PermissionRule[], callback: () => Promise<T>, variables: Record<string, string[]> = {}): Promise<T>`

Runs a callback within an administrative permission context. This allows access to entities or actions that are typically restricted to administrators.

- **Parameters**:
  - `rules` (PermissionRule[]): Array of permission rules to set in the context.
  - `callback` (Function): Callback function to execute within the administrative context.
  - `variables` Context variables that can be used in rules
- **Returns**: The result of the callback function.

- **Example**:
  ```typescript
  const adminRules = ['entity/read', 'entity/write', 'admin/manage']

  await PermissionsGuard.runWithPermissionsBypassOwner(adminRules, async () => {
    // Admin can access restricted resources
    await PermissionsGuard.checkRequiredPermissions(['admin/manage'])
    await PermissionsGuard.checkRequiredOwner('user456') // Admin can access entities owned by others
  })
  ```

#### `getContext(): PermissionsGuardContextMetadata<OwnerType> | undefined`

Retrieves the current permission context, including both the rules and the owner.

- **Returns**: An object containing the current context's permission rules and owner, or `undefined` if no context exists.

- **Example**:
  ```typescript
  const context = PermissionsGuard.getContext()
  if (context) {
    console.log('Rules:', context.rules)
    console.log('Owner:', context.owner)
  } else {
    console.log('No context exists.')
  }

#### `checkRequiredPermissions(required: PermissionRule[]): Promise<void>`

Checks if the current context has the required permissions.

- **Parameters**:
  - `required` (PermissionRule[]): Array of required permission rules.
- **Throws**: `PermissionError` if no context exists or required permissions are not matched.

#### `checkRequiredOwner(entityOwner: OwnerType): Promise<void>`

Checks if the current context's owner matches the specified entity owner.

- **Parameters**:
  - `entityOwner` (OwnerType): The owner of the entity to check against.
- **Throws**: `PermissionError` if the owners do not match.

## Error Handling

### `PermissionError`

Thrown when a user is unauthorized or lacks the required permissions.

### `PermissionRuleError`

Thrown when required permission rules are not matched.

- **Details**:
  - `required`: Array of required rules.
  - `notMatched`: Array of unmatched rules.

## License

This package is licensed under the MIT License.
