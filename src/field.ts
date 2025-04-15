type FieldConfig<T> = {
  notRequired: boolean;
  hasDefault: boolean;
  data: T;
};

type FieldRuntimeConfig<T> = {
  notRequired: boolean;
  hasDefault: boolean;
  default: T | undefined;
  defaultFn?: () => T;
};

interface ConfigurableFieldBase<T> {
  _: FieldConfig<T>;
}

type NotRequired<T extends ConfigurableFieldBase<unknown>> = T & {
  _: {
    notRequired: true;
  };
};

type HasDefault<T extends ConfigurableFieldBase<unknown>> = T & {
  _: {
    hasDefault: true;
  };
};

export abstract class Field<T> implements ConfigurableFieldBase<T> {
  declare _: FieldConfig<T>;

  config: FieldRuntimeConfig<T>;

  constructor() {
    this.config = {
      notRequired: false,
      hasDefault: false,
      default: undefined,
    };
  }

  notRequired(): NotRequired<this> {
    this.config.notRequired = true;
    return this as NotRequired<this>;
  }

  default(value: T): HasDefault<this> {
    this.config.default = value;
    this.config.hasDefault = true;
    return this as HasDefault<this>;
  }

  defaultFn(fn: () => T): HasDefault<this> {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this as HasDefault<this>;
  }

  getConfig(): FieldRuntimeConfig<T> {
    return this.config;
  }

  getDefaultValue(): T | undefined {
    return this.config.default ?? this.config.defaultFn?.();
  }
}
