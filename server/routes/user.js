const express = require("express");
const router = express.Router();
const {
  searchUsers,
  getUserProfile,
  updateProfile,
  getAllUsers,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", protect, searchUsers);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateProfile);
router.get("/all", protect, adminOnly, getAllUsers);

module.exports = router;
