import { beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import { boolean, date, entity, number, string } from "../src";

describe("Entity", () => {
  beforeAll(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    email: string().notRequired(),
    level: number().default(1),
    createdAt: date().defaultFn(() => new Date()),
  }) {
    activate() {
      this.props.isActive = true;
    }

    disable() {
      this.props.isActive = false;
    }

    changeName(name: string) {
      this.props.name = name;
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

    expect(instance.id).toBe(1);
    expect(instance.name).toBe("testName");
    expect(instance.isActive).toBe(true);
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
    expect(instance.isActive).toBe(true);

    instance.disable();
    expect(instance.isActive).toBe(false);

    instance.changeName("newName");
    expect(instance.name).toBe("newName");
  });

  it("should handle not required and default properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(instance.email).toBeUndefined();
    expect(instance.level).toBe(1);
  });

  it("should override default properties", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      level: 2,
    });

    expect(instance.level).toBe(2);
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

    expect(instance1.id).toBe(0);
    expect(instance2.id).toBe(1);
  });

  it("should be able to serialize to JSON", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(JSON.stringify(instance)).toBe(
      `{"id":1,"name":"testName","isActive":true,"level":1,"createdAt":"2024-01-01T00:00:00.000Z"}`,
    );
    expect(instance.toJSON()).toEqual({
      id: 1,
      name: "testName",
      isActive: true,
      email: undefined,
      level: 1,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
  });

  it("should access properties via dot notation", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      email: "test@test.example",
      level: 5,
    });

    expect(instance.id).toBe(1);
    expect(instance.name).toBe("testName");
    expect(instance.isActive).toBe(true);
    expect(instance.email).toBe("test@test.example");
    expect(instance.level).toBe(5);
    expect(instance.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
  });

  it("should throw TypeError when directly assigning to a field property", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(() => {
      // @ts-expect-error readonly property
      instance.id = 999;
    }).toThrow(TypeError);

    expect(() => {
      // @ts-expect-error readonly property
      instance.name = "newName";
    }).toThrow(TypeError);
  });

  it("should throw TypeError when accessing props from outside", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(() => {
      // @ts-expect-error props is not exposed externally
      instance.props;
    }).toThrow(TypeError);
  });

  it("should reflect updates made via custom methods in dot notation access", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: false,
    });

    expect(instance.isActive).toBe(false);
    instance.activate();
    expect(instance.isActive).toBe(true);

    expect(instance.name).toBe("testName");
    instance.changeName("newName");
    expect(instance.name).toBe("newName");
  });

  it("should access optional and default fields via dot notation", () => {
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
    });

    expect(instance.email).toBeUndefined();
    expect(instance.level).toBe(1);
    expect(instance.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
  });
});
