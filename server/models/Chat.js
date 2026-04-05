const mongoose = require('mongoose');

const { Schema } = mongoose;
const oid = Schema.Types.ObjectId;

/** Embedded: Message */
const messageSchema = new Schema(
  {
    senderId: {
      type: oid,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    /** Text body, or caption for image/file messages */
    encryptedMessage: {
      type: String,
      trim: true,
      default: '',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    /** Public URL path e.g. /uploads/chat/xyz.jpg */
    mediaUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
    mimeType: {
      type: String,
      default: '',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    readBy: [
      {
        type: oid,
        ref: 'User',
        default: undefined,
      },
    ],
  },
  { _id: true }
);

// Mongoose 9: pre hooks do not receive `next()` — use async/throw (see migrating_to_9.html).
messageSchema.pre('validate', async function () {
  const hasMedia = this.mediaUrl != null && String(this.mediaUrl).trim() !== '';
  const hasText =
    this.encryptedMessage != null && String(this.encryptedMessage).trim() !== '';

  if (!hasMedia && !hasText) {
    throw new Error('Message text or media is required');
  }
});

/** Chats */
const chatSchema = new Schema(
  {
    participants: {
      type: [{ type: oid, ref: 'User', required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: 'A chat must have at least 2 participants',
      },
    },
    messages: {
      type: [messageSchema],
      default: undefined,
    },
  },
  { timestamps: true }
);

chatSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
chatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);
