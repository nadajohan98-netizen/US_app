// Geolocation utilities extracted from HomeSection for reuse and clarity.

/**
 * Haversine distance between two coordinates, in kilometers.
 */
export const getHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of local earth sphere in kilometers
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
 * Attempts to resolve an approximate location from the user's IP address.
 * Tries ipapi.co first and falls back to freeipapi.com.
 *
 * @param fallbackCity City name used when the provider does not return one.
 */
export const fetchIpLocation = (
  fallbackCity: string,
  onSuccess?: (lat: number, lng: number, city: string) => void,
  onError?: (err: any) => void
) => {
  // Attempt fallback to ipapi.co
  fetch('https://ipapi.co/json/')
    .then((res) => {
      if (!res.ok) throw new Error('ipapi failed');
      return res.json();
    })
    .then((ipData) => {
      if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
        const lat = ipData.latitude;
        const lng = ipData.longitude;
        const city = ipData.city || fallbackCity;
        if (onSuccess) onSuccess(lat, lng, city);
      } else {
        throw new Error('Invalid structure from ipapi');
      }
    })
    .catch((err) => {
      console.warn('ipapi.co failed, attempting fallback to freeipapi...');
      // Fallback to freeipapi.com
      fetch('https://freeipapi.com/api/json')
        .then((res) => {
          if (!res.ok) throw new Error('freeipapi failed');
          return res.json();
        })
        .then((freeIpData) => {
          if (
            freeIpData &&
            typeof freeIpData.latitude === 'number' &&
            typeof freeIpData.longitude === 'number'
          ) {
            const lat = freeIpData.latitude;
            const lng = freeIpData.longitude;
            const city = freeIpData.cityName || fallbackCity;
            if (onSuccess) onSuccess(lat, lng, city);
          } else {
            throw new Error('Invalid structure from freeipapi');
          }
        })
        .catch((finalErr) => {
          console.error('All IP-based geolocators failed:');
          if (onError) onError(finalErr);
        });
    });
};

