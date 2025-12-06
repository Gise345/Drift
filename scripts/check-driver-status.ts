/**
 * Debug Script: Check Driver Status in Firebase
 *
 * This script helps debug why drivers aren't showing up on the admin map
 * Run this to see the actual driver data in Firebase
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 */

import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export async function checkAllDrivers() {
  console.log('🔍 ===== CHECKING ALL DRIVERS IN FIREBASE =====');

  try {
    const driversRef = collection(db, 'drivers');
    const driversSnapshot = await getDocs(driversRef);

    console.log(`\n📊 Total drivers in database: ${driversSnapshot.docs.length}`);

    for (const docSnap of driversSnapshot.docs) {
      const data = docSnap.data();

      console.log('\n' + '='.repeat(50));
      console.log(`Driver ID: ${docSnap.id}`);
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
    const onlineQuery = query(driversRef, where('isOnline', '==', true));
    const onlineDriversSnapshot = await getDocs(onlineQuery);

    console.log(`\n📊 Online drivers count: ${onlineDriversSnapshot.docs.length}`);

    if (onlineDriversSnapshot.docs.length === 0) {
      console.log('\n❌ NO ONLINE DRIVERS FOUND');
      console.log('Possible reasons:');
      console.log('1. isOnline field is not set to true in any driver document');
      console.log('2. Driver needs to toggle online in the app');
      console.log('3. There might be a Firebase index issue');
    } else {
      for (const docSnap of onlineDriversSnapshot.docs) {
        const data = docSnap.data();
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
    const driversWithLocation = allDrivers.filter(docSnap => {
      const data = docSnap.data();
      return data.currentLocation?.lat && data.currentLocation?.lng;
    });

    console.log(`\n📊 Drivers with location data: ${driversWithLocation.length}`);
    driversWithLocation.forEach(docSnap => {
      const data = docSnap.data();
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
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      isOnline: true,
      lastOnlineAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Driver set to online');

    // Verify
    const driverDoc = await getDoc(driverRef);
    const data = driverDoc.data();
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
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      'currentLocation.lat': lat,
      'currentLocation.lng': lng,
      'currentLocation.heading': 0,
      'currentLocation.speed': 0,
      'currentLocation.updatedAt': serverTimestamp(),
    });

    console.log('✅ Location set');
  } catch (error) {
    console.error('❌ Error setting location:', error);
  }
}
