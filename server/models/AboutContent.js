const mongoose = require('mongoose');

const busTimeSchema = new mongoose.Schema(
  {
    time: { type: String, required: true, trim: true },
    status: { type: String, default: 'Daily', trim: true },
  },
  { _id: false }
);

const busCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, default: '', trim: true },
    times: { type: [busTimeSchema], default: [] },
  },
  { _id: true }
);

const niwaiSlotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const metroDidiSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    route: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    letter: { type: String, default: '', trim: true, maxlength: 2 },
  },
  { _id: true }
);

const trustedDriverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** Optional; shown on Information page when set */
    phone: { type: String, default: '', trim: true },
    letter: { type: String, default: '', trim: true, maxlength: 2 },
  },
  { _id: true }
);

const aboutContentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      default: 'about',
    },
    /** @deprecated Kept for backwards compatibility; public page uses structured fields. */
    html: {
      type: String,
      default: '',
      required: false,
      set: (v) => (v == null ? '' : String(v)),
    },
    pageTitle: { type: String, default: '' },
    pageSubtitle: { type: String, default: '' },
    busSchedules: { type: [busCardSchema], default: [] },
    niwaiSlots: { type: [niwaiSlotSchema], default: [] },
    metroDidi: { type: [metroDidiSchema], default: [] },
    trustedDrivers: { type: [trustedDriverSchema], default: [] },
    updatedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AboutContent', aboutContentSchema);
