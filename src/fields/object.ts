import { Field } from "../field.ts";

type ObjectSchema = { [key: string]: Field<unknown> };
type ResolveObjectSchema<T extends ObjectSchema> = {
  [K in keyof T]: T[K] extends Field<infer U> ? U : never;
};

class ObjectField<T extends ObjectSchema> extends Field<ResolveObjectSchema<T>> {
  readonly #schema: T;

  constructor(schema: T) {
    super();
    this.#schema = schema;
    this.validators.push({
      rule: "type",
      fn: (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v),
      message: "must be an object",
    });
    this.validators.push({
      rule: "schema",
      fn: (v: unknown) => {
        const obj = v as Record<string, unknown>;
        for (const [key, field] of Object.entries(this.#schema)) {
          const value = obj[key];
          if (value === undefined && field.getConfig().notRequired) {
            continue;
          }
          for (const validator of field.getValidators()) {
            if (!validator.fn(value)) {
              return false;
            }
          }
        }
        return true;
      },
      message: "object schema validation failed",
    });
  }
}

export const object = <T extends ObjectSchema>(schema: T) => {
  return new ObjectField<T>(schema);
};
