const DcApplication = require('../models/DcApplication');
const DcSite = require('../models/DcSite');
const GpuClusterListing = require('../models/GpuClusterListing');
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
 * Format: https://maps.google.com/?q=lat,lng
 */
const extractCoordinates = (mapsLink) => {
  if (!mapsLink) return null;

  try {
    const match = mapsLink.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match && match[1] && match[2]) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Try alternative format
    const match2 = mapsLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match2 && match2[1] && match2[2]) {
      return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) };
    }
  } catch (err) {
    console.error('Failed to extract coordinates:', err);
  }

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

  const editDistance = getEditDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
};

/**
 * Calculate Levenshtein distance between two strings
 */
const getEditDistance = (s1, s2) => {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

/**
 * Find potential duplicate DC listings
 */
const findDuplicateDcListings = async ({
  organizationId, location, googleMapsLink, companyLegalEntity,
}) => {
  const duplicates = [];

  // GPS proximity check (50-100 meters)
  if (googleMapsLink) {
    const coords = extractCoordinates(googleMapsLink);
    if (coords) {
      const allListings = await DcApplication.find({
        organizationId: { $ne: organizationId },
        isArchived: false,
      }).lean();

      for (const listing of allListings) {
        if (listing.googleMapsLink) {
          const otherCoords = extractCoordinates(listing.googleMapsLink);
          if (otherCoords) {
            const distance = calculateDistance(
              coords.lat, coords.lng,
              otherCoords.lat, otherCoords.lng,
            );

            if (distance <= 100) { // 100 meters proximity threshold
              duplicates.push({
                id: listing._id,
                type: 'GPS_PROXIMITY',
                distance: Math.round(distance),
                similarity: 95, // High similarity for same location
                name: listing.companyLegalEntity,
                location: listing.location || 'Unknown',
                reason: `Same location (${Math.round(distance)}m away)`,
              });
            }
          }
        }
      }
    }
  }

  // Field matching check
  const allListings = await DcApplication.find({
    organizationId: { $ne: organizationId },
    isArchived: false,
  }).lean();

  for (const listing of allListings) {
    let similarityScore = 0;
    const matchedFields = [];

    // Check company name
    if (companyLegalEntity && listing.companyLegalEntity) {
      const nameSimilarity = calculateStringSimilarity(companyLegalEntity, listing.companyLegalEntity);
      if (nameSimilarity >= 80) {
        similarityScore += 40;
        matchedFields.push('companyName');
      }
    }

    // Check location
    if (location && listing.location) {
      const locationSimilarity = calculateStringSimilarity(location, listing.location);
      if (locationSimilarity >= 90) {
        similarityScore += 30;
        matchedFields.push('location');
      }
    }

    // Check country
    if (listing.companyCountry) {
      const countrySimilarity = calculateStringSimilarity(listing.companyCountry, listing.companyCountry);
      if (countrySimilarity === 100) {
        similarityScore += 20;
        matchedFields.push('country');
      }
    }

    // If significant similarity found, add to duplicates
    if (similarityScore >= 70 && !duplicates.some((d) => d.id === listing._id)) {
      duplicates.push({
        id: listing._id,
        type: 'FIELD_MATCHING',
        similarity: similarityScore,
        name: listing.companyLegalEntity,
        location: listing.location || 'Unknown',
        reason: `${matchedFields.join(', ')} match`,
      });
    }
  }

  // Sort by similarity and remove duplicates
  return duplicates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10); // Return top 10 matches
};

/**
 * Find potential duplicate GPU listings
 */
const findDuplicateGpuListings = async ({
  organizationId, location, googleMapsLink, vendorName, gpu,
}) => {
  const duplicates = [];

  // GPS proximity check
  if (googleMapsLink) {
    const coords = extractCoordinates(googleMapsLink);
    if (coords) {
      const allListings = await GpuClusterListing.find({
        organizationId: { $ne: organizationId },
        isArchived: false,
      }).lean();

      for (const listing of allListings) {
        if (listing.googleMapsLink) {
          const otherCoords = extractCoordinates(listing.googleMapsLink);
          if (otherCoords) {
            const distance = calculateDistance(
              coords.lat, coords.lng,
              otherCoords.lat, otherCoords.lng,
            );

            if (distance <= 100) {
              duplicates.push({
                id: listing._id,
                type: 'GPS_PROXIMITY',
                distance: Math.round(distance),
                similarity: 95,
                name: listing.vendorName,
                location: listing.location || 'Unknown',
                reason: `Same location (${Math.round(distance)}m away)`,
              });
            }
          }
        }
      }
    }
  }

  // Field matching check
  const allListings = await GpuClusterListing.find({
    organizationId: { $ne: organizationId },
    isArchived: false,
  }).lean();

  for (const listing of allListings) {
    // Use advanced fuzzy matching for AI-based similarity scoring
    const aiScore = advancedFuzzyMatch({
      vendorName,
      vendorName2: listing.vendorName,
      gpu,
      gpu2: listing.gpu,
      location,
      location2: listing.location,
      powerMw: null, // Not available in this context
      powerMw2: null,
    });

    // Also do traditional field matching for detailed reasons
    const matchedFields = [];
    if (vendorName && listing.vendorName) {
      const vendorSimilarity = calculateStringSimilarity(vendorName, listing.vendorName);
      if (vendorSimilarity >= 75) matchedFields.push('vendorName');
    }
    if (gpu && listing.gpu) {
      const gpuSimilarity = calculateStringSimilarity(gpu, listing.gpu);
      if (gpuSimilarity >= 80) matchedFields.push('gpu');
    }
    if (location && listing.location) {
      const locationSimilarity = calculateStringSimilarity(location, listing.location);
      if (locationSimilarity >= 85) matchedFields.push('location');
    }

    // Use AI score, fallback to traditional scoring
    if (aiScore >= 70 && !duplicates.some((d) => d.id === listing._id)) {
      duplicates.push({
        id: listing._id,
        type: 'AI_FIELD_MATCHING',
        similarity: aiScore,
        name: listing.vendorName,
        location: listing.location || 'Unknown',
        reason: matchedFields.length > 0 ? `${matchedFields.join(', ')} match` : 'AI similarity detected',
      });
    }
  }

  return duplicates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
};

module.exports = {
  findDuplicateDcListings,
  findDuplicateGpuListings,
  calculateDistance,
  calculateStringSimilarity,
};
