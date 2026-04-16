/**
 * Soundex algorithm - converts strings to phonetic codes
 * Used for matching similar-sounding names
 */
const soundex = (str) => {
  if (!str) return '';

  const s = String(str).toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length === 0) return '';

  const firstLetter = s[0];
  const codes = {
    B: 1, F: 1, P: 1, V: 1,
    C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2,
    D: 3, T: 3,
    L: 4,
    M: 5, N: 5,
    R: 6,
  };

  let code = firstLetter;
  let prevCode = codes[firstLetter] || 0;

  for (let i = 1; i < s.length && code.length < 4; i++) {
    const digit = codes[s[i]] || 0;
    if (digit !== 0 && digit !== prevCode) {
      code += digit;
      prevCode = digit;
    } else if (digit === 0) {
      prevCode = 0;
    }
  }

  return code.padEnd(4, '0');
};

/**
 * Calculate phonetic similarity between two strings
 * Returns 0-100% match
 */
const phoneticSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = soundex(str1);
  const s2 = soundex(str2);

  return s1 === s2 ? 100 : 0;
};

/**
 * Calculate weighted string similarity considering multiple factors
 * Factors: character similarity, length similarity, prefix matching
 */
const weightedStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();

  if (s1 === s2) return 100;

  // Exact substring match
  if (s1.includes(s2) || s2.includes(s1)) return 85;

  // Common prefix matching
  let commonPrefix = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) commonPrefix++;
    else break;
  }
  const prefixScore = (commonPrefix / Math.max(s1.length, s2.length)) * 100;

  // Levenshtein distance
  const maxLen = Math.max(s1.length, s2.length);
  const editDistance = getEditDistance(s1, s2);
  const editScore = Math.max(0, ((maxLen - editDistance) / maxLen) * 100);

  // Weighted average: 40% edit distance + 60% prefix
  return Math.round((editScore * 0.4 + prefixScore * 0.6));
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
 * Advanced fuzzy match with AI-based weighting
 * Considers field type importance and multiple similarity algorithms
 * Returns 0-100% similarity score
 */
const advancedFuzzyMatch = ({
  vendorName = null,
  vendorName2 = null,
  gpu = null,
  gpu2 = null,
  location = null,
  location2 = null,
  powerMw = null,
  powerMw2 = null,
}) => {
  if (!vendorName || !vendorName2) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  // Vendor name: 40% weight (most important field)
  if (vendorName && vendorName2) {
    const exactMatch = vendorName.toLowerCase().trim() === vendorName2.toLowerCase().trim() ? 100 : 0;
    const phoneticMatch = phoneticSimilarity(vendorName, vendorName2);
    const fuzzyMatch = weightedStringSimilarity(vendorName, vendorName2);

    // Weighted average: 50% phonetic + 50% fuzzy
    const vendorScore = Math.max(exactMatch, (phoneticMatch * 0.5 + fuzzyMatch * 0.5));
    totalScore += vendorScore * 0.4;
    totalWeight += 0.4;
  }

  // GPU type: 35% weight (high importance)
  if (gpu && gpu2) {
    const gpuMatch = weightedStringSimilarity(gpu, gpu2);
    totalScore += gpuMatch * 0.35;
    totalWeight += 0.35;
  }

  // Location: 15% weight
  if (location && location2) {
    const locationMatch = weightedStringSimilarity(location, location2);
    totalScore += locationMatch * 0.15;
    totalWeight += 0.15;
  }

  // Power capacity: 10% weight (numerical comparison)
  if (powerMw && powerMw2) {
    const pw1 = parseFloat(powerMw);
    const pw2 = parseFloat(powerMw2);
    if (!isNaN(pw1) && !isNaN(pw2)) {
      const diff = Math.abs(pw1 - pw2);
      const maxPw = Math.max(pw1, pw2);
      const powerMatch = Math.max(0, 100 - (diff / maxPw) * 100);
      totalScore += powerMatch * 0.1;
      totalWeight += 0.1;
    }
  }

  // Normalize to 0-100
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

module.exports = {
  soundex,
  phoneticSimilarity,
  weightedStringSimilarity,
  advancedFuzzyMatch,
};
