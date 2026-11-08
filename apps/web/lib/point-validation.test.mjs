import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePointForm, POINT_BOUNDS, POINT_TEXT_LIMITS } from "./point-validation.ts";

const draft = {
  city: "Salvador", neighborhood: "  Itapuã  ", description: "  Local sem sombra.  ",
  lat: "-12.9718", lng: "-38.5011", heatLevel: "high", shadeLevel: "low",
  issueType: "low_tree_cover", priority: "high",
};

test("parses negative coordinates, decimal commas and trimmed text", () => {
  const { values, errors } = parsePointForm({ ...draft, lat: "-12,345" });
  assert.deepEqual(errors, {});
  assert.equal(values.lat, -12.345);
  assert.equal(values.lng, -38.5011);
  assert.equal(values.neighborhood, "Itapuã");
  assert.equal(values.description, "Local sem sombra.");
});

test("rejects incomplete, non-finite and out-of-range coordinates before saving", () => {
  for (const [field, invalid] of [
    ["lat", ""], ["lat", "-"], ["lat", "91"], ["lat", -91],
    ["lat", NaN], ["lng", Infinity], ["lng", "181"], ["lng", "1e308"],
    ["lng", "1e999"], ["lng", "0x20"], ["lat", "0"], ["lng", "0"],
  ]) {
    const result = parsePointForm({ ...draft, [field]: invalid });
    assert.equal(result.values, null, `${field}=${invalid}`);
    assert.ok(result.errors[field], `${field}=${invalid}`);
  }
});

test("accepts supported bounds and rejects coordinates beyond them", () => {
  for (const field of ["lat", "lng"]) {
    const { min, max } = POINT_BOUNDS[field];
    for (const value of [min, max])
      assert.ok(parsePointForm({ ...draft, [field]: value }).values);
    for (const value of [min - 0.000001, max + 0.000001])
      assert.ok(parsePointForm({ ...draft, [field]: value }).errors[field]);
  }
});

test("rejects blank and oversized text after trimming", () => {
  for (const field of ["neighborhood", "description"]) {
    for (const value of [" \t\n ", "A".repeat(POINT_TEXT_LIMITS[field] + 1)]) {
      const result = parsePointForm({ ...draft, [field]: value });
      assert.equal(result.values, null);
      assert.ok(result.errors[field]);
    }
    assert.ok(parsePointForm({ ...draft, [field]: "A".repeat(POINT_TEXT_LIMITS[field]) }).values);
  }
});
