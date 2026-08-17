import { getCoachRules } from './domain-coach-rules.js';
import { normalizeExercisePlan, normalizeExerciseUrl } from './domain-exercises.js';

export function addDays(dateIso, days) {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateToISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfWeek(dateIso) {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return dateToISO(date);
}

export function goldenZonePercentages(level, rules = getCoachRules()) {
  const zones = rules?.thresholds?.goldenZone || {};
  const key = level === 'experienced' ? 'experienced' : level === 'intermediate' ? 'intermediate' : 'beginner';
  const range = Array.isArray(zones[key]) ? zones[key] : [0.77, 0.84];
  return { lowPct: Number(range[0]), highPct: Number(range[1]) };
}

export function assessTrafficLight(sleep, energy, restingHR, stairsOk, baselineRestingHR = null) {
  if (stairsOk === false) return 'red';
  const avg = (sleep + energy) / 2;
  const hrDelta = (restingHR && baselineRestingHR) ? Number(restingHR) - Number(baselineRestingHR) : 0;
  if (avg <= 2 || hrDelta >= 10) return 'red';
  if (avg <= 3.5 || hrDelta >= 5) return 'yellow';
  return 'green';
}

export function injurySignalSummary(checkins = []) {
  const items = Array.isArray(checkins)
    ? checkins
        .filter(item => item && item.date && item.painNow !== '' && item.painNow !== null && item.painNow !== undefined)
        .map(item => ({
          date: String(item.date),
          painNow: Math.max(0, Math.min(10, Number(item.painNow) || 0)),
          area: String(item.area || '').trim(),
          trend: String(item.trend || '').trim()
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  if (!items.length) {
    return {
      hasSignal: false,
      status: 'none',
      statusLabel: 'Ingen aktiv oppfølging',
      trendText: '',
      area: '',
      latestPain: null,
      recommendation: 'Ingen nylig smerte registrert.',
      releaseCriteria: 'Coachen slipper signalet når det ikke finnes aktiv smerte å følge opp.',
      suggestedAction: 'Følg vanlig plan og registrer smerte hvis noe dukker opp.'
    };
  }

  const latest = items[items.length - 1];
  const first = items[0];
  const prior = items.slice(0, -1);
  const maxPriorPain = prior.length ? Math.max(...prior.map(item => item.painNow)) : first.painNow;
  const trendText = items.map(item => `${item.painNow}`).join(' -> ');
  const area = latest.area || [...items].reverse().find(item => item.area)?.area || '';
  const latestPain = latest.painNow;
  const previousPain = prior.length ? prior[prior.length - 1].painNow : null;
  const improving = latest.trend === 'better' || latestPain < maxPriorPain;
  const worsening = latest.trend === 'worse' || (previousPain !== null && latestPain > previousPain);

  let status = 'stable';
  let statusLabel = 'Stabil';
  let recommendation = 'Hold treningen kontrollert og følg med på om samme område reagerer.';
  let releaseCriteria = 'Slipp signalet etter smertefri økt eller 0-1/10 i minst én ny innsjekk.';
  let suggestedAction = 'Velg rolig bevegelse eller en kort test hvis området kjennes trygt.';

  if (latestPain <= 1) {
    status = 'calming';
    statusLabel = 'Nesten rolig';
    recommendation = 'Smerten er lav. Normal trening kan vurderes hvis oppvarming og første minutter kjennes bra.';
    releaseCriteria = 'Coachen kan slippe signalet etter smertefri økt eller én ny innsjekk på 0-1/10.';
    suggestedAction = 'Start rolig, stopp hvis smerten øker, og logg responsen etter økten.';
  } else if (worsening) {
    status = 'worse';
    statusLabel = 'Forverres';
    recommendation = 'Smerten øker. Ikke løp hardt; velg hvile eller smertefri alternativ trening.';
    releaseCriteria = 'Vent til trenden peker ned og smerten er 0-2/10 før løping bygges opp igjen.';
    suggestedAction = 'Prioriter hvile, mobilitet uten smerte, rolig sykkel eller gåtur hvis det kjennes bedre.';
  } else if (improving && latestPain <= 3) {
    status = 'improving';
    statusLabel = 'Bedres';
    recommendation = 'Smerten er bedre, men fortsatt merkbar. Vent med hard løping; bruk rolig test eller alternativ trening.';
    releaseCriteria = 'Slipp signalet når smerten er 0-1/10 eller en rolig økt er gjennomført uten økning.';
    suggestedAction = 'Aktuelt nå: hvile, rolig sykkel, mobilitet eller 10-20 min svært rolig test uten drag.';
  } else if (latestPain >= 5) {
    status = 'high';
    statusLabel = 'Høy';
    recommendation = 'Dette er fortsatt høy smerte. Kroppssignalet bør overstyre planen.';
    releaseCriteria = 'Vent til smerten er tydelig lavere og stabil før løping vurderes.';
    suggestedAction = 'Velg hvile eller smertefri alternativ trening. Ikke test hard løping.';
  } else if (latestPain >= 3) {
    status = 'caution';
    statusLabel = 'Følg nøye';
    recommendation = 'Moderat smerte bør avklares før kvalitet eller lengre løping.';
    releaseCriteria = 'Slipp signalet etter 0-1/10 eller smertefri rolig økt.';
    suggestedAction = 'Velg kort, rolig økt eller alternativ trening. Unngå terskel/intervall.';
  }

  return {
    hasSignal: true,
    status,
    statusLabel,
    trendText,
    area,
    latestPain,
    recommendation,
    releaseCriteria,
    suggestedAction
  };
}

export function injuryRecoveryGuidance(checkins = []) {
  const items = Array.isArray(checkins)
    ? checkins
        .filter(item => item && item.date && item.painNow !== '' && item.painNow !== null && item.painNow !== undefined)
        .map(item => ({
          date: String(item.date),
          painNow: Math.max(0, Math.min(10, Number(item.painNow) || 0)),
          area: String(item.area || '').trim(),
          trend: String(item.trend || '').trim()
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  if (!items.length) {
    return {
      active: false,
      title: 'Ingen aktiv skadeoppfølging',
      trendText: '',
      stableLowDays: 0,
      releaseStatus: 'none',
      releaseLabel: 'Ingen aktiv oppfølging',
      releaseCriteria: 'Registrer smerte hvis et kroppssignal dukker opp.',
      nextSafeWorkout: 'Følg vanlig plan og dagsform.',
      qualityGate: 'Kvalitet styres av vanlig dagsform.',
      note: 'Ingen nylig smerte registrert.'
    };
  }

  const latest = items[items.length - 1];
  const scores = items.map(item => item.painNow);
  const trendText = scores.join(' -> ');
  let stableLowDays = 0;
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].painNow <= 1) stableLowDays += 1;
    else break;
  }
  const previous = items.length > 1 ? items[items.length - 2] : null;
  const improving = previous ? latest.painNow < previous.painNow : latest.trend === 'better';
  const worsening = previous ? latest.painNow > previous.painNow : latest.trend === 'worse';

  let releaseStatus = 'watch';
  let releaseLabel = 'Følg med';
  let releaseCriteria = 'Vent med terskel, intervall og race til smerten er 0-1/10 og stabil.';
  let nextSafeWorkout = 'Velg hvile, mobilitet eller smertefri alternativ trening.';
  let qualityGate = 'Ikke gjør hard kvalitet ennå.';

  if (latest.painNow >= 5 || worsening) {
    releaseStatus = 'hold';
    releaseLabel = 'Hold igjen';
    releaseCriteria = 'Vent til smerten er tydelig lavere og ikke øker fra dag til dag.';
    nextSafeWorkout = 'Hvile, rolig sykkel eller mobilitet. Ikke test løping hvis smerten øker.';
    qualityGate = 'Terskel, intervall og race bør utsettes.';
  } else if (latest.painNow >= 3) {
    releaseStatus = improving ? 'cautious' : 'hold';
    releaseLabel = improving ? 'Bedres, men test forsiktig' : 'Vent litt';
    releaseCriteria = 'Rolig test først når smerten er lavere/stabil og ikke øker gjennom dagen.';
    nextSafeWorkout = improving
      ? '10-20 min svært rolig test eller rolig alternativ trening.'
      : 'Smertefri alternativ trening eller hvile.';
    qualityGate = 'Hard kvalitet venter til rolig test tolereres.';
  } else if (latest.painNow <= 1 && stableLowDays >= 2) {
    releaseStatus = 'release';
    releaseLabel = 'Klar for rolig retur';
    releaseCriteria = 'Smerte 0-1/10 i minst to registreringer. Start med rolig økt før kvalitet.';
    nextSafeWorkout = 'Rolig løpetur eller 20-30 min kontrollert test, stopp hvis smerte øker.';
    qualityGate = 'Vent med terskel/intervall til rolig økt er tolerert uten økning.';
  } else if (latest.painNow <= 2) {
    releaseStatus = 'easy';
    releaseLabel = 'Lav smerte';
    releaseCriteria = 'Hold smerten 0-2/10 og stabil før du øker belastningen.';
    nextSafeWorkout = 'Kort rolig økt eller alternativ trening. Stopp hvis smerten øker.';
    qualityGate = 'Kvalitet kan vurderes først etter stabil rolig toleranse.';
  }

  return {
    active: true,
    title: latest.area ? `Oppfølging: ${latest.area}` : 'Skadeoppfølging',
    trendText,
    stableLowDays,
    releaseStatus,
    releaseLabel,
    releaseCriteria,
    nextSafeWorkout,
    qualityGate,
    note: improving
      ? 'Trenden går riktig vei, men progresjon bør fortsatt være kontrollert.'
      : worsening
      ? 'Trenden går feil vei. Reduser belastning og følg signalet tett.'
      : 'Bruk neste økt til å bekrefte stabil respons.'
  };
}

export function injuryAdjustedWorkoutAdvice(injurySummary = {}, planned = {}) {
  if (!injurySummary || !injurySummary.hasSignal) {
    return { active: false, title: '', action: '', reason: '', options: [], plannedWarning: '' };
  }

  const label = String(planned.label || '').trim();
  const intensity = String(planned.intensity || '').toLowerCase();
  const role = String(planned.role || '').toLowerCase();
  const purpose = String(planned.purpose || '').toLowerCase();
  const load = String(planned.load || '').toLowerCase();
  const text = `${label} ${intensity} ${role} ${purpose} ${load}`.toLowerCase();
  const plannedQuality = Boolean(label) && (
    load === 'high' ||
    intensity.includes('terskel') ||
    intensity.includes('intervall') ||
    intensity.includes('tempo') ||
    role.includes('threshold') ||
    role.includes('race') ||
    purpose.includes('threshold') ||
    purpose.includes('race') ||
    text.includes('terskel') ||
    text.includes('intervall') ||
    text.includes('race')
  );

  const base = {
    active: true,
    title: 'Skadejustert øktvalg',
    action: injurySummary.suggestedAction || 'Velg lavrisiko trening og sjekk kroppssignalet underveis.',
    reason: injurySummary.recommendation || 'Aktivt kroppssignal bør styre øktvalg.',
    options: ['Hvile', 'Rolig sykkel', 'Mobilitet'],
    plannedWarning: plannedQuality && label ? `Planlagt ${label} bør flyttes eller byttes til lavrisiko alternativ i dag.` : ''
  };

  if (injurySummary.status === 'worse' || injurySummary.status === 'high') {
    return {
      ...base,
      action: 'Velg hvile eller smertefri alternativ trening.',
      options: ['Hvile', 'Rolig sykkel', 'Smertefri mobilitet'],
      plannedWarning: label ? `Ikke gjennomfør ${label} som løpe-/kvalitetsøkt mens signalet er høyt eller forverres.` : base.plannedWarning
    };
  }

  if (injurySummary.status === 'improving') {
    return {
      ...base,
      action: 'Velg alternativ trening eller en svært rolig test med stoppregel.',
      options: ['Rolig sykkel', 'Mobilitet', '10-20 min rolig test'],
      plannedWarning: plannedQuality && label ? `Flytt ${label}, eller bytt til 10-20 min rolig test uten drag.` : base.plannedWarning
    };
  }

  if (injurySummary.status === 'calming') {
    return {
      ...base,
      action: 'Start rolig og bruk første minutter som test.',
      options: ['Rolig testløp', 'Rolig sykkel', 'Kort mobilitet'],
      plannedWarning: plannedQuality && label ? `${label} bør bare gjennomføres hvis oppvarmingen er smertefri og kontrollert.` : base.plannedWarning
    };
  }

  return {
    ...base,
    options: ['Kort rolig økt', 'Rolig sykkel', 'Mobilitet'],
    plannedWarning: plannedQuality && label ? `Terskel/intervall bør vente. Gjør ${label} roligere, kortere eller flytt den.` : base.plannedWarning
  };
}

function plannedWorkoutIsQuality(planned = {}) {
  const text = [
    planned.label,
    planned.intensity,
    planned.role,
    planned.purpose,
    planned.load
  ].filter(Boolean).join(' ').toLowerCase();
  return Boolean(
    text.includes('terskel') ||
    text.includes('intervall') ||
    text.includes('tempo') ||
    text.includes('anaerob') ||
    text.includes('race') ||
    text.includes('threshold') ||
    text.includes('high')
  );
}

export function dailyCoachSupport(input = {}) {
  const decision = input.decision || {};
  const planned = input.planned || {};
  const hasPlannedToday = Boolean(input.hasPlannedToday);
  const injuryActive = Boolean(input.injuryActive);
  const injuryStatus = String(input.injuryStatus || '').toLowerCase();
  const readiness = input.dailyReadinessLevel || '';
  const quality = plannedWorkoutIsQuality(planned);
  const goalScorePercent = Number(input.goalScorePercent || 0);
  const goalScoreLabel = String(input.goalScoreLabel || '').trim();
  const racePhaseLabel = String(input.racePhaseLabel || '').trim();
  const weekSessions = Number(input.weekSessions || 0);
  const weeklyTarget = Number(input.weeklyTarget || 0);
  const plannedLabel = String(planned.label || '').trim();

  let adjustment = '';
  let support = '';
  let motivation = '';

  if (decision.level === 'red' || injuryStatus === 'worse' || injuryStatus === 'high') {
    adjustment = plannedLabel
      ? `Bytt ${plannedLabel} til hvile, mobilitet eller smertefri alternativ trening.`
      : 'Velg hvile, mobilitet eller smertefri alternativ trening.';
    support = 'Ikke bruk smerte som test i dag. Spis normalt, drikk godt og prioriter søvn.';
    motivation = 'Dette er ikke et steg bort fra målet; det er slik du beskytter kontinuiteten.';
  } else if (injuryActive) {
    adjustment = quality
      ? 'Hold hard løping igjen. Velg rolig sykkel, mobilitet eller svært rolig test med stoppregel.'
      : hasPlannedToday ? 'Gjør økten kortere og roligere, og stopp ved økende smerte.' : 'Velg lavrisiko bevegelse og oppdater smerte etterpå.';
    support = 'Følg trend og dagsform. Målet nå er stabil respons, ikke å bevise form.';
    motivation = 'Skadefri kontinuitet gir mer verdi enn én presset økt.';
  } else if (decision.level === 'yellow') {
    adjustment = quality
      ? 'Start kontrollert, kutt drag/intensitet ved tunge bein, og la økten bli kortere om nødvendig.'
      : hasPlannedToday ? 'Gjennomfør rolig og kort nok til at du avslutter med overskudd.' : 'Velg en enkel rolig økt eller lett bevegelse.';
    support = quality
      ? 'Fyll på med karbohydrater før økta, drikk godt og bruk oppvarmingen som sjekkpunkt.'
      : 'Drikk godt og spis normalt. En rolig dag kan være det som gjør neste kvalitetsøkt bedre.';
    motivation = 'Gul dag betyr ikke stopp, men smart justering.';
  } else if (quality && (decision.level === 'green' || readiness === 'green')) {
    adjustment = plannedLabel
      ? `Gjennomfør ${plannedLabel}, men hold kvaliteten kontrollert.`
      : 'Gjennomfør kvalitetsøkten kontrollert.';
    support = 'Spis karbohydrater før økta, drikk godt, varm opp rolig og fyll på med protein/karbohydrater etterpå.';
    motivation = racePhaseLabel ? `Dette passer som kontrollert kvalitet i ${racePhaseLabel.toLowerCase()}.` : 'Kontrollert kvalitet virker best når den kan repeteres.';
  } else if (hasPlannedToday) {
    adjustment = plannedLabel ? `Gjennomfør ${plannedLabel} som planlagt.` : 'Gjennomfør planlagt økt.';
    support = 'Hold rolig økt rolig. Drikk godt og avslutt med følelsen av at du kunne gjort litt mer.';
    motivation = weeklyTarget && weekSessions < weeklyTarget
      ? `Dette bygger kontinuitet mot ukesmålet (${weekSessions}/${weeklyTarget}).`
      : 'Dette bygger en repeterbar uke.';
  } else {
    adjustment = 'Velg én realistisk handling: rolig økt, mobilitet eller planlegg neste økt.';
    support = 'Gjør terskelen lav. Litt bevegelse og god restitusjon er bedre enn å vente på perfekt dag.';
    motivation = goalScorePercent && goalScorePercent < 60
      ? `Mål-score (${goalScorePercent}/100${goalScoreLabel ? `, ${goalScoreLabel}` : ''}) flyttes mest av repeterbare uker.`
      : 'Små, repeterbare valg bygger formen.';
  }

  return {
    adjustment,
    support,
    motivation
  };
}

export function todayCompletedWorkoutFeedback(input = {}) {
  const completed = input.completed || null;
  if (!completed) return null;

  const nextPlanned = input.nextPlanned && typeof input.nextPlanned === 'object' ? input.nextPlanned : null;
  const nextLabel = String(nextPlanned?.label || '').trim();
  const nextDateLabel = String(nextPlanned?.dateLabel || '').trim().replace(/[.!?]+$/g, '');
  const nextPlanSentence = nextLabel
    ? `Neste planlagte økt er ${nextLabel}${nextDateLabel ? ` ${nextDateLabel}` : ''}.`
    : 'Det ligger ingen ny planlagt økt i kalenderen ennå.';
  const injurySummary = input.injurySummary && typeof input.injurySummary === 'object' ? input.injurySummary : null;
  const activeSignalArea = String(injurySummary?.area || injurySummary?.latestArea || '').trim();
  const activeSignalScore = Number(injurySummary?.latestScore ?? injurySummary?.painNow);
  const activeSignalText = injurySummary?.hasSignal
    ? `Aktivt kroppssignal${activeSignalArea ? ` i ${activeSignalArea}` : ''}${Number.isFinite(activeSignalScore) ? ` er ${activeSignalScore}/10` : ''}.`
    : '';

  const label = String(completed.label || 'dagens økt').trim();
  const loadLevel = String(completed.loadLevel || '').toLowerCase();
  const loadLabel = String(completed.loadLabel || '').trim();
  const intensity = String(completed.intensity || '').trim();
  const role = String(completed.role || '').trim();
  const purpose = String(completed.purpose || '').trim();
  const execution = String(completed.execution || '').trim();
  const rpe = Number(completed.rpe || 0);
  const painBefore = Number(completed.painBefore || 0);
  const painAfter = Number(completed.painAfter || 0);
  const painArea = String(completed.painArea || '').trim();
  const minutes = Number(completed.durationSeconds || 0) ? Math.round(Number(completed.durationSeconds) / 60) : 0;
  const distanceKm = Number(completed.distanceKm || 0);
  const painText = painAfter || painBefore
    ? `Smerte ${painBefore}/10 før og ${painAfter}/10 etter${painArea ? ` i ${painArea}` : ''}.`
    : 'Ingen tydelig smerterespons er logget etter økten.';
  const labelText = label.toLowerCase();
  const contextText = [labelText, intensity, role, purpose, loadLabel, loadLevel].join(' ').toLowerCase();
  const isLowLoad = loadLevel === 'low' || /rolig|restitusjon|base|low|lav/.test(contextText);
  const isQuality = /terskel|intervall|tempo|anaerob|race|konkurranse|threshold|high/.test(contextText) || rpe >= 7;
  const painIncreased = painAfter > painBefore + 1;
  const highPainResponse = painAfter >= 4 || painIncreased;
  const mildPainResponse = painAfter > 0 || painBefore > 0;
  const completedSummary = [
    minutes ? `${minutes} min` : '',
    distanceKm ? `${distanceKm.toLocaleString('no-NO', { maximumFractionDigits: 2 })} km` : '',
    rpe ? `RPE ${rpe}/10` : '',
    loadLabel || ''
  ].filter(Boolean).join(' · ');

  if (highPainResponse) {
    return {
      mode: 'post_workout',
      kicker: 'Dagens vurdering',
      level: 'red',
      title: 'Økten ga for mye smerterespons',
      action: `Smerteresponsen styrer nå: velg hvile eller smertefri alternativ trening neste gang. ${nextPlanSentence}`,
      reason: `${label} er logget. ${painText}`,
      support: {
        adjustment: 'Ikke bruk neste økt til å teste formen. Vent til smerten er lavere eller stabil.',
        support: 'Fyll på mat og drikke, prioriter søvn og registrer smerte igjen i morgen.',
        motivation: 'Det viktigste datapunktet nå er om kroppen roer seg etter belastningen.'
      }
    };
  }

  if (mildPainResponse) {
    const stableOrBetter = painAfter <= Math.max(2, painBefore);
    return {
      mode: 'post_workout',
      kicker: 'Dagens vurdering',
      level: stableOrBetter && isLowLoad ? 'green' : 'yellow',
      title: stableOrBetter ? 'Bra justert økt' : 'Følg med på responsen',
      action: stableOrBetter
        ? `${painText} ${nextPlanSentence}`
        : `${painText} Hold neste treningsvalg rolig til kroppssignalet er stabilt. ${nextPlanSentence}`,
      reason: `${label} er gjennomført${completedSummary ? ' (' + completedSummary + ')' : ''}. ${painText}`,
      support: {
        adjustment: stableOrBetter ? 'Planen bør nå vurderes ut fra responsen i kveld og i morgen.' : 'Ikke legg inn hard løping før smerteresponsen er stabil.',
        support: 'Drikk godt og spis nok karbohydrater/protein etter økten. Logg smerteoppfølging i morgen.',
        motivation: stableOrBetter ? 'Dette er akkurat verdien av kontrollert testing: du får data uten å jage form.' : 'En rolig justering nå kan spare deg for flere tapte treningsdager.'
      }
    };
  }

  if (isQuality) {
    return {
      mode: 'post_workout',
      kicker: 'Dagens vurdering',
      level: 'green',
      title: 'Kvalitet gjennomført kontrollert',
      action: `${activeSignalText || 'Ingen aktiv smerterespons er registrert.'} ${nextPlanSentence}`,
      reason: `${label} er logget${completedSummary ? ` (${completedSummary})` : ''}.`,
      support: {
        adjustment: 'Neste valg bør være rolig, restitusjon eller lett styrke hvis kroppen er fin.',
        support: 'Fyll på væske, karbohydrater og protein. Kvalitetsøkter virker best når restitusjonen sitter.',
        motivation: 'Du har allerede gjort dagens viktigste treningsbidrag.'
      }
    };
  }

  return {
    mode: 'post_workout',
    kicker: 'Dagens vurdering',
    level: isLowLoad ? 'green' : 'neutral',
    title: isLowLoad ? 'Bra gjennomført rolig økt' : 'Økt gjennomført',
    action: `${activeSignalText || 'Ingen aktiv smerterespons er registrert.'} ${nextPlanSentence}`,
    reason: `${label} er logget${completedSummary ? ` (${completedSummary})` : ''}.${execution ? ` Gjennomføring: ${execution}.` : ''}`,
    support: {
      adjustment: nextPlanSentence,
      support: activeSignalText || 'Ingen aktiv smerterespons er registrert.',
      motivation: 'Økten er registrert og inngår i ukens belastningsgrunnlag.'
    }
  };
}

export {
  RACE_DISTANCE_PRESETS,
  combinedRaceResults,
  formatRaceTime,
  goalMilestones,
  goalMotivationSummary,
  goalProgressScore,
  normalizeRaceGoal,
  normalizeRaceResult,
  normalizeRaceResultEntries,
  normalizeRaceResultEntry,
  parseRaceTimeToSeconds,
  personalBestSummary,
  personalBestTrendLabel,
  personalBestTrendSummary,
  raceDistanceLabel,
  raceGoalCountdown,
  raceGoalPlan,
  raceHistoryForDistance,
  raceTestRecommendation,
  raceWeekPlanContext,
  raceReadinessSummary,
  raceResultsFromCompleted
} from './domain-goals.js';

export function formatKm(km) {
  const value = Number(km) || 0;
  return `${value.toLocaleString('no-NO', { maximumFractionDigits: value < 10 ? 1 : 0 })} km`;
}

export function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function normalizeStructuredWorkout(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const blocks = Array.isArray(value.blocks)
    ? value.blocks
        .filter(block => block && typeof block === 'object' && !Array.isArray(block))
        .map(normalizeStructuredWorkoutBlock)
        .filter(Boolean)
    : [];
  if (!blocks.length) return null;
  return {
    version: Number(value.version) || 1,
    blocks,
    note: typeof value.note === 'string' ? value.note : ''
  };
}

export function normalizeStructuredWorkoutBlock(block = {}) {
  const type = String(block.type || '').trim();
  if (type === 'warmup' || type === 'cooldown') {
    const durationSeconds = parseNonNegativeInteger(block.durationSeconds);
    if (!durationSeconds) return null;
    return {
      type,
      durationSeconds,
      note: String(block.note || '')
    };
  }
  if (type === 'interval') {
    const repetitions = parseNonNegativeInteger(block.repetitions);
    const workSeconds = parseNonNegativeInteger(block.workSeconds);
    const restSeconds = parseNonNegativeInteger(block.restSeconds);
    if (!repetitions || !workSeconds) return null;
    return {
      type,
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(block.restType || ''),
      intensity: String(block.intensity || ''),
      note: String(block.note || '')
    };
  }
  return null;
}

export function buildStructuredWorkout(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const blocks = [];
  const warmupSeconds = parseNonNegativeInteger(source.warmupMinutes) * 60;
  const cooldownSeconds = parseNonNegativeInteger(source.cooldownMinutes) * 60;
  const repetitions = parseNonNegativeInteger(source.repetitions);
  const workSeconds = parseNonNegativeInteger(source.workSeconds);
  const restSeconds = parseNonNegativeInteger(source.restSeconds);

  if (warmupSeconds) blocks.push({ type: 'warmup', durationSeconds: warmupSeconds });
  if (repetitions && workSeconds) {
    blocks.push({
      type: 'interval',
      repetitions,
      workSeconds,
      restSeconds,
      restType: String(source.restType || ''),
      intensity: String(source.intensity || ''),
      note: String(source.intervalNote || '')
    });
  }
  if (cooldownSeconds) blocks.push({ type: 'cooldown', durationSeconds: cooldownSeconds });

  return normalizeStructuredWorkout({
    version: 1,
    blocks,
    note: String(source.note || '')
  });
}

export function structuredWorkoutWorkSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.workSeconds);
  }, 0);
}

