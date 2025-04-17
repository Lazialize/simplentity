import { Field } from "../field.ts";

class ArrayField<T> extends Field<T[]> {}

/**
 * Create a new array field
 */
export const array = <T>() => {
  return new ArrayField<T>();
};
