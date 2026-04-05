// Notification Functions
import { API_BASE, currentUser } from './config.js';
import { showError, showSuccess } from './utils.js';
import { loadRides } from './rides.js';
import { formatChatMessagePreview } from './chatFormat.js';

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ==============================
   NOTIFICATIONS
================================ */
function isInformationAboutPage() {
  try {
    const p = window.location?.pathname || '';
    return (
      p.endsWith('about.html') ||
      p === '/about' ||
      p.endsWith('/about') ||
      p.includes('/about.html')
    );
  } catch {
    return false;
  }
}

export async function loadNotifications() {
  if (isInformationAboutPage()) return;

  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      credentials: "include"
    });

    if (!res.ok) {
      console.error("❌ Notification API error:", res.status, res.statusText);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      console.error("Error loading notifications:", data.message);
      return;
    }

    console.log("✅ Notifications loaded:", data.data.length, "notifications");
    displayNotifications(data.data, data.unreadCount);
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      credentials: 'include',
    });

    if (!res.ok) throw new Error("Failed to mark notifications as read");

    // Only clear the notification unread badge, not the chat unread badge
    const badge = document.querySelector(
      '.notification-badge.notif-unread-badge'
    );
    if (badge) badge.remove();

    console.log("✅ All notifications marked as read");
  } catch (err) {
    console.error("Error marking notifications as read:", err);
  }
}


export function displayNotifications(notifications, unreadCount) {
  if (isInformationAboutPage()) return;

  console.log("📊 displayNotifications called with:", notifications.length, "notifications, unread:", unreadCount);
  
  // Update notification badge
  const notificationIcon = document.querySelector('.notification img[src*="notification"]');
  if (notificationIcon) {
    const parent = notificationIcon.closest('.notification');
    
    // Remove existing badge if any
    const existingBadge = parent.querySelector('.notification-badge:not(.chat-unread-badge)');
    if (existingBadge) existingBadge.remove();
    
    // Add badge if there are unread notifications
    if (unreadCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge notif-unread-badge';
      badge.textContent = unreadCount;

      parent.appendChild(badge);
      console.log("✅ Badge added with count:", unreadCount);
    }
    else {
      console.log("📭 No unread notifications — removing badge if exists");
      const badge = document.querySelector('.notification-badge.notif-unread-badge');
      if (badge) badge.remove();
    }

    // Header uses onclick="toggleNotificationPanel(event)" — do not add a second listener
    // or each click runs toggle twice and the panel opens then immediately closes.
  } else {
    console.warn("⚠️ Notification icon not found");
  }

  // Create or update notification popup
  let notificationPanel = document.getElementById('notificationPanel');
  if (!notificationPanel) {
    notificationPanel = document.createElement('div');
    notificationPanel.id = 'notificationPanel';
    notificationPanel.className = 'notification-panel';
    document.body.appendChild(notificationPanel);
    console.log("✅ Notification panel created");
  }

  // Populate notification list
  const notificationList = notifications.map(notif => {
    const actionButtons = getActionButtonsForNotification(notif);
    
    return `
      <div class="notification-item ${notif.status === 'unread' ? 'unread' : ''}">
        <div class="notif-header">
          <h4>${notif.senderUserId?.name || 'User'}</h4>
          <span class="notif-time">${new Date(notif.createdAt).toLocaleDateString()}</span>
        </div>
        <p class="notif-message">${notif.message}</p>
        <div class="notif-type" style="font-size: 11px; color: #999; margin: 5px 0;">
          ${notif.type === 'join_request' ? '📋 Join Request' : 
            notif.type === 'request_accepted' ? '✅ Request Accepted' : 
            notif.type === 'request_rejected' ? '❌ Request Rejected' :
            notif.type === 'ride_cancelled' ? '🚫 Ride Cancelled' :
            '👤 Removed From Ride'}
        </div>
        ${actionButtons}
      </div>
    `;
  }).join('');

  notificationPanel.innerHTML = `
    <div class="notification-header">
      <h3>Notifications</h3>
      <button onclick="closeNotificationPanel()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
    </div>
    <div class="notification-list">
      ${notificationList || '<p style="text-align: center; color: #999; padding: 20px;">No notifications</p>'}
    </div>
  `;
  
  console.log("✅ Notification panel updated");
}

