import { describe, expect, it } from "bun:test";
import { ValidationError, entity, number, string } from "../src";

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
});
