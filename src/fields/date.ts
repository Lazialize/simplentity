import { Field } from "../field";

class DateField extends Field<Date> {}

export const date = () => {
  return new DateField();
};
