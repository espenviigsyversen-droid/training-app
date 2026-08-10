export const GARMIN_CSV_ADAPTER_VERSION = 1;
export const GARMIN_IMPORT_FINGERPRINT_VERSION = 1;

const MISSING_VALUE = '--';
const REQUIRED_HEADERS = ['Activity Type', 'Date', 'Title', 'Time', 'Distance'];
const CANONICAL_ENRICHMENT_FIELDS = [
  'durationSeconds',
  'durationDisplay',
  'durationMinutes',
  'distanceKm',
  'averageSpeedKmh',
  'paceSecondsPerKm',
  'paceDisplay',
  'avgHeartRate',
  'maxHeartRate',
  'elevationGainM',
  'activitySetting'
];

const ACTIVITY_TYPES = Object.freeze({
  'running': { code: 'running', appType: 'Løping', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'per_km' },
  'treadmill running': { code: 'treadmill_running', appType: 'Løping', activitySetting: 'treadmill', distanceUnit: 'km', paceKind: 'per_km' },
  'walking': { code: 'walking', appType: 'Gange', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'per_km' },
  'hiking': { code: 'hiking', appType: 'Gange', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'per_km' },
  'pool swim': { code: 'pool_swim', appType: 'Svømming', activitySetting: 'pool', distanceUnit: 'm', paceKind: 'per_100m' },
  'cycling': { code: 'cycling', appType: 'Sykling', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'speed_kmh' },
  'indoor cycling': { code: 'indoor_cycling', appType: 'Sykling', activitySetting: 'indoor', distanceUnit: 'km', paceKind: 'speed_kmh' },
  'cross country classic skiing': { code: 'cross_country_skiing', appType: 'Ski', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'speed_kmh' },
  'resort skiing': { code: 'resort_skiing', appType: 'Alpint', activitySetting: 'outdoor', distanceUnit: 'km', paceKind: 'speed_kmh' },
  'strength training': { code: 'strength_training', appType: 'Styrke', distanceUnit: 'km', paceKind: 'none' }
});

function cleanText(value, maxLength = 500) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isMissing(value) {
  const text = cleanText(value);
  return !text || text === MISSING_VALUE;
}

function optionalNumber(value) {
  if (isMissing(value)) return '';
  const normalized = cleanText(value).replace(/^'/, '').replaceAll(',', '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : '';
}

function optionalInteger(value) {
  const number = optionalNumber(value);
  return number === '' ? '' : Math.round(number);
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return '';
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function formatPace(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function parseGarminDuration(value) {
  if (isMissing(value)) return '';
  const parts = cleanText(value).split(':');
  if (parts.length !== 2 && parts.length !== 3) return '';
  const numbers = parts.map(Number);
  if (numbers.some(number => !Number.isFinite(number) || number < 0)) return '';
  const [hours, minutes, seconds] = parts.length === 3 ? numbers : [0, ...numbers];
  if (minutes >= 60 || seconds >= 60) return '';
  return Math.round((hours * 3600) + (minutes * 60) + seconds);
}

export function parseGarminLocalDateTime(value) {
  const text = cleanText(value, 40);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, date, hours, minutes, seconds] = match;
  const dateValue = new Date(`${date}T${hours}:${minutes}:${seconds}Z`);
  if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) return null;
  if (Number(hours) > 23 || Number(minutes) > 59 || Number(seconds) > 59) return null;
  return { date, startedAtLocal: `${date}T${hours}:${minutes}:${seconds}` };
}

export function parseCsvDocument(csvText) {
  const source = String(csvText ?? '').replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      if (row.some(cell => cleanText(cell))) records.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV-filen har et tekstfelt som ikke er avsluttet.');
  if (value || row.length) {
    row.push(value.replace(/\r$/, ''));
    if (row.some(cell => cleanText(cell))) records.push(row);
  }
  if (!records.length) throw new Error('CSV-filen er tom.');

  const headers = records[0].map(header => cleanText(header, 120));
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeaders.length) throw new Error(`CSV-filen har dupliserte kolonner: ${[...new Set(duplicateHeaders)].join(', ')}.`);

  const rows = [];
  const rejectedRows = [];
  records.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    if (cells.length !== headers.length) {
      rejectedRows.push({ rowNumber, reason: `Forventet ${headers.length} felt, fant ${cells.length}.` });
      return;
    }
    rows.push({
      rowNumber,
      values: Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex]]))
    });
  });
  return { headers, rows, rejectedRows };
}

