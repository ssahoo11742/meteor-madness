import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { IntensityMap } from "./IntensityMap";
import { TsunamiOverlay } from "./TsunamiMap";
import { FaultLinesOverlay } from "./fault";
// Fix marker icon issue in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const generateImpactSummary = (impactData) => {
  if (!impactData) return [];
  const summary = [];

  const energyMt = impactData.Energy?.entry_energy_mt;
  if (energyMt) summary.push(`💥 Estimated impact energy: ${energyMt.toLocaleString()} MT TNT equivalent.`);

  const entry = impactData.Atmospheric_Entry || {};
  const breakupAlt = entry.breakup_altitude_m;
  const groundVel = entry.ground_velocity_km_s;
  const energyLostMt = entry.energy_lost_mt;

  if (breakupAlt) summary.push(`☁️ The asteroid begins breaking up at ${breakupAlt.toLocaleString()} meters.`);
  if (energyLostMt) summary.push(`⚡ Energy deposited in atmosphere: ${energyLostMt.toLocaleString()} MT.`);
  if (groundVel) summary.push(`🚀 Residual fragments impact at ~${groundVel.toLocaleString()} km/s.`);

  const airBlast = impactData.Air_Blast || {};
  const arrivalTime = airBlast.arrival_time_s;
  if (arrivalTime !== undefined) summary.push(`🌪️ Air blast arrives ~${arrivalTime} seconds after impact.`);

  return summary;
};

