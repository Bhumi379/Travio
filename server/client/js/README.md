# JavaScript Code Organization

Your code has been split into modular files for better maintainability and organization.

## File Structure

```
├── index.js              # Main entry point - orchestrates all modules
├── config.js             # Configuration and global state management
├── utils.js              # Utility/helper functions
├── auth.js               # Authentication functions
├── autocomplete.js       # Location autocomplete functionality
├── rides.js              # Ride management (CRUD operations)
├── notifications.js      # Notification system
└── pageInit.js           # Page-specific initialization functions
```

## Module Breakdown

### 1. **config.js**
- API base URL
- Global state variables (currentUser, rides, etc.)
- State setter functions
- **Purpose**: Centralized configuration and state management

### 2. **utils.js**
- `getCurrentPage()` - Detect current page
- `getCurrentUserId()` - Get user ID helper
- `showSuccess()` - Success message display
- `showError()` - Error message display
- `window.checkCurrentUser()` - Debug function
- **Purpose**: Common utility functions used across modules

### 3. **auth.js**
- `fetchCurrentUser()` - Load user data
- `logout()` - User logout
- **Purpose**: Authentication and user management

### 4. **autocomplete.js**
- `setupOSMAutocomplete()` - For create ride form
- `setupSearchAutocomplete()` - For home search bar
- **Purpose**: Location search and autocomplete functionality

### 5. **rides.js**
- `loadRides()` - Load all rides
- `loadPreviousRides()` - Load user's rides
- `displayRides()` - Render rides to DOM
- `searchRides()` - Search functionality
- `createRide()` - Create new ride
- `openChat()` - Chat functionality
- `requestRide()` - Request to join ride
- **Purpose**: All ride-related operations

### 6. **notifications.js**
- `loadNotifications()` - Fetch notifications
- `displayNotifications()` - Render notifications
- `markAllNotificationsAsRead()` - Mark as read
- `toggleNotificationPanel()` - Show/hide panel
- `closeNotificationPanel()` - Close panel
- `acceptRequest()` - Accept ride request
- `rejectRequest()` - Reject ride request
- Helper functions for notification UI
- **Purpose**: Complete notification system

### 7. **pageInit.js**
- `initHomePage()` - Initialize home page
- `initCreateRidePage()` - Initialize create ride page
- `initPreviousRidesPage()` - Initialize previous rides page
- `initProfilePage()` - Initialize profile page
- **Purpose**: Page-specific initialization logic

### 8. **index.js** (Main Entry Point)
- Imports all modules
- Exposes functions to global scope (for HTML onclick handlers)
- Main DOMContentLoaded event listener
- Routes to appropriate page initialization
- Driver details toggle functionality
- **Purpose**: Application entry point and orchestration

## How to Use

### In Your HTML Files

**Option 1: Using ES6 Modules (Recommended)**

Add `type="module"` to your script tag:

```html
<script type="module" src="index.js"></script>
```

**Option 2: Using a Bundler**

If you're using a bundler like Webpack, Vite, or Rollup, simply import:

```javascript
import './index.js';
```

### Important Notes

1. **ES6 Module Syntax**: All files use `import/export` syntax
2. **Browser Compatibility**: Modern browsers support ES6 modules natively
3. **Global Functions**: Functions used in HTML `onclick` attributes are exposed via `window` object in `index.js`
4. **No Code Changes**: The functionality remains exactly the same, only the organization changed

## Benefits of This Structure

✅ **Better Organization**: Related code is grouped together
✅ **Easier Maintenance**: Find and fix bugs faster
✅ **Reusability**: Import only what you need
✅ **Scalability**: Easy to add new features
✅ **Debugging**: Smaller files are easier to debug
✅ **Team Collaboration**: Multiple developers can work on different modules
✅ **Testing**: Easier to write unit tests for individual modules

## Migration Steps

1. Replace your old `index.js` with the new modular files
2. Update your HTML to use `<script type="module" src="index.js"></script>`
3. Test all functionality to ensure everything works
4. No changes needed to your HTML onclick handlers

## Dependencies Between Modules

```
index.js
├── imports config.js
├── imports utils.js
├── imports auth.js
├── imports autocomplete.js
├── imports rides.js (which imports notifications.js)
├── imports notifications.js (which imports rides.js)
└── imports pageInit.js (which imports all of the above)
```

**Note**: There's a circular dependency between `rides.js` and `notifications.js`, but it's handled properly through async imports.
