# Travio - Use Cases Documentation

---

## **ADMIN USE CASES**

### **UC-A1: Admin Authentication - Signin**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A1 |
| **Use Case Name** | Admin Signin |
| **Actor** | Admin |
| **Description** | Admin logs into the system with valid credentials |
| **Pre-condition** | Admin account must exist in the system |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. Admin enters email/username<br>2. Admin enters password<br>3. System validates credentials<br>4. Authentication token generated<br>5. Admin dashboard displayed |
| **Alternative Flow** | 1. Invalid credentials entered<br>2. System displays error: "Invalid email/password"<br>3. Admin allowed to retry |
| **Exception Flow** | 1. Account locked due to multiple failed attempts<br>2. System displays: "Account temporarily locked" |
| **Post-condition** | Admin session created; token stored securely |

---

### **UC-A2: Admin Account Creation - Signup**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A2 |
| **Use Case Name** | Admin Signup |
| **Actor** | Admin |
| **Description** | Create new admin account in the system |
| **Pre-condition** | Admin details not already registered |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. Admin enters name, email, password<br>2. System validates email format<br>3. System checks email uniqueness<br>4. Password hashed and stored<br>5. Admin account created<br>6. Success message displayed |
| **Alternative Flow** | 1. Email already exists<br>2. System displays: "Email already registered"<br>3. Admin prompted to use different email |
| **Exception Flow** | 1. Invalid email format entered<br>2. Weak password validation fails<br>3. System displays validation errors |
| **Post-condition** | Admin account created; admin can signin |

---

### **UC-A3: Manage Users and Rides**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A3 |
| **Use Case Name** | Manage Users & Rides |
| **Actor** | Admin |
| **Description** | View, monitor, and manage user accounts and ride listings |
| **Pre-condition** | Admin must be logged in |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. Admin navigates to dashboard<br>2. System displays user count, ride statistics<br>3. Admin selects filter (active users, pending rides)<br>4. System fetches and displays filtered data<br>5. Admin can view details, suspend accounts, or delete rides |
| **Alternative Flow** | 1. No data available<br>2. System displays: "No records found" |
| **Exception Flow** | 1. Database unavailable<br>2. System displays error message |
| **Post-condition** | Data displayed; admin can take actions |

---

### **UC-A4: Monitor System Health & Analytics**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A4 |
| **Use Case Name** | Monitor System Health |
| **Actor** | Admin |
| **Description** | View system performance metrics, server status, and application analytics |
| **Pre-condition** | Admin must be logged in |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. Admin opens System Health page<br>2. System fetches metrics (uptime, users online, API response time)<br>3. Dashboard displays real-time health status<br>4. Admin views historical analytics charts |
| **Alternative Flow** | 1. Metrics service unavailable<br>2. System displays: "Health data unavailable" |
| **Exception Flow** | 1. Server experiencing issues<br>2. Warning icon displayed; recommendations shown |
| **Post-condition** | Admin informed of system status |

---

### **UC-A5: Manage Platform Settings**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A5 |
| **Use Case Name** | Manage Platform Settings |
| **Actor** | Admin |
| **Description** | Configure platform-wide settings (email templates, ride pricing rules, policies) |
| **Pre-condition** | Admin must be logged in |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. Admin navigates to Settings<br>2. Admin modifies configuration (SMTP settings, ride limits, etc.)<br>3. System validates inputs<br>4. System saves settings to database<br>5. Success notification displayed |
| **Alternative Flow** | 1. Invalid configuration entered<br>2. System displays validation error<br>3. Changes not saved |
| **Exception Flow** | 1. Database transaction fails<br>2. Rollback performed; user notified |
| **Post-condition** | Platform settings updated; system uses new configuration |

---

### **UC-A6: Admin Logout**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-A6 |
| **Use Case Name** | Admin Logout |
| **Actor** | Admin |
| **Description** | Securely end admin session |
| **Pre-condition** | Admin must be logged in |
| **Priority** | **LOW** |
| **Normal Flow** | 1. Admin clicks Logout<br>2. System invalidates session token<br>3. Session cleared from server<br>4. Redirect to login screen |
| **Alternative Flow** | 1. Session already expired<br>2. Automatic redirect to login |
| **Exception Flow** | None |
| **Post-condition** | Admin session terminated; login page displayed |

