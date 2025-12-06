/**
 * DRIFT STRIKE & SUSPENSION SERVICE
 * Manages the three-strike system, suspensions, and appeals
 *
 * ✅ UPGRADED TO v23.5.0
 * ✅ Using 'main' database (restored from backup)
 */

import {
  Strike,
  StrikeType,
  StrikeStatus,
  Suspension,
  Appeal,
  ViolationSeverity,
  SafetyServiceResponse,
  DriverSafetyProfile,
  SuspensionStatus,
} from '@/src/types/safety.types';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

// Get Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

/**
 * Helper to check if document exists
 */
function documentExists(docSnapshot: FirebaseFirestoreTypes.DocumentSnapshot): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return (docSnapshot.exists as () => boolean)();
  }
  return docSnapshot.exists as unknown as boolean;
}

// Configuration
const STRIKE_EXPIRATION_DAYS = 30; // 1 month of good driving to remove a strike
const TEMP_SUSPENSION_DAYS = 7;
const MAX_STRIKES_BEFORE_PERM_BAN = 3;
const APPEAL_WINDOW_DAYS = 7;

/**
 * Issue a strike to a driver
 */
export async function issueStrike(
  driverId: string,
  tripId: string,
  type: StrikeType,
  reason: string,
  severity: ViolationSeverity,
  violationId?: string
): Promise<SafetyServiceResponse<Strike>> {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + STRIKE_EXPIRATION_DAYS);

    const strike: Strike = {
      id: `strike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      tripId,
      type,
      reason,
      severity,
      violationId,
      issuedAt: now,
      expiresAt,
      status: 'active',
    };

    // Add strike to Firestore
    const strikeRef = doc(db, 'strikes', strike.id);
    await setDoc(strikeRef, {
      ...strike,
      issuedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    // Update driver's safety profile
    await updateDriverSafetyProfile(driverId);

    // Check if we need to issue a suspension
    const activeStrikes = await getActiveStrikesCount(driverId);

    if (activeStrikes >= MAX_STRIKES_BEFORE_PERM_BAN) {
      await issueSuspension(driverId, 'permanent', 'Accumulated 3 or more strikes', [strike.id]);
    } else if (activeStrikes === 2) {
      await issueSuspension(driverId, 'temporary', 'Second strike issued', [strike.id]);
    }

    // Send notification to driver
    await notifyDriverOfStrike(driverId, strike);

    console.log('Strike issued:', strike.id, 'to driver:', driverId);
    return { success: true, data: strike };
  } catch (error) {
    console.error('Failed to issue strike:', error);
    return {
      success: false,
      error: 'Failed to issue strike',
      code: 'STRIKE_ISSUE_FAILED',
    };
  }
}

/**
 * Get active strikes count for a driver
 */
export async function getActiveStrikesCount(driverId: string): Promise<number> {
  try {
    const now = new Date();
    const strikesRef = collection(db, 'strikes');
    const q = query(
      strikesRef,
      where('driverId', '==', driverId),
      where('status', '==', 'active')
    );
    const strikesSnapshot = await getDocs(q);

    // Filter out expired strikes
    let activeCount = 0;
    strikesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;
      if (expiresAt && new Date(expiresAt) > now) {
        activeCount++;
      }
    });

    return activeCount;
  } catch (error) {
    console.error('Failed to get active strikes count:', error);
    return 0;
  }
}

/**
 * Get all strikes for a driver
 */
export async function getDriverStrikes(
  driverId: string,
  includeExpired: boolean = false
): Promise<Strike[]> {
  try {
    const strikesRef = collection(db, 'strikes');
    let q;

    if (!includeExpired) {
      q = query(
        strikesRef,
        where('driverId', '==', driverId),
        where('status', '==', 'active'),
        orderBy('issuedAt', 'desc')
      );
    } else {
      q = query(
        strikesRef,
        where('driverId', '==', driverId),
        orderBy('issuedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const strikes: Strike[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      strikes.push({
        ...data,
        id: docSnap.id,
        issuedAt: data.issuedAt?.toDate?.() || data.issuedAt,
        expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
        removedAt: data.removedAt?.toDate?.() || data.removedAt,
      } as Strike);
    });

    return strikes;
  } catch (error) {
    console.error('Failed to get driver strikes:', error);
    return [];
  }
}

/**
 * Issue a suspension to a driver
 */
export async function issueSuspension(
  driverId: string,
  type: 'temporary' | 'permanent',
  reason: string,
  strikeIds: string[]
): Promise<SafetyServiceResponse<Suspension>> {
  try {
    const now = new Date();
    let expiresAt: Date | undefined;

    if (type === 'temporary') {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + TEMP_SUSPENSION_DAYS);
    }

    const suspension: Suspension = {
      id: `susp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      type,
      reason,
      strikeIds,
      startedAt: now,
      expiresAt,
      status: 'active',
      acknowledgmentRequired: true,
    };

    // Add suspension to Firestore
    const suspensionRef = doc(db, 'suspensions', suspension.id);
    await setDoc(suspensionRef, {
      ...suspension,
      startedAt: serverTimestamp(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    });

    // Update driver document
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      suspensionStatus: type === 'permanent' ? 'suspended_perm' : 'suspended_temp',
      currentSuspensionId: suspension.id,
      isOnline: false, // Force driver offline
      updatedAt: serverTimestamp(),
    });

    // Send notification
    await notifyDriverOfSuspension(driverId, suspension);

    console.log('Suspension issued:', suspension.id, 'to driver:', driverId);
    return { success: true, data: suspension };
  } catch (error) {
    console.error('Failed to issue suspension:', error);
    return {
      success: false,
      error: 'Failed to issue suspension',
      code: 'SUSPENSION_ISSUE_FAILED',
    };
  }
}

