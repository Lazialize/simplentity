import type { Field } from "./field";

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
  #props: EntityConfigTypeResolver<EConfig>;

  protected constructor(props: EntityPropInputResolver<EConfig>, entityConfig: EConfig) {
    this.#entityConfig = entityConfig;
    Object.freeze(this.#entityConfig);

    this.#props = Object.entries(entityConfig).reduce(
      (acc, [key, field]) => {
        const value = props[key as keyof typeof props] ?? field.getDefaultValue();

        if (field.getConfig().hasDefault && value === undefined) {
          throw new Error(`The field "${key}" has a default value but undefined was provided.`);
        }

        // @ts-ignore - Cannot resolve the type of the field
        acc[key] = value;
        return acc;
      },
      {} as EntityConfigTypeResolver<EConfig>,
    );
  }

  /**
   * Get the value of the field by key
   * @param key
   */
  get<K extends keyof EConfig>(key: K): EntityConfigTypeResolver<EConfig>[K] {
    return this.#props[key];
  }

  /**
   * Set the value of the field by key
   *
   * WARNING: This method should be called only from the methods of the entity.
   * Its accessor should be protected but TypeScript declaration does not allow protected methods in exported classes.
   * @param key
   * @param value
   */
  set<K extends keyof EConfig>(key: K, value: EntityConfigTypeResolver<EConfig>[K]): void {
    this.#props[key] = value;
  }

  toJSON(): EntityConfigTypeResolver<EConfig> {
    return this.#props;
  }
}

/**
 * Create an entity class with the given fields
 * @param fields
 */
export const entity = <EConfig extends EntityConfig>(fields: EConfig) => {
  return class extends Entity<typeof fields> {
    constructor(props: EntityPropInputResolver<EConfig>) {
      super(props, fields);
    }
  };
};
