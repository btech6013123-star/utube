// Moderation is pattern-based (spam/flood detection), not character-based.
// A character blocklist would also reject Hindi, Arabic, Chinese, emoji, etc,
// which defeats the "post in any language" goal — so we screen for abuse
// patterns instead and leave a profanity list you can extend as needed.

const bannedWords = [
  // add lowercase words/phrases you want auto-blocked
];

export function isSpam(text) {
  const trimmed = (text || "").trim();

  if (!trimmed) return true;
  if (trimmed.length > 1000) return true;

  // same character repeated 10+ times in a row, e.g. "aaaaaaaaaa"
  if (/(.)\1{9,}/.test(trimmed)) return true;

  // more than 2 links in one comment
  const linkCount = (trimmed.match(/https?:\/\//gi) || []).length;
  if (linkCount > 2) return true;

  const lower = trimmed.toLowerCase();
  if (bannedWords.some((word) => lower.includes(word))) return true;

  return false;
}
