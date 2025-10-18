const Tracking = require("../models/tracking");

// Add tracking update
const addTracking = async (req, res) => {
  try {
    const { delivery, driver, location } = req.body;
    const tracking = await Tracking.create({ delivery, driver, location });
    res.status(201).json(tracking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get tracking by delivery
const getTracking = async (req, res) => {
  try {
    const tracking = await Tracking.find({ delivery: req.params.id }).sort({ createdAt: -1 });
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addTracking, getTracking };
