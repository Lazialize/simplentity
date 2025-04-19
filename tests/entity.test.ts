import { beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import { boolean, createEntity, date, entity, number, string } from "../src";
import { array } from "../src/fields";

describe("Entity", () => {
  beforeAll(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  const accountFactory = createEntity(
    {
      id: number(),
      name: string(),
      isActive: boolean(),
      email: string().notRequired(),
      level: number().default(1),
      tags: array<string>().default([]),
      createdAt: date().defaultFn(() => new Date()),
    },
    ({ set }) => ({
      activate() {
        set("isActive", true);
      },

      disable() {
        set("isActive", false);
      },
      changeName(name: string) {
        set("name", name);
      },
    }),
  );

  it("should define the entity with given properties", () => {
    const instance = accountFactory.create({
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
    const instance = accountFactory.create({
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
    const instance = accountFactory.create({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(instance.get("email")).toBeUndefined();
    expect(instance.get("level")).toBe(1);
  });

  it("should override default properties", () => {
    const instance = accountFactory.create({
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

    const idIncrementFactory = createEntity({
      id: number().defaultFn(() => sequence.next()),
    });

    const instance1 = idIncrementFactory.create({});
    const instance2 = idIncrementFactory.create({});

    expect(instance1.get("id")).toBe(0);
    expect(instance2.get("id")).toBe(1);
  });

  it("should be able to serialize to JSON", () => {
    const instance = accountFactory.create({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(JSON.stringify(instance)).toBe(
      `{"id":1,"name":"testName","isActive":true,"level":1,"tags":[],"createdAt":"2024-01-01T00:00:00.000Z"}`,
    );
    expect(instance.toJSON()).toEqual({
      id: 1,
      name: "testName",
      isActive: true,
      email: undefined,
      level: 1,
      tags: [],
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
  });

  it("should define the entity with entity field", () => {
    const parentFactory = createEntity({
      id: number(),
      name: string(),
    });

    const childFactory = createEntity({
      id: number(),
      name: string(),
      parent: entity<typeof parentFactory.$infer>(),
    });

    const parentInstance = parentFactory.create({
      id: 1,
      name: "parentName",
    });
    const childInstance = childFactory.create({
      id: 2,
      name: "childName",
      parent: parentInstance,
    });

    expect(childInstance.get("parent").get("id")).toBe(1);
  });

  it("should define the entity with array field", () => {
    const childFactory = createEntity({
      id: number(),
      name: string(),
      tags: array<string>(),
    });

    const instance = childFactory.create({
      id: 1,
      name: "testName",
      tags: ["tag1", "tag2"],
    });

    expect(instance.get("tags")).toEqual(["tag1", "tag2"]);
  });

  it("should not affect the effect by manipulating a value from the get method", () => {
    const instance = accountFactory.create({
      id: 1,
      name: "testName",
      isActive: true,
      tags: ["tag1", "tag2"],
    });

    const tags = instance.get("tags");
    tags.push("tag3");
    expect(instance.get("tags")).toEqual(["tag1", "tag2"]);
  });
});
