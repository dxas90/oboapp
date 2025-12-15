"use client";

import React from "react";
import { Marker, Polyline, Polygon } from "@react-google-maps/api";
import { Message } from "@/lib/types";

interface GeoJSONLayerProps {
  readonly messages: Message[];
}

// Colors for different types of GeoJSON features
const GEOJSON_STYLES = {
  lineString: {
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 3,
  },
  polygon: {
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.2,
  },
};

export default function GeoJSONLayer({ messages }: GeoJSONLayerProps) {
  const features: React.ReactElement[] = [];

  console.log("GeoJSONLayer rendering with messages:", messages.length);

  messages.forEach((message) => {
    console.log("Processing message:", message.id, "geoJson:", message.geoJson);

    if (!message.geoJson?.features) {
      console.log("No geoJson features for message:", message.id);
      return;
    }

    console.log("Found", message.geoJson.features.length, "features");

    message.geoJson.features.forEach((feature, featureIndex) => {
      const key = `${message.id}-geojson-${featureIndex}`;

      console.log("Rendering feature:", {
        key,
        type: feature.geometry.type,
        properties: feature.properties,
        coordinates: feature.geometry.coordinates,
      });

      // Render based on geometry type
      if (feature.geometry.type === "Point") {
        const coords = feature.geometry.coordinates;
        console.log("Creating Point marker at:", {
          lat: coords[1],
          lng: coords[0],
        });

        features.push(
          <Marker
            key={key}
            position={{ lat: coords[1], lng: coords[0] }}
            icon={{
              path: "M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0", // SVG circle path
              fillColor: "#FF0000",
              fillOpacity: 0.8,
              strokeWeight: 2,
              strokeColor: "#ffffff",
              scale: 1,
            }}
            title={feature.properties?.address || "Pin"}
            onClick={() => {
              console.log("GeoJSON point clicked:", feature.properties);
            }}
          />
        );
      } else if (feature.geometry.type === "LineString") {
        const path = feature.geometry.coordinates.map((coord) => ({
          lat: coord[1],
          lng: coord[0],
        }));
        features.push(
          <Polyline key={key} path={path} options={GEOJSON_STYLES.lineString} />
        );
      } else if (feature.geometry.type === "Polygon") {
        const paths = feature.geometry.coordinates[0].map((coord) => ({
          lat: coord[1],
          lng: coord[0],
        }));
        features.push(
          <Polygon key={key} paths={paths} options={GEOJSON_STYLES.polygon} />
        );
      }
    });
  });

  return <>{features}</>;
}
