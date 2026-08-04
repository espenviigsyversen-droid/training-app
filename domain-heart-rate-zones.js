import {
  classifyWorkoutIntensityContext,
  goldenZonePercentages,
  structuredWorkoutBreakdown
} from './domain-core.js';

export const HEART_RATE_ZONE_SET_VERSION = 1;
export const HEART_RATE_ZONE_COUNT = 5;
export const HEART_RATE_BOUNDARY_POLICY = 'lower_inclusive_upper_exclusive';
export const HEART_RATE_ZONE_DISTRIBUTION_VERSION = 1;
export const HEART_RATE_ZONE_PERCENT_TOLERANCE = 2;
export const HEART_RATE_ZONE_COMPLIANCE_VERSION = 1;
export const GOLDEN_ZONE_SOURCE_LABEL = 'Bakken-beregnet fra makspuls og treningsnivå';

const COMPLIANCE_LABELS = Object.freeze({
  aligned: 'I tråd med planen',
  mostly_aligned: 'Stort sett i tråd',
  above_plan: 'Hardere enn planlagt',
  below_plan: 'Roligere enn planlagt',
  unknown: 'Ikke nok grunnlag'
});

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

export function heartRateReferenceContext({
  zoneSet = null,
  maxHeartRate = '',
  thresholdHeartRate = '',
  trainingLevel = 'beginner',
  rules
} = {}) {
  const validatedZoneSet = zoneSet ? validateHeartRateZoneSet(zoneSet) : null;
  const zoneSetSnapshot = validatedZoneSet?.valid
    ? heartRateZoneSetSnapshot(validatedZoneSet.value)
    : null;
  const safeMaxHeartRate = positiveInteger(maxHeartRate) || null;
  const safeThresholdHeartRate = positiveInteger(thresholdHeartRate) || null;
  const { lowPct, highPct } = goldenZonePercentages(trainingLevel, rules);
  return {
    zoneSet: zoneSetSnapshot,
    zoneSource: zoneSetSnapshot ? {
      id: zoneSetSnapshot.id,
      name: zoneSetSnapshot.name,
      sourceType: zoneSetSnapshot.sourceType,
      sourceName: zoneSetSnapshot.sourceName,
      testedAt: zoneSetSnapshot.testedAt,
      effectiveFrom: zoneSetSnapshot.effectiveFrom,
      label: heartRateZoneSetSummary(zoneSetSnapshot)
    } : null,
    maxHeartRate: safeMaxHeartRate,
    thresholdHeartRate: safeThresholdHeartRate,
    goldenZone: safeMaxHeartRate ? {
      low: Math.round(safeMaxHeartRate * lowPct),
      high: Math.round(safeMaxHeartRate * highPct),
      maxHeartRate: safeMaxHeartRate,
      lowPct,
      highPct,
      source: 'coach_calculated',
      sourceLabel: GOLDEN_ZONE_SOURCE_LABEL,
      separateFromTestZones: true
    } : null
  };
}

export function heartRateValueContext(value, reference = {}) {
  const bpm = Number(value);
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  const maxHeartRate = Number(reference.maxHeartRate) || 0;
  const thresholdHeartRate = Number(reference.thresholdHeartRate) || 0;
  const goldenZone = reference.goldenZone && typeof reference.goldenZone === 'object'
    ? reference.goldenZone
    : null;
  let goldenZoneStatus = null;
  if (goldenZone?.low && goldenZone?.high) {
    goldenZoneStatus = bpm < goldenZone.low
      ? 'below'
      : bpm > goldenZone.high
        ? 'above'
        : 'within';
  }
  return {
    bpm: Math.round(bpm),
    zone: reference.zoneSet ? heartRateZoneForBpm(bpm, reference.zoneSet) : null,
    maxPercent: maxHeartRate > 0 ? Math.round((bpm / maxHeartRate) * 100) : null,
    thresholdPercent: thresholdHeartRate > 0 ? Math.round((bpm / thresholdHeartRate) * 100) : null,
    goldenZoneStatus
  };
}

export function heartRateValueContextLabel(value, reference = {}, { includeGoldenZone = false } = {}) {
  const context = heartRateValueContext(value, reference);
  if (!context) return '';
  const parts = [];
  if (context.zone?.label) parts.push(context.zone.label);
  if (context.maxPercent !== null) parts.push(`${context.maxPercent}% maks`);
  if (context.thresholdPercent !== null) parts.push(`${context.thresholdPercent}% terskel`);
  if (includeGoldenZone && context.goldenZoneStatus) {
    const label = context.goldenZoneStatus === 'within'
      ? 'i gylne sone'
      : context.goldenZoneStatus === 'above'
        ? 'over gylne sone'
        : 'under gylne sone';
    parts.push(`${label} · Bakken-beregnet`);
  }
  return parts.length ? ` (${parts.join(' · ')})` : '';
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

function zoneShare(distribution, zoneIds) {
  return Math.round(distribution.zones.reduce((sum, zone) => (
    zoneIds.includes(zone.zoneId) ? sum + (Number(zone.percent) || 0) : sum
  ), 0) * 10) / 10;
}

function complianceResult(status, confidence, summary, reasons, extra = {}) {
  return {
    version: HEART_RATE_ZONE_COMPLIANCE_VERSION,
    status,
    label: COMPLIANCE_LABELS[status] || COMPLIANCE_LABELS.unknown,
    confidence,
    summary,
    reasons: reasons.filter(Boolean),
    ...extra
  };
}

function workoutBodyResponse(completed = {}) {
  const before = Number(completed.bodyStatus?.painBefore) || 0;
  const after = Number(completed.bodyStatus?.painAfter) || 0;
  const rpe = Number(completed.rpe) || 0;
  const adaptation = String(completed.bodyStatus?.adaptation || '');
  return {
    before,
    after,
    rpe,
    painConcern: after >= 4 || after > before + 1,
    adapted: ['shorter', 'easier', 'alternative', 'aborted'].includes(adaptation)
  };
}

export function assessHeartRateZoneCompliance({
  distribution,
  completed = {},
  template = {},
  profile = {},
  rules,
  intensityContext
} = {}) {
  const validation = validateHeartRateZoneDistribution(distribution);
  if (!validation.valid || !validation.value) {
    return complianceResult('unknown', 'low', 'Ingen gyldig sonefordeling er registrert.', []);
  }

  const normalized = validation.value;
  const context = intensityContext || classifyWorkoutIntensityContext({ completed, template, profile, rules });
  const body = workoutBodyResponse(completed);
  const shares = {
    easy: zoneShare(normalized, ['z1', 'z2']),
    aerobic: zoneShare(normalized, ['z3']),
    quality: zoneShare(normalized, ['z3', 'z4', 'z5']),
    upper: zoneShare(normalized, ['z4', 'z5']),
    veryHigh: zoneShare(normalized, ['z5'])
  };
  const common = {
    intent: context?.raceIntent ? 'race'
      : context?.qualityIntent ? 'quality'
        : context?.recoveryIntent ? 'recovery'
          : context?.baseIntent ? 'base' : 'unknown',
    shares,
    safetyPriority: body.painConcern || body.rpe >= 8
  };

  if (body.painConcern) {
    return complianceResult(
      'above_plan',
      'high',
      'Kroppsresponsen veier tyngre enn pulssonefordelingen.',
      [`Smerte økte fra ${body.before}/10 til ${body.after}/10 eller var tydelig etter økten.`],
      common
    );
  }
  if (body.rpe >= 8 && !context?.raceIntent) {
    return complianceResult(
      'above_plan',
      'high',
      'Økten ble opplevd hardere enn en kontrollert gjennomføring.',
      [`Opplevd intensitet var ${body.rpe}/10.`],
      common
    );
  }
  if (body.adapted) {
    return complianceResult(
      'unknown',
      'low',
      'Økten ble tilpasset underveis. Vurder kroppens respons foran prosentfordelingen.',
      ['Tilpasningen gjør sammenligning med den opprinnelige planen usikker.'],
      common
    );
  }

  if (context?.recoveryIntent) {
    if (shares.easy >= 90 && shares.upper <= 5) {
      return complianceResult('aligned', 'high', 'Pulsen lå hovedsakelig i rolige soner som forventet for restitusjon.', [`${shares.easy} % i sone 1-2.`], common);
    }
    if (shares.easy >= 75 && shares.upper <= 10) {
      return complianceResult('mostly_aligned', 'medium', 'Mesteparten var rolig, men noe mer tid gikk høyere enn ønsket.', [`${shares.easy} % i sone 1-2.`], common);
    }
    return complianceResult('above_plan', 'medium', 'Sonefordelingen ser hardere ut enn en restitusjonsøkt.', [`${shares.quality} % i sone 3-5.`], common);
  }

  if (context?.baseIntent && !context?.qualityIntent && !context?.raceIntent) {
    if (shares.easy >= 80 && shares.upper <= 10) {
      return complianceResult('aligned', 'high', 'Sonefordelingen støtter en rolig/basepreget gjennomføring.', [`${shares.easy} % i sone 1-2.`], common);
    }
    if (shares.easy >= 65 && shares.upper <= 15) {
      return complianceResult('mostly_aligned', 'medium', 'Økten var hovedsakelig rolig, med noe mer arbeid i høyere soner.', [`${shares.easy} % i sone 1-2.`], common);
    }
    return complianceResult('above_plan', 'medium', 'Sonefordelingen ser hardere ut enn planens rolige/basepreg.', [`${shares.quality} % i sone 3-5.`], common);
  }

  if (context?.qualityIntent || context?.raceIntent) {
    const structured = structuredWorkoutBreakdown(
      template.structuredWorkout || completed.structuredWorkout || completed.templateSnapshot?.structuredWorkout
    );
    const plannedWorkShare = structured?.totalSeconds
      ? Math.max(15, Math.min(45, Math.round((structured.workSeconds / structured.totalSeconds) * 100)))
      : 20;
    if (shares.quality >= plannedWorkShare) {
      return complianceResult(
        'aligned',
        structured ? 'medium' : 'low',
        context?.raceIntent
          ? 'Sonefordelingen støtter en tydelig konkurranse-/testbelastning.'
          : 'Sonefordelingen støtter at økten inneholdt planlagt kvalitetsarbeid.',
        [`${shares.quality} % i sone 3-5. Oppvarming, pauser og nedjogg påvirker totalen.`],
        common
      );
    }
    if (shares.quality >= Math.max(8, Math.round(plannedWorkShare / 2))) {
      return complianceResult('mostly_aligned', 'low', 'Noe kvalitetsarbeid er synlig, men totalfordelingen alene gir ikke en sikker fasit.', [`${shares.quality} % i sone 3-5.`], common);
    }
    return complianceResult('below_plan', 'low', 'Sonefordelingen ser roligere ut enn planlagt kvalitet, men puls kan henge etter på korte drag.', [`${shares.quality} % i sone 3-5.`], common);
  }

  return complianceResult('unknown', 'low', 'Øktens rolle eller intensitetsmål er ikke tydelig nok til å vurdere soneetterlevelse.', [], common);
}

export function heartRateZoneComplianceSummary(items = [], {
  resolveTemplate = item => item?.template || item?.templateSnapshot || {},
  profile = {},
  rules
} = {}) {
  const assessments = (Array.isArray(items) ? items : [])
    .filter(item => normalizeHeartRateZoneDistribution(item?.heartRateZoneDistribution))
    .map(item => ({
      id: item.id || '',
      date: item.date || '',
      name: resolveTemplate(item)?.name || item.manualName || 'Økt',
      ...assessHeartRateZoneCompliance({
        distribution: item.heartRateZoneDistribution,
        completed: item,
        template: resolveTemplate(item),
        profile,
        rules
      })
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const counts = assessments.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, { aligned: 0, mostly_aligned: 0, above_plan: 0, below_plan: 0, unknown: 0 });
  const knownCount = assessments.length - counts.unknown;
  return {
    totalCount: assessments.length,
    knownCount,
    counts,
    latest: assessments[0] || null,
    assessments,
    summary: knownCount
      ? `${counts.aligned + counts.mostly_aligned} av ${knownCount} vurderbare økter var i eller stort sett i tråd med planen.`
      : 'Ikke nok vurderbare økter med sonefordeling ennå.'
  };
}
