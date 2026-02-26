import { Field } from "../field.ts";

class ArrayField<T> extends Field<T[]> {
  readonly #innerField: Field<T>;

  constructor(innerField: Field<T>) {
    super();
    this.#innerField = innerField;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => Array.isArray(v),
      message: "must be an array",
    });
    this.validators.push({
      rule: "elements",
      fn: (v: unknown) => {
        const arr = v as unknown[];
        const innerValidators = this.#innerField.getValidators();
        return arr.every((item) => innerValidators.every((validator) => validator.fn(item)));
      },
      message: "array element validation failed",
    });
  }

  minItems(n: number): this {
    this.validators.push({
      rule: "minItems",
      fn: (v: unknown) => (v as unknown[]).length >= n,
      message: `must have at least ${n} items`,
    });
    return this;
  }

  maxItems(n: number): this {
    this.validators.push({
      rule: "maxItems",
      fn: (v: unknown) => (v as unknown[]).length <= n,
      message: `must have at most ${n} items`,
    });
    return this;
  }

  override fromJSON(value: unknown): T[] {
    if (!Array.isArray(value)) {
      return value as T[];
    }
    return value.map((v) => this.#innerField.fromJSON(v));
  }
}

export const array = <T>(innerField: Field<T>) => {
  return new ArrayField<T>(innerField);
};
