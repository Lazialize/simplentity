import { describe, expect, it } from "bun:test";
import { entity } from "../src";
import { boolean } from "../src/fields/boolean.ts";
import { number } from "../src/fields/number.ts";
import { string } from "../src/fields/string.ts";

describe("Entity", () => {
  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    email: string().notRequired(),
    level: number().default(1),
  }) {
    activate() {
      this.set("isActive", true);
    }

    disable() {
      this.set("isActive", false);
    }

    changeName(name: string) {
      this.set("name", name);
    }
  }

  it("should define the entity with given properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      email: "test@test.example",
      level: 1,
    });

    expect(instance.get("id")).toBe(1);
    expect(instance.get("name")).toBe("testName");
    expect(instance.get("isActive")).toBe(true);
  });

  it("should update the properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      email: "test@test.example",
      level: 1,
    });

    instance.activate();
    expect(instance.get("isActive")).toBe(true);

    instance.disable();
    expect(instance.get("isActive")).toBe(false);

    instance.changeName("newName");
    expect(instance.get("name")).toBe("newName");
  });

  it("should handle not required and default properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      email: undefined,
      level: undefined,
    });

    expect(instance.get("email")).toBeUndefined();
    expect(instance.get("level")).toBe(1);
  });
});
