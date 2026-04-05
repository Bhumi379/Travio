/** Shared preview text for chat list / headers (no DOM, safe to import anywhere). */
export function formatChatMessagePreview(msg) {
  if (!msg) return 'No messages yet';
  const t = msg.messageType || (msg.mediaUrl ? 'file' : 'text');
  if (t === 'image') {
    return msg.encryptedMessage?.trim() ? `📷 ${msg.encryptedMessage}` : '📷 Photo';
  }
  if (t === 'file') {
    if (msg.mimeType === 'video/mp4' || msg.mimeType === 'video/webm') {
      return msg.encryptedMessage?.trim() ? `🎬 ${msg.encryptedMessage}` : '🎬 Video';
    }
    if (msg.encryptedMessage?.trim()) return `📎 ${msg.encryptedMessage}`;
    return `📎 ${msg.fileName || 'File'}`;
  }
  return msg.encryptedMessage || '';
}
