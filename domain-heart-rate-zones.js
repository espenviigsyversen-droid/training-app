export const HEART_RATE_ZONE_SET_VERSION = 1;
export const HEART_RATE_ZONE_COUNT = 5;
export const HEART_RATE_BOUNDARY_POLICY = 'lower_inclusive_upper_exclusive';

const SOURCE_TYPES = new Set(['lab', 'manual']);

function cleanText(value) {
  return String(value || '').trim();
}

function positiveInteger(value) {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : '';
}

function dateValue(value) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function normalizeHeartRateZone(zone = {}, index = 0) {
  const source = zone && typeof zone === 'object' && !Array.isArray(zone) ? zone : {};
  const zoneNumber = index + 1;
  return {
    id: `z${zoneNumber}`,
    label: cleanText(source.label) || `Sone ${zoneNumber}`,
    minBpm: positiveInteger(source.minBpm ?? source.fromBpm),
    maxBpm: positiveInteger(source.maxBpm ?? source.toBpm)
  };
}

export function normalizeHeartRateZoneSet(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const rawZones = Array.isArray(source.zones) ? source.zones : [];
  return {
    id: cleanText(source.id),
    version: HEART_RATE_ZONE_SET_VERSION,
    name: cleanText(source.name) || 'Pulssoner',
    sourceType: SOURCE_TYPES.has(source.sourceType) ? source.sourceType : 'manual',
    sourceName: cleanText(source.sourceName),
    testedAt: dateValue(source.testedAt),
    effectiveFrom: dateValue(source.effectiveFrom) || dateValue(source.testedAt),
    maxHeartRate: positiveInteger(source.maxHeartRate),
    boundaryPolicy: HEART_RATE_BOUNDARY_POLICY,
    zones: Array.from({ length: HEART_RATE_ZONE_COUNT }, (_, index) => normalizeHeartRateZone(rawZones[index], index)),
    active: Boolean(source.active),
    note: cleanText(source.note),
    createdAt: cleanText(source.createdAt),
    updatedAt: cleanText(source.updatedAt)
  };
}

export function normalizeHeartRateZoneSets(values = []) {
  if (!Array.isArray(values)) return [];
  let activeFound = false;
  return values
    .map(normalizeHeartRateZoneSet)
    .filter(item => item.id)
    .map(item => {
      const active = item.active && !activeFound;
      if (active) activeFound = true;
      return { ...item, active };
    });
}

export function validateHeartRateZoneSet(value = {}) {
  const zoneSet = normalizeHeartRateZoneSet(value);
  const errors = [];
  if (!zoneSet.name) errors.push('Gi soneprofilen et navn.');
  if (zoneSet.sourceType === 'lab' && !zoneSet.testedAt) errors.push('Velg testdato for laboratoriesonene.');
  zoneSet.zones.forEach((zone, index) => {
    if (!zone.minBpm || !zone.maxBpm) {
      errors.push(`Fyll inn nedre og øvre grense for sone ${index + 1}.`);
    } else if (zone.minBpm >= zone.maxBpm) {
      errors.push(`Sone ${index + 1} må ha en øvre grense som er høyere enn den nedre.`);
    }
    if (index > 0) {
      const previous = zoneSet.zones[index - 1];
      if (previous.maxBpm && zone.minBpm && zone.minBpm !== previous.maxBpm) {
        errors.push(`Grensen mellom sone ${index} og ${index + 1} må være sammenhengende.`);
      }
    }
  });
  const lastZone = zoneSet.zones[zoneSet.zones.length - 1];
  if (zoneSet.maxHeartRate && lastZone.maxBpm && zoneSet.maxHeartRate < lastZone.maxBpm) {
    errors.push('Maks puls kan ikke være lavere enn øvre grense i sone 5.');
  }
  return { valid: errors.length === 0, errors, value: zoneSet };
}

export function activeHeartRateZoneSet(values = []) {
  return normalizeHeartRateZoneSets(values).find(item => item.active) || null;
}

export function heartRateZoneForBpm(value, zoneSet) {
  const bpm = Number(value);
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  const normalized = normalizeHeartRateZoneSet(zoneSet);
  const lastIndex = normalized.zones.length - 1;
  return normalized.zones.find((zone, index) => {
    if (!zone.minBpm || !zone.maxBpm) return false;
    return index === lastIndex
      ? bpm >= zone.minBpm && bpm <= zone.maxBpm
      : bpm >= zone.minBpm && bpm < zone.maxBpm;
  }) || null;
}

export function formatHeartRateZoneRange(zone = {}) {
  const normalized = normalizeHeartRateZone(zone);
  return normalized.minBpm && normalized.maxBpm
    ? `${normalized.minBpm}-${normalized.maxBpm} bpm`
    : 'Ikke satt';
}

export function heartRateZoneSetSummary(zoneSet) {
  if (!zoneSet) return 'Ingen aktiv pulssoneprofil';
  const normalized = normalizeHeartRateZoneSet(zoneSet);
  const source = normalized.sourceType === 'lab' ? 'Labtest' : 'Manuelt oppsett';
  const date = normalized.testedAt || normalized.effectiveFrom;
  return [normalized.name, source, date].filter(Boolean).join(' · ');
}
