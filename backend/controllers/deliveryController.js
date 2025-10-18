const Delivery = require("../models/delivery");

// Create new delivery
const createDelivery = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, driver, vehicle, customer } = req.body;
    const delivery = await Delivery.create({
      pickupLocation,
      dropLocation,
      driver,
      vehicle,
      customer,
    });
    res.status(201).json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all deliveries
const getDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate("driver", "name email")
      .populate("vehicle", "plateNumber model");
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createDelivery, getDeliveries };
