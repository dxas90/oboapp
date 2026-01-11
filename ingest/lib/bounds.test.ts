import { describe, it, expect } from "vitest";
import { SOFIA_BOUNDS, SOFIA_BBOX, isWithinSofia } from "./bounds";

describe("bounds", () => {
  describe("SOFIA_BOUNDS", () => {
    it("should have correct Sofia boundaries", () => {
      expect(SOFIA_BOUNDS).toEqual({
        south: 42.605,
        west: 23.188,
        north: 42.83,
        east: 23.528,
      });
    });
  });

  describe("SOFIA_BBOX", () => {
    it("should format bounds as bbox string", () => {
      expect(SOFIA_BBOX).toBe("42.605,23.188,42.83,23.528");
    });
  });

  describe("isWithinSofia", () => {
    it("should return true for Sofia center", () => {
      expect(isWithinSofia(42.6977, 23.3219)).toBe(true);
    });

    it("should return true for coordinates within Sofia", () => {
      expect(isWithinSofia(42.7, 23.3)).toBe(true);
    });

    it("should return true for southwest corner", () => {
      expect(isWithinSofia(SOFIA_BOUNDS.south, SOFIA_BOUNDS.west)).toBe(true);
    });

    it("should return true for northeast corner", () => {
      expect(isWithinSofia(SOFIA_BOUNDS.north, SOFIA_BOUNDS.east)).toBe(true);
    });

    it("should return true for northwest corner", () => {
      expect(isWithinSofia(SOFIA_BOUNDS.north, SOFIA_BOUNDS.west)).toBe(true);
    });

    it("should return true for southeast corner", () => {
      expect(isWithinSofia(SOFIA_BOUNDS.south, SOFIA_BOUNDS.east)).toBe(true);
    });

    it("should return false for coordinates outside Sofia (too far north)", () => {
      expect(isWithinSofia(43.0, 23.3)).toBe(false);
    });

    it("should return false for coordinates outside Sofia (too far south)", () => {
      expect(isWithinSofia(42.5, 23.3)).toBe(false);
    });

    it("should return false for coordinates outside Sofia (too far east)", () => {
      expect(isWithinSofia(42.7, 23.6)).toBe(false);
    });

    it("should return false for coordinates outside Sofia (too far west)", () => {
      expect(isWithinSofia(42.7, 23.1)).toBe(false);
    });

    it("should return false for coordinates completely outside Sofia", () => {
      expect(isWithinSofia(45.0, 25.0)).toBe(false);
    });
  });
});
