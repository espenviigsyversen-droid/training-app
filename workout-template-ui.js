const TEMPLATE_ROLE_ORDER = [
  'main_threshold',
  'support_threshold',
  'long_easy',
  'recovery',
  'x_workout',
  'race',
  'strength',
  'mobility',
  'technique',
  'other'
];

const RECOMMENDED_WHEN_LABELS = {
  normal: 'Passer normal dag',
  fresh_legs: 'Passer med friske bein',
  tired: 'Passer når litt sliten',
  after_hard: 'Passer etter hard økt',
  pain_adaptation: 'Passer ved småvondt/tilpasning',
  bonus: 'Passer som bonusøkt'
};

const AVOID_WHEN_LABELS = {
  pain: 'Unngå ved smerte',
  heavy_legs: 'Unngå ved tunge bein',
  many_hard: 'Unngå ved mye hardt',
  low_hrv: 'Unngå ved lav HRV'
};

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'nb', {
    numeric: true,
    sensitivity: 'base'
  });
}

function labelsFromMap(value, labels) {
  return asArray(value).map(item => labels[item] || item).filter(Boolean).join(' · ');
}

export function workoutTemplateReadiness(template = {}) {
  const missing = [];
  if (!template.role) missing.push('Øktrolle');
  if (!template.purpose) missing.push('Coach-formål');
  if (!template.load) missing.push('Belastning');
  if (!asArray(template.recommendedWhen).length) missing.push('Passer best når');
  return {
    ready: missing.length === 0,
    missing,
    score: 4 - missing.length
  };
}

export function sortWorkoutTemplates(templates = [], activityTypes = []) {
  return [...templates].sort((a, b) => {
    const aTypeIndex = activityTypes.indexOf(a.type);
    const bTypeIndex = activityTypes.indexOf(b.type);
    const aTypeRank = aTypeIndex === -1 ? 999 : aTypeIndex;
    const bTypeRank = bTypeIndex === -1 ? 999 : bTypeIndex;
    if (aTypeRank !== bTypeRank) return aTypeRank - bTypeRank;

    const typeCompare = compareText(a.type, b.type);
    if (typeCompare !== 0) return typeCompare;

    const aRoleIndex = TEMPLATE_ROLE_ORDER.indexOf(a.role || 'other');
    const bRoleIndex = TEMPLATE_ROLE_ORDER.indexOf(b.role || 'other');
    const aRoleRank = aRoleIndex === -1 ? 999 : aRoleIndex;
    const bRoleRank = bRoleIndex === -1 ? 999 : bRoleIndex;
    if (aRoleRank !== bRoleRank) return aRoleRank - bRoleRank;
    return compareText(a.name, b.name);
  });
}

export function filterWorkoutTemplates({
  templates = [],
  activityTypes = [],
  query = '',
  typeFilter = 'Alle',
  coachFilter = 'all',
  structuredSummary = () => '',
  roleLabel = value => value || '',
  purposeLabel = value => value || '',
  loadLabel = value => value || ''
} = {}) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  return sortWorkoutTemplates(templates, activityTypes).filter(template => {
    const searchText = [
      template.name,
      template.type,
      template.intensity,
      template.structure,
      structuredSummary(template.structuredWorkout),
      roleLabel(template.role),
      purposeLabel(template.purpose),
      loadLabel(template.load),
      labelsFromMap(template.recommendedWhen, RECOMMENDED_WHEN_LABELS),
      labelsFromMap(template.avoidWhen, AVOID_WHEN_LABELS)
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesType = typeFilter === 'Alle' || (template.type || 'Annet') === typeFilter;
    const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
    const matchesCoach = coachFilter !== 'missing' || !workoutTemplateReadiness(template).ready;
    return matchesType && matchesQuery && matchesCoach;
  });
}