export function structuredWorkoutRestSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type !== 'interval') return sum;
    return sum + (block.repetitions * block.restSeconds);
  }, 0);
}

export function structuredWorkoutTotalSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => {
    if (block.type === 'warmup' || block.type === 'cooldown') return sum + block.durationSeconds;
    if (block.type === 'interval') {
      return sum + (block.repetitions * block.workSeconds) + (block.repetitions * block.restSeconds);
    }
    return sum;
  }, 0);
}

export function structuredWorkoutWarmupSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'warmup' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutCooldownSeconds(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return 0;
  return workout.blocks.reduce((sum, block) => (
    block.type === 'cooldown' ? sum + block.durationSeconds : sum
  ), 0);
}

export function structuredWorkoutIntervalBlocks(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  return workout ? workout.blocks.filter(block => block.type === 'interval') : [];
}

export function hasStructuredIntervals(structuredWorkout) {
  return structuredWorkoutIntervalBlocks(structuredWorkout)
    .some(block => block.repetitions > 0 && block.workSeconds > 0);
}

function numberValue(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function lowerText(parts = []) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function classifyWorkoutIntensityContext(input = {}) {
  const completed = input.completed && typeof input.completed === 'object' ? input.completed : {};
  const template = input.template && typeof input.template === 'object' ? input.template : {};
  const profile = input.profile && typeof input.profile === 'object' ? input.profile : {};
  const rules = input.rules && typeof input.rules === 'object' ? input.rules : getCoachRules();
  const easyCeiling = rules?.thresholds?.easyCeiling || {};
  const qualityThresholds = rules?.thresholds?.quality || {};
  const structuredWorkout = template.structuredWorkout || completed.structuredWorkout || completed.templateSnapshot?.structuredWorkout;
  const text = lowerText([
    template.name,
    template.type,
    template.intensity,
    template.role,
    template.purpose,
    template.load,
    template.structure,
    completed.manualName
  ]);
  const effectCategory = String(input.effectCategory || completed.trainingEffectCategory || '').toLowerCase();
  const rpe = numberValue(input.rpe ?? completed.rpe);
  const avgHr = numberValue(input.avgHeartRate ?? completed.avgHeartRate);
  const maxHr = numberValue(input.maxHeartRate ?? completed.maxHeartRate);
  const profileMaxHr = numberValue(input.profileMaxHeartRate ?? profile.maxHeartRate);
  const thresholdHr = numberValue(input.thresholdHeartRate ?? profile.thresholdHeartRate);
  const painBefore = numberValue(input.painBefore ?? completed.bodyStatus?.painBefore);
  const painAfter = numberValue(input.painAfter ?? completed.bodyStatus?.painAfter);
  const elevationGain = numberValue(input.elevationGainM ?? completed.elevationGainM);
  const distanceKm = numberValue(input.distanceKm ?? completed.distanceKm);
  const incline = numberValue(input.treadmillInclinePercent ?? completed.treadmillInclinePercent);
  const elevationPerKm = distanceKm ? elevationGain / distanceKm : 0;

  const structured = hasStructuredIntervals(structuredWorkout);
  const raceIntent = template.role === 'race' || template.purpose === 'race' || /race|konkurranse|testløp|testlop/.test(text);
  const qualityIntent = structured
    || raceIntent
    || /terskel|intervall|tempo|anaerob|threshold|vo2|hard/.test(text)
    || ['main_threshold', 'support_threshold'].includes(template.role)
    || ['threshold', 'interval', 'race'].includes(template.purpose);
  const recoveryIntent = /restitusjon|recovery|mobilitet|rolig test/.test(text)
    || template.role === 'recovery'
    || template.purpose === 'recovery';
  const baseIntent = !raceIntent && !qualityIntent && (
    recoveryIntent
    || /rolig|base|langtur|easy|low aerobic|lav aerob/.test(text)
    || ['long_easy', 'easy', 'base'].includes(template.role)
    || ['base', 'easy', 'aerobic'].includes(template.purpose)
    || ['Rolig', 'Restitusjon'].includes(template.intensity)
  );
  const highPulse = Boolean(input.highPulse)
    || effectCategory === 'high_aerobic'
    || effectCategory === 'anaerobic'
    || (avgHr && thresholdHr && avgHr / thresholdHr >= Number(easyCeiling.pctOfThresholdHr || 0.92))
    || (avgHr && profileMaxHr && avgHr / profileMaxHr >= Number(easyCeiling.pctOfMaxHr || 0.82))
    || (maxHr && profileMaxHr && maxHr / profileMaxHr >= Number(easyCeiling.maxPctOfMaxHr || 0.90));
  const hillContext = incline >= 4 || elevationPerKm >= 20 || elevationGain >= 150;
  const painRisk = painAfter >= 4 || painAfter > painBefore + 1;
  const rpeHigh = rpe >= Number(qualityThresholds.hardRpeMin || 7);
  const rpeModerate = rpe >= Number(qualityThresholds.moderateRpeMin || 6);
  const intent = { baseIntent, qualityIntent, raceIntent, recoveryIntent };

  if (painRisk || (rpeHigh && !qualityIntent)) {
    return {
      category: 'hard_risk',
      label: 'Hard/risko-belastning',
      loadLevel: 'high',
      ...intent,
      highPulseBase: false,
      countsAsEasySupport: false,
      countsAsHardQuality: false,
      countsAsHardLoad: true,
      reason: painRisk ? 'Smerte eller tydelig økning etter økten.' : 'Høy RPE uten tydelig rolig respons.'
    };
  }

  if (qualityIntent) {
    return {
      category: 'quality',
      label: raceIntent ? 'Konkurranse/testløp' : 'Kvalitetsøkt',
      loadLevel: rpeModerate || highPulse || effectCategory === 'anaerobic' ? 'high' : 'moderate',
      ...intent,
      highPulseBase: false,
      countsAsEasySupport: false,
      countsAsHardQuality: true,
      countsAsHardLoad: true,
      reason: structured ? 'Strukturert intervall/terskel teller som kvalitet.' : 'Mal eller intensitet tilsier kvalitet.'
    };
  }

  if (baseIntent && highPulse) {
    return {
      category: 'high_pulse_base',
      label: 'Baseøkt med høy puls',
      loadLevel: rpeModerate || hillContext || effectCategory === 'high_aerobic' ? 'moderate' : 'low',
      ...intent,
      highPulseBase: true,
      countsAsEasySupport: true,
      countsAsHardQuality: false,
      countsAsHardLoad: false,
      reason: hillContext
        ? 'Rolig/base-intensjon, men puls/bakke gjorde belastningen høyere.'
        : 'Rolig/base-intensjon, men pulsen var høyere enn helt rolig.'
    };
  }

  if (baseIntent) {
    return {
      category: recoveryIntent || rpe <= 3 ? 'easy_recovery' : 'easy_base',
      label: recoveryIntent || rpe <= 3 ? 'Rolig/restitusjon' : 'Baseøkt',
      loadLevel: 'low',
      ...intent,
      highPulseBase: false,
      countsAsEasySupport: true,
      countsAsHardQuality: false,
      countsAsHardLoad: false,
      reason: 'Rolig/base-intensjon uten harde signaler.'
    };
  }

  if (effectCategory === 'anaerobic' || effectCategory === 'high_aerobic') {
    return {
      category: 'quality',
      label: effectCategory === 'anaerobic' ? 'Anaerob/hard økt' : 'Høy aerob økt',
      loadLevel: effectCategory === 'anaerobic' ? 'high' : 'moderate',
      ...intent,
      highPulseBase: false,
      countsAsEasySupport: false,
      countsAsHardQuality: true,
      countsAsHardLoad: true,
      reason: 'Garmin-effekt tilsier moderat/hard kvalitet.'
    };
  }

  return {
    category: 'unknown',
    label: 'Uklassifisert økt',
    loadLevel: 'moderate',
    ...intent,
    highPulseBase: false,
    countsAsEasySupport: false,
    countsAsHardQuality: false,
    countsAsHardLoad: false,
    reason: 'Mangler nok øktkontekst til sikker klassifisering.'
  };
}

function workoutItemsInWindow(items, todayIso, windowDays) {
  const source = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!todayIso) return source;
  const startIso = addDays(todayIso, -(Math.max(1, Number(windowDays) || 1) - 1));
  return source.filter(item => item?.date >= startIso && item.date <= todayIso);
}

