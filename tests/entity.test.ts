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
    // toJSON should exclude undefined values (email is notRequired and not provided)
    const json = instance.toJSON();
    expect(json).toEqual({
      id: 1,
      name: "testName",
      isActive: true,
      level: 1,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    // Verify that undefined keys are actually excluded, not just set to undefined
    expect("email" in json).toBe(false);
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

  it("should override defaultFn value when explicitly provided", () => {
    const fixedDate = new Date("2025-06-15T00:00:00.000Z");
    const instance = new Account({
      id: 1,
      name: "testName",
      isActive: true,
      createdAt: fixedDate,
    });

    expect(instance.createdAt).toEqual(fixedDate);
  });

  it("should handle notRequired with default combination", () => {
    class WithOptionalDefault extends entity({
      name: string(),
      nickname: string().notRequired().default("anonymous"),
    }) {}

    const withoutNickname = new WithOptionalDefault({ name: "test" });
    expect(withoutNickname.nickname).toBe("anonymous");

    const withNickname = new WithOptionalDefault({ name: "test", nickname: "nick" });
    expect(withNickname.nickname).toBe("nick");
  });

  it("should isolate entity config between different entity classes", () => {
    class EntityA extends entity({ x: number() }) {}
    class EntityB extends entity({ y: string() }) {}

    const a = new EntityA({ x: 42 });
    const b = new EntityB({ y: "hello" });

    expect(a.x).toBe(42);
    expect(b.y).toBe("hello");
    expect("y" in a).toBe(false);
    expect("x" in b).toBe(false);
  });

  it("should create individual field types correctly", () => {
    class AllFields extends entity({
      s: string(),
      n: number(),
      b: boolean(),
      d: date(),
    }) {}

    const instance = new AllFields({ s: "hello", n: 42, b: true, d: new Date("2024-01-01") });
    expect(instance.s).toBe("hello");
    expect(instance.n).toBe(42);
    expect(instance.b).toBe(true);
    expect(instance.d).toEqual(new Date("2024-01-01"));
  });
});
