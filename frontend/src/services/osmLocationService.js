// OpenStreetMap Location Service (FREE - No API Key Required)
// Optimized for India (South Indian states)

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE_URL = 'https://photon.komoot.io'; // Alternative geocoding service

// South Indian states for location bias
const SOUTH_INDIA_BOUNDS = {
  minLat: 8.0,
  maxLat: 20.0,
  minLon: 74.0,
  maxLon: 85.0
};

// Major South Indian cities
const SOUTH_INDIA_CITIES = [
  'Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore',
  'Mysore', 'Mangalore', 'Visakhapatnam', 'Vijayawada', 'Trivandrum',
  'Madurai', 'Tiruchirappalli', 'Salem', 'Tirupati', 'Warangal'
];

/**
 * Search for locations using Nominatim (OpenStreetMap)
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of location results
 */
export const searchLocations = async (query) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: 1,
      limit: 10,
      countrycodes: 'in', // Restrict to India
      bounded: 0,
      viewbox: `${SOUTH_INDIA_BOUNDS.minLon},${SOUTH_INDIA_BOUNDS.minLat},${SOUTH_INDIA_BOUNDS.maxLon},${SOUTH_INDIA_BOUNDS.maxLat}`,
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DelivraX-Delivery-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Location search failed');
    }

    const data = await response.json();

    return data.map(place => ({
      id: place.place_id,
      name: place.display_name.split(',')[0],
      address: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      city: place.address?.city || place.address?.town || place.address?.village || '',
      state: place.address?.state || '',
      pincode: place.address?.postcode || '',
      type: place.type,
      importance: place.importance,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Location data
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: 1,
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DelivraX-Delivery-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();

    return {
      address: data.display_name,
      name: data.name || data.display_name.split(',')[0],
      lat,
      lng,
      city: data.address?.city || data.address?.town || data.address?.village || '',
      state: data.address?.state || '',
      pincode: data.address?.postcode || '',
      country: data.address?.country || '',
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    throw error;
  }
};

/**
 * Get current location using browser geolocation
 * @returns {Promise<Object>} - Current location coordinates
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Get address for current location
          const locationData = await reverseGeocode(lat, lng);
          resolve({
            ...locationData,
            accuracy: position.coords.accuracy
          });
        } catch (error) {
          // If reverse geocoding fails, still return coordinates
          resolve({
            lat,
            lng,
            accuracy: position.coords.accuracy,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Calculate distance between two points using Haversine formula (in km)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimals
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get route between two points using OSRM (Open Source Routing Machine)
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Object>} - Route data
 */
export const getRoute = async (origin, destination) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: (route.distance / 1000).toFixed(2) + ' km', // Convert meters to km
      distanceValue: route.distance, // in meters
      duration: formatDuration(route.duration), // Convert seconds to readable format
      durationValue: route.duration, // in seconds
      geometry: route.geometry, // GeoJSON LineString
      steps: leg.steps.map(step => ({
        instruction: step.maneuver.type,
        distance: (step.distance / 1000).toFixed(2) + ' km',
        duration: formatDuration(step.duration),
        location: step.maneuver.location,
      })),
    };
  } catch (error) {
    console.error('Error getting route:', error);
    
    // Fallback: Calculate straight-line distance
    const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const estimatedDuration = Math.round((distance / 40) * 60); // Assume 40 km/h average speed
    
    return {
      distance: distance.toFixed(2) + ' km',
      distanceValue: distance * 1000,
      duration: formatDuration(estimatedDuration * 60),
      durationValue: estimatedDuration * 60,
      geometry: {
        type: 'LineString',
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ]
      },
      steps: [],
      fallback: true,
    };
  }
};

/**
 * Format duration in seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Validate if coordinates are in India
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if in India
 */
export const isInIndia = (lat, lng) => {
  // India bounds (approximate)
  return (
    lat >= 6.5 && lat <= 35.5 &&
    lng >= 68.0 && lng <= 97.5
  );
};

/**
 * Validate if coordinates are in South India
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if in South India
 */
export const isInSouthIndia = (lat, lng) => {
  return (
    lat >= SOUTH_INDIA_BOUNDS.minLat &&
    lat <= SOUTH_INDIA_BOUNDS.maxLat &&
    lng >= SOUTH_INDIA_BOUNDS.minLon &&
    lng <= SOUTH_INDIA_BOUNDS.maxLon
  );
};

/**
 * Get popular locations in South India
 * @returns {Array} - Array of popular locations
 */
export const getPopularLocations = () => {
  return [
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
    { name: 'Kochi', lat: 9.9312, lng: 76.2673, state: 'Kerala' },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu' },
    { name: 'Mysore', lat: 12.2958, lng: 76.6394, state: 'Karnataka' },
    { name: 'Mangalore', lat: 12.9141, lng: 74.8560, state: 'Karnataka' },
    { name: 'Visakhapatnam', lat: 17.6869, lng: 83.2185, state: 'Andhra Pradesh' },
    { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, state: 'Andhra Pradesh' },
    { name: 'Trivandrum', lat: 8.5241, lng: 76.9366, state: 'Kerala' },
  ];
};

/**
 * Format address for display
 * @param {Object} locationData - Location data object
 * @returns {string} - Formatted address
 */
export const formatAddress = (locationData) => {
  if (!locationData) return '';
  
  if (locationData.address) {
    return locationData.address;
  }
  
  const parts = [];
  if (locationData.name) parts.push(locationData.name);
  if (locationData.city) parts.push(locationData.city);
  if (locationData.state) parts.push(locationData.state);
  if (locationData.pincode) parts.push(locationData.pincode);
  
  return parts.join(', ') || `${locationData.lat}, ${locationData.lng}`;
};

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  searchLocations,
  reverseGeocode,
  getCurrentLocation,
  calculateDistance,
  getRoute,
  isInIndia,
  isInSouthIndia,
  getPopularLocations,
  formatAddress,
  debounce,
};