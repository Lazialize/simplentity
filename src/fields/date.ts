import { Field } from "../field.ts";

class DateField extends Field<Date> {}

/**
 * Create a new date field
 */
export const date = () => {
  return new DateField();
};
