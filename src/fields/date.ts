import { Field } from "../field.ts";

class DateField extends Field<Date> {}

export const date = () => {
  return new DateField();
};
