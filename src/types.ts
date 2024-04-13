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
