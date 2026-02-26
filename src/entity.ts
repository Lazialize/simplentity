import { ValidationError } from "./errors.ts";
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

type EntityInstance<Config extends EntityConfig> = Omit<Entity<Config>, "props"> & {
  readonly [K in keyof Config]: EntityConfigTypeResolver<Config>[K];
} & {
  props: EntityConfigTypeResolver<Config>;
};

abstract class Entity<Config extends EntityConfig> {
  readonly #entityConfig: Config;
  #props: EntityConfigTypeResolver<Config>;
  #propsProxy: EntityConfigTypeResolver<Config>;

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

    for (const [key, field] of Object.entries(entityConfig)) {
      const value = (this.#props as Record<string, unknown>)[key];
      if (value === undefined && field.getConfig().notRequired) {
        continue;
      }
      for (const validator of field.getValidators()) {
        if (!validator.fn(value)) {
          throw new ValidationError(key, value, validator.rule, validator.message);
        }
      }
    }

    this.#propsProxy = new Proxy(this.#props as Record<string, unknown>, {
      set: (target, prop, value) => {
        if (typeof prop === "string" && prop in this.#entityConfig) {
          const field = this.#entityConfig[prop];
          if (!(value === undefined && field.getConfig().notRequired)) {
            for (const validator of field.getValidators()) {
              if (!validator.fn(value)) {
                throw new ValidationError(String(prop), value, validator.rule, validator.message);
              }
            }
          }
        }
        target[prop as string] = value;
        return true;
      },
    }) as EntityConfigTypeResolver<Config>;

    // biome-ignore lint/correctness/noConstructorReturn: Proxy wrapping is intentional for dot notation access
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop === "props") {
          throw new TypeError('Cannot access "props" from outside the entity. Use dot notation to read properties.');
        }
        if (Reflect.has(target, prop)) {
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        }
        if (typeof prop === "string" && prop in entityConfig) {
          return (target.props as Record<string, unknown>)[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        if (typeof prop === "string" && prop in entityConfig) {
          throw new TypeError(`Cannot set property "${prop}" directly. Use a custom method instead.`);
        }
        return Reflect.set(target, prop, value, receiver);
      },
    });
  }

  protected get props(): EntityConfigTypeResolver<Config> {
    return this.#propsProxy;
  }

  // biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
  toJSON(): Partial<EntityConfigTypeResolver<Config>> {
    return Object.fromEntries(
      Object.entries(this.#props as Record<string, unknown>).filter(([, v]) => v !== undefined),
    ) as Partial<EntityConfigTypeResolver<Config>>;
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
