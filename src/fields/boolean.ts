import { Field } from "../field.ts";

class BooleanField extends Field<boolean> {}

export const boolean = () => {
  return new BooleanField();
};
