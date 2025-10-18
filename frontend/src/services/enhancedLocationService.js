// Enhanced OpenStreetMap Location Service
// Optimized for Telangana and all India locations with better suggestions

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Telangana bounds for priority search
const TELANGANA_BOUNDS = {
  minLat: 15.8,
  maxLat: 19.9,
  minLon: 77.2,
  maxLon: 81.3
};

// Major Telangana cities and areas
const TELANGANA_LOCATIONS = [
  'Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar',
  'Khammam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Medak',
  'Rangareddy', 'Sangareddy', 'Siddipet', 'Kamareddy', 'Vikarabad',
  'HITEC City', 'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills',
  'Kukatpally', 'Miyapur', 'LB Nagar', 'Dilsukhnagar', 'Ameerpet'
];

/**
 * Enhanced location search with Telangana priority
 */
export const searchLocations = async (query) => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Check if query is Telangana-related
    const isTelanganaQuery = TELANGANA_LOCATIONS.some(loc => 
      query.toLowerCase().includes(loc.toLowerCase())
    ) || query.toLowerCase().includes('telangana') || query.toLowerCase().includes('hyderabad');

    let allResults = [];

    // Strategy 1: Telangana-focused search (always prioritize Telangana)
    const telanganaParams = new URLSearchParams({
      q: `${query}, Telangana, India`,
      format: 'json',
      addressdetails: 1,
      limit: 15,
      countrycodes: 'in',
      bounded: 1,
      viewbox: `${TELANGANA_BOUNDS.minLon},${TELANGANA_BOUNDS.minLat},${TELANGANA_BOUNDS.maxLon},${TELANGANA_BOUNDS.maxLat}`,
    });

    const response1 = await fetch(`${NOMINATIM_BASE_URL}/search?${telanganaParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DelivraX-Delivery-App/1.0'
      }
    });

    if (response1.ok) {
      const data = await response1.json();
      allResults = [...allResults, ...data];
    }

    // Strategy 2: General India search (only if Telangana results are insufficient)
    if (allResults.length < 5) {
      const indiaParams = new URLSearchParams({
        q: `${query}, India`,
        format: 'json',
        addressdetails: 1,
        limit: 10,
        countrycodes: 'in',
      });

      const response2 = await fetch(`${NOMINATIM_BASE_URL}/search?${indiaParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DelivraX-Delivery-App/1.0'
        }
      });

      if (response2.ok) {
        const data = await response2.json();
        const existingIds = new Set(allResults.map(r => r.place_id));
        const newResults = data.filter(r => !existingIds.has(r.place_id));
        allResults = [...allResults, ...newResults];
      }
    }

    // Format results
    const formatted = allResults.map(place => {
      const address = place.address || {};
      const displayParts = [];
      
      // Build readable address with clear hierarchy
      if (address.road) displayParts.push(address.road);
      if (address.suburb && address.suburb !== address.city) displayParts.push(address.suburb);
      if (address.neighbourhood && !displayParts.includes(address.neighbourhood)) {
        displayParts.push(address.neighbourhood);
      }
      if (address.city || address.town || address.village) {
        displayParts.push(address.city || address.town || address.village);
      }
      if (address.state) displayParts.push(address.state);
      
      // Create short and detailed address
      const shortAddress = displayParts.slice(0, 3).join(', ');
      const detailedAddress = displayParts.join(', ');

      const isTelangana = address.state?.toLowerCase().includes('telangana');
      
      return {
        id: place.place_id,
        name: place.name || place.display_name.split(',')[0],
        address: place.display_name,
        shortAddress: shortAddress || detailedAddress || place.display_name,
        detailedAddress: detailedAddress || place.display_name,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        district: address.state_district || '',
        suburb: address.suburb || '',
        neighbourhood: address.neighbourhood || '',
        pincode: address.postcode || '',
        type: place.type,
        importance: place.importance || 0,
        isTelangana,
        displayLabel: isTelangana ? '⭐ Telangana' : address.state || 'India',
      };
    });

    // Sort: Telangana first, then by importance
    formatted.sort((a, b) => {
      if (a.isTelangana && !b.isTelangana) return -1;
      if (!a.isTelangana && b.isTelangana) return 1;
      return b.importance - a.importance;
    });

    // Remove duplicates based on coordinates
    const unique = [];
    const coordSet = new Set();
    
    for (const item of formatted) {
      const coordKey = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
      if (!coordSet.has(coordKey)) {
        coordSet.add(coordKey);
        unique.push(item);
      }
    }

    return unique.slice(0, 15);
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to address
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
    const address = data.address || {};

    return {
      address: data.display_name,
      name: data.name || data.display_name.split(',')[0],
      lat,
      lng,
      city: address.city || address.town || address.village || '',
      state: address.state || '',
      pincode: address.postcode || '',
      country: address.country || '',
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const locationData = await reverseGeocode(lat, lng);
          resolve({
            ...locationData,
            accuracy: position.coords.accuracy
          });
        } catch (error) {
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
 * Calculate distance between two points (Haversine formula)
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
  
  return Math.round(distance * 100) / 100;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Get route using OSRM
 */
export const getRoute = async (origin, destination) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      distance: (route.distance / 1000).toFixed(2),
      distanceValue: route.distance / 1000,
      duration: formatDuration(route.duration),
      durationValue: route.duration,
      geometry: route.geometry,
    };
  } catch (error) {
    console.error('Error getting route:', error);
    
    // Fallback: straight-line distance
    const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const estimatedDuration = Math.round((distance / 40) * 60);
    
    return {
      distance: distance.toFixed(2),
      distanceValue: distance,
      duration: formatDuration(estimatedDuration * 60),
      durationValue: estimatedDuration * 60,
      geometry: {
        type: 'LineString',
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ]
      },
      fallback: true,
    };
  }
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Popular Telangana locations
 */
