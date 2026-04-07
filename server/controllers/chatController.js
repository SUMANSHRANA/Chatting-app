const Chat = require("../models/Chat");
const User = require("../models/User");

// @desc    Create or fetch one-to-one chat
// @route   POST /api/chats
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    let chat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    chat = await User.populate(chat, {
      path: "latestMessage.sender",
      select: "name email avatar",
    });

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    const newChat = await Chat.create({
      chatName: "direct",
      isGroupChat: false,
      users: [req.user._id, userId],
    });

    const fullChat = await Chat.findById(newChat._id).populate(
      "users",
      "-password"
    );

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all chats for logged-in user
// @route   GET /api/chats
const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name email avatar",
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create group chat
// @route   POST /api/chats/group
const createGroupChat = async (req, res) => {
  try {
    const { users, chatName } = req.body;

    if (!users || !chatName) {
      return res.status(400).json({ message: "Users and chat name required" });
    }

    let parsedUsers = JSON.parse(users);
    if (parsedUsers.length < 2) {
      return res
        .status(400)
        .json({ message: "At least 2 users required for group chat" });
    }

    parsedUsers.push(req.user._id);

    const groupChat = await Chat.create({
      chatName,
      isGroupChat: true,
      users: parsedUsers,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rename group
// @route   PUT /api/chats/group/rename
const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    const updated = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updated) return res.status(404).json({ message: "Chat not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add user to group
// @route   PUT /api/chats/group/add
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) return res.status(404).json({ message: "Chat not found" });
    res.json(added);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove user from group
// @route   PUT /api/chats/group/remove
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) return res.status(404).json({ message: "Chat not found" });
    res.json(removed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
