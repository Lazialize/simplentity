# Simplentity Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix immediate issues, strengthen internals, add validation system, new field types, and utility methods.

**Architecture:** Foundation-first approach. Phase 1 fixes docs/config. Phase 2 improves toJSON and tests. Phase 3 adds validation via validators array on Field + Proxy set traps. Phase 4 adds enum/array/object/nullable fields. Phase 5 adds fromJSON/equals/clone.

**Tech Stack:** TypeScript, Bun runtime, Biome linter, bun:test

---

### Task 1: Phase 1 — Immediate Fixes

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `.github/workflows/checking.workflow.yaml`
- Modify: `biome.json`

**Step 1: Update README usage examples**

Replace the entire Usage section in `README.md` with current dot-notation API:

```markdown
## Usage

\`\`\`typescript
import { entity, number, string, boolean } from 'simplentity';

// Define a user entity
class User extends entity({
  id: string().defaultFn(() => crypto.randomUUID()),
  name: string(),
  age: number().notRequired(),
  isActive: boolean().default(true),
}) {
  activate(): void {
    this.props.isActive = true;
  }

  deactivate(): void {
    this.props.isActive = false;
  }
}

// Properties that have NotRequired or Default(Fn) are optional.
const user = new User({
  name: 'John Doe',
});

// Access properties via dot notation
const name = user.name; // 'John Doe'
const isActive = user.isActive; // true
\`\`\`
```

Also update the Todo section to reflect what's being implemented:

```markdown
## Todo
- [x] Add more built-in types
- [x] Validation
- [ ] Custom field types
- [ ] Custom field validation
- [ ] Custom field serialization
```

**Step 2: Add `exports` field to `package.json`**

Add after the `"types"` field:

```json
"exports": {
  ".": {
    "bun": "./dist/bun/index.js",
    "import": "./dist/index.js",
    "require": "./dist/cjs/index.js",
    "types": "./dist/index.d.ts"
  }
},
```

**Step 3: Add build step to CI**

Append to `.github/workflows/checking.workflow.yaml` after the "Run tests" step:

```yaml
    - name: Run build
      run: bun run build
```

**Step 4: Enable Biome VCS integration**

In `biome.json`, change `vcs` section to:

```json
"vcs": {
  "enabled": true,
  "clientKind": "git",
  "useIgnoreFile": true
},
```

**Step 5: Run checks**

Run: `bun check && bun test`
Expected: All pass, no regressions.

**Step 6: Commit**

```bash
git add README.md package.json .github/workflows/checking.workflow.yaml biome.json
git commit -m "chore: update README, add exports, CI build step, enable Biome VCS"
```

---

### Task 2: toJSON() Undefined Exclusion

**Files:**
- Modify: `tests/entity.test.ts`
- Modify: `src/entity.ts:77-80`

**Step 1: Write the failing test**

Update the existing serialization test and add a new test in `tests/entity.test.ts`:

```typescript
it("should be able to serialize to JSON", () => {
  const instance = new Account({
    id: 1,
    name: "testName",
    isActive: true,
  });

  expect(JSON.stringify(instance)).toBe(
    '{"id":1,"name":"testName","isActive":true,"level":1,"createdAt":"2024-01-01T00:00:00.000Z"}',
  );
  // toJSON should exclude undefined values (email is notRequired and not provided)
  expect(instance.toJSON()).toEqual({
    id: 1,
    name: "testName",
    isActive: true,
    level: 1,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `toJSON()` currently includes `email: undefined`.

**Step 3: Implement toJSON() change**

In `src/entity.ts`, replace `toJSON()` (lines 77-80):

```typescript
// biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
toJSON(): Partial<EntityConfigTypeResolver<Config>> {
  return Object.fromEntries(
    Object.entries(this.#props as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as Partial<EntityConfigTypeResolver<Config>>;
}
```

**Step 4: Run test to verify it passes**

Run: `bun test`
Expected: All 11 tests PASS.

**Step 5: Commit**

```bash
git add src/entity.ts tests/entity.test.ts
git commit -m "feat: exclude undefined values from toJSON() output"
```

---

### Task 3: Additional Test Coverage

**Files:**
- Modify: `tests/entity.test.ts`

**Step 1: Add missing test cases**

Add these tests inside the existing `describe("Entity", ...)` block:

```typescript
it("should override defaultFn value when explicitly provided", () => {
  const fixedDate = new Date("2025-06-15T00:00:00.000Z");
  const instance = new Account({
    id: 1,
    name: "testName",
    isActive: true,
    createdAt: fixedDate,
  });

  expect(instance.createdAt).toEqual(fixedDate);
});

it("should handle notRequired with default combination", () => {
  class WithOptionalDefault extends entity({
    name: string(),
    nickname: string().notRequired().default("anonymous"),
  }) {}

  const withoutNickname = new WithOptionalDefault({ name: "test" });
  expect(withoutNickname.nickname).toBe("anonymous");

  const withNickname = new WithOptionalDefault({ name: "test", nickname: "nick" });
  expect(withNickname.nickname).toBe("nick");
});

it("should isolate entity config between different entity classes", () => {
  class EntityA extends entity({ x: number() }) {}
  class EntityB extends entity({ y: string() }) {}

  const a = new EntityA({ x: 42 });
  const b = new EntityB({ y: "hello" });

  expect(a.x).toBe(42);
  expect(b.y).toBe("hello");
  expect("y" in a).toBe(false);
  expect("x" in b).toBe(false);
});

it("should create individual field types correctly", () => {
  class AllFields extends entity({
    s: string(),
    n: number(),
    b: boolean(),
    d: date(),
  }) {}

  const instance = new AllFields({ s: "hello", n: 42, b: true, d: new Date("2024-01-01") });
  expect(instance.s).toBe("hello");
  expect(instance.n).toBe(42);
  expect(instance.b).toBe(true);
  expect(instance.d).toEqual(new Date("2024-01-01"));
});
```

**Step 2: Run tests**

Run: `bun test`
Expected: All tests PASS (15 total).

**Step 3: Commit**

```bash
git add tests/entity.test.ts
git commit -m "test: add coverage for defaultFn override, notRequired+default, config isolation, field types"
```

---

### Task 4: Validation Infrastructure

**Files:**
- Create: `src/errors.ts`
- Modify: `src/field.ts`
- Modify: `src/index.ts`
- Create: `tests/validation.test.ts`

**Step 1: Write failing tests for ValidationError and custom validate()**

Create `tests/validation.test.ts`:

```typescript
import { describe, expect, it } from "bun:test";
import { ValidationError, entity, number, string } from "../src";

describe("Validation", () => {
  describe("ValidationError", () => {
    it("should contain field, value, and rule information", () => {
      const error = new ValidationError("name", "", "custom", "must not be empty");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("name");
      expect(error.value).toBe("");
      expect(error.rule).toBe("custom");
      expect(error.message).toBe('Validation failed for field "name": must not be empty');
    });
  });

  describe("Custom validate()", () => {
    it("should throw ValidationError when custom validator fails in constructor", () => {
      class Validated extends entity({
        name: string().validate((v) => (v as string).length > 0, "must not be empty"),
      }) {}

      expect(() => new Validated({ name: "" })).toThrow(ValidationError);
    });

    it("should pass when custom validator succeeds", () => {
      class Validated extends entity({
        age: number().validate((v) => (v as number) >= 0, "must be non-negative"),
      }) {}

      expect(() => new Validated({ age: 5 })).not.toThrow();
      const instance = new Validated({ age: 5 });
      expect(instance.age).toBe(5);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `ValidationError` not exported, `validate()` not defined.

**Step 3: Create `src/errors.ts`**

```typescript
export class ValidationError extends Error {
  field: string;
  value: unknown;
  rule: string;

  constructor(field: string, value: unknown, rule: string, message: string) {
    super(`Validation failed for field "${field}": ${message}`);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    this.rule = rule;
  }
}
```

**Step 4: Add validators to `src/field.ts`**

Add the `Validator` type and update the `Field` class:

```typescript
export type Validator = {
  rule: string;
  fn: (value: unknown) => boolean;
  message: string;
};
```

Add to the `Field` class:
- Property: `validators: Validator[];`
- Initialize in constructor: `this.validators = [];`
- Method:

```typescript
validate(fn: (value: T) => boolean, message?: string): this {
  this.validators.push({
    rule: "custom",
    fn: fn as (value: unknown) => boolean,
    message: message ?? "validation failed",
  });
  return this;
}

getValidators(): Validator[] {
  return this.validators;
}
```

**Step 5: Add constructor validation in `src/entity.ts`**

Import `ValidationError` from `./errors.ts`.

After building `#props` (after line 44, before the Proxy return), add:

```typescript
for (const [key, field] of Object.entries(entityConfig)) {
  const value = (this.#props as Record<string, unknown>)[key];
  if (value === undefined && field.getConfig().notRequired) continue;
  for (const validator of field.getValidators()) {
    if (!validator.fn(value)) {
      throw new ValidationError(key, value, validator.rule, validator.message);
    }
  }
}
```

**Step 6: Update `src/index.ts` exports**

```typescript
import { entity } from "./entity.ts";
import { ValidationError } from "./errors.ts";
import { boolean, date, number, string } from "./fields/index.ts";

export { entity, string, number, boolean, date, ValidationError };
```

**Step 7: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 8: Commit**

```bash
git add src/errors.ts src/field.ts src/entity.ts src/index.ts tests/validation.test.ts
git commit -m "feat: add validation infrastructure with ValidationError and custom validate()"
```

---

### Task 5: Field-Specific Validators + Runtime Type Checks

**Files:**
- Modify: `src/fields/string.ts`
- Modify: `src/fields/number.ts`
- Modify: `src/fields/boolean.ts`
- Modify: `src/fields/date.ts`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing tests for built-in validators**

Add to `tests/validation.test.ts`:

```typescript
describe("String validators", () => {
  it("should validate minLength", () => {
    class T extends entity({ name: string().minLength(3) }) {}
    expect(() => new T({ name: "ab" })).toThrow(ValidationError);
    expect(() => new T({ name: "abc" })).not.toThrow();
  });

  it("should validate maxLength", () => {
    class T extends entity({ name: string().maxLength(5) }) {}
    expect(() => new T({ name: "abcdef" })).toThrow(ValidationError);
    expect(() => new T({ name: "abcde" })).not.toThrow();
  });

  it("should validate pattern", () => {
    class T extends entity({ code: string().pattern(/^[A-Z]+$/) }) {}
    expect(() => new T({ code: "abc" })).toThrow(ValidationError);
    expect(() => new T({ code: "ABC" })).not.toThrow();
  });
});

describe("Number validators", () => {
  it("should validate min", () => {
    class T extends entity({ age: number().min(0) }) {}
    expect(() => new T({ age: -1 })).toThrow(ValidationError);
    expect(() => new T({ age: 0 })).not.toThrow();
  });

  it("should validate max", () => {
    class T extends entity({ score: number().max(100) }) {}
    expect(() => new T({ score: 101 })).toThrow(ValidationError);
    expect(() => new T({ score: 100 })).not.toThrow();
  });

  it("should validate integer", () => {
    class T extends entity({ count: number().integer() }) {}
    expect(() => new T({ count: 1.5 })).toThrow(ValidationError);
    expect(() => new T({ count: 1 })).not.toThrow();
  });
});

describe("Date validators", () => {
  it("should validate after", () => {
    const boundary = new Date("2020-01-01");
    class T extends entity({ d: date().after(boundary) }) {}
    expect(() => new T({ d: new Date("2019-12-31") })).toThrow(ValidationError);
    expect(() => new T({ d: new Date("2020-01-02") })).not.toThrow();
  });

  it("should validate before", () => {
    const boundary = new Date("2030-01-01");
    class T extends entity({ d: date().before(boundary) }) {}
    expect(() => new T({ d: new Date("2030-01-02") })).toThrow(ValidationError);
    expect(() => new T({ d: new Date("2029-12-31") })).not.toThrow();
  });
});

describe("Runtime type checks", () => {
  it("should reject wrong types at runtime", () => {
    class T extends entity({ name: string() }) {}
    // @ts-expect-error testing runtime check
    expect(() => new T({ name: 123 })).toThrow(ValidationError);
  });

  it("should reject wrong number type at runtime", () => {
    class T extends entity({ age: number() }) {}
    // @ts-expect-error testing runtime check
    expect(() => new T({ age: "not a number" })).toThrow(ValidationError);
  });

  it("should reject wrong boolean type at runtime", () => {
    class T extends entity({ active: boolean() }) {}
    // @ts-expect-error testing runtime check
    expect(() => new T({ active: "yes" })).toThrow(ValidationError);
  });

  it("should reject wrong date type at runtime", () => {
    class T extends entity({ d: date() }) {}
    // @ts-expect-error testing runtime check
    expect(() => new T({ d: "2024-01-01" })).toThrow(ValidationError);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test`
Expected: FAIL — `minLength`, `min`, `after` etc. not defined.

**Step 3: Implement StringField validators**

Replace `src/fields/string.ts`:

```typescript
import { Field } from "../field.ts";

class StringField extends Field<string> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "string",
      message: "must be a string",
    });
  }

  minLength(n: number): this {
    this.validators.push({
      rule: "minLength",
      fn: (v: unknown) => (v as string).length >= n,
      message: `must be at least ${n} characters`,
    });
    return this;
  }

  maxLength(n: number): this {
    this.validators.push({
      rule: "maxLength",
      fn: (v: unknown) => (v as string).length <= n,
      message: `must be at most ${n} characters`,
    });
    return this;
  }

  pattern(regex: RegExp): this {
    this.validators.push({
      rule: "pattern",
      fn: (v: unknown) => regex.test(v as string),
      message: `must match pattern ${regex}`,
    });
    return this;
  }
}

export const string = () => {
  return new StringField();
};
```

**Step 4: Implement NumberField validators**

Replace `src/fields/number.ts`:

```typescript
import { Field } from "../field.ts";

class NumberField extends Field<number> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "number",
      message: "must be a number",
    });
  }

  min(n: number): this {
    this.validators.push({
      rule: "min",
      fn: (v: unknown) => (v as number) >= n,
      message: `must be at least ${n}`,
    });
    return this;
  }

  max(n: number): this {
    this.validators.push({
      rule: "max",
      fn: (v: unknown) => (v as number) <= n,
      message: `must be at most ${n}`,
    });
    return this;
  }

  integer(): this {
    this.validators.push({
      rule: "integer",
      fn: (v: unknown) => Number.isInteger(v as number),
      message: "must be an integer",
    });
    return this;
  }
}

export const number = () => {
  return new NumberField();
};
```

**Step 5: Implement BooleanField type check**

Replace `src/fields/boolean.ts`:

```typescript
import { Field } from "../field.ts";

class BooleanField extends Field<boolean> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "boolean",
      message: "must be a boolean",
    });
  }
}

export const boolean = () => {
  return new BooleanField();
};
```

**Step 6: Implement DateField validators**

Replace `src/fields/date.ts`:

```typescript
import { Field } from "../field.ts";

class DateField extends Field<Date> {
  constructor() {
    super();
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => v instanceof Date,
      message: "must be a Date",
    });
  }

  after(boundary: Date): this {
    this.validators.push({
      rule: "after",
      fn: (v: unknown) => (v as Date).getTime() > boundary.getTime(),
      message: `must be after ${boundary.toISOString()}`,
    });
    return this;
  }

  before(boundary: Date): this {
    this.validators.push({
      rule: "before",
      fn: (v: unknown) => (v as Date).getTime() < boundary.getTime(),
      message: `must be before ${boundary.toISOString()}`,
    });
    return this;
  }
}

export const date = () => {
  return new DateField();
};
```

**Step 7: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 8: Lint check**

Run: `bun check`
Expected: No errors.

**Step 9: Commit**

```bash
git add src/fields/ tests/validation.test.ts
git commit -m "feat: add built-in validators and runtime type checks for all field types"
```

---

### Task 6: Props Proxy Validation

**Files:**
- Modify: `src/entity.ts:73-75`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing test for props assignment validation**

Add to `tests/validation.test.ts`:

```typescript
describe("Props assignment validation", () => {
  it("should validate when setting props via custom method", () => {
    class Validated extends entity({
      name: string().minLength(3),
    }) {
      changeName(name: string) {
        this.props.name = name;
      }
    }

    const instance = new Validated({ name: "valid" });
    expect(() => instance.changeName("ab")).toThrow(ValidationError);
    expect(instance.name).toBe("valid"); // unchanged after failed validation
  });

  it("should allow valid props assignment", () => {
    class Validated extends entity({
      name: string().minLength(3),
    }) {
      changeName(name: string) {
        this.props.name = name;
      }
    }

    const instance = new Validated({ name: "valid" });
    instance.changeName("also valid");
    expect(instance.name).toBe("also valid");
  });

  it("should skip validation for undefined on notRequired fields", () => {
    class Validated extends entity({
      email: string().notRequired().minLength(3),
    }) {
      clearEmail() {
        this.props.email = undefined;
      }
    }

    const instance = new Validated({ email: "test@test.example" });
    expect(() => instance.clearEmail()).not.toThrow();
    expect(instance.email).toBeUndefined();
  });

  it("should validate runtime types on props assignment", () => {
    class Validated extends entity({
      name: string(),
    }) {
      setNameBad() {
        // @ts-expect-error testing runtime check
        this.props.name = 123;
      }
    }

    const instance = new Validated({ name: "valid" });
    expect(() => instance.setNameBad()).toThrow(ValidationError);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — props assignment doesn't validate.

**Step 3: Implement props Proxy**

In `src/entity.ts`, add a new private field and modify the constructor and props getter.

Add field declaration after `#props`:

```typescript
#propsProxy: EntityConfigTypeResolver<Config>;
```

In the constructor, after the validation loop and before the outer Proxy return, add:

```typescript
this.#propsProxy = new Proxy(this.#props as Record<string, unknown>, {
  set: (target, prop, value) => {
    if (typeof prop === "string" && prop in this.#entityConfig) {
      const field = this.#entityConfig[prop];
      if (!(value === undefined && field.getConfig().notRequired)) {
        for (const validator of field.getValidators()) {
          if (!validator.fn(value)) {
            throw new ValidationError(String(prop), value, validator.rule, validator.message);
          }
        }
      }
    }
    target[prop as string] = value;
    return true;
  },
}) as EntityConfigTypeResolver<Config>;
```

Change the `props` getter to return the proxy:

```typescript
protected get props(): EntityConfigTypeResolver<Config> {
  return this.#propsProxy;
}
```

Update `toJSON()` to use `#props` directly (not the proxy):

```typescript
// biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
toJSON(): Partial<EntityConfigTypeResolver<Config>> {
  return Object.fromEntries(
    Object.entries(this.#props as Record<string, unknown>).filter(([, v]) => v !== undefined),
  ) as Partial<EntityConfigTypeResolver<Config>>;
}
```

**Step 4: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/entity.ts tests/validation.test.ts
git commit -m "feat: add props Proxy validation on assignment"
```

---

### Task 7: enum_() Field

**Files:**
- Create: `src/fields/enum.ts`
- Modify: `src/fields/index.ts`
- Modify: `src/index.ts`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing tests**

Add to `tests/validation.test.ts`:

```typescript
import { ValidationError, entity, enum_, number, string, boolean, date } from "../src";

describe("EnumField", () => {
  it("should accept valid enum values", () => {
    class T extends entity({ role: enum_(["admin", "user", "guest"]) }) {}
    const instance = new T({ role: "admin" });
    expect(instance.role).toBe("admin");
  });

  it("should reject invalid enum values", () => {
    class T extends entity({ role: enum_(["admin", "user", "guest"]) }) {}
    // @ts-expect-error testing invalid value
    expect(() => new T({ role: "superadmin" })).toThrow(ValidationError);
  });

  it("should reject non-string values", () => {
    class T extends entity({ role: enum_(["admin", "user"]) }) {}
    // @ts-expect-error testing runtime type check
    expect(() => new T({ role: 123 })).toThrow(ValidationError);
  });

  it("should work with notRequired", () => {
    class T extends entity({ role: enum_(["admin", "user"]).notRequired() }) {}
    const instance = new T({});
    expect(instance.role).toBeUndefined();
  });

  it("should work with default", () => {
    class T extends entity({ role: enum_(["admin", "user"]).default("user") }) {}
    const instance = new T({});
    expect(instance.role).toBe("user");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `enum_` not exported.

**Step 3: Create `src/fields/enum.ts`**

```typescript
import { Field } from "../field.ts";

class EnumField<T extends string> extends Field<T> {
  readonly #values: readonly T[];

  constructor(values: readonly T[]) {
    super();
    this.#values = values;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "string",
      message: "must be a string",
    });
    this.validators.push({
      rule: "enum",
      fn: (v: unknown) => (this.#values as readonly string[]).includes(v as string),
      message: `must be one of: ${values.join(", ")}`,
    });
  }
}

// biome-ignore lint/style/useNamingConvention: enum is a reserved word, enum_ is the convention
export const enum_ = <const T extends readonly string[]>(values: T) => {
  return new EnumField<T[number]>([...values]);
};
```

**Step 4: Update exports**

In `src/fields/index.ts`, add:

```typescript
import { enum_ } from "./enum.ts";
export { string, number, boolean, date, enum_ };
```

In `src/index.ts`, add `enum_` to imports and exports:

```typescript
import { entity } from "./entity.ts";
import { ValidationError } from "./errors.ts";
import { boolean, date, enum_, number, string } from "./fields/index.ts";

export { entity, string, number, boolean, date, enum_, ValidationError };
```

**Step 5: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/fields/enum.ts src/fields/index.ts src/index.ts tests/validation.test.ts
git commit -m "feat: add enum_() field type"
```

---

### Task 8: array() Field

**Files:**
- Create: `src/fields/array.ts`
- Modify: `src/fields/index.ts`
- Modify: `src/index.ts`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing tests**

Add to `tests/validation.test.ts`:

```typescript
import { ..., array } from "../src";

describe("ArrayField", () => {
  it("should accept valid arrays", () => {
    class T extends entity({ tags: array(string()) }) {}
    const instance = new T({ tags: ["a", "b"] });
    expect(instance.tags).toEqual(["a", "b"]);
  });

  it("should reject non-array values", () => {
    class T extends entity({ tags: array(string()) }) {}
    // @ts-expect-error testing runtime type check
    expect(() => new T({ tags: "not an array" })).toThrow(ValidationError);
  });

  it("should validate each element against inner field", () => {
    class T extends entity({ tags: array(string().minLength(2)) }) {}
    expect(() => new T({ tags: ["ab", "a"] })).toThrow(ValidationError);
    expect(() => new T({ tags: ["ab", "cd"] })).not.toThrow();
  });

  it("should validate minItems", () => {
    class T extends entity({ tags: array(string()).minItems(2) }) {}
    expect(() => new T({ tags: ["a"] })).toThrow(ValidationError);
    expect(() => new T({ tags: ["a", "b"] })).not.toThrow();
  });

  it("should validate maxItems", () => {
    class T extends entity({ tags: array(string()).maxItems(2) }) {}
    expect(() => new T({ tags: ["a", "b", "c"] })).toThrow(ValidationError);
    expect(() => new T({ tags: ["a", "b"] })).not.toThrow();
  });

  it("should work with notRequired", () => {
    class T extends entity({ tags: array(string()).notRequired() }) {}
    const instance = new T({});
    expect(instance.tags).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `array` not exported.

**Step 3: Create `src/fields/array.ts`**

```typescript
import type { Field } from "../field.ts";
import { Field as FieldClass } from "../field.ts";

class ArrayField<T> extends FieldClass<T[]> {
  readonly #innerField: Field<T>;

  constructor(innerField: Field<T>) {
    super();
    this.#innerField = innerField;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => Array.isArray(v),
      message: "must be an array",
    });
    this.validators.push({
      rule: "elements",
      fn: (v: unknown) => {
        const arr = v as unknown[];
        const innerValidators = this.#innerField.getValidators();
        return arr.every((item) => innerValidators.every((validator) => validator.fn(item)));
      },
      message: "array element validation failed",
    });
  }

  minItems(n: number): this {
    this.validators.push({
      rule: "minItems",
      fn: (v: unknown) => (v as unknown[]).length >= n,
      message: `must have at least ${n} items`,
    });
    return this;
  }

  maxItems(n: number): this {
    this.validators.push({
      rule: "maxItems",
      fn: (v: unknown) => (v as unknown[]).length <= n,
      message: `must have at most ${n} items`,
    });
    return this;
  }
}

export const array = <T>(innerField: Field<T>) => {
  return new ArrayField<T>(innerField);
};
```

Note: The import of `Field` needs both the type import and the value import because `Field` is used as a type for `innerField` and as a base class. If Biome complains about the double import, use a single combined import: `import { Field } from "../field.ts";`

**Step 4: Update exports**

In `src/fields/index.ts`, add `array` import/export.
In `src/index.ts`, add `array` import/export.

**Step 5: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/fields/array.ts src/fields/index.ts src/index.ts tests/validation.test.ts
git commit -m "feat: add array() field type"
```

---

### Task 9: object() Field

**Files:**
- Create: `src/fields/object.ts`
- Modify: `src/fields/index.ts`
- Modify: `src/index.ts`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing tests**

Add to `tests/validation.test.ts`:

```typescript
import { ..., object } from "../src";

describe("ObjectField", () => {
  it("should accept valid objects", () => {
    class T extends entity({ address: object({ street: string(), city: string() }) }) {}
    const instance = new T({ address: { street: "123 Main", city: "NYC" } });
    expect(instance.address).toEqual({ street: "123 Main", city: "NYC" });
  });

  it("should reject non-object values", () => {
    class T extends entity({ address: object({ street: string() }) }) {}
    // @ts-expect-error testing runtime type check
    expect(() => new T({ address: "not an object" })).toThrow(ValidationError);
  });

  it("should validate nested fields", () => {
    class T extends entity({ address: object({ zip: string().minLength(5) }) }) {}
    expect(() => new T({ address: { zip: "123" } })).toThrow(ValidationError);
    expect(() => new T({ address: { zip: "12345" } })).not.toThrow();
  });

  it("should work with notRequired", () => {
    class T extends entity({ address: object({ street: string() }).notRequired() }) {}
    const instance = new T({});
    expect(instance.address).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `object` not exported.

**Step 3: Create `src/fields/object.ts`**

```typescript
import type { Field } from "../field.ts";
import { Field as FieldClass } from "../field.ts";

type ObjectSchema = { [key: string]: Field<unknown> };
type ResolveObjectSchema<T extends ObjectSchema> = {
  [K in keyof T]: T[K] extends Field<infer U> ? U : never;
};

class ObjectField<T extends ObjectSchema> extends FieldClass<ResolveObjectSchema<T>> {
  readonly #schema: T;

  constructor(schema: T) {
    super();
    this.#schema = schema;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v),
      message: "must be an object",
    });
    this.validators.push({
      rule: "schema",
      fn: (v: unknown) => {
        const obj = v as Record<string, unknown>;
        for (const [key, field] of Object.entries(this.#schema)) {
          const value = obj[key];
          if (value === undefined && field.getConfig().notRequired) continue;
          for (const validator of field.getValidators()) {
            if (!validator.fn(value)) return false;
          }
        }
        return true;
      },
      message: "object schema validation failed",
    });
  }
}

export const object = <T extends ObjectSchema>(schema: T) => {
  return new ObjectField<T>(schema);
};
```

**Step 4: Update exports**

In `src/fields/index.ts`, add `object` import/export.
In `src/index.ts`, add `object` import/export.

**Step 5: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/fields/object.ts src/fields/index.ts src/index.ts tests/validation.test.ts
git commit -m "feat: add object() field type"
```

---

### Task 10: nullable() Field

**Files:**
- Create: `src/fields/nullable.ts`
- Modify: `src/fields/index.ts`
- Modify: `src/index.ts`
- Modify: `tests/validation.test.ts`

**Step 1: Write failing tests**

Add to `tests/validation.test.ts`:

```typescript
import { ..., nullable } from "../src";

describe("NullableField", () => {
  it("should accept null values", () => {
    class T extends entity({ bio: nullable(string()) }) {}
    const instance = new T({ bio: null });
    expect(instance.bio).toBeNull();
  });

  it("should accept valid non-null values", () => {
    class T extends entity({ bio: nullable(string()) }) {}
    const instance = new T({ bio: "hello" });
    expect(instance.bio).toBe("hello");
  });

  it("should validate non-null values against inner field", () => {
    class T extends entity({ bio: nullable(string().minLength(3)) }) {}
    expect(() => new T({ bio: "ab" })).toThrow(ValidationError);
    expect(() => new T({ bio: null })).not.toThrow();
    expect(() => new T({ bio: "abc" })).not.toThrow();
  });

  it("should work with notRequired", () => {
    class T extends entity({ bio: nullable(string()).notRequired() }) {}
    const withNull = new T({ bio: null });
    expect(withNull.bio).toBeNull();
    const withUndefined = new T({});
    expect(withUndefined.bio).toBeUndefined();
  });

  it("should reject wrong types that are not null", () => {
    class T extends entity({ bio: nullable(string()) }) {}
    // @ts-expect-error testing runtime type check
    expect(() => new T({ bio: 123 })).toThrow(ValidationError);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `nullable` not exported.

**Step 3: Create `src/fields/nullable.ts`**

```typescript
import type { Field } from "../field.ts";
import { Field as FieldClass } from "../field.ts";

class NullableField<T> extends FieldClass<T | null> {
  constructor(innerField: Field<T>) {
    super();
    const innerValidators = innerField.getValidators();
    for (const v of innerValidators) {
      this.validators.push({
        rule: v.rule,
        fn: (value: unknown) => value === null || v.fn(value),
        message: v.message,
      });
    }
  }
}

export const nullable = <T>(innerField: Field<T>) => {
  return new NullableField<T>(innerField);
};
```

**Step 4: Update exports**

In `src/fields/index.ts`, add `nullable` import/export.
In `src/index.ts`, add `nullable` import/export.

**Step 5: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/fields/nullable.ts src/fields/index.ts src/index.ts tests/validation.test.ts
git commit -m "feat: add nullable() field type"
```

---

### Task 11: fromJSON()

**Files:**
- Modify: `src/field.ts`
- Modify: `src/fields/date.ts`
- Modify: `src/fields/array.ts`
- Modify: `src/fields/object.ts`
- Modify: `src/fields/nullable.ts`
- Modify: `src/entity.ts`
- Create: `tests/utilities.test.ts`

**Step 1: Write failing tests**

Create `tests/utilities.test.ts`:

```typescript
import { beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import { array, boolean, date, entity, nullable, number, object, string } from "../src";

describe("fromJSON", () => {
  beforeAll(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  it("should create an entity from a plain JSON object", () => {
    class Account extends entity({
      id: number(),
      name: string(),
      isActive: boolean(),
    }) {}

    const account = Account.fromJSON({ id: 1, name: "test", isActive: true });
    expect(account.id).toBe(1);
    expect(account.name).toBe("test");
    expect(account.isActive).toBe(true);
  });

  it("should convert ISO date strings to Date objects", () => {
    class T extends entity({
      createdAt: date(),
    }) {}

    const instance = T.fromJSON({ createdAt: "2024-01-01T00:00:00.000Z" });
    expect(instance.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    expect(instance.createdAt).toBeInstanceOf(Date);
  });

  it("should handle nested date conversion in arrays", () => {
    class T extends entity({
      dates: array(date()),
    }) {}

    const instance = T.fromJSON({ dates: ["2024-01-01T00:00:00.000Z", "2024-06-15T00:00:00.000Z"] });
    expect(instance.dates[0]).toBeInstanceOf(Date);
    expect(instance.dates[1]).toBeInstanceOf(Date);
  });

  it("should handle nested date conversion in objects", () => {
    class T extends entity({
      meta: object({ createdAt: date(), updatedAt: date() }),
    }) {}

    const instance = T.fromJSON({
      meta: { createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-06-15T00:00:00.000Z" },
    });
    expect(instance.meta.createdAt).toBeInstanceOf(Date);
  });

  it("should handle nullable date conversion", () => {
    class T extends entity({
      deletedAt: nullable(date()),
    }) {}

    const withDate = T.fromJSON({ deletedAt: "2024-01-01T00:00:00.000Z" });
    expect(withDate.deletedAt).toBeInstanceOf(Date);

    const withNull = T.fromJSON({ deletedAt: null });
    expect(withNull.deletedAt).toBeNull();
  });

  it("should apply defaults for missing fields", () => {
    class T extends entity({
      name: string(),
      level: number().default(1),
    }) {}

    const instance = T.fromJSON({ name: "test" });
    expect(instance.level).toBe(1);
  });

  it("should run validation on fromJSON input", () => {
    class T extends entity({
      name: string().minLength(3),
    }) {}

    expect(() => T.fromJSON({ name: "ab" })).toThrow();
  });

  it("should work with subclasses that have custom methods", () => {
    class Account extends entity({
      id: number(),
      name: string(),
    }) {
      greet(): string {
        return `Hello, ${this.name}`;
      }
    }

    const account = Account.fromJSON({ id: 1, name: "test" });
    expect(account.id).toBe(1);
    // fromJSON via subclass constructor creates a proper subclass instance
    expect((account as unknown as Account).greet()).toBe("Hello, test");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `fromJSON` not defined.

**Step 3: Add `fromJSON()` to Field base class**

In `src/field.ts`, add method to `Field`:

```typescript
// biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
fromJSON(value: unknown): T {
  return value as T;
}
```

**Step 4: Override `fromJSON()` in DateField**

In `src/fields/date.ts`, add method to `DateField`:

```typescript
// biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
override fromJSON(value: unknown): Date {
  if (typeof value === "string") return new Date(value);
  if (value instanceof Date) return value;
  return value as Date;
}
```

**Step 5: Override `fromJSON()` in ArrayField**

In `src/fields/array.ts`, add method to `ArrayField`. Store `#innerField` and use it:

```typescript
// biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
override fromJSON(value: unknown): T[] {
  if (!Array.isArray(value)) return value as T[];
  return value.map((v) => this.#innerField.fromJSON(v));
}
```

**Step 6: Override `fromJSON()` in ObjectField**

In `src/fields/object.ts`, add method to `ObjectField`:

```typescript
// biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
override fromJSON(value: unknown): ResolveObjectSchema<T> {
  if (typeof value !== "object" || value === null) return value as ResolveObjectSchema<T>;
  const result = { ...value } as Record<string, unknown>;
  for (const [key, field] of Object.entries(this.#schema)) {
    if (key in result) {
      result[key] = field.fromJSON(result[key]);
    }
  }
  return result as ResolveObjectSchema<T>;
}
```

**Step 7: Override `fromJSON()` in NullableField**

In `src/fields/nullable.ts`, store the inner field and add override:

```typescript
readonly #innerField: Field<T>;

constructor(innerField: Field<T>) {
  super();
  this.#innerField = innerField;
  // ... existing validator code
}

// biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
override fromJSON(value: unknown): T | null {
  if (value === null) return null;
  return this.#innerField.fromJSON(value);
}
```

**Step 8: Add static `fromJSON()` to entity factory**

In `src/entity.ts`, modify the `entity()` function. Replace the class expression with a named one and add the static method:

```typescript
export const entity = <Config extends EntityConfig>(fields: Config) => {
  class EntityClass extends Entity<typeof fields> {
    constructor(props: EntityPropInputResolver<Config>) {
      super(props, fields);
    }

    // biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
    static fromJSON(
      this: new (props: EntityPropInputResolver<Config>) => EntityInstance<Config>,
      json: Record<string, unknown>,
    ): EntityInstance<Config> {
      const converted: Record<string, unknown> = {};
      for (const [key, field] of Object.entries(fields)) {
        if (key in json) {
          converted[key] = field.fromJSON(json[key]);
        }
      }
      return new this(converted as EntityPropInputResolver<Config>);
    }
  }

  return EntityClass as unknown as (new (
    props: EntityPropInputResolver<Config>,
  ) => EntityInstance<Config>) & {
    // biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
    fromJSON(json: Record<string, unknown>): EntityInstance<Config>;
  };
};
```

**Step 9: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 10: Commit**

```bash
git add src/field.ts src/fields/date.ts src/fields/array.ts src/fields/object.ts src/fields/nullable.ts src/entity.ts tests/utilities.test.ts
git commit -m "feat: add fromJSON() for deserialization with Date auto-conversion"
```

---

### Task 12: equals() + clone()

**Files:**
- Modify: `src/entity.ts`
- Modify: `tests/utilities.test.ts`

**Step 1: Write failing tests**

Add to `tests/utilities.test.ts`:

```typescript
describe("equals", () => {
  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    email: string().notRequired(),
    level: number().default(1),
    createdAt: date().defaultFn(() => new Date()),
  }) {}

  it("should return true for equal entities", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 1, name: "test", isActive: true });
    expect(a.equals(b)).toBe(true);
  });

  it("should return false for different entities", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 2, name: "other", isActive: false });
    expect(a.equals(b)).toBe(false);
  });

  it("should handle optional fields correctly", () => {
    const a = new Account({ id: 1, name: "test", isActive: true, email: "a@b.com" });
    const b = new Account({ id: 1, name: "test", isActive: true });
    expect(a.equals(b)).toBe(false);
  });

  it("should compare Date values by time", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 1, name: "test", isActive: true });
    // Both have same defaultFn date (frozen system time)
    expect(a.equals(b)).toBe(true);
  });

  it("should compare array and object fields deeply", () => {
    class T extends entity({
      tags: array(string()),
      meta: object({ key: string() }),
    }) {}

    const a = new T({ tags: ["a", "b"], meta: { key: "v" } });
    const b = new T({ tags: ["a", "b"], meta: { key: "v" } });
    const c = new T({ tags: ["a", "c"], meta: { key: "v" } });

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("clone", () => {
  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    level: number().default(1),
    createdAt: date().defaultFn(() => new Date()),
  }) {
    changeName(name: string) {
      this.props.name = name;
    }
  }

  it("should create an equal copy", () => {
    const original = new Account({ id: 1, name: "test", isActive: true });
    const copy = original.clone();
    expect(original.equals(copy)).toBe(true);
  });

  it("should create an independent copy", () => {
    const original = new Account({ id: 1, name: "test", isActive: true });
    const copy = original.clone();
    (copy as unknown as Account).changeName("changed");
    expect(original.name).toBe("test");
    expect(copy.name).toBe("changed");
  });

  it("should deep copy arrays and objects", () => {
    class T extends entity({
      tags: array(string()),
    }) {
      addTag(tag: string) {
        this.props.tags = [...this.props.tags, tag];
      }
    }

    const original = new T({ tags: ["a"] });
    const copy = original.clone();
    (copy as unknown as T).addTag("b");
    expect(original.tags).toEqual(["a"]);
    expect(copy.tags).toEqual(["a", "b"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test`
Expected: FAIL — `equals` and `clone` not defined.

**Step 3: Add `equals()` to Entity class**

In `src/entity.ts`, add inside the `Entity` class (after `toJSON`):

```typescript
equals(other: EntityInstance<Config>): boolean {
  const a = this.toJSON() as Record<string, unknown>;
  const b = (other as unknown as Entity<Config>).toJSON() as Record<string, unknown>;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const valA = a[key];
    const valB = b[key];
    if (valA instanceof Date && valB instanceof Date) {
      if (valA.getTime() !== valB.getTime()) return false;
    } else if (typeof valA === "object" && valA !== null) {
      if (JSON.stringify(valA) !== JSON.stringify(valB)) return false;
    } else {
      if (valA !== valB) return false;
    }
  }
  return true;
}
```

**Step 4: Add `clone()` to Entity class**

In `src/entity.ts`, add after `equals`:

```typescript
clone(): EntityInstance<Config> {
  const json = JSON.parse(JSON.stringify(this.toJSON())) as Record<string, unknown>;
  const entityWithFromJSON = this.constructor as unknown as {
    // biome-ignore lint/style/useNamingConvention: fromJSON matches toJSON convention
    fromJSON(json: Record<string, unknown>): EntityInstance<Config>;
  };
  return entityWithFromJSON.fromJSON(json);
}
```

**Step 5: Update EntityInstance type**

Make sure `equals` and `clone` are visible on `EntityInstance`. They should already be via `Omit<Entity<Config>, "props">`, but verify that the type includes them.

**Step 6: Run tests**

Run: `bun test`
Expected: All tests PASS.

**Step 7: Run full check**

Run: `bun check && bun test`
Expected: All pass.

**Step 8: Commit**

```bash
git add src/entity.ts tests/utilities.test.ts
git commit -m "feat: add equals() and clone() utility methods"
```

---

### Task 13: Final Verification

**Step 1: Run full test suite**

Run: `bun test`
Expected: All tests PASS across all test files.

**Step 2: Run linter**

Run: `bun check`
Expected: No errors.

**Step 3: Run build**

Run: `bun run build`
Expected: Build succeeds for ESM, CJS, and Bun targets.

**Step 4: Verify exports**

Check that all new exports are available from the built package by reviewing `dist/index.d.ts`.

**Step 5: Update README Todo section**

Mark completed items in `README.md`:

```markdown
## Todo
- [x] Add more built-in types (enum_, array, object, nullable)
- [x] Validation (built-in + custom validators)
- [x] Deserialization (fromJSON)
- [x] Entity utilities (equals, clone)
- [ ] Custom field types
- [ ] Custom field serialization
```

**Step 6: Final commit**

```bash
git add README.md
git commit -m "docs: update README with completed features"
```
