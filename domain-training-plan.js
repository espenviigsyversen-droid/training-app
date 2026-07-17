function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function withCoachPrinciples(suggestion, ids = []) {
  return { ...suggestion, principleIds: [...new Set([...(suggestion.principleIds || []), ...ids])] };
}

export function gentleBaseSuggestion(note = 'Foreslått som rolig støtte rundt resten av ukeplanen.') {
  return {
    title: 'Rolig støtteøkt',
    detail: 'Hold økten lett nok til at du bygger kontinuitet uten å bruke opp beina.',
    note,
    principleIds: ['easy_support'],
    types: ['Løping', 'Gåtur', 'Sykling', 'Ski', 'Mobilitet'],
    intensities: ['Rolig', 'Restitusjon'],
    roles: ['long_easy', 'recovery', 'mobility'],
    purposes: ['base', 'recovery', 'mobility'],
    loads: ['low'],
    recommendedWhen: ['normal', 'tired', 'after_hard', 'bonus', 'pain_adaptation'],
    avoidTemplateWhen: [],
    keywords: ['rolig', 'lett', 'kort', 'restitusjon', 'base', 'gå']
  };
}

export function recoverySuggestion(note = 'Foreslått fordi kroppen bør få en lavterskel økt før ny kvalitet.') {
  return {
    title: 'Restitusjon eller alternativ økt',
    detail: 'Velg kort, lett og kontrollert. Målet er bevegelse og trygg progresjon, ikke treningspress.',
    note,
    principleIds: ['recovery_is_training', 'body_signals_first'],
    types: ['Gåtur', 'Mobilitet', 'Sykling', 'Løping'],
    intensities: ['Restitusjon', 'Rolig'],
    roles: ['recovery', 'mobility'],
    purposes: ['recovery', 'mobility', 'base'],
    loads: ['low'],
    recommendedWhen: ['pain_adaptation', 'tired', 'after_hard'],
    avoidTemplateWhen: [],
    keywords: ['restitusjon', 'rolig kort', 'gå', 'mobilitet', 'retur', 'lett']
  };
}

export function mainThresholdSuggestion(note = 'Hovedøkten i en Bakken-inspirert uke: kontrollert terskel, helst litt under maks terskelpress.') {
  return {
    title: 'Hovedterskel',
    detail: 'Ukens viktigste kvalitetsøkt. Hold den kontrollert nok til at du kan trene videre med friske bein.',
    note,
    principleIds: ['controlled_threshold', 'golden_zone', 'fresh_legs'],
    types: ['Løping'],
    intensities: ['Terskel', 'Intervall', 'Tempo'],
    roles: ['main_threshold'],
    purposes: ['threshold'],
    loads: ['moderate'],
    recommendedWhen: ['fresh_legs', 'normal'],
    avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
    keywords: ['terskel', 'intervall', '6x', '6 x', '10x', '10 x', 'drag']
  };
}

export function supportThresholdSuggestion(note = 'Støtteøkt med kvalitet, men ikke en økt som skal tømme deg.') {
  return {
    title: 'Støtteterskel / kontrollert hard',
    detail: 'En lettere kvalitetsøkt enn hovedøkten. Den skal bygge kapasitet uten å bli en konkurranseøkt.',
    note,
    principleIds: ['controlled_threshold', 'golden_zone'],
    types: ['Løping'],
    intensities: ['Terskel', 'Tempo', 'Intervall'],
    roles: ['support_threshold'],
    purposes: ['threshold'],
    loads: ['moderate'],
    recommendedWhen: ['normal', 'fresh_legs'],
    avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
    keywords: ['45/15', 'terskel', 'tempo', 'kort', 'kontrollert', 'intervall']
  };
}

export function longEasySuggestion(note = 'Rolig lengre økt under ca. 70% av makspuls. Dette er byggende rolig volum, ikke restitusjon.') {
  return {
    title: 'Rolig lengre økt',
    detail: 'Bygg aerob base med lav puls og god kontroll. Avslutt heller med overskudd enn å presse lengden.',
    note,
    principleIds: ['easy_support'],
    types: ['Løping', 'Ski', 'Sykling'],
    intensities: ['Rolig'],
    roles: ['long_easy'],
    purposes: ['base'],
    loads: ['low'],
    recommendedWhen: ['normal', 'fresh_legs'],
    avoidTemplateWhen: ['pain'],
    keywords: ['langtur', 'rolig lang', 'lang', 'base', 'sone 1', 'sone 2']
  };
}

