/**
 * User Blocking Service
 *
 * Provides comprehensive user blocking functionality for safety.
 *
 * Features:
 * - Block specific users from future matches
 * - Blocked users cannot see your profile or trip history
 * - System remembers blocks across app reinstalls (stored in Firestore)
 * - Mutual blocking prevents any future interactions
 *
 * Data Structure (Firestore):
 * - Collection: userBlocks
 *   - Document ID: {blockerId}_{blockedId}
 *   - Fields: blockerId, blockedId, blockerType, blockedType, reason, tripId, createdAt
 *
 * - Collection: users/{userId}/blockedUsers (subcollection for quick lookups)
 *   - Document ID: {blockedUserId}
 *   - Fields: blockedAt, reason, tripId
 */

import firestore, {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from '@react-native-firebase/firestore';

// ============================================================================
// Types
// ============================================================================

export type UserType = 'rider' | 'driver';

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  blockerType: UserType;
  blockedType: UserType;
  blockerName?: string;
  blockedName?: string;
  reason?: string;
  reasonType?: BlockReason;
  tripId?: string;
  createdAt: Date;
}

export type BlockReason =
  | 'safety_concern'
  | 'inappropriate_behavior'
  | 'harassment'
  | 'uncomfortable'
  | 'gender_violation'
  | 'other';

export interface BlockUserParams {
  blockerId: string;
  blockedId: string;
  blockerType: UserType;
  blockedType: UserType;
  blockerName?: string;
  blockedName?: string;
  reason?: string;
  reasonType?: BlockReason;
  tripId?: string;
}

// ============================================================================
// Firebase Instance
// ============================================================================

const db = firestore();

// ============================================================================
// Helper to check if document exists
// ============================================================================

function documentExists(docSnapshot: any): boolean {
  if (typeof docSnapshot.exists === 'function') {
    return docSnapshot.exists();
  }
  return docSnapshot.exists as unknown as boolean;
}

// ============================================================================
// Core Blocking Functions
// ============================================================================

/**
 * Block a user - Creates mutual block records
 * This ensures neither party can see or interact with the other
 */
export async function blockUser(params: BlockUserParams): Promise<boolean> {
  const {
    blockerId,
    blockedId,
    blockerType,
    blockedType,
    blockerName,
    blockedName,
    reason,
    reasonType,
    tripId,
  } = params;

  if (!blockerId || !blockedId) {
    console.error('❌ BlockUser: Missing required IDs');
    throw new Error('Both blocker and blocked user IDs are required');
  }

  if (blockerId === blockedId) {
    console.error('❌ BlockUser: Cannot block yourself');
    throw new Error('You cannot block yourself');
  }

  try {
    console.log(`🚫 Blocking user: ${blockedId} by ${blockerId}`);

    const batch = db.batch();
    const timestamp = serverTimestamp();

    // Create primary block record ID (blocker -> blocked)
    const blockRecordId = `${blockerId}_${blockedId}`;
    const blockRecordRef = doc(db, 'userBlocks', blockRecordId);

    // Create block record in main collection
    batch.set(blockRecordRef, {
      blockerId,
      blockedId,
      blockerType,
      blockedType,
      blockerName: blockerName || null,
      blockedName: blockedName || null,
      reason: reason || null,
      reasonType: reasonType || 'other',
      tripId: tripId || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Add to blocker's blockedUsers subcollection for quick lookups
    const blockerSubcollectionRef = doc(db, 'users', blockerId, 'blockedUsers', blockedId);
    batch.set(blockerSubcollectionRef, {
      blockedId,
      blockedName: blockedName || null,
      blockedType,
      reason: reason || null,
      reasonType: reasonType || 'other',
      tripId: tripId || null,
      blockedAt: timestamp,
    });

    // Add blocker to blocked user's blockedByUsers subcollection
    // This allows the blocked user to know they're blocked (for filtering)
    const blockedBySubcollectionRef = doc(db, 'users', blockedId, 'blockedByUsers', blockerId);
    batch.set(blockedBySubcollectionRef, {
      blockerId,
      blockerName: blockerName || null,
      blockerType,
      blockedAt: timestamp,
    });

    await batch.commit();

    console.log(`✅ Successfully blocked user ${blockedId}`);
    return true;
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    throw error;
  }
}

/**
 * Unblock a user - Removes all block records
 */
export async function unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
  if (!blockerId || !blockedId) {
    throw new Error('Both blocker and blocked user IDs are required');
  }

  try {
    console.log(`🔓 Unblocking user: ${blockedId} by ${blockerId}`);

    const batch = db.batch();

    // Delete main block record
    const blockRecordId = `${blockerId}_${blockedId}`;
    const blockRecordRef = doc(db, 'userBlocks', blockRecordId);
    batch.delete(blockRecordRef);

    // Delete from blocker's blockedUsers subcollection
    const blockerSubcollectionRef = doc(db, 'users', blockerId, 'blockedUsers', blockedId);
    batch.delete(blockerSubcollectionRef);

    // Delete from blocked user's blockedByUsers subcollection
    const blockedBySubcollectionRef = doc(db, 'users', blockedId, 'blockedByUsers', blockerId);
    batch.delete(blockedBySubcollectionRef);

    await batch.commit();

    console.log(`✅ Successfully unblocked user ${blockedId}`);
    return true;
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    throw error;
  }
}

/**
 * Check if a user is blocked by another user
 */
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  if (!blockerId || !blockedId) return false;

  try {
    const blockRecordRef = doc(db, 'users', blockerId, 'blockedUsers', blockedId);
    const blockDoc = await getDoc(blockRecordRef);
    return documentExists(blockDoc);
  } catch (error) {
    console.error('❌ Error checking block status:', error);
    return false;
  }
}