/**
 * Check and lift expired suspensions
 */
export async function checkExpiredSuspensions(): Promise<void> {
  try {
    const now = new Date();
    const suspensionsRef = collection(db, 'suspensions');
    const q = query(
      suspensionsRef,
      where('status', '==', 'active'),
      where('type', '==', 'temporary')
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;

      if (expiresAt && new Date(expiresAt) <= now) {
        await liftSuspension(docSnap.id, 'Suspension period expired');
      }
    }
  } catch (error) {
    console.error('Failed to check expired suspensions:', error);
  }
}

/**
 * Lift a suspension
 */
export async function liftSuspension(
  suspensionId: string,
  reason: string
): Promise<SafetyServiceResponse> {
  try {
    const suspensionRef = doc(db, 'suspensions', suspensionId);
    const suspensionDoc = await getDoc(suspensionRef);

    if (!documentExists(suspensionDoc)) {
      return { success: false, error: 'Suspension not found' };
    }

    const suspension = suspensionDoc.data() as Suspension;

    // Update suspension
    await updateDoc(suspensionRef, {
      status: 'lifted',
      liftedAt: serverTimestamp(),
      liftedReason: reason,
    });

    // Update driver document
    const driverRef = doc(db, 'drivers', suspension.driverId);
    await updateDoc(driverRef, {
      suspensionStatus: 'active',
      currentSuspensionId: null,
      updatedAt: serverTimestamp(),
    });

    // Notify driver
    await notifyDriverSuspensionLifted(suspension.driverId, reason);

    console.log('Suspension lifted:', suspensionId);
    return { success: true };
  } catch (error) {
    console.error('Failed to lift suspension:', error);
    return { success: false, error: 'Failed to lift suspension' };
  }
}

/**
 * Remove a strike (for appeals)
 */
export async function removeStrike(
  strikeId: string,
  reason: string
): Promise<SafetyServiceResponse> {
  try {
    const strikeRef = doc(db, 'strikes', strikeId);
    const strikeDoc = await getDoc(strikeRef);

    if (!documentExists(strikeDoc)) {
      return { success: false, error: 'Strike not found' };
    }

    const strike = strikeDoc.data() as Strike;

    await updateDoc(strikeRef, {
      status: 'removed',
      removedAt: serverTimestamp(),
      removedReason: reason,
    });

    // Update driver safety profile
    await updateDriverSafetyProfile(strike.driverId);

    console.log('Strike removed:', strikeId);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove strike:', error);
    return { success: false, error: 'Failed to remove strike' };
  }
}

/**
 * Submit an appeal
 */
