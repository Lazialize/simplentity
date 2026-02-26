# simplentity

The simplentity is a simple typed entity library.
It provides the implementation of type-safe entities and manipulation.

> [!NOTE]
> I created the library to learn TypeScript and the type system for me.
> So, it may not be suitable for production use.


## Installation
```shell
npm install simplentity
```

## Usage

```typescript
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
```

## Todo
- [x] Add more built-in types (enum_, array, object, nullable)
- [x] Validation (built-in + custom validators)
- [x] Deserialization (fromJSON)
- [x] Entity utilities (equals, clone)
- [ ] Custom field types
- [ ] Custom field serialization