export function garminActivityType(value) {
  const raw = cleanText(value, 80);
  return ACTIVITY_TYPES[raw.toLowerCase()] || {
    code: 'other',
    appType: 'Annet',
    distanceUnit: 'km',
    paceKind: 'none'
  };
}

function stableHash(value) {
  const text = String(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
}

export function garminImportFingerprint({ activityCode, startedAtLocal, durationSeconds, distanceKm }) {
  const distanceMeters = Math.round((Number(distanceKm) || 0) * 1000);
  const basis = [
    `v${GARMIN_IMPORT_FINGERPRINT_VERSION}`,
    cleanText(activityCode, 60).toLowerCase(),
    cleanText(startedAtLocal, 40),
    Math.round(Number(durationSeconds) || 0),
    distanceMeters
  ].join('|');
  return `garmin_csv_v${GARMIN_IMPORT_FINGERPRINT_VERSION}_${stableHash(basis)}`;
}

function compactObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [key, item && typeof item === 'object' && !Array.isArray(item) ? compactObject(item) : item])
    .filter(([, item]) => item !== '' && item !== null && item !== undefined && !(typeof item === 'object' && !Array.isArray(item) && !Object.keys(item).length)));
}

function paceMetrics(row, type) {
  const average = row['Avg Pace'];
  const best = row['Best Pace'];
  if (type.paceKind === 'per_km') {
    return compactObject({
      averagePaceSecondsPerKm: parseGarminDuration(average),
      bestPaceSecondsPerKm: parseGarminDuration(best),
      averageGapSecondsPerKm: parseGarminDuration(row['Avg GAP'])
    });
  }
  if (type.paceKind === 'per_100m') {
    return compactObject({
      averagePaceSecondsPer100m: parseGarminDuration(average),
      bestPaceSecondsPer100m: parseGarminDuration(best)
    });
  }
  if (type.paceKind === 'speed_kmh') {
    return compactObject({ averageSpeedKmh: optionalNumber(average), maxSpeedKmh: optionalNumber(best) });
  }
  return {};
}

