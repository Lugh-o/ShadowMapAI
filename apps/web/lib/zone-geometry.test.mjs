import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getZoneArea,
  getZoneGeometryError,
  MAX_ZONE_VERTICES,
} from "./zone-geometry.ts";

const square = [
  [-13, -38],
  [-13, -37.99],
  [-12.99, -37.99],
  [-12.99, -38],
];

test("accepts either winding and a simple concave polygon", () => {
  assert.equal(getZoneGeometryError(square), null);
  assert.equal(getZoneGeometryError([...square].reverse()), null);
  assert.equal(
    getZoneGeometryError([
      square[0],
      square[1],
      [-12.995, -37.995],
      square[2],
      square[3],
    ]),
    null,
  );
});

test("rejects incomplete, collinear and repeated vertices", () => {
  assert.match(getZoneGeometryError(square.slice(0, 2)), /três vértices/);
  assert.match(
    getZoneGeometryError([
      [-13, -38],
      [-13, -37.99],
      [-13, -37.98],
    ]),
    /mesma linha/,
  );
  assert.match(getZoneGeometryError([...square, square[0]]), /repetidos/);
});

test("rejects crossing edges and a non-adjacent vertex touching an edge", () => {
  assert.match(
    getZoneGeometryError([square[0], square[2], square[1], square[3]]),
    /se cruza/,
  );
  assert.match(
    getZoneGeometryError([
      square[0],
      square[1],
      square[2],
      [-13, -37.995],
      square[3],
    ]),
    /se cruza/,
  );
});

test("rejects invalid coordinates before geometric calculations", () => {
  for (const invalid of [
    [NaN, -38],
    [Infinity, -38],
    [-13, 181],
    [86, -38],
  ]) {
    assert.match(
      getZoneGeometryError([invalid, square[1], square[2]]),
      /inválidas/,
    );
  }
});

test("limits the number of vertices", () => {
  const points = Array.from({ length: MAX_ZONE_VERTICES + 1 }, (_, i) => {
    const angle = (i * Math.PI * 2) / (MAX_ZONE_VERTICES + 1);
    return [-13 + 0.01 * Math.sin(angle), -38 + 0.01 * Math.cos(angle)];
  });
  assert.match(getZoneGeometryError(points), /máximo/);
  assert.equal(getZoneGeometryError(points.slice(0, MAX_ZONE_VERTICES)), null);
});

test("area is finite, winding-independent and approximately correct near Salvador", () => {
  const area = getZoneArea(square);
  assert.ok(area > 1_150_000 && area < 1_250_000);
  assert.ok(Math.abs(getZoneArea([...square].reverse()) - area) < 0.01);
  assert.equal(getZoneArea([]), 0);
});
