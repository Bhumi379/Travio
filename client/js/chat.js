import { API_BASE, currentUser } from './config.js';
import { fetchCurrentUser } from './auth.js';
import { showError } from './utils.js';

let chatId = null;
let partnerId = null;
let partnerName = 'Chat';
let socket = null;

// DOM elements
const backBtn = document.getElementById('backBtn');
const partnerAvatar = document.getElementById('partnerAvatar');
const partnerNameEl = document.getElementById('partnerName');
const chatListView = document.getElementById('chatListView');
const chatListContent = document.getElementById('chatListContent');
const messagesArea = document.getElementById('messagesArea');
const inputBar = document.getElementById('inputBar');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// ── Helpers ──

function getUserId() {
  return currentUser?._id || currentUser?.id || null;
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
}

async function fetchUserName(userId) {
  try {
    const data = await fetchJSON(`${API_BASE}/users/${userId}`);
    if (data.success && data.data) return data.data.name || 'User';
    if (data.user) return data.user.name || 'User';
    return 'User';
  } catch {
    return 'User';
  }
}

function appendMessage(msg) {
  const userId = getUserId();
  const isMine = String(msg.senderId) === String(userId);
  const noMsg = messagesArea.querySelector('.no-messages');
  if (noMsg) noMsg.remove();

  const div = document.createElement('div');
  div.className = `message ${isMine ? 'sent' : 'received'}`;
  div.innerHTML = `
    <div>${msg.encryptedMessage}</div>
    <div class="msg-time">${formatTime(msg.timestamp)}</div>`;
  messagesArea.appendChild(div);
  requestAnimationFrame(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  });
}

// ── Socket.IO ──

function connectSocket() {
  if (socket) return;
  socket = io();

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('new-message', (data) => {
    if (data.chatId === chatId) {
      appendMessage(data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });
}

function joinChat(cId) {
  if (socket && cId) {
    socket.emit('join-chat', cId);
  }
}

function leaveChat(cId) {
  if (socket && cId) {
    socket.emit('leave-chat', cId);
  }
}

// ── Chat List Mode ──

async function showChatList() {
  if (chatId) {
    leaveChat(chatId);
    chatId = null;
  }

  chatListView.style.display = '';
  messagesArea.style.display = 'none';
  inputBar.style.display = 'none';
  partnerNameEl.textContent = 'Chats';
  partnerAvatar.textContent = '';
  partnerAvatar.innerHTML = '<i class="fa-solid fa-comments" style="font-size:18px;"></i>';

  backBtn.onclick = () => { window.location.href = 'index.html'; };

  const userId = getUserId();
  if (!userId) return;

  const data = await fetchJSON(`${API_BASE}/chats/user/${userId}`);
  if (!data.success || !data.data?.length) {
    chatListContent.innerHTML = `
      <div class="chat-list-empty">
        <i class="fa-regular fa-comment-dots"></i>
        No chats yet. Start one by clicking Chat on a ride!
      </div>`;
    return;
  }

  const chats = data.data;
  const nameCache = {};

  const partnerIds = chats.map(c => {
    const pid = c.participants.find(p => String(p) !== String(userId));
    return pid ? String(pid) : null;
  });

  const uniqueIds = [...new Set(partnerIds.filter(Boolean))];
  await Promise.all(uniqueIds.map(async id => {
    nameCache[id] = await fetchUserName(id);
  }));

  chatListContent.innerHTML = chats.map((chat, i) => {
    const pid = partnerIds[i];
    const name = pid ? (nameCache[pid] || 'User') : 'Unknown';
    const lastMsg = chat.messages?.length
      ? chat.messages[chat.messages.length - 1]
      : null;
    const preview = lastMsg ? lastMsg.encryptedMessage : 'No messages yet';
    const time = lastMsg ? formatDate(lastMsg.timestamp) : '';

    return `
      <div class="chat-list-item" data-chat-id="${chat._id}" data-partner-id="${pid}">
        <div class="avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="chat-info">
          <div class="chat-name">${name}</div>
          <div class="chat-preview">${preview}</div>
        </div>
        <div class="chat-time">${time}</div>
      </div>`;
  }).join('');

  chatListContent.querySelectorAll('.chat-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const cid = item.dataset.chatId;
      const pid = item.dataset.partnerId;
      window.history.pushState({}, '', `chat.html?chatId=${cid}`);
      openConversation(cid, pid);
    });
  });
}

