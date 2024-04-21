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
    });

    expect(instance.get("email")).toBeUndefined();
    expect(instance.get("level")).toBe(1);
  });

  it("should override default properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      level: 2,
    });

    expect(instance.get("level")).toBe(2);
  });

  it("should return the default value if the default value is a function", () => {
    const sequence = {
      current: 0,
      next: () => sequence.current++,
    };
    class IdIncrement extends entity({
      id: number().defaultFn(() => sequence.next()),
    }) {}

    const instance1 = new IdIncrement({});
    const instance2 = new IdIncrement({});

    expect(instance1.get("id")).toBe(0);
    expect(instance2.get("id")).toBe(1);
  });

  it("should be able to serialize to JSON", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(JSON.stringify(instance)).toBe('{"id":1,"name":"testName","isActive":true,"level":1}');
    expect(instance.toJSON()).toEqual({
      id: 1,
      name: "testName",
      isActive: true,
      email: undefined,
      level: 1,
    });
  });
});
