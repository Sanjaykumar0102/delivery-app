// Location Service for Google Maps Autocomplete and Geocoding
// Optimized for India (South Indian states)

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

// South Indian states bias
const INDIA_BOUNDS = {
  north: 35.5,
  south: 6.5,
  east: 97.5,
  west: 68.0
};

// Major South Indian cities for bias
const SOUTH_INDIA_CENTER = {
  lat: 12.9716, // Bangalore
  lng: 77.5946
};

/**
 * Load Google Maps Script
 */
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&region=IN`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

/**
 * Initialize Autocomplete for an input element
 * @param {HTMLInputElement} inputElement 
 * @param {Function} onPlaceSelected 
 * @returns {google.maps.places.Autocomplete}
 */
export const initializeAutocomplete = async (inputElement, onPlaceSelected) => {
  try {
    await loadGoogleMapsScript();

    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      componentRestrictions: { country: 'in' }, // Restrict to India
      fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
      types: ['geocode', 'establishment'], // Allow addresses and places
      bounds: new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(INDIA_BOUNDS.south, INDIA_BOUNDS.west),
        new window.google.maps.LatLng(INDIA_BOUNDS.north, INDIA_BOUNDS.east)
      ),
      strictBounds: false, // Allow results outside bounds but prioritize within
    });

    // Bias towards South India
    autocomplete.setBounds(
      new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(8.0, 74.0), // South-West of South India
        new window.google.maps.LatLng(20.0, 85.0)  // North-East of South India
      )
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry) {
        console.error('No geometry found for place');
        return;
      }

      const locationData = {
        address: place.formatted_address,
        name: place.name,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        city: extractCity(place.address_components),
        state: extractState(place.address_components),
        pincode: extractPincode(place.address_components),
      };

      onPlaceSelected(locationData);
    });

    return autocomplete;
  } catch (error) {
    console.error('Error initializing autocomplete:', error);
    throw error;
  }
};

/**
 * Get current location using browser geolocation
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
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
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    await loadGoogleMapsScript();
    
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            address: results[0].formatted_address,
            placeId: results[0].place_id,
            lat,
            lng,
            city: extractCity(results[0].address_components),
            state: extractState(results[0].address_components),
            pincode: extractPincode(results[0].address_components),
          });
        } else {
          reject(new Error('Geocoder failed: ' + status));
        }
      });
    });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    throw error;
  }
};

/**
 * Calculate distance between two points (in km)
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
 * Get directions between two points
 */
export const getDirections = async (origin, destination) => {
  try {
    await loadGoogleMapsScript();
    
    const directionsService = new window.google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
      directionsService.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'IN',
        },
        (result, status) => {
          if (status === 'OK') {
            const route = result.routes[0];
            const leg = route.legs[0];
            
            resolve({
              distance: leg.distance.text,
              distanceValue: leg.distance.value, // in meters
              duration: leg.duration.text,
              durationValue: leg.duration.value, // in seconds
              steps: leg.steps.map(step => ({
                instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
                distance: step.distance.text,
                duration: step.duration.text,
              })),
              polyline: route.overview_polyline,
              bounds: route.bounds,
            });
          } else {
            reject(new Error('Directions request failed: ' + status));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error getting directions:', error);
    throw error;
  }
};

/**
 * Search for places near a location
 */
export const searchNearbyPlaces = async (lat, lng, radius = 5000, type = 'all') => {
  try {
    await loadGoogleMapsScript();
    
    const service = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    return new Promise((resolve, reject) => {
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius,
        type: type !== 'all' ? [type] : undefined,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(results.map(place => ({
            name: place.name,
            address: place.vicinity,
            placeId: place.place_id,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating,
            types: place.types,
          })));
        } else {
          reject(new Error('Places search failed: ' + status));
        }
      });
    });
  } catch (error) {
    console.error('Error searching nearby places:', error);
    throw error;
  }
};

// Helper functions to extract address components
const extractCity = (addressComponents) => {
  const city = addressComponents?.find(
    (component) =>
      component.types.includes('locality') ||
      component.types.includes('administrative_area_level_2')
  );
  return city?.long_name || '';
};

const extractState = (addressComponents) => {
  const state = addressComponents?.find((component) =>
    component.types.includes('administrative_area_level_1')
  );
  return state?.long_name || '';
};

const extractPincode = (addressComponents) => {
  const pincode = addressComponents?.find((component) =>
    component.types.includes('postal_code')
  );
  return pincode?.long_name || '';
};

/**
 * Format address for display
 */
export const formatAddress = (locationData) => {
  if (!locationData) return '';
  
  const parts = [];
  if (locationData.name && locationData.name !== locationData.address) {
    parts.push(locationData.name);
  }
  if (locationData.address) {
    parts.push(locationData.address);
  }
  
  return parts.join(', ');
};

/**
 * Validate if coordinates are in India
 */
export const isInIndia = (lat, lng) => {
  return (
    lat >= INDIA_BOUNDS.south &&
    lat <= INDIA_BOUNDS.north &&
    lng >= INDIA_BOUNDS.west &&
    lng <= INDIA_BOUNDS.east
  );
};

export default {
  loadGoogleMapsScript,
  initializeAutocomplete,
  getCurrentLocation,
  reverseGeocode,
  calculateDistance,
  getDirections,
  searchNearbyPlaces,
  formatAddress,
  isInIndia,
};