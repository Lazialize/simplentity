import type { Field } from "./field.ts";

type EntityConfig = { [key: string]: Field<unknown> };
type EntityConfigTypeResolver<T extends EntityConfig> = {
  [K in keyof T]: T[K]["_"]["notRequired"] extends true ? FieldTypeResolver<T[K]> | undefined : FieldTypeResolver<T[K]>;
};

type RequiredFieldKeys<T extends EntityConfig> = {
  [K in keyof T]: T[K]["_"]["notRequired"] extends true ? never : T[K]["_"]["hasDefault"] extends true ? never : K;
}[keyof T];

type FieldTypeResolver<T> = T extends Field<infer U> ? U : never;

type EntityPropInputResolver<T extends EntityConfig> = {
  [K in RequiredFieldKeys<T>]: FieldTypeResolver<T[K]>;
} & {
  [K in keyof Omit<T, RequiredFieldKeys<T>>]?: FieldTypeResolver<T[K]>;
};

abstract class Entity<EConfig extends EntityConfig> {
  readonly #entityConfig: EConfig;
  protected props: EntityConfigTypeResolver<EConfig>;

  protected constructor(props: EntityPropInputResolver<EConfig>, entityConfig: EConfig) {
    this.#entityConfig = entityConfig;
    Object.freeze(this.#entityConfig);

    this.props = Object.entries(entityConfig).reduce(
      (acc, [key, field]) => {
        const value = props[key as keyof typeof props] ?? field.getDefaultValue();

        if (field._.hasDefault && value === undefined) {
          throw new Error(`The field "${key}" has a default value but undefined was provided.`);
        }

        // @ts-ignore - Cannot resolve the type of the field
        acc[key] = value;
        return acc;
      },
      {} as EntityConfigTypeResolver<EConfig>,
    );
  }

  get<K extends keyof EConfig>(key: K): EntityConfigTypeResolver<EConfig>[K] {
    return this.props[key];
  }

  protected set<K extends keyof EConfig>(key: K, value: EntityConfigTypeResolver<EConfig>[K]): void {
    this.props[key] = value;
  }
}

export const entity = <EConfig extends EntityConfig>(fields: EConfig) => {
  return class extends Entity<typeof fields> {
    constructor(props: EntityPropInputResolver<EConfig>) {
      super(props, fields);
    }
  };
};
