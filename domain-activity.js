export const ACTIVITY_SETTING_LABELS = Object.freeze({
  outdoor: 'Utendørs',
  treadmill: 'Tredemølle',
  indoor: 'Innendørs',
  pool: 'Basseng'
});

const ACTIVITY_SETTING_ALIASES = Object.freeze({
  outdoor: 'outdoor',
  outdoors: 'outdoor',
  utendors: 'outdoor',
  utendoers: 'outdoor',
  treadmill: 'treadmill',
  tredemolle: 'treadmill',
  tredemoelle: 'treadmill',
  indoor: 'indoor',
  indoors: 'indoor',
  innendors: 'indoor',
  innendoers: 'indoor',
  pool: 'pool',
  basseng: 'pool'
});

const ACTIVITY_CODE_SETTINGS = Object.freeze({
  running: 'outdoor',
  treadmill_running: 'treadmill',
  walking: 'outdoor',
  hiking: 'outdoor',
  cycling: 'outdoor',
  indoor_cycling: 'indoor',
  pool_swim: 'pool',
  cross_country_skiing: 'outdoor',
  resort_skiing: 'outdoor'
});

function normalizedKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function normalizeActivitySetting(value) {
  const key = normalizedKey(value);
  return ACTIVITY_SETTING_ALIASES[key] || '';
}

export function activitySettingFromActivityCode(value) {
  const key = normalizedKey(value);
  return ACTIVITY_CODE_SETTINGS[key] || '';
}

export function activitySettingForCompleted(completed = {}) {
  const explicit = normalizeActivitySetting(completed.activitySetting);
  if (explicit) return explicit;
  const imported = activitySettingFromActivityCode(
    completed?.externalData?.garmin?.activityCode || completed?.externalData?.garmin?.activityType
  );
  if (imported) return imported;
  return Number(completed.treadmillInclinePercent) > 0 ? 'treadmill' : '';
}

export function activitySettingLabel(value) {
  return ACTIVITY_SETTING_LABELS[normalizeActivitySetting(value)] || '';
}
