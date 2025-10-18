const serializeConnectedDrivers = (connectedDrivers) => {
  if (!connectedDrivers) {
    return {
      totals: {
        totalConnectedDrivers: 0,
        totalApprovedDrivers: 0,
        totalOnDutyDrivers: 0,
      },
      vehicleTypeBreakdown: {},
      drivers: [],
    };
  }

  const entries = Array.from(connectedDrivers.entries());
  const drivers = entries.map(([driverId, info]) => ({
    driverId,
    vehicleType: info?.vehicleType,
    isOnDuty: info?.isOnDuty === true,
    isApproved: info?.isApproved === true,
    approvalStatus: info?.approvalStatus,
    lastHeartbeat: info?.lastHeartbeat || null,
  }));

  const totals = {
    totalConnectedDrivers: drivers.length,
    totalApprovedDrivers: drivers.filter((driver) => driver.isApproved).length,
    totalOnDutyDrivers: drivers.filter((driver) => driver.isOnDuty).length,
  };

  const vehicleTypeBreakdown = drivers.reduce((accumulator, driver) => {
    const key = driver.vehicleType || "Unknown";
    if (!accumulator[key]) {
      accumulator[key] = { total: 0, onDuty: 0 };
    }
    accumulator[key].total += 1;
    if (driver.isOnDuty) {
      accumulator[key].onDuty += 1;
    }
    return accumulator;
  }, {});

  return {
    totals,
    vehicleTypeBreakdown,
    drivers,
  };
};

module.exports = {
  serializeConnectedDrivers,
};