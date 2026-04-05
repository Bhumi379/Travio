/**
 * Renders the public Information (about) page from /api/content/about.
 * No "contribute / add" cards — only admin-managed content.
 */

import { API_BASE } from './config.js';

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function avatarGradient(letter) {
  const colors = ['#ffe0b2', '#ffcc80', '#ffb74d', '#c8e6c9', '#bbdefb', '#ffecb3'];
  const i = (letter || '?').charCodeAt(0) % colors.length;
  return colors[i];
}

function renderBusSchedules(cards) {
  if (!Array.isArray(cards) || !cards.length) return '';
  return `
    <section class="schedule-section">
      <div class="section-title">
        <i class="fa-solid fa-bus"></i>
        <h2>Roadways Bus Schedule</h2>
      </div>
      <div class="grid-container">
        ${cards
          .map(
            (c) => `
          <div class="card fade-in">
            <div class="card-header from-campus">
              <h3>${esc(c.title)}</h3>
              <span class="tag">${esc(c.tag || '')}</span>
            </div>
            <div class="card-body">
              <ul class="time-list">
                ${(c.times || [])
                  .map(
                    (t) => `
                  <li>
                    <span class="time">${esc(t.time)}</span>
                    <span class="status available">${esc(t.status || 'Daily')}</span>
                  </li>`
                  )
                  .join('')}
              </ul>
            </div>
          </div>`
          )
          .join('')}
      </div>
    </section>`;
}

function renderNiwai(slots) {
  if (!Array.isArray(slots) || !slots.length) return '';
  return `
    <section class="schedule-section">
      <div class="section-title">
        <i class="fa-solid fa-train"></i>
        <h2>To Niwai Railway Station (Meta)</h2>
      </div>
      <div class="card full-width fade-in delay-2">
        <div class="card-body flex-row">
          <div class="meta-icon">
            <i class="fa-solid fa-shuttle-van"></i>
          </div>
          <div class="time-grid">
            ${slots
              .map(
                (s) => `
              <div class="time-slot">
                <span class="label">${esc(s.label)}</span>
                <span class="time-big">${esc(s.time)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
      </div>
    </section>`;
}

function renderMetroDidi(items, subtitle) {
  if (!Array.isArray(items) || !items.length) return '';
  return `
    <section class="contact-section">
      <div class="section-title">
        <i class="fa-solid fa-phone"></i>
        <h2>On-Campus "Metro Didi" Contacts</h2>
      </div>
      <p style="margin-bottom: 20px; color: #7f8c8d;">${esc(
        subtitle ||
          'Direct numbers for booking an auto or mini-metro.'
      )}</p>
      <div class="contacts-grid fade-in delay-3">
        ${items
          .map((c) => {
            const L = (c.letter || c.name || '?').charAt(0).toUpperCase();
            const bg = avatarGradient(L);
            return `
          <div class="contact-card">
            <div class="avatar" style="background-color: ${bg};">${esc(L)}</div>
            <div class="info">
              <h4>${esc(c.name)}</h4>
              <p>${esc(c.route || '')}</p>
            </div>
            <a class="phone-display" href="tel:${esc(String(c.phone).replace(/\s/g, ''))}">
              <i class="fa-solid fa-phone"></i> ${esc(c.phone)}
            </a>
          </div>`;
          })
          .join('')}
      </div>
    </section>`;
}

function renderTrustedDrivers(items, subtitle) {
  if (!Array.isArray(items) || !items.length) return '';
  return `
    <section class="contact-section">
      <div class="section-title">
        <i class="fa-solid fa-user-check"></i>
        <h2>Trusted Drivers</h2>
      </div>
      <p style="margin-bottom: 20px; color: #7f8c8d;">${esc(
        subtitle ||
          'Recommended drivers for safe campus rides.'
      )}</p>
      <div class="contacts-grid fade-in delay-3">
        ${items
          .map((d) => {
            const L = (d.letter || d.name || '?').charAt(0).toUpperCase();
            const bg = avatarGradient(L);
            const phoneRaw = d.phone != null ? String(d.phone).trim() : '';
            const telHref = phoneRaw ? phoneRaw.replace(/\s/g, '') : '';
            const phoneBlock = phoneRaw
              ? `<a class="phone-display" href="tel:${esc(telHref)}"><i class="fa-solid fa-phone"></i> ${esc(phoneRaw)}</a>`
              : `<div class="phone-display" style="background: rgba(39, 174, 96, 0.08); color: #27ae60; cursor: default;">
              <i class="fa-solid fa-shield-halved"></i> Trusted
            </div>`;
            return `
          <div class="contact-card">
            <div class="avatar" style="background-color: ${bg};">${esc(L)}</div>
            <div class="info">
              <h4>${esc(d.name)}</h4>
              <p>${esc(d.description || '')}</p>
            </div>
            ${phoneBlock}
          </div>`;
          })
          .join('')}
      </div>
    </section>`;
}

function buildAboutHtml(data) {
  const title = data.pageTitle || 'Campus Commute';
  const subtitle =
    data.pageSubtitle ||
    'Official Schedules for Roadways, Metro, and Auto Services.';

  return `
    <header class="page-header">
      <div class="header-content">
        <h1>${esc(title)}</h1>
        <p>${esc(subtitle)}</p>
      </div>
    </header>
    ${renderBusSchedules(data.busSchedules)}
    ${renderNiwai(data.niwaiSlots)}
    ${renderMetroDidi(data.metroDidi)}
    ${renderTrustedDrivers(data.trustedDrivers)}
  `;
}

async function initAboutPage() {
  const root = document.getElementById('aboutDynamicRoot');
  if (!root) return;

  try {
    // Use API_BASE so this works when about.html is opened from Live Server (:5500)
    // or any host — not only when served from the same origin as the API.
    const res = await fetch(`${API_BASE}/content/about`, {
      credentials: 'include',
      cache: 'no-store',
    });
    const json = await res.json();
    if (!json.success || !json.data) {
      root.innerHTML =
        `<p style="text-align:center;padding:3rem;color:#c0392b;">
          Unable to load information. ${esc(json.message || 'Please try again later.')}
        </p>`;
      return;
    }
    root.innerHTML = buildAboutHtml(json.data);
  } catch (e) {
    root.innerHTML =
      '<p style="text-align:center;padding:3rem;color:#c0392b;">Unable to load information. Please try again later.</p>';
  }
}

document.addEventListener('DOMContentLoaded', initAboutPage);
