import {
  GARMIN_IMPORT_MAX_FILE_BYTES,
  buildGarminImportCommit,
  createGarminImportPreview
} from './training-import-controller.js';
import { WORKOUT_ROLE_LABELS } from './app-state.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function durationLabel(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = value % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${minutes}:${String(rest).padStart(2, '0')}`;
}

function metricValue(field, value) {
  if (value === '' || value === null || value === undefined) return 'mangler';
  if (field === 'durationSeconds') return durationLabel(value);
  if (field === 'durationMinutes') return `${value} min`;
  if (field === 'distanceKm') return `${value} km`;
  if (field === 'averageSpeedKmh') return `${value} km/t`;
  if (field === 'paceSecondsPerKm') return `${durationLabel(value)} min/km`;
  if (field === 'avgHeartRate' || field === 'maxHeartRate') return `${value} bpm`;
  if (field === 'elevationGainM') return `${value} m`;
  return String(value);
}

function selectedMatch(row) {
  return row.matches.find(match => match.key === row.selectedTargetKey) || null;
}

function actionCounts(preview) {
  return preview.rows.reduce((counts, row) => {
    if (row.duplicate) counts.duplicates += 1;
    else if (row.action === 'review') counts.review += 1;
    else if (row.action === 'create') counts.create += 1;
    else if (row.action === 'enrich') counts.enrich += 1;
    else if (row.action === 'link') counts.link += 1;
    else counts.skip += 1;
    return counts;
  }, { duplicates: 0, review: 0, create: 0, enrich: 0, link: 0, skip: 0 });
}

function matchKindLabel(kind) {
  return kind === 'planned' ? 'planlagt økt' : 'historikkøkt';
}

function actionOptions(row) {
  if (row.duplicate) return '<option value="skip" selected>Allerede importert</option>';
  const match = selectedMatch(row);
  return [
    `<option value="review"${row.action === 'review' ? ' selected' : ''}>Velg handling</option>`,
    `<option value="create"${row.action === 'create' ? ' selected' : ''}>Opprett ny økt</option>`,
    match?.kind === 'completed'
      ? `<option value="enrich"${row.action === 'enrich' ? ' selected' : ''}>Berik valgt historikkøkt</option>`
      : '',
    match?.kind === 'planned'
      ? `<option value="link"${row.action === 'link' ? ' selected' : ''}>Koble til og fullfør planlagt økt</option>`
      : '',
    `<option value="skip"${row.action === 'skip' ? ' selected' : ''}>Hopp over</option>`
  ].join('');
}

function matchOptions(row) {
  if (!row.matches.length) return '';
  return `
    <label>Foreslått treff
      <select data-garmin-role="target" data-index="${row.index}">
        ${row.matches.map(match => `
          <option value="${escapeHtml(match.key)}"${match.key === row.selectedTargetKey ? ' selected' : ''}>
            ${escapeHtml(match.label)} · ${escapeHtml(match.date)} · ${escapeHtml(matchKindLabel(match.kind))} · ${escapeHtml(match.level === 'secure' ? 'sikkert' : 'mulig')}
          </option>`).join('')}
      </select>
    </label>`;
}

function conflictHtml(row) {
  const match = selectedMatch(row);
  if (row.action !== 'enrich' || match?.kind !== 'completed' || !match.conflicts.length) return '';
  return `
    <fieldset class="garmin-conflicts">
      <legend>Objektive felt med ulike verdier</legend>
      <p class="small-note">Eksisterende verdi beholdes dersom du ikke velger overskriving.</p>
      ${match.conflicts.map(conflict => `
        <label class="checkbox-row">
          <input type="checkbox" data-garmin-role="overwrite" data-index="${row.index}" value="${escapeHtml(conflict.field)}"${row.overwriteFields.includes(conflict.field) ? ' checked' : ''} />
          Overskriv ${escapeHtml(conflict.label)}: ${escapeHtml(metricValue(conflict.field, conflict.existingValue))} → ${escapeHtml(metricValue(conflict.field, conflict.importedValue))}
        </label>`).join('')}
    </fieldset>`;
}

