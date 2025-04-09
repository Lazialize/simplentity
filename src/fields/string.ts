import { Field } from "../field.ts";

class StringField extends Field<string> {}

/**
 * Create a new string field
 */
export const string = () => {
  return new StringField();
};
