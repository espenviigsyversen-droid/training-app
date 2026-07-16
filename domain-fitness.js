export const FITNESS_ASSESSMENT_VERSION = 2;

export const FITNESS_LEVELS = Object.freeze([
  { id: 'foundation', rank: 1, label: 'Fundament', coachLevel: 'building_beginner' },
  { id: 'stable', rank: 2, label: 'Stabil', coachLevel: 'building_beginner' },
  { id: 'developing', rank: 3, label: 'I utvikling', coachLevel: 'intermediate' },
  { id: 'well_trained', rank: 4, label: 'Godt trent', coachLevel: 'intermediate' },
  { id: 'experienced', rank: 5, label: 'Erfaren', coachLevel: 'experienced' }
]);

export const FITNESS_REFERENCE_SOURCES = Object.freeze({
  vo2: {
    id: 'hunt3-vo2max-2013',
    label: 'HUNT 3 Fitness',
    population: 'Friske norske kvinner og menn, 20-90 år',
    method: 'Direkte målt VO2max ved tredemølletest',
    url: 'https://doi.org/10.1371/journal.pone.0064319'
  },
  vo2CrossCheck: {
    id: 'friend-cpx-2016',
    label: 'FRIEND Registry',
    population: 'Tredemølle-CPX, alders- og kjønnsspesifikke referanser',
    method: 'Direkte målt VO2max',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4919021/'
  },
  raceAgeGrading: {
    id: 'wma-road-standards-pending',
    label: 'World Masters Athletics',
    status: 'not_used',
    note: 'Offisiell aldersgradering brukes ikke før en komplett, verifisert tabell er implementert.',
    url: 'https://world-masters-athletics.org/documents/competition-rules/'
  }
});

