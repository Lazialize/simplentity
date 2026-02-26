# Simplentity Improvements Design

## Approach

Foundation-first: fix immediate issues, strengthen internals, then add features.

## Phase 1: Immediate Fixes

- **README**: Update usage examples from `get()`/`set()` to dot notation API
- **package.json**: Add `exports` field for conditional ESM/CJS/Bun resolution
- **CI**: Add `bun run build` step to `checking.workflow.yaml`
- **Biome**: Enable VCS integration with `useIgnoreFile: true`

## Phase 2: Internal Improvements

### toJSON() undefined exclusion

`toJSON()` currently returns `#props` as-is, including `undefined` values for optional fields. Change to filter out `undefined` entries so `toJSON()` output matches `JSON.stringify()` behavior.

### Test coverage

Add missing test cases:
- `defaultFn` field with explicit value override
- `notRequired()` + `default()` combination
- Multiple entity classes used simultaneously (config isolation)
- `toJSON()` undefined exclusion verification
- Individual field type tests (`boolean()`, `date()`, `number()`) for function coverage

### props Proxy deferral

Defer `props` Proxy-based change tracking (YAGNI). Phase 3 validation will add runtime type checks on `props` assignment via Proxy set trap instead.

## Phase 3: Validation System

### API

Built-in chainable validators per field type:
```typescript
string().minLength(3).maxLength(100).pattern(/^[a-z]+$/)
number().min(0).max(100).integer()
date().after(new Date("2020-01-01")).before(new Date("2030-01-01"))
```

Custom validators on all fields:
```typescript
string().validate(v => v.startsWith("user_"), "must start with user_")
```

### Execution timing

Validation runs at two points:
1. Entity constructor — validates all fields after default resolution
2. `props` assignment — Proxy set trap validates on mutation

### Error handling

```typescript
class ValidationError extends Error {
  field: string;
  value: unknown;
  rule: string;
}
```

Fail-fast: throws on first validation failure. Bulk error collection deferred (YAGNI).

### Internal structure

Add `validators` array to `Field<T>`. Each field subclass (`StringField`, `NumberField`, etc.) adds type-specific built-in methods. Runtime type checking (`typeof`/`instanceof`) in Proxy set trap.

## Phase 4: New Field Types

### enum_()

```typescript
const role = enum_(["admin", "user", "guest"]);
// Type: "admin" | "user" | "guest"
```

Function named `enum_` (reserved word), exported as `enum`. Auto-validates value membership.

### array()

```typescript
const tags = array(string().minLength(1));
// Type: string[]
```

Inner field validation per element. Built-in: `minItems(n)`, `maxItems(n)`.

### object()

```typescript
const address = object({ street: string(), city: string() });
// Type: { street: string; city: string }
```

Accepts same schema format as `entity()`. Validates nested fields. No Proxy wrapping (plain value object).

### nullable()

```typescript
const bio = nullable(string().maxLength(500));
// Type: string | null
```

Wraps inner field, skips validation when `null`. Distinct from `notRequired()` (`undefined`). Composable: `nullable(string()).notRequired()` → `string | null | undefined`.

### Exports

```typescript
export { entity, string, number, boolean, date, enum_ as enum, array, object, nullable };
```

## Phase 5: Utility Methods

### fromJSON()

Static method on entity classes:
```typescript
const account = Account.fromJSON({ id: 1, name: "test", isActive: true });
```

Auto-converts ISO 8601 strings to `Date` for date fields. Validation runs via constructor.

### equals()

```typescript
a.equals(b); // true
```

Shallow equal for primitives, `getTime()` for `Date`, `JSON.stringify` for `array`/`object` fields. Argument typed to same entity class.

### clone()

```typescript
const copy = original.clone();
```

Creates new instance from `toJSON()` output. Deep copies `array`/`object` fields. Validation re-runs via constructor.
