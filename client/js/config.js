// API Configuration and Constants
export const API_BASE = "http://localhost:5000/api";

// Global state
export let currentUser = null;
export let rides = [];
export let selectedPickup = null;
export let selectedDestination = null;
export let notificationCheckInterval = null;

// Setters for global state
export function setCurrentUser(user) {
  currentUser = user;
}

export function setRides(ridesData) {
  rides = ridesData;
}

export function setSelectedPickup(pickup) {
  selectedPickup = pickup;
}

export function setSelectedDestination(destination) {
  selectedDestination = destination;
}

export function setNotificationCheckInterval(interval) {
  notificationCheckInterval = interval;
}
