import type { Field, Resolver } from "./types.ts";

abstract class Entity<Props extends { [index: string]: Field }> {
	protected props: Resolver<Props>;

	constructor(props: Resolver<Props>) {
		this.props = props;
	}

	get<K extends keyof Resolver<Props>>(key: K): Resolver<Props>[K] {
		return this.props[key];
	}

	protected set<K extends keyof Resolver<Props>>(
		key: K,
		value: Resolver<Props>[K],
	): void {
		this.props[key] = value;
	}
}

export const entity = <Props extends { [index: string]: Field }>(
	fields: Props,
) => {
	return class extends Entity<Props> {};
};
