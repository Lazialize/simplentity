import { describe, expect, it } from "bun:test";
import { ValidationError, array, boolean, date, entity, enum_, number, object, string } from "../src";

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

  describe("Props assignment validation", () => {
    it("should validate when setting props via custom method", () => {
      class Validated extends entity({
        name: string().minLength(3),
      }) {
        changeName(name: string) {
          this.props.name = name;
        }
      }

      const instance = new Validated({ name: "valid" });
      expect(() => instance.changeName("ab")).toThrow(ValidationError);
      expect(instance.name).toBe("valid"); // unchanged after failed validation
    });

    it("should allow valid props assignment", () => {
      class Validated extends entity({
        name: string().minLength(3),
      }) {
        changeName(name: string) {
          this.props.name = name;
        }
      }

      const instance = new Validated({ name: "valid" });
      instance.changeName("also valid");
      expect(instance.name).toBe("also valid");
    });

    it("should skip validation for undefined on notRequired fields", () => {
      class Validated extends entity({
        email: string().notRequired().minLength(3),
      }) {
        clearEmail() {
          this.props.email = undefined;
        }
      }

      const instance = new Validated({ email: "test@test.example" });
      expect(() => instance.clearEmail()).not.toThrow();
      expect(instance.email).toBeUndefined();
    });

    it("should validate runtime types on props assignment", () => {
      class Validated extends entity({
        name: string(),
      }) {
        setNameBad() {
          // @ts-expect-error testing runtime check
          this.props.name = 123;
        }
      }

      const instance = new Validated({ name: "valid" });
      expect(() => instance.setNameBad()).toThrow(ValidationError);
    });
  });

  describe("EnumField", () => {
    it("should accept valid enum values", () => {
      class T extends entity({ role: enum_(["admin", "user", "guest"]) }) {}
      const instance = new T({ role: "admin" });
      expect(instance.role).toBe("admin");
    });

    it("should reject invalid enum values", () => {
      class T extends entity({ role: enum_(["admin", "user", "guest"]) }) {}
      // @ts-expect-error testing invalid value
      expect(() => new T({ role: "superadmin" })).toThrow(ValidationError);
    });

    it("should reject non-string values", () => {
      class T extends entity({ role: enum_(["admin", "user"]) }) {}
      // @ts-expect-error testing runtime type check
      expect(() => new T({ role: 123 })).toThrow(ValidationError);
    });

    it("should work with notRequired", () => {
      class T extends entity({ role: enum_(["admin", "user"]).notRequired() }) {}
      const instance = new T({});
      expect(instance.role).toBeUndefined();
    });

    it("should work with default", () => {
      class T extends entity({ role: enum_(["admin", "user"]).default("user") }) {}
      const instance = new T({});
      expect(instance.role).toBe("user");
    });
  });

  describe("ArrayField", () => {
    it("should accept valid arrays", () => {
      class T extends entity({ tags: array(string()) }) {}
      const instance = new T({ tags: ["a", "b"] });
      expect(instance.tags).toEqual(["a", "b"]);
    });

    it("should reject non-array values", () => {
      class T extends entity({ tags: array(string()) }) {}
      // @ts-expect-error testing runtime type check
      expect(() => new T({ tags: "not an array" })).toThrow(ValidationError);
    });

    it("should validate each element against inner field", () => {
      class T extends entity({ tags: array(string().minLength(2)) }) {}
      expect(() => new T({ tags: ["ab", "a"] })).toThrow(ValidationError);
      expect(() => new T({ tags: ["ab", "cd"] })).not.toThrow();
    });

    it("should validate minItems", () => {
      class T extends entity({ tags: array(string()).minItems(2) }) {}
      expect(() => new T({ tags: ["a"] })).toThrow(ValidationError);
      expect(() => new T({ tags: ["a", "b"] })).not.toThrow();
    });

    it("should validate maxItems", () => {
      class T extends entity({ tags: array(string()).maxItems(2) }) {}
      expect(() => new T({ tags: ["a", "b", "c"] })).toThrow(ValidationError);
      expect(() => new T({ tags: ["a", "b"] })).not.toThrow();
    });

    it("should work with notRequired", () => {
      class T extends entity({ tags: array(string()).notRequired() }) {}
      const instance = new T({});
      expect(instance.tags).toBeUndefined();
    });
  });

  describe("ObjectField", () => {
    it("should accept valid objects", () => {
      class T extends entity({ address: object({ street: string(), city: string() }) }) {}
      const instance = new T({ address: { street: "123 Main", city: "NYC" } });
      expect(instance.address).toEqual({ street: "123 Main", city: "NYC" });
    });

    it("should reject non-object values", () => {
      class T extends entity({ address: object({ street: string() }) }) {}
      // @ts-expect-error testing runtime type check
      expect(() => new T({ address: "not an object" })).toThrow(ValidationError);
    });

    it("should validate nested fields", () => {
      class T extends entity({ address: object({ zip: string().minLength(5) }) }) {}
      expect(() => new T({ address: { zip: "123" } })).toThrow(ValidationError);
      expect(() => new T({ address: { zip: "12345" } })).not.toThrow();
    });

    it("should work with notRequired", () => {
      class T extends entity({ address: object({ street: string() }).notRequired() }) {}
      const instance = new T({});
      expect(instance.address).toBeUndefined();
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
