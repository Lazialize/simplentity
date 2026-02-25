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

type EntityInstance<Config extends EntityConfig> = Entity<Config> & {
  readonly [K in keyof Config]: EntityConfigTypeResolver<Config>[K];
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
          (acc as Record<string, unknown>)[key] = field.getDefaultValue();
        } else {
          (acc as Record<string, unknown>)[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>,
    ) as EntityConfigTypeResolver<Config>;

    // biome-ignore lint/correctness/noConstructorReturn: Proxy wrapping is intentional for dot notation access
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (Reflect.has(target, prop)) {
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        }
        if (typeof prop === "string" && prop in entityConfig) {
          return target.get(prop as keyof Config);
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        if (typeof prop === "string" && prop in entityConfig) {
          throw new TypeError(`Cannot set property "${prop}" directly. Use a custom method with set() instead.`);
        }
        return Reflect.set(target, prop, value, receiver);
      },
    });
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
  } as unknown as new (
    props: EntityPropInputResolver<Config>,
  ) => EntityInstance<Config>;
};
