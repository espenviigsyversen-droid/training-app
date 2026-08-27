import {
  applyPeriodizedComebackSafety,
  buildFourWeekVolumeFrame,
  derivePeriodizedPlanBaseline,
  normalizePeriodizedTrainingPlan,
  periodizedRolePolicy,
  validateProspectiveVolumeFrame
} from './domain-periodized-training-plan.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ROLE_OPTIONS = ['easy', 'long_easy', 'main_threshold', 'support_threshold', 'recovery', 'x_workout', 'strength', 'mobility', 'technique'];
const DEFAULT_ROLE_LABELS = {
  easy: 'Rolig baseøkt',
  long_easy: 'Rolig langtur',
  main_threshold: 'Hovedterskel',
  support_threshold: 'Støtteterskel',
  recovery: 'Restitusjon',
  x_workout: 'X-økt',
  strength: 'Styrke',
  mobility: 'Mobilitet',
  technique: 'Teknikk'
};

function validIsoDate(value) {
  const text = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(text)) return '';
  const parsed = new Date(`${text}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text ? '' : text;
}

function addIsoDays(value, days) {
  const iso = validIsoDate(value);
  if (!iso) return '';
  const parsed = new Date(`${iso}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + Number(days || 0));
  return parsed.toISOString().slice(0, 10);
}

function isMonday(value) {
  const iso = validIsoDate(value);
  return Boolean(iso && new Date(`${iso}T12:00:00Z`).getUTCDay() === 1);
}

