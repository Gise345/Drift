import { Stack } from 'expo-router';

/**
 * DRIVER LAYOUT - UPDATED WITH ALL PHASE 4 SCREENS
 * 
 * Complete navigation structure for the Drift driver app
 * Includes all phases: Registration, Dashboard, Active Ride, Profile & History
 */
export default function DriverLayout() {
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
      
      {/* ==================== PHASE 2: DASHBOARD (12 screens) ==================== */}
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
      
      {/* Request Management */}
      <Stack.Screen name="requests/incoming" />
      <Stack.Screen name="requests/request-detail" />
      
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
      
      {/* Driver Profile (8 screens) */}
      <Stack.Screen name="profile/view" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="profile/upload-photo" />
      <Stack.Screen name="profile/stats" />
      <Stack.Screen name="profile/achievements" />
      <Stack.Screen name="profile/weekly-summary" />
      
      {/* Documents (3 screens) */}
      <Stack.Screen name="profile/documents" />
      <Stack.Screen name="profile/document-detail" />
      <Stack.Screen name="profile/upload-document" />
      
      {/* Vehicle (2 screens) */}
      <Stack.Screen name="profile/vehicle" />
      <Stack.Screen name="profile/update-vehicle" />
      
      {/* Ratings & Referrals (3 screens) */}
      <Stack.Screen name="profile/ratings" />
      <Stack.Screen name="profile/review-detail" />
      <Stack.Screen name="profile/referrals" />
      
      {/* ==================== PHASE 5: SETTINGS (6 screens) ==================== */}
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/preferences" />
      <Stack.Screen name="settings/payout-methods" />
      
      {/* Support */}
      <Stack.Screen name="support/help" />
      <Stack.Screen name="support/faq" />
      <Stack.Screen name="support/contact" />
    </Stack>
  );
}