export function mapGarminActivityRow(row, { rowNumber = 0 } = {}) {
  const dateTime = parseGarminLocalDateTime(row?.Date);
  const type = garminActivityType(row?.['Activity Type']);
  const durationSeconds = parseGarminDuration(row?.Time);
  const sourceDistance = optionalNumber(row?.Distance);
  if (!dateTime) return { valid: false, rowNumber, reason: 'Ugyldig dato eller starttid.' };
  if (!durationSeconds) return { valid: false, rowNumber, reason: 'Ugyldig eller manglende øktvarighet.' };
  if (sourceDistance === '') return { valid: false, rowNumber, reason: 'Ugyldig eller manglende distanse.' };

  const distanceKm = type.distanceUnit === 'm' ? round(sourceDistance / 1000, 3) : round(sourceDistance, 3);
  const averageSpeedKmh = durationSeconds && distanceKm ? round(distanceKm / (durationSeconds / 3600), 2) : '';
  const pace = paceMetrics(row, type);
  const canonicalPace = type.paceKind === 'per_km' ? pace.averagePaceSecondsPerKm || '' : '';
  const fingerprint = garminImportFingerprint({
    activityCode: type.code,
    startedAtLocal: dateTime.startedAtLocal,
    durationSeconds,
    distanceKm
  });
  const title = cleanText(row?.Title, 160) || type.appType;

  const garmin = compactObject({
    version: GARMIN_CSV_ADAPTER_VERSION,
    adapter: 'activities_csv',
    fingerprint,
    fingerprintVersion: GARMIN_IMPORT_FINGERPRINT_VERSION,
    startedAtLocal: dateTime.startedAtLocal,
    activityType: cleanText(row?.['Activity Type'], 80),
    activityCode: type.code,
    sourceDistance: { value: sourceDistance, unit: type.distanceUnit },
    calories: optionalInteger(row?.Calories),
    movingTimeSeconds: parseGarminDuration(row?.['Moving Time']),
    elapsedTimeSeconds: parseGarminDuration(row?.['Elapsed Time']),
    aerobicTrainingEffect: optionalNumber(row?.['Aerobic TE']),
    cadence: { averageSpm: optionalNumber(row?.['Avg Run Cadence']), maxSpm: optionalNumber(row?.['Max Run Cadence']) },
    pace,
    totalDescentM: optionalNumber(row?.['Total Descent']),
    strideLengthM: optionalNumber(row?.['Avg Stride Length']),
    verticalRatioPercent: optionalNumber(row?.['Avg Vertical Ratio']),
    verticalOscillationCm: optionalNumber(row?.['Avg Vertical Oscillation']),
    groundContactTimeMs: optionalNumber(row?.['Avg Ground Contact Time']),
    normalizedPowerW: optionalNumber(row?.['Normalized Power® (NP®)']),
    trainingStressScore: optionalNumber(row?.['Training Stress Score®']),
    averagePowerW: optionalNumber(row?.['Avg Power']),
    maxPowerW: optionalNumber(row?.['Max Power']),
    totalStrokes: optionalInteger(row?.['Total Strokes']),
    averageSwolf: optionalNumber(row?.['Avg. Swolf']),
    averageStrokeRate: optionalNumber(row?.['Avg Stroke Rate']),
    steps: optionalInteger(row?.Steps),
    totalReps: optionalInteger(row?.['Total Reps']),
    totalSets: optionalInteger(row?.['Total Sets']),
    bodyBatteryDrain: optionalNumber(row?.['Body Battery Drain']),
    temperatureC: { min: optionalNumber(row?.['Min Temp']), max: optionalNumber(row?.['Max Temp']) },
    respiration: { average: optionalNumber(row?.['Avg Resp']), min: optionalNumber(row?.['Min Resp']), max: optionalNumber(row?.['Max Resp']) },
    numberOfLaps: optionalInteger(row?.['Number of Laps']),
    elevationM: { min: optionalNumber(row?.['Min Elevation']), max: optionalNumber(row?.['Max Elevation']) }
  });

  return {
    valid: true,
    rowNumber,
    fingerprint,
    activityCode: type.code,
    completedDraft: {
      date: dateTime.date,
      manualName: title,
      activityType: type.appType,
      durationSeconds,
      durationDisplay: formatDuration(durationSeconds),
      durationMinutes: Math.round(durationSeconds / 60),
      distanceKm,
      averageSpeedKmh,
      paceSecondsPerKm: canonicalPace,
      paceDisplay: canonicalPace ? formatPace(canonicalPace) : '',
      avgHeartRate: optionalInteger(row?.['Avg HR']),
      maxHeartRate: optionalInteger(row?.['Max HR']),
      elevationGainM: optionalNumber(row?.['Total Ascent']),
      activitySetting: type.activitySetting || '',
      source: 'garmin_csv',
      externalData: { garmin }
    }
  };
}

export function parseGarminActivitiesCsv(csvText) {
  const parsed = parseCsvDocument(csvText);
  const missingHeaders = REQUIRED_HEADERS.filter(header => !parsed.headers.includes(header));
  if (missingHeaders.length) throw new Error(`CSV-filen mangler obligatoriske Garmin-kolonner: ${missingHeaders.join(', ')}.`);

  const activities = [];
  const rejectedRows = [...parsed.rejectedRows];
  parsed.rows.forEach(({ rowNumber, values }) => {
    const mapped = mapGarminActivityRow(values, { rowNumber });
    if (mapped.valid) activities.push(mapped);
    else rejectedRows.push({ rowNumber, reason: mapped.reason });
  });

  return {
    version: GARMIN_CSV_ADAPTER_VERSION,
    source: 'garmin_activities_csv',
    headers: parsed.headers,
    activities,
    rejectedRows
  };
}

function normalizedActivityCode(value) {
  const text = cleanText(value, 80).toLowerCase();
  if (!text) return 'other';
  const direct = ACTIVITY_TYPES[text];
  if (direct) return direct.code;
  if (text.includes('mølle') || text.includes('treadmill')) return 'treadmill_running';
  if (text.includes('løp') || text.includes('running')) return 'running';
  if (text.includes('styrke') || text.includes('strength')) return 'strength_training';
  if (text.includes('sykkel') || text.includes('cycling')) return 'cycling';
  if (text.includes('ski')) return 'cross_country_skiing';
  if (text.includes('gå') || text.includes('gang') || text.includes('walk') || text.includes('hiking')) return 'walking';
  if (text.includes('svøm') || text.includes('swim')) return 'pool_swim';
  return text.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'other';
}

function targetSummary(target = {}) {
  const template = target.templateSnapshot || target.template || {};
  return {
    date: cleanText(target.date, 10),
    activityCode: normalizedActivityCode(target.activityCode || target.activityType || template.type),
    durationSeconds: Number(target.durationSeconds) || (Number(target.durationMinutes) || 0) * 60,
    distanceKm: Number(target.distanceKm) || 0,
    title: cleanText(target.manualName || target.title || template.name, 160)
  };
}

function metricCloseness(left, right, tightAbsolute, tightRelative, looseAbsolute, looseRelative) {
  if (!(left > 0) || !(right > 0)) return { known: false, tight: false, loose: false };
  const difference = Math.abs(left - right);
  const relative = difference / Math.max(left, right);
  return {
    known: true,
    tight: difference <= tightAbsolute || relative <= tightRelative,
    loose: difference <= looseAbsolute || relative <= looseRelative
  };
}

function titleOverlap(left, right) {
  const tokens = value => new Set(cleanText(value).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(token => token.length >= 4));
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  return [...leftTokens].some(token => rightTokens.has(token));
}

export function classifyGarminMatch(candidate, target) {
  const source = candidate?.completedDraft ? {
    ...targetSummary(candidate.completedDraft),
    activityCode: candidate.activityCode || candidate.completedDraft.externalData?.garmin?.activityCode || 'other'
  } : targetSummary(candidate);
  const comparison = targetSummary(target);
  if (!source.date || source.date !== comparison.date) return { level: 'none', score: 0, reasons: ['annen dato'] };

  let score = 25;
  const reasons = ['samme dato'];
  const sameType = source.activityCode === comparison.activityCode ||
    (new Set(['running', 'treadmill_running']).has(source.activityCode) && new Set(['running', 'treadmill_running']).has(comparison.activityCode));
  if (sameType) {
    score += 30;
    reasons.push('samme aktivitetstype');
  } else if (comparison.activityCode !== 'other') {
    score -= 20;
  }

  const duration = metricCloseness(source.durationSeconds, comparison.durationSeconds, 120, 0.10, 300, 0.20);
  if (duration.tight) {
    score += 20;
    reasons.push('svært lik varighet');
  } else if (duration.loose) {
    score += 8;
    reasons.push('omtrent lik varighet');
  }

  const distance = metricCloseness(source.distanceKm, comparison.distanceKm, 0.25, 0.05, 1, 0.15);
  if (distance.tight) {
    score += 20;
    reasons.push('svært lik distanse');
  } else if (distance.loose) {
    score += 8;
    reasons.push('omtrent lik distanse');
  }

  if (titleOverlap(source.title, comparison.title)) {
    score += 10;
    reasons.push('lignende navn');
  }

  const level = sameType && score >= 65 ? 'secure' : score >= 35 ? 'possible' : 'none';
  return { level, score: Math.max(0, score), reasons };
}

export function garminDuplicateFor(candidate, completedItems = []) {
  const fingerprint = candidate?.fingerprint || candidate?.completedDraft?.externalData?.garmin?.fingerprint;
  if (!fingerprint || !Array.isArray(completedItems)) return null;
  return completedItems.find(item => item?.externalData?.garmin?.fingerprint === fingerprint) || null;
}

export function suggestGarminMatches(candidate, targets = []) {
  if (!Array.isArray(targets)) return [];
  return targets
    .map(target => ({ target, ...classifyGarminMatch(candidate, target) }))
    .filter(match => match.level !== 'none')
    .sort((left, right) => right.score - left.score);
}

function emptyCanonicalValue(value) {
  return value === '' || value === null || value === undefined;
}

export function mergeGarminIntoCompleted(existing, candidate, { overwriteFields = [], importedAt = '' } = {}) {
  const current = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
  const draft = candidate?.completedDraft || candidate || {};
  const allowedOverwrite = new Set(overwriteFields.filter(field => CANONICAL_ENRICHMENT_FIELDS.includes(field)));
  const merged = { ...current };
  CANONICAL_ENRICHMENT_FIELDS.forEach(field => {
    if (!emptyCanonicalValue(draft[field]) && (emptyCanonicalValue(current[field]) || allowedOverwrite.has(field))) {
      merged[field] = draft[field];
    }
  });
  const candidateGarmin = draft.externalData?.garmin;
  const garmin = candidateGarmin && typeof candidateGarmin === 'object' && !Array.isArray(candidateGarmin)
    ? compactObject({ ...candidateGarmin, importedAt: cleanText(importedAt, 40) })
    : null;
  if (garmin && Object.keys(garmin).length) {
    merged.externalData = { ...(current.externalData || {}), garmin };
  }
  return merged;
}
