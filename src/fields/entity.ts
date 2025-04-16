import { Field } from "../field.ts";

class EntityField<T> extends Field<T> {}

export const entity = <T>() => {
  return new EntityField<T>();
};
