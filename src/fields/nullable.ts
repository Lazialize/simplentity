import { Field } from "../field.ts";

class NullableField<T> extends Field<T | null> {
  readonly #innerField: Field<T>;

  constructor(innerField: Field<T>) {
    super();
    this.#innerField = innerField;
    const innerValidators = innerField.getValidators();
    for (const v of innerValidators) {
      this.validators.push({
        rule: v.rule,
        fn: (value: unknown) => value === null || v.fn(value),
        message: v.message,
      });
    }
  }

  override fromJSON(value: unknown): T | null {
    if (value === null) {
      return null;
    }
    return this.#innerField.fromJSON(value);
  }
}

export const nullable = <T>(innerField: Field<T>) => {
  return new NullableField<T>(innerField);
};