/**
 * Check if there's a mutual block between two users
 * Returns true if either user has blocked the other
 */
export async function hasMutualBlock(userId1: string, userId2: string): Promise<boolean> {
  if (!userId1 || !userId2) return false;

  try {
    // Check if user1 blocked user2
    const block1Ref = doc(db, 'users', userId1, 'blockedUsers', userId2);
    const block1Doc = await getDoc(block1Ref);
    if (documentExists(block1Doc)) return true;

    // Check if user2 blocked user1
    const block2Ref = doc(db, 'users', userId2, 'blockedUsers', userId1);
    const block2Doc = await getDoc(block2Ref);
    if (documentExists(block2Doc)) return true;

    return false;
  } catch (error) {
    console.error('❌ Error checking mutual block:', error);
    return false;
  }
}

/**
 * Get all users blocked by a specific user
 */
export async function getBlockedUsers(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const blockedUsersRef = collection(db, 'users', userId, 'blockedUsers');
    const snapshot = await getDocs(blockedUsersRef);

    const blockedIds: string[] = [];
    snapshot.forEach((doc) => {
      blockedIds.push(doc.id);
    });

    return blockedIds;
  } catch (error) {
    console.error('❌ Error getting blocked users:', error);
    return [];
  }
}

/**
 * Get all users who have blocked a specific user
 */
export async function getBlockedByUsers(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const blockedByUsersRef = collection(db, 'users', userId, 'blockedByUsers');
    const snapshot = await getDocs(blockedByUsersRef);

    const blockerIds: string[] = [];
    snapshot.forEach((doc) => {
      blockerIds.push(doc.id);
    });

    return blockerIds;
  } catch (error) {
    console.error('❌ Error getting blocked by users:', error);
    return [];
  }
}

/**
 * Get complete block list for a user (both blocked and blocked by)
 * Used for filtering in ride matching
 */
export async function getCompleteBlockList(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const [blockedUsers, blockedByUsers] = await Promise.all([
      getBlockedUsers(userId),
      getBlockedByUsers(userId),
    ]);

    // Combine and deduplicate
    const allBlocked = new Set([...blockedUsers, ...blockedByUsers]);
    return Array.from(allBlocked);
  } catch (error) {
    console.error('❌ Error getting complete block list:', error);
    return [];
  }
}

/**
 * Get detailed block records for a user
 */
export async function getBlockRecords(userId: string): Promise<BlockRecord[]> {
  if (!userId) return [];

  try {
    const blockedUsersRef = collection(db, 'users', userId, 'blockedUsers');
    const snapshot = await getDocs(blockedUsersRef);

    const records: BlockRecord[] = [];
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      records.push({
        id: docSnapshot.id,
        blockerId: userId,
        blockedId: data.blockedId,
        blockerType: 'rider', // Default, can be updated based on actual type
        blockedType: data.blockedType || 'driver',
        blockedName: data.blockedName,
        reason: data.reason,
        reasonType: data.reasonType,
        tripId: data.tripId,
        createdAt: data.blockedAt?.toDate?.() || new Date(),
      });
    });

    return records;
  } catch (error) {
    console.error('❌ Error getting block records:', error);
    return [];
  }
}

// ============================================================================
// Block Reason Labels
// ============================================================================

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  safety_concern: 'Safety concern',
  inappropriate_behavior: 'Inappropriate behavior',
  harassment: 'Harassment',
  uncomfortable: 'Made me feel uncomfortable',
  gender_violation: 'Gender safety violation',
  other: 'Other reason',
};

// ============================================================================
// Export
// ============================================================================

export default {
  blockUser,
  unblockUser,
  isUserBlocked,
  hasMutualBlock,
  getBlockedUsers,
  getBlockedByUsers,
  getCompleteBlockList,
  getBlockRecords,
  BLOCK_REASON_LABELS,
};
