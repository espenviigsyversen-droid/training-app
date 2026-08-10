function defaultEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const COVERAGE_LABELS = {
  high: 'Høy dekning',
  medium: 'Middels dekning',
  low: 'Lav dekning'
};

const CONFIDENCE_LABELS = {
  high: 'Høy sikkerhet',
  medium: 'Middels sikkerhet',
  low: 'Lav sikkerhet',
  insufficient: 'Ikke nok grunnlag'
};

function periodText(period = {}, formatDate) {
  const label = String(period.label || 'Valgt periode');
  const from = period.from ? formatDate(period.from) : '';
  const to = period.to ? formatDate(period.to) : '';
  if (from && to) return `${label} · ${from}–${to}`;
  if (to) return `${label} · til ${to}`;
  return label;
}

export function insightEvidenceDisclosureHtml(evidence = {}, {
  escapeHtml = defaultEscapeHtml,
  formatDate = value => String(value || ''),
  open = false
} = {}) {
  if (!evidence?.sample || !evidence?.coverage || !evidence?.confidence) return '';
  const coverageLabel = COVERAGE_LABELS[evidence.coverage.level] || COVERAGE_LABELS.low;
  const confidenceLabel = CONFIDENCE_LABELS[evidence.confidence.level] || CONFIDENCE_LABELS.insufficient;
  const facts = (evidence.facts || []).map(item => `
    <div class="insight-evidence-fact">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      ${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ''}
    </div>`).join('');
  const missing = (evidence.missing || []).length
    ? `<div class="insight-evidence-missing"><strong>Mangler eller holdes utenfor</strong><ul>${evidence.missing.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`
    : '<p class="insight-evidence-complete">Ingen sentrale datamangler i dette grunnlaget.</p>';
  return `<details class="insight-evidence"${open ? ' open' : ''}>
    <summary>
      <span>Datagrunnlag</span>
      <small>${escapeHtml(coverageLabel)} · ${escapeHtml(confidenceLabel)}</small>
    </summary>
    <div class="insight-evidence-content">
      <p class="insight-evidence-period">${escapeHtml(periodText(evidence.period, formatDate))}</p>
      <div class="insight-evidence-stats">
        <div><strong>${escapeHtml(String(evidence.sample.relevant))}/${escapeHtml(String(evidence.sample.total))}</strong><span>${escapeHtml(evidence.sample.relevantLabel)} ${escapeHtml(evidence.sample.unit)}</span></div>
        <div><strong>${escapeHtml(String(evidence.coverage.percent))} %</strong><span>${escapeHtml(coverageLabel)}</span></div>
        <div class="confidence-${escapeHtml(evidence.confidence.level)}"><strong>${escapeHtml(confidenceLabel)}</strong><span>Vurderingssikkerhet</span></div>
      </div>
      ${facts ? `<div class="insight-evidence-facts">${facts}</div>` : ''}
      ${missing}
      ${evidence.caveat ? `<p class="insight-evidence-caveat">${escapeHtml(evidence.caveat)}</p>` : ''}
    </div>
  </details>`;
}