---

## **USER USE CASES**

### **UC-U1: User Authentication - Register/Login**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U1 |
| **Use Case Name** | Register/Login |
| **Actor** | User (Rider) |
| **Description** | User creates new account or logs into existing account |
| **Pre-condition** | User has valid college ID and contact details |
| **Priority** | **HIGH** |
| **Normal Flow** | **Signup:**<br>1. User enters college ID, name, email, password<br>2. System sends OTP to email<br>3. User enters OTP<br>4. System verifies OTP<br>5. Account created successfully<br><br>**Login:**<br>1. User enters college ID and password<br>2. System validates credentials<br>3. Auth token generated<br>4. User dashboard displayed |
| **Alternative Flow** | 1. College ID already exists<br>2. User prompted to login instead<br><br>1. Invalid credentials entered<br>2. System displays error message |
| **Exception Flow** | 1. OTP expired<br>2. User can request new OTP<br><br>1. Multiple failed login attempts<br>2. Account temporarily locked |
| **Post-condition** | User session created; authenticated access granted |

---

### **UC-U2: Browse Available Rides**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U2 |
| **Use Case Name** | Browse Available Rides |
| **Actor** | User (Rider) |
| **Description** | User searches and views available rides based on destination/route |
| **Pre-condition** | User must be logged in |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User navigates to Home/Search page<br>2. User enters destination (using autocomplete)<br>3. User optionally filters by date/time<br>4. System queries rides matching criteria<br>5. Results displayed with ride details (driver, price, seats, route)<br>6. User can click ride for more details |
| **Alternative Flow** | 1. No rides found<br>2. System displays: "No rides available"<br>3. Suggestion to create new ride shown |
| **Exception Flow** | 1. Search query invalid<br>2. Validation error displayed |
| **Post-condition** | Matching rides displayed to user |

---

### **UC-U3: Create New Ride Posting**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U3 |
| **Use Case Name** | Create Ride Posting |
| **Actor** | User (Driver/Initiator) |
| **Description** | User creates a new ride posting to find travel partners |
| **Pre-condition** | User must be logged in |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User navigates to "Create Ride" page<br>2. System displays form (pickup, destination, date, time, seats, price)<br>3. User fills all required fields<br>4. System validates inputs<br>5. System stores ride in database<br>6. Ride posted successfully; confirmation displayed<br>7. Ride visible to other users |
| **Alternative Flow** | 1. Incomplete form fields<br>2. System displays validation errors<br>3. User corrects and resubmits |
| **Exception Flow** | 1. Database error during save<br>2. User notified; ride creation failed |
| **Post-condition** | Ride created and available for other users |

---

### **UC-U4: Send Ride Request (Join Existing Ride)**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U4 |
| **Use Case Name** | Send Ride Request |
| **Actor** | User (Passenger) |
| **Description** | User sends request to join an existing ride |
| **Pre-condition** | User must be logged in; ride must have available seats |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User views ride details<br>2. User clicks "Request to Join"<br>3. System creates ride request<br>4. Ride initiator receives notification<br>5. User sees status: "Pending" |
| **Alternative Flow** | 1. User already sent request for same ride<br>2. System displays: "Request already sent"<br><br>1. No seats available<br>2. System disables join button |
| **Exception Flow** | 1. Request fails to save<br>2. Error message displayed |
| **Post-condition** | Ride request created; awaiting driver acceptance |

---

### **UC-U5: Accept/Reject Ride Requests**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U5 |
| **Use Case Name** | Accept/Reject Ride Requests |
| **Actor** | User (Ride Initiator/Driver) |
| **Description** | Driver accepts or rejects passenger requests for their ride |
| **Pre-condition** | User is ride initiator; pending requests exist |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User navigates to "Pending Requests"<br>2. System displays list of requests<br>3. User reviews passenger profile<br>4. User clicks "Accept" or "Reject"<br>5. System updates request status<br>6. Passenger notified of decision<br>7. If accepted: passenger added to participants list |
| **Alternative Flow** | 1. User rejects all requests<br>2. Ride remains active; can receive more requests |
| **Exception Flow** | 1. Seats fully booked before acceptance<br>2. System displays: "No seats available" |
| **Post-condition** | Ride request accepted/rejected; passenger notified |

---

### **UC-U6: View Ride Details & Chat with Partner**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U6 |
| **Use Case Name** | Real-Time Chat |
| **Actor** | User (Rider/Passenger) |
| **Description** | Users communicate in real-time with ride partner(s) |
| **Pre-condition** | User must be matched with a ride partner |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User opens chat window<br>2. Conversation history displayed<br>3. User types message<br>4. Message sent via Socket.IO<br>5. Partner receives message instantly<br>6. Read receipts shown |
| **Alternative Flow** | 1. No internet connection<br>2. Message queued; sent on reconnection |
| **Exception Flow** | 1. Chat service unavailable<br>2. Fallback method (SMS) suggested |
| **Post-condition** | Messages delivered; communication established |

---

### **UC-U7: View Live Location (During Active Ride)**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U7 |
| **Use Case Name** | Live Location Tracking |
| **Actor** | User (Rider/Passenger) |
| **Description** | User shares and views live GPS location during active ride |
| **Pre-condition** | User must be on active confirmed ride; location services enabled |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User opens Ride Details<br>2. System fetches GPS coordinates<br>3. Map displays with live location<br>4. Location updates in real-time<br>5. Guardian SMS sent at intervals (if configured) |
| **Alternative Flow** | 1. GPS unavailable<br>2. Last known location displayed<br>3. Warning shown to user |
| **Exception Flow** | 1. Location permission denied<br>2. System requests permission |
| **Post-condition** | Live location visible to ride participants |

---

### **UC-U8: View Ride History**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U8 |
| **Use Case Name** | View Previous Rides |
| **Actor** | User (Rider/Passenger) |
| **Description** | User views completed rides and ride history |
| **Pre-condition** | User must be logged in; have completed rides |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. User navigates to "Previous Rides"<br>2. System fetches completed rides<br>3. List displayed with details (date, destination, partner, cost)<br>4. User can click ride for full details<br>5. User can leave review/rating |
| **Alternative Flow** | 1. No ride history<br>2. System displays: "No completed rides" |
| **Exception Flow** | None |
| **Post-condition** | Ride history displayed |

---

### **UC-U9: Rate and Review Ride Partner**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U9 |
| **Use Case Name** | Rate & Review Partner |
| **Actor** | User (Rider/Passenger) |
| **Description** | User leaves rating and review for ride partner after completion |
| **Pre-condition** | Ride must be completed; review period not expired |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. User opens Previous Rides<br>2. User selects completed ride<br>3. System displays review form<br>4. User enters rating (1-5 stars)<br>5. User enters optional comment<br>6. System validates and saves review<br>7. Review visible on partner's profile |
| **Alternative Flow** | 1. User already reviewed this ride<br>2. System displays: "Already reviewed"<br>3. Edit option provided |
| **Exception Flow** | 1. Review save fails<br>2. Error message displayed |
| **Post-condition** | Review saved; visible on partner profile |

---

### **UC-U10: Cancel Ride**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U10 |
| **Use Case Name** | Cancel Ride |
| **Actor** | User (Ride Initiator/Participant) |
| **Description** | User cancels an active/upcoming ride |
| **Pre-condition** | User must have active ride; cancellation period allows it |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User opens ride details<br>2. User clicks "Cancel Ride"<br>3. System displays cancellation confirmation<br>4. User confirms cancellation<br>5. Ride status changed to "cancelled"<br>6. All participants notified<br>7. Cancellation reason stored (optional) |
| **Alternative Flow** | 1. Ride already in progress<br>2. System displays: "Cannot cancel active ride" |
| **Exception Flow** | 1. Cancellation fails<br>2. User notified; can retry |
| **Post-condition** | Ride cancelled; participants notified |

---

