import {
  activeHeartRateZoneSet,
  formatHeartRateZoneRange,
  heartRateZoneSetSummary,
  normalizeHeartRateZoneSet,
  validateHeartRateZoneSet
} from './domain-heart-rate-zones.js';

export function createHeartRateZonesUi({
  getState,
  documentRef = globalThis.document,
  escapeHtml,
  formatDate
}) {
  function element(id) {
    return documentRef.getElementById(id);
  }

  function readForm() {
    const zones = Array.from({ length: 5 }, (_, index) => ({
      label: element(`heartRateZone${index + 1}Label`)?.value,
      minBpm: element(`heartRateZone${index + 1}Min`)?.value,
      maxBpm: element(`heartRateZone${index + 1}Max`)?.value
    }));
    const result = validateHeartRateZoneSet({
      id: element('heartRateZoneEditingId')?.value,
      name: element('heartRateZoneSetName')?.value,
      sourceType: element('heartRateZoneSourceType')?.value,
      sourceName: element('heartRateZoneSourceName')?.value,
      testedAt: element('heartRateZoneTestedAt')?.value,
      effectiveFrom: element('heartRateZoneEffectiveFrom')?.value,
      maxHeartRate: element('heartRateZoneMaxHeartRate')?.value,
      active: element('heartRateZoneActive')?.checked,
      note: element('heartRateZoneNote')?.value,
      zones
    });
    return result.valid
      ? { ok: true, editingId: result.value.id, data: result.value }
      : { ok: false, error: result.errors[0], errors: result.errors };
  }

  function fillForm(value) {
    const zoneSet = normalizeHeartRateZoneSet(value);
    element('heartRateZoneEditingId').value = zoneSet.id;
    element('heartRateZoneSetName').value = zoneSet.name;
    element('heartRateZoneSourceType').value = zoneSet.sourceType;
    element('heartRateZoneSourceName').value = zoneSet.sourceName;
    element('heartRateZoneTestedAt').value = zoneSet.testedAt;
    element('heartRateZoneEffectiveFrom').value = zoneSet.effectiveFrom;
    element('heartRateZoneMaxHeartRate').value = zoneSet.maxHeartRate;
    element('heartRateZoneActive').checked = zoneSet.active;
    element('heartRateZoneNote').value = zoneSet.note;
    zoneSet.zones.forEach((zone, index) => {
      element(`heartRateZone${index + 1}Label`).value = zone.label;
      element(`heartRateZone${index + 1}Min`).value = zone.minBpm;
      element(`heartRateZone${index + 1}Max`).value = zone.maxBpm;
    });
    element('heartRateZoneSubmitBtn').textContent = 'Lagre endringer';
    element('cancelEditHeartRateZoneBtn').classList.remove('hidden');
    element('heartRateZoneSetName').focus();
  }

  function clearForm() {
    const today = new Date().toISOString().slice(0, 10);
    element('heartRateZoneEditingId').value = '';
    element('heartRateZoneSetName').value = '';
    element('heartRateZoneSourceType').value = 'lab';
    element('heartRateZoneSourceName').value = '';
    element('heartRateZoneTestedAt').value = today;
    element('heartRateZoneEffectiveFrom').value = today;
    element('heartRateZoneMaxHeartRate').value = '';
    element('heartRateZoneActive').checked = !(getState().heartRateZoneSets || []).some(item => item.active);
    element('heartRateZoneNote').value = '';
    Array.from({ length: 5 }, (_, index) => index).forEach(index => {
      element(`heartRateZone${index + 1}Label`).value = `Sone ${index + 1}`;
      element(`heartRateZone${index + 1}Min`).value = '';
      element(`heartRateZone${index + 1}Max`).value = '';
    });
    element('heartRateZoneSubmitBtn').textContent = 'Lagre pulssoner';
    element('cancelEditHeartRateZoneBtn').classList.add('hidden');
  }

  function zoneSetCard(zoneSet) {
    const date = zoneSet.testedAt || zoneSet.effectiveFrom;
    const source = zoneSet.sourceType === 'lab' ? 'Labtest' : 'Manuelt';
    const encodedId = encodeURIComponent(zoneSet.id).replace(/'/g, '%27');
    const ranges = zoneSet.zones.map(zone => `${escapeHtml(zone.label)} ${escapeHtml(formatHeartRateZoneRange(zone))}`).join(' · ');
    return `
      <article class="heart-rate-zone-set-card ${zoneSet.active ? 'active' : ''}">
        <div class="heart-rate-zone-set-copy">
          <div class="heart-rate-zone-set-heading">
            <strong>${escapeHtml(zoneSet.name)}</strong>
            ${zoneSet.active ? '<span class="status-chip complete">Aktiv</span>' : ''}
          </div>
          <p>${escapeHtml(source)}${date ? ` · ${escapeHtml(formatDate(date))}` : ''}${zoneSet.sourceName ? ` · ${escapeHtml(zoneSet.sourceName)}` : ''}</p>
          <p class="heart-rate-zone-ranges">${ranges}</p>
          ${zoneSet.note ? `<p>${escapeHtml(zoneSet.note)}</p>` : ''}
        </div>
        <div class="heart-rate-zone-set-actions">
          ${zoneSet.active ? '' : `<button class="btn-soft compact-btn" onclick="activateHeartRateZoneSet(decodeURIComponent('${encodedId}'))">Aktiver</button>`}
          <button class="btn-soft compact-btn" onclick="editHeartRateZoneSet(decodeURIComponent('${encodedId}'))">Rediger</button>
          <button class="ghost danger-link compact-btn" onclick="deleteHeartRateZoneSet(decodeURIComponent('${encodedId}'))">Slett</button>
        </div>
      </article>`;
  }

  function render() {
    const state = getState();
    const zoneSets = [...(state.heartRateZoneSets || [])].sort((a, b) =>
      String(b.testedAt || b.effectiveFrom || b.createdAt).localeCompare(String(a.testedAt || a.effectiveFrom || a.createdAt))
    );
    const active = activeHeartRateZoneSet(zoneSets);
    const summary = element('activeHeartRateZoneSummary');
    const list = element('heartRateZoneSetList');
    if (summary) {
      summary.innerHTML = active
        ? `<strong>${escapeHtml(heartRateZoneSetSummary(active))}</strong><span>${active.zones.map(zone => escapeHtml(formatHeartRateZoneRange(zone))).join(' · ')}</span>`
        : '<strong>Ingen aktiv pulssoneprofil</strong><span>Legg inn testsonene eller et manuelt oppsett nedenfor.</span>';
    }
    if (list) {
      list.innerHTML = zoneSets.length
        ? zoneSets.map(zoneSetCard).join('')
        : '<div class="empty">Ingen pulssoneprofiler lagret ennå.</div>';
    }
    if (element('heartRateZoneEditingId') && !element('heartRateZoneSetName').value) clearForm();
  }

  return { readForm, fillForm, clearForm, render };
}
