// =============================================================================
// ENHANCED MAP SCREEN WITH CATEGORIZED HAZARD SYMBOLS
// File path: client/src/components/screens/MapScreen.tsx
// =============================================================================

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";

import { AlertTriangle, Navigation, Users } from "lucide-react";
import Header from "../layout/Header";
import GroupMemberItem from "../common/GroupMemberItem";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import notificationService from "../../services/notificationService";

import type { FeatureCollection, Polygon } from "geojson";
import zones from "../../data/zones.json";
import sachet from "../../data/sachet.json";
import landslide from "../../data/landslide.json";

interface MapScreenProps {
  groupMembers: any[];
  mapContainer: any;
}

interface RestrictedAreaProperties {
  name?: string;
}

const geojsonData: FeatureCollection<Polygon, RestrictedAreaProperties> = {
  ...(zones as any),
  type: "FeatureCollection",
} as FeatureCollection<Polygon, RestrictedAreaProperties>;

const MapScreen: React.FC<MapScreenProps> = ({ groupMembers, mapContainer }) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const geojsonDataRef = useRef<FeatureCollection<Polygon, RestrictedAreaProperties>>(null);
  const hazardDataRef = useRef<any>({ sachet: [], landslide: [] });
  const { t } = useTranslation();

  // Enhanced disaster categorization function
  const categorizeDisaster = (disasterType: string) => {
    const type = disasterType.toLowerCase();
    
    // Rain-related disasters
    if (type.includes('light rain') || type.includes('moderate rain')) return 'light_rain';
    if (type.includes('heavy rain') || type.includes('very heavy rain')) return 'heavy_rain';
    
    // Thunderstorm-related
    if (type.includes('thunderstorm') || type.includes('lightning')) return 'thunderstorm';
    if (type.includes('thunder shower')) return 'thunder_shower';
    
    // Wind-related
    if (type.includes('cyclone') || type.includes('surface wind')) return 'cyclone';
    
    // Flood-related
    if (type.includes('flood')) return 'flood';
    
    // Landslide
    if (type.includes('landslide')) return 'landslide';
    
    return 'general'; // default for other disasters
  };

  // Helper function to create hazard notification
  const createHazardNotification = async (
    hazardType: string,
    message: string,
    location?: any
  ) => {
    try {
      const lngLat = markerRef.current?.getLngLat();
      const notificationLocation =
        location ||
        (lngLat
          ? {
              type: "Point",
              coordinates: [lngLat.lng, lngLat.lat] as [number, number],
              address: "Current Location",
            }
          : undefined);

      await notificationService.handleMapHazardAlert(
        hazardType,
        message,
        notificationLocation
      );
    } catch (error) {
      console.error("Failed to create hazard notification:", error);
    }
  };

  // Function to check if point is inside hazard circles
  const checkHazardCollision = (userPoint: any) => {
    const hazardMessages: string[] = [];
    const baseRadius = 2; // 2km radius

    hazardDataRef.current.sachet.forEach((sachetItem: any) => {
      if (!sachetItem.centroid) return;

      const [lon, lat] = sachetItem.centroid.split(",").map(Number);
      const hazardCenter = turf.point([lon, lat]);
      const distance = turf.distance(userPoint, hazardCenter, {
        units: "kilometers",
      });

      if (distance <= baseRadius) {
        const message =
          t("map.disasterAlert") +
          ": " +
          sachetItem.area_description +
          ", " +
          t("map.severity") +
          ": " +
          sachetItem.severity;
        hazardMessages.push(message);

        createHazardNotification(
          "sachet",
          `Disaster alert in your area: ${sachetItem.area_description}. Severity level: ${sachetItem.severity}. Please take necessary precautions.`,
          {
            type: "Point",
            coordinates: [lon, lat] as [number, number],
            address: sachetItem.area_description || "Alert Area",
          }
        );
      }
    });

    hazardDataRef.current.landslide.forEach((landslideItem: any) => {
      if (!landslideItem.lat || !landslideItem.lon) return;

      const hazardCenter = turf.point([landslideItem.lon, landslideItem.lat]);
      const distance = turf.distance(userPoint, hazardCenter, {
        units: "kilometers",
      });

      if (distance <= baseRadius) {
        const message =
          t("map.landslideAlert") +
          ": " +
          landslideItem.state +
          ", " +
          landslideItem.district +
          ", " +
          landslideItem.location +
          ", " +
          landslideItem.status;
        hazardMessages.push(message);

        createHazardNotification(
          "landslide",
          `Landslide hazard detected at your location. Area: ${landslideItem.location}, ${landslideItem.district}, ${landslideItem.state}. Status: ${landslideItem.status}. Please avoid this area and move to safety.`,
          {
            type: "Point",
            coordinates: [landslideItem.lon, landslideItem.lat] as [number, number],
            address: `${landslideItem.location}, ${landslideItem.district}, ${landslideItem.state}`,
          }
        );
      }
    });

    return hazardMessages;
  };

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [92.9376, 26.2006], // Assam
      zoom: 6,
    });

    mapRef.current.on("load", async () => {
      geojsonDataRef.current = geojsonData;

      // Add restricted areas
      mapRef.current!.addSource("restricted-areas", {
        type: "geojson",
        data: geojsonData,
      });

      mapRef.current!.addLayer({
        id: "restricted-fill",
        type: "fill",
        source: "restricted-areas",
        paint: { "fill-color": "#f1f100", "fill-opacity": 0.4 },
      });

      mapRef.current!.addLayer({
        id: "restricted-outline",
        type: "line",
        source: "restricted-areas",
        paint: {
          "line-color": "#f1c100",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });

      // Add warning symbols for zones
      const zonePoints = {
        type: "FeatureCollection",
        features: geojsonData.features.map((feature) => {
          const centroid = turf.centroid(feature);
          return {
            type: "Feature",
            geometry: centroid.geometry,
            properties: {
              ...feature.properties,
              symbolType: "warning"
            }
          };
        })
      };

      mapRef.current!.addSource("zone-symbols", {
        type: "geojson",
        data: zonePoints as any,
      });

      mapRef.current!.addLayer({
        id: "zone-warning-symbols",
        type: "circle",
        source: "zone-symbols",
        paint: {
          "circle-radius": 7,
          "circle-color": "#FFD700",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFA500"
        }
      });

      mapRef.current!.addLayer({
        id: "zone-warning-text",
        type: "symbol",
        source: "zone-symbols",
        layout: {
          "text-field": "!",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 8,
          "text-allow-overlap": true
        },
        paint: {
          "text-color": "#000"
        }
      });

      mapRef.current!.addLayer({
        id: "zone-warning-labels",
        type: "symbol",
        source: "zone-symbols",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1],
          "text-anchor": "top",
          "text-size": 8,
          "text-allow-overlap": false
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1
        }
      });

      // Draggable marker
      markerRef.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([92.9376, 26.2006])
        .addTo(mapRef.current!);

      const fetchHazards = async () => {
        try {
          const sachetData = sachet;
          const landslideData = landslide;

          hazardDataRef.current = {
            sachet: sachetData,
            landslide: landslideData,
          };

          const baseRadius = 2; // 2km radius
          let t = 0;

          const buildPolygons = (scale: number) => {
            const features: GeoJSON.Feature<GeoJSON.Geometry>[] = [];

            sachetData.forEach((a: any) => {
              if (!a.centroid) return;
              const [lon, lat] = a.centroid.split(",").map(Number);
              const circle = turf.circle([lon, lat], baseRadius * scale, {
                units: "kilometers",
                steps: 64,
              });
              features.push({
                type: "Feature",
                geometry: circle.geometry,
                properties: { ...a, type: "Sachet" },
              });
            });

            landslideData.forEach((ls: any) => {
              if (!ls.lat || !ls.lon) return;
              const circle = turf.circle([ls.lon, ls.lat], baseRadius * scale, {
                units: "kilometers",
                steps: 64,
              });
              features.push({
                type: "Feature",
                geometry: circle.geometry,
                properties: { ...ls, type: "Landslide" },
              });
            });

            return {
              type: "FeatureCollection",
              features,
            } as GeoJSON.FeatureCollection;
          };

          const staticPolygons = buildPolygons(1);

          mapRef.current!.addSource("static-hazards", {
            type: "geojson",
            data: staticPolygons,
          });

          mapRef.current!.addLayer({
            id: "static-hazard-fill",
            type: "fill",
            source: "static-hazards",
            paint: {
              "fill-color": "rgba(255,0,0,0.15)",
              "fill-outline-color": "red",
            },
          });

          mapRef.current!.addSource("hazards", {
            type: "geojson",
            data: buildPolygons(1),
          });

          mapRef.current!.addLayer({
            id: "hazard-fill",
            type: "fill",
            source: "hazards",
            paint: {
              "fill-color": "rgba(255,0,0,0.2)",
              "fill-outline-color": "red",
            },
          });

          // Create categorized hazard point sources
          const hazardCategories = {
            light_rain: { color: "#87CEEB", icon: "💧", name: "Light Rain" },
            heavy_rain: { color: "#4682B4", icon: "🌧️", name: "Heavy Rain" },
            thunderstorm: { color: "#9370DB", icon: "⛈️", name: "Thunderstorm" },
            thunder_shower: { color: "#8A2BE2", icon: "🌦️", name: "Thunder Shower" },
            cyclone: { color: "#FF6347", icon: "🌪️", name: "Cyclone/Wind" },
            flood: { color: "#0077BE", icon: "🌊", name: "Flood" },
            landslide: { color: "#8B4513", icon: "⛰️", name: "Landslide" },
            general: { color: "#FF4500", icon: "⚠️", name: "General Alert" }
          };

          // Group sachet data by disaster type
          const groupedSachetData: { [key: string]: any[] } = {};
          Object.keys(hazardCategories).forEach(key => {
            groupedSachetData[key] = [];
          });

          sachetData.forEach((item: any) => {
            if (!item.centroid) return;
            const category = categorizeDisaster(item.disaster_type);
            const [lon, lat] = item.centroid.split(",").map(Number);
            
            groupedSachetData[category].push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lon, lat]
              },
              properties: {
                ...item,
                symbolType: category,
                name: `${item.disaster_type} Alert`,
                category: category
              }
            });
          });

          // Add landslide data
          landslideData.forEach((item: any) => {
            if (!item.lat || !item.lon) return;
            groupedSachetData.landslide.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [item.lon, item.lat]
              },
              properties: {
                ...item,
                symbolType: "landslide",
                name: `Landslide Alert`,
                category: "landslide"
              }
            });
          });

          // Create sources and layers for each hazard category
          Object.entries(hazardCategories).forEach(([category, config]) => {
            const categoryData = {
              type: "FeatureCollection",
              features: groupedSachetData[category] || []
            };

            if (categoryData.features.length === 0) return;

            // Add source
            mapRef.current!.addSource(`${category}-symbols`, {
              type: "geojson",
              data: categoryData as any,
            });

            // Add icon
            mapRef.current!.addLayer({
              id: `${category}-symbols-icon`,
              type: "symbol",
              source: `${category}-symbols`,
              layout: {
                "text-field": config.icon,
                "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                "text-size": 8,
                "text-allow-overlap": true
              },
              paint: {
                "text-color": "#fff"
              }
            });

            // Add labels
            mapRef.current!.addLayer({
              id: `${category}-symbols-labels`,
              type: "symbol",
              source: `${category}-symbols`,
              layout: {
                "text-field": ["get", "name"],
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 1],
                "text-anchor": "top",
                "text-size": 8,
                "text-allow-overlap": false
              },
              paint: {
                "text-color": config.color,
                "text-halo-color": "#fff",
                "text-halo-width": 1
              }
            });
          });

          // Animate hazard circles
          function animatePolygons() {
            t = (t + 0.01) % (2 * Math.PI);
            const scale = 2 + 1 * Math.sin(t);
            (mapRef.current!.getSource("hazards") as any).setData(
              buildPolygons(scale)
            );
            requestAnimationFrame(animatePolygons);
          }
          animatePolygons();

        } catch (err) {
          console.error("Failed to fetch hazards:", err);
        }
      };
      await fetchHazards();

      markerRef.current!.on("dragend", async () => {
        const lngLat = markerRef.current!.getLngLat();
        const point = turf.point([lngLat.lng, lngLat.lat]);

        const hazardMessages: string[] = [];

        geojsonDataRef.current?.features.forEach((feature: any) => {
          if (turf.booleanPointInPolygon(point, feature)) {
            const message =
              t("map.restrictedArea") + ": " + (feature.properties.name || "");
            hazardMessages.push(message);

            createHazardNotification(
              "restricted_area",
              `You have entered a restricted area: ${
                feature.properties.name || "Unknown area"
              }. Please move to a safe location.`,
              {
                type: "Point",
                coordinates: [lngLat.lng, lngLat.lat] as [number, number],
                address: feature.properties.name || "Restricted Area",
              }
            );
          }
        });

        const staticHazardMessages = checkHazardCollision(point);
        hazardMessages.push(...staticHazardMessages);

        if (hazardMessages.length > 0) {
          toast.error(hazardMessages.join("\n"));
        } else {
          toast.success(t("map.safeZoneMessage"));
        }
      });
    });

    return () => mapRef.current?.remove();
  }, [t]);

  return (
    <div className="space-y-4">
      <Header title={t("map.liveMap")} />

      <div className="px-4 space-y-4">
        <div className="relative">
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-2xl overflow-hidden shadow-lg"
          />
          <div className="flex flex-col text-sm text-blue-800 rounded-md bg-blue-300 border border-blue-400 px-2 my-2">
            <div>Drag and drop map-pin to simulate location based geofencing alerts</div>
          </div>

          <div className="absolute top-4 left-4 bg-white rounded-xl p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-gray-600">Live Tracking</span>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-white rounded-xl p-3 shadow-lg">
            <button
              className="text-sm font-medium text-blue-600"
              onClick={() => {
                if (mapRef.current && markerRef.current) {
                  mapRef.current.flyTo({
                    center: markerRef.current.getLngLat(),
                    zoom: 7,
                  });
                }
              }}
            >
              {t("map.recenter")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <Users className="text-purple-600 mx-auto mb-2" size={24} />
            <p className="text-lg font-bold text-gray-900">
              {groupMembers.filter((m) => m.status === "safe").length}/
              {groupMembers.length}
            </p>
            <p className="text-xs text-gray-500">{t("map.safe")}</p>
          </div>

          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <AlertTriangle className="text-orange-600 mx-auto mb-2" size={24} />
            <p className="text-lg font-bold text-gray-900">
              {hazardDataRef.current.sachet.length +
                hazardDataRef.current.landslide.length}
            </p>
            <p className="text-xs text-gray-500">{t("map.warnings")}</p>
          </div>

          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <Navigation className="text-blue-600 mx-auto mb-2" size={24} />
            <p className="text-lg font-bold text-gray-900">0.8km</p>
            <p className="text-xs text-gray-500">{t("map.toHotel")}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t("map.travelGroup")}
          </h3>
          <div className="space-y-3">
            {groupMembers.map((member) => (
              <GroupMemberItem key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;