export const getPopularLocations = () => {
  return [
    { name: 'Hyderabad - Charminar', lat: 17.3616, lng: 78.4747, state: 'Telangana', area: 'Old City' },
    { name: 'Secunderabad Railway Station', lat: 17.4399, lng: 78.4983, state: 'Telangana', area: 'Transport Hub' },
    { name: 'HITEC City', lat: 17.4435, lng: 78.3772, state: 'Telangana', area: 'IT Hub' },
    { name: 'Gachibowli', lat: 17.4399, lng: 78.3489, state: 'Telangana', area: 'IT Corridor' },
    { name: 'Madhapur', lat: 17.4485, lng: 78.3908, state: 'Telangana', area: 'Tech Zone' },
    { name: 'Banjara Hills', lat: 17.4239, lng: 78.4738, state: 'Telangana', area: 'Upscale' },
    { name: 'Jubilee Hills', lat: 17.4326, lng: 78.4071, state: 'Telangana', area: 'Premium' },
    { name: 'Kukatpally', lat: 17.4849, lng: 78.4138, state: 'Telangana', area: 'Residential' },
    { name: 'Miyapur Metro', lat: 17.4968, lng: 78.3574, state: 'Telangana', area: 'Metro Station' },
    { name: 'LB Nagar', lat: 17.3421, lng: 78.5520, state: 'Telangana', area: 'South Zone' },
    { name: 'Dilsukhnagar', lat: 17.3687, lng: 78.5241, state: 'Telangana', area: 'Shopping Hub' },
    { name: 'Ameerpet', lat: 17.4374, lng: 78.4482, state: 'Telangana', area: 'Education Hub' },
    { name: 'Warangal', lat: 17.9689, lng: 79.5941, state: 'Telangana', area: 'Historic City' },
    { name: 'Nizamabad', lat: 18.6725, lng: 78.0941, state: 'Telangana', area: 'District HQ' },
    { name: 'Karimnagar', lat: 18.4386, lng: 79.1288, state: 'Telangana', area: 'District HQ' },
  ];
};

export default {
  searchLocations,
  reverseGeocode,
  getCurrentLocation,
  calculateDistance,
  getRoute,
  getPopularLocations,
};
