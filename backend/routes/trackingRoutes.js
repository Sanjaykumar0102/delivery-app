const express = require("express");
const { addTracking, getTracking } = require("../controllers/trackingController");

const router = express.Router();
router.post("/", addTracking);
router.get("/:id", getTracking);

module.exports = router;