function intensityContextForItem(item, options = {}) {
  const completed = item?.completed && typeof item.completed === 'object' ? item.completed : item || {};
  const template = item?.template && typeof item.template === 'object'
    ? item.template
    : completed.templateSnapshot || {};
  return classifyWorkoutIntensityContext({
    completed,
    template,
    profile: options.profile,
    rules: options.rules,
    effectCategory: item?.effectCategory
  });
}

export function canonicalIntensityBalance(completedItems = [], options = {}) {
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const policy = rules?.thresholds?.intensityBalance || {};
  const windowDays = Math.max(1, Number(options.windowDays || policy.windowDays) || 14);
  const minimumSessions = Math.max(1, Number(policy.minimumSessions) || 3);
  const items = workoutItemsInWindow(completedItems, options.todayIso, windowDays);
  const countHighPulseBaseAsEasy = policy.countHighPulseBaseAsEasy !== false;

  let easyCount = 0;
  let hardCount = 0;
  let highPulseBaseCount = 0;
  let unknownCount = 0;

  items.forEach(item => {
    const context = intensityContextForItem(item, { profile: options.profile, rules });
    if (context.highPulseBase) highPulseBaseCount += 1;
    if (context.countsAsHardQuality || context.countsAsHardLoad) {
      hardCount += 1;
    } else if (context.countsAsEasySupport && (!context.highPulseBase || countHighPulseBaseAsEasy)) {
      easyCount += 1;
    } else {
      unknownCount += 1;
    }
  });

  const classifiedCount = easyCount + hardCount;
  const easyShare = classifiedCount ? Math.round((easyCount / classifiedCount) * 100) : 0;
  const hardShare = classifiedCount ? Math.round((hardCount / classifiedCount) * 100) : 0;
  const minEasyShare = Number(policy.minEasyShare) || 0.4;
  const hardShareLimit = Number(policy.heroConflictHardShare) || 0.65;

  let verdict = 'balanced';
  let status = 'green';
  let label = 'Balansert';
  let explanation = `${easyCount} rolige mot ${hardCount} harde siste ${windowDays} dager.`;

  if (classifiedCount < minimumSessions) {
    verdict = 'insufficient_data';
    status = 'neutral';
    label = 'Ikke nok data';
    explanation = `Trenger minst ${minimumSessions} klassifiserte økter siste ${windowDays} dager.`;
  } else if ((hardShare / 100) >= hardShareLimit || (easyShare / 100) < minEasyShare) {
    verdict = 'too_hard';
    status = 'yellow';
    label = 'For mye hardt';
    explanation = `${hardCount} harde mot ${easyCount} rolige siste ${windowDays} dager.`;
  }

  if (highPulseBaseCount) {
    const policyText = countHighPulseBaseAsEasy ? 'teller som rolig støtte' : 'holdes utenfor rolig/hard-ratioen';
    explanation += ` ${highPulseBaseCount} baseøkt${highPulseBaseCount === 1 ? '' : 'er'} med høy puls ${policyText}.`;
  }

  return {
    windowDays,
    totalCount: items.length,
    classifiedCount,
    easyCount,
    hardCount,
    highPulseBaseCount,
    unknownCount,
    easyShare,
    hardShare,
    verdict,
    status,
    label,
    explanation,
    countHighPulseBaseAsEasy
  };
}

