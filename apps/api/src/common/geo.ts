/**
 * Visitor country, derived from the browser's IANA time zone.
 *
 * The dashboard's country panel was always empty. `track` read `cf-ipcountry`,
 * `x-vercel-ip-country` and `x-country`, but the site runs on Railway behind
 * neither Cloudflare nor Vercel, so none of those headers ever arrive and every
 * row stored `country: null`.
 *
 * The time zone the browser already reports is a good country-level proxy, needs
 * no GeoIP database or third-party lookup, costs no extra request, and never
 * touches a visitor's IP address. It is wrong only for someone travelling with a
 * manually-set clock, which does not matter for a school's dashboard.
 */

const ZONE_TO_COUNTRY: Record<string, string> = {
  // East Africa, where nearly all of this school's traffic comes from
  'Africa/Kampala': 'Uganda',
  'Africa/Nairobi': 'Kenya',
  'Africa/Dar_es_Salaam': 'Tanzania',
  'Africa/Kigali': 'Rwanda',
  'Africa/Bujumbura': 'Burundi',
  'Africa/Juba': 'South Sudan',
  'Africa/Khartoum': 'Sudan',
  'Africa/Addis_Ababa': 'Ethiopia',
  'Africa/Mogadishu': 'Somalia',
  'Africa/Asmara': 'Eritrea',
  'Africa/Djibouti': 'Djibouti',
  // Rest of Africa
  'Africa/Lagos': 'Nigeria',
  'Africa/Accra': 'Ghana',
  'Africa/Abidjan': "Côte d'Ivoire",
  'Africa/Dakar': 'Senegal',
  'Africa/Bamako': 'Mali',
  'Africa/Ouagadougou': 'Burkina Faso',
  'Africa/Conakry': 'Guinea',
  'Africa/Freetown': 'Sierra Leone',
  'Africa/Monrovia': 'Liberia',
  'Africa/Lome': 'Togo',
  'Africa/Porto-Novo': 'Benin',
  'Africa/Niamey': 'Niger',
  'Africa/Ndjamena': 'Chad',
  'Africa/Bangui': 'Central African Republic',
  'Africa/Douala': 'Cameroon',
  'Africa/Libreville': 'Gabon',
  'Africa/Brazzaville': 'Congo',
  'Africa/Kinshasa': 'DR Congo',
  'Africa/Lubumbashi': 'DR Congo',
  'Africa/Luanda': 'Angola',
  'Africa/Lusaka': 'Zambia',
  'Africa/Harare': 'Zimbabwe',
  'Africa/Gaborone': 'Botswana',
  'Africa/Windhoek': 'Namibia',
  'Africa/Maputo': 'Mozambique',
  'Africa/Blantyre': 'Malawi',
  'Africa/Johannesburg': 'South Africa',
  'Africa/Maseru': 'Lesotho',
  'Africa/Mbabane': 'Eswatini',
  'Africa/Cairo': 'Egypt',
  'Africa/Tripoli': 'Libya',
  'Africa/Tunis': 'Tunisia',
  'Africa/Algiers': 'Algeria',
  'Africa/Casablanca': 'Morocco',
  'Indian/Antananarivo': 'Madagascar',
  'Indian/Mauritius': 'Mauritius',
  // Europe
  'Europe/London': 'United Kingdom',
  'Europe/Dublin': 'Ireland',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Europe/Madrid': 'Spain',
  'Europe/Rome': 'Italy',
  'Europe/Lisbon': 'Portugal',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Brussels': 'Belgium',
  'Europe/Zurich': 'Switzerland',
  'Europe/Vienna': 'Austria',
  'Europe/Stockholm': 'Sweden',
  'Europe/Oslo': 'Norway',
  'Europe/Copenhagen': 'Denmark',
  'Europe/Helsinki': 'Finland',
  'Europe/Warsaw': 'Poland',
  'Europe/Prague': 'Czechia',
  'Europe/Budapest': 'Hungary',
  'Europe/Bucharest': 'Romania',
  'Europe/Athens': 'Greece',
  'Europe/Istanbul': 'Türkiye',
  'Europe/Moscow': 'Russia',
  'Europe/Kyiv': 'Ukraine',
  'Europe/Kiev': 'Ukraine',
  // Americas
  'America/New_York': 'United States',
  'America/Chicago': 'United States',
  'America/Denver': 'United States',
  'America/Phoenix': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Anchorage': 'United States',
  'Pacific/Honolulu': 'United States',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'America/Edmonton': 'Canada',
  'America/Winnipeg': 'Canada',
  'America/Halifax': 'Canada',
  'America/Mexico_City': 'Mexico',
  'America/Bogota': 'Colombia',
  'America/Lima': 'Peru',
  'America/Santiago': 'Chile',
  'America/Buenos_Aires': 'Argentina',
  'America/Argentina/Buenos_Aires': 'Argentina',
  'America/Sao_Paulo': 'Brazil',
  'America/Jamaica': 'Jamaica',
  'America/Port_of_Spain': 'Trinidad and Tobago',
  // Middle East and Asia
  'Asia/Dubai': 'United Arab Emirates',
  'Asia/Qatar': 'Qatar',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Kuwait': 'Kuwait',
  'Asia/Bahrain': 'Bahrain',
  'Asia/Muscat': 'Oman',
  'Asia/Amman': 'Jordan',
  'Asia/Beirut': 'Lebanon',
  'Asia/Jerusalem': 'Israel',
  'Asia/Baghdad': 'Iraq',
  'Asia/Tehran': 'Iran',
  'Asia/Karachi': 'Pakistan',
  'Asia/Kolkata': 'India',
  'Asia/Calcutta': 'India',
  'Asia/Colombo': 'Sri Lanka',
  'Asia/Dhaka': 'Bangladesh',
  'Asia/Kathmandu': 'Nepal',
  'Asia/Bangkok': 'Thailand',
  'Asia/Ho_Chi_Minh': 'Vietnam',
  'Asia/Jakarta': 'Indonesia',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Singapore': 'Singapore',
  'Asia/Manila': 'Philippines',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Shanghai': 'China',
  'Asia/Taipei': 'Taiwan',
  'Asia/Seoul': 'South Korea',
  'Asia/Tokyo': 'Japan',
  // Oceania
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Australia/Perth': 'Australia',
  'Australia/Adelaide': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  'Pacific/Fiji': 'Fiji',
};

/**
 * Country name for an IANA time zone, or null when it is missing or unusable.
 *
 * Unknown zones fall back to the city segment ("Africa/Lusaka" that we have not
 * listed reads as "Lusaka") rather than being dropped, so the panel still shows
 * something a person can act on instead of silently losing the visit.
 */
export function countryFromTimezone(tz: string | undefined | null): string | null {
  const zone = (tz ?? '').trim();
  if (!zone || zone.length > 64 || !zone.includes('/')) return null;
  // "UTC", "Etc/GMT+3" and friends carry no location.
  if (/^(Etc\/|GMT|UTC)/i.test(zone)) return null;

  const known = ZONE_TO_COUNTRY[zone];
  if (known) return known;

  const city = zone.split('/').pop() ?? '';
  if (!city) return null;
  return city.replace(/_/g, ' ');
}
