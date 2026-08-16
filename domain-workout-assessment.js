import { coachDecisionEngine } from './domain-coach.js';

const numberValue = value => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const rounded = value => Math.round(numberValue(value));

function zoneShare(completed, zoneIds = []) {
  const zones = completed?.heartRateZoneDistribution?.zones;
  if (!Array.isArray(zones)) return null;
  const values = zones
    .filter(zone => zoneIds.includes(zone?.zoneId))
    .map(zone => numberValue(zone?.percent));
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0)) : null;
}

function intendedEasyWorkout(template = {}) {
  const context = [template.role, template.purpose, template.intensity, template.name]
    .map(value => String(value || '').toLowerCase())
    .join(' ');
  return /recovery|restitusjon|easy|rolig|base|low/.test(context);
}

function evidenceSentence(completed, easyShare) {
  const evidence = [];
  if (easyShare !== null) evidence.push(`${easyShare} % av tiden var i sone 1–2`);
  if (numberValue(completed.rpe)) evidence.push(`RPE ${rounded(completed.rpe)}/10`);
  const aerobicEffect = numberValue(completed?.externalData?.garmin?.aerobicTrainingEffect);
  if (aerobicEffect) evidence.push(`aerob treningseffekt ${String(aerobicEffect).replace('.', ',')}`);
  if (!evidence.length && numberValue(completed.avgHeartRate)) {
    evidence.push(`snittpulsen var ${rounded(completed.avgHeartRate)} bpm`);
  }
  if (!evidence.length) return 'Vurderingen bygger på registrert belastning og gjennomføring.';
  if (evidence.length === 1) return `${evidence[0][0].toUpperCase()}${evidence[0].slice(1)}.`;
  return `${evidence.slice(0, -1).join(', ')} og ${evidence.at(-1)}.`;
}

export function buildWorkoutCoachAssessment({
  completed = {},
  template = {},
  loadAssessment = {},
  zoneCompliance = null,
  trainingProfile = {}
} = {}) {
  const painBefore = numberValue(completed?.bodyStatus?.painBefore);
  const painAfter = numberValue(completed?.bodyStatus?.painAfter);
  const painConcern = painAfter >= 4 || painAfter > painBefore + 1;
  const adaptation = completed?.bodyStatus?.adaptation || '';
  const easyShare = zoneShare(completed, ['z1', 'z2']);
  const easyIntent = intendedEasyWorkout(template);
  const elevationGain = rounded(completed.elevationGainM);
  const level = loadAssessment.level || 'low';
  const evidence = evidenceSentence(completed, easyShare);

  let headline = level === 'high'
    ? 'Krevende økt'
    : level === 'moderate'
      ? 'Kontrollert treningsbelastning'
      : 'Lav og kontrollert belastning';
  if (easyIntent && easyShare !== null && easyShare >= 85 && numberValue(completed.rpe) <= 4) {
    headline = 'Kontrollert rolig økt';
  }

  let planFit = zoneCompliance?.summary || '';
  if (!planFit) {
    if (easyIntent && easyShare !== null) {
      planFit = easyShare >= 85
        ? 'Pulsfordelingen samsvarer godt med formålet om en rolig økt.'
        : 'Økten hadde mer tid i høyere pulssoner enn en typisk rolig økt.';
    } else if (level === 'high') {
      planFit = 'Økten ga tydelig belastning og bør følges av nok restitusjon.';
    } else {
      planFit = 'Belastningen ser håndterbar ut ut fra de registrerte dataene.';
    }
  }
  if (elevationGain >= 50 && easyIntent && easyShare !== null && easyShare >= 85) {
    planFit = `${planFit.replace(/\.$/, '')}, også med ${elevationGain} høydemeter.`;
  }

  if (painConcern) {
    headline = 'Kroppssignal krever oppfølging';
    planFit = 'Registrert smerte veier tyngre enn puls- og belastningstallene.';
  }

  const bodyStatus = completed?.bodyStatus && typeof completed.bodyStatus === 'object' ? completed.bodyStatus : {};
  const bodySignalObserved = ['painBefore', 'painAfter', 'adaptation'].some(key => Object.hasOwn(bodyStatus, key));
  const coachDecision = coachDecisionEngine({
    completedAssessment: {
      easyIntent,
      easyShare,
      rpe: completed.rpe,
      loadLevel: level,
      painBefore,
      painAfter,
      painArea: bodyStatus.area,
      adaptation,
      bodySignalObserved,
      primaryFocus: trainingProfile.primaryFocus,
      philosophy: trainingProfile.philosophy
    }
  });
  const nextStep = coachDecision.recommendation;

  return {
    version: 1,
    headline,
    evidence,
    planFit,
    nextStep,
    text: `${headline}. ${evidence} ${planFit} ${nextStep}`
  };
}
