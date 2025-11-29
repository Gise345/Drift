/**
 * Progressive Polyline Component
 * Shows trip progress with traveled (gray) and remaining (purple) route segments
 *
 * Features:
 * - Dynamic color change: gray for traveled, purple for remaining
 * - Finds closest point on route to current location
 * - Supports route recalculation callback when driver deviates
 * - Compatible with Android/Expo SDK 52
 */

import React, { useMemo } from 'react';
import { Polyline } from 'react-native-maps';
import { Colors } from '@/src/constants/theme';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface ProgressivePolylineProps {
  /** Full route coordinates from origin to destination */
  routeCoordinates: Coordinate[];
  /** Current location of the driver/vehicle */
  currentLocation: Coordinate | null;
  /** Color for the remaining route (default: purple) */
  remainingColor?: string;
  /** Color for the traveled route (default: gray) */
  traveledColor?: string;
  /** Width of the polyline */
  strokeWidth?: number;
  /** Callback when driver deviates from route (distance in meters) */
  onRouteDeviation?: (distanceFromRoute: number) => void;
  /** Maximum distance from route before triggering deviation callback (meters) */
  deviationThreshold?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find the closest point on a line segment to a given point
 * Returns the projected point and the distance to it
 */
const closestPointOnSegment = (
  point: Coordinate,
  segStart: Coordinate,
  segEnd: Coordinate
): { closestPoint: Coordinate; distance: number; t: number } => {
  const dx = segEnd.longitude - segStart.longitude;
  const dy = segEnd.latitude - segStart.latitude;

  if (dx === 0 && dy === 0) {
    // Segment is a point
    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      segStart.latitude,
      segStart.longitude
    );
    return { closestPoint: segStart, distance, t: 0 };
  }

  // Calculate projection parameter t
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.longitude - segStart.longitude) * dx +
        (point.latitude - segStart.latitude) * dy) /
        (dx * dx + dy * dy)
    )
  );

  // Calculate closest point on segment
  const closestPoint: Coordinate = {
    latitude: segStart.latitude + t * dy,
    longitude: segStart.longitude + t * dx,
  };

  const distance = calculateDistance(
    point.latitude,
    point.longitude,
    closestPoint.latitude,
    closestPoint.longitude
  );

  return { closestPoint, distance, t };
};

/**
 * Find the index and interpolated position where the current location
 * projects onto the route
 */
const findProgressIndex = (
  currentLocation: Coordinate,
  routeCoordinates: Coordinate[]
): { segmentIndex: number; interpolatedPoint: Coordinate; distanceFromRoute: number } => {
  let minDistance = Infinity;
  let bestSegmentIndex = 0;
  let bestInterpolatedPoint = routeCoordinates[0];
  let bestT = 0;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const { closestPoint, distance, t } = closestPointOnSegment(
      currentLocation,
      routeCoordinates[i],
      routeCoordinates[i + 1]
    );

    if (distance < minDistance) {
      minDistance = distance;
      bestSegmentIndex = i;
      bestInterpolatedPoint = closestPoint;
      bestT = t;
    }
  }

  return {
    segmentIndex: bestSegmentIndex,
    interpolatedPoint: bestInterpolatedPoint,
    distanceFromRoute: minDistance,
  };
};

/**
 * Normalize coordinates to plain objects for Android compatibility
 */
const normalizeCoordinates = (coords: Coordinate[]): Coordinate[] => {
  return coords.map((coord) => ({
    latitude: Number(coord.latitude),
    longitude: Number(coord.longitude),
  }));
};

export const ProgressivePolyline: React.FC<ProgressivePolylineProps> = ({
  routeCoordinates,
  currentLocation,
  remainingColor = Colors.primary,
  traveledColor = Colors.gray[400],
  strokeWidth = 5,
  onRouteDeviation,
  deviationThreshold = 50, // 50 meters default
}) => {
  // Calculate traveled and remaining segments
  const { traveledCoordinates, remainingCoordinates, distanceFromRoute } = useMemo(() => {
    if (!currentLocation || routeCoordinates.length < 2) {
      return {
        traveledCoordinates: [],
        remainingCoordinates: normalizeCoordinates(routeCoordinates),
        distanceFromRoute: 0,
      };
    }

    const { segmentIndex, interpolatedPoint, distanceFromRoute } = findProgressIndex(
      currentLocation,
      routeCoordinates
    );

    // Build traveled path: from start to interpolated point
    const traveled: Coordinate[] = [];
    for (let i = 0; i <= segmentIndex; i++) {
      traveled.push(routeCoordinates[i]);
    }
    traveled.push(interpolatedPoint);

    // Build remaining path: from interpolated point to end
    const remaining: Coordinate[] = [interpolatedPoint];
    for (let i = segmentIndex + 1; i < routeCoordinates.length; i++) {
      remaining.push(routeCoordinates[i]);
    }

    return {
      traveledCoordinates: normalizeCoordinates(traveled),
      remainingCoordinates: normalizeCoordinates(remaining),
      distanceFromRoute,
    };
  }, [routeCoordinates, currentLocation]);

  // Check for route deviation
  React.useEffect(() => {
    if (distanceFromRoute > deviationThreshold && onRouteDeviation) {
      onRouteDeviation(distanceFromRoute);
    }
  }, [distanceFromRoute, deviationThreshold, onRouteDeviation]);

  if (routeCoordinates.length < 2) {
    return null;
  }

  return (
    <>
      {/* Traveled route (gray) - rendered first so it's behind */}
      {traveledCoordinates.length >= 2 && (
        <Polyline
          key="traveled-polyline"
          coordinates={traveledCoordinates}
          strokeColor={traveledColor}
          strokeWidth={strokeWidth}
          geodesic={true}
          lineCap="round"
          lineJoin="round"
          tappable={false}
        />
      )}

      {/* Remaining route (purple) - rendered on top */}
      {remainingCoordinates.length >= 2 && (
        <Polyline
          key="remaining-polyline"
          coordinates={remainingCoordinates}
          strokeColor={remainingColor}
          strokeWidth={strokeWidth}
          geodesic={true}
          lineCap="round"
          lineJoin="round"
          tappable={false}
        />
      )}
    </>
  );
};

export default ProgressivePolyline;
