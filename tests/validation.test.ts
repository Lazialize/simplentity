import { describe, expect, it } from "bun:test";
import { ValidationError, boolean, date, entity, number, string } from "../src";

describe("Validation", () => {
  describe("ValidationError", () => {
    it("should contain field, value, and rule information", () => {
      const error = new ValidationError("name", "", "custom", "must not be empty");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe("name");
      expect(error.value).toBe("");
      expect(error.rule).toBe("custom");
      expect(error.message).toBe('Validation failed for field "name": must not be empty');
    });
  });

  describe("Custom validate()", () => {
    it("should throw ValidationError when custom validator fails in constructor", () => {
      class Validated extends entity({
        name: string().validate((v) => (v as string).length > 0, "must not be empty"),
      }) {}

      expect(() => new Validated({ name: "" })).toThrow(ValidationError);
    });

    it("should pass when custom validator succeeds", () => {
      class Validated extends entity({
        age: number().validate((v) => (v as number) >= 0, "must be non-negative"),
      }) {}

      expect(() => new Validated({ age: 5 })).not.toThrow();
      const instance = new Validated({ age: 5 });
      expect(instance.age).toBe(5);
    });
  });

  describe("String validators", () => {
    it("should validate minLength", () => {
      class T extends entity({ name: string().minLength(3) }) {}
      expect(() => new T({ name: "ab" })).toThrow(ValidationError);
      expect(() => new T({ name: "abc" })).not.toThrow();
    });

    it("should validate maxLength", () => {
      class T extends entity({ name: string().maxLength(5) }) {}
      expect(() => new T({ name: "abcdef" })).toThrow(ValidationError);
      expect(() => new T({ name: "abcde" })).not.toThrow();
    });

    it("should validate pattern", () => {
      class T extends entity({ code: string().pattern(/^[A-Z]+$/) }) {}
      expect(() => new T({ code: "abc" })).toThrow(ValidationError);
      expect(() => new T({ code: "ABC" })).not.toThrow();
    });
  });

  describe("Number validators", () => {
    it("should validate min", () => {
      class T extends entity({ age: number().min(0) }) {}
      expect(() => new T({ age: -1 })).toThrow(ValidationError);
      expect(() => new T({ age: 0 })).not.toThrow();
    });

    it("should validate max", () => {
      class T extends entity({ score: number().max(100) }) {}
      expect(() => new T({ score: 101 })).toThrow(ValidationError);
      expect(() => new T({ score: 100 })).not.toThrow();
    });

    it("should validate integer", () => {
      class T extends entity({ count: number().integer() }) {}
      expect(() => new T({ count: 1.5 })).toThrow(ValidationError);
      expect(() => new T({ count: 1 })).not.toThrow();
    });
  });

  describe("Date validators", () => {
    it("should validate after", () => {
      const boundary = new Date("2020-01-01");
      class T extends entity({ d: date().after(boundary) }) {}
      expect(() => new T({ d: new Date("2019-12-31") })).toThrow(ValidationError);
      expect(() => new T({ d: new Date("2020-01-02") })).not.toThrow();
    });

    it("should validate before", () => {
      const boundary = new Date("2030-01-01");
      class T extends entity({ d: date().before(boundary) }) {}
      expect(() => new T({ d: new Date("2030-01-02") })).toThrow(ValidationError);
      expect(() => new T({ d: new Date("2029-12-31") })).not.toThrow();
    });
  });

  describe("Runtime type checks", () => {
    it("should reject wrong types at runtime", () => {
      class T extends entity({ name: string() }) {}
      // @ts-expect-error testing runtime check
      expect(() => new T({ name: 123 })).toThrow(ValidationError);
    });

    it("should reject wrong number type at runtime", () => {
      class T extends entity({ age: number() }) {}
      // @ts-expect-error testing runtime check
      expect(() => new T({ age: "not a number" })).toThrow(ValidationError);
    });

    it("should reject wrong boolean type at runtime", () => {
      class T extends entity({ active: boolean() }) {}
      // @ts-expect-error testing runtime check
      expect(() => new T({ active: "yes" })).toThrow(ValidationError);
    });

    it("should reject wrong date type at runtime", () => {
      class T extends entity({ d: date() }) {}
      // @ts-expect-error testing runtime check
      expect(() => new T({ d: "2024-01-01" })).toThrow(ValidationError);
    });
  });
});
