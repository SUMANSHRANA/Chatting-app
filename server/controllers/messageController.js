const Message = require("../models/Message");
const Chat = require("../models/Chat");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and PDFs allowed"), false);
  },
});

// @desc    Send a message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { content, chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    let fileUrl = "";
    let fileType = "none";

    // Handle file upload to cloudinary
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "chatapp",
        resource_type: "auto",
      });
      fileUrl = uploadRes.secure_url;
      fileType = req.file.mimetype.startsWith("image") ? "image" : "pdf";
    }

    if (!content && !fileUrl) {
      return res
        .status(400)
        .json({ message: "Message content or file required" });
    }

    let message = await Message.create({
      sender: req.user._id,
      content: content || "",
      chat: chatId,
      fileUrl,
      fileType,
      readBy: [req.user._id],
    });

    message = await message.populate("sender", "name avatar email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name avatar email",
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar email")
      .populate("chat")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:chatId
const markAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        chat: req.params.chatId,
        readBy: { $ne: req.user._id },
      },
      { $push: { readBy: req.user._id } }
    );
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this message" });
    }

    message.content = req.body.content;
    message.isEdited = true;
    await message.save();

    const updated = await Message.findById(message._id).populate(
      "sender",
      "name avatar"
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  editMessage,
  upload,
};