export function workoutHeartRateCompliance(input = {}) {
  const completed = input.completed && typeof input.completed === 'object' ? input.completed : {};
  const template = input.template && typeof input.template === 'object' ? input.template : {};
  const profile = input.profile && typeof input.profile === 'object' ? input.profile : {};
  const rules = input.rules && typeof input.rules === 'object' ? input.rules : getCoachRules();
  const context = classifyWorkoutIntensityContext({ completed, template, profile, rules });
  const avgHeartRate = numberValue(input.avgHeartRate ?? completed.avgHeartRate);
  const maxHeartRate = numberValue(input.profileMaxHeartRate ?? profile.maxHeartRate);
  const thresholdHeartRate = numberValue(input.thresholdHeartRate ?? profile.thresholdHeartRate);
  const easyCeiling = rules?.thresholds?.easyCeiling || {};

  if (!avgHeartRate) {
    return {
      status: 'no_data',
      hasHeartRate: false,
      easyViolation: false,
      qualityViolation: false,
      context
    };
  }

  const highEasyPulse = Boolean(
    (thresholdHeartRate && avgHeartRate / thresholdHeartRate >= Number(easyCeiling.pctOfThresholdHr || 0.92))
    || (maxHeartRate && avgHeartRate / maxHeartRate >= Number(easyCeiling.pctOfMaxHr || 0.82))
  );
  const { highPct } = goldenZonePercentages(input.trainingLevel, rules);
  const qualityAboveZone = Boolean(
    maxHeartRate
    && context.countsAsHardQuality
    && !context.raceIntent
    && avgHeartRate / maxHeartRate > highPct
  );

  if (context.baseIntent && highEasyPulse) {
    return {
      status: 'easy_violation',
      hasHeartRate: true,
      easyViolation: true,
      qualityViolation: false,
      avgHeartRate,
      context
    };
  }
  if (qualityAboveZone) {
    return {
      status: 'quality_above_zone',
      hasHeartRate: true,
      easyViolation: false,
      qualityViolation: true,
      avgHeartRate,
      context
    };
  }
  return {
    status: maxHeartRate || thresholdHeartRate ? 'within_expected' : 'no_reference',
    hasHeartRate: true,
    easyViolation: false,
    qualityViolation: false,
    avgHeartRate,
    context
  };
}