export function xWorkoutSuggestion(note = 'Valgfri X-økt hvis du har overskudd: bakke, korte drag, styrke, mobilitet eller ekstra rolig volum.') {
  return {
    title: 'X-økt etter overskudd',
    detail: 'Velg fokus etter behov: teknikk, bakkeløp, korte kontrollerte drag, styrke/mobilitet eller ekstra rolig volum.',
    note,
    principleIds: ['repeatable_week', 'fresh_legs'],
    types: ['Løping', 'Styrke', 'Mobilitet', 'Ski', 'Sykling'],
    intensities: ['Rolig', 'Tempo', 'Terskel', 'Styrke'],
    roles: ['x_workout', 'strength', 'mobility', 'technique'],
    purposes: ['base', 'threshold', 'strength', 'mobility', 'technique'],
    loads: ['low', 'moderate'],
    recommendedWhen: ['fresh_legs', 'normal', 'bonus'],
    avoidTemplateWhen: ['pain', 'many_hard', 'low_hrv'],
    keywords: ['bakke', 'kort', 'styrke', 'mobilitet', 'teknikk', 'rolig', 'langtur']
  };
}

export function suggestionForWorkoutRole(role) {
  const map = {
    main_threshold: () => mainThresholdSuggestion(),
    support_threshold: () => supportThresholdSuggestion(),
    long_easy: () => longEasySuggestion(),
    recovery: () => recoverySuggestion(),
    x_workout: () => xWorkoutSuggestion(),
    strength: () => ({
      title: 'Styrkeøkt', detail: 'Hold kvalitet på teknikk og belastning. Juster volum etter hvordan beina skal brukes videre i uka.',
      note: 'Foreslått fordi dette er en del av normaluka i treningsprofilen.', types: ['Styrke'], intensities: ['Styrke'], roles: ['strength'],
      purposes: ['strength', 'muscle_growth'], loads: ['moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain'],
      keywords: ['styrke', 'helkropp', 'basis', 'bein', 'overkropp']
    }),
    mobility: () => ({
      title: 'Mobilitet', detail: 'Bruk økten til bevegelighet, kontroll og lett restitusjon.',
      note: 'Foreslått fordi mobilitet er lagt inn i normaluka.', types: ['Mobilitet'], intensities: ['Rolig', 'Restitusjon'], roles: ['mobility'],
      purposes: ['mobility', 'recovery'], loads: ['low'], recommendedWhen: ['normal', 'tired', 'after_hard', 'pain_adaptation'], avoidTemplateWhen: [],
      keywords: ['mobilitet', 'yoga', 'stretch', 'bevegelighet']
    }),
    technique: () => ({
      title: 'Teknikkøkt', detail: 'Hold intensiteten kontrollert og bruk økten til rytme, teknikk og bevegelseskvalitet.',
      note: 'Foreslått fordi teknikk er lagt inn i normaluka.', types: ['Ski', 'Løping', 'Sykling'], intensities: ['Rolig', 'Tempo'], roles: ['technique'],
      purposes: ['technique', 'base'], loads: ['low', 'moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain'],
      keywords: ['teknikk', 'staking', 'drill', 'kontroll']
    })
  };
  return (map[role] || (() => gentleBaseSuggestion()))();
}

export function inferredWorkoutRole(template = {}) {
  if (template.role) return template.role;
  const name = String(template.name || '').toLowerCase();
  const type = String(template.type || '').toLowerCase();
  const intensity = String(template.intensity || '').toLowerCase();
  if (type.includes('mobilitet') || name.includes('yoga') || name.includes('mobilitet')) return 'mobility';
  if (type.includes('styrke') || intensity.includes('styrke')) return 'strength';
  if (intensity.includes('restitusjon') || name.includes('restitusjon') || name.includes('gåtur')) return 'recovery';
  if (name.includes('langtur') || name.includes('rolig lang')) return 'long_easy';
  if (['45/15', '10x3', '10 x 3', '12x2', '12 x 2', '30x1', '30 x 1'].some(value => name.includes(value))) return 'support_threshold';
  if (['6x6', '6 x 6', '4x10', '4 x 10', '5x5', '5 x 5'].some(value => name.includes(value))) return 'main_threshold';
  if (intensity.includes('terskel')) return 'support_threshold';
  if (intensity.includes('rolig')) return 'long_easy';
  return 'other';
}