// HUNT 3 arithmetic mean and SD for directly measured VO2max (mL/kg/min).
// The published 70-79 group is reported as 70+ and is therefore labelled accordingly in output.
const HUNT_VO2_REFERENCE = Object.freeze({
  male: [
    { min: 20, max: 29, mean: 54.4, sd: 8.4 },
    { min: 30, max: 39, mean: 49.1, sd: 7.5 },
    { min: 40, max: 49, mean: 47.2, sd: 7.7 },
    { min: 50, max: 59, mean: 42.6, sd: 7.4 },
    { min: 60, max: 69, mean: 39.2, sd: 6.7 },
    { min: 70, max: 120, mean: 35.3, sd: 6.5 }
  ],
  female: [
    { min: 20, max: 29, mean: 43.0, sd: 7.7 },
    { min: 30, max: 39, mean: 40.0, sd: 6.8 },
    { min: 40, max: 49, mean: 38.4, sd: 6.9 },
    { min: 50, max: 59, mean: 34.4, sd: 5.7 },
    { min: 60, max: 69, mean: 31.1, sd: 5.1 },
    { min: 70, max: 120, mean: 28.3, sd: 5.2 }
  ]
});

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseDate(dateIso) {
  const date = new Date(`${String(dateIso || '').slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(dateIso, days) {
  const date = parseDate(dateIso);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function mondayKey(dateIso) {
  const date = parseDate(dateIso);
  if (!date) return '';
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function levelById(id) {
  return FITNESS_LEVELS.find(level => level.id === id) || FITNESS_LEVELS[0];
}

function levelByRank(rank) {
  return FITNESS_LEVELS.find(level => level.rank === rank) || FITNESS_LEVELS[0];
}

function inferredTierForCoachLevel(coachLevel) {
  if (coachLevel === 'experienced') return 'experienced';
  if (coachLevel === 'intermediate') return 'developing';
  return 'foundation';
}

export function normalizeTrainingLevelProgress(value = {}, coachLevel = 'building_beginner') {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const inferred = inferredTierForCoachLevel(coachLevel);
  const highest = levelById(source.highestTier || inferred);
  const history = Array.isArray(source.history) ? source.history : [];
  return {
    version: FITNESS_ASSESSMENT_VERSION,
    highestTier: highest.id,
    history: history
      .filter(entry => entry && typeof entry === 'object')
      .map(entry => ({
        id: String(entry.id || ''),
        date: String(entry.date || '').slice(0, 10),
        fromTier: levelById(entry.fromTier).id,
        toTier: levelById(entry.toTier).id,
        fromCoachLevel: String(entry.fromCoachLevel || ''),
        toCoachLevel: String(entry.toCoachLevel || ''),
        assessmentVersion: finiteNumber(entry.assessmentVersion, FITNESS_ASSESSMENT_VERSION),
        reason: String(entry.reason || '').slice(0, 240)
      }))
      .filter(entry => entry.date && entry.toTier)
      .slice(-20)
  };
}

export function vo2AgeBenchmark({ vo2Max, age, sex } = {}) {
  const value = finiteNumber(vo2Max);
  const normalizedAge = Math.floor(finiteNumber(age));
  const normalizedSex = String(sex || '').toLowerCase();
  const reference = HUNT_VO2_REFERENCE[normalizedSex]?.find(row => normalizedAge >= row.min && normalizedAge <= row.max);
  if (!value || !reference) {
    return {
      available: false,
      value: value || null,
      reason: !value ? 'Mangler VO2-måling' : 'Mangler alder eller kjønn for aldersreferanse',
      source: FITNESS_REFERENCE_SOURCES.vo2
    };
  }
  const zScore = (value - reference.mean) / reference.sd;
  let status = 'typical';
  let label = 'Omtrent som referansen';
  if (zScore < -1) { status = 'low'; label = 'Lavere enn referansen'; }
  else if (zScore < -0.25) { status = 'below'; label = 'Litt under referansen'; }
  else if (zScore >= 1.25) { status = 'high'; label = 'Klart over referansen'; }
  else if (zScore >= 0.5) { status = 'above'; label = 'Over referansen'; }
  const ageLabel = reference.max >= 120 ? `${reference.min}+` : `${reference.min}-${reference.max}`;
  return {
    available: true,
    value,
    age: normalizedAge,
    sex: normalizedSex,
    ageLabel,
    mean: reference.mean,
    sd: reference.sd,
    typicalLow: Math.max(0, Math.round((reference.mean - reference.sd) * 10) / 10),
    typicalHigh: Math.round((reference.mean + reference.sd) * 10) / 10,
    zScore: Math.round(zScore * 100) / 100,
    status,
    label,
    source: FITNESS_REFERENCE_SOURCES.vo2,
    caveat: 'Garmin-estimat og laboratoriemålt VO2max er ikke samme målemetode.'
  };
}

export function personalBestEvidence(raceResults = []) {
  const valid = (Array.isArray(raceResults) ? raceResults : [])
    .filter(result => finiteNumber(result.distanceKm) > 0 && finiteNumber(result.resultSeconds) > 0 && result.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const groups = new Map();
  valid.forEach(result => {
    const key = finiteNumber(result.distanceKm).toFixed(3);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  });
  let bestImprovement = null;
  groups.forEach(items => {
    if (items.length < 2) return;
    const first = finiteNumber(items[0].resultSeconds);
    const best = Math.min(...items.map(item => finiteNumber(item.resultSeconds)).filter(Boolean));
    if (!first || !best || best >= first) return;
    const improvementPercent = ((first - best) / first) * 100;
    if (!bestImprovement || improvementPercent > bestImprovement.improvementPercent) {
      bestImprovement = {
        distanceKm: finiteNumber(items[0].distanceKm),
        firstSeconds: first,
        bestSeconds: best,
        improvementPercent: Math.round(improvementPercent * 10) / 10,
        resultCount: items.length
      };
    }
  });
  return {
    available: valid.length > 0,
    resultCount: valid.length,
    distanceCount: groups.size,
    repeatedDistanceCount: [...groups.values()].filter(items => items.length >= 2).length,
    bestImprovement,
    note: bestImprovement
      ? `${bestImprovement.improvementPercent}% forbedring på ${bestImprovement.distanceKm} km fra første til beste resultat.`
      : valid.length ? 'PB-er er registrert, men det trengs gjentatte resultater på samme distanse for en tydelig trend.' : 'Ingen PB-/testresultater registrert.'
  };
}

function completedWindow(completed, todayIso, days) {
  const from = addDays(todayIso, -(days - 1));
  return (Array.isArray(completed) ? completed : []).filter(item => item?.date >= from && item?.date <= todayIso);
}

function activeWeekCount(completed) {
  const weekCounts = new Map();
  completed.forEach(item => {
    const key = mondayKey(item.date);
    if (key) weekCounts.set(key, (weekCounts.get(key) || 0) + 1);
  });
  return [...weekCounts.values()].filter(count => count >= 2).length;
}

function observationWeeks(completed, todayIso) {
  const dates = completed
    .map(item => String(item?.date || '').slice(0, 10))
    .filter(date => parseDate(date) && date <= todayIso)
    .sort();
  if (!dates.length) return 0;
  const first = parseDate(dates[0]);
  const today = parseDate(todayIso);
  return Math.max(1, Math.floor((today - first) / 604800000) + 1);
}

function qualityEvidence(item = {}) {
  const rpe = optionalNumber(item.rpe);
  const feeling = optionalNumber(item.feelingScore);
  const painBefore = optionalNumber(item.painBefore);
  const painAfter = optionalNumber(item.painAfter);
  const hasPainResponse = painBefore !== null && painAfter !== null;
  const hasBodyResponse = feeling !== null || hasPainResponse;
  const sufficient = rpe !== null && hasBodyResponse;
  const painControlled = !hasPainResponse || (painAfter <= 2 && painAfter <= painBefore + 1);
  const feelingControlled = feeling === null || feeling >= 3;
  return {
    sufficient,
    controlled: sufficient && rpe <= 7 && painControlled && feelingControlled
  };
}

function dimension(id, label, score, status, summary, evidence = []) {
  return { id, label, score: clamp(Math.round(score), 0, 100), status, summary, evidence };
}

export function assessTrainingLevel(input = {}) {
  const todayIso = String(input.todayIso || new Date().toISOString().slice(0, 10));
  const completedAll = (Array.isArray(input.completed) ? input.completed : [])
    .filter(item => item?.date && item.date <= todayIso);
  const completed84 = completedWindow(input.completed, todayIso, 84);
  const completed28 = completedWindow(completed84, todayIso, 28);
  const completed182 = completedWindow(completedAll, todayIso, 182);
  const activeWeeks = activeWeekCount(completed84);
  const activeWeeks26 = activeWeekCount(completed182);
  const observedWeeks = observationWeeks(completedAll, todayIso);
  const qualityItems = completed84.filter(item => item.intensityContext === 'quality');
  const qualityWithSignals = qualityItems.filter(item => qualityEvidence(item).sufficient);
  const controlledQuality = qualityWithSignals.filter(item => qualityEvidence(item).controlled);
  const unknownQualityCount = qualityItems.length - qualityWithSignals.length;
  const qualityTolerance = qualityWithSignals.length ? controlledQuality.length / qualityWithSignals.length : 0;
  const qualityCoverage = qualityItems.length ? qualityWithSignals.length / qualityItems.length : 0;
  const bodyObservedItems = completed28.filter(item => {
    const feeling = optionalNumber(item.feelingScore);
    const before = optionalNumber(item.painBefore);
    const after = optionalNumber(item.painAfter);
    return feeling !== null || (before !== null && after !== null);
  });
  const bodyCoverage = completed28.length ? bodyObservedItems.length / completed28.length : 0;
  const negativeBodySignals = completed28.filter(item => {
    const before = optionalNumber(item.painBefore);
    const after = optionalNumber(item.painAfter);
    const feeling = optionalNumber(item.feelingScore);
    return (after !== null && before !== null && (after >= 4 || after > before + 1)) || (feeling !== null && feeling <= 2);
  }).length;
  const vo2 = vo2AgeBenchmark({ vo2Max: input.vo2Max, age: input.age, sex: input.sex });
  const performance = personalBestEvidence(input.raceResults);
  const volumeStatus = String(input.volumeRamp?.status || 'neutral');
  const activeInjury = Boolean(input.activeInjury);
  const comebackActive = Boolean(input.comeback?.active);
  const safetyBlockers = [
    activeInjury ? 'Aktivt kroppssignal' : '',
    comebackActive ? 'Comeback-protokoll er aktiv' : '',
    ['high', 'red', 'caution'].includes(volumeStatus) ? 'Belastningsøkningen må stabiliseres' : ''
  ].filter(Boolean);

  const continuityScore = clamp((activeWeeks / 10) * 100, 0, 100);
  const qualityScore = qualityItems.length
    ? qualityWithSignals.length
      ? clamp((Math.min(qualityWithSignals.length, 8) / 8) * 40 + qualityTolerance * 45 + qualityCoverage * 15, 0, 100)
      : 20
    : 15;
  const bodyScore = clamp(55 + Math.min(1, bodyCoverage / 0.6) * 45 - negativeBodySignals * 24 - (activeInjury ? 35 : 0), 0, 100);
  const capacityScore = vo2.available
    ? clamp(55 + vo2.zScore * 24, 10, 100)
    : 45;
  const performanceScore = performance.bestImprovement
    ? clamp(60 + performance.bestImprovement.improvementPercent * 5, 55, 100)
    : performance.available ? 50 : 35;

  const dimensions = [
    dimension('continuity', 'Kontinuitet', continuityScore, activeWeeks >= 8 ? 'good' : activeWeeks >= 4 ? 'watch' : 'neutral', `${activeWeeks} aktive uker av de siste 12`, [`${completed84.length} økter siste 12 uker`]),
    dimension('quality', 'Kontrollert kvalitet', qualityScore, qualityWithSignals.length >= 4 && qualityTolerance >= 0.7 && qualityCoverage >= 0.5 ? 'good' : qualityItems.length ? 'watch' : 'neutral', qualityItems.length ? `${controlledQuality.length} av ${qualityWithSignals.length} dokumenterte kvalitetsøkter var kontrollerte${unknownQualityCount ? ` · ${unknownQualityCount} uten nok signaldata` : ''}` : 'Ingen tydelig kvalitetsserie ennå', unknownQualityCount ? ['Manglende RPE eller respons etter økten regnes som ukjent, ikke kontrollert'] : []),
    dimension('body', 'Tåleevne og kroppssignal', bodyScore, activeInjury || negativeBodySignals ? 'watch' : bodyObservedItems.length >= 4 ? 'good' : 'neutral', activeInjury ? 'Aktivt kroppssignal blokkerer nivåoppgradering' : negativeBodySignals ? `${negativeBodySignals} negativ${negativeBodySignals === 1 ? 't' : 'e'} signal siste 28 dager` : bodyObservedItems.length ? `Ingen negative signaler i ${bodyObservedItems.length} registrerte responser siste 28 dager` : 'For lite registrert respons etter øktene', []),
    dimension('capacity', 'Kapasitet mot alder', capacityScore, vo2.available ? (['above', 'high'].includes(vo2.status) ? 'good' : vo2.status === 'low' ? 'watch' : 'neutral') : 'neutral', vo2.available ? `${vo2.value} VO2max: ${vo2.label.toLowerCase()} for ${vo2.ageLabel} år` : vo2.reason, vo2.available ? [`HUNT-referanse ${vo2.mean} +/- ${vo2.sd}`] : []),
    dimension('performance', 'PB og testløp', performanceScore, performance.bestImprovement ? 'good' : performance.available ? 'neutral' : 'neutral', performance.note, [])
  ];
  const score = Math.round(
    continuityScore * 0.3 + qualityScore * 0.25 + bodyScore * 0.2 + capacityScore * 0.15 + performanceScore * 0.1
  );

  let rank = 1;
  if (score >= 40 && completed84.length >= 8 && activeWeeks >= 4) rank = 2;
  if (score >= 58 && completed84.length >= 16 && activeWeeks >= 7 && controlledQuality.length >= 2) rank = 3;
  if (score >= 72 && completed84.length >= 24 && activeWeeks >= 9 && activeWeeks26 >= 14 && observedWeeks >= 16 && controlledQuality.length >= 4 && qualityTolerance >= 0.7 && qualityCoverage >= 0.5 && (vo2.available || performance.available)) rank = 4;
  if (score >= 86 && completed84.length >= 30 && activeWeeks >= 11 && activeWeeks26 >= 20 && observedWeeks >= 24 && controlledQuality.length >= 8 && qualityTolerance >= 0.8 && qualityCoverage >= 0.7 && bodyCoverage >= 0.5 && vo2.available && performance.repeatedDistanceCount) rank = 5;

  const level = levelByRank(rank);
  const progress = normalizeTrainingLevelProgress(input.progress, input.currentCoachLevel);
  const highestLevel = levelById(progress.highestTier);
  const nextLevel = FITNESS_LEVELS.find(candidate => candidate.rank === rank + 1) || null;
  const currentCoachLevel = String(input.currentCoachLevel || 'building_beginner');
  const hasNewAchievement = level.rank > highestLevel.rank;
  const confirmationLevel = hasNewAchievement ? levelByRank(Math.min(level.rank, highestLevel.rank + 1)) : highestLevel;
  const recommendedCoachLevel = confirmationLevel.coachLevel;
  const coachUpgrade = ['building_beginner', 'intermediate', 'experienced'].indexOf(recommendedCoachLevel) > ['building_beginner', 'intermediate', 'experienced'].indexOf(currentCoachLevel);
  const eligibleForConfirmation = (hasNewAchievement || coachUpgrade) && safetyBlockers.length === 0;
  const missingData = [
    vo2.available ? '' : 'VO2max med alder og kjønn',
    qualityWithSignals.length >= 4 ? '' : 'RPE og respons etter flere kvalitetsøkter',
    performance.repeatedDistanceCount ? '' : 'gjentatt testløp på samme distanse'
  ].filter(Boolean);
  const confidencePoints = [completed84.length >= 12, activeWeeks >= 6, observedWeeks >= 12, vo2.available, qualityWithSignals.length >= 4, qualityCoverage >= 0.5, bodyCoverage >= 0.4, performance.available].filter(Boolean).length;
  const confidence = confidencePoints >= 6 ? 'high' : confidencePoints >= 3 ? 'medium' : 'low';

  const nextCriteria = [];
  if (nextLevel) {
    if (activeWeeks < Math.min(11, rank + 5)) nextCriteria.push('Flere stabile uker med minst to økter');
    if (nextLevel.rank >= 4 && activeWeeks26 < 14) nextCriteria.push('Lengre observasjon med minst 14 aktive uker over flere måneder');
    if (nextLevel.rank >= 5 && activeWeeks26 < 20) nextCriteria.push('Langsiktig kontinuitet med minst 20 aktive uker siste halvår');
    if (controlledQuality.length < Math.min(6, rank + 2)) nextCriteria.push('Flere repeterbare kvalitetsøkter med kontrollert RPE og kroppssignal');
    if (!vo2.available) nextCriteria.push('Oppdatert VO2max for aldersreferanse');
    if (!performance.repeatedDistanceCount) nextCriteria.push('Et nytt kontrollert testløp på samme distanse');
  }

  return {
    version: FITNESS_ASSESSMENT_VERSION,
    todayIso,
    score,
    level,
    confirmationLevel,
    highestLevel,
    currentCoachLevel,
    recommendedCoachLevel,
    hasNewAchievement,
    coachUpgrade,
    eligibleForConfirmation,
    safetyBlockers,
    confidence,
    dimensions,
    vo2,
    performance,
    summary: eligibleForConfirmation
      ? `Datagrunnlaget peker mot ${level.label}. Neste nivå kan bekreftes trinnvis.`
      : safetyBlockers.length ? `${level.label} i datagrunnlaget, men oppgradering venter til sikkerhetssignalene er stabile.`
        : `Datagrunnlaget peker mot nivå ${level.rank}: ${level.label}.`,
    nextLevel,
    nextCriteria: [...new Set(nextCriteria)].slice(0, 3),
    missingData,
    evidence: {
      sessions84: completed84.length,
      sessions28: completed28.length,
      activeWeeks,
      activeWeeks26,
      observedWeeks,
      qualityCount: qualityItems.length,
      qualityEvidenceCount: qualityWithSignals.length,
      controlledQualityCount: controlledQuality.length,
      qualityTolerance: Math.round(qualityTolerance * 100),
      qualityCoverage: Math.round(qualityCoverage * 100),
      bodyCoverage: Math.round(bodyCoverage * 100),
      negativeBodySignals
    },
    references: FITNESS_REFERENCE_SOURCES
  };
}

export function confirmedTrainingLevelProgress(assessment, currentProgress = {}) {
  const normalized = normalizeTrainingLevelProgress(currentProgress, assessment?.currentCoachLevel);
  if (!assessment?.eligibleForConfirmation) return normalized;
  const from = levelById(normalized.highestTier);
  const proposed = assessment.confirmationLevel || assessment.level;
  const to = proposed.rank > from.rank ? levelByRank(Math.min(proposed.rank, from.rank + 1)) : from;
  const entry = {
    id: `fitness-${assessment.todayIso}-${to.id}`,
    date: assessment.todayIso,
    fromTier: from.id,
    toTier: to.id,
    fromCoachLevel: assessment.currentCoachLevel,
    toCoachLevel: assessment.coachUpgrade ? assessment.recommendedCoachLevel : assessment.currentCoachLevel,
    assessmentVersion: FITNESS_ASSESSMENT_VERSION,
    reason: assessment.summary
  };
  return normalizeTrainingLevelProgress({
    version: FITNESS_ASSESSMENT_VERSION,
    highestTier: to.id,
    history: [...normalized.history, entry]
  }, entry.toCoachLevel);
}

