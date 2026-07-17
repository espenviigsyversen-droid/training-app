const TYPE_LABELS = {
  'LÃ¸ping': 'LÃ¸p',
  'Styrke': 'Styrke',
  'Mobilitet': 'Mob',
  'Ski': 'Ski',
  'Sykling': 'Sykkel',
  'Annet': 'Annet'
};

const INTENSITY_LABELS = {
  'Rolig': 'Rolig',
  'Tempo': 'Tempo',
  'Terskel': 'Terskel',
  'Intervall': 'Interv',
  'Anaerob': 'Ana',
  'Styrke': 'Styrke',
  'Restitusjon': 'Rest'
};

function shortCalendarLabel(template, calendarKind) {
  const kind = calendarKind(template);
  if (kind.key === 'race') return 'Race';
  if (kind.key === 'recovery') return 'Rest';
  if (kind.key === 'quality') return template.intensity === 'Intervall' ? 'Interv' : 'Kval';
  const type = TYPE_LABELS[template.type] || template.type || template.name;
  const intensity = INTENSITY_LABELS[template.intensity] || template.intensity || '';
  return intensity && intensity !== type ? `${type} ${intensity}` : type;
}

export function createCalendarUi({
  getState,
  documentRef = globalThis.document,
  todayISO,
  formatDate,
  escapeHtml,
  getTemplate,
  completedTemplate,
  calendarKind,
  calendarEntryClass,
  blockedDayForDate,
  blockedDayLabel,
  blockedReasons,
  workoutCard,
  completedCard
}) {
  let selectedDate = '';

  function entry(status, template) {
    return {
      status,
      className: calendarEntryClass(status, template),
      name: template.name,
      shortLabel: shortCalendarLabel(template, calendarKind)
    };
  }

  function entriesHtml(items) {
    const visibleItems = items.slice(0, 2);
    const hiddenCount = items.length - visibleItems.length;
    return `${visibleItems.map(item => `
      <div class="calendar-entry ${escapeHtml(item.className || item.status)}" title="${escapeHtml(item.name)}">
        <span class="calendar-entry-short">${escapeHtml(item.shortLabel)}</span>
        <span class="calendar-entry-full">${escapeHtml(item.name)}</span>
      </div>`).join('')}${hiddenCount > 0 ? `<div class="calendar-entry calendar-more">+${hiddenCount} flere</div>` : ''}`;
  }

  function blockedEntry(dateIso) {
    const blockedDay = blockedDayForDate(dateIso);
    return blockedDay
      ? { status: 'blocked', className: 'blocked calendar-kind-blocked', name: `Ikke treningsdag: ${blockedDayLabel(blockedDay)}`, shortLabel: 'Fri' }
      : null;
  }

  function dayCell(dateIso, day, { overflow = false, includePlanned = true, includeDone = true } = {}) {
    const state = getState();
    const blockedDay = blockedDayForDate(dateIso);
    const items = [blockedEntry(dateIso)].filter(Boolean);
    if (includePlanned) {
      state.planned
        .filter(item => item.date === dateIso && item.status !== 'done')
        .forEach(item => items.push(entry('planned', getTemplate(item.templateId))));
    }
    if (includeDone) {
      state.completed
        .filter(item => item.date === dateIso)
        .forEach(item => items.push(entry('done', completedTemplate(item))));
    }
    const classes = [
      'calendar-day',
      overflow ? 'calendar-day-overflow' : '',
      !overflow && dateIso === todayISO() ? 'today' : '',
      blockedDay ? 'no-training' : ''
    ].filter(Boolean).join(' ');
    return `
      <div class="${classes}" onclick="openCalendarDayModal('${dateIso}')">
        <div class="calendar-date">${day}</div>
        ${entriesHtml(items)}
      </div>`;
  }

  function render() {
    const input = documentRef.getElementById('calendarMonth');
    if (!input) return;
    if (!input.value) input.value = todayISO().slice(0, 7);
    const [year, month] = input.value.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    let html = '<div class="calendar-grid">';
    ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'LÃ¸r', 'SÃ¸n'].forEach(day => {
      html += `<div class="calendar-weekday">${day}</div>`;
    });

    const startOffset = (firstDay.getDay() + 6) % 7;
    const previousMonthLastDay = new Date(year, month - 1, 0).getDate();
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonth = month === 1 ? 12 : month - 1;
    for (let index = startOffset - 1; index >= 0; index -= 1) {
      const day = previousMonthLastDay - index;
      const dateIso = `${previousYear}-${String(previousMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      html += dayCell(dateIso, day, { overflow: true, includePlanned: false, includeDone: true });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const dateIso = new Date(year, month - 1, day, 12).toISOString().slice(0, 10);
      html += dayCell(dateIso, day);
    }

    const trailingCells = (7 - ((startOffset + lastDay.getDate()) % 7)) % 7;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    for (let day = 1; day <= trailingCells; day += 1) {
      const dateIso = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      html += dayCell(dateIso, day, { overflow: true, includePlanned: true, includeDone: false });
    }
    html += '</div>';
    documentRef.getElementById('calendarGrid').innerHTML = html;
  }

  function changeMonth(direction) {
    const input = documentRef.getElementById('calendarMonth');
    if (!input.value) input.value = todayISO().slice(0, 7);
    const parts = input.value.split('-');
    let year = Number(parts[0]);
    let month = Number(parts[1]) + direction;
    if (month < 1) { month = 12; year -= 1; }
    if (month > 12) { month = 1; year += 1; }
    input.value = `${year}-${String(month).padStart(2, '0')}`;
    render();
  }

  function blockControlsHtml(dateIso) {
    const blocked = blockedDayForDate(dateIso);
    const reason = blocked?.reason || 'unavailable';
    return `
      <div class="calendar-block-controls">
        <label class="calendar-block-toggle">
          <input type="checkbox" ${blocked ? 'checked' : ''} onchange="toggleBlockedTrainingDay(this.checked)" />
          <span>
            Ikke treningsdag
            <small class="small-note">RÃ¥dgiveren hopper over denne datoen nÃ¥r den foreslÃ¥r Ã¸kter.</small>
          </span>
        </label>
        ${blocked ? `
          <div class="form-grid">
            <div>
              <label>Grunn</label>
              <select id="calendarBlockedReason" onchange="updateBlockedTrainingDay()">
                ${Object.entries(blockedReasons).map(([value, label]) =>
                  `<option value="${escapeHtml(value)}" ${value === reason ? 'selected' : ''}>${escapeHtml(label)}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label>Notat</label>
              <input id="calendarBlockedNote" value="${escapeHtml(blocked.note || '')}" placeholder="Valgfritt" onblur="updateBlockedTrainingDay()" />
            </div>
          </div>` : ''}
      </div>`;
  }

  function openDay(dateIso) {
    selectedDate = dateIso;
    const state = getState();
    const plannedItems = state.planned
      .filter(item => item.date === dateIso && item.status !== 'done')
      .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    const doneItems = state.completed
      .filter(item => item.date === dateIso)
      .sort((a, b) => String(a.completedAt || '').localeCompare(String(b.completedAt || '')));
    documentRef.getElementById('calendarDayTitle').textContent = formatDate(dateIso);
    documentRef.getElementById('calendarDayBlockControls').innerHTML = blockControlsHtml(dateIso);
    const dayHtml = [
      ...plannedItems.map(item => workoutCard(item, { canDelete: true })),
      ...doneItems.map(completedCard)
    ].join('');
    documentRef.getElementById('calendarDayList').innerHTML = dayHtml
      ? `<div class="calendar-day-workouts">${dayHtml}</div>`
      : '<div class="empty">Ingen Ã¸kter denne dagen.</div>';
    documentRef.getElementById('calendarDayModal').classList.add('active');
  }

  function closeDay() {
    documentRef.getElementById('calendarDayModal').classList.remove('active');
  }

  return {
    render,
    changeMonth,
    openDay,
    closeDay,
    getSelectedDate: () => selectedDate
  };
}

