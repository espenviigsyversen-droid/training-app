function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function withCoachPrinciples(suggestion, ids = []) {
  return { ...suggestion, principleIds: [...new Set([...(suggestion.principleIds || []), ...ids])] };
}

export function gentleBaseSuggestion(note = 'ForeslÃ¥tt som rolig stÃ¸tte rundt resten av ukeplanen.') {
  return {
    title: 'Rolig stÃ¸tteÃ¸kt',
    detail: 'Hold Ã¸kten lett nok til at du bygger kontinuitet uten Ã¥ bruke opp beina.',
    note,
    principleIds: ['easy_support'],
    types: ['LÃ¸ping', 'GÃ¥tur', 'Sykling', 'Ski', 'Mobilitet'],
    intensities: ['Rolig', 'Restitusjon'],
    roles: ['long_easy', 'recovery', 'mobility'],
    purposes: ['base', 'recovery', 'mobility'],
    loads: ['low'],
    recommendedWhen: ['normal', 'tired', 'after_hard', 'bonus', 'pain_adaptation'],
    avoidTemplateWhen: [],
    keywords: ['rolig', 'lett', 'kort', 'restitusjon', 'base', 'gÃ¥']
  };
}

export function recoverySuggestion(note = 'ForeslÃ¥tt fordi kroppen bÃ¸r fÃ¥ en lavterskel Ã¸kt fÃ¸r ny kvalitet.') {
  return {
    title: 'Restitusjon eller alternativ Ã¸kt',
    detail: 'Velg kort, lett og kontrollert. MÃ¥let er bevegelse og trygg progresjon, ikke treningspress.',
    note,
    principleIds: ['recovery_is_training', 'body_signals_first'],
    types: ['GÃ¥tur', 'Mobilitet', 'Sykling', 'LÃ¸ping'],
    intensities: ['Restitusjon', 'Rolig'],
    roles: ['recovery', 'mobility'],
    purposes: ['recovery', 'mobility', 'base'],
    loads: ['low'],
    recommendedWhen: ['pain_adaptation', 'tired', 'after_hard'],
    avoidTemplateWhen: [],
    keywords: ['restitusjon', 'rolig kort', 'gÃ¥', 'mobilitet', 'retur', 'lett']
  };
}

export function mainThresholdSuggestion(note = 'HovedÃ¸kten i en Bakken-inspirert uke: kontrollert terskel, helst litt under maks terskelpress.') {
  return {
    title: 'Hovedterskel',
    detail: 'Ukens viktigste kvalitetsÃ¸kt. Hold den kontrollert nok til at du kan trene videre med friske bein.',
    note,
    principleIds: ['controlled_threshold', 'golden_zone', 'fresh_legs'],
    types: ['LÃ¸ping'],
    intensities: ['Terskel', 'Intervall', 'Tempo'],
    roles: ['main_threshold'],
    purposes: ['threshold'],
    loads: ['moderate'],
    recommendedWhen: ['fresh_legs', 'normal'],
    avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
    keywords: ['terskel', 'intervall', '6x', '6 x', '10x', '10 x', 'drag']
  };
}

export function supportThresholdSuggestion(note = 'StÃ¸tteÃ¸kt med kvalitet, men ikke en Ã¸kt som skal tÃ¸mme deg.') {
  return {
    title: 'StÃ¸tteterskel / kontrollert hard',
    detail: 'En lettere kvalitetsÃ¸kt enn hovedÃ¸kten. Den skal bygge kapasitet uten Ã¥ bli en konkurranseÃ¸kt.',
    note,
    principleIds: ['controlled_threshold', 'golden_zone'],
    types: ['LÃ¸ping'],
    intensities: ['Terskel', 'Tempo', 'Intervall'],
    roles: ['support_threshold'],
    purposes: ['threshold'],
    loads: ['moderate'],
    recommendedWhen: ['normal', 'fresh_legs'],
    avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'],
    keywords: ['45/15', 'terskel', 'tempo', 'kort', 'kontrollert', 'intervall']
  };
}

