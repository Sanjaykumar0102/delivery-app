// backend/utils/calculateFare.js
function calculateDistance(pickup, dropoff) {
  if (!pickup || !dropoff) throw new Error("calculateDistance: pickup and dropoff required");
  
  // If lat/lng not provided, return default distance
  if (!pickup.lat || !pickup.lng || !dropoff.lat || !dropoff.lng) {
    return 10; // default 10km
  }

  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371; // km

  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLon = toRad(dropoff.lng - pickup.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pickup.lat)) *
      Math.cos(toRad(dropoff.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

function calculateFare(pickup, dropoff, vehicleType = "Auto") {
  if (!pickup || !dropoff) throw new Error("calculateFare: pickup and dropoff required");

  const distance = calculateDistance(pickup, dropoff);
  
  // Vehicle-specific pricing
  const vehiclePricing = {
    "Bike": { baseFare: 30, perKm: 8 },
    "Auto": { baseFare: 50, perKm: 12 },
    "Mini Truck": { baseFare: 150, perKm: 20 },
    "Large Truck": { baseFare: 300, perKm: 35 },
  };

  const pricing = vehiclePricing[vehicleType] || vehiclePricing["Auto"];
  const fare = pricing.baseFare + distance * pricing.perKm;

  return {
    distance: Number(distance.toFixed(2)), // numeric
    fare: Number(fare.toFixed(2))
  };
}

module.exports = calculateFare;
