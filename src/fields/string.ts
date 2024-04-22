import { Field } from "../field";

class StringField extends Field<string> {}

export const string = () => {
  return new StringField();
};