export function heartRateComplianceSummary(completedItems = [], options = {}) {
  const rules = options.rules && typeof options.rules === 'object' ? options.rules : getCoachRules();
  const windowDays = Math.max(
    1,
    Number(options.windowDays || rules?.thresholds?.intensityBalance?.windowDays) || 14
  );
  const items = workoutItemsInWindow(completedItems, options.todayIso, windowDays);
  const assessments = items.map(item => {
    const completed = item?.completed && typeof item.completed === 'object' ? item.completed : item || {};
    const template = item?.template && typeof item.template === 'object'
      ? item.template
      : completed.templateSnapshot || {};
    return workoutHeartRateCompliance({
      completed,
      template,
      profile: options.profile,
      trainingLevel: options.trainingLevel,
      rules
    });
  });

  return {
    windowDays,
    totalCount: items.length,
    withHeartRateCount: assessments.filter(item => item.hasHeartRate).length,
    easyWithHeartRateCount: assessments.filter(item => item.hasHeartRate && item.context.baseIntent).length,
    easyViolationCount: assessments.filter(item => item.easyViolation).length,
    qualityViolationCount: assessments.filter(item => item.qualityViolation).length,
    highPulseBaseCount: assessments.filter(item => item.context.highPulseBase).length
  };
}

export function structuredWorkoutFromItem(item = {}) {
  if (!item || typeof item !== 'object') return null;
  return normalizeStructuredWorkout(item.structuredWorkout || item.templateSnapshot?.structuredWorkout);
}

