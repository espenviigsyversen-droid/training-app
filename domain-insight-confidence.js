const CONFIDENCE_LEVELS = new Set(['high', 'medium', 'low', 'insufficient']);
const COVERAGE_LEVELS = new Set(['high', 'medium', 'low']);

function count(value) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function strings(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(value => String(value || '').trim())
    .filter(Boolean))];
}

function coverageLevel(percent) {
  if (percent >= 80) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function automaticConfidence(relevant, required, coverage) {
  if (relevant < required) return 'insufficient';
  if (coverage >= 80 && relevant >= Math.max(required * 2, required + 2)) return 'high';
  if (coverage >= 50) return 'medium';
  return 'low';
}

export function createInsightEvidence(input = {}) {
  const requestedRelevant = count(input.sample?.relevant ?? input.relevantCount);
  const total = Math.max(count(input.sample?.total ?? input.totalCount), requestedRelevant);
  const relevant = Math.min(total, requestedRelevant);
  const required = Math.max(1, count(input.sample?.required ?? input.requiredCount) || 1);
  const percent = input.coveragePercent === undefined
    ? total ? clampPercent((relevant / total) * 100) : 0
    : clampPercent(input.coveragePercent);
  const explicitCoverage = String(input.coverageLevel || '');
  const explicitConfidence = String(input.confidence || '');
  const facts = (Array.isArray(input.facts) ? input.facts : [])
    .filter(item => item && (item.value !== undefined || item.detail))
    .map(item => ({
      label: String(item.label || ''),
      value: String(item.value ?? ''),
      detail: String(item.detail || '')
    }))
    .filter(item => item.label && (item.value || item.detail));
  return {
    id: String(input.id || 'insight'),
    period: {
      label: String(input.period?.label || ''),
      from: String(input.period?.from || '').slice(0, 10),
      to: String(input.period?.to || '').slice(0, 10)
    },
    sample: {
      total,
      relevant,
      required,
      unit: String(input.sample?.unit || 'økter'),
      relevantLabel: String(input.sample?.relevantLabel || 'relevante')
    },
    coverage: {
      percent,
      level: COVERAGE_LEVELS.has(explicitCoverage) ? explicitCoverage : coverageLevel(percent)
    },
    confidence: {
      level: CONFIDENCE_LEVELS.has(explicitConfidence)
        ? explicitConfidence
        : automaticConfidence(relevant, required, percent)
    },
    facts,
    missing: strings(input.missing),
    caveat: String(input.caveat || '')
  };
}

function comparisonConfidence(comparisons = []) {
  const ready = comparisons.filter(item => item?.status === 'ready');
  if (!ready.length) return 'insufficient';
  return ready.every(item => item.confidence === 'high') ? 'high' : 'medium';
}

export function sameEffortInsightEvidence(insight = {}, { today = '' } = {}) {
  const diagnostics = insight.diagnostics || {};
  const comparisons = Array.isArray(insight.comparisons) ? insight.comparisons : [];
  const rejectedLabels = {
    not_easy: 'ikke rolig/base-intensjon',
    missing_setting: 'mangler aktivitetsmiljø',
    body_signal: 'har smerte eller aktiv tilpasning',
    high_rpe: 'har RPE 7+ uten kvalitetsintensjon',
    duration_distance: 'har varighet eller distanse utenfor området',
    heart_rate: 'mangler gyldig snittpuls',
    pace: 'mangler gyldig pace'
  };
  const missing = Object.entries(diagnostics.rejectedReasons || {})
    .filter(([reason, value]) => rejectedLabels[reason] && Number(value) > 0)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .map(([reason, value]) => `${value} ${rejectedLabels[reason]}`);
  comparisons.forEach(item => {
    const setting = item.setting === 'treadmill' ? 'Tredemølle' : 'Utendørs';
    if (item.status === 'ready') return;
    if (item.reason === 'heart_rate_gap') {
      missing.push(`${setting}: periodene har for ulik medianpuls${Number.isFinite(Number(item.heartRateGap)) ? ` (${Math.round(Number(item.heartRateGap))} bpm)` : ''}`);
    } else if (item.reason === 'duration_gap') {
      missing.push(`${setting}: periodene har for ulik varighet`);
    } else if (Number(item.eligibleCount || 0) < 8) {
      missing.push(`${setting}: ${Number(item.eligibleCount || 0)} av minst 8 økter kan inngå i periodesammenligningen`);
    }
  });
  const facts = comparisons.map(item => ({
    label: item.setting === 'treadmill' ? 'Tredemølle' : 'Utendørs',
    value: `${Number(item.candidateCount || 0)} kandidater`,
    detail: `${Number(item.eligibleCount || 0)} sammenlignbare · ${item.paceSource === 'gap' ? 'GAP' : 'pace'}`
  }));
  const comparableCount = comparisons.reduce((sum, item) => sum + Number(item.eligibleCount || 0), 0);
  return createInsightEvidence({
    id: 'same-effort',
    period: { label: 'Historiske registrerte løpeøkter', to: today },
    sample: {
      total: Number(diagnostics.runningCount || 0),
      relevant: Number(diagnostics.candidateCount || 0),
      required: 8,
      unit: 'løpeøkter',
      relevantLabel: 'kandidater'
    },
    confidence: comparisonConfidence(comparisons),
    facts,
    missing,
    caveat: `${comparableCount} økter passer valgt miljø- og GAP-/pacegrunnlag. RPE 6 kan inngå når øktintensjonen er rolig. En konklusjon krever fire tidligere og fire nyere økter med sammenlignbar puls og varighet.`
  });
}

export function trainingLevelInsightEvidence(assessment = {}, { today = '' } = {}) {
  const evidence = assessment.evidence || {};
  const components = [
    Number(evidence.sessions84) >= 12,
    Number(evidence.activeWeeks) >= 6,
    Number(evidence.observedWeeks) >= 12,
    Boolean(assessment.vo2?.available),
    Number(evidence.qualityEvidenceCount) >= 4,
    Number(evidence.qualityCoverage) >= 50,
    Number(evidence.bodyCoverage) >= 40,
    Boolean(assessment.performance?.available)
  ];
  const availableComponents = components.filter(Boolean).length;
  return createInsightEvidence({
    id: 'training-level',
    period: { label: 'Siste 12 uker, med langsiktig historikk', to: today },
    sample: { total: 8, relevant: availableComponents, required: 3, unit: 'grunnlagsdeler', relevantLabel: 'tilgjengelige' },
    confidence: assessment.confidence,
    coveragePercent: (availableComponents / 8) * 100,
    facts: [
      { label: 'Økter', value: String(Number(evidence.sessions84 || 0)), detail: 'siste 12 uker' },
      { label: 'Aktive uker', value: String(Number(evidence.activeWeeks || 0)), detail: 'av siste 12' },
      { label: 'Kontrollert kvalitet', value: String(Number(evidence.controlledQualityCount || 0)), detail: `${Number(evidence.qualityCoverage || 0)} % dokumentert` },
      { label: 'Kroppsrespons', value: `${Number(evidence.bodyCoverage || 0)} %`, detail: 'dekning siste 28 dager' }
    ],
    missing: assessment.missingData,
    caveat: 'Treningsnivå kombinerer kontinuitet, kontrollert kvalitet, kroppssignal, kapasitet og repeterbar prestasjon. Ingen enkeltmåling avgjør nivået.'
  });
}

export function intensityBalanceInsightEvidence(balance = {}, { from = '', to = '' } = {}) {
  const missing = Number(balance.unknownCount || 0)
    ? [`${Number(balance.unknownCount)} økter kunne ikke klassifiseres som rolige eller harde`]
    : [];
  return createInsightEvidence({
    id: 'intensity-balance',
    period: { label: `Siste ${Number(balance.windowDays || 14)} dager`, from, to },
    sample: {
      total: Number(balance.totalCount || 0),
      relevant: Number(balance.classifiedCount || 0),
      required: 3,
      unit: 'økter',
      relevantLabel: 'klassifiserte'
    },
    confidence: balance.verdict === 'insufficient_data'
      ? 'insufficient'
      : Number(balance.classifiedCount || 0) >= 6 && !Number(balance.unknownCount || 0) ? 'high' : 'medium',
    facts: [
      { label: 'Rolige', value: String(Number(balance.easyCount || 0)), detail: `${Number(balance.easyShare || 0)} %` },
      { label: 'Harde', value: String(Number(balance.hardCount || 0)), detail: `${Number(balance.hardShare || 0)} %` },
      { label: 'Base med høy puls', value: String(Number(balance.highPulseBaseCount || 0)), detail: 'teller som rolig støtte' }
    ],
    missing,
    caveat: 'Balansen bruker øktintensjon, struktur, RPE, puls og kroppssignal. Den beskriver fordelingen i perioden, ikke hvor mye du bør øke treningen.'
  });
}

export function zoneComplianceInsightEvidence(summary = {}, {
  totalSessions = 0,
  from = '',
  to = '',
  sourceLabel = ''
} = {}) {
  const total = Number(totalSessions || 0);
  const distributed = Number(summary.totalCount || 0);
  const known = Number(summary.knownCount || 0);
  const missing = [];
  if (total > distributed) missing.push(`${total - distributed} økter mangler sonefordeling`);
  if (distributed > known) missing.push(`${distributed - known} sonefordelinger har uklar øktintensjon`);
  return createInsightEvidence({
    id: 'zone-compliance',
    period: { label: 'Siste 28 dager', from, to },
    sample: { total, relevant: known, required: 3, unit: 'økter', relevantLabel: 'vurderbare' },
    confidence: known < 3 ? 'insufficient' : known >= 6 && total && known / total >= 0.7 ? 'high' : 'medium',
    facts: [
      { label: 'Sonefordeling', value: String(distributed), detail: `${total} økter totalt` },
      { label: 'Vurderbare', value: String(known), detail: sourceLabel || 'aktiv soneprofil' },
      { label: 'I tråd', value: String(Number(summary.counts?.aligned || 0) + Number(summary.counts?.mostly_aligned || 0)), detail: 'helt eller stort sett' }
    ],
    missing,
    caveat: 'Soneprosentene vurderes mot øktens hensikt. RPE, smerte og kroppssignal veier tyngre enn pulssonene.'
  });
}

export function wellnessTrendInsightEvidence(pointsByMetric = {}, { from = '', to = '' } = {}) {
  const metrics = [
    ['VO2max', Array.isArray(pointsByMetric.vo2Max) ? pointsByMetric.vo2Max.length : 0],
    ['HRV 7d', Array.isArray(pointsByMetric.hrv7d) ? pointsByMetric.hrv7d.length : 0],
    ['Hvilepuls 7d', Array.isArray(pointsByMetric.restingHeartRate7d) ? pointsByMetric.restingHeartRate7d.length : 0]
  ];
  const relevant = metrics.filter(([, value]) => value >= 2).length;
  const highSeries = metrics.filter(([, value]) => value >= 6).length;
  return createInsightEvidence({
    id: 'wellness-trends',
    period: { label: 'Siste registrerte målepunkter', from, to },
    sample: { total: 3, relevant, required: 2, unit: 'måleserier', relevantLabel: 'med trend' },
    confidence: relevant < 2 ? 'insufficient' : highSeries === 3 ? 'high' : 'medium',
    facts: metrics.map(([label, value]) => ({ label, value: String(value), detail: 'målepunkter' })),
    missing: metrics.filter(([, value]) => value < 2).map(([label]) => `${label} trenger minst to målepunkter`),
    caveat: 'Manuelle Garmin-målinger er signaler. Trendene bør vurderes sammen med dagsform og trening, ikke som en medisinsk fasit.'
  });
}
