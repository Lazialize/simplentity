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

type MethodDefinition = {
  // biome-ignore lint/suspicious/noExplicitAny: any is used to allow any method signature
  [key: string]: (...args: any[]) => any;
};
interface EntityInterface<C extends EntityConfig> {
  get: <K extends keyof C>(key: K) => EntityConfigTypeResolver<C>[K];
  // biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
  toJSON: () => EntityConfigTypeResolver<C>;
}

class EntityFactory<C extends EntityConfig, D extends MethodDefinition> {
  private readonly fields: C;
  private readonly methodDefinitionFunction?: (params: {
    set: <K extends keyof C>(key: K, value: EntityConfigTypeResolver<C>[K]) => void;
    get: <K extends keyof C>(key: K) => EntityConfigTypeResolver<C>[K];
  }) => D;

  declare readonly $infer: EntityInterface<C> & D;

  constructor(
    fields: C,
    methodDefinitionFunction?: (params: {
      set: <K extends keyof C>(key: K, value: EntityConfigTypeResolver<C>[K]) => void;
      get: <K extends keyof C>(key: K) => EntityConfigTypeResolver<C>[K];
    }) => D,
  ) {
    this.fields = fields;
    this.methodDefinitionFunction = methodDefinitionFunction;
  }

  create(props: EntityPropInputResolver<C>): EntityInterface<C> & D {
    const assignedProps = Object.entries(this.fields).reduce(
      (acc, [key, field]) => {
        const value = props[key as keyof typeof props] ?? field.getDefaultValue();

        if (field.getConfig().hasDefault && value === undefined) {
          (acc as Record<string, unknown>)[key] = field.getDefaultValue();
        } else {
          (acc as Record<string, unknown>)[key] = value;
        }
        return acc;
      },
      {} as EntityConfigTypeResolver<C>,
    );

    const set = <K extends keyof C>(key: K, value: EntityConfigTypeResolver<C>[K]) => {
      assignedProps[key] = value;
    };
    const get = <K extends keyof C>(key: K): EntityConfigTypeResolver<C>[K] => {
      return assignedProps[key];
    };
    // biome-ignore lint/style/useNamingConvention: toJSON is a name to be used in JSON.stringify
    const toJSON = (): EntityConfigTypeResolver<C> => {
      return assignedProps;
    };
    const methods: D = this.methodDefinitionFunction?.({ set, get }) ?? ({} as D);

    return {
      get,
      toJSON,
      ...methods,
    };
  }
}

/**
 * Creates an entity factory function that allows defining fields and optional methods for an entity.
 * The returned factory provides a `create` method to instantiate entities with the specified fields
 * and methods, while also supporting default values and runtime property manipulation.
 *
 * @template C - The configuration type for the entity fields.
 * @template D - The type of the methods defined for the entity.
 *
 * @param fields - An object defining the fields of the entity. Each field should include its configuration
 *                 and a method to retrieve its default value.
 * @param methodDefinitionFunction - An optional function that defines additional methods for the entity.
 *                                   It receives an object with `set` and `get` functions to manipulate
 *                                   the entity's properties.
 *
 * @returns An object with a `create` method. The `create` method accepts an input object to initialize
 *          the entity's properties and returns an entity instance with the defined fields, methods,
 *          and utility functions (`get`, `set`, `toJSON`).
 *
 * @example
 * ```typescript
 * const userFactory = createEntity({
 *   name: string(),
 *   age: number().default(18),
 *   isActive: boolean().default(true),
 * }, ({ set, get }) => ({
 *   incrementAge: () => set('age', get('age') + 1),
 * }));
 *
 * const user = userFactory.create({ name: 'John' });
 * console.log(user.props); // { name: 'John', age: 18, isActive: true }
 * user.incrementAge();
 * console.log(user.props.age); // 19
 * ```
 */
export function createEntity<C extends EntityConfig, D extends MethodDefinition>(
  fields: C,
  methodDefinitionFunction?: (params: {
    set: <K extends keyof C>(key: K, value: EntityConfigTypeResolver<C>[K]) => void;
    get: <K extends keyof C>(key: K) => EntityConfigTypeResolver<C>[K];
  }) => D,
) {
  return new EntityFactory<C, D>(fields, methodDefinitionFunction);
}
