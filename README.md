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
import {createEntity, number, string, boolean} from 'simplentity';

// Define a user entity
const userFactory = createEntity({
  id: string().defaultFn(() => randomUUID()), // randomUUID is a third-party library. Not included.
  name: string(),
  age: number().notRequired(),
  isActive: boolean().default(true),
}, ({ set }) => ({
  activate: () => {
    // You can get suggestions for the properties of the entity.
    set('isActive', true)
  },
  deactivate: () => {
    set('isActive', false)
  }
}))

// Properties that have NotRequired or Default(Fn) are optional.
// If a property has a default value, it is automatically assigned to the property when you create the entity instance.
const user = userFactory.create({
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
- [ ] Custom field types
- [ ] Custom field validation
- [ ] Custom field serialization