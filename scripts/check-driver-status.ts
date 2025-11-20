/**
 * Debug Script: Check Driver Status in Firebase
 *
 * This script helps debug why drivers aren't showing up on the admin map
 * Run this to see the actual driver data in Firebase
 */

import firestore from '@react-native-firebase/firestore';

export async function checkAllDrivers() {
  console.log('🔍 ===== CHECKING ALL DRIVERS IN FIREBASE =====');

  try {
    const driversSnapshot = await firestore()
      .collection('drivers')
      .get();

    console.log(`\n📊 Total drivers in database: ${driversSnapshot.docs.length}`);

    for (const doc of driversSnapshot.docs) {
      const data = doc.data();

      console.log('\n' + '='.repeat(50));
      console.log(`Driver ID: ${doc.id}`);
      console.log(`Name: ${data.firstName} ${data.lastName}`);
      console.log(`Email: ${data.email}`);
      console.log(`Phone: ${data.phone}`);
      console.log(`Registration Status: ${data.registrationStatus}`);
      console.log(`Is Online: ${data.isOnline}`);
      console.log(`Last Online At: ${data.lastOnlineAt?.toDate()}`);
      console.log(`Current Location:`, {
        exists: !!data.currentLocation,
        lat: data.currentLocation?.lat,
        lng: data.currentLocation?.lng,
        heading: data.currentLocation?.heading,
        speed: data.currentLocation?.speed,
        updatedAt: data.currentLocation?.updatedAt?.toDate(),
      });
      console.log(`Vehicle:`, {
        make: data.vehicle?.make,
        model: data.vehicle?.model,
        licensePlate: data.vehicle?.licensePlate,
      });
      console.log('='.repeat(50));
    }

    // Check specifically for online drivers
    console.log('\n\n🟢 ===== CHECKING ONLINE DRIVERS =====');
    const onlineDriversSnapshot = await firestore()
      .collection('drivers')
      .where('isOnline', '==', true)
      .get();

    console.log(`\n📊 Online drivers count: ${onlineDriversSnapshot.docs.length}`);

    if (onlineDriversSnapshot.docs.length === 0) {
      console.log('\n❌ NO ONLINE DRIVERS FOUND');
      console.log('Possible reasons:');
      console.log('1. isOnline field is not set to true in any driver document');
      console.log('2. Driver needs to toggle online in the app');
      console.log('3. There might be a Firebase index issue');
    } else {
      for (const doc of onlineDriversSnapshot.docs) {
        const data = doc.data();
        console.log(`\n✅ Online Driver: ${data.firstName} ${data.lastName}`);
        console.log(`   Has Location: ${!!(data.currentLocation?.lat && data.currentLocation?.lng)}`);
        if (data.currentLocation) {
          console.log(`   Location: ${data.currentLocation.lat}, ${data.currentLocation.lng}`);
          console.log(`   Updated: ${data.currentLocation.updatedAt?.toDate()}`);
        }
      }
    }

    // Check for drivers with location but not online
    console.log('\n\n📍 ===== DRIVERS WITH LOCATION (ANY STATUS) =====');
    const allDrivers = driversSnapshot.docs;
    const driversWithLocation = allDrivers.filter(doc => {
      const data = doc.data();
      return data.currentLocation?.lat && data.currentLocation?.lng;
    });

    console.log(`\n📊 Drivers with location data: ${driversWithLocation.length}`);
    driversWithLocation.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.firstName} ${data.lastName} (isOnline: ${data.isOnline})`);
    });

  } catch (error) {
    console.error('❌ Error checking drivers:', error);
  }

  console.log('\n\n🏁 ===== CHECK COMPLETE =====\n');
}

export async function forceDriverOnline(driverId: string) {
  console.log(`🔧 Force setting driver ${driverId} to online...`);

  try {
    await firestore()
      .collection('drivers')
      .doc(driverId)
      .update({
        isOnline: true,
        lastOnlineAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    console.log('✅ Driver set to online');

    // Verify
    const doc = await firestore().collection('drivers').doc(driverId).get();
    const data = doc.data();
    console.log('Verification:', {
      isOnline: data?.isOnline,
      lastOnlineAt: data?.lastOnlineAt?.toDate(),
    });
  } catch (error) {
    console.error('❌ Error setting driver online:', error);
  }
}

export async function setDriverLocation(
  driverId: string,
  lat: number = 19.3133,
  lng: number = -81.2546
) {
  console.log(`📍 Setting location for driver ${driverId}...`);

  try {
    await firestore()
      .collection('drivers')
      .doc(driverId)
      .update({
        'currentLocation.lat': lat,
        'currentLocation.lng': lng,
        'currentLocation.heading': 0,
        'currentLocation.speed': 0,
        'currentLocation.updatedAt': firestore.FieldValue.serverTimestamp(),
      });

    console.log('✅ Location set');
  } catch (error) {
    console.error('❌ Error setting location:', error);
  }
}
