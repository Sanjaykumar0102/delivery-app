import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./OrderMap.css";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to auto-fit bounds
function MapBounds({ pickup, dropoff }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    if (pickup?.lat && pickup?.lng) {
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (dropoff?.lat && dropoff?.lng) {
      bounds.push([dropoff.lat, dropoff.lng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, dropoff, map]);

  return null;
}

// Component to add routing control to map
function RoutingControl({ pickup, dropoff }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) return;

    // Remove existing routing control if any
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickup.lat, pickup.lng),
        L.latLng(dropoff.lat, dropoff.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: true,
      lineOptions: {
        styles: [
          { color: '#2196F3', opacity: 0.8, weight: 6 },
          { color: '#757575', opacity: 0.5, weight: 4 }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      altLineOptions: {
        styles: [
          { color: '#9E9E9E', opacity: 0.6, weight: 4 }
        ]
      },
      createMarker: function() { return null; }, // Don't create default markers
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, pickup, dropoff]);

  return null;
}

const OrderMap = ({ pickup, dropoff, driverLocation, route }) => {
  const [center, setCenter] = useState([12.9716, 77.5946]); // Default: Bangalore
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set center based on pickup location or default to Bangalore
    if (pickup?.lat && pickup?.lng) {
      setCenter([pickup.lat, pickup.lng]);
    } else if (dropoff?.lat && dropoff?.lng) {
      setCenter([dropoff.lat, dropoff.lng]);
    }
  }, [pickup, dropoff]);

  // Fetch route info from OSRM for display overlay
  useEffect(() => {
    const fetchRouteInfo = async () => {
      if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
        setRouteInfo(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=false&alternatives=true`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const routes = data.routes.map((route, index) => ({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.round(route.duration / 60),
            isPrimary: index === 0
          }));
          
          setRouteInfo(routes);
        }
      } catch (error) {
        console.error("Error fetching route info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteInfo();
  }, [pickup, dropoff]);

  // Convert route to polyline coordinates (for backward compatibility)
  const routeCoordinates = route?.map((point) => [point.lat, point.lng]) || [];

  return (
    <div className="order-map-wrapper">
      <div className="order-map-container">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%", borderRadius: "12px" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pickup Marker */}
          {pickup?.lat && pickup?.lng && (
            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
              <Popup>
                <div className="map-popup">
                  <h4>📍 Pickup Location</h4>
                  <p>{pickup.address || "Pickup Point"}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dropoff Marker */}
          {dropoff?.lat && dropoff?.lng && (
            <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
              <Popup>
                <div className="map-popup">
                  <h4>🎯 Dropoff Location</h4>
                  <p>{dropoff.address || "Dropoff Point"}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Driver Location Marker - Removed to show only pickup and dropoff */}

          {/* Routing Control - Shows route with directions on map */}
          {pickup?.lat && dropoff?.lat && !routeCoordinates.length && (
            <RoutingControl pickup={pickup} dropoff={dropoff} />
          )}

          {/* Fallback Route Polyline (if route prop is provided) */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              color="#2196F3"
              weight={4}
              opacity={0.7}
            />
          )}

          {/* Auto-fit bounds */}
          <MapBounds pickup={pickup} dropoff={dropoff} />
        </MapContainer>

        {/* Route Info Overlay on Map */}
        {routeInfo && routeInfo.length > 0 && (
          <div className="route-info-overlay">
            {routeInfo.map((route, index) => (
              <div 
                key={index} 
                className={`route-option ${route.isPrimary ? 'primary' : 'alternative'}`}
              >
                <div className="route-time">
                  <span className="time-icon">🕐</span>
                  <strong>{route.duration} min</strong>
                </div>
                <div className="route-distance">{route.distance} km</div>
                {!route.isPrimary && <div className="route-label">Alternative</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="route-loading-overlay">
          <div className="spinner"></div>
          <p>Loading route...</p>
        </div>
      )}
    </div>
  );
};

export default OrderMap;