export function normalWeekRoles(profile = {}, goals = {}, defaultRoles = []) {
  const roles = asArray(profile.weekPlanRoles).slice(0, 4);
  asArray(defaultRoles).forEach(role => {
    if (roles.length < 4 && !roles.includes(role)) roles.push(role);
  });
  const target = Math.max(1, Math.min(4, Number(goals.weeklySessionsTarget) || 3));
  return roles.map((role, index) => ({ role, required: index < target, order: index + 1 }));
}

export function roleCoverage(rolePlan, completedItems = [], plannedItems = []) {
  return rolePlan.map(plan => {
    const completed = completedItems.find(item => item.workoutRole === plan.role);
    const planned = plannedItems.find(item => item.workoutRole === plan.role);
    return { ...plan, status: completed ? 'completed' : planned ? 'planned' : plan.required ? 'missing' : 'optional', completed, planned };
  });
}

function missingRoleOrder(profile, goals, completedItems, plannedItems, defaultRoles) {
  return roleCoverage(normalWeekRoles(profile, goals, defaultRoles), completedItems, plannedItems)
    .filter(item => item.status === 'missing' || item.status === 'optional')
    .map(item => item.role);
}

export function normalWeekRoleSuggestions(profile, count, defaultRoles = []) {
  const selected = asArray(profile.weekPlanRoles).slice(0, count);
  asArray(defaultRoles).forEach(role => {
    if (selected.length < count && !selected.includes(role)) selected.push(role);
  });
  return selected.slice(0, count).map(suggestionForWorkoutRole);
}

export function roleAwareSuggestions(count, bodyState, weekItems, profile, goals, completedItems = [], plannedItems = [], options = {}) {
  const target = Math.max(0, Number(count) || 0);
  if (!target) return [];
  if (bodyState.level === 'active' || bodyState.level === 'caution') {
    return [recoverySuggestion('Kroppssignal er fortsatt relevant, så planen starter med lav risiko.'), gentleBaseSuggestion('Rolig støtte før du vurderer ny terskel.'), recoverySuggestion('Hold alternativet lett hvis samme område fortsatt kjennes.'), gentleBaseSuggestion('Bonus bare hvis kroppen svarer fint.')].slice(0, target);
  }
  const getLoadLevel = options.getLoadLevel || (item => item.loadLevel || 'low');
  const hardThisWeek = weekItems.filter(item => getLoadLevel(item) === 'high').length;
  const moderateOrHard = weekItems.filter(item => ['moderate', 'high'].includes(getLoadLevel(item))).length;
  const missingRoles = missingRoleOrder(profile, goals, completedItems, plannedItems, options.defaultRoles || []);
  if (bodyState.level === 'cooling') {
    if (profile.priority === 'injury_free_progression') {
      const safeRoles = missingRoles.filter(role => ['long_easy', 'recovery', 'mobility'].includes(role));
      return [longEasySuggestion('Lav smerte registrert. Start rolig og bekreft at kroppen svarer fint.'), ...safeRoles.map(suggestionForWorkoutRole), gentleBaseSuggestion('Rolig støtte. Legg terskel neste gang kroppen kjennes frisk.'), xWorkoutSuggestion('Bonus hvis beina er friske - men lett er bedre enn hard.')].slice(0, target);
    }
    return [longEasySuggestion('Siste signal virker på vei ned. Start med rolig base og se at kroppen svarer fint.'), ...missingRoles.filter(role => role !== 'long_easy').map(suggestionForWorkoutRole), xWorkoutSuggestion('X-økt hvis beina er friske etter terskel.'), gentleBaseSuggestion('Rolig støtte rundt kvaliteten.')].slice(0, target);
  }
  if (hardThisWeek >= 2 || moderateOrHard >= 3) {
    const controlled = missingRoles.filter(role => ['long_easy', 'recovery', 'mobility'].includes(role)).map(suggestionForWorkoutRole);
    return [...controlled, longEasySuggestion('Perioden har allerede hatt mye kvalitet. Start kontrollert før ny belastning.'), gentleBaseSuggestion('Rolig støtte for kontinuitet.'), recoverySuggestion('Bonus bør være lett hvis totalbelastningen kjennes høy.')].slice(0, target);
  }
  const suggestions = missingRoles.map(suggestionForWorkoutRole);
  const usedRoles = new Set(missingRoles);
  const fallback = normalWeekRoleSuggestions(profile, 4, options.defaultRoles).filter(suggestion => {
    const role = asArray(suggestion.roles)[0] || '';
    if (!role || usedRoles.has(role)) return false;
    usedRoles.add(role);
    return true;
  });
  const result = [...suggestions, ...fallback].slice(0, target);
  const hasX = result.some(suggestion => asArray(suggestion.roles).includes('x_workout'));
  if (!hasX && result.length < target) result.push(xWorkoutSuggestion('X-økt for VO2max, teknikk eller styrke - ta den hvis du har overskudd.'));
  else if (!hasX && target >= 4) result[target - 1] = xWorkoutSuggestion('X-økt for VO2max, teknikk eller styrke - ta den hvis du har overskudd.');
  return result;
}

export function bakkenWeekRecipe(count, bodyState, weekItems, profile, options = {}) {
  const target = Math.max(1, Math.min(4, Number(count) || 3));
  const getLoadLevel = options.getLoadLevel || (item => item.loadLevel || 'low');
  const hard = weekItems.filter(item => getLoadLevel(item) === 'high').length;
  const moderateOrHard = weekItems.filter(item => ['moderate', 'high'].includes(getLoadLevel(item))).length;
  if (bodyState.level === 'active' || bodyState.level === 'caution') return [recoverySuggestion('Kroppssignal er fortsatt relevant, så ukeplanen starter med lav risiko.'), gentleBaseSuggestion('Rolig støtte før du vurderer ny terskel.'), recoverySuggestion('Hold alternativet lett hvis samme område fortsatt kjennes.'), gentleBaseSuggestion('Bonus bare hvis kroppen svarer fint.')].slice(0, target);
  if (bodyState.level === 'cooling') return [longEasySuggestion('Siste signal virker på vei ned. Start uka med rolig base og se at kroppen svarer fint.'), mainThresholdSuggestion('Legg terskel først når kroppen fortsatt kjennes bra etter rolig start.'), gentleBaseSuggestion('Rolig støtte rundt terskeløkten.'), xWorkoutSuggestion('X-økt kun hvis beina er friske.')].slice(0, target);
  if (hard >= 2 || moderateOrHard >= 3) return [longEasySuggestion('Denne uka har allerede hatt mye kvalitet. Neste uke starter mer kontrollert.'), mainThresholdSuggestion('Én kontrollert terskeløkt holder som kvalitet.'), gentleBaseSuggestion('Rolig støtte for kontinuitet.'), recoverySuggestion('Bonus bør være lett hvis totalbelastningen kjennes høy.')].slice(0, target);
  return normalWeekRoleSuggestions(profile, target, options.defaultRoles);
}

export function weekPlanSuggestionMix(mainSuggestion, remainingCount, profile, options = {}) {
  if (remainingCount <= 0) return [];
  if (profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold') {
    return bakkenWeekRecipe(remainingCount, { level: 'none' }, [], profile, options).slice(0, Math.min(remainingCount, 4));
  }
  const suggestions = [mainSuggestion];
  const needsSupport = asArray(mainSuggestion.loads).includes('moderate') || asArray(mainSuggestion.purposes).includes('threshold');
  while (suggestions.length < Math.min(remainingCount, 3)) suggestions.push(gentleBaseSuggestion(needsSupport ? 'Foreslått som rolig støtte rundt kvalitetsøkten, slik at uka blir gjennomførbar.' : 'Foreslått for å bygge kontinuitet uten unødvendig høy belastning.'));
  return suggestions.slice(0, Math.min(remainingCount, 3));
}

function templateMatches(template, keywords = [], roleLabels = {}) {
  const haystack = `${template.name || ''} ${template.type || ''} ${template.intensity || ''} ${template.role || ''} ${roleLabels[template.role] || ''} ${template.purpose || ''} ${template.load || ''} ${asArray(template.recommendedWhen).join(' ')} ${asArray(template.avoidWhen).join(' ')} ${template.structure || ''}`.toLowerCase();
  return keywords.some(keyword => haystack.includes(String(keyword).toLowerCase()));
}

export function templateSuggestionScore(template, suggestion, { roleLabels = {} } = {}) {
  let score = 0;
  if (asArray(suggestion.roles).includes(template.role)) score += 16;
  if (asArray(suggestion.types).includes(template.type)) score += 4;
  if (asArray(suggestion.purposes).includes(template.purpose)) score += 7;
  if (asArray(suggestion.loads).includes(template.load)) score += 5;
  score += asArray(template.recommendedWhen).filter(value => asArray(suggestion.recommendedWhen).includes(value)).length * 4;
  if (asArray(suggestion.intensities).includes(template.intensity)) score += 3;
  if (templateMatches(template, asArray(suggestion.keywords), roleLabels)) score += 2;
  score -= Math.min(asArray(template.avoidWhen).filter(value => asArray(suggestion.avoidTemplateWhen).includes(value)).length * 8, 16);
  return score;
}

export function findSuggestedTemplate(templates = [], suggestion = {}, excludedTemplateIds = [], options = {}) {
  const allTemplates = asArray(templates);
  const excluded = new Set(excludedTemplateIds);
  const available = allTemplates.filter(template => !excluded.has(template.id));
  if (!available.length) return null;
  const ranked = available.map(template => ({ template, score: templateSuggestionScore(template, suggestion, options) })).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) return ranked[0].template;
  const typeMatch = available.filter(template => asArray(suggestion.types).includes(template.type));
  return typeMatch.find(template => templateMatches(template, asArray(suggestion.keywords), options.roleLabels))
    || available.find(template => templateMatches(template, asArray(suggestion.keywords), options.roleLabels))
    || typeMatch.find(template => asArray(suggestion.intensities).includes(template.intensity))
    || available.find(template => asArray(suggestion.intensities).includes(template.intensity))
    || typeMatch[0]
    || allTemplates.find(template => asArray(suggestion.types).includes(template.type))
    || null;
}

