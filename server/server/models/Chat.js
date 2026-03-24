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
    encryptedMessage: {
      type: String,
      required: [true, 'Encrypted message is required'],
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
        default: undefined, // keep field absent if empty
      },
    ],
  },
  { _id: true } // auto-generate message _id
);

/** Chats */
const chatSchema = new Schema(
  {
    participants: {
      type: [ { type: oid, ref: 'User', required: true } ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: 'A chat must have at least 2 participants',
      },
    },
    messages: {
      type: [messageSchema], // optional; can be empty
      default: undefined,
    },
  },
  { timestamps: true }
);

// id virtual like your other models
chatSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
chatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);
