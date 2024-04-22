import { Field } from "../field";

class BooleanField extends Field<boolean> {}

export const boolean = () => {
  return new BooleanField();
};
