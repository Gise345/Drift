# Drift Safety Features & Policies

## Overview

Drift is committed to providing a safe platform for peer-to-peer carpool arrangements. Our comprehensive safety system includes real-time monitoring, emergency response features, and accountability measures to protect both riders and drivers.

This document outlines all safety features, policies, and procedures implemented in the Drift platform.

---

## Real-Time Safety Monitoring

### Speed Monitoring

**How It Works:**
- Drift monitors vehicle speed in real-time during active trips using GPS data
- Speed limits are fetched from Google Roads API for the current road
- Speed data is logged and analyzed throughout the trip

**Alert Levels:**
- **Normal (Green):** Vehicle is within speed limit
- **Warning (Yellow):** Vehicle is 3-6 mph over the speed limit
- **Danger (Red):** Vehicle is 6+ mph over the speed limit

**Violation Thresholds:**
- A speed violation is recorded when the vehicle exceeds the speed limit by 6+ mph for 10+ consecutive seconds
- 3 or more speed violations in a single trip may result in a strike

**Visibility:**
- Riders can see real-time speed and speed limit during trips
- Drivers can see their speed compliance metrics in the Safety Dashboard
- All speed data is logged for review if disputes arise

### Route Deviation Detection

**How It Works:**
- The planned route is calculated when a trip is accepted
- Driver's actual location is compared to the planned route every 15 seconds
- Deviation is measured as the perpendicular distance from the route

**Alert Triggers:**
- Deviation of 0.5 miles (804 meters) or more from the planned route
- Must persist for 2+ minutes before triggering an alert

**Rider Alert System:**
When a route deviation is detected:
1. Rider receives a full-screen "Are you okay?" popup
2. 60-second countdown timer begins
3. Two response options:
   - **"I'm Okay"** - Trip continues normally, alert dismissed
   - **"SOS"** - Emergency response initiated (see Emergency Response section)
4. If no response within 60 seconds, emergency contacts are automatically alerted

**Payment Protection:**
- Payment is automatically held when route deviation is detected
- Released to driver only after rider confirms they're okay
- Voided if SOS is pressed or no response received

**Driver Accountability:**
- Route deviations with SOS responses result in account flagging
- Repeated deviations with rider concerns may result in strikes
- Drivers are encouraged to communicate route changes to riders

### Early Trip Completion Detection

**How It Works:**
- When a driver marks a trip as complete, the system checks the driver's location
- Distance from the planned destination is calculated
- If more than 0.3 miles (483 meters) from destination, an alert is triggered

**Alert System:**
When early completion is detected:
1. Rider receives a full-screen "Are you okay?" popup
2. Trip marked as "pending confirmation"
3. Same 60-second response window as route deviation
4. Payment is automatically held until confirmation

**Consequences:**
- Confirmed early completions without rider consent result in payment void
- Repeated incidents lead to strikes and account review
- Emergency contacts notified if SOS pressed or no response

---

## Emergency Response

### SOS Button

**Location:** Always visible during active trips (red button)

**Activation:** Long press for 2 seconds to prevent accidental triggers

**Immediate Actions:**
1. 911 is called automatically
2. Current location is captured and shared
3. Emergency contacts receive immediate notification with:
   - Real-time location
   - Driver information (name, vehicle, plate)
   - Trip details (pickup, destination)
4. Payment is automatically voided
5. Driver's account is flagged for review

**Post-SOS:**
- Trip is immediately terminated
- Account under review until investigation complete
- Support team contacts both parties within 24 hours

### Emergency Contact Alerts

**Auto-Alerting Conditions:**
- SOS button pressed
- No response to safety alerts within 60 seconds
- Manual trigger by user

**Information Shared:**
- Real-time GPS location (updates every 15 seconds)
- Driver information (name, photo, rating)
- Vehicle details (make, model, color, plate number)
- Trip route (pickup to destination)
- Link to live tracking

**Contact Management:**
- Users can add up to 5 emergency contacts
- Contacts can be designated by relationship
- SMS and email notifications supported

---

## Three-Strike System

### How Strikes Are Issued

Strikes may be issued for:
1. **Speed Violations:** 3+ excessive speed violations in a single trip
2. **Route Deviations:** Deviations resulting in rider SOS or no-response
3. **Early Completions:** Completing trips far from destination with rider concern
4. **User Reports:** Verified safety violation reports from riders
5. **Terms Violations:** Violations of platform safety terms

### Strike Severity

- **Low:** Minor first-time offenses
- **Medium:** Moderate violations or repeat minor offenses
- **High:** Serious safety violations
- **Critical:** Immediate threat to rider safety

### Strike Consequences

| Strike Count | Consequence |
|--------------|-------------|
| Strike 1 | Warning notification, remains on record for 90 days |
| Strike 2 | 7-day temporary suspension from platform |
| Strike 3 | Permanent account suspension + payment void |

### Strike Expiration

