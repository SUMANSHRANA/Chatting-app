const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  editMessage,
  upload,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, upload.single("file"), sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read/:chatId", protect, markAsRead);
router.delete("/:messageId", protect, deleteMessage);
router.put("/:messageId", protect, editMessage);

module.exports = router;