export function longEasySuggestion(note = 'Rolig lengre Ã¸kt under ca. 70% av makspuls. Dette er byggende rolig volum, ikke restitusjon.') {
  return {
    title: 'Rolig lengre Ã¸kt',
    detail: 'Bygg aerob base med lav puls og god kontroll. Avslutt heller med overskudd enn Ã¥ presse lengden.',
    note,
    principleIds: ['easy_support'],
    types: ['LÃ¸ping', 'Ski', 'Sykling'],
    intensities: ['Rolig'],
    roles: ['long_easy'],
    purposes: ['base'],
    loads: ['low'],
    recommendedWhen: ['normal', 'fresh_legs'],
    avoidTemplateWhen: ['pain'],
    keywords: ['langtur', 'rolig lang', 'lang', 'base', 'sone 1', 'sone 2']
  };
}

export function xWorkoutSuggestion(note = 'Valgfri X-Ã¸kt hvis du har overskudd: bakke, korte drag, styrke, mobilitet eller ekstra rolig volum.') {
  return {
    title: 'X-Ã¸kt etter overskudd',
    detail: 'Velg fokus etter behov: teknikk, bakkelÃ¸p, korte kontrollerte drag, styrke/mobilitet eller ekstra rolig volum.',
    note,
    principleIds: ['repeatable_week', 'fresh_legs'],
    types: ['LÃ¸ping', 'Styrke', 'Mobilitet', 'Ski', 'Sykling'],
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
      title: 'StyrkeÃ¸kt', detail: 'Hold kvalitet pÃ¥ teknikk og belastning. Juster volum etter hvordan beina skal brukes videre i uka.',
      note: 'ForeslÃ¥tt fordi dette er en del av normaluka i treningsprofilen.', types: ['Styrke'], intensities: ['Styrke'], roles: ['strength'],
      purposes: ['strength', 'muscle_growth'], loads: ['moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain'],
      keywords: ['styrke', 'helkropp', 'basis', 'bein', 'overkropp']
    }),
    mobility: () => ({
      title: 'Mobilitet', detail: 'Bruk Ã¸kten til bevegelighet, kontroll og lett restitusjon.',
      note: 'ForeslÃ¥tt fordi mobilitet er lagt inn i normaluka.', types: ['Mobilitet'], intensities: ['Rolig', 'Restitusjon'], roles: ['mobility'],
      purposes: ['mobility', 'recovery'], loads: ['low'], recommendedWhen: ['normal', 'tired', 'after_hard', 'pain_adaptation'], avoidTemplateWhen: [],
      keywords: ['mobilitet', 'yoga', 'stretch', 'bevegelighet']
    }),
    technique: () => ({
      title: 'TeknikkÃ¸kt', detail: 'Hold intensiteten kontrollert og bruk Ã¸kten til rytme, teknikk og bevegelseskvalitet.',
      note: 'ForeslÃ¥tt fordi teknikk er lagt inn i normaluka.', types: ['Ski', 'LÃ¸ping', 'Sykling'], intensities: ['Rolig', 'Tempo'], roles: ['technique'],
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
  if (intensity.includes('restitusjon') || name.includes('restitusjon') || name.includes('gÃ¥tur')) return 'recovery';
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
    return [recoverySuggestion('Kroppssignal er fortsatt relevant, sÃ¥ planen starter med lav risiko.'), gentleBaseSuggestion('Rolig stÃ¸tte fÃ¸r du vurderer ny terskel.'), recoverySuggestion('Hold alternativet lett hvis samme omrÃ¥de fortsatt kjennes.'), gentleBaseSuggestion('Bonus bare hvis kroppen svarer fint.')].slice(0, target);
  }
  const getLoadLevel = options.getLoadLevel || (item => item.loadLevel || 'low');
  const hardThisWeek = weekItems.filter(item => getLoadLevel(item) === 'high').length;
  const moderateOrHard = weekItems.filter(item => ['moderate', 'high'].includes(getLoadLevel(item))).length;
  const missingRoles = missingRoleOrder(profile, goals, completedItems, plannedItems, options.defaultRoles || []);
  if (bodyState.level === 'cooling') {
    if (profile.priority === 'injury_free_progression') {
      const safeRoles = missingRoles.filter(role => ['long_easy', 'recovery', 'mobility'].includes(role));
      return [longEasySuggestion('Lav smerte registrert. Start rolig og bekreft at kroppen svarer fint.'), ...safeRoles.map(suggestionForWorkoutRole), gentleBaseSuggestion('Rolig stÃ¸tte. Legg terskel neste gang kroppen kjennes frisk.'), xWorkoutSuggestion('Bonus hvis beina er friske - men lett er bedre enn hard.')].slice(0, target);
    }
    return [longEasySuggestion('Siste signal virker pÃ¥ vei ned. Start med rolig base og se at kroppen svarer fint.'), ...missingRoles.filter(role => role !== 'long_easy').map(suggestionForWorkoutRole), xWorkoutSuggestion('X-Ã¸kt hvis beina er friske etter terskel.'), gentleBaseSuggestion('Rolig stÃ¸tte rundt kvaliteten.')].slice(0, target);
  }
  if (hardThisWeek >= 2 || moderateOrHard >= 3) {
    const controlled = missingRoles.filter(role => ['long_easy', 'recovery', 'mobility'].includes(role)).map(suggestionForWorkoutRole);
    return [...controlled, longEasySuggestion('Perioden har allerede hatt mye kvalitet. Start kontrollert fÃ¸r ny belastning.'), gentleBaseSuggestion('Rolig stÃ¸tte for kontinuitet.'), recoverySuggestion('Bonus bÃ¸r vÃ¦re lett hvis totalbelastningen kjennes hÃ¸y.')].slice(0, target);
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
  if (!hasX && result.length < target) result.push(xWorkoutSuggestion('X-Ã¸kt for VO2max, teknikk eller styrke - ta den hvis du har overskudd.'));
  else if (!hasX && target >= 4) result[target - 1] = xWorkoutSuggestion('X-Ã¸kt for VO2max, teknikk eller styrke - ta den hvis du har overskudd.');
  return result;
}

export function bakkenWeekRecipe(count, bodyState, weekItems, profile, options = {}) {
  const target = Math.max(1, Math.min(4, Number(count) || 3));
  const getLoadLevel = options.getLoadLevel || (item => item.loadLevel || 'low');
  const hard = weekItems.filter(item => getLoadLevel(item) === 'high').length;
  const moderateOrHard = weekItems.filter(item => ['moderate', 'high'].includes(getLoadLevel(item))).length;
  if (bodyState.level === 'active' || bodyState.level === 'caution') return [recoverySuggestion('Kroppssignal er fortsatt relevant, sÃ¥ ukeplanen starter med lav risiko.'), gentleBaseSuggestion('Rolig stÃ¸tte fÃ¸r du vurderer ny terskel.'), recoverySuggestion('Hold alternativet lett hvis samme omrÃ¥de fortsatt kjennes.'), gentleBaseSuggestion('Bonus bare hvis kroppen svarer fint.')].slice(0, target);
  if (bodyState.level === 'cooling') return [longEasySuggestion('Siste signal virker pÃ¥ vei ned. Start uka med rolig base og se at kroppen svarer fint.'), mainThresholdSuggestion('Legg terskel fÃ¸rst nÃ¥r kroppen fortsatt kjennes bra etter rolig start.'), gentleBaseSuggestion('Rolig stÃ¸tte rundt terskelÃ¸kten.'), xWorkoutSuggestion('X-Ã¸kt kun hvis beina er friske.')].slice(0, target);
  if (hard >= 2 || moderateOrHard >= 3) return [longEasySuggestion('Denne uka har allerede hatt mye kvalitet. Neste uke starter mer kontrollert.'), mainThresholdSuggestion('Ã‰n kontrollert terskelÃ¸kt holder som kvalitet.'), gentleBaseSuggestion('Rolig stÃ¸tte for kontinuitet.'), recoverySuggestion('Bonus bÃ¸r vÃ¦re lett hvis totalbelastningen kjennes hÃ¸y.')].slice(0, target);
  return normalWeekRoleSuggestions(profile, target, options.defaultRoles);
}

export function weekPlanSuggestionMix(mainSuggestion, remainingCount, profile, options = {}) {
  if (remainingCount <= 0) return [];
  if (profile.primaryFocus === 'running' && profile.philosophy === 'bakken_threshold') {
    return bakkenWeekRecipe(remainingCount, { level: 'none' }, [], profile, options).slice(0, Math.min(remainingCount, 4));
  }
  const suggestions = [mainSuggestion];
  const needsSupport = asArray(mainSuggestion.loads).includes('moderate') || asArray(mainSuggestion.purposes).includes('threshold');
  while (suggestions.length < Math.min(remainingCount, 3)) suggestions.push(gentleBaseSuggestion(needsSupport ? 'ForeslÃ¥tt som rolig stÃ¸tte rundt kvalitetsÃ¸kten, slik at uka blir gjennomfÃ¸rbar.' : 'ForeslÃ¥tt for Ã¥ bygge kontinuitet uten unÃ¸dvendig hÃ¸y belastning.'));
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
  const baseSuggestion = { title: 'Rolig aerob Ã¸kt', detail: 'Hold det lett og kontrollert. MÃ¥let er Ã¥ bygge kontinuitet og komme ut med overskudd.', note: 'ForeslÃ¥tt fordi rolig volum gir best grunnlag for neste kvalitetsÃ¸kt.', principleIds: ['easy_support'], types: ['LÃ¸ping', 'Sykling', 'Ski'], intensities: ['Rolig', 'Restitusjon'], roles: ['long_easy', 'recovery'], purposes: ['base', 'recovery'], loads: ['low'], recommendedWhen: ['normal', 'tired', 'after_hard', 'bonus'], avoidTemplateWhen: [], keywords: ['rolig', 'restitusjon', 'base', 'lett', 'fri'] };
  if (bodyState.level === 'active' || bodyState.level === 'caution') return withCoachPrinciples({ ...baseSuggestion, title: 'SkÃ¥nsom rolig Ã¸kt', detail: bodyState.repeatedSameArea ? 'Samme omrÃ¥de har dukket opp flere ganger. Hold Ã¸kten lett, eller velg alternativ trening.' : 'Velg kort og lett. Hvis samme omrÃ¥de fortsatt kjennes, bytt til sykkel, mobilitet eller hvile.', note: bodyState.level === 'active' ? 'Passer fordi siste registrerte kroppssignal fortsatt er relevant.' : 'Passer fordi kroppssignalet bÃ¸r bekreftes med en kontrollert Ã¸kt fÃ¸r du Ã¸ker.', types: ['Mobilitet', 'Sykling', 'LÃ¸ping', 'Ski'], roles: ['recovery', 'mobility'], purposes: ['recovery', 'mobility', 'base'], loads: ['low'], recommendedWhen: ['pain_adaptation', 'tired', 'after_hard'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard'], keywords: ['mobilitet', 'rolig', 'restitusjon', 'lett', 'sykkel'] }, ['body_signals_first', 'recovery_is_training']);
  if (bodyState.level === 'cooling') return withCoachPrinciples({ ...baseSuggestion, title: 'Kontrollert rolig Ã¸kt', detail: 'Siste Ã¸kt etter kroppssignalet var uten nye signaler. Bygg videre rolig og se at kroppen svarer fint.', note: 'Passer fordi signalet virker pÃ¥ vei ned, men progresjonen bÃ¸r fortsatt vÃ¦re kontrollert.', recommendedWhen: ['normal', 'tired', 'pain_adaptation'], keywords: ['rolig', 'base', 'lett', 'restitusjon'] }, ['body_signals_first', 'easy_support']);
  if (profile.primaryFocus === 'strength' && profile.trainingFocus === 'muscle_growth') return { title: 'Styrke med progresjon', detail: 'Prioriter store Ã¸velser, nok volum og god teknikk. Ikke jag kondisjonsbelastning denne Ã¸kten.', note: 'ForeslÃ¥tt fordi treningsprofilen din stÃ¥r pÃ¥ muskelvekst/bulking.', types: ['Styrke'], intensities: ['Styrke'], roles: ['strength'], purposes: ['muscle_growth', 'strength'], loads: ['moderate', 'high'], recommendedWhen: ['fresh_legs', 'normal'], avoidTemplateWhen: ['pain', 'low_hrv'], keywords: ['styrke', 'basis', 'helkropp', 'overkropp', 'bein', 'progresjon'] };
  if (profile.primaryFocus === 'ski' && profile.trainingFocus === 'technique_skill') return { title: 'TeknikkÃ¸kt ski/staking', detail: 'Hold intensiteten kontrollert og fokuser pÃ¥ rytme, kraftoverfÃ¸ring og teknisk kvalitet.', note: 'ForeslÃ¥tt fordi treningsprofilen prioriterer teknikk/ferdighet.', types: ['Ski'], intensities: ['Rolig', 'Tempo'], roles: ['technique'], purposes: ['technique', 'base'], loads: ['low', 'moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain'], keywords: ['staking', 'teknikk', 'rolig', 'ski', 'kontrollert'] };
  if (runningBakkenFocus) {
    if (anaerobic || high >= 2 || (high >= 1 && low === 0)) return withCoachPrinciples({ ...baseSuggestion, note: 'ForeslÃ¥tt fordi du allerede har nok hÃ¸y belastning eller mangler rolig stÃ¸tte rundt kvaliteten.' }, ['easy_support', 'fresh_legs']);
    const canSuggestThreshold = profile.priority === 'performance' ? high === 0 : profile.priority === 'injury_free_progression' ? weekSummary.sessions === 0 || (low >= 2 && high === 0) : weekSummary.sessions === 0 || (low >= 1 && high === 0 && weekSummary.sessions < 2);
    if (canSuggestThreshold) return withCoachPrinciples({ title: 'Kontrollert terskelÃ¸kt', detail: 'Hold deg kontrollert under maks press. MÃ¥let er kvalitet med friske bein, ikke Ã¥ vinne Ã¸kten.', note: profile.priority === 'performance' ? 'ForeslÃ¥tt fordi prestasjonsprofilen din prioriterer kvalitetsÃ¸kter nÃ¥r belastningsrommet er der.' : 'ForeslÃ¥tt fordi profilen din er Bakken-inspirert lÃ¸ping og uken tÃ¥ler Ã©n kontrollert kvalitetsÃ¸kt.', principleIds: ['controlled_threshold', 'golden_zone'], types: ['LÃ¸ping'], intensities: ['Terskel', 'Tempo'], roles: ['main_threshold', 'support_threshold'], purposes: ['threshold'], loads: ['moderate'], recommendedWhen: ['fresh_legs', 'normal'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'], keywords: ['terskel', 'tempo', '6 x', '10x', 'intervall', 'drag'] }, ['fresh_legs']);
    return baseSuggestion;
  }
  if ((weekSummary.sessions || 0) >= (Number(goals.weeklySessionsTarget) || 3)) return { ...baseSuggestion, title: 'BonusÃ¸kt med lav belastning', note: 'ForeslÃ¥tt fordi ukesmÃ¥let allerede er nÃ¥dd. Hold eventuell ekstra Ã¸kt lett.', recommendedWhen: ['bonus', 'after_hard', 'tired'] };
  return { title: 'GjennomfÃ¸rbar basisÃ¸kt', detail: 'Velg en Ã¸kt du vet du klarer Ã¥ gjennomfÃ¸re med god fÃ¸lelse.', note: 'ForeslÃ¥tt for Ã¥ bygge kontinuitet uten Ã¥ gjÃ¸re planleggingen for komplisert.', types: ['LÃ¸ping', 'Styrke', 'Mobilitet', 'Sykling', 'Ski'], intensities: ['Rolig', 'Styrke', 'Mobilitet'], roles: ['long_easy', 'strength', 'mobility', 'technique'], purposes: ['base', 'strength', 'mobility', 'technique'], loads: ['low', 'moderate'], recommendedWhen: ['normal', 'fresh_legs', 'tired'], avoidTemplateWhen: ['pain'], keywords: ['rolig', 'basis', 'mobilitet', 'styrke', 'lett'] };
}

export function raceTestWeekSuggestion(raceContext) {
  if (!raceContext?.allowRaceTest || !raceContext.testSuggestion) return null;
  return { title: raceContext.testSuggestion.title || 'Kontrollert testlÃ¸p', detail: raceContext.testSuggestion.detail || 'Kontrollert test - juster etter dagsform', note: raceContext.testSuggestion.note || raceContext.note || 'Bruk testlÃ¸p som datapunkt, ikke som maksimal belastning.', principleIds: ['controlled_threshold', 'body_signals_first'], types: ['LÃ¸ping'], intensities: ['Tempo', 'Terskel', 'Intervall'], roles: ['race'], purposes: ['race'], loads: ['moderate'], recommendedWhen: ['normal', 'fresh_legs'], avoidTemplateWhen: ['pain', 'heavy_legs', 'many_hard', 'low_hrv'], keywords: ['race', 'testlÃ¸p', 'konkurranse', 'kontrollert', 'tempo'] };
}

export function applyRaceContextToSuggestionMix(suggestions, raceContext, count) {
  const target = Math.max(0, Number(count) || 0);
  if (!raceContext?.active || !target) return suggestions.slice(0, target);
  const avoidRoles = new Set(asArray(raceContext.avoidRoles));
  let next = suggestions.filter(suggestion => !asArray(suggestion.roles).some(role => avoidRoles.has(role)));
  const testSuggestion = raceTestWeekSuggestion(raceContext);
  if (testSuggestion && !next.some(suggestion => asArray(suggestion.roles).includes('race'))) next = [testSuggestion, ...next];
  while (next.length < target) next.push(gentleBaseSuggestion('MÃ¥l-lÃ¸pet ligger i bakgrunnen, men planen bÃ¸r fÃ¸rst sikre rolig kontinuitet og friske bein.'));
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
  if (planned.length >= target) return `Neste uke er allerede dekket med ${planned.length} planlagte Ã¸kter.`;
  if (bodyState.level === 'active' || bodyState.level === 'caution') return 'Neste uke starter med lavere risiko fordi et kroppssignal fortsatt kan vÃ¦re relevant. Ã˜k fÃ¸rst nÃ¥r samme omrÃ¥de kjennes bra.';
  if (bodyState.level === 'cooling') return 'Neste uke starter rolig og bygger mot terskel hvis kroppen fortsatt svarer fint.';
  if (status.level === 'caution') return `Neste uke bÃ¸r starte kontrollert. Appen foreslÃ¥r ${suggested.length} Ã¸kt${suggested.length === 1 ? '' : 'er'} med lavere risiko fÃ¸rst.`;
  return `Forslag til neste uke: ${suggested.length} Ã¸kt${suggested.length === 1 ? '' : 'er'} mot ukesmÃ¥let pÃ¥ ${target}, med kvalitet, rolig base og justering etter dagsform.`;
}

