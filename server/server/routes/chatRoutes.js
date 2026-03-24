const express = require('express');
const router = express.Router();
const {
  getAllChats,
  getChatById,
  getChatsByUser,
  createChat,
  addMessage,
  markMessageRead,
  deleteChat,
} = require('../controllers/chatController');

// Chats
router.get('/', getAllChats);
router.get('/user/:userId', getChatsByUser);
router.get('/:id', getChatById);
router.post('/', createChat);
router.post('/:id/messages', addMessage);
router.patch('/:chatId/messages/:messageId/read', markMessageRead);
router.delete('/:id', deleteChat);

module.exports = router;