export function buildWorkoutSuggestion({ weekSummary = {}, effectSummary = {}, bodyState = {}, profile = {}, goals = {} }) {
  const high = effectSummary.categories?.high_aerobic?.count || 0;
  const anaerobic = effectSummary.categories?.anaerobic?.count || 0;
  const low = effectSummary.categories?.low_aerobic?.count || 0;
  const runningBakkenFocus = profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold';
  const baseSuggestion = { title: 'Rolig aerob økt', detail: 'Hold det lett og kontrollert. Målet er å bygge kontinuitet og komme ut med overskudd.', note: 'Foreslått fordi rolig volum gir best grunnlag for neste kvalitetsøkt.', principleIds: ['easy_support'], types: ['Løping', 'Sykling', 'Ski'], intensities: ['Rolig', 'Restitusjon'], roles: ['long_easy', 'recovery'], purposes: ['base', 'recovery'], loads: ['low'], recommendedWhen: ['normal', 'tired', 'after_hard', 'bonus'], avoidTemplateWhen: [], keywords: ['rolig', 'restitusjon', 'base', 'lett', 'fri'] };
  if (bodyState.level === 'active' || bodyState.level === 'caution') return withCoachPrinciples({ ...baseSuggestion, title: 'Skånsom rolig økt', detail: bodyState.repeatedSameArea ? 'Samme område har dukket opp flere ganger. Hold økten lett, eller velg alternativ trening.' : 'Velg kort og lett. Hvis samme område fortsatt kjennes, bytt til sykkel, mobilitet eller hvile.', note: bodyState.level === 'active' ? 'Passer fordi siste registrerte kroppssignal fortsatt er relevant.' : 'Passer fordi kroppssignalet bør bekreftes med en kontrollert økt før du øker.', types: ['Mobilitet', 'Sykling', 'Løping', 'Ski'], roles: ['recovery', 'mobility'], purposes: ['recovery', 'mobility', 'base'], loads: ['low'], recommendedWhen: ['pain_adaptation', 'tired', 'after_hard'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard'], keywords: ['mobilitet', 'rolig', 'restitusjon', 'lett', 'sykkel'] }, ['body_signals_first', 'recovery_is_training']);
  if (bodyState.level === 'cooling') return withCoachPrinciples({ ...baseSuggestion, title: 'Kontrollert rolig økt', detail: 'Siste økt etter kroppssignalet var uten nye signaler. Bygg videre rolig og se at kroppen svarer fint.', note: 'Passer fordi signalet virker på vei ned, men progresjonen bør fortsatt være kontrollert.', recommendedWhen: ['normal', 'tired', 'pain_adaptation'], keywords: ['rolig', 'base', 'lett', 'restitusjon'] }, ['body_signals_first', 'easy_support']);
  if (profile.primaryFocus === 'strength' && profile.trainingFocus === 'muscle_growth') return { title: 'Styrke med progresjon', detail: 'Prioriter store øvelser, nok volum og god teknikk. Ikke jag kondisjonsbelastning denne økten.', note: 'Foreslått fordi treningsprofilen din står på muskelvekst/bulking.', types: ['Styrke'], intensities: ['Styrke'], roles: ['strength'], purposes: ['muscle_growth', 'strength'], loads: ['moderate', 'high'], recommendedWhen: ['fresh_legs', 'normal'], avoidTemplateWhen: ['pain', 'low_hrv'], keywords: ['styrke', 'basis', 'helkropp', 'overkropp', 'bein', 'progresjon'] };
  if (profile.primaryFocus === 'ski' && profile.trainingFocus === 'technique_skill') return { title: 'Teknikkøkt ski/staking', detail: 'Hold intensiteten kontrollert og fokuser på rytme, kraftoverføring og teknisk kvalitet.', note: 'Foreslått fordi treningsprofilen prioriterer teknikk/ferdighet.', types: ['Ski'], intensities: ['Rolig', 'Tempo'], roles: ['technique'], purposes: ['technique', 'base'], loads: ['low', 'moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain'], keywords: ['staking', 'teknikk', 'rolig', 'ski', 'kontrollert'] };
  if (runningBakkenFocus) {
    if (anaerobic || high >= 2 || (high >= 1 && low === 0)) return withCoachPrinciples({ ...baseSuggestion, note: 'Foreslått fordi du allerede har nok høy belastning eller mangler rolig støtte rundt kvaliteten.' }, ['easy_support', 'fresh_legs']);
    const canSuggestThreshold = profile.priority === 'performance' ? high === 0 : profile.priority === 'injury_free_progression' ? weekSummary.sessions === 0 || (low >= 2 && high === 0) : weekSummary.sessions === 0 || (low >= 1 && high === 0 && weekSummary.sessions < 2);
    if (canSuggestThreshold) return withCoachPrinciples({ title: 'Kontrollert terskeløkt', detail: 'Hold deg kontrollert under maks press. Målet er kvalitet med friske bein, ikke å vinne økten.', note: profile.priority === 'performance' ? 'Foreslått fordi prestasjonsprofilen din prioriterer kvalitetsøkter når belastningsrommet er der.' : 'Foreslått fordi profilen din er Bakken-inspirert løping og uken tåler én kontrollert kvalitetsøkt.', principleIds: ['controlled_threshold', 'golden_zone'], types: ['Løping'], intensities: ['Terskel', 'Tempo'], roles: ['main_threshold', 'support_threshold'], purposes: ['threshold'], loads: ['moderate'], recommendedWhen: ['fresh_legs', 'normal'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'], keywords: ['terskel', 'tempo', '6 x', '10x', 'intervall', 'drag'] }, ['fresh_legs']);
    return baseSuggestion;
  }
  if ((weekSummary.sessions || 0) >= (Number(goals.weeklySessionsTarget) || 3)) return { ...baseSuggestion, title: 'Bonusøkt med lav belastning', note: 'Foreslått fordi ukesmålet allerede er nådd. Hold eventuell ekstra økt lett.', recommendedWhen: ['bonus', 'after_hard', 'tired'] };
  return { title: 'Gjennomførbar basisøkt', detail: 'Velg en økt du vet du klarer å gjennomføre med god følelse.', note: 'Foreslått for å bygge kontinuitet uten å gjøre planleggingen for komplisert.', types: ['Løping', 'Styrke', 'Mobilitet', 'Sykling', 'Ski'], intensities: ['Rolig', 'Styrke', 'Mobilitet'], roles: ['long_easy', 'strength', 'mobility', 'technique'], purposes: ['base', 'strength', 'mobility', 'technique'], loads: ['low', 'moderate'], recommendedWhen: ['normal', 'fresh_legs', 'tired'], avoidTemplateWhen: ['pain'], keywords: ['rolig', 'basis', 'mobilitet', 'styrke', 'lett'] };
}

export function raceTestWeekSuggestion(raceContext) {
  if (!raceContext?.allowRaceTest || !raceContext.testSuggestion) return null;
  return { title: raceContext.testSuggestion.title || 'Kontrollert testløp', detail: raceContext.testSuggestion.detail || 'Kontrollert test - juster etter dagsform', note: raceContext.testSuggestion.note || raceContext.note || 'Bruk testløp som datapunkt, ikke som maksimal belastning.', principleIds: ['controlled_threshold', 'body_signals_first'], types: ['Løping'], intensities: ['Tempo', 'Terskel', 'Intervall'], roles: ['race'], purposes: ['race'], loads: ['moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'], keywords: ['race', 'testløp', 'konkurranse', 'kontrollert', 'tempo'] };
}

export function applyRaceContextToSuggestionMix(suggestions, raceContext, count) {
  const target = Math.max(0, Number(count) || 0);
  if (!raceContext?.active || !target) return suggestions.slice(0, target);
  const avoidRoles = new Set(asArray(raceContext.avoidRoles));
  let next = suggestions.filter(suggestion => !asArray(suggestion.roles).some(role => avoidRoles.has(role)));
  const testSuggestion = raceTestWeekSuggestion(raceContext);
  if (testSuggestion && !next.some(suggestion => asArray(suggestion.roles).includes('race'))) next = [testSuggestion, ...next];
  while (next.length < target) next.push(gentleBaseSuggestion('Mål-løpet ligger i bakgrunnen, men planen bør først sikre rolig kontinuitet og friske bein.'));
  return next.slice(0, target);
}

export function assembleWeekPlanSuggestions(suggestions, dates, templates = [], options = {}) {
  const usedTemplateIds = [];
  return suggestions.map((suggestion, index) => {
    const template = findSuggestedTemplate(templates, suggestion, usedTemplateIds, options);
    if (template) usedTemplateIds.push(template.id);
    return { suggestion, template, date: dates[index] };
  }).filter(item => item.date);
}

export function nextWeekPlanSummary(planned, suggested, goals, status, bodyState) {
  const target = Math.max(1, Number(goals.weeklySessionsTarget) || 3);
  if (planned.length >= target) return `Neste uke er allerede dekket med ${planned.length} planlagte økter.`;
  if (bodyState.level === 'active' || bodyState.level === 'caution') return 'Neste uke starter med lavere risiko fordi et kroppssignal fortsatt kan være relevant. Øk først når samme område kjennes bra.';
  if (bodyState.level === 'cooling') return 'Neste uke starter rolig og bygger mot terskel hvis kroppen fortsatt svarer fint.';
  if (status.level === 'caution') return `Neste uke bør starte kontrollert. Appen foreslår ${suggested.length} økt${suggested.length === 1 ? '' : 'er'} med lavere risiko først.`;
  return `Forslag til neste uke: ${suggested.length} økt${suggested.length === 1 ? '' : 'er'} mot ukesmålet på ${target}, med kvalitet, rolig base og justering etter dagsform.`;
}

