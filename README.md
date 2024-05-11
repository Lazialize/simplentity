# simplentity

The simplentity is a simple typed entity library.
It provides the implementation of type-safe entities and manipulation.

> [!NOTE]
> I created the library to learn Typescript and the type system for me.
> So, it may not be suitable for production use.


## Installation
Coming soon...

## Usage

```typescript
import {entity, number, string, boolean} from 'simplentity';

// Define a user entity
class User extends entity({
  id: string().defaultFn(() => randomUUID()), // randomUUID is a third-party library. Not included.
  name: string(),
  age: number().notRequired(),
  isActive: boolean().default(true),
}) {
  activate(): void {
    // You can get suggestions for the properties of the entity.
    this.set('isActive', true);
  }
  
  deactivate(): void {
    this.set('isActive', false);
  }
}

// Properties that have NotRequired or Default(Fn) are optional.
// If a property has a default value, it is automatically assigned to the property when you create the entity instance.
const user = new User({
  name: 'John Doe',
})
/*
{
  id: 'd02daa87-3984-4c6f-be9b-a13a478354b5',
  name: 'John Doe',
  isActive: true,
}
*/

// You can get property values via the get method.
// Of course, you can get suggestions for the properties of the entity.
const name = user.get('name'); // 'John Doe'
```

## Todo
- [ ] Add more built-in types
- [ ] Validation
- [ ] JSON serialization
- [ ] Custom field types
- [ ] Custom field validation
- [ ] Custom field serialization