export function compactDurationText(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '0';
  if (total < 60) return String(total);
  const minutes = Math.floor(total / 60);
  const restSeconds = total % 60;
  return restSeconds ? `${minutes}:${String(restSeconds).padStart(2, '0')}` : `${minutes} min`;
}

export function structuredWorkoutCompactText(structuredWorkout) {
  const blocks = structuredWorkoutIntervalBlocks(structuredWorkout);
  if (!blocks.length) return '';
  return blocks.map(block => {
    const rest = block.restSeconds ? `/${compactDurationText(block.restSeconds)}` : '';
    return `${block.repetitions} x ${compactDurationText(block.workSeconds)}${rest}`;
  }).join(' + ');
}

export function structuredWorkoutBreakdown(structuredWorkout) {
  const workout = normalizeStructuredWorkout(structuredWorkout);
  if (!workout) return null;
  const interval = structuredWorkoutIntervalBlocks(workout)[0] || null;
  const restType = interval?.restType ? restTypeLabel(interval.restType) : '';
  const intensity = interval?.intensity ? structuredIntensityLabel(interval.intensity) : '';
  return {
    compact: structuredWorkoutCompactText(workout),
    warmupSeconds: structuredWorkoutWarmupSeconds(workout),
    workSeconds: structuredWorkoutWorkSeconds(workout),
    restSeconds: structuredWorkoutRestSeconds(workout),
    cooldownSeconds: structuredWorkoutCooldownSeconds(workout),
    totalSeconds: structuredWorkoutTotalSeconds(workout),
    restType,
    intensity,
    note: workout.note || interval?.note || ''
  };
}

