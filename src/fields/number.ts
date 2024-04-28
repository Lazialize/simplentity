import { Field } from "../field";

class NumberField extends Field<number> {}

export const number = () => {
  return new NumberField();
};
