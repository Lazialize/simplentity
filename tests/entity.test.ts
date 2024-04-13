import { describe, expect, it } from "bun:test";
import { entity } from "../src";

describe("Entity", () => {
	class TestEntity extends entity({
		name: { type: "string" as const },
		age: { type: "number" as const },
		isActive: { type: "boolean" as const },
	}) {
		activate() {
			this.set("isActive", true);
		}

		disable() {
			this.set("isActive", false);
		}

		increaseAge() {
			this.set("age", this.get("age") + 1);
		}

		decreaseAge() {
			this.set("age", this.get("age") - 1);
		}

		changeName(name: string) {
			this.set("name", name);
		}
	}

	it("should define the entity with given properties", () => {
		const instance = new TestEntity({
			name: "testName",
			age: 20,
			isActive: true,
		});

		expect(instance.get("name")).toBe("testName");
		expect(instance.get("age")).toBe(20);
		expect(instance.get("isActive")).toBe(true);
	});

	it("should update the properties", () => {
		const instance = new TestEntity({
			name: "testName",
			age: 20,
			isActive: true,
		});

		instance.activate();
		expect(instance.get("isActive")).toBe(true);

		instance.disable();
		expect(instance.get("isActive")).toBe(false);

		instance.increaseAge();
		expect(instance.get("age")).toBe(21);

		instance.decreaseAge();
		expect(instance.get("age")).toBe(20);

		instance.changeName("newName");
		expect(instance.get("name")).toBe("newName");
	});
});
