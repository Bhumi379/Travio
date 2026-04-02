const express = require('express');
const router = express.Router();
const {
  ensureAboutDocument,
  publicPayload,
} = require('../controllers/aboutContentHelper');

// Public: structured Information / About page
router.get('/about', async (_req, res) => {
  try {
    const doc = await ensureAboutDocument();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.json({ success: true, data: publicPayload(doc) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message,
    });
  }
});

module.exports = router;
