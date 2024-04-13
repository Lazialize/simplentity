export type Field = { type: string };
export type Resolver<T extends { [index: string]: Field }> = {
  [P in keyof T]: T[P]["type"] extends "string"
    ? string
    : T[P]["type"] extends "number"
      ? number
      : T[P]["type"] extends "boolean"
        ? boolean
        : never;
};

type StringField = Field & { type: "string" };
type NumberField = Field & { type: "number" };
type BooleanField = Field & { type: "boolean" };

export const string = (): StringField => {
  return { type: "string" };
};

export const number = (): NumberField => {
  return { type: "number" };
};

export const boolean = (): BooleanField => {
  return { type: "boolean" };
};
