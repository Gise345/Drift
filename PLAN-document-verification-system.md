# Document Verification System - Implementation Plan

## Overview
Build a comprehensive document verification system that allows admins to:
1. Approve/reject individual document sections (not just the whole application)
2. Provide specific rejection reasons per document
3. Allow drivers to resubmit only rejected sections (not redo entire application)
4. Send real-time notifications to drivers when document status changes

---

## Current State Analysis

### What Exists:
- **Admin Review Screen** (`app/(admin)/drivers/review/[driverId].tsx`): Shows driver info and documents but only has "Approve All" or "Reject All" buttons
- **Driver Registration Service** (`src/services/driver-registration.service.ts`): Has `updateDocumentStatus()` function that can update individual documents - but it's not used in the admin UI
- **Firestore Schema**: Documents already have individual status fields (`pending`, `approved`, `rejected`) and `rejectionReason` fields
- **Pending Approval Screen** (`app/(driver)/registration/pending-approval.tsx`): Static screen with no real-time updates

### What's Missing:
1. Admin UI to approve/reject individual documents
2. Driver notification when document status changes
3. Driver screen to see which documents need resubmission
4. Driver ability to resubmit individual documents
5. Push notification and email integration for status changes

---

## Implementation Plan

### Phase 1: Enhance Admin Panel Document Review UI

**File: `app/(admin)/drivers/review/[driverId].tsx`**

Modify the `DocumentCard` component to include:
- Individual "Approve" and "Reject" buttons per document
- Modal for rejection reason input
- Visual status indicators (pending/approved/rejected)
- Ability to view document images in fullscreen

**Changes:**
```
1. Add state for tracking individual document verification
2. Create DocumentVerificationCard component with:
   - Document preview (expandable)
   - Approve button (green checkmark)
   - Reject button (red X) - opens modal for reason
   - Status badge showing current state
3. Replace "Approve/Reject All" with "Finalize Application" button
   - Only enabled when ALL required documents are approved
   - Rejected documents must be resubmitted by driver
4. Add "Request Resubmission" action that sets overall status to "needs_resubmission"
```

### Phase 2: Create Cloud Function for Document Status Notifications

**File: `functions/src/documentVerification.ts`**

Create a Firestore trigger that:
1. Listens to `drivers/{driverId}` document updates
2. Detects changes in `documents.*.status` fields
3. Sends push notification to driver when:
   - A document is approved
   - A document is rejected (includes reason)
   - All documents approved (application complete)
4. Sends email via SendGrid/existing email service

**Notification Content:**
- **Approved**: "Great news! Your [Document Type] has been verified."
- **Rejected**: "Action required: Your [Document Type] needs to be resubmitted. Reason: [reason]"
- **All Approved**: "Congratulations! Your driver application has been approved. You can now start driving!"

### Phase 3: Update Firestore Schema

**Collection: `drivers/{driverId}`**

Add new fields:
```typescript
{
  // Existing fields...

  // NEW: Track overall document verification status
  documentVerificationStatus: 'pending' | 'in_review' | 'needs_resubmission' | 'all_verified',

  // NEW: Track which documents need resubmission
  documentsNeedingResubmission: string[], // e.g., ['driversLicense', 'insurance']

  // NEW: Verification history for audit trail
  verificationHistory: [
    {
      documentType: string,
      action: 'approved' | 'rejected',
      reason?: string,
      adminId: string,
      timestamp: Date
    }
  ],

  // Existing document structure enhanced:
  documents: {
    driversLicense: {
      status: 'pending' | 'approved' | 'rejected' | 'resubmitted',
      uploadedAt: Date,
      verifiedAt?: Date,
      verifiedBy?: string, // Admin ID
      rejectionReason?: string,
      resubmissionCount: number, // Track how many times resubmitted
      previousVersions?: string[] // URLs to previous uploads
    },
    // ... same for other documents
  }
}
```

### Phase 4: Create Driver Document Resubmission Flow

**New File: `app/(driver)/registration/resubmit-documents.tsx`**

Screen that shows:
1. List of all documents with their current status
2. Clear indication of which documents need resubmission
3. Rejection reason for each rejected document
4. Upload button for each rejected document
5. Submit button to send resubmissions for review

**Navigation Flow:**
- Driver gets push notification about rejected document
- Tapping notification opens the app to resubmission screen
- Driver uploads corrected document
- Status changes to "resubmitted" (pending re-review)

### Phase 5: Create Real-Time Application Status Tracker

**Enhance: `app/(driver)/registration/pending-approval.tsx`**

Transform from static page to real-time tracker:
1. Subscribe to driver document using Firestore listener
2. Show individual document statuses with visual indicators:
   - ⏳ Pending review
   - ✅ Approved
   - ❌ Rejected (with reason and "Resubmit" button)
   - 🔄 Resubmitted (awaiting re-review)
3. Progress indicator showing overall application status
4. "Resubmit Documents" button when any document is rejected

### Phase 6: Email Notifications

**Enhance: `functions/src/emails/` or create new**

Email templates for:
1. **Document Approved**: Simple confirmation
2. **Document Rejected**:
   - Which document
   - Rejection reason
   - Link/instructions to resubmit
3. **All Documents Approved**:
   - Congratulations message
   - Next steps to start driving
   - Link to download driver app/open driver mode

---

## File Changes Summary

### New Files:
1. `functions/src/documentVerification.ts` - Cloud Function for notifications
2. `app/(driver)/registration/resubmit-documents.tsx` - Document resubmission screen
3. `functions/src/emails/documentStatusEmail.ts` - Email templates (if not using existing)

### Modified Files:
1. `app/(admin)/drivers/review/[driverId].tsx` - Individual document verification UI
2. `app/(driver)/registration/pending-approval.tsx` - Real-time status tracker
3. `src/services/driver-registration.service.ts` - Add resubmission functions
4. `src/services/notification.service.ts` - Add document status notification types

---

## UI/UX Details

### Admin Document Review Card:
```
┌─────────────────────────────────────────┐
│ Driver's License                    📋  │
│ ─────────────────────────────────────── │
│ [Front Image]        [Back Image]       │
│                                         │
│ Uploaded: Dec 10, 2025                  │
│ Expiry: Mar 15, 2027                    │
│                                         │
│ Status: ⏳ Pending Review               │
│                                         │
│ [✅ Approve]              [❌ Reject]   │
└─────────────────────────────────────────┘
```

### Driver Status Tracker:
```
┌─────────────────────────────────────────┐
│           Application Status            │
│                                         │
│ ✅ Driver's License     Verified        │
│ ❌ Insurance           Rejected         │
│    Reason: Document expired             │
│    [📤 Resubmit]                        │
│ ⏳ Registration        Pending          │
│ ✅ Safety Inspection   Verified         │
│                                         │
│ ─────────────────────────────────────── │
│ 2 of 4 documents verified               │
│ [=========>        ] 50%                │
└─────────────────────────────────────────┘
```

---

## Implementation Order

1. **Phase 1**: Admin UI changes (can be tested immediately)
2. **Phase 3**: Firestore schema updates (needed for other phases)
3. **Phase 2**: Cloud Function for notifications
4. **Phase 5**: Driver real-time status tracker
5. **Phase 4**: Document resubmission flow
6. **Phase 6**: Email notifications

---

## Questions Before Implementation

1. Should drivers be able to see the admin who reviewed their documents?
2. Maximum number of resubmission attempts per document?
3. Should there be a deadline for resubmissions (e.g., 7 days)?
4. Do we want to support partial document uploads (e.g., just front of license)?
