// sockets/trackingSocket.js
const Tracking = require("../models/tracking");
const Delivery = require("../models/delivery");

module.exports = function attachTrackingSocket(io) {
  // Optional namespace or plain io
  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    // Driver or client can join a delivery room to receive updates
    // payload: { deliveryId }
    socket.on("joinDeliveryRoom", (payload) => {
      if (!payload || !payload.deliveryId) return;
      const room = `delivery_${payload.deliveryId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Driver emits periodic location updates:
    // payload: { deliveryId, driverId, lat, lng, speed?, heading? }
    socket.on("locationUpdate", async (payload) => {
      try {
        if (!payload || !payload.deliveryId || !payload.driverId) return;

        const { deliveryId, driverId, lat, lng, speed, heading } = payload;
        // Persist tracking point
        const track = await Tracking.create({
          delivery: deliveryId,
          driver: driverId,
          location: { lat, lng },
          timestamp: new Date(),
        });

        // Broadcast to everyone watching this delivery
        const room = `delivery_${deliveryId}`;
        io.to(room).emit("trackingUpdate", {
          deliveryId,
          driverId,
          lat,
          lng,
          speed: speed || null,
          heading: heading || null,
          timestamp: track.timestamp || new Date(),
        });

        // Also emit a delivery-level summary room (admins)
        io.to(`delivery_admins`).emit("trackingUpdateAdmin", {
          deliveryId,
          driverId,
          lat,
          lng,
          timestamp: track.timestamp || new Date(),
        });
      } catch (err) {
        console.error("locationUpdate error:", err.message);
        socket.emit("error", { message: "tracking save failed" });
      }
    });

    // Driver/Frontend can request last-known location
    // payload: { deliveryId }
    socket.on("getLastLocation", async (payload, cb) => {
      try {
        if (!payload || !payload.deliveryId) return cb && cb(null);
        const last = await Tracking.findOne({ delivery: payload.deliveryId })
          .sort({ timestamp: -1 })
          .lean();
        cb && cb(last || null);
      } catch (err) {
        console.error("getLastLocation err:", err.message);
        cb && cb(null);
      }
    });

    socket.on("disconnect", () => {
      console.log("⚡ Socket disconnected:", socket.id);
    });
  });
};
