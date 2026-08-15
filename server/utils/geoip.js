import geoip from "geoip-lite";

// Derives location from the request IP on the server, rather than trusting
// a city/country value sent by the client (which anyone could fake).
// Only country is returned by default — see note in comment.js if you
// want to surface city too, and read the privacy trade-off before you do.
export function getLocationFromIp(ip) {
  if (!ip) return { country: null, city: null };

  // IPv4-mapped IPv6 addresses look like "::ffff:127.0.0.1" — strip the prefix
  const cleanIp = ip.replace("::ffff:", "");

  // localhost / private IPs (common in local dev) have no geo record
  const geo = geoip.lookup(cleanIp);
  if (!geo) return { country: null, city: null };

  return { country: geo.country || null, city: geo.city || null };
}
