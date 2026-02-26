import { Field } from "../field.ts";

class EnumField<T extends string> extends Field<T> {
  readonly #values: readonly T[];

  constructor(values: readonly T[]) {
    super();
    this.#values = values;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "string",
      message: "must be a string",
    });
    this.validators.push({
      rule: "enum",
      fn: (v: unknown) => (this.#values as readonly string[]).includes(v as string),
      message: `must be one of: ${values.join(", ")}`,
    });
  }
}

export const enum_ = <const T extends readonly string[]>(values: T) => {
  return new EnumField<T[number]>([...values]);
};
