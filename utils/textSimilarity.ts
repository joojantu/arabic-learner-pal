
// Basic Levenshtein distance implementation
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Calculates the similarity between two strings as a percentage.
 * 100% means identical, 0% means completely different (based on Levenshtein distance).
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns Similarity score from 0 to 100.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 100; // Both empty
  if (!str1 || !str2) return 0;   // One empty, one not

  const s1Normalized = str1.trim().toLowerCase();
  const s2Normalized = str2.trim().toLowerCase();
  
  if (s1Normalized === s2Normalized) return 100; // Perfect match after basic normalization

  const distance = levenshteinDistance(s1Normalized, s2Normalized);
  const maxLength = Math.max(s1Normalized.length, s2Normalized.length);

  if (maxLength === 0) return 100; // Should be caught by previous checks but good for safety

  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(similarity)); // Ensure it's between 0 and 100
}

/**
 * Normalizes Arabic text for comparison by removing diacritics and some common variations.
 * This is a basic normalization and can be expanded.
 * @param text The Arabic text.
 * @returns Normalized Arabic text.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  
  let normalized = text;

  // Remove diacritics (Tashkeel)
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, ""); // Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun, Alef Khanjareeya

  // Normalize Alef variants to plain Alef
  normalized = normalized.replace(/[\u0622\u0623\u0625]/g, "\u0627"); // Alef Madda, Alef Hamza Above, Alef Hamza Below to Alef

  // Normalize Yaa variants to Alef Maqsura if at the end of word, otherwise to Yaa
  // This is complex; for now, just convert final Yaa with two dots below to Alef Maqsura
  normalized = normalized.replace(/\u064A$/, "\u0649"); // Yaa to Alef Maqsura (if final)
  // More generally, you might want to convert all forms of Yaa to a common one if not distinguishing
  // For now, we'll keep it simple.

  // Normalize Taa Marbuta to Haa
  normalized = normalized.replace(/\u0629/g, "\u0647"); // Taa Marbuta to Haa

  // Remove Tatweel (Kashida)
  normalized = normalized.replace(/\u0640/g, "");

  // Optional: Remove spaces or normalize multiple spaces to one
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}


/**
 * Calculates similarity for Arabic text, applying normalization first.
 * @param str1 Arabic string 1.
 * @param str2 Arabic string 2.
 * @returns Similarity score from 0 to 100.
 */
export function calculateArabicSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 100;
    if (!str1 || !str2) return 0;
    
    const normalizedS1 = normalizeArabicText(str1);
    const normalizedS2 = normalizeArabicText(str2);

    // console.log("Normalized S1:", normalizedS1);
    // console.log("Normalized S2:", normalizedS2);

    return calculateSimilarity(normalizedS1, normalizedS2);
}

