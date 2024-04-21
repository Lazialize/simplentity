import { Field } from "../field.ts";

class NumberField extends Field<number> {}

export const number = () => {
  return new NumberField();
};
