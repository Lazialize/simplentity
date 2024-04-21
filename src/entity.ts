import type { Field } from "./field.ts";

type EntityConfig = { [key: string]: Field<unknown> };
type EntityConfigTypeResolver<T extends EntityConfig> = {
  [P in keyof T]: T[P] extends Field<infer U>
    ? T[P]["_"]["notRequired"] extends true
      ? U | undefined
      : T[P]["_"]["hasDefault"] extends true
        ? U | undefined
        : U
    : never;
};

abstract class Entity<EConfig extends EntityConfig> {
  protected props: EntityConfigTypeResolver<EConfig>;

  constructor(props: EntityConfigTypeResolver<EConfig>) {
    this.props = props;
  }

  get<K extends keyof EntityConfigTypeResolver<EConfig>>(key: K): EntityConfigTypeResolver<EConfig>[K] {
    return this.props[key];
  }

  protected set<K extends keyof EntityConfigTypeResolver<EConfig>>(
    key: K,
    value: EntityConfigTypeResolver<EConfig>[K],
  ): void {
    this.props[key] = value;
  }
}

export const entity = <EConfig extends EntityConfig>(fields: EConfig) => {
  return class extends Entity<EConfig> {};
};
