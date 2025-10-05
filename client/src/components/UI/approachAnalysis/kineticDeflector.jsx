// src/components/KineticDeflector.js
import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Sphere } from "@react-three/drei";
import * as THREE from "three";

export default function KineticDeflector({ handleApplyKineticImpact, setDeltaVMag, deltaVMag, setDirection, direction }) {

  const [showCloseUp, setShowCloseUp] = useState(true);

  // Child component for the 3D scene
function KineticScene({ direction }) {
  const asteroidPos = new THREE.Vector3(1, 0, 0);
  const craftRef = useRef();

  // Initial spacecraft position based on direction
  const getInitialScPos = () => {
    switch (direction) {
      case "alongVelocity":
        return new THREE.Vector3(1.2, 0.6, 0);
      case "radial":
        return new THREE.Vector3(0.44, 0, 0);
      case "normal":
        return new THREE.Vector3(1, 0, 0.5);
      default:
        return new THREE.Vector3(1, 0.6, 0);
    }
  };

  const scPos = useRef(getInitialScPos());
  const [impact, setImpact] = useState(false);

  // Arrow Helper Ref
  const arrowRef = useRef();

useFrame(() => {
  if (craftRef.current && arrowRef.current) {
    const from = craftRef.current.position;
    const to = asteroidPos;

    const dir = new THREE.Vector3().subVectors(to, from).normalize();

    // Compute distance and subtract asteroid radius
    const asteroidRadius = 0.21; // same as your Sphere args
    const fullDistance = from.distanceTo(to);
    const arrowLength = Math.max(fullDistance - asteroidRadius, 0); // prevent negative length

    arrowRef.current.setDirection(dir);
    arrowRef.current.setLength(arrowLength, 0.1, 0.05); // headLength, headWidth
    arrowRef.current.position.copy(from);
  }
});


  return (
    <>
      {/* Orbit circle */}
      <Line
        points={Array.from({ length: 128 }, (_, i) => {
          const theta = (i / 128) * 2 * Math.PI;
          return new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
        })}
        color="yellow"
        lineWidth={2}
      />

      {/* Asteroid */}
      <Sphere args={[0.21, 32, 32]} position={asteroidPos.toArray()}>
        <meshStandardMaterial color="orange" />
      </Sphere>

      {/* Spacecraft */}
      {!impact && (
        <Sphere ref={craftRef} args={[0.08, 16, 16]} position={scPos.current.toArray()}>
          <meshStandardMaterial color="cyan" />
        </Sphere>
      )}

      {/* Arrow from craft to asteroid */}
      <primitive
        ref={arrowRef}
        object={new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0), // initial dir (will be overwritten in useFrame)
          new THREE.Vector3(0, 0, 0), // initial pos (will be overwritten)
          1, // length
          0x00ff00 // color
        )}
      />
    </>
  );
}


  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-4">
      <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
        Kinetic Deflector
      </h4>

      <div className="space-y-3">
        {/* Δv Magnitude */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Δv Magnitude (km/s)</label>
          <input
            type="number"
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={deltaVMag * 1000}
            onChange={(e) => setDeltaVMag(parseFloat(e.target.value) / 1000)}
          />
        </div>

        {/* Direction */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Direction</label>
          <select
            className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="alongVelocity">Along Velocity</option>
            <option value="radial">Radial</option>
            <option value="normal">Normal (perpendicular)</option>
          </select>
        </div>

        {/* Apply Button */}
        <button
          className="w-full bg-green-600 hover:bg-green-700 rounded p-2 font-semibold shadow mt-2"
          onClick={() => handleApplyKineticImpact(deltaVMag, direction)}
        >
          Apply Kinetic Impact
        </button>
      </div>

      {/* 3D Scene */}
      {showCloseUp && (
        <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden mt-2">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />

            <KineticScene direction={direction} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
