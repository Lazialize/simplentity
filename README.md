# Simplentity

A lightweight, type-safe entity factory for TypeScript and JavaScript. Define your domain entities with strongly-typed properties, default values, and optional fields—then get full IntelliSense for creating, reading, and updating your entity instances.

## **Installation**

```bash
npm install simplentity
# or
yarn add simplentity
```

## **Quickstart**

```ts
import { createEntity, number, string, boolean } from 'simplentity';
import { randomUUID } from 'crypto'; // or any UUID library

// 1. Define your entity shape and methods:
const userFactory = createEntity(
  {
    id:       string().defaultFn(() => randomUUID()), // auto-generated UUID
    name:     string(),                               // required string
    age:      number().notRequired(),                 // optional number
    isActive: boolean().default(true),                // defaults to true
  },
  ({ set }) => ({
    activate: () => {
      set('isActive', true);
    },
    deactivate: () => {
      set('isActive', false);
    }
  })
);

// 2. Create an instance — properties with `.notRequired()` or defaults are optional:
const user = userFactory.create({ name: 'John Doe' });

console.log(user.toJSON());
// {
//   id: 'd02daa87-3984-4c6f-be9b-a13a478354b5',
//   name: 'John Doe',
//   isActive: true
// }

// 3. Read and update properties with full type safety:
const currentName = user.get('name');    // type: string
user.set('age', 30);                     // set optional age
user.deactivate();                       // custom method flips isActive to false
console.log(user.get('isActive'));       // false
```

## **API Reference**

### **`createEntity`**

Creates an entity factory function that allows defining fields and optional methods for an entity. The returned factory provides a `create` method to instantiate entities with the specified fields and methods, while also supporting default values and runtime property manipulation.

#### **Type Parameters**
- `C`: The configuration type for the entity fields.
- `D`: The type of the methods defined for the entity.

#### **Parameters**
1. **`fields`**:  
   An object defining the fields of the entity. Each field should include its configuration and a method to retrieve its default value.  
   **Type**: `{ [key: string]: Field<unknown> }`

2. **`methodDefinitionFunction`** *(optional)*:  
   A function that defines additional methods for the entity. It receives an object with `set` and `get` functions to manipulate the entity's properties.  
   **Type**:  
   ```ts
   (params: {
     set: <K extends keyof C>(key: K, value: EntityConfigTypeResolver<C>[K]) => void;
     get: <K extends keyof C>(key: K) => EntityConfigTypeResolver<C>[K];
   }) => D
   ```

#### **Returns**
An object with a `create` method. The `create` method accepts an input object to initialize the entity's properties and returns an entity instance with the defined fields, methods, and utility functions (`get`, `set`, `toJSON`).

#### **Example**
```typescript
const userFactory = createEntity(
  {
    name: string(),
    age: number().default(18),
    isActive: boolean().default(true),
  },
  ({ set, get }) => ({
    incrementAge: () => set("age", get("age") + 1),
  })
);

const user = userFactory.create({ name: "John" });
console.log(user.toJSON()); // { name: "John", age: 18, isActive: true }
user.incrementAge();
console.log(user.get("age")); // 19
```

---

### **Field Types**

#### **`string()`**
Creates a string field.  
**Returns**: `Field<string>`

#### **`number()`**
Creates a number field.  
**Returns**: `Field<number>`

#### **`boolean()`**
Creates a boolean field.  
**Returns**: `Field<boolean>`

#### **`date()`**
Creates a date field.  
**Returns**: `Field<Date>`

#### **`entity<T>()`**
Creates an entity field that references another entity.  
**Returns**: `Field<T>`

#### **`array<T>()`**
Creates an array field.  
**Returns**: `Field<T[]>`

---

### **Field Methods**

All fields inherit the following methods:

#### **`.notRequired()`**
Marks the field as optional.  
**Returns**: `Field<T>`

#### **`.default(value: T)`**
Sets a default value for the field.  
**Returns**: `Field<T>`

#### **`.defaultFn(fn: () => T)`**
Sets a default value for the field using a function.  
**Returns**: `Field<T>`

---

### **Entity Instance Methods**

Entities created by `createEntity` have the following methods:

#### **`.get(key: string)`**
Retrieves the value of a property.  
**Parameters**:  
- `key`: The property name.  
**Returns**: The value of the property.

#### **`.toJSON()`**
Serializes the entity to a plain object.  
**Returns**: `{ [key: string]: any }`