function getActionButtonsForNotification(notif) {
  // Only show action buttons for join_request type
  if (notif.type !== 'join_request') {
    return '';
  }

  // Get the request ID from the notification (you may need to adjust this based on your data structure)
  return `
    <div class="notif-actions">
      <button class="btn btn-small btn-accept"
  onclick="acceptRequest('${notif.rideId?._id || notif.rideId}', '${notif._id}', '${notif.senderUserId?._id}')">
  Accept
      </button>
      <button class="btn btn-small btn-reject"
  onclick="rejectRequest('${notif.rideId?._id || notif.rideId}', '${notif._id}', '${notif.senderUserId?._id}')">
  Reject
      </button>
    </div>
  `;
}

export function removeNotificationFromUI(notificationId) {
  const notifItem = document.querySelector(`.notification-item[data-id='${notificationId}']`);
  if (notifItem) notifItem.remove();

  const remaining = document.querySelectorAll(".notification-item").length;
  if (remaining === 0) {
    const list = document.querySelector(".notification-list");
    if (list) list.innerHTML = `<p style="text-align:center; color:#999; padding:20px;">No notifications</p>`;
  }
}

export function updateNotificationBadge(change) {
  const badge = document.querySelector(".notification-badge.notif-unread-badge");
  if (badge) {
    let count = parseInt(badge.textContent, 10) + change;
    if (count <= 0) {
      badge.remove();
    } else {
      badge.textContent = count;
    }
  }
}


