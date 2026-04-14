const prisma = require('../config/prisma');
const { advancedFuzzyMatch } = require('./fuzzyMatch.service');

/**
 * Calculate distance between two GPS coordinates (in meters)
 * Using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
    + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Extract coordinates from Google Maps link
 */
const extractCoordinates = (mapsLink) => {
  if (!mapsLink) return null;
  try {
    const match = mapsLink.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match && match[1] && match[2]) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    const match2 = mapsLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match2 && match2[1] && match2[2]) {
      return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    }
  } catch (err) { console.error('Failed to extract coordinates:', err); }
  return null;
};

/**
 * Calculate string similarity using Levenshtein distance (0-100%)
 */
const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();
  if (s1 === s2) return 100;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 100;
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  return Math.round(((longer.length - costs[shorter.length]) / longer.length) * 100);
};

/**
 * Find potential duplicate DC listings
 */
const findDuplicateDcListings = async ({
  supplierId, location, googleMapsLink, companyLegalEntity,
}) => {
  const duplicates = [];

  const allListings = await prisma.listing.findMany({
    where: {
      type: 'DC_SITE',
      supplier_id: { not: supplierId },
      archived_at: null
    }
  });

  // GPS proximity check
  if (googleMapsLink) {
    const coords = extractCoordinates(googleMapsLink);
    if (coords) {
      for (const listing of allListings) {
        const otherLink = listing.specifications?.googleMapsLink || listing.metadata?.googleMapsLink;
        if (otherLink) {
          const otherCoords = extractCoordinates(otherLink);
          if (otherCoords) {
            const distance = calculateDistance(coords.lat, coords.lng, otherCoords.lat, otherCoords.lng);
            if (distance <= 100) {
              duplicates.push({
                id: listing.id,
                _id: listing.id,
                type: 'GPS_PROXIMITY',
                distance: Math.round(distance),
                similarity: 95,
                name: listing.data_center_name || listing.name,
                location: listing.city + ', ' + listing.country,
                reason: `Same location (${Math.round(distance)}m away)`,
              });
            }
          }
        }
      }
    }
  }

  // Field matching check
  for (const listing of allListings) {
    let similarityScore = 0;
    const matchedFields = [];

    if (companyLegalEntity && (listing.data_center_name || listing.name)) {
      const nameSimilarity = calculateStringSimilarity(companyLegalEntity, listing.data_center_name || listing.name);
      if (nameSimilarity >= 80) {
        similarityScore += 40;
        matchedFields.push('companyName');
      }
    }

    if (location && (listing.city || listing.state)) {
      const locSimilarity = calculateStringSimilarity(location, (listing.city || '') + ' ' + (listing.state || ''));
      if (locSimilarity >= 90) {
        similarityScore += 30;
        matchedFields.push('location');
      }
    }

    if (similarityScore >= 70 && !duplicates.some((d) => d.id === listing.id)) {
      duplicates.push({
        id: listing.id,
        _id: listing.id,
        type: 'FIELD_MATCHING',
        similarity: similarityScore,
        name: listing.data_center_name || listing.name,
        location: listing.city || 'Unknown',
        reason: `${matchedFields.join(', ')} match`,
      });
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
};

/**
 * Find potential duplicate GPU listings
 */
const findDuplicateGpuListings = async ({
  supplierId, location, googleMapsLink, vendorName, gpu,
}) => {
  const duplicates = [];

  const allListings = await prisma.listing.findMany({
    where: {
      type: 'GPU_CLUSTER',
      supplier_id: { not: supplierId },
      archived_at: null
    }
  });

  // GPS proximity check
  if (googleMapsLink) {
    const coords = extractCoordinates(googleMapsLink);
    if (coords) {
      for (const listing of allListings) {
        const otherLink = listing.specifications?.googleMapsLink || listing.metadata?.googleMapsLink;
        if (otherLink) {
          const otherCoords = extractCoordinates(otherLink);
          if (otherCoords) {
            const distance = calculateDistance(coords.lat, coords.lng, otherCoords.lat, otherCoords.lng);
            if (distance <= 100) {
              duplicates.push({
                id: listing.id,
                _id: listing.id,
                type: 'GPS_PROXIMITY',
                distance: Math.round(distance),
                similarity: 95,
                name: listing.name || listing.data_center_name,
                location: listing.city || 'Unknown',
                reason: `Same location (${Math.round(distance)}m away)`,
              });
            }
          }
        }
      }
    }
  }

  // Field matching
  for (const listing of allListings) {
    const aiScore = advancedFuzzyMatch({
      vendorName,
      vendorName2: listing.name || listing.data_center_name,
      gpu,
      gpu2: listing.specifications?.gpuModel || listing.metadata?.gpuModel,
      location,
      location2: (listing.city || '') + ' ' + (listing.country || ''),
      powerMw: null,
      powerMw2: null,
    });

    if (aiScore >= 70 && !duplicates.some((d) => d.id === listing.id)) {
      duplicates.push({
        id: listing.id,
        _id: listing.id,
        type: 'AI_FIELD_MATCHING',
        similarity: aiScore,
        name: listing.name || listing.data_center_name,
        location: listing.city || 'Unknown',
        reason: 'AI similarity detected',
      });
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
};

module.exports = {
  findDuplicateDcListings,
  findDuplicateGpuListings,
  calculateDistance,
  calculateStringSimilarity,
};
