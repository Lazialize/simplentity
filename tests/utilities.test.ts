import { beforeAll, describe, expect, it, setSystemTime } from "bun:test";
import { array, boolean, date, entity, nullable, number, object, string } from "../src";

describe("fromJSON", () => {
  beforeAll(() => {
    setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  it("should create an entity from a plain JSON object", () => {
    class Account extends entity({
      id: number(),
      name: string(),
      isActive: boolean(),
    }) {}

    const account = Account.fromJSON({ id: 1, name: "test", isActive: true });
    expect(account.id).toBe(1);
    expect(account.name).toBe("test");
    expect(account.isActive).toBe(true);
  });

  it("should convert ISO date strings to Date objects", () => {
    class T extends entity({
      createdAt: date(),
    }) {}

    const instance = T.fromJSON({ createdAt: "2024-01-01T00:00:00.000Z" });
    expect(instance.createdAt).toEqual(new Date("2024-01-01T00:00:00.000Z"));
    expect(instance.createdAt).toBeInstanceOf(Date);
  });

  it("should handle nested date conversion in arrays", () => {
    class T extends entity({
      dates: array(date()),
    }) {}

    const instance = T.fromJSON({ dates: ["2024-01-01T00:00:00.000Z", "2024-06-15T00:00:00.000Z"] });
    expect(instance.dates[0]).toBeInstanceOf(Date);
    expect(instance.dates[1]).toBeInstanceOf(Date);
  });

  it("should handle nested date conversion in objects", () => {
    class T extends entity({
      meta: object({ createdAt: date(), updatedAt: date() }),
    }) {}

    const instance = T.fromJSON({
      meta: { createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-06-15T00:00:00.000Z" },
    });
    expect(instance.meta.createdAt).toBeInstanceOf(Date);
  });

  it("should handle nullable date conversion", () => {
    class T extends entity({
      deletedAt: nullable(date()),
    }) {}

    const withDate = T.fromJSON({ deletedAt: "2024-01-01T00:00:00.000Z" });
    expect(withDate.deletedAt).toBeInstanceOf(Date);

    const withNull = T.fromJSON({ deletedAt: null });
    expect(withNull.deletedAt).toBeNull();
  });

  it("should apply defaults for missing fields", () => {
    class T extends entity({
      name: string(),
      level: number().default(1),
    }) {}

    const instance = T.fromJSON({ name: "test" });
    expect(instance.level).toBe(1);
  });

  it("should run validation on fromJSON input", () => {
    class T extends entity({
      name: string().minLength(3),
    }) {}

    expect(() => T.fromJSON({ name: "ab" })).toThrow();
  });

  it("should work with subclasses that have custom methods", () => {
    class Account extends entity({
      id: number(),
      name: string(),
    }) {
      greet(): string {
        return `Hello, ${this.props.name}`;
      }
    }

    const account = Account.fromJSON({ id: 1, name: "test" });
    expect(account.id).toBe(1);
    expect((account as unknown as Account).greet()).toBe("Hello, test");
  });
});

describe("equals", () => {
  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    email: string().notRequired(),
    level: number().default(1),
    createdAt: date().defaultFn(() => new Date()),
  }) {}

  it("should return true for equal entities", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 1, name: "test", isActive: true });
    expect(a.equals(b)).toBe(true);
  });

  it("should return false for different entities", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 2, name: "other", isActive: false });
    expect(a.equals(b)).toBe(false);
  });

  it("should handle optional fields correctly", () => {
    const a = new Account({ id: 1, name: "test", isActive: true, email: "a@b.com" });
    const b = new Account({ id: 1, name: "test", isActive: true });
    expect(a.equals(b)).toBe(false);
  });

  it("should compare Date values by time", () => {
    const a = new Account({ id: 1, name: "test", isActive: true });
    const b = new Account({ id: 1, name: "test", isActive: true });
    // Both have same defaultFn date (frozen system time)
    expect(a.equals(b)).toBe(true);
  });

  it("should compare array and object fields deeply", () => {
    class T extends entity({
      tags: array(string()),
      meta: object({ key: string() }),
    }) {}

    const a = new T({ tags: ["a", "b"], meta: { key: "v" } });
    const b = new T({ tags: ["a", "b"], meta: { key: "v" } });
    const c = new T({ tags: ["a", "c"], meta: { key: "v" } });

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe("clone", () => {
  class Account extends entity({
    id: number(),
    name: string(),
    isActive: boolean(),
    level: number().default(1),
    createdAt: date().defaultFn(() => new Date()),
  }) {
    changeName(name: string) {
      this.props.name = name;
    }
  }

  it("should create an equal copy", () => {
    const original = new Account({ id: 1, name: "test", isActive: true });
    const copy = original.clone();
    expect(original.equals(copy)).toBe(true);
  });

  it("should create an independent copy", () => {
    const original = new Account({ id: 1, name: "test", isActive: true });
    const copy = original.clone();
    (copy as unknown as Account).changeName("changed");
    expect(original.name).toBe("test");
    expect(copy.name).toBe("changed");
  });

  it("should deep copy arrays and objects", () => {
    class T extends entity({
      tags: array(string()),
    }) {
      addTag(tag: string) {
        this.props.tags = [...this.props.tags, tag];
      }
    }

    const original = new T({ tags: ["a"] });
    const copy = original.clone();
    (copy as unknown as T).addTag("b");
    expect(original.tags).toEqual(["a"]);
    expect(copy.tags).toEqual(["a", "b"]);
  });
});
