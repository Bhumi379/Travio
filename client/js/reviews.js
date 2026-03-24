import { API_BASE, currentUser } from "./config.js";
import { showError, showSuccess } from "./utils.js";

function buildStars(rating) {
  const value = Number(rating) || 0;
  return "★".repeat(value) + "☆".repeat(Math.max(0, 5 - value));
}

function escapeHtml(input = "") {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderReviews(reviews = []) {
  const container = document.getElementById("reviewsGrid");
  if (!container) return;

  if (!reviews.length) {
    container.innerHTML = `
      <div class="review-card">
        <p class="review-text">No reviews yet. Be the first to share your experience.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews
    .map((review) => {
      const name = escapeHtml(review.userId?.name || "Travio Student");
      const comment = escapeHtml(review.comment || "No comment provided.");
      const stars = buildStars(review.rating);

      return `
        <div class="review-card">
          <div class="reviewer-info">
            <img src="images/profile.gif" alt="Student" class="reviewer-img">
            <div>
              <h4>${name}</h4>
              <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified Student</span>
            </div>
          </div>
          <div class="stars">${stars}</div>
          <p class="review-text">"${comment}"</p>
        </div>
      `;
    })
    .join("");
}

export async function loadReviews() {
  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load reviews");
    }

    renderReviews(Array.isArray(data.data) ? data.data : []);
  } catch (err) {
    showError(err.message || "Unable to load reviews");
  }
}

export async function submitReview() {
  try {
    const ratingEl = document.getElementById("reviewRating");
    const commentEl = document.getElementById("reviewComment");

    const rating = Number(ratingEl?.value);
    const comment = commentEl?.value?.trim();

    if (!rating || rating < 1 || rating > 5) {
      showError("Please select a valid rating");
      return;
    }

    if (!comment) {
      showError("Please add your review comment");
      return;
    }

    const res = await fetch(`${API_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to save review");
    }

    showSuccess("Review submitted successfully!");
    if (commentEl) commentEl.value = "";
    if (ratingEl) ratingEl.value = "";
    await loadReviews();
  } catch (err) {
    showError(err.message || "Unable to submit review");
  }
}

export function initReviewSection() {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  const nameInput = document.getElementById("reviewName");
  if (nameInput) {
    nameInput.value = currentUser?.name || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitReview();
  });

  loadReviews();
}