- Strikes automatically expire after 90 days of safe driving
- Expired strikes are removed from active count
- Strike history remains viewable in Safety Dashboard

### Visibility (Partial - as configured)

Drivers can see:
- Current active strike count
- Days until each strike expires
- General reason for each strike

Drivers cannot see:
- Detailed violation evidence (admin only)
- Reporter information
- Internal investigation notes

---

## Payment Protection

### When Payments Are Held

Payments enter escrow automatically when:
- Route deviation alert is triggered
- Early completion alert is triggered
- SOS button is pressed
- Safety violation dispute is filed

### When Payments Are Voided

Full refund to rider occurs when:
- SOS is pressed during trip
- Confirmed safety violations
- Driver-caused trip cancellation
- Multiple unreported route deviations

### When Payments Are Released to Driver

Payment releases normally when:
- Rider responds "I'm Okay" to alerts
- No disputes filed within 24 hours
- Investigation clears driver of violations

### Dispute Process

1. **Filing Window:** 24 hours after trip completion
2. **Evidence Submission:** Both parties may submit evidence
3. **Platform Review:** Within 48 hours
4. **Decision:** Refund, partial refund, or release to driver
5. **Appeal:** Available within 7 days of decision

---

## Driver Safety Dashboard

### Metrics Displayed

1. **Safety Rating:** 1-5 stars based on rider safety ratings
2. **Route Adherence Score:** Percentage of trips with no deviations
3. **Speed Compliance Score:** Percentage of trips with no speed violations
4. **Safe Trip Streak:** Consecutive trips without violations

### Strike Information

- Active strike count (X/3)
- Days until each strike expires
- Strike type and general reason
- Appeal button for each active strike

### Tips for Improvement

- Personalized recommendations based on violation patterns
- Best practices for maintaining high safety scores
- Links to safety policy documentation

---

## Rider Safety Tools

### Pre-Trip Information

Before accepting a ride, riders can view:
- Driver's safety rating
- Route adherence score
- Total trips completed
- Time as Drift driver

### During Trip

- **Speed Monitor:** Real-time speed and limit display
- **Route Tracking:** Visual route on map
- **SOS Button:** Always visible emergency button
- **Quick Messages:** Pre-set safety messages to driver
- **Trip Sharing:** Share trip with emergency contacts

### Post-Trip

- **Safety Rating:** Rate driver on safety (1-5 stars)
- **Report Violations:** File safety concerns
- **Dispute Payment:** Challenge charges if needed

---

## User Responsibilities

### For Riders

1. **Set Up Emergency Contacts:** Add at least one emergency contact
2. **Respond to Alerts:** Answer safety alerts promptly
3. **Report Genuine Concerns:** Only report actual safety issues
4. **Use SOS Appropriately:** Reserve for true emergencies
5. **Provide Accurate Info:** Correct pickup/destination locations

### For Drivers

1. **Follow Traffic Laws:** Obey all speed limits and traffic rules
2. **Stay on Route:** Follow planned route or communicate changes
3. **Complete at Destination:** End trips at correct location
4. **Maintain Vehicle:** Keep vehicle in safe operating condition
5. **Current Documentation:** Valid license, insurance, registration
6. **Professional Conduct:** Respectful, appropriate behavior

---

## Appeals Process

### Eligibility

Appeals may be submitted for:
- Safety strikes
- Temporary suspensions
- Payment disputes
- Account flags

### Submission Requirements

1. Submit within 7 days of decision
2. Provide detailed explanation
3. Include supporting evidence (optional but recommended)
4. Be truthful and accurate

### Review Process

1. **Initial Review:** Within 48 hours
2. **Investigation:** Evidence and data analysis
3. **Decision:** Approve, deny, or request more information
4. **Notification:** Email and in-app notification

### Secondary Appeal

If initial appeal is denied:
- One additional appeal allowed
- Must include new evidence or information
- Final decision within 72 hours

---

## Data & Privacy

### Safety Data Collected

- GPS location during trips
- Speed and route data
- Emergency alert triggers
- Safety ratings and reports

### Data Retention

- Trip safety data: 2 years
- Strike records: 3 years
- Emergency alerts: 5 years
- Dispute records: 3 years

### Data Access

- Users can request their safety data
- Data shared with authorities when legally required
- Anonymized data may be used for safety improvements

---

## Contact & Support

### Safety Emergencies

- **During Trip:** Use SOS button
- **Immediate Danger:** Call 911 directly

### Safety Concerns

- **In-App:** Support > Safety Concern
- **Email:** safety@drift-global.com
- **Phone:** Available in app

### Appeal Submissions

- **In-App:** Safety Dashboard > Appeal Strike
- **Email:** appeals@drift-global.com

---

## Policy Updates

This policy may be updated periodically. Users will be notified of significant changes via:
- In-app notification
- Email notification
- Required acknowledgment for continued platform use

**Last Updated:** December 2024
**Version:** 1.0