function nextMonday(value) {
  const iso = validIsoDate(value);
  if (!iso) return '';
  const weekday = new Date(`${iso}T12:00:00Z`).getUTCDay() || 7;
  return addIsoDays(iso, 8 - weekday);
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function templateRole(template = {}) {
  return String(template.role || template.workoutRole || '').trim();
}

function templateForRole(templates, role, preferredId = '') {
  const candidates = (Array.isArray(templates) ? templates : []).filter(template => templateRole(template) === role);
  return candidates.find(template => String(template.id || '') === String(preferredId || '')) || candidates[0] || null;
}

function slotDays(count) {
  return {
    1: [4],
    2: [3, 7],
    3: [2, 4, 7],
    4: [2, 4, 6, 7]
  }[count] || [2, 4, 7];
}

function defaultRoles(focus, count) {
  return periodizedRolePolicy({ focus, slotCount: count, weekType: 'load' }).roles;
}

export function trainingProfileRolesForPreview(trainingProfile = {}, count = 3, focus = 'base') {
  const target = Math.max(1, Math.min(4, Math.round(asNumber(count, 3))));
  const fallback = defaultRoles(focus, target);
  const configured = Array.isArray(trainingProfile?.weekPlanRoles) ? trainingProfile.weekPlanRoles : [];
  return Array.from({ length: target }, (_, index) => (
    ROLE_OPTIONS.includes(configured[index]) ? configured[index] : fallback[index]
  ));
}

function formatMetricValue(value, metric) {
  const number = asNumber(value);
  return metric === 'duration' ? `${Math.round(number)} min` : `${Math.round(number)} økter`;
}

function validationLabel(validation = {}) {
  if (validation.validationStatus === 'validated' && validation.outcome === 'within_guardrail') return 'Validert · innenfor volumvakten';
  if (validation.validationStatus === 'validated' && validation.outcome === 'reduced_by_guardrail') return 'Validert · forslaget er redusert';
  if (validation.validationStatus === 'metric_mismatch') return 'Ikke validert · ulik metrikk';
  return 'Ikke validert · mangler historikk';
}

function operationLabel(operation = {}) {
  return {
    create: 'Ny planøkt:',
    update: 'Foreslått endring',
    keep: 'Beholdes',
    remove: 'Foreslått fjernet',
    detach: 'Beholdes som løs økt',
    conflict: 'Krever valg'
  }[operation.type] || 'Forhåndsvisning';
}

function conflictText(reason) {
  return {
    manual_workout: 'Datoen har allerede en manuelt planlagt økt.',
    other_plan: 'Datoen brukes av en annen plan.',
    alternate_date_unavailable: 'Den valgte datoen er ikke ledig i denne uken.',
    template_missing: 'Planplassen mangler en øktmal.',
    schedule_adjustment: 'Du har flyttet denne økten tidligere.',
    user_intent_override: 'Du har endret treningsintensjonen for denne økten.',
    metadata_revision_mismatch: 'Korrigert metadata avviker fra planplassen.'
  }[reason] || 'Planplassen må avklares før den senere kan materialiseres.';
}

export function buildTrainingPlanPreviewModel({
  draft = {},
  completedItems = [],
  continuityFreezes = [],
  comebackState = {},
  templates = [],
  rules,
  volumeRamp = {}
} = {}) {
  const startDate = validIsoDate(draft.startDate);
  const focus = ['base', 'threshold', 'custom'].includes(draft.focus) ? draft.focus : 'base';
  const slotCount = Math.max(1, Math.min(4, Math.round(asNumber(draft.slotCount, 3))));
  const selectedRoles = Array.from({ length: slotCount }, (_, index) => (
    ROLE_OPTIONS.includes(draft.roles?.[index]) ? draft.roles[index] : defaultRoles(focus, slotCount)[index]
  ));
  const requestedMetric = ['auto', 'duration', 'sessions'].includes(draft.metric) ? draft.metric : 'auto';
  const baseline = derivePeriodizedPlanBaseline(completedItems, {
    startDate,
    metric: requestedMetric,
    continuityFreezes,
    rules
  });
  const metric = baseline.metric || 'sessions';
  const normalDays = slotDays(slotCount);
  const loadSlots = selectedRoles.map((role, index) => {
    const template = templateForRole(templates, role, draft.templateIds?.[index]);
    return { role, preferredDay: normalDays[index], templateId: template?.id || null };
  });
  const deloadCount = Math.max(1, slotCount - 1);
  const deloadRoles = periodizedRolePolicy({ focus, slotCount: deloadCount, weekType: 'deload' }).roles;
  const deloadDays = slotDays(deloadCount);
  const deloadSlots = deloadRoles.map((role, index) => ({
    role,
    preferredDay: deloadDays[index],
    templateId: templateForRole(templates, role)?.id || null
  }));
  const slotsByWeek = [loadSlots, loadSlots, loadSlots, deloadSlots];
  const normalFrame = buildFourWeekVolumeFrame({
    startDate,
    baselineValue: baseline.baselineValue,
    metric,
    slotsByWeek,
    focus,
    customRoles: selectedRoles,
    rules
  });
  const safety = applyPeriodizedComebackSafety({
    baseline,
    frame: normalFrame,
    comebackState,
    continuityFreezes,
    startDate
  });
  const frame = safety.frame;
  const validations = frame.weeks.map(week => validateProspectiveVolumeFrame({ frame: week, volumeRamp, rules }));
  const normalizedPlan = normalizePeriodizedTrainingPlan({
    id: String(draft.id || `preview-${startDate || 'draft'}`),
    name: String(draft.name || 'Fireukersblokk').trim() || 'Fireukersblokk',
    focus,
    status: 'draft',
    startDate,
    planRevision: 1,
    calibration: {
      lookbackWeeks: baseline.lookbackWeeks,
      metric,
      baselineValue: safety.adjustedBaselineValue,
      sourceCoverage: baseline.sourceCoverage,
      calculatedAt: '',
      userConfirmed: Boolean(draft.userConfirmed)
    },
    weeks: frame.weeks
  }, { rules });
  const plan = {
    ...normalizedPlan,
    calibration: {
      ...normalizedPlan.calibration,
      normalBaselineValue: safety.normalBaselineValue,
      baselineValue: safety.adjustedBaselineValue,
      excludedWeekCount: safety.excludedWeekCount
    },
    weeks: frame.weeks,
    safety: {
      status: safety.status,
      weekFactor: safety.weekFactor,
      recoveryRegistered: safety.recoveryRegistered,
      materializationPolicy: safety.materializationPolicy
    }
  };
  return { plan, baseline, frame, validations, safety, selectedRoles, loadSlots, deloadSlots };
}

export function createTrainingPlanUi({
  getState,
  getRules = () => undefined,
  todayISO,
  trainingVolumeRamp,
  comebackProtocol,
  controller,
  escapeHtml = value => String(value ?? ''),
  formatDate = value => String(value || ''),
  roleLabels = DEFAULT_ROLE_LABELS
} = {}) {
  if (typeof getState !== 'function') throw new Error('Training plan UI requires getState');
  if (!controller || typeof controller.preview !== 'function') throw new Error('Training plan UI requires preview controller');
  const local = {
    open: false,
    step: 1,
    error: '',
    choices: {},
    draft: null
  };

  function initialDraft() {
    const state = getState() || {};
    const target = Math.max(1, Math.min(4, Math.round(asNumber(state.settings?.goals?.weeklySessionsTarget, 3))));
    const focus = 'base';
    return {
      id: `preview-${Date.now()}`,
      name: 'Baseblokk',
      focus,
      startDate: nextMonday(todayISO()),
      slotCount: target,
      rolePreset: 'profile',
      roles: trainingProfileRolesForPreview(state.settings?.trainingProfile, target, focus),
      templateIds: [],
      metric: 'auto',
      userConfirmed: false
    };
  }

  function ensureDraft() {
    if (!local.draft) local.draft = initialDraft();
    return local.draft;
  }

  function host() {
    return document.getElementById('trainingPlanPreview');
  }

  function rules() {
    return getRules() || undefined;
  }

  function currentModel() {
    const state = getState() || {};
    const draft = ensureDraft();
    const ramp = typeof trainingVolumeRamp === 'function'
      ? trainingVolumeRamp(state.completed || [], { todayIso: todayISO(), rules: rules() })
      : {};
    const freezes = Array.isArray(state.continuityFreezes) ? state.continuityFreezes : [];
    const recoveryDate = freezes
      .filter(item => item?.recoveredAt && ['sick', 'injury'].includes(String(item.reason || '')))
      .map(item => String(item.recoveredAt))
      .sort()
      .at(-1) || '';
    const comeback = typeof comebackProtocol === 'function'
      ? comebackProtocol(state.completed || [], {
        todayIso: draft.startDate || todayISO(),
        weeklyTarget: state.settings?.goals?.weeklySessionsTarget,
        recoveryDate,
        rules: rules()
      })
      : {};
    return {
      ...buildTrainingPlanPreviewModel({
        draft,
        completedItems: state.completed || [],
        continuityFreezes: freezes,
        comebackState: comeback,
        templates: state.templates || [],
        rules: rules(),
        volumeRamp: ramp
      }),
      volumeRamp: ramp,
      comeback
    };
  }

  function safetyNotice(model) {
    const safety = model?.safety || {};
    if (!safety.active) return '';
    const freeze = safety.activeFreeze;
    const freezeText = freeze
      ? `Fryskortet gjelder ${formatDate(freeze.startDate)}–${formatDate(freeze.endDate)}${safety.recoveryRegistered ? '.' : ', og «Frisk igjen» er ikke registrert.'}`
      : 'Et treningsopphold gjør comebackbegrensningen aktiv.';
    const excluded = safety.excludedWeekCount
      ? `${safety.excludedWeekCount} sykdomsuke${safety.excludedWeekCount === 1 ? '' : 'r'} er utelatt fra normalgrunnlaget.`
      : 'Ingen sykdomsuker i baselinevinduet måtte utelates.';
    return `<div class="training-plan-safety-notice" role="status">
      <strong>Sykdom pågår – kontrollert oppstart</strong>
      <p>${escapeHtml(freezeText)} Normalgrunnlaget på ${escapeHtml(formatMetricValue(safety.normalBaselineValue, safety.metric))} er begrenset til ${escapeHtml(formatMetricValue(safety.adjustedBaselineValue, safety.metric))} (${escapeHtml(safety.percent)} %) i uke 1.</p>
      <p>${escapeHtml(excluded)} Uke 1 kan legges i kalenderen når materialisering åpnes; uke 2 og videre venter på registrert friskmelding.</p>
    </div>`;
  }

  function stepNav() {
    return `<div class="training-plan-steps" aria-label="Steg i blokkforhåndsvisning">
      ${[1, 2, 3, 4].map(step => `<span class="${step === local.step ? 'active' : step < local.step ? 'done' : ''}">${step}</span>`).join('')}
    </div>`;
  }

  function stepOne() {
    const draft = ensureDraft();
    return `<div class="training-plan-step">
      <h3>Hva vil du bygge de neste fire ukene?</h3>
      <p>Tre uker bygger belastning. Den fjerde uken gir kroppen rom til å ta til seg treningen.</p>
      <label for="trainingPlanName">Navn</label>
      <input id="trainingPlanName" data-plan-field="name" value="${escapeHtml(draft.name)}" />
      <label for="trainingPlanFocus">Fokus</label>
      <select id="trainingPlanFocus" data-plan-field="focus">
        <option value="base"${draft.focus === 'base' ? ' selected' : ''}>Basebygging</option>
        <option value="threshold"${draft.focus === 'threshold' ? ' selected' : ''}>Terskelblokk</option>
      </select>
      <label for="trainingPlanStart">Start mandag</label>
      <input id="trainingPlanStart" type="date" data-plan-field="startDate" min="${escapeHtml(nextMonday(todayISO()))}" value="${escapeHtml(draft.startDate)}" />
      <p class="small-note">Blokker følger treningsuken, som starter mandag. Første mulige start er neste mandag; en påbegynt uke tas ikke inn midtveis.</p>
      <p class="small-note">Blokken varer til ${escapeHtml(formatDate(addIsoDays(draft.startDate, 27)))}.</p>
    </div>`;
  }

  function templateOptions(role, selectedId, templates) {
    const matching = templates.filter(template => templateRole(template) === role);
    if (!matching.length) return '<option value="">Ingen passende mal funnet</option>';
    return matching.map(template => `<option value="${escapeHtml(template.id)}"${String(template.id) === String(selectedId || matching[0]?.id) ? ' selected' : ''}>${escapeHtml(template.name || 'Uten navn')}</option>`).join('');
  }

  function stepTwo() {
    const state = getState() || {};
    const draft = ensureDraft();
    const roles = Array.from({ length: draft.slotCount }, (_, index) => draft.roles[index] || defaultRoles(draft.focus, draft.slotCount)[index]);
    return `<div class="training-plan-step">
      <h3>Hva skal få fast plass?</h3>
      <p>Rollene gir blokken retning. Du velger konkrete maler for den skrivefrie forhåndsvisningen.</p>
      <label for="trainingPlanRolePreset">Utgangspunkt for roller</label>
      <select id="trainingPlanRolePreset" data-plan-field="rolePreset">
        <option value="profile"${draft.rolePreset === 'profile' ? ' selected' : ''}>Min treningsprofil (anbefalt)</option>
        <option value="block"${draft.rolePreset === 'block' ? ' selected' : ''}>Blokkstandard</option>
        ${draft.rolePreset === 'custom' ? '<option value="custom" selected>Tilpasset av meg</option>' : ''}
      </select>
      <label for="trainingPlanSlotCount">Økter i belastningsukene</label>
      <select id="trainingPlanSlotCount" data-plan-field="slotCount">
        ${[1, 2, 3, 4].map(count => `<option value="${count}"${count === draft.slotCount ? ' selected' : ''}>${count} økt${count === 1 ? '' : 'er'}</option>`).join('')}
      </select>
      <div class="training-plan-role-list">
        ${roles.map((role, index) => `<div class="training-plan-role-row">
          <strong>Plass ${index + 1}</strong>
          <label>Rolle
            <select data-plan-role="${index}">
              ${ROLE_OPTIONS.map(option => `<option value="${option}"${option === role ? ' selected' : ''}>${escapeHtml(roleLabels[option] || DEFAULT_ROLE_LABELS[option] || option)}</option>`).join('')}
            </select>
          </label>
          <label>Øktmal
            <select data-plan-template="${index}">${templateOptions(role, draft.templateIds[index], state.templates || [])}</select>
          </label>
        </div>`).join('')}
      </div>
      <p class="small-note">Treningsprofilen brukes som standard. Blokkstandarden er et synlig alternativ og foreslår Rolig baseøkt, Rolig baseøkt og Rolig langtur. Avlastningsuken får én færre planplass.</p>
    </div>`;
  }

  function stepThree(model) {
    const draft = ensureDraft();
    const baseline = model.baseline;
    const validation = model.validations[0] || {};
    const coverage = Math.round(asNumber(baseline.sourceCoverage) * 100);
    return `<div class="training-plan-step">
      <h3>Volumramme og trygghet</h3>
      <p>Forslaget bruker faktisk historikk. Det gjettes ikke når datagrunnlaget eller metrikken ikke kan sammenlignes.</p>
      ${safetyNotice(model)}
      <label for="trainingPlanMetric">Metrikk</label>
      <select id="trainingPlanMetric" data-plan-field="metric">
        <option value="auto"${draft.metric === 'auto' ? ' selected' : ''}>Velg fra datadekning</option>
        <option value="duration"${draft.metric === 'duration' ? ' selected' : ''}>Treningstid</option>
        <option value="sessions"${draft.metric === 'sessions' ? ' selected' : ''}>Antall økter</option>
      </select>
      <div class="training-plan-baseline-grid">
        <div><span>${model.safety.active ? 'Normalgrunnlag' : 'Utgangspunkt'}</span><strong>${escapeHtml(formatMetricValue(baseline.baselineValue, baseline.metric))}</strong></div>
        ${model.safety.active ? `<div><span>Justert oppstart</span><strong>${escapeHtml(formatMetricValue(model.safety.adjustedBaselineValue, baseline.metric))}</strong></div>` : ''}
        <div><span>Historikk</span><strong>${escapeHtml(`${baseline.weekCount}/${baseline.lookbackWeeks} uker`)}</strong></div>
        <div><span>Datadekning</span><strong>${escapeHtml(`${coverage} %`)}</strong></div>
      </div>
      ${baseline.excludedWeekCount ? `<p class="small-note">${escapeHtml(baseline.excludedWeekCount)} sykdomsuke${baseline.excludedWeekCount === 1 ? '' : 'r'} er eksplisitt ekskludert fra baseline, slik at fravær og comebackreduksjon ikke telles dobbelt.</p>` : ''}
      <div class="training-plan-validation ${escapeHtml(validation.outcome || validation.validationStatus || '')}">
        <strong>${escapeHtml(validationLabel(validation))}</strong>
        <p>${escapeHtml(validation.message || '')}</p>
        ${model.volumeRamp?.ranges ? `<small>Volumvakt: ${escapeHtml(formatDate(model.volumeRamp.ranges.baselineStart))}–${escapeHtml(formatDate(model.volumeRamp.ranges.recentEnd))} · ${escapeHtml(model.volumeRamp.metric === 'duration' ? 'treningstid' : 'antall økter')}</small>` : ''}
      </div>
      <div class="training-plan-mini-weeks">
        ${model.frame.weeks.map((week, index) => `<div><span>Uke ${index + 1}${week.planningState === 'controlled_return' ? ' · kontrollert oppstart' : week.planningState === 'provisional_after_return' ? ' · foreløpig' : week.type === 'deload' ? ' · avlastning' : ''}</span><strong>${escapeHtml(formatMetricValue(model.validations[index]?.proposedTargetMin ?? week.targetMin, week.metric))}–${escapeHtml(formatMetricValue(model.validations[index]?.proposedTargetMax ?? week.targetMax, week.metric))}</strong></div>`).join('')}
      </div>
    </div>`;
  }

  function conflictChoice(operation) {
    if (!operation.requiresChoice) return '';
    if (operation.reason === 'template_missing') return '<p class="small-note">Gå tilbake til steg 2 og velg en mal, eller la planplassen stå som uløst.</p>';
    const selected = local.choices[operation.slotId] || {};
    const options = (operation.allowedActions || []).map(action => ({
      value: action,
      label: {
        choose_another_date: 'Velg en annen dato',
        skip: 'Hopp over planplassen',
        keep_adjusted: 'Behold datoen jeg valgte',
        use_plan_date: 'Bruk planens dato',
        keep_user_intent: 'Behold min endring',
        restore_plan_intent: 'Tilbakestill til planen',
        keep_corrected_metadata: 'Behold korrigert metadata',
        use_plan_metadata: 'Bruk planens metadata',
        detach_keep_workout: 'Behold som løs økt',
        remove_plan_workout: 'Fjern planøkten'
      }[action] || action
    }));
    return `<label>Hva skal skje?
      <select data-plan-conflict-action="${escapeHtml(operation.slotId)}">
        <option value="">Velg handling</option>
        ${options.map(option => `<option value="${escapeHtml(option.value)}"${selected.action === option.value ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
      </select>
    </label>
    ${selected.action === 'choose_another_date' ? `<label>Ny dato i samme uke<input type="date" min="${escapeHtml(operation.weekStart)}" max="${escapeHtml(addIsoDays(operation.weekStart, 6))}" value="${escapeHtml(selected.date || '')}" data-plan-conflict-date="${escapeHtml(operation.slotId)}" /></label>` : ''}`;
  }

  function stepFour(model) {
    const preview = controller.preview(model.plan, { today: todayISO(), choices: local.choices });
    const templates = getState()?.templates || [];
    return `<div class="training-plan-step training-plan-full-preview">
      <h3>Sjekk blokkforhåndsvisningen</h3>
      <p>Dette er bare en lokal forhåndsvisning. Ingen plan eller kalenderøkt lagres i dette steget.</p>
      ${safetyNotice(model)}
      <div class="training-plan-week-grid">
        ${model.plan.weeks.map((week, index) => {
          const validation = model.validations[index] || {};
          const inMaterializationWindow = preview.window?.weekStarts?.includes(week.weekStart);
          return `<section class="training-plan-week ${week.type === 'deload' ? 'deload' : ''}">
            <div class="training-plan-week-head">
              <div><span>Uke ${week.index} av 4</span><strong>${week.planningState === 'controlled_return' ? 'Kontrollert oppstartsuke' : week.type === 'deload' ? 'Avlastningsuke' : index === 2 ? 'Toppuke · foreløpig' : week.planningState === 'provisional_after_return' ? 'Belastningsuke · foreløpig' : 'Belastningsuke'}</strong></div>
              <small>${escapeHtml(week.materializationState === 'awaiting_recovery' ? 'Venter på friskmelding' : inMaterializationWindow ? 'Kan materialiseres når steg 2 åpnes' : 'Planlagt fremover')}</small>
            </div>
            <p>${escapeHtml(formatDate(week.weekStart))}–${escapeHtml(formatDate(week.weekEnd))} · ${escapeHtml(formatMetricValue(validation.proposedTargetMin ?? week.targetMin, week.metric))}–${escapeHtml(formatMetricValue(validation.proposedTargetMax ?? week.targetMax, week.metric))}</p>
            <span class="training-plan-validation-pill ${escapeHtml(validation.outcome || validation.validationStatus || '')}">${escapeHtml(validationLabel(validation))}</span>
            <div class="training-plan-slot-list">
              ${week.slots.map(slot => {
                const template = templates.find(item => String(item.id) === String(slot.templateId));
                return `<div><time>${escapeHtml(formatDate(slot.date))}</time><span>${escapeHtml(roleLabels[slot.role] || DEFAULT_ROLE_LABELS[slot.role] || slot.role)}</span><strong>${escapeHtml(template?.name || 'Mangler øktmal')}</strong></div>`;
              }).join('')}
            </div>
            ${week.type === 'deload' ? `<p class="training-plan-deload-target">Redusert ukesmål: ${escapeHtml(week.effectiveWeeklyTarget)} økter, utledet fra ${escapeHtml(week.slots.length)} planplasser.</p>` : ''}
          </section>`;
        }).join('')}
      </div>
      <section class="training-plan-diff">
        <div class="training-plan-diff-head"><div><span>Kalenderdiff</span><strong>Inneværende og neste uke</strong></div><small>${escapeHtml(preview.summary?.requiresChoice || 0)} valg gjenstår</small></div>
        ${preview.operations.length ? preview.operations.map(operation => `<div class="training-plan-operation ${escapeHtml(operation.type)}">
          <div><span>${escapeHtml(operationLabel(operation))} </span><strong>${escapeHtml(formatDate(operation.date))} · ${escapeHtml(roleLabels[operation.role] || DEFAULT_ROLE_LABELS[operation.role] || operation.role)}</strong><p>${escapeHtml(operation.type === 'conflict' ? conflictText(operation.reason) : operation.reason === 'slot_missing' ? 'Denne planplassen ville blitt opprettet nå.' : 'Eksisterende data beholdes eller vises som differanse.')}</p></div>
          ${operation.blockingItems?.length ? `<ul>${operation.blockingItems.map(item => `<li>${escapeHtml(item.templateSnapshot?.name || item.name || 'Eksisterende økt')} · ${escapeHtml(formatDate(item.date))}</li>`).join('')}</ul>` : ''}
          ${conflictChoice(operation)}
        </div>`).join('') : '<p class="small-note">Ingen uker ligger i materialiseringsvinduet ennå.</p>'}
      </section>
      <div class="training-plan-preview-lock"><strong>Forhåndsvisning uten skriving</strong><p>Lagring er med hensikt ikke tilgjengelig før du har vurdert denne flyten i produksjon.</p></div>
    </div>`;
  }

  function controls() {
    if (local.step === 1) return '<div class="button-row"><button class="btn-primary" data-plan-action="next">Neste: ukerytme</button><button class="btn-soft" data-plan-action="close">Lukk</button></div>';
    if (local.step === 4) return '<div class="button-row"><button class="btn-soft" data-plan-action="back">Tilbake</button><button class="btn-soft" data-plan-action="restart">Start på nytt</button></div>';
    return `<div class="button-row"><button class="btn-primary" data-plan-action="next">${local.step === 2 ? 'Neste: volumramme' : 'Vis full forhåndsvisning'}</button><button class="btn-soft" data-plan-action="back">Tilbake</button></div>`;
  }

  function bind(container) {
    if (container.dataset.planUiBound === 'true') return;
    container.dataset.planUiBound = 'true';
    container.addEventListener('click', event => {
      const action = event.target.closest('[data-plan-action]')?.dataset.planAction;
      if (!action) return;
      if (action === 'open') { local.open = true; local.step = 1; local.error = ''; }
      if (action === 'close') { local.open = false; local.error = ''; }
      if (action === 'back') { local.step = Math.max(1, local.step - 1); local.error = ''; }
      if (action === 'restart') { local.draft = initialDraft(); local.choices = {}; local.step = 1; local.error = ''; }
      if (action === 'next') {
        const draft = ensureDraft();
        if (local.step === 1 && !isMonday(draft.startDate)) local.error = 'Blokker følger treningsuken, som starter mandag.';
        else if (local.step === 1 && draft.startDate < nextMonday(todayISO())) local.error = 'Velg neste mandag eller en senere mandag. En påbegynt uke tas ikke inn midtveis.';
        else {
          local.error = '';
          if (local.step === 3) draft.userConfirmed = true;
          local.step = Math.min(4, local.step + 1);
        }
      }
      render();
    });
    container.addEventListener('change', event => {
      const draft = ensureDraft();
      const field = event.target.dataset.planField;
      if (field) {
        const value = field === 'slotCount' ? Math.max(1, Math.min(4, Math.round(asNumber(event.target.value, 3)))) : event.target.value;
        draft[field] = value;
        if (field === 'rolePreset' || field === 'focus' || field === 'slotCount') {
          const state = getState() || {};
          draft.roles = draft.rolePreset === 'profile'
            ? trainingProfileRolesForPreview(state.settings?.trainingProfile, draft.slotCount, draft.focus)
            : defaultRoles(draft.focus, draft.slotCount);
          draft.templateIds = [];
        }
        draft.userConfirmed = false;
      }
      if (event.target.dataset.planRole !== undefined) {
        const index = Number(event.target.dataset.planRole);
        draft.roles[index] = event.target.value;
        draft.rolePreset = 'custom';
        draft.templateIds[index] = '';
      }
      if (event.target.dataset.planTemplate !== undefined) draft.templateIds[Number(event.target.dataset.planTemplate)] = event.target.value;
      if (event.target.dataset.planConflictAction) {
        const slotId = event.target.dataset.planConflictAction;
        local.choices[slotId] = { ...(local.choices[slotId] || {}), action: event.target.value, date: '' };
      }
      if (event.target.dataset.planConflictDate) {
        const slotId = event.target.dataset.planConflictDate;
        local.choices[slotId] = { ...(local.choices[slotId] || {}), date: event.target.value };
      }
      render();
    });
  }

  function render() {
    const container = host();
    if (!container) return;
    bind(container);
    if (!local.open) {
      container.innerHTML = `<div class="training-plan-entry"><div><h2 class="section-title">Fireukersblokk</h2><p>Lag en skrivefri forhåndsvisning av base, terskel og avlastning før noe kan havne i kalenderen.</p></div><button class="btn-primary" data-plan-action="open">Lag forhåndsvisning</button></div>`;
      return;
    }
    const model = currentModel();
    const content = local.step === 1 ? stepOne() : local.step === 2 ? stepTwo() : local.step === 3 ? stepThree(model) : stepFour(model);
    container.innerHTML = `<div class="training-plan-builder"><div class="training-plan-builder-head"><div><span>Kun forhåndsvisning</span><h2>${escapeHtml(ensureDraft().name || 'Fireukersblokk')}</h2></div><button class="training-plan-close" data-plan-action="close" aria-label="Lukk">×</button></div>${stepNav()}${local.error ? `<div class="error-box">${escapeHtml(local.error)}</div>` : ''}${content}${controls()}</div>`;
  }

  return { render };
}