function roleChoiceHtml(row, index, templates = []) {
  if (row.duplicate || row.action !== 'create') return '';
  const selectedTemplate = templates.find(item => item.id === row.selectedTemplateId);
  const draft = row.candidate.completedDraft;
  const templateFields = selectedTemplate ? [
    ['Mal-ID', 'Ingen', selectedTemplate.id],
    ['Malsnapshot-navn', draft.manualName || 'Garmin-økt', selectedTemplate.name || 'Navnløs mal'],
    ['Aktivitetstype', draft.activityType || 'Ikke angitt', selectedTemplate.type || 'Ikke angitt'],
    ['Rolle', row.selectedRole ? WORKOUT_ROLE_LABELS[row.selectedRole] : 'Ikke valgt', WORKOUT_ROLE_LABELS[selectedTemplate.role] || 'Ikke angitt'],
    ['Intensitet', 'Ikke angitt', selectedTemplate.intensity || 'Ikke angitt'],
    ['Formål', 'Ikke angitt', selectedTemplate.purpose || 'Ikke angitt'],
    ['Belastning', 'Ikke angitt', selectedTemplate.load || 'Ikke angitt'],
    ['Anbefalt når', 'Ingen', (selectedTemplate.recommendedWhen || []).join(', ') || 'Ingen'],
    ['Unngå når', 'Ingen', (selectedTemplate.avoidWhen || []).join(', ') || 'Ingen'],
    ['Struktur', 'Ingen', selectedTemplate.structure || 'Ingen'],
    ['Øktlenke', 'Ingen', selectedTemplate.sourceUrl || 'Ingen'],
    ['Strukturert intervall', 'Ingen', selectedTemplate.structuredWorkout ? JSON.stringify(selectedTemplate.structuredWorkout) : 'Ingen'],
    ['Øvelsesplan', 'Ingen', selectedTemplate.exercisePlan ? JSON.stringify(selectedTemplate.exercisePlan) : 'Ingen']
  ] : [];
  return `<div class="garmin-role-choice">
    <p class="small-note">${escapeHtml([
      draft.activityType || 'Aktivitetstype mangler',
      durationLabel(draft.durationSeconds),
      draft.distanceKm ? `${draft.distanceKm} km` : 'distanse ikke registrert',
      draft.avgHeartRate ? `snittpuls ${draft.avgHeartRate} bpm` : 'snittpuls ikke registrert'
    ].join(' · '))}</p>
    <label>Hvilken rolle hadde økten? (valgfritt)
      <select data-garmin-role="workout-role" data-index="${index}">
        <option value=""${!row.selectedRole ? ' selected' : ''}>Velg rolle eller bestem senere</option>
        ${Object.entries(WORKOUT_ROLE_LABELS).map(([role, label]) => `<option value="${escapeHtml(role)}"${row.selectedRole === role ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}
      </select>
    </label>
    <p class="small-note">Tomt valg lagres som «Bestem senere». Økten teller fortsatt i volum og belastning.</p>
    <label>Knytt til mal (valgfritt, separat valg)
      <select data-garmin-role="template" data-index="${index}">
        <option value="">Ingen mal</option>
        ${templates.map(item => `<option value="${escapeHtml(item.id)}"${row.selectedTemplateId === item.id ? ' selected' : ''}>${escapeHtml(item.name || 'Navnløs mal')}</option>`).join('')}
      </select>
    </label>
    ${selectedTemplate ? `<div class="garmin-template-link-preview">
      <strong>Bekreft malkoblingen separat</strong>
      <p class="small-note">Dette sier at økten fulgte malen, ikke bare at den hadde en rolle.</p>
      <p class="small-note">Garmin-navnet på økten beholdes; feltene nedenfor lagres i malsnapshotet.</p>
      <div class="garmin-template-diff">${templateFields.map(([label, before, after]) => `<div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(before)} → ${escapeHtml(after)}</span></div>`).join('')}</div>
      ${row.selectedRole && selectedTemplate.role && row.selectedRole !== selectedTemplate.role ? '<p class="small-note garmin-template-warning">Valgt rolle og malens rolle er ulike. Velg en samsvarende rolle eller fjern malkoblingen.</p>' : ''}
      <label class="checkbox-row"><input type="checkbox" data-garmin-role="confirm-template" data-index="${index}"${row.confirmTemplateLink ? ' checked' : ''}> Jeg bekrefter denne malkoblingen</label>
    </div>` : ''}
  </div>`;
}

function rowHtml(row, index, templates = []) {
  row.index = index;
  const draft = row.candidate.completedDraft;
  const match = selectedMatch(row);
  const meta = [
    draft.activityType,
    durationLabel(draft.durationSeconds),
    draft.distanceKm ? `${draft.distanceKm} km` : '',
    draft.avgHeartRate ? `${draft.avgHeartRate} bpm` : ''
  ].filter(Boolean).join(' · ');
  const stateClass = row.duplicate ? 'duplicate' : row.action === 'review' ? 'review' : 'ready';
  const chip = row.duplicate
    ? 'Allerede importert'
    : row.action === 'review'
      ? 'Krever valg'
      : row.action === 'skip'
        ? 'Hoppes over'
        : 'Klar';
  return `
    <details class="garmin-import-row ${stateClass}"${row.action === 'review' || row.keepOpen ? ' open' : ''}>
      <summary>
        <span><strong>${escapeHtml(draft.manualName || draft.activityType || 'Garmin-økt')}</strong><small>${escapeHtml(draft.date)} · ${escapeHtml(meta)}</small></span>
        <span class="garmin-import-chip">${escapeHtml(chip)}</span>
      </summary>
      <div class="garmin-import-row-body">
        ${row.duplicate ? `<p class="small-note">Samme Garmin-fingeravtrykk finnes allerede på ${escapeHtml(row.duplicate.date || 'ukjent dato')}. Aktiviteten kan ikke opprettes på nytt.</p>` : ''}
        ${match ? `<p class="small-note"><strong>Matchgrunnlag:</strong> ${escapeHtml(match.reasons.join(', '))} · score ${escapeHtml(match.score)}</p>` : '<p class="small-note">Ingen eksisterende økt har tilstrekkelig match.</p>'}
        ${matchOptions(row)}
        <label>Handling
          <select data-garmin-role="action" data-index="${index}"${row.duplicate ? ' disabled' : ''}>${actionOptions(row)}</select>
        </label>
        ${roleChoiceHtml(row, index, templates)}
        ${conflictHtml(row)}
      </div>
    </details>`;
}

export function createTrainingImportUi({
  getState,
  resolveTemplate,
  commitImport,
  createId,
  canWrite = () => true,
  confirmImport = message => window.confirm(message),
  now = () => new Date().toISOString()
} = {}) {
  if (typeof getState !== 'function' || typeof commitImport !== 'function' || typeof createId !== 'function') {
    throw new Error('Training import UI is missing required dependencies');
  }

  let preview = null;
  let sourceText = '';
  let busy = false;

  function element(id) {
    return document.getElementById(id);
  }

  function setStatus(message, kind = '') {
    const status = element('garminImportStatus');
    if (!status) return;
    status.textContent = message;
    status.className = `small-note garmin-import-status ${kind}`.trim();
  }

  function renderResult(stats = null) {
    const result = element('garminImportResult');
    if (!result) return;
    if (!stats) {
      result.innerHTML = '';
      return;
    }
    result.innerHTML = `
      <div class="garmin-import-result" role="status">
        <strong>Import fullført</strong>
        <span>${escapeHtml(stats.imported)} nye · ${escapeHtml(stats.enriched)} beriket · ${escapeHtml(stats.linked)} koblet til plan · ${escapeHtml(stats.duplicates)} duplikater · ${escapeHtml(stats.skipped)} hoppet over · ${escapeHtml(stats.rejected)} avvist${stats.roleSummary ? ` · ${escapeHtml(stats.roleSummary.confirmed)} roller valgt · ${escapeHtml(stats.roleSummary.unclassified)} til senere` : ''}</span>
      </div>`;
  }

  function renderPreview() {
    const summary = element('garminImportSummary');
    const list = element('garminImportList');
    const actions = element('garminImportActions');
    if (!summary || !list || !actions) return;
    if (!preview) {
      summary.innerHTML = '';
      list.innerHTML = '';
      actions.classList.add('hidden');
      return;
    }
    const counts = actionCounts(preview);
    summary.innerHTML = `
      <div class="garmin-import-summary-grid">
        <div><strong>${preview.rows.length}</strong><span>gyldige</span></div>
        <div><strong>${counts.create}</strong><span>nye</span></div>
        <div><strong>${counts.review}</strong><span>krever valg</span></div>
        <div><strong>${counts.duplicates}</strong><span>duplikater</span></div>
        <div><strong>${preview.rejectedRows.length}</strong><span>avvist</span></div>
      </div>
      ${preview.rejectedRows.length ? `<details class="garmin-rejected"><summary>Vis avviste rader</summary>${preview.rejectedRows.map(item => `<p>Rad ${escapeHtml(item.rowNumber)}: ${escapeHtml(item.reason)}</p>`).join('')}</details>` : ''}`;
    list.innerHTML = preview.rows.map((row, index) => rowHtml(row, index, getState().templates || [])).join('');
    actions.classList.remove('hidden');
    const commitButton = element('garminImportCommitBtn');
    if (commitButton) {
      const writable = canWrite();
      const actionable = counts.create + counts.enrich + counts.link;
      const pendingTemplateLinks = preview.rows.filter(row => row.action === 'create' && row.selectedTemplateId && !row.confirmTemplateLink).length;
      commitButton.disabled = busy || counts.review > 0 || pendingTemplateLinks > 0 || !writable || actionable === 0;
      commitButton.textContent = busy
        ? 'Importerer ...'
        : counts.review
          ? `Velg handling for ${counts.review}`
          : pendingTemplateLinks
            ? `Bekreft ${pendingTemplateLinks} malkobling${pendingTemplateLinks === 1 ? '' : 'er'}`
          : actionable === 0
            ? 'Ingen nye aktiviteter'
            : 'Bekreft og importer';
    }
  }

  function prepare(text) {
    const state = getState() || {};
    sourceText = text;
    preview = createGarminImportPreview(text, {
      completedItems: state.completed || [],
      plannedItems: state.planned || [],
      resolveTemplate
    });
    setStatus('Forhåndsvisningen er lokal. Ingenting er lagret ennå.', 'ready');
    renderPreview();
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    renderResult();
    preview = null;
    renderPreview();
    if (file.size > GARMIN_IMPORT_MAX_FILE_BYTES) {
      setStatus(`Filen er for stor. Maks størrelse er ${Math.round(GARMIN_IMPORT_MAX_FILE_BYTES / 1024 / 1024)} MB.`, 'error');
      return;
    }
    if (!/\.csv$/i.test(file.name || '')) {
      setStatus('Velg en CSV-fil eksportert fra Garmin Connect.', 'error');
      return;
    }
    setStatus('Leser Garmin-filen lokalt ...');
    try {
      prepare(await file.text());
    } catch (err) {
      console.error('Garmin CSV preview error:', err);
      setStatus(err?.message || 'Kunne ikke lese Garmin-filen.', 'error');
    }
  }

  function handleChange(event) {
    if (!preview) return;
    const index = Number(event.target.dataset.index);
    const row = preview.rows[index];
    if (!row) return;
    row.keepOpen = true;
    const role = event.target.dataset.garminRole;
    if (role === 'target') {
      row.selectedTargetKey = event.target.value;
      row.action = 'review';
      row.overwriteFields = [];
    } else if (role === 'action') {
      row.action = event.target.value;
      row.overwriteFields = [];
    } else if (role === 'workout-role') {
      row.selectedRole = event.target.value;
    } else if (role === 'template') {
      row.selectedTemplateId = event.target.value;
      row.confirmTemplateLink = false;
    } else if (role === 'confirm-template') {
      row.confirmTemplateLink = event.target.checked;
    } else if (role === 'overwrite') {
      const fields = new Set(row.overwriteFields || []);
      if (event.target.checked) fields.add(event.target.value);
      else fields.delete(event.target.value);
      row.overwriteFields = [...fields];
    } else {
      return;
    }
    renderPreview();
  }

  async function commit() {
    if (!preview || busy) return;
    if (!canWrite()) {
      setStatus('Garmin-import krever innlogging, nettforbindelse og normal synkroniseringsmodus.', 'error');
      renderPreview();
      return;
    }
    let plan;
    try {
      plan = buildGarminImportCommit(preview, {
        createId, now: now(), resolveTemplate,
        resolveTemplateById: id => (getState().templates || []).find(item => item.id === id)
      });
    } catch (err) {
      setStatus(err?.message || 'Kontroller valgene før import.', 'error');
      return;
    }
    if (!plan.operationCount) {
      setStatus('Ingen aktiviteter er valgt for import.', 'error');
      return;
    }
    const message = `Importere ${plan.stats.imported} nye, berike ${plan.stats.enriched} og koble ${plan.stats.linked} planlagte økter? ${plan.roleSummary.confirmed} roller er valgt; ${plan.roleSummary.unclassified} kan bestemmes senere. En lokal gjenopprettingskopi opprettes først.`;
    if (!confirmImport(message)) return;
    busy = true;
    renderPreview();
    setStatus('Oppretter sikkerhetskopi og lagrer valgte aktiviteter ...');
    try {
      const result = await commitImport(plan);
      renderResult({ ...(result?.stats || plan.stats), roleSummary: plan.roleSummary });
      prepare(sourceText);
      setStatus('Import fullført. Den samme filen vil nå gjenkjennes som allerede importert.', 'success');
    } catch (err) {
      console.error('Garmin import commit error:', err);
      setStatus(err?.message || 'Importen kunne ikke fullføres.', 'error');
    } finally {
      busy = false;
      renderPreview();
    }
  }

  function reset() {
    preview = null;
    sourceText = '';
    busy = false;
    renderResult();
    setStatus('Velg en Activities CSV-fil fra Garmin Connect. Filen behandles bare lokalt.');
    renderPreview();
  }

  function bind() {
    element('garminCsvFile')?.addEventListener('change', handleFile);
    element('garminImportList')?.addEventListener('change', handleChange);
    element('garminImportCommitBtn')?.addEventListener('click', commit);
    element('garminImportResetBtn')?.addEventListener('click', reset);
    reset();
  }

  return { bind, reset, renderPreview, getPreview: () => preview };
}