// ── Conversation Mode ──

async function openConversation(cId, pId) {
  if (chatId) leaveChat(chatId);

  chatId = cId;
  partnerId = pId;

  chatListView.style.display = 'none';
  messagesArea.style.display = '';
  inputBar.style.display = '';

  if (partnerId) {
    partnerName = await fetchUserName(partnerId);
  }
  partnerNameEl.textContent = partnerName;
  partnerAvatar.innerHTML = '';
  partnerAvatar.textContent = partnerName.charAt(0).toUpperCase();

  backBtn.onclick = () => {
    leaveChat(chatId);
    window.history.pushState({}, '', 'chat.html');
    showChatList();
  };

  await loadMessages();
  joinChat(chatId);
}

async function loadMessages() {
  if (!chatId) return;

  const data = await fetchJSON(`${API_BASE}/chats/${chatId}`);
  if (!data.success) return;

  const messages = data.data.messages || [];
  const userId = getUserId();

  if (!messages.length) {
    messagesArea.innerHTML = '<div class="no-messages">No messages yet. Say hello! 👋</div>';
    return;
  }

  messagesArea.innerHTML = messages.map(msg => {
    const isMine = String(msg.senderId) === String(userId);
    return `
      <div class="message ${isMine ? 'sent' : 'received'}">
        <div>${msg.encryptedMessage}</div>
        <div class="msg-time">${formatTime(msg.timestamp)}</div>
      </div>`;
  }).join('');

  requestAnimationFrame(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  });
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !chatId || !socket) return;

  const userId = getUserId();
  if (!userId) return;

  messageInput.value = '';

  // Send via WebSocket — server will broadcast back via "new-message"
  socket.emit('send-message', {
    chatId,
    senderId: userId,
    encryptedMessage: text,
  });
}

// ── Find or Create Chat from Ride ──

async function findOrCreateChatForRide(rideId) {
  const userId = getUserId();

  const rideData = await fetchJSON(`${API_BASE}/rides/${rideId}`);
  if (!rideData.success && !rideData.data) {
    showError('Could not load ride details');
    return;
  }
  const ride = rideData.data || rideData;
  const initiatorId = ride.initiatorId?._id || ride.initiatorId;
  partnerId = String(initiatorId);

  // Look for existing chat between these two users
  const chatsData = await fetchJSON(`${API_BASE}/chats/user/${userId}`);
  if (chatsData.success && chatsData.data?.length) {
    const existing = chatsData.data.find(c =>
      c.participants.map(String).includes(String(userId)) &&
      c.participants.map(String).includes(partnerId)
    );
    if (existing) return existing._id;
  }

  // Create new chat
  const createData = await fetchJSON(`${API_BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participants: [userId, partnerId] }),
  });

  if (!createData.success) {
    showError('Could not create chat');
    return null;
  }
  return createData.data._id;
}

// ── Event Listeners ──

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

// ── Init ──

document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrentUser();

  if (!getUserId()) return;

  connectSocket();

  const params = new URLSearchParams(window.location.search);
  const rideId = params.get('rideId');
  const directChatId = params.get('chatId');

  if (directChatId) {
    const chatData = await fetchJSON(`${API_BASE}/chats/${directChatId}`);
    if (chatData.success) {
      const pId = chatData.data.participants.find(p => String(p) !== String(getUserId()));
      await openConversation(directChatId, pId ? String(pId) : null);
    }
  } else if (rideId) {
    const cId = await findOrCreateChatForRide(rideId);
    if (cId) {
      await openConversation(cId, partnerId);
    }
  } else {
    await showChatList();
  }
});
