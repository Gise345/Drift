# 👨‍💼 DRIFT ADMIN - SETUP & ACCESS GUIDE

## 🔐 **HOW TO CREATE ADMIN USERS**

### **Method 1: Firebase Console (Recommended)**

1. **Sign in to Firebase Console**: https://console.firebase.google.com
2. **Select your Drift project**
3. **Navigate to**: Firestore Database
4. **Find the `users` collection**
5. **Locate the user document** you want to make admin
6. **Click on the document ID**
7. **Add/Edit the `roles` field**:
   ```javascript
   roles: ["RIDER", "ADMIN"]  // or ["DRIVER", "ADMIN"] or all three
   ```
8. **Click "Update"**
9. **Done!** User now has admin access

### **Method 2: Using Firebase Admin SDK (For Production)**

Create a Cloud Function:

```javascript
// functions/src/index.ts
import * as admin from 'firebase-admin';

export const addAdminRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an existing admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can add admin roles'
    );
  }

  const userId = data.userId;

  // Update user document
  await admin.firestore().collection('users').doc(userId).update({
    roles: admin.firestore.FieldValue.arrayUnion('ADMIN')
  });

  return { message: `Admin role added to user ${userId}` };
});
```

---

## 🎯 **ADMIN SCREEN LOCATIONS**

### **1. Admin Dashboard**
- **Route**: `/(admin)/index`
- **URL**: `http://localhost:8081/(admin)`
- **Features**:
  - Overview stats (pending apps, active drivers, total riders)
  - Quick navigation to all admin sections
  - Pending application badges

### **2. Pending Driver Applications**
- **Route**: `/(admin)/drivers/pending`
- **Access**: Click "Driver Applications" on dashboard
- **Features**:
  - List of all drivers with `registrationStatus: 'pending'`
  - Shows: Name, Email, Phone, Vehicle, Submission Date
  - Pull to refresh
  - Click any driver to review

### **3. Driver Application Review**
- **Route**: `/(admin)/drivers/review/[driverId]`
- **Access**: Click any driver from pending list
- **Features**:
  - **View All Info**:
    - Personal information
    - Vehicle details with photos (5 images)
    - Documents (license, insurance, registration, inspection)
    - Bank details (masked for security)
    - Background check status

  - **Actions**:
    - ✅ **Approve Button**:
      - Confirms with dialog
      - Updates `registrationStatus` to 'approved'
      - Sets `reviewedAt` timestamp
      - Sets `reviewedBy` to admin user ID
      - Changes driver `status` to 'active'

    - ❌ **Reject Button**:
      - Prompts for rejection reason
      - Updates `registrationStatus` to 'rejected'
      - Saves rejection reason
      - Sets `reviewedAt` and `reviewedBy`

---

## 🔍 **ADMIN PERMISSIONS (Firestore Rules)**

### **What Admins Can Do**:

```javascript
// Firestore Rules (already deployed)
match /drivers/{driverId} {
  // Admins can create/update ANY driver profile
  allow create, update: if isAdmin();

  // Admins can read all driver profiles
  allow read: if isSignedIn();
}

match /users/{userId} {
  // Admins can read all user profiles
  allow read: if isSignedIn();
}

match /trips/{tripId} {
  // Admins can read all trips
  allow read: if isSignedIn();

  // Admins can update trips (for support)
  allow update: if isAdmin();
}
```

### **Helper Function**:
```javascript
function isAdmin() {
  return hasRole('ADMIN');
}

function hasRole(role) {
  return isSignedIn() &&
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid))
         .data.keys().hasAny(['roles']) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid))
         .data.roles.hasAny([role]);
}
```

---

## 📱 **HOW TO ACCESS ADMIN PANEL**

### **Web App**:
1. Sign in with admin account
2. Navigate to: `http://localhost:8081/(admin)`
3. Or navigate directly to pending: `http://localhost:8081/(admin)/drivers/pending`

### **Mobile App**:
1. Sign in with admin account
2. Add admin navigation button to app
3. Or deep link: `drift://admin`

### **Quick Access Code** (Add to rider/driver menu):

