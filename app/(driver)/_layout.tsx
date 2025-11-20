import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * DRIVER LAYOUT - UPDATED WITH NEW TABS INTERFACE
 *
 * Complete navigation structure for the Drift driver app
 *
 * CRITICAL CHANGE: Main interface now uses tabs instead of dashboard/home
 * - tabs/ contains: Home (Map), Earnings, Inbox, Menu
 * - All other screens accessible via navigation
 *
 * REQUIRES AUTHENTICATION - Redirects to welcome if not logged in
 *
 * EXPO SDK 52 Compatible
 */
export default function DriverLayout() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Auth guard - redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome');
    }
  }, [user]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      {/* ==================== MAIN INTERFACE: TABS (4 screens) ==================== */}
      {/* 
        ⭐ CRITICAL: This "tabs" screen is the main driver interface ⭐
        Contains: Home (Map), Earnings, Inbox, Menu with bottom tab navigation
        Location: app/(driver)/tabs/_layout.tsx
        
        This replaces the old dashboard/home as the main entry point
      */}
      <Stack.Screen 
        name="tabs" 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back from main tabs
        }}
      />
      
      {/* ==================== PHASE 1: REGISTRATION (15 screens) ==================== */}
      <Stack.Screen name="registration/welcome" />
      <Stack.Screen name="registration/legal-consent" />
      <Stack.Screen name="registration/personal-info" />
      <Stack.Screen name="registration/vehicle-info" />
      <Stack.Screen name="registration/vehicle-photos" />
      <Stack.Screen name="registration/drivers-license" />
      <Stack.Screen name="registration/insurance" />
      <Stack.Screen name="registration/registration-cert" />
      <Stack.Screen name="registration/inspection" />
      <Stack.Screen name="registration/background-check" />
      <Stack.Screen name="registration/bank-details" />
      <Stack.Screen name="registration/review-application" />
      <Stack.Screen name="registration/pending-approval" />
      <Stack.Screen name="registration/approved" />
      <Stack.Screen name="registration/rejected" />
      
      {/* ==================== LEGACY DASHBOARD SCREENS ==================== */}
      {/* 
        Note: dashboard/earnings is replaced by tabs/earnings
        Keep these for backward compatibility during transition
      */}
      <Stack.Screen name="dashboard/home" />
      <Stack.Screen name="dashboard/earnings" />
      <Stack.Screen name="dashboard/wallet" />
      <Stack.Screen name="dashboard/notifications" />
      <Stack.Screen name="dashboard/stats" />
      <Stack.Screen name="dashboard/preferences" />
      <Stack.Screen name="dashboard/promotions" />
      <Stack.Screen name="dashboard/referrals" />
      <Stack.Screen name="dashboard/feedback" />
      <Stack.Screen name="dashboard/schedule" />
      
      {/* ==================== REQUEST MANAGEMENT ==================== */}
      {/* Using dashboard/incoming-requests and dashboard/request-detail instead */}
      <Stack.Screen name="dashboard/incoming-requests" />
      <Stack.Screen name="dashboard/request-detail" />
      
      {/* ==================== PHASE 3: ACTIVE RIDE (13 screens) ==================== */}
      <Stack.Screen name="active-ride/navigate-to-pickup" />
      <Stack.Screen name="active-ride/arrived-at-pickup" />
      <Stack.Screen name="active-ride/start-ride" />
      <Stack.Screen name="active-ride/navigate-to-destination" />
      <Stack.Screen name="active-ride/complete-ride" />
      <Stack.Screen name="active-ride/payment-received" />
      <Stack.Screen name="active-ride/rate-rider" />
      <Stack.Screen name="active-ride/cancel-ride" />
      <Stack.Screen name="active-ride/rider-no-show" />
      <Stack.Screen name="active-ride/add-stop" />
      <Stack.Screen name="active-ride/emergency-sos" />
      <Stack.Screen name="active-ride/share-trip" />
      <Stack.Screen name="active-ride/trip-summary" />
      
      {/* ==================== PHASE 4: PROFILE & HISTORY (19 screens) ==================== */}
      
      {/* Trip History (5 screens) */}
      <Stack.Screen name="history/trips" />
      <Stack.Screen name="history/trip-detail" />
      <Stack.Screen name="history/trip-receipt" />
      <Stack.Screen name="history/trip-filters" />
      <Stack.Screen name="history/trip-support" />
      
      {/* Driver Profile (screens) */}
      <Stack.Screen name="profile/view" />
      <Stack.Screen name="profile/edit-profile" />
      <Stack.Screen name="profile/upload-photo" />
      <Stack.Screen name="profile/performance-stats" />
      <Stack.Screen name="profile/achievements" />
      <Stack.Screen name="profile/weekly-summary" />
      
      {/* Registration Status (NEW) */}
      <Stack.Screen 
        name="profile/registration-status" 
        options={{ 
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Registration Status',
        }}
      />
      
      {/* Documents (3 screens) */}
      <Stack.Screen name="profile/documents" />
      <Stack.Screen name="profile/document-detail" />
      <Stack.Screen name="profile/upload-document" />
      
      {/* Vehicle (2 screens) */}
      <Stack.Screen name="profile/vehicle" />
      <Stack.Screen name="profile/update-vehicle" />
      
      {/* Ratings & Referrals (3 screens) */}
      <Stack.Screen name="profile/ratings-reviews" />
      <Stack.Screen name="profile/review-detail" />
      <Stack.Screen name="profile/referrals" />
      
      {/* ==================== TODO: WALLET & EARNINGS - Create these screens ==================== */}
      {/* TODO: Create wallet/* and earnings/* directories with screens */}

      {/* ==================== TODO: TRIPS - Create these screens ==================== */}
      {/* TODO: Create trips/* directory with screens */}

      {/* ==================== TODO: PREFERENCES - Create these screens ==================== */}
      {/* TODO: Create preferences/* directory with screens */}

      {/* ==================== TODO: FEEDBACK - Create these screens ==================== */}
      {/* TODO: Create feedback/* directory with screens */}

      {/* ==================== TODO: HELP & SUPPORT - Create these screens ==================== */}
      {/* TODO: Create help/* directory with screens */}

      {/* ==================== TODO: LEGAL - Create these screens ==================== */}
      {/* TODO: Create legal/* directory with screens */}
      
      {/* ==================== PHASE 5: SETTINGS (6 screens) ==================== */}
      {/* ==================== TODO: SETTINGS - Create these screens ==================== */}
      {/* TODO: Create settings/* directory with screens */}

      {/* ==================== TODO: SUPPORT - Create these screens ==================== */}
      {/* TODO: Create support/* directory with screens */}

      {/* ==================== TODO: OPPORTUNITIES - Create this screen ==================== */}
      {/* TODO: Create opportunities.tsx screen */}

      {/* Development Menu */}
      <Stack.Screen
        name="dev-menu"
        options={{
          headerShown: true,
          headerTitle: 'Dev Menu',
        }}
      />
    </Stack>
  );
}