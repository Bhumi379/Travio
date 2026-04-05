const AboutContent = require('../models/AboutContent');
const aboutDefaults = require('../data/aboutDefaults');

function normalizeString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function sanitizeBusSchedules(arr) {
  if (!Array.isArray(arr)) return aboutDefaults.busSchedules;

  const out = arr
    .map((card) => {
      const title = normalizeString(card?.title) || '';
      const tag = normalizeString(card?.tag) || '';
      const timesArr = Array.isArray(card?.times) ? card.times : [];

      const times = timesArr
        .map((t) => ({
          time: normalizeString(t?.time),
          status: normalizeString(t?.status) || 'Daily',
        }))
        .filter((t) => t.time);

      return { title, tag, times };
    })
    // `title` is required by schema, so drop cards missing title
    .filter((c) => c.title);

  return out.length ? out : aboutDefaults.busSchedules;
}

function sanitizeNiwaiSlots(arr) {
  if (!Array.isArray(arr)) return aboutDefaults.niwaiSlots;

  const out = arr
    .map((s) => ({
      label: normalizeString(s?.label),
      time: normalizeString(s?.time),
    }))
    .filter((s) => s.label && s.time);

  return out.length ? out : aboutDefaults.niwaiSlots;
}

function sanitizeMetroDidi(arr) {
  if (!Array.isArray(arr)) return aboutDefaults.metroDidi;

  const out = arr
    .map((m) => {
      const name = normalizeString(m?.name);
      const route = normalizeString(m?.route) || '';
      const phone =
        m?.phone == null || m?.phone === ''
          ? ''
          : String(m.phone).trim();
      const letter = normalizeString(m?.letter).slice(0, 2);
      return {
        name,
        route,
        phone,
        letter,
      };
    })
    // `name` and `phone` are required by schema; drop invalid entries
    .filter((m) => m.name && m.phone)
    .map((m) => ({
      ...m,
      letter: m.letter || m.name.charAt(0).toUpperCase(),
    }));

  return out.length ? out : aboutDefaults.metroDidi;
}

function trustedDriverPhone(d) {
  const raw = d?.phone ?? d?.driverPhone ?? d?.contactPhone;
  if (raw == null || raw === '') return '';
  return String(raw).trim();
}

function sanitizeTrustedDrivers(arr) {
  if (!Array.isArray(arr)) return aboutDefaults.trustedDrivers;

  const out = arr
    .map((d) => {
      const name = normalizeString(d?.name);
      const description = normalizeString(d?.description) || '';
      const phone = trustedDriverPhone(d);
      const letter = normalizeString(d?.letter).slice(0, 2);
      return { name, description, phone, letter };
    })
    // `name` is required by schema; drop invalid entries
    .filter((d) => d.name)
    .map((d) => ({
      ...d,
      letter: d.letter || d.name.charAt(0).toUpperCase(),
    }));

  return out.length ? out : aboutDefaults.trustedDrivers;
}

function ensureHtmlField(doc) {
  if (!doc) return;
  const v = doc.get ? doc.get('html') : doc.html;
  if (v == null || v === undefined) {
    if (doc.set) doc.set('html', '');
    else doc.html = '';
  }
}

async function ensureAboutDocument() {
  let doc = await AboutContent.findOne({ slug: 'about' });
  if (!doc) {
    doc = await AboutContent.create({
      slug: 'about',
      html: '',
      ...aboutDefaults,
    });
    return doc;
  }

  ensureHtmlField(doc);

  // Defensive migration: sanitize/normalize structured fields to avoid
  // schema validation errors (required nested fields).
  const sanitizedPageTitle =
    normalizeString(doc.pageTitle) || aboutDefaults.pageTitle;
  const sanitizedPageSubtitle =
    normalizeString(doc.pageSubtitle) || aboutDefaults.pageSubtitle;
  const sanitizedBusSchedules = sanitizeBusSchedules(doc.busSchedules);
  const sanitizedNiwaiSlots = sanitizeNiwaiSlots(doc.niwaiSlots);
  const sanitizedMetroDidi = sanitizeMetroDidi(doc.metroDidi);
  const sanitizedTrustedDrivers = sanitizeTrustedDrivers(doc.trustedDrivers);

  doc.pageTitle = sanitizedPageTitle;
  doc.pageSubtitle = sanitizedPageSubtitle;
  doc.busSchedules = sanitizedBusSchedules;
  doc.niwaiSlots = sanitizedNiwaiSlots;
  doc.metroDidi = sanitizedMetroDidi;
  doc.trustedDrivers = sanitizedTrustedDrivers;

  ensureHtmlField(doc);

  // Avoid broken JSON.stringify comparisons on subdocs (they include `_id`);
  // only persist when Mongoose detects real edits.
  if (doc.isModified && doc.isModified()) {
    await doc.save();
  }
  return doc;
}

function publicPayload(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    pageTitle: o.pageTitle,
    pageSubtitle: o.pageSubtitle,
    busSchedules: o.busSchedules || [],
    niwaiSlots: o.niwaiSlots || [],
    metroDidi: o.metroDidi || [],
    trustedDrivers: o.trustedDrivers || [],
  };
}

module.exports = {
  ensureAboutDocument,
  publicPayload,
  aboutDefaults,
};
