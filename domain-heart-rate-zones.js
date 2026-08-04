export const HEART_RATE_ZONE_SET_VERSION = 1;
export const HEART_RATE_ZONE_COUNT = 5;
export const HEART_RATE_BOUNDARY_POLICY = 'lower_inclusive_upper_exclusive';
export const HEART_RATE_ZONE_DISTRIBUTION_VERSION = 1;
export const HEART_RATE_ZONE_PERCENT_TOLERANCE = 2;

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

function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : '';
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

export function heartRateZoneSetSnapshot(zoneSet) {
  if (!zoneSet) return null;
  const normalized = normalizeHeartRateZoneSet(zoneSet);
  if (!validateHeartRateZoneSet(normalized).valid) return null;
  return {
    id: normalized.id,
    version: normalized.version,
    name: normalized.name,
    sourceType: normalized.sourceType,
    sourceName: normalized.sourceName,
    testedAt: normalized.testedAt,
    effectiveFrom: normalized.effectiveFrom,
    maxHeartRate: normalized.maxHeartRate,
    boundaryPolicy: normalized.boundaryPolicy,
    zones: normalized.zones.map(zone => ({ ...zone }))
  };
}

export function normalizeHeartRateZoneDistribution(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const rawZones = Array.isArray(value.zones) ? value.zones : [];
  const zones = Array.from({ length: HEART_RATE_ZONE_COUNT }, (_, index) => {
    const raw = rawZones.find(zone => zone?.zoneId === `z${index + 1}`) || rawZones[index] || {};
    return {
      zoneId: `z${index + 1}`,
      percent: optionalNumber(raw.percent),
      seconds: optionalNumber(raw.seconds)
    };
  });
  if (!zones.some(zone => zone.percent !== '' || zone.seconds !== '')) return null;
  const totalPercent = Math.round(zones.reduce((sum, zone) => sum + (Number(zone.percent) || 0), 0) * 10) / 10;
  return {
    version: HEART_RATE_ZONE_DISTRIBUTION_VERSION,
    source: cleanText(value.source) || 'garmin_manual',
    zones,
    totalPercent,
    zoneSetSnapshot: heartRateZoneSetSnapshot(value.zoneSetSnapshot)
  };
}

export function validateHeartRateZoneDistribution(value) {
  const distribution = normalizeHeartRateZoneDistribution(value);
  if (!distribution) return { valid: true, errors: [], value: null };
  const errors = [];
  distribution.zones.forEach((zone, index) => {
    if (zone.percent !== '' && (zone.percent < 0 || zone.percent > 100)) {
      errors.push(`Prosent i sone ${index + 1} må være mellom 0 og 100.`);
    }
    if (zone.seconds !== '' && zone.seconds < 0) {
      errors.push(`Tid i sone ${index + 1} kan ikke være negativ.`);
    }
  });
  if (!distribution.zoneSetSnapshot) {
    errors.push('Velg eller lagre en aktiv pulssoneprofil før sonefordeling registreres.');
  }
  if (distribution.zones.some(zone => zone.percent !== '')) {
    const min = 100 - HEART_RATE_ZONE_PERCENT_TOLERANCE;
    const max = 100 + HEART_RATE_ZONE_PERCENT_TOLERANCE;
    if (distribution.totalPercent < min || distribution.totalPercent > max) {
      errors.push(`Pulssonene summerer til ${distribution.totalPercent} %. Garmin-avrunding godtas fra ${min} til ${max} %.`);
    }
  }
  return { valid: errors.length === 0, errors, value: distribution };
}

export function formatHeartRateZoneDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function heartRateZoneDistributionRows(value, durationSeconds = 0) {
  const distribution = normalizeHeartRateZoneDistribution(value);
  if (!distribution) return [];
  const snapshot = distribution.zoneSetSnapshot;
  return distribution.zones.map((entry, index) => {
    const zone = snapshot?.zones?.[index] || normalizeHeartRateZone({}, index);
    const hasExactSeconds = entry.seconds !== '';
    const seconds = hasExactSeconds
      ? Number(entry.seconds)
      : Math.round((Number(durationSeconds) || 0) * (Number(entry.percent) || 0) / 100);
    return {
      zoneId: entry.zoneId,
      label: zone.label,
      range: formatHeartRateZoneRange(zone),
      percent: Number(entry.percent) || 0,
      seconds,
      estimated: !hasExactSeconds && Boolean(durationSeconds)
    };
  });
}