export function createWorkoutTemplateUi({
  getState,
  documentRef = globalThis.document,
  buildStructuredWorkout,
  structuredWorkoutBreakdown,
  structuredWorkoutSummary,
  parseNonNegativeInteger,
  formatDuration,
  escapeHtml,
  uniqueValues,
  getCheckedValues,
  setCheckedValues,
  setSelectOptions,
  roleLabel,
  purposeLabel,
  loadLabel
}) {
  let coachFilter = 'all';

  function element(id) {
    return documentRef.getElementById(id);
  }

  function durationSecondsFromParts(minutesId, secondsId) {
    const minutes = parseNonNegativeInteger(element(minutesId)?.value);
    const seconds = parseNonNegativeInteger(element(secondsId)?.value);
    return (minutes * 60) + Math.min(seconds, 59);
  }

  function setDurationPartsFromSeconds(totalSeconds, minutesId, secondsId) {
    const total = parseNonNegativeInteger(totalSeconds);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    if (element(minutesId)) element(minutesId).value = minutes || '';
    if (element(secondsId)) element(secondsId).value = seconds || '';
  }

  function structuredWorkoutFromForm() {
    if (!element('templateStructuredEnabled')?.checked) return null;
    return buildStructuredWorkout({
      warmupMinutes: element('templateWarmupMinutes')?.value,
      cooldownMinutes: element('templateCooldownMinutes')?.value,
      repetitions: element('templateIntervalRepetitions')?.value,
      workSeconds: durationSecondsFromParts('templateWorkMinutes', 'templateWorkSeconds'),
      restSeconds: durationSecondsFromParts('templateRestMinutes', 'templateRestSeconds'),
      restType: element('templateRestType')?.value,
      intensity: element('templateIntervalIntensity')?.value,
      intervalNote: element('templateIntervalNote')?.value.trim(),
      note: element('templateStructuredNote')?.value.trim()
    });
  }

  function toggleStructuredWorkoutFields() {
    const enabled = element('templateStructuredEnabled')?.checked;
    element('templateStructuredFields')?.classList.toggle('hidden', !enabled);
    renderStructuredWorkoutPreview();
  }

  function clearStructuredWorkoutForm() {
    if (element('templateStructuredEnabled')) element('templateStructuredEnabled').checked = false;
    [
      'templateWarmupMinutes',
      'templateCooldownMinutes',
      'templateIntervalRepetitions',
      'templateWorkMinutes',
      'templateWorkSeconds',
      'templateRestMinutes',
      'templateRestSeconds',
      'templateIntervalNote',
      'templateStructuredNote'
    ].forEach(id => { if (element(id)) element(id).value = ''; });
    if (element('templateRestType')) element('templateRestType').value = '';
    if (element('templateIntervalIntensity')) element('templateIntervalIntensity').value = '';
    toggleStructuredWorkoutFields();
  }

  function setStructuredWorkoutForm(structuredWorkout) {
    clearStructuredWorkoutForm();
    if (!structuredWorkout) return;
    if (element('templateStructuredEnabled')) element('templateStructuredEnabled').checked = true;
    const blocks = Array.isArray(structuredWorkout.blocks) ? structuredWorkout.blocks : [];
    const warmup = blocks.find(block => block.type === 'warmup');
    const interval = blocks.find(block => block.type === 'interval');
    const cooldown = blocks.find(block => block.type === 'cooldown');
    if (warmup) element('templateWarmupMinutes').value = Math.round(warmup.durationSeconds / 60) || '';
    if (cooldown) element('templateCooldownMinutes').value = Math.round(cooldown.durationSeconds / 60) || '';
    if (interval) {
      element('templateIntervalRepetitions').value = interval.repetitions || '';
      setDurationPartsFromSeconds(interval.workSeconds, 'templateWorkMinutes', 'templateWorkSeconds');
      setDurationPartsFromSeconds(interval.restSeconds, 'templateRestMinutes', 'templateRestSeconds');
      element('templateRestType').value = interval.restType || '';
      element('templateIntervalIntensity').value = interval.intensity || '';
      element('templateIntervalNote').value = interval.note || '';
    }
    element('templateStructuredNote').value = structuredWorkout.note || '';
    toggleStructuredWorkoutFields();
  }

  function renderStructuredWorkoutPreview() {
    const preview = element('templateStructuredPreview');
    if (!preview) return;
    const workout = structuredWorkoutFromForm();
    preview.textContent = workout
      ? structuredWorkoutSummary(workout)
      : 'Fyll inn repetisjoner og arbeidstid for å lagre strukturert intervallinfo.';
  }

  function structuredWorkoutSummaryHtml(structuredWorkout) {
    const breakdown = structuredWorkoutBreakdown(structuredWorkout);
    if (!breakdown) return '';
    const rows = [
      breakdown.warmupSeconds ? ['Oppvarming', formatDuration(breakdown.warmupSeconds)] : null,
      breakdown.workSeconds ? ['Arbeid', formatDuration(breakdown.workSeconds)] : null,
      breakdown.restSeconds ? ['Hvile', formatDuration(breakdown.restSeconds)] : null,
      breakdown.cooldownSeconds ? ['Nedjogg', formatDuration(breakdown.cooldownSeconds)] : null,
      breakdown.totalSeconds ? ['Totalt', formatDuration(breakdown.totalSeconds)] : null
    ].filter(Boolean);
    return `
      <div class="structured-workout-summary">
        ${breakdown.compact ? `<strong>${escapeHtml(breakdown.compact)}</strong>` : ''}
        <div class="structured-workout-facts">
          ${rows.map(([label, value]) => `<span><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`).join('')}
        </div>
        ${(breakdown.restType || breakdown.intensity || breakdown.note) ? `
          <p>${[
            breakdown.restType ? `Hvile: ${breakdown.restType}` : '',
            breakdown.intensity ? `Intensitet: ${breakdown.intensity}` : '',
            breakdown.note || ''
          ].filter(Boolean).map(escapeHtml).join(' · ')}</p>
        ` : ''}
      </div>`;
  }

  function readForm() {
    const editingId = element('editingTemplateId')?.value || '';
    const name = element('templateName')?.value.trim() || '';
    if (!name) return { ok: false, error: 'Skriv inn navn på økten først.' };
    const structuredWorkout = structuredWorkoutFromForm();
    if (element('templateStructuredEnabled')?.checked && !structuredWorkout) {
      return {
        ok: false,
        error: 'Fyll inn repetisjoner og arbeidstid for strukturert intervallinfo, eller fjern avhukingen.'
      };
    }
    return {
      ok: true,
      editingId,
      data: {
        name,
        type: element('templateType')?.value || '',
        intensity: element('templateIntensity')?.value || '',
        role: element('templateRole')?.value || '',
        purpose: element('templatePurpose')?.value || '',
        load: element('templateLoad')?.value || '',
        recommendedWhen: getCheckedValues('templateRecommendedWhen'),
        avoidWhen: getCheckedValues('templateAvoidWhen'),
        structure: element('templateStructure')?.value.trim() || '',
        structuredWorkout
      }
    };
  }

  function fillForm(template) {
    if (!template) return;
    element('editingTemplateId').value = template.id;
    element('templateName').value = template.name;
    const state = getState();
    setSelectOptions('templateType', state.settings.activityTypes, template.type);
    setSelectOptions('templateIntensity', state.settings.intensities, template.intensity);
    element('templateRole').value = template.role || '';
    element('templatePurpose').value = template.purpose || '';
    element('templateLoad').value = template.load || '';
    setCheckedValues('templateRecommendedWhen', template.recommendedWhen);
    setCheckedValues('templateAvoidWhen', template.avoidWhen);
    element('templateStructure').value = template.structure || '';
    setStructuredWorkoutForm(template.structuredWorkout);
    element('templateSubmitBtn').textContent = 'Lagre endringer';
    element('cancelEditTemplateBtn').classList.remove('hidden');
  }

  function clearForm() {
    element('editingTemplateId').value = '';
    element('templateName').value = '';
    element('templateRole').value = '';
    element('templatePurpose').value = '';
    element('templateLoad').value = '';
    setCheckedValues('templateRecommendedWhen', []);
    setCheckedValues('templateAvoidWhen', []);
    element('templateStructure').value = '';
    clearStructuredWorkoutForm();
    element('templateSubmitBtn').textContent = 'Lagre øktmal';
    element('cancelEditTemplateBtn').classList.add('hidden');
  }

  function refreshFormOptions() {
    const state = getState();
    const editingTemplateId = element('editingTemplateId')?.value || '';
    const selectedType = element('templateType')?.value || '';
    const selectedIntensity = element('templateIntensity')?.value || '';
    const typeToKeep = editingTemplateId || state.settings.activityTypes.includes(selectedType) ? selectedType : '';
    const intensityToKeep = editingTemplateId || state.settings.intensities.includes(selectedIntensity) ? selectedIntensity : '';
    setSelectOptions('templateType', state.settings.activityTypes, typeToKeep);
    setSelectOptions('templateIntensity', state.settings.intensities, intensityToKeep);
  }

  function selectOptions({ includeManual = false } = {}) {
    const state = getState();
    const options = [];
    if (includeManual) options.push('<option value="">Ingen / eget navn</option>');
    if (!state.templates.length) {
      options.push('<option value="">Lag en øktmal først</option>');
      return options.join('');
    }

    let currentGroup = null;
    sortWorkoutTemplates(state.templates, state.settings.activityTypes || []).forEach(template => {
      const type = template.type || 'Annet';
      const role = roleLabel(template.role);
      const group = role ? `${type} · ${role}` : type;
      if (group !== currentGroup) {
        if (currentGroup !== null) options.push('</optgroup>');
        options.push(`<optgroup label="${escapeHtml(group)}">`);
        currentGroup = group;
      }
      const label = template.intensity ? `${template.name} · ${template.intensity}` : template.name;
      options.push(`<option value="${escapeHtml(template.id)}">${escapeHtml(label)}</option>`);
    });
    if (currentGroup !== null) options.push('</optgroup>');
    return options.join('');
  }

  function templateCard(template) {
    const readiness = workoutTemplateReadiness(template);
    const tags = [
      roleLabel(template.role),
      purposeLabel(template.purpose),
      loadLabel(template.load),
      labelsFromMap(template.recommendedWhen, RECOMMENDED_WHEN_LABELS),
      labelsFromMap(template.avoidWhen, AVOID_WHEN_LABELS)
    ].filter(Boolean);
    return `
      <div class="workout-card template-card">
        <div class="workout-top">
          <div>
            <h3 class="workout-title">${escapeHtml(template.name)}</h3>
            <div class="meta">${escapeHtml(template.intensity || 'Uten intensitet')}</div>
          </div>
          <span class="tag ${readiness.ready ? 'tag-ready' : 'tag-warning'}">${readiness.ready ? 'Coach-klar' : `Mangler ${readiness.missing.length}`}</span>
        </div>
        ${tags.length ? `<div class="template-tags">${tags.map(tag => `<span class="tag template-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        ${readiness.ready ? '' : `<div class="template-missing">${readiness.missing.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`}
        ${structuredWorkoutSummaryHtml(template.structuredWorkout)}
        ${template.structure ? `<p class="template-structure">${escapeHtml(template.structure)}</p>` : ''}
        <div class="button-row">
          <button class="btn-primary" onclick="editTemplate('${escapeHtml(template.id)}')">Rediger</button>
          <button class="btn-soft" onclick="deleteTemplate('${escapeHtml(template.id)}')">Slett</button>
        </div>
      </div>`;
  }

  function renderCoachReadiness() {
    const state = getState();
    const wrapper = element('templateCoachReadiness');
    if (!wrapper) return;
    if (!state.templates.length) {
      wrapper.innerHTML = '';
      return;
    }
    const statuses = state.templates.map(template => ({ template, status: workoutTemplateReadiness(template) }));
    const readyCount = statuses.filter(item => item.status.ready).length;
    const missingItems = statuses
      .filter(item => !item.status.ready)
      .sort((a, b) => a.status.score - b.status.score || compareText(a.template.name, b.template.name))
      .slice(0, 4);
    const percent = Math.round((readyCount / statuses.length) * 100);
    wrapper.innerHTML = `
      <div class="coach-readiness-card">
        <div class="coach-readiness-top">
          <div>
            <span class="coach-readiness-kicker">Coach-oppsett</span>
            <strong>${readyCount}/${statuses.length} maler coach-klare</strong>
          </div>
          <span class="coach-readiness-score">${percent}%</span>
        </div>
        <div class="coach-readiness-bar"><span style="width:${percent}%"></span></div>
        ${missingItems.length
          ? `<div class="coach-readiness-list">
              ${missingItems.map(item => `
                <button type="button" onclick="editTemplate('${escapeHtml(item.template.id)}')">
                  <span>${escapeHtml(item.template.name)}</span>
                  <small>Mangler ${escapeHtml(item.status.missing.join(', '))}</small>
                </button>
              `).join('')}
            </div>`
          : '<p class="small-note">Alle malene har nok metadata til at rådgiveren kan bruke dem presist.</p>'}
        <div class="coach-readiness-actions">
          <button class="${coachFilter === 'all' ? 'btn-dark' : 'btn-soft'}" onclick="setTemplateCoachFilter('all')">Alle</button>
          <button class="${coachFilter === 'missing' ? 'btn-dark' : 'btn-soft'}" onclick="setTemplateCoachFilter('missing')">Vis mangler</button>
        </div>
      </div>`;
  }

  function renderTypeFilter() {
    const state = getState();
    const select = element('templateFilterType');
    if (!select) return;
    const selected = select.value || 'Alle';
    const values = ['Alle', ...uniqueValues([
      ...(state.settings.activityTypes || []),
      ...state.templates.map(template => template.type || 'Annet')
    ])];
    select.innerHTML = values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    select.value = values.includes(selected) ? selected : 'Alle';
  }

  function renderLibrary() {
    const state = getState();
    renderTypeFilter();
    renderCoachReadiness();
    const list = element('templateList');
    const summary = element('templateLibrarySummary');
    if (!list) return;
    if (!state.templates.length) {
      if (summary) summary.textContent = '';
      list.innerHTML = '<div class="empty">Ingen øktmaler enda. Lag din første over.</div>';
      return;
    }

    const templates = filterWorkoutTemplates({
      templates: state.templates,
      activityTypes: state.settings.activityTypes || [],
      query: element('templateSearch')?.value,
      typeFilter: element('templateFilterType')?.value || 'Alle',
      coachFilter,
      structuredSummary: structuredWorkoutSummary,
      roleLabel,
      purposeLabel,
      loadLabel
    });
    if (summary) {
      summary.textContent = templates.length === state.templates.length
        ? `${state.templates.length} øktmaler i biblioteket.`
        : `${templates.length} av ${state.templates.length} øktmaler vises.`;
    }
    if (!templates.length) {
      list.innerHTML = '<div class="empty">Ingen øktmaler matcher søket.</div>';
      return;
    }

    const groups = [];
    templates.forEach(template => {
      const type = template.type || 'Annet';
      let group = groups.find(item => item.type === type);
      if (!group) {
        group = { type, templates: [] };
        groups.push(group);
      }
      group.templates.push(template);
    });
    list.innerHTML = groups.map(group => `
      <div class="template-group">
        <div class="template-group-header">
          <h3>${escapeHtml(group.type)}</h3>
          <span>${group.templates.length} ${group.templates.length === 1 ? 'mal' : 'maler'}</span>
        </div>
        ${group.templates.map(templateCard).join('')}
      </div>
    `).join('');
  }

  function setCoachFilter(nextFilter) {
    coachFilter = nextFilter === 'missing' ? 'missing' : 'all';
    renderLibrary();
  }

  return {
    readForm,
    fillForm,
    clearForm,
    refreshFormOptions,
    selectOptions,
    renderLibrary,
    renderStructuredWorkoutPreview,
    setCoachFilter,
    toggleStructuredWorkoutFields,
    structuredWorkoutSummaryHtml
  };
}
