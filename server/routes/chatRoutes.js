const express = require('express');
const router = express.Router();
const protect = require('../middleware/authmiddleware');
const {
  getAllChats,
  getChatById,
  getChatsByUser,
  getUnreadCount,
  markChatAsRead,
  createChat,
  addMessage,
  markMessageRead,
  deleteChat,
} = require('../controllers/chatController');

// Chats (POST .../media is registered on the main app before this router — see index.js)
router.get('/', getAllChats);
router.get('/unread-count', protect, getUnreadCount);
router.get('/user/:userId', getChatsByUser);
router.patch('/:chatId/read', protect, markChatAsRead);
router.get('/:id', getChatById);
router.post('/', createChat);
router.post('/:id/messages', addMessage);
router.patch('/:chatId/messages/:messageId/read', markMessageRead);
router.delete('/:id', deleteChat);

module.exports = router;
