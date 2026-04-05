import { API_BASE, currentUser } from './config.js';
import { fetchCurrentUser } from './auth.js';
import { showError } from './utils.js';
import { formatChatMessagePreview } from './chatFormat.js';

let chatId = null;
let partnerId = null;
let partnerName = 'Chat';
let socket = null;
let lastMessageDateLabel = null;

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
const attachBtn = document.getElementById('attachBtn');
const chatFileInput = document.getElementById('chatFileInput');

// ── Helpers ──

function getUserId() {
  return currentUser?._id || currentUser?.id || null;
}

async function parseJsonResponse(res) {
  const raw = await res.text();
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('<')) {
    throw new Error(
      'The server sent a web page instead of data. Reload the page and sign in again, or check that the API is running.'
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      (raw && raw.slice(0, 200)) || `Invalid response (HTTP ${res.status})`
    );
  }
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return parseJsonResponse(res);
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${p}`;
}

function messageBodyHtml(msg) {
  const t = msg.messageType || 'text';
  const cap = msg.encryptedMessage ? escapeHtml(msg.encryptedMessage) : '';

  if (t === 'image' && msg.mediaUrl) {
    const src = escapeHtml(absoluteMediaUrl(msg.mediaUrl));
    return `<div class="message-media"><a href="${src}" target="_blank" rel="noopener noreferrer"><img src="${src}" alt="Shared image" loading="lazy" /></a></div>${cap ? `<div class="message-caption">${cap}</div>` : ''}`;
  }

  if (
    msg.mediaUrl &&
    (msg.mimeType === 'video/mp4' || msg.mimeType === 'video/webm')
  ) {
    const src = escapeHtml(absoluteMediaUrl(msg.mediaUrl));
    return `<div class="message-media message-media-video"><video src="${src}" controls playsinline preload="metadata"></video></div>${cap ? `<div class="message-caption">${cap}</div>` : ''}`;
  }

  if (t === 'file' && msg.mediaUrl) {
    const href = escapeHtml(absoluteMediaUrl(msg.mediaUrl));
    const name = escapeHtml(msg.fileName || 'Download file');
    return `<a class="message-file" href="${href}" download target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-file"></i> ${name}</a>${cap ? `<div class="message-caption">${cap}</div>` : ''}`;
  }

  return cap;
}

function appendMessage(msg) {
  if (msg._id && messagesArea.querySelector(`[data-msg-id="${msg._id}"]`)) {
    return;
  }

  const userId = getUserId();
  const isMine = String(msg.senderId) === String(userId);
  const noMsg = messagesArea.querySelector('.no-messages');
  if (noMsg) noMsg.remove();

  const dateLabel = formatDate(msg.timestamp);
  if (lastMessageDateLabel !== dateLabel) {
    const sep = document.createElement('div');
    sep.className = 'date-separator';
    sep.textContent = dateLabel;
    messagesArea.appendChild(sep);
    lastMessageDateLabel = dateLabel;
  }

  const div = document.createElement('div');
  div.className = `message ${isMine ? 'sent' : 'received'}`;
  if (msg._id) div.dataset.msgId = String(msg._id);
  div.innerHTML = `
    <div class="message-body">${messageBodyHtml(msg)}</div>
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
      markChatRead(chatId);
    } else if (chatListView && chatListView.style.display !== 'none') {
      showChatList();
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

async function markChatRead(cId) {
  if (!cId) return;
  try {
    await fetchJSON(`${API_BASE}/chats/${cId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Ignore read-sync failures in UI flow
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

  chatListContent.innerHTML = chats.map((chat) => {
    const partner = chat.participants.find(
      (p) => String(p._id || p) !== String(userId)
    );
    const name = partner?.name || "User";
    const pid = String(partner?._id || partner);
    const lastMsg = chat.messages?.length
      ? chat.messages[chat.messages.length - 1]
      : null;
    const preview = formatChatMessagePreview(lastMsg);
    const time = lastMsg ? formatDate(lastMsg.timestamp) : "";
    const unreadCount = (chat.messages || []).filter((msg) => {
      const isMine = String(msg.senderId) === String(userId);
      const readBy = Array.isArray(msg.readBy) ? msg.readBy.map(String) : [];
      return !isMine && !readBy.includes(String(userId));
    }).length;

    const badge =
      unreadCount > 0
        ? `<span class="chat-unread-pill" aria-label="${unreadCount} unread">${unreadCount > 99 ? "99+" : unreadCount}</span>`
        : "";

    return `
      <div class="chat-list-item" data-chat-id="${chat._id}" data-partner-id="${pid}">
        <div class="avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="chat-info">
          <div class="chat-name">${name}</div>
          <div class="chat-preview">${preview}</div>
        </div>
        <div class="chat-list-item-right">
          <div class="chat-time">${time}</div>
          ${badge}
        </div>
      </div>`;
  }).join("");

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
  await markChatRead(chatId);
  joinChat(chatId);
}

async function loadMessages() {
  if (!chatId) return;

  const data = await fetchJSON(`${API_BASE}/chats/${chatId}`);
  if (!data.success) return;

  const messages = data.data.messages || [];
  const userId = getUserId();

  if (!messages.length) {
    lastMessageDateLabel = null;
    messagesArea.innerHTML = '<div class="no-messages">No messages yet. Say hello! 👋</div>';
    return;
  }

  lastMessageDateLabel = null;
  let lastRenderedLabel = null;

  messagesArea.innerHTML = messages.map((msg) => {
    const isMine = String(msg.senderId) === String(userId);
    const dateLabel = formatDate(msg.timestamp);
    const shouldInsertSeparator = dateLabel !== lastRenderedLabel;

    lastRenderedLabel = dateLabel;
    lastMessageDateLabel = dateLabel;

    const mid = msg._id ? ` data-msg-id="${msg._id}"` : '';
    return `
      ${shouldInsertSeparator ? `<div class="date-separator">${dateLabel}</div>` : ''}
      <div class="message ${isMine ? 'sent' : 'received'}"${mid}>
        <div class="message-body">${messageBodyHtml(msg)}</div>
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
    messageType: 'text',
  });
}

async function uploadChatMediaFile(file) {
  if (!chatId || !file || !getUserId()) return;

  const fd = new FormData();
  fd.append('file', file);
  const cap = messageInput.value.trim();
  if (cap) fd.append('caption', cap);
  messageInput.value = '';

  try {
    const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(chatId)}/media`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await parseJsonResponse(res);
    if (!res.ok || !data.success) {
      const detail =
        Array.isArray(data.errors) && data.errors.length
          ? data.errors.join('; ')
          : data.message;
      throw new Error(detail || 'Upload failed');
    }
    if (data.data?.message) {
      appendMessage(data.data.message);
      markChatRead(chatId);
    }
  } catch (err) {
    showError(err.message || 'Could not send file');
  } finally {
    if (chatFileInput) chatFileInput.value = '';
  }
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

attachBtn?.addEventListener('click', () => chatFileInput?.click());
chatFileInput?.addEventListener('change', () => {
  const file = chatFileInput?.files?.[0];
  if (file) uploadChatMediaFile(file);
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