export async function submitAppeal(
  driverId: string,
  strikeId?: string,
  suspensionId?: string,
  reason: string = '',
  evidenceUrls: string[] = []
): Promise<SafetyServiceResponse<Appeal>> {
  try {
    // Check appeal window
    if (strikeId) {
      const strikeRef = doc(db, 'strikes', strikeId);
      const strikeDoc = await getDoc(strikeRef);

      if (documentExists(strikeDoc)) {
        const strike = strikeDoc.data();
        const issuedAt = strike?.issuedAt?.toDate?.() || strike?.issuedAt;
        const daysSinceIssue = Math.floor(
          (Date.now() - new Date(issuedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceIssue > APPEAL_WINDOW_DAYS) {
          return {
            success: false,
            error: `Appeal window has expired. Appeals must be submitted within ${APPEAL_WINDOW_DAYS} days.`,
            code: 'APPEAL_WINDOW_EXPIRED',
          };
        }
      }
    }

    const appeal: Appeal = {
      id: `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      strikeId,
      suspensionId,
      reason,
      evidence: evidenceUrls.map((url) => ({
        type: 'photo' as const,
        url,
        timestamp: new Date(),
      })),
      submittedAt: new Date(),
      status: 'pending',
    };

    const appealRef = doc(db, 'appeals', appeal.id);
    await setDoc(appealRef, {
      ...appeal,
      submittedAt: serverTimestamp(),
    });

    // Update strike status if applicable
    if (strikeId) {
      const strikeRef = doc(db, 'strikes', strikeId);
      await updateDoc(strikeRef, {
        status: 'appealed',
        appealId: appeal.id,
      });
    }

    console.log('Appeal submitted:', appeal.id);
    return { success: true, data: appeal };
  } catch (error) {
    console.error('Failed to submit appeal:', error);
    return {
      success: false,
      error: 'Failed to submit appeal',
      code: 'APPEAL_SUBMIT_FAILED',
    };
  }
}

/**
 * Get driver's appeals
 */
export async function getDriverAppeals(driverId: string): Promise<Appeal[]> {
  try {
    const appealsRef = collection(db, 'appeals');
    const q = query(
      appealsRef,
      where('driverId', '==', driverId),
      orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    const appeals: Appeal[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      appeals.push({
        ...data,
        id: docSnap.id,
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt,
        reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
      } as Appeal);
    });

    return appeals;
  } catch (error) {
    console.error('Failed to get driver appeals:', error);
    return [];
  }
}

/**
 * Review an appeal (admin function)
 */
export async function reviewAppeal(
  appealId: string,
  reviewerId: string,
  decision: 'approved' | 'denied',
  resolution: string
): Promise<SafetyServiceResponse> {
  try {
    const appealRef = doc(db, 'appeals', appealId);
    const appealDoc = await getDoc(appealRef);

    if (!documentExists(appealDoc)) {
      return { success: false, error: 'Appeal not found' };
    }

    const appeal = appealDoc.data() as Appeal;

    // Update appeal
    await updateDoc(appealRef, {
      status: decision,
      reviewedBy: reviewerId,
      reviewedAt: serverTimestamp(),
      resolution,
    });

    // If approved, handle strike/suspension removal
    if (decision === 'approved') {
      if (appeal.strikeId) {
        await removeStrike(appeal.strikeId, `Appeal approved: ${resolution}`);
      }
      if (appeal.suspensionId) {
        await liftSuspension(appeal.suspensionId, `Appeal approved: ${resolution}`);
      }
    } else {
      // If denied and was a strike appeal, restore strike status
      if (appeal.strikeId) {
        const strikeRef = doc(db, 'strikes', appeal.strikeId);
        await updateDoc(strikeRef, {
          status: 'active',
        });
      }
    }

    // Notify driver
    await notifyDriverAppealResult(appeal.driverId, decision, resolution);

    console.log('Appeal reviewed:', appealId, 'Decision:', decision);
    return { success: true };
  } catch (error) {
    console.error('Failed to review appeal:', error);
    return { success: false, error: 'Failed to review appeal' };
  }
}

/**
 * Update driver safety profile
 */
export async function updateDriverSafetyProfile(
  driverId: string
): Promise<SafetyServiceResponse<DriverSafetyProfile>> {
  try {
    const strikes = await getDriverStrikes(driverId, true);
    const activeStrikes = strikes.filter(
      (s) => s.status === 'active' && new Date(s.expiresAt) > new Date()
    );

    // Get current suspension if any
    const suspensionsRef = collection(db, 'suspensions');
    const suspensionQuery = query(
      suspensionsRef,
      where('driverId', '==', driverId),
      where('status', '==', 'active'),
      limit(1)
    );
    const suspensionSnapshot = await getDocs(suspensionQuery);

    let currentSuspension: Suspension | undefined;
    let suspensionStatus: SuspensionStatus = 'active';

    if (!suspensionSnapshot.empty) {
      const data = suspensionSnapshot.docs[0].data();
      currentSuspension = {
        ...data,
        id: suspensionSnapshot.docs[0].id,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
      } as Suspension;
      suspensionStatus = currentSuspension.type === 'permanent'
        ? 'suspended_perm'
        : 'suspended_temp';
    }

    // Get safety ratings
    const ratingsRef = collection(db, 'safety_ratings');
    const ratingsQuery = query(
      ratingsRef,
      where('driverId', '==', driverId)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);

    let safetyRating = 5.0;
    let totalSafetyRatings = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!ratingsSnapshot.empty) {
      let totalScore = 0;
      ratingsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const score = data.overallSafetyScore || 5;
        totalScore += score;
        totalSafetyRatings++;
        ratingDistribution[score as 1 | 2 | 3 | 4 | 5]++;
      });
      safetyRating = totalSafetyRatings > 0 ? totalScore / totalSafetyRatings : 5.0;
    }

    // Calculate route adherence and speed compliance (from trip data)
    const tripsRef = collection(db, 'trips');
    const tripsQuery = query(
      tripsRef,
      where('driverId', '==', driverId),
      where('status', '==', 'COMPLETED'),
      orderBy('completedAt', 'desc'),
      limit(100)
    );
    const tripsSnapshot = await getDocs(tripsQuery);

    let tripsWithNoDeviations = 0;
    let tripsWithNoSpeedViolations = 0;
    let totalTrips = tripsSnapshot.size;
    let safeTripsStreak = 0;
    let lastViolation: Date | undefined;

    tripsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const hasDeviations = (data.safetyData?.routeDeviations?.length || 0) > 0;
      const hasSpeedViolations = (data.safetyData?.speedViolations?.length || 0) > 0;

      if (!hasDeviations) tripsWithNoDeviations++;
      if (!hasSpeedViolations) tripsWithNoSpeedViolations++;

      if (!hasDeviations && !hasSpeedViolations) {
        if (!lastViolation) safeTripsStreak++;
      } else {
        if (!lastViolation) {
          lastViolation = data.completedAt?.toDate?.() || data.completedAt;
        }
      }
    });

    const routeAdherenceScore = totalTrips > 0
      ? (tripsWithNoDeviations / totalTrips) * 100
      : 100;
    const speedComplianceScore = totalTrips > 0
      ? (tripsWithNoSpeedViolations / totalTrips) * 100
      : 100;

    const profile: DriverSafetyProfile = {
      driverId,
      safetyRating: Math.round(safetyRating * 10) / 10,
      totalSafetyRatings,
      ratingDistribution,
      routeAdherenceScore: Math.round(routeAdherenceScore),
      speedComplianceScore: Math.round(speedComplianceScore),
      strikes: activeStrikes,
      activeStrikes: activeStrikes.length,
      suspensionStatus,
      currentSuspension,
      badges: [], // Calculate badges separately
      lastViolation,
      safeTripsStreak,
    };

    // Update in Firestore
    const profileRef = doc(db, 'driver_safety_profiles', driverId);
    await setDoc(profileRef, profile, { merge: true });

    return { success: true, data: profile };
  } catch (error) {
    console.error('Failed to update driver safety profile:', error);
    return {
      success: false,
      error: 'Failed to update safety profile',
    };
  }
}

/**
 * Get driver safety profile
 */
export async function getDriverSafetyProfile(
  driverId: string
): Promise<DriverSafetyProfile | null> {
  try {
    const profileRef = doc(db, 'driver_safety_profiles', driverId);
    const profileDoc = await getDoc(profileRef);

    if (!documentExists(profileDoc)) {
      // Create a default profile
      const result = await updateDriverSafetyProfile(driverId);
      return result.data || null;
    }

    return profileDoc.data() as DriverSafetyProfile;
  } catch (error) {
    console.error('Failed to get driver safety profile:', error);
    return null;
  }
}

/**
 * Check if driver can go online
 */
export async function canDriverGoOnline(driverId: string): Promise<{
  canGoOnline: boolean;
  reason?: string;
  suspension?: Suspension;
}> {
  try {
    // Check for active suspension
    const suspensionsRef = collection(db, 'suspensions');
    const q = query(
      suspensionsRef,
      where('driverId', '==', driverId),
      where('status', '==', 'active'),
      limit(1)
    );
    const suspensionSnapshot = await getDocs(q);

    if (!suspensionSnapshot.empty) {
      const data = suspensionSnapshot.docs[0].data();
      const suspension: Suspension = {
        ...data,
        id: suspensionSnapshot.docs[0].id,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
      } as Suspension;

      return {
        canGoOnline: false,
        reason: suspension.type === 'permanent'
          ? 'Your account has been permanently suspended.'
          : `Your account is temporarily suspended until ${suspension.expiresAt?.toLocaleDateString()}.`,
        suspension,
      };
    }

    return { canGoOnline: true };
  } catch (error) {
    console.error('Failed to check if driver can go online:', error);
    return { canGoOnline: true }; // Default to allowing if check fails
  }
}

/**
 * Expire old strikes (run periodically)
 */
export async function expireOldStrikes(): Promise<void> {
  try {
    const now = new Date();
    const strikesRef = collection(db, 'strikes');
    const q = query(
      strikesRef,
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    let expiredCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const expiresAt = data.expiresAt?.toDate?.() || data.expiresAt;

      if (expiresAt && new Date(expiresAt) <= now) {
        const strikeRef = doc(db, 'strikes', docSnap.id);
        batch.update(strikeRef, { status: 'expired' });
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`Expired ${expiredCount} strikes`);
    }
  } catch (error) {
    console.error('Failed to expire old strikes:', error);
  }
}

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================

async function notifyDriverOfStrike(driverId: string, strike: Strike): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: driverId,
      type: 'safety_strike',
      title: 'Safety Strike Issued',
      message: `You have received a safety strike: ${strike.reason}`,
      data: {
        strikeId: strike.id,
        type: strike.type,
        severity: strike.severity,
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify driver of strike:', error);
  }
}

async function notifyDriverOfSuspension(
  driverId: string,
  suspension: Suspension
): Promise<void> {
  try {
    const title = suspension.type === 'permanent'
      ? 'Account Permanently Suspended'
      : 'Account Temporarily Suspended';

    const message = suspension.type === 'permanent'
      ? 'Your driver account has been permanently suspended due to safety violations.'
      : `Your driver account has been suspended for ${TEMP_SUSPENSION_DAYS} days due to safety violations.`;

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: driverId,
      type: 'suspension',
      title,
      message,
      data: {
        suspensionId: suspension.id,
        type: suspension.type,
        expiresAt: suspension.expiresAt?.toISOString(),
      },
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify driver of suspension:', error);
  }
}

async function notifyDriverSuspensionLifted(
  driverId: string,
  reason: string
): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: driverId,
      type: 'suspension_lifted',
      title: 'Suspension Lifted',
      message: `Your account suspension has been lifted. ${reason}`,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify driver of suspension lift:', error);
  }
}

async function notifyDriverAppealResult(
  driverId: string,
  decision: 'approved' | 'denied',
  resolution: string
): Promise<void> {
  try {
    const title = decision === 'approved'
      ? 'Appeal Approved'
      : 'Appeal Denied';

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: driverId,
      type: 'appeal_result',
      title,
      message: resolution,
      data: { decision },
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to notify driver of appeal result:', error);
  }
}

// Export constants
export const STRIKE_CONSTANTS = {
  STRIKE_EXPIRATION_DAYS,
  TEMP_SUSPENSION_DAYS,
  MAX_STRIKES_BEFORE_PERM_BAN,
  APPEAL_WINDOW_DAYS,
};