export function structuredWorkoutSummary(structuredWorkout) {
  const breakdown = structuredWorkoutBreakdown(structuredWorkout);
  if (!breakdown) return '';
  const parts = [];
  if (breakdown.compact) parts.push(breakdown.compact);
  if (breakdown.warmupSeconds) parts.push(`oppvarming ${formatDurationWords(breakdown.warmupSeconds)}`);
  if (breakdown.workSeconds) parts.push(`arbeid ${formatDuration(breakdown.workSeconds)}`);
  if (breakdown.restSeconds) parts.push(`hvile ${formatDuration(breakdown.restSeconds)}`);
  if (breakdown.cooldownSeconds) parts.push(`nedjogg ${formatDurationWords(breakdown.cooldownSeconds)}`);
  if (breakdown.totalSeconds) parts.push(`totalt ${formatDuration(breakdown.totalSeconds)}`);
  if (breakdown.restType) parts.push(`hviletype ${breakdown.restType.toLowerCase()}`);
  if (breakdown.intensity) parts.push(`intensitet ${breakdown.intensity.toLowerCase()}`);
  if (breakdown.note) parts.push(breakdown.note);
  return parts.join(' · ');
}

export function structuredIntervalInsights(completedItems = [], todayIso = dateToISO(new Date())) {
  const startIso = addDays(todayIso, -27);
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date >= startIso && item?.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const totalWorkSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0);
  const totalRestSeconds = structuredItems.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0);
  const latest = structuredItems[0] || null;

  return {
    count: structuredItems.length,
    totalWorkSeconds,
    totalRestSeconds,
    latest: latest ? {
      date: latest.date || '',
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null
  };
}

export function structuredIntervalContext(completedItems = [], todayIso = dateToISO(new Date())) {
  const items = Array.isArray(completedItems) ? completedItems : [];
  const structuredItems = items
    .filter(item => item?.date && item.date <= todayIso)
    .map(item => ({
      ...item,
      structuredWorkout: structuredWorkoutFromItem(item)
    }))
    .filter(item => hasStructuredIntervals(item.structuredWorkout))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const summarizeWindow = (days) => {
    const startIso = addDays(todayIso, -(days - 1));
    const inRange = structuredItems.filter(item => item.date >= startIso && item.date <= todayIso);
    return {
      days,
      count: inRange.length,
      totalWorkSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutWorkSeconds(item.structuredWorkout), 0),
      totalRestSeconds: inRange.reduce((sum, item) => sum + structuredWorkoutRestSeconds(item.structuredWorkout), 0)
    };
  };

  const closeWindowStartIso = addDays(todayIso, -13);
  const datesAsc = [...new Set(
    structuredItems
      .filter(item => item.date >= closeWindowStartIso && item.date <= todayIso)
      .map(item => item.date)
  )].sort();
  const closeQualityDays = datesAsc.some((date, index) => {
    if (index === 0) return false;
    const previous = datesAsc[index - 1];
    const diff = (new Date(`${date}T12:00:00`) - new Date(`${previous}T12:00:00`)) / 86400000;
    return diff <= 2;
  });
  const latest = structuredItems[0] || null;

  return {
    last7: summarizeWindow(7),
    last14: summarizeWindow(14),
    last28: summarizeWindow(28),
    latest: latest ? {
      date: latest.date,
      name: latest.name || latest.templateSnapshot?.name || 'Strukturert intervall',
      summary: structuredWorkoutSummary(latest.structuredWorkout)
    } : null,
    closeQualityDays
  };
}

