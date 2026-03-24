const Chat = require('../models/Chat');

// GET /api/chats
const getAllChats = async (_req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: chats.length, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chats', error: error.message });
  }
};

// GET /api/chats/:id
const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chat', error: error.message });
  }
};

// GET /api/chats/user/:userId  -> chats that include user
const getChatsByUser = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.params.userId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: chats.length, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user chats', error: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const chats = await Chat.find({ participants: userId }).select('messages senderId participants');

    let unreadCount = 0;
    chats.forEach((chat) => {
      (chat.messages || []).forEach((msg) => {
        const isMine = String(msg.senderId) === String(userId);
        const readBy = Array.isArray(msg.readBy) ? msg.readBy.map(String) : [];
        if (!isMine && !readBy.includes(String(userId))) unreadCount += 1;
      });
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching unread chat count', error: error.message });
  }
};

const markChatAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    if (!chat.participants.map(String).includes(String(userId))) {
      return res.status(403).json({ success: false, message: 'Not allowed for this chat' });
    }

    let updated = 0;
    (chat.messages || []).forEach((msg) => {
      const isMine = String(msg.senderId) === String(userId);
      msg.readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
      const alreadyRead = msg.readBy.map(String).includes(String(userId));
      if (!isMine && !alreadyRead) {
        msg.readBy.push(userId);
        updated += 1;
      }
    });

    if (updated > 0) await chat.save();
    res.status(200).json({ success: true, message: 'Chat marked as read', updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking chat as read', error: error.message });
  }
};

// POST /api/chats  { participants: [userId1, userId2, ...] }
const createChat = async (req, res) => {
  try {
    let { participants, messages } = req.body;

    // Deduplicate participants if needed
    if (Array.isArray(participants)) {
      participants = [...new Set(participants.map(String))];
    }

    const chat = await Chat.create({ participants, messages });
    res.status(201).json({ success: true, message: 'Chat created', data: chat });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Error creating chat', error: error.message });
  }
};

// POST /api/chats/:id/messages  { senderId, encryptedMessage }
const addMessage = async (req, res) => {
  try {
    const { senderId, encryptedMessage } = req.body;

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    chat.messages = chat.messages || [];
    chat.messages.push({ senderId, encryptedMessage });
    await chat.save();

    res.status(201).json({ success: true, message: 'Message added', data: chat });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ success: false, message: 'Error adding message', error: error.message });
  }
};

// PATCH /api/chats/:chatId/messages/:messageId/read  { userId }
const markMessageRead = async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId, messageId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msg = (chat.messages || []).id(messageId);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    msg.readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
    if (!msg.readBy.map(String).includes(String(userId))) {
      msg.readBy.push(userId);
    }

    await chat.save();
    res.status(200).json({ success: true, message: 'Marked as read', data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error marking read', error: error.message });
  }
};

// DELETE /api/chats/:id
const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    await Chat.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting chat', error: error.message });
  }
};

module.exports = {
  getAllChats,
  getChatById,
  getChatsByUser,
  getUnreadCount,
  markChatAsRead,
  createChat,
  addMessage,
  markMessageRead,
  deleteChat,
};