function ensureNotificationPanelShell() {
  let panel = document.getElementById('notificationPanel');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'notificationPanel';
  panel.className = 'notification-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="notification-header">
      <h3>Notifications</h3>
      <button type="button" onclick="closeNotificationPanel()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
    </div>
    <div class="notification-list">
      <p style="text-align: center; color: #999; padding: 20px;">Loading…</p>
    </div>`;
  document.body.appendChild(panel);
  loadNotifications();
  return panel;
}

export function toggleNotificationPanel(e) {
  e?.stopPropagation?.();
  const panel = ensureNotificationPanelShell();

  const isVisible =
    panel.style.display === 'flex' || panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'flex';

  if (!isVisible) {
    console.log("🔔 Notification panel opened — marking all as read");
    markAllNotificationsAsRead();
  }
}

export async function loadChatUnreadCount() {
  if (isInformationAboutPage()) return;

  try {
    const res = await fetch(`${API_BASE}/chats/unread-count`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    const chatIcon = document.querySelector('.notification .chat-gif');
    const chatParent = chatIcon?.closest('.notification');
    if (!chatParent) return;

    const existing = chatParent.querySelector('.chat-unread-badge');
    if (existing) existing.remove();

    if (data.unreadCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'notification-badge chat-unread-badge';
      badge.textContent = data.unreadCount > 99 ? '99+' : String(data.unreadCount);
      chatParent.appendChild(badge);
    }
  } catch (err) {
    console.error("Error loading chat unread count:", err);
  }
}


export function closeNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) {
    panel.style.display = 'none';
  }
}

export async function acceptRequest(rideId, notificationId, userId) {
  try {
    const actualRideId = rideId?._id || rideId;
    const requestRes = await fetch(`${API_BASE}/ride-requests/${actualRideId}/requests`, {
      credentials: "include"
    });

    if (!requestRes.ok) throw new Error("Failed to fetch join requests");
    const requestData = await requestRes.json();

    if (!requestData.success) throw new Error(requestData.message);

    const request = requestData.data.find(req => {
      const reqUserId = req.userId?._id?.toString() || req.userId?.toString();
      return reqUserId === userId;
    });

    if (!request) return showError("Join request not found");

    const res = await fetch(`${API_BASE}/ride-requests/${actualRideId}/requests/${request._id}/accept`, {
      method: "PUT",
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);
    
    // 4️⃣ Delete the related notification from backend
    await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: "DELETE",
      credentials: "include"
    });

    // 5️⃣ Update UI instantly
    removeNotificationFromUI(notificationId);
    updateNotificationBadge(-1);

    
    showSuccess("✅ Request accepted! Seat count updated.");
    await Promise.all([loadRides(), loadNotifications()]);
  } catch (err) {
    showError(err.message || "Error processing request");
  }
}

export async function rejectRequest(rideId, notificationId, userId) {
  try {
    const actualRideId = rideId?._id || rideId;
    const requestRes = await fetch(`${API_BASE}/ride-requests/${actualRideId}/requests`, {
      credentials: "include"
    });

    if (!requestRes.ok) throw new Error("Failed to fetch join requests");
    const requestData = await requestRes.json();

    if (!requestData.success) throw new Error(requestData.message);

    const request = requestData.data.find(req => {
      const reqUserId = req.userId?._id?.toString() || req.userId?.toString();
      return reqUserId === userId;
    });

    if (!request) return showError("Join request not found");

    const res = await fetch(`${API_BASE}/ride-requests/${actualRideId}/requests/${request._id}/reject`, {
      method: "PUT",
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

     await fetch(`${API_BASE}/notifications/${notificationId}`, {
           method: "DELETE",
          credentials: "include"
     });
    removeNotificationFromUI(notificationId);
    updateNotificationBadge(-1);

    showSuccess("❌ Request rejected successfully.");
    await Promise.all([loadRides(), loadNotifications()]);
  } catch (err) {
    showError(err.message || "Error processing request");
  }
}

// Close notification panel when clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notificationPanel');
  const notificationIcon = document.querySelector('.notification img[src*="notification"]');
  const open =
    panel &&
    (panel.style.display === 'flex' || panel.style.display === 'block');
  if (open) {
    const notificationParent = notificationIcon?.closest('.notification');
    if (!panel.contains(e.target) && !notificationParent?.contains(e.target)) {
      closeNotificationPanel();
    }
  }
});

/* ==============================
   CHAT PANEL FUNCTIONS
================================ */
export function toggleChatPanel(e) {
  if (e?.stopPropagation) e.stopPropagation();
  const panel = document.getElementById('chatPanel');
  if (!panel) return;

  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';

  if (!isVisible) {
    loadChatsForPanel();
  }
}

export async function loadChatsForPanel() {
  try {
    const res = await fetch(`${API_BASE}/chats`, {
      credentials: "include"
    });

    if (!res.ok) {
      console.error("❌ Chat API error:", res.status, res.statusText);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      console.error("Error loading chats:", data.message);
      return;
    }

    console.log("✅ Chats loaded:", data.data.length, "chats");
    displayChatPanel(data.data);
  } catch (err) {
    console.error("Error fetching chats:", err);
  }
}

export function displayChatPanel(chats) {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;

  const chatList = panel.querySelector('.chat-list') || panel;
  chatList.innerHTML = '';

  if (chats.length === 0) {
    chatList.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No chats yet</p>';
    return;
  }

  chats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.onclick = () => openChat(chat._id);

    const participantNames = chat.participants
      .filter(p => String(p._id) !== String(currentUser?._id))
      .map(p => p.name)
      .join(', ');

    const lastMsg = chat.messages?.length
      ? chat.messages[chat.messages.length - 1]
      : null;
    const preview = escHtml(formatChatMessagePreview(lastMsg));

    chatItem.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${chat.participants.find(p => String(p._id) !== String(currentUser?._id))?.profilePicture || '/images/default-avatar.png'}" 
             alt="Profile" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        <div>
          <div style="font-weight:600; color:#333;">${escHtml(participantNames)}</div>
          <div style="font-size:12px; color:#666;">${preview}</div>
        </div>
      </div>
    `;

    chatList.appendChild(chatItem);
  });
}

export function openChat(chatId) {
  if (!chatId) return;
  window.location.href = `chat.html?chatId=${encodeURIComponent(chatId)}`;
}

export function closeChatPanel() {
  const panel = document.getElementById('chatPanel');
  if (panel) panel.style.display = 'none';
}

// Close chat panel when clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('chatPanel');
  const chatIcon = document.querySelector('.notification .chat-gif');
  const chatParent = chatIcon?.closest('.notification');
  if (panel && panel.style.display === 'block') {
    if (!panel.contains(e.target) && !chatParent?.contains(e.target)) {
      closeChatPanel();
    }
  }
});
