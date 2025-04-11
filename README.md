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

- `/` grants all permissions.
- `entity` grants permissions for all actions under `entity`, such as `entity/read` or `entity/write`.
- `entity/write` grants permission only for the specific action `write` under `entity`.

Additionally, wildcard (`*`) support allows for flexible matching:

- `entity/*` grants all permissions under `entity`.

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

#### `runWithPermissions<T>(rules: PermissionRule[], owner: OwnerType, callback: () => Promise<T>): Promise<T>`

Runs a callback within a permission context.

- **Parameters**:
  - `rules` (PermissionRule[]): Array of permission rules to set in the context.
  - `owner` (OwnerType): Owner of the context.
  - `callback` (Function): Callback function to execute within the context.
- **Returns**: The result of the callback function.

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
