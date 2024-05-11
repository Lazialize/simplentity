import { Field } from "../field";

class DateField extends Field<Date> {}

/**
 * Create a new date field
 */
export const date = () => {
  return new DateField();
};