### **UC-U11: Share Already-Booked Cab**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U11 |
| **Use Case Name** | Share Pre-Booked Cab |
| **Actor** | User (Driver) |
| **Description** | User shares an already-booked external cab/taxi with others |
| **Pre-condition** | User has booked external transport; logged in |
| **Priority** | **HIGH** |
| **Normal Flow** | 1. User navigates to "Share Cab"<br>2. System displays form (destination, seats available, approx cost)<br>3. User fills details<br>4. System validates<br>5. Posting created and visible to others<br>6. Other users can send requests<br>7. Process same as UC-U4 onwards |
| **Alternative Flow** | 1. Incomplete form<br>2. Validation error displayed |
| **Exception Flow** | None |
| **Post-condition** | Cab-sharing posting created |

---

### **UC-U12: Update Profile**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U12 |
| **Use Case Name** | Update User Profile |
| **Actor** | User |
| **Description** | User updates profile information (name, bio, picture, contact) |
| **Pre-condition** | User must be logged in |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. User navigates to Profile<br>2. User clicks "Edit Profile"<br>3. System displays form with current details<br>4. User modifies fields<br>5. System validates inputs<br>6. Profile updated<br>7. Success message displayed |
| **Alternative Flow** | 1. Invalid input format<br>2. Validation error displayed |
| **Exception Flow** | 1. Profile picture upload fails<br>2. Text fields saved; picture retry suggested |
| **Post-condition** | Profile updated; changes visible |

---

### **UC-U13: User Logout**

| Field | Value |
|-------|-------|
| **Use Case ID** | UC-U13 |
| **Use Case Name** | User Logout |
| **Actor** | User |
| **Description** | Securely end user session |
| **Pre-condition** | User must be logged in |
| **Priority** | **MEDIUM** |
| **Normal Flow** | 1. User clicks Logout<br>2. System invalidates session token<br>3. Local storage cleared<br>4. Redirect to login page |
| **Alternative Flow** | 1. Session already expired<br>2. Automatic redirect to login |
| **Exception Flow** | None |
| **Post-condition** | User session terminated |

---

## **USE CASE SUMMARY TABLE**

| ID | Use Case | Actor | Priority | Status |
|:---:|----------|-------|----------|--------|
| UC-A1 | Admin Signin | Admin | HIGH | ✅ Valid |
| UC-A2 | Admin Signup | Admin | HIGH | ✅ Valid |
| UC-A3 | Manage Users & Rides | Admin | HIGH | ✅ Valid |
| UC-A4 | Monitor System Health | Admin | MEDIUM | ✅ Valid |
| UC-A5 | Manage Settings | Admin | MEDIUM | ✅ Valid |
| UC-A6 | Admin Logout | Admin | LOW | ✅ Valid |
| UC-U1 | Register/Login | User | HIGH | ✅ Valid |
| UC-U2 | Browse Rides | User | HIGH | ✅ Valid |
| UC-U3 | Create Ride | User | HIGH | ✅ Valid |
| UC-U4 | Send Ride Request | User | HIGH | ✅ Valid |
| UC-U5 | Accept/Reject Requests | User | HIGH | ✅ Valid |
| UC-U6 | Real-Time Chat | User | HIGH | ✅ Valid |
| UC-U7 | Live Location | User | HIGH | ✅ Valid |
| UC-U8 | View History | User | MEDIUM | ✅ Valid |
| UC-U9 | Rate & Review | User | MEDIUM | ✅ Valid |
| UC-U10 | Cancel Ride | User | HIGH | ✅ Valid |
| UC-U11 | Share Pre-Booked Cab | User | HIGH | ✅ Valid |
| UC-U12 | Update Profile | User | MEDIUM | ✅ Valid |
| UC-U13 | User Logout | User | MEDIUM | ✅ Valid |

---

## **NOTES**

- All use cases have been validated for Travio ride-sharing platform
- High-priority items are core to MVP (Minimum Viable Product)
- Medium-priority items are important but can be added in later phases
- Low-priority items are nice-to-haves
- Use case dependencies are documented in Normal/Alternative flows