export const ImpactReportSection = ({ data }) => {
  const [markerPosition, setMarkerPosition] = useState(null);
  const [impactEffects, setImpactEffects] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [center, setCenter] = useState(null);
  const [showPopulation, setShowPopulation] = useState(false);
  const [showFaultLines, setShowFaultLines] = useState(false);

  const calculateImpactEffects = async () => {
    setLoading(true);
    if (!markerPosition) return;
    

    let density;
    const mass = data.sentry_data?.summary?.mass;
    const diameter_m = data.sentry_data?.summary?.diameter ?? data.estimated_diameter_km?.kilometers * 1000?? 0.5;
    const velocity_km_s = data.close_approaches[0]?.relative_velocity?.kilometers_per_second ?? 20;
    const energy_loss = data.impact_effects.land_impact.Atmospheric_Entry.energy_lost_J;

    if (mass) {
      const radius_m = diameter_m / 2;
      const volume = (4 / 3) * Math.PI * Math.pow(radius_m, 3);
      density = Math.floor(mass / volume);
    } else {
      density = 3000;
    }

    try {
      const res = await fetch("http://localhost:8000/impact_effects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coords: markerPosition,
          diameter_m,
          density_kg_m3: density,
          velocity_m_s: velocity_km_s * 1000,
          energy_loss,
          tsunami_data: data.impact_effects?.water_impact?.Tsunami_Wave || {},
        }),
      });
      const json = await res.json();
      setImpactEffects(json);
      setSlideIndex(0);
    } catch (err) {
      console.error("Error fetching impact effects:", err);
      alert("Failed to calculate impact effects.");
    }
    setLoading(false);
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return markerPosition ? <Marker position={markerPosition} /> : null;
  };

  const isWater = impactEffects?.water ?? false;
  const impactData = isWater
    ? data.impact_effects?.water_impact
    : data.impact_effects?.land_impact;

  const displaySections = impactData
    ? {
        Energy: {
          "Impact Energy (MT TNT)": impactData.Energy?.entry_energy_mt || impactData.Energy?.entry_energy_J / 4.184e+15,
          "Energy Lost in Atmosphere (MT TNT)": impactData.Atmospheric_Entry?.energy_lost_mt,
        },
        "Atmospheric Entry": {
          "Impact Velocity (km/s)": impactData.Atmospheric_Entry?.ground_velocity_km_s,
          "Breakup Altitude (km)": impactData.Atmospheric_Entry?.breakup_altitude_m
            ? (impactData.Atmospheric_Entry.breakup_altitude_m / 1000).toFixed(1)
            : "Not Available",
        },
        "Population Affected": {
          "Causalties/Deaths": impactEffects?.population || "Not Available",
        },
        "Crater Dimensions": isWater
          ? {
              "Ocean Crater Diameter (km)": impactData.Crater_Dimensions?.ocean_crater_diameter_km,
              "Final Crater Diameter (km)": impactData.Crater_Dimensions?.final_crater_diameter_km,
            }
          : {
              "Final Crater Diameter (m)": impactData.Crater_Dimensions?.final_crater_diameter_m,
              "Final Crater Depth (m)": impactData.Crater_Dimensions?.final_crater_depth_m,
              "Breccia Thickness (m)": impactData.Crater_Dimensions?.breccia_thickness_m,
            },
        "Thermal Radiation": {
          "Fireball Radius (km)": impactData.Thermal_Radiation?.fireball_radius_km,
          "Duration of Irradiation (min)": impactData.Thermal_Radiation?.duration_irradiation_min,
        },
        "Air Blast": {
          "Peak Pressure (psi)": impactData.Air_Blast?.peak_overpressure_psi,
          "Max Wind Velocity (m/s)": impactData.Air_Blast?.max_wind_velocity_m_s,
          "Sound Intensity (dB)": impactData.Air_Blast?.sound_intensity_dB,
        },
        ...(isWater
          ? {
              Tsunami: {
                "Arrival Time (min)": impactData.Tsunami_Wave?.arrival_time_min,
                "Wave Height (m)": impactData.Tsunami_Wave?.wave_amplitude_max_m,
              },
            }
          : {}),
        "Seismic Effects": {
          "Arrival Time (s)": impactData.Seismic_Effects?.arrival_time_m,
          Thickness: impactData.Seismic_Effects?.thickness_cm,
          "Richter Scale": impactEffects?.richter_magnitude ?? "Not Available",
        },
      }
    : {};

  const summaryList = generateImpactSummary(impactData);
  const sectionKeys = Object.keys(displaySections);
  const currentSectionKey = sectionKeys[slideIndex] ?? null;
  const currentSectionValues = currentSectionKey ? displaySections[currentSectionKey] : null;

  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + sectionKeys.length) % sectionKeys.length);
  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % sectionKeys.length);
  const [landPolygons, setLandPolygons] = useState(null);

  useEffect(() => {
    fetch("/land.geojson")
      .then(res => res.json())
      .then(data => setLandPolygons(data))
      .catch(err => console.error(err));
  }, []);


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Map */}
      <div className="mt-6">
        
        <h3 className="text-xl font-semibold mb-2 text-white">Select Impact Location</h3>
        <MapContainer center={[20, 0]} zoom={2} style={{ height: "400px", width: "100%" }} className="rounded-xl overflow-hidden shadow-sm">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <LocationMarker />
          <IntensityMap impactLocation={markerPosition} magnitude={impactEffects?.richter_magnitude || 0} />
          {impactEffects?.tsunami && (
          <TsunamiOverlay 
            key={`${center?.[0]}-${center?.[1]}-${impactEffects?.tsunami?.radius_km}`} 
            center={center} 
            tsunami={impactEffects.tsunami} 
            landPolygons={landPolygons}
            impactEffects={impactEffects}
          />

          )}
          { showPopulation &&
            <TileLayer
                url="https://titiler-897938321824.us-west1.run.app/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@2x?colormap_name=viridis&bidx=1&url=https%3A%2F%2Fstorage.googleapis.com%2Fnatcap-data-cache%2Fglobal%2Fciesin-nasa-gpw-grdi%2Fciesen_nasa_gpw_v4_population_density_2020.tif&rescale=0.0%2C478.38543701171875"
                opacity={0.7}
              />
          }
          { showFaultLines &&
            <FaultLinesOverlay visible={showFaultLines} color="#ff5555" weight={1.5} opacity={0.9} />
          }
          
        </MapContainer>
        <div className="flex items-center gap-4 mb-3 text-white">
          <label>
            <input
              type="checkbox"
              checked={showPopulation}
              onChange={(e) => setShowPopulation(e.target.checked)}
              className="mr-2"
            />
            Population Density
          </label>
          <label>
            <input
              type="checkbox"
              checked={showFaultLines}
              onChange={(e) => setShowFaultLines(e.target.checked)}
              className="mr-2"
            />
            Fault Lines
          </label>
        </div>

        {markerPosition ? (
          <p className="mt-2 text-white">Selected Coordinates: Lat {markerPosition[0].toFixed(4)}, Lng {markerPosition[1].toFixed(4)}</p>
        ) : (
          <p className="mt-2 text-gray-400 italic">Please select a location to calculate impact effects</p>
        )}
        <button
          onClick={()=> {calculateImpactEffects(); setCenter(markerPosition);}}
          disabled={loading || !markerPosition}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Calculate Impact Effects"}
        </button>
      </div>

      {/* Summary */}
      {summaryList.length > 0 && (
        <div className="mb-6 p-4 border rounded-xl shadow-sm bg-gray-800 text-white mt-4">
          <h3 className="text-xl font-semibold mb-2">📝 Summary</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {summaryList.map((line, idx) => <li key={idx}>{line}</li>)}
          </ul>
        </div>
      )}

{/* Details Slideshow */}
{impactData && sectionKeys.length > 0 && (
  <div className="mb-6 mt-4">
    <h3 className="text-xl font-semibold mb-2 text-white">📊 Details</h3>

    {/* Card */}
    <div className="max-w-2xl mx-auto p-4 border rounded-xl shadow-sm bg-gray-800 text-white">
      <h4 className="text-lg font-semibold mb-2">{currentSectionKey}</h4>
      {currentSectionValues && Object.keys(currentSectionValues).length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {Object.entries(currentSectionValues).map(([label, value]) => (
            <li key={label} className="flex justify-between">
              <span className="font-medium">{label}:</span>
              <span>
                {value !== null && value !== undefined
                  ? typeof value === "number"
                    ? value.toLocaleString()
                    : value
                  : "Not Available"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">No data available</p>
      )}
    </div>

    {/* Navigation arrows under the card */}
    <div className="flex justify-center items-center mt-4 space-x-6">
      <button 
        onClick={prevSlide} 
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
      >
        &larr;
      </button>
      <span className="text-gray-400 text-sm me-5 ms-5">{slideIndex + 1} of {sectionKeys.length}</span>
      <button 
        onClick={nextSlide} 
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
      >
        &rarr;
      </button>
    </div>
  </div>
)}

    </div>
  );
};
