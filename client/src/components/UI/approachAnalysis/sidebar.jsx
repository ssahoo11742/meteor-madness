import React, { useState } from "react";
import { simulateKineticImpact } from "./transform";
import { GravityTractorSection } from "./gravityTractor";
import KineticDeflector from "./kineticDeflector";
import { ImpactReportSection } from "./impactAnalysis";

export const Sidebar = ({
  setDeltaVMag,
  deltaVMag,
  orbitalElements,
  applyNewElements,
  applyDeltaV,
  setDeltaV,
  deltaV,
  show,
  setShow,
  name,
  designation,
  closestApproachDate,
  closestApproachData,
  sentry_data,
  data
}) => {
  const [direction, setDirection] = useState("alongVelocity");
  const [gtDirection, setGtDirection] = useState("alongVelocity");
  const [gtDistance, setGtDistance] = useState(0);
  const [gtMass, setGtMass] = useState(0);
  const [gtDuration, setGtDuration] = useState(1); // days

  const handleApplyKineticImpact = () => {
    const newElements = simulateKineticImpact(
      orbitalElements,
      deltaVMag,
      direction
    );
    applyNewElements(newElements);
  };

  // Shared classes for grids inside the sidebar
  const gridClasses = "grid gap-4 min-w-0";

  return (
    <>
      {/* Info Sidebar */}
      <div
        className={`fixed top-0 right-0 w-[40rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-90 text-white shadow-lg transform transition-transform ${
          show === "Info" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "40rem",
    minWidth: "40rem",
    maxWidth: "40rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-gray-400">{designation}</p>
          </div>

          {/* Approach Data */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Approach Data</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <p className="text-gray-400">Closest Approach</p>
                <p className="font-bold">
                  {new Date(closestApproachDate.getTime()).toUTCString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Velocity (km/s)</p>
                <p className="font-bold">
                  {parseFloat(
                    closestApproachData?.relative_velocity
                      ?.kilometers_per_second || 0
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Miss Distance (km)</p>
                <p className="font-bold">
                  {parseFloat(
                    closestApproachData?.miss_distance?.kilometers || 0
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Diameter (km)</p>
                <p className="font-bold">
                  {sentry_data?.summary?.diameter ??
                    data.estimated_diameter_km?.kilometers ??
                    "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <p className="text-gray-400">PHA?</p>
                <p className="font-bold">
                  {data.is_potentially_hazardous ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">MOID (AU)</p>
                <p className="font-bold">{data.orbital_data.moid}</p>
              </div>
              <div>
                <p className="text-gray-400">Palermo Score</p>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.ps_max ?? "--"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Torino Score</p>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.ts_max ?? "--"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Impact Prob.</p>
                <p className="font-bold">
                  {(parseFloat(data?.sentry_data?.summary?.ip) * 100).toFixed(
                    4
                  ) + "%" ?? "--"}
                </p>
              </div>
            </div>
          </div>

          {/* Damage Risk */}
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-2">Damage Assessment</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <p className="text-gray-400">Impact Vel. (km/s)</p>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.v_imp ?? "Not Available"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Impact Energy (MT TNT)</p>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.energy ?? "Not Available"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Mass (kg)</p>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.mass ?? "Not Available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modify Sidebar */}
      <div
        className={`fixed top-0 right-0 w-[40rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-95 text-white shadow-lg transform transition-transform ${
          show === "Modify" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "40rem",
    minWidth: "40rem",
    maxWidth: "40rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 h-full overflow-y-auto space-y-6">
          <h3 className="font-bold border-b border-gray-700 pb-2 mb-4">
            Modify Orbit
          </h3>

          {/* Manual Δv Input */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
            <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
              Manual Δv
            </h4>
            <div className={`${gridClasses} grid-cols-3`}>
              {["x", "y", "z"].map((axis) => (
                <div key={axis} className="flex flex-col">
                  <label className="text-gray-400 text-sm mb-1">
                    {axis.toUpperCase()} (m/s)
                  </label>
                  <input
                    type="number"
                    className="w-full max-w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={deltaV[axis]}
                    onChange={(e) =>
                      setDeltaV({
                        ...deltaV,
                        [axis]: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-3 w-full bg-green-600 hover:bg-green-700 rounded p-2 font-semibold shadow"
              onClick={() => {
                const newElements = applyDeltaV(
                  {
                    a: orbitalElements.a,
                    e: orbitalElements.e,
                    i: orbitalElements.i,
                    om: orbitalElements.om,
                    w: orbitalElements.w,
                    ma: orbitalElements.ma,
                  },
                  [deltaV.x, deltaV.y, deltaV.z]
                );
                applyNewElements(newElements);
              }}
            >
              Apply Δv
            </button>
          </div>

          {/* Kinetic Deflector */}
          <KineticDeflector
            handleApplyKineticImpact={handleApplyKineticImpact}
            setDeltaVMag={setDeltaVMag}
            deltaVMag={deltaVMag}
            setDirection={setDirection}
            direction={direction}
          />

          {/* Gravity Tractor */}
          <GravityTractorSection
            orbitalElements={orbitalElements}
            applyNewElements={applyNewElements}
            setGtDirection={setGtDirection}
            setGtDistance={setGtDistance}
            setGtDuration={setGtDuration}
            setGtMass={setGtMass}
            gtDirection={gtDirection}
            gtDistance={gtDistance}
            gtDuration={gtDuration}
            gtMass={gtMass}
          />
        </div>
      </div>

      {/* Impact Sidebar */}
      <div
        className={`fixed top-0 right-0 w-[40rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-95 text-white shadow-lg transform transition-transform ${
          show === "Impact" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "40rem",
    minWidth: "40rem",
    maxWidth: "40rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <ImpactReportSection data={data} />
        </div>
      </div>

      {/* Top Right Toggle Buttons */}
      <div className="fixed top-4 right-4 space-x-2 z-50">
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Info")}
        >
          Info
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Modify")}
        >
          Modify
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Impact")}
        >
          Impact
        </button>
      </div>
    </>
  );
};
