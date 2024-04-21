import { Field } from "../field.ts";

class StringField extends Field<string> {}

export const string = () => {
  return new StringField();
};