export function formatDurationWords(seconds) {
  const total = parseNonNegativeInteger(seconds);
  if (!total) return '';
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes && remainingSeconds) return `${minutes} min ${remainingSeconds} sek`;
  if (minutes) return `${minutes} min`;
  return `${remainingSeconds} sek`;
}

export function restTypeLabel(value) {
  return {
    float: 'Flyt',
    jog: 'Jogg',
    walk: 'Gange',
    standing: 'Stående',
    passive: 'Passiv'
  }[value] || value || 'Hvile';
}

export function structuredIntensityLabel(value) {
  return {
    easy: 'Rolig',
    threshold: 'Terskel',
    vo2: 'VO2 maks',
    hard: 'Hard',
    sprint: 'Sprint'
  }[value] || value || '';
}

export function normalizeTemplate(template = {}) {
  const source = template && typeof template === 'object' && !Array.isArray(template) ? template : {};
  const roleClassificationVersion = Number(source.roleClassificationVersion) === 2 ? 2 : undefined;
  return {
    ...source,
    id: String(source.id || ''),
    name: String(source.name || 'Uten navn'),
    type: String(source.type || 'Annet'),
    intensity: String(source.intensity || ''),
    role: String(source.role || ''),
    ...(roleClassificationVersion ? { roleClassificationVersion } : {}),
    purpose: String(source.purpose || ''),
    load: String(source.load || ''),
    recommendedWhen: asArray(source.recommendedWhen),
    avoidWhen: asArray(source.avoidWhen),
    structure: String(source.structure || ''),
    sourceUrl: normalizeExerciseUrl(source.sourceUrl),
    structuredWorkout: normalizeStructuredWorkout(source.structuredWorkout),
    exercisePlan: normalizeExercisePlan(source.exercisePlan)
  };
}

export function parseNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatDuration(totalSeconds) {
  const secondsTotal = parseNonNegativeInteger(totalSeconds);
  if (!secondsTotal) return '';
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatPace(secondsPerKm) {
  const secondsTotal = parseNonNegativeInteger(secondsPerKm);
  if (!secondsTotal) return '';
  const minutes = Math.floor(secondsTotal / 60);
  const seconds = secondsTotal % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function calculatePaceMetrics(durationSeconds, distanceKm) {
  const seconds = parseNonNegativeInteger(durationSeconds);
  const distance = Number(String(distanceKm || '').replace(',', '.'));
  if (!seconds || !Number.isFinite(distance) || distance <= 0) {
    return { averageSpeedKmh: '', paceSecondsPerKm: '', paceDisplay: '' };
  }
  const averageSpeedKmh = distance / (seconds / 3600);
  const paceSecondsPerKm = Math.round(seconds / distance);
  return {
    averageSpeedKmh: averageSpeedKmh.toFixed(1),
    paceSecondsPerKm,
    paceDisplay: formatPace(paceSecondsPerKm)
  };
}

export function completedDurationSeconds(completed = {}) {
  if (completed.durationSeconds) return Number(completed.durationSeconds) || 0;
  if (completed.durationMinutes) return (Number(completed.durationMinutes) || 0) * 60;
  return 0;
}

export function formatClockDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function challengeValueLabel(value, metric) {
  const number = Number(value) || 0;
  if (metric === 'hours') return `${number.toLocaleString('no-NO', { maximumFractionDigits: number < 10 ? 1 : 0 })} t`;
  if (metric === 'km') return formatKm(number);
  return `${Math.round(number)} økt${Math.round(number) === 1 ? '' : 'er'}`;
}

export function challengeRemainingLabel(progress, metric) {
  if (progress.done) return 'Mål nådd';
  return `${challengeValueLabel(progress.remaining, metric)} igjen`;
}

export function challengeProgress(challenge, completedItems = [], todayIso) {
  const items = completedItems.filter(item => {
    if (!item.date || item.date < challenge.startDate || item.date > challenge.endDate) return false;
    if (!challenge.activity || challenge.activity === 'all') return true;
    return (item.type || 'Annet') === challenge.activity;
  });
  const target = Number(challenge.target) || 0;
  let current = 0;
  if (challenge.metric === 'hours') current = items.reduce((sum, item) => sum + (Number(item.durationSeconds) || 0), 0) / 3600;
  else if (challenge.metric === 'sessions') current = items.length;
  else current = items.reduce((sum, item) => sum + (Number(item.distanceKm) || 0), 0);
  const percent = target ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;
  const done = target > 0 && current >= target;
  const expired = todayIso > challenge.endDate && !done;
  const remaining = Math.max(0, target - current);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${challenge.endDate}T12:00:00`) - new Date(`${todayIso}T12:00:00`)) / 86400000));
  return { current, target, remaining, percent, done, expired, daysLeft, count: items.length };
}

export function weekPlanDates(today, weekEnd, plannedThisWeek = [], blockedDays = [], count = 0) {
  const busyDates = new Set(plannedThisWeek.map(item => item.date));
  blockedDays.filter(day => day.date >= today && day.date <= weekEnd).forEach(day => busyDates.add(day.date));
  const dates = [];
  const preferredOffsets = count >= 3 ? [1, 3, 5, 2, 4, 6, 0] : count === 2 ? [1, 4, 2, 5, 3, 6, 0] : [1, 2, 3, 4, 5, 6, 0];
  preferredOffsets.forEach(offset => {
    const date = addDays(today, offset);
    if (date >= today && date <= weekEnd && !busyDates.has(date) && !dates.includes(date)) dates.push(date);
  });
  return dates.slice(0, count);
}

export function weekPlanDatesInRange(rangeStart, rangeEnd, plannedItems = [], blockedDays = [], count = 0) {
  const occupiedDates = new Set(plannedItems.map(item => item.date));
  blockedDays.filter(day => day.date >= rangeStart && day.date <= rangeEnd).forEach(day => occupiedDates.add(day.date));
  const placed = new Set(occupiedDates);

  function isAdjacentToPlaced(date) {
    return placed.has(addDays(date, -1)) || placed.has(addDays(date, 1));
  }

  const preferredOffsets = count >= 3 ? [0, 2, 4, 6, 1, 3, 5] : count === 2 ? [0, 3, 1, 4, 2, 5, 6] : [0, 1, 2, 3, 4, 5, 6];
  const dates = [];

  preferredOffsets.forEach(offset => {
    if (dates.length >= count) return;
    const date = addDays(rangeStart, offset);
    if (date >= rangeStart && date <= rangeEnd && !placed.has(date) && !isAdjacentToPlaced(date)) {
      dates.push(date);
      placed.add(date);
    }
  });

  if (dates.length < count) {
    preferredOffsets.forEach(offset => {
      if (dates.length >= count) return;
      const date = addDays(rangeStart, offset);
      if (date >= rangeStart && date <= rangeEnd && !placed.has(date)) {
        dates.push(date);
        placed.add(date);
      }
    });
  }

  return dates.slice(0, count);
}
