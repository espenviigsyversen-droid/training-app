export function createTemplateSnapshotUpdateUi({
  documentRef = globalThis.document,
  escapeHtml,
  getPreview,
  confirmUpdate,
  getResetPreview,
  confirmReset
}) {
  let context = null;

  function modal() { return documentRef.getElementById('templateSnapshotUpdateModal'); }

  function valueHtml(value) {
    if (!value) return '<span class="snapshot-diff-empty">Ikke angitt</span>';
    return `<span>${escapeHtml(value)}</span>`;
  }

  function render() {
    if (!context) return;
    if (context.mode === 'reset') {
      const preview = getResetPreview(context.id);
      const content = documentRef.getElementById('snapshotUpdateDiff');
      const button = documentRef.getElementById('snapshotUpdateConfirm');
      content.innerHTML = preview?.diff?.length
        ? `<div class="snapshot-diff-list">${preview.diff.map(row => `
            <div class="snapshot-diff-row">
              <strong>${escapeHtml(row.label)}</strong>
              <div><small>Nå</small>${valueHtml(row.before)}</div>
              <div><small>Plan</small>${valueHtml(row.after)}</div>
            </div>`).join('')}</div>`
        : '<div class="empty">Ingen planstyrte felt kan tilbakestilles.</div>';
      documentRef.getElementById('snapshotUpdateImpact').innerHTML = '<strong>Planbetydning:</strong> Planens opprinnelige treningsintensjon gjenopprettes. Datoflytting, metadatarettinger, notater og registrerte målinger beholdes.';
      button.disabled = !preview?.diff?.length;
      return;
    }
    const templateId = documentRef.getElementById('snapshotUpdateTemplate')?.value || context.templateId;
    const preview = getPreview(context.kind, context.id, templateId);
    const content = documentRef.getElementById('snapshotUpdateDiff');
    const button = documentRef.getElementById('snapshotUpdateConfirm');
    if (!preview) {
      content.innerHTML = '<div class="empty">Kunne ikke lage forhåndsvisning.</div>';
      button.disabled = true;
      return;
    }
    content.innerHTML = preview.diff.length
      ? `<div class="snapshot-diff-list">${preview.diff.map(row => `
          <div class="snapshot-diff-row">
            <strong>${escapeHtml(row.label)}</strong>
            <div><small>Før</small>${valueHtml(row.before)}</div>
            <div><small>Etter</small>${valueHtml(row.after)}</div>
          </div>`).join('')}</div>`
      : '<div class="empty">Snapshotet er allerede likt den valgte malen.</div>';
    documentRef.getElementById('snapshotUpdateImpact').innerHTML = preview.affectsRoleHistory
      ? '<strong>Historisk betydning:</strong> Rollen og malmetadataen brukes videre i rolledekning, ukeplan og langtursgrunnlag. Registrerte målinger og notater endres ikke.'
      : '<strong>Metadataretting:</strong> Snapshotet oppdateres bevisst, uten å endre planens treningsintensjon eller frede økten mot senere planforslag.';
    button.disabled = preview.diff.length === 0;
  }

  function open({ kind, id, itemLabel, templateId, templates = [] }) {
    context = { mode: 'template', kind, id, templateId };
    documentRef.getElementById('snapshotUpdateTitle').textContent = 'Oppdater fra mal';
    documentRef.getElementById('snapshotUpdateItem').textContent = itemLabel;
    const select = documentRef.getElementById('snapshotUpdateTemplate');
    documentRef.getElementById('snapshotUpdateConfirm').textContent = 'Bekreft oppdatering';
    documentRef.getElementById('snapshotUpdateTemplateWrapper')?.classList.remove('hidden');
    select.innerHTML = templates.map(template => `<option value="${escapeHtml(template.id)}" ${template.id === templateId ? 'selected' : ''}>${escapeHtml(template.name)}</option>`).join('');
    documentRef.getElementById('snapshotUpdateEmpty').classList.toggle('hidden', templates.length > 0);
    select.disabled = templates.length === 0;
    modal().classList.add('active');
    modal().setAttribute('aria-hidden', 'false');
    render();
    documentRef.getElementById('snapshotUpdateClose')?.focus();
  }

  function openReset({ id, itemLabel }) {
    context = { mode: 'reset', id };
    documentRef.getElementById('snapshotUpdateTitle').textContent = 'Tilbakestill til plan';
    documentRef.getElementById('snapshotUpdateItem').textContent = itemLabel;
    documentRef.getElementById('snapshotUpdateTemplateWrapper')?.classList.add('hidden');
    documentRef.getElementById('snapshotUpdateEmpty')?.classList.add('hidden');
    documentRef.getElementById('snapshotUpdateConfirm').textContent = 'Bekreft tilbakestilling';
    modal().classList.add('active');
    modal().setAttribute('aria-hidden', 'false');
    render();
    documentRef.getElementById('snapshotUpdateClose')?.focus();
  }

  function close() {
    modal()?.classList.remove('active');
    modal()?.setAttribute('aria-hidden', 'true');
    context = null;
  }

  async function confirm() {
    if (!context) return;
    const button = documentRef.getElementById('snapshotUpdateConfirm');
    button.disabled = true;
    const saved = context.mode === 'reset'
      ? await confirmReset(context.id)
      : await confirmUpdate(context.kind, context.id, documentRef.getElementById('snapshotUpdateTemplate').value);
    if (saved) close();
    else render();
  }

  documentRef.getElementById('snapshotUpdateTemplate')?.addEventListener('change', render);
  documentRef.getElementById('snapshotUpdateClose')?.addEventListener('click', close);
  documentRef.getElementById('snapshotUpdateCancel')?.addEventListener('click', close);
  documentRef.getElementById('snapshotUpdateConfirm')?.addEventListener('click', confirm);
  modal()?.addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
  documentRef.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal()?.classList.contains('active')) close();
  });

  return { open, openReset, close, render };
}

