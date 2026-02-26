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
