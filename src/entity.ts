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

abstract class Entity<Config extends EntityConfig> {
  readonly #entityConfig: Config;
  #props: EntityConfigTypeResolver<Config>;

  protected constructor(props: EntityPropInputResolver<Config>, entityConfig: Config) {
    this.#entityConfig = entityConfig;
    Object.freeze(this.#entityConfig);

    this.#props = Object.entries(entityConfig).reduce(
      (acc, [key, field]) => {
        const value = props[key as keyof typeof props] ?? field.getDefaultValue();

        if (field.getConfig().hasDefault && value === undefined) {
          // @ts-ignore - Cannot resolve the type of the field
          acc[key] = field.getDefaultValue();
        } else {
          // @ts-ignore - Cannot resolve the type of the field
          acc[key] = value;
        }
        return acc;
      },
      {} as EntityConfigTypeResolver<Config>,
    );
  }

  /**
   * Get the value of the field by key
   * @param key
   */
  get<K extends keyof Config>(key: K): EntityConfigTypeResolver<Config>[K] {
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
  set<K extends keyof Config>(key: K, value: EntityConfigTypeResolver<Config>[K]): void {
    this.#props[key] = value;
  }

  // biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
  toJSON(): EntityConfigTypeResolver<Config> {
    return this.#props;
  }
}

/**
 * Create an entity class with the given fields
 * @param fields
 */
export const entity = <Config extends EntityConfig>(fields: Config) => {
  return class extends Entity<typeof fields> {
    constructor(props: EntityPropInputResolver<Config>) {
      super(props, fields);
    }
  };
};