```typescript
// In app/(rider)/profile.tsx or app/(driver)/tabs/menu.tsx
import { useAuthStore } from '@/src/stores/auth-store';

const { user } = useAuthStore();
const isAdmin = user?.roles?.includes('ADMIN');

{isAdmin && (
  <TouchableOpacity
    style={styles.adminButton}
    onPress={() => router.push('/(admin)')}
  >
    <Ionicons name="shield" size={20} color={Colors.primary} />
    <Text style={styles.adminText}>Admin Panel</Text>
  </TouchableOpacity>
)}
```

---

## ✅ **ADMIN WORKFLOW**

### **Daily Routine**:

1. **Sign In**: Access admin panel
2. **Check Dashboard**: Review pending count
3. **Review Applications**:
   - Click "Driver Applications"
   - Review each pending driver
4. **Approve/Reject**:
   - Thoroughly review all documents
   - Check vehicle photos
   - Verify insurance expiry
   - Approve if everything valid
   - Reject with clear reason if issues found
5. **Monitor Active Drivers**: (Future feature)
   - View driver stats
   - Handle support tickets
   - Review complaints

---

## 🎨 **ADMIN PANEL FEATURES**

### **Current Features** (v1.0):
- ✅ View pending driver applications
- ✅ Review complete driver profile
- ✅ View all uploaded documents/photos
- ✅ Approve drivers
- ✅ Reject drivers with reason
- ✅ Real-time Firebase updates
- ✅ Pull to refresh

### **Planned Features** (Future):
- 📊 Analytics dashboard
- 🚗 Active drivers management
- 💰 Payouts & earnings review
- 🎫 Trip history & disputes
- ⚠️ Safety & compliance
- 📧 Notifications to drivers
- 📱 Push notifications for new applications

---

## 🐛 **TROUBLESHOOTING**

### **"You don't have permission"**
- **Cause**: User doesn't have ADMIN role
- **Fix**: Add "ADMIN" to user's roles array in Firestore

### **"Admin panel not found"**
- **Cause**: Route not registered
- **Fix**: Verify `app/(admin)/_layout.tsx` exists

### **"Can't approve driver"**
- **Cause**: Firestore rules not deployed
- **Fix**: Run `firebase deploy --only firestore:rules`

### **"Driver still shows in pending list after approval"**
- **Cause**: Frontend cache
- **Fix**: Pull to refresh the list

---

## 📊 **FIREBASE QUERIES FOR ADMINS**

### **Get All Pending Drivers**:
```javascript
const pendingDrivers = await firestore()
  .collection('drivers')
  .where('registrationStatus', '==', 'pending')
  .orderBy('submittedAt', 'desc')
  .get();
```

### **Get Driver by ID**:
```javascript
const driverDoc = await firestore()
  .collection('drivers')
  .doc(driverId)
  .get();
```

### **Update Driver Status**:
```javascript
await firestore()
  .collection('drivers')
  .doc(driverId)
  .update({
    registrationStatus: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminUserId,
    status: 'active'
  });
```

---

## 👥 **RECOMMENDED ADMIN ACCOUNTS**

For production, create separate admin accounts:

1. **Super Admin** (Owner)
   - Full access to everything
   - Can add/remove other admins
   - Email: admin@drift.ky

2. **Operations Admin**
   - Approve/reject drivers
   - Handle support tickets
   - Email: ops@drift.ky

3. **Finance Admin**
   - View earnings
   - Process payouts
   - Email: finance@drift.ky

4. **Support Admin**
   - Read-only access
   - Can view trips/drivers
   - Email: support@drift.ky

---

## 🔒 **SECURITY BEST PRACTICES**

1. ✅ **Never share admin credentials**
2. ✅ **Use strong passwords** (12+ characters)
3. ✅ **Enable 2FA** on Firebase Console
4. ✅ **Audit admin actions** (log all approvals/rejections)
5. ✅ **Limit admin access** (only give to trusted team members)
6. ✅ **Review security rules** regularly
7. ✅ **Monitor Firebase usage** for suspicious activity

---

**ADMIN PANEL IS READY TO USE!** 🎉

Access it now at: `/(admin)`
