// Utility Functions

export function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('create_a_ride.html')) return 'create_ride';
  if (path.includes('profile.html')) return 'profile';
  if (path.includes('previous.html')) return 'previous';
  if (path.includes('index.html') || path === '/') return 'home';
  return 'unknown';
}

export async function getCurrentUserId() {
  const { currentUser } = await import('./config.js');
  
  if (!currentUser) {
    console.warn('getCurrentUserId: currentUser is null');
    return null;
  }
  
  // Try different possible ID fields
  if (currentUser._id) {
    const id = currentUser._id.toString ? currentUser._id.toString() : String(currentUser._id);
    return id;
  }
  if (currentUser.id) {
    const id = currentUser.id.toString ? currentUser.id.toString() : String(currentUser.id);
    return id;
  }
  
  console.warn('getCurrentUserId: No ID found in currentUser', currentUser);
  return null;
}

export function showSuccess(msg) {
  // You can replace this with a better notification system
  alert(msg);
}

export function showError(msg) {
  // You can replace this with a better notification system
  alert(msg);
}

// Expose to window for debugging
window.checkCurrentUser = async function() {
  const { currentUser } = await import('./config.js');
  console.log('=== CURRENT USER DEBUG ===');
  console.log('currentUser object:', currentUser);
  console.log('Current User ID:', getCurrentUserId());
  console.log('Current User Name:', currentUser?.name);
  console.log('Current User Email:', currentUser?.email);
  return {
    user: currentUser,
    userId: getCurrentUserId(),
    userIdRaw: currentUser?._id || currentUser?.id
  };
};
