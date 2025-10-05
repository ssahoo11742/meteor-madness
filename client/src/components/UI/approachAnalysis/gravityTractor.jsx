import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { scalarMultiply, norm, cross, addVec, keplerianToCartesian } from "./transform";
import { useState } from "react";
import { gravityTractor } from "./transform";

export const GravityTractorSection = ({
  orbitalElements,
  applyNewElements,
  gtMass,
  setGtMass,
  gtDistance,
  setGtDistance,
  gtDuration,
  setGtDuration,
  gtDirection,
  setGtDirection,
}) => {
  const [showCloseUp, setShowCloseUp] = useState(true);

  // Convert keplerian to cartesian for visualization
  const { r_vec, v_vec } = keplerianToCartesian(
    orbitalElements.a,
    orbitalElements.e,
    orbitalElements.i,
    orbitalElements.om,
    orbitalElements.w,
    orbitalElements.ma
  );

  // Spacecraft position based on direction and distance
  let scPos;
  const unitV = scalarMultiply(v_vec, 1 / norm(v_vec));
  const unitR = scalarMultiply(r_vec, 1 / norm(r_vec));
  const h_vec = cross(r_vec, v_vec);
  const unitH = scalarMultiply(h_vec, 1 / norm(h_vec));

  switch (gtDirection) {
    case "alongVelocity":
      scPos = addVec(r_vec, scalarMultiply(unitV, gtDistance));
      break;
    case "radial":
      scPos = addVec(r_vec, scalarMultiply(unitR, gtDistance));
      break;
    case "normal":
      scPos = addVec(r_vec, scalarMultiply(unitH, gtDistance));
      break;
    default:
      scPos = addVec(r_vec, scalarMultiply(unitV, gtDistance));
  }

  // Simple 2D orbit points for visualization
  const orbitPoints = [];
  for (let theta = 0; theta < 2 * Math.PI; theta += 0.05) {
    const a = orbitalElements.a;
    const e = orbitalElements.e;
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    orbitPoints.push([r * Math.cos(theta), r * Math.sin(theta), 0]);
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-4">
      <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
        Gravity Tractor
      </h4>

      <div className="space-y-3">
        {/* Mass */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Spacecraft Mass (kg)</label>
          <input
            type="number"
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={gtMass}
            onChange={(e) => setGtMass(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Distance */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Distance from Asteroid (km)</label>
          <input
            type="number"
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={gtDistance}
            onChange={(e) => setGtDistance(parseFloat(e.target.value) || 1)}
          />
        </div>

        {/* Duration */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Duration (days)</label>
          <input
            type="number"
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={gtDuration}
            onChange={(e) => setGtDuration(parseFloat(e.target.value) || 1)}
          />
        </div>

        {/* Direction */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Direction</label>
          <select
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={gtDirection}
            onChange={(e) => setGtDirection(e.target.value)}
          >
            <option value="alongVelocity">Along Velocity</option>
            <option value="radial">Radial</option>
            <option value="normal">Normal (perpendicular)</option>
          </select>
        </div>

        {/* Apply button */}
        <button
          className="w-full bg-green-600 hover:bg-green-700 rounded p-2 font-semibold shadow mt-2"
          onClick={() => {
            const durationSec = gtDuration * 24 * 3600;
            const newElements = gravityTractor(
              orbitalElements,
              gtMass,
              gtDistance,
              durationSec,
              86400, // dt = 1 day for safety
              gtDirection
            );
            applyNewElements(newElements);
          }}
        >
          Apply Gravity Tractor
        </button>

        {/* Show Close-Up Button */}
        {/* <button
          className="w-full bg-blue-600 hover:bg-blue-700 rounded p-2 font-semibold shadow mt-2"
          onClick={() => setShowCloseUp(!showCloseUp)}
        >
          {showCloseUp ? "Hide Close-Up" : "Show Close-Up"}
        </button> */}

        {/* 3D Scene */}
{showCloseUp && (
  <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden mt-2">
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />

      {/* Simple circular orbit */}
      <Line
        points={Array.from({ length: 128 }, (_, i) => {
          const theta = (i / 128) * 2 * Math.PI;
          return new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
        })}
        color="yellow"
        lineWidth={2}
      />

      {(() => {
        const asteroidPos = new THREE.Vector3(1, 0, 0);

        // Default spacecraft position = asteroid position
        const scPos = asteroidPos.clone();

        switch (gtDirection) {
          case "alongVelocity":
            scPos.add(new THREE.Vector3(0.20, 0.5, 0)); // shift +Y
            break;
          case "radial":
            scPos.setLength(asteroidPos.length() - 0.5); // pull inward by 0.5
            break;
          case "normal":
            scPos.add(new THREE.Vector3(0, 0, 0.5)); // shift +Z
            break;
          default:
            break;
        }

        return (
          <>
            {/* Asteroid */}
            <Sphere args={[0.21, 32, 32]} position={asteroidPos.toArray()}>
              <meshStandardMaterial color="orange" />
            </Sphere>

            {/* Spacecraft */}
            <Sphere args={[0.08, 16, 16]} position={scPos.toArray()}>
              <meshStandardMaterial color="cyan" />
            </Sphere>
          </>
        );
      })()}
    </Canvas>
  </div>
)}


      </div>
    </div>
  );
};
