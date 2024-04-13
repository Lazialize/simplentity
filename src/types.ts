export type Field = { type: string };
export type Resolver<T extends { [index: string]: Field }> = {
	[P in keyof T]: T[P]["type"] extends "string" ? string : never;
};
