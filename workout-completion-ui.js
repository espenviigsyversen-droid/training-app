export function durationSecondsFromParts(hours, minutes, seconds) {
  const safe = value => Math.max(0, Math.trunc(Number(value) || 0));
  return (safe(hours) * 3600) + (Math.min(safe(minutes), 59) * 60) + Math.min(safe(seconds), 59);
}

export function createWorkoutCompletionUi({
  getState,
  documentRef = globalThis.document,
  calculatePaceMetrics,
  formatDuration,
  formatAreaLabel,
  goldenZonePercentages,
  normalizePersonProfile,
  normalizeTrainingProfile,
  normalizeRaceResult,
  trainingEffectCategory
}) {
  function element(id) {
    return documentRef.getElementById(id);
  }

  function setValue(id, value = '') {
    const target = element(id);
    if (target) target.value = value ?? '';
  }

  function value(id) {
    return element(id)?.value || '';
  }

  function durationFromFields(hoursId, minutesId, secondsId) {
    return durationSecondsFromParts(value(hoursId), value(minutesId), value(secondsId));
  }

  function durationFromForm() {
    return durationFromFields('completeDurationHours', 'completeDurationMinutes', 'completeDurationSeconds');
  }

  function setDurationFields(hoursId, minutesId, secondsId, totalSeconds) {
    const total = Math.max(0, Math.trunc(Number(totalSeconds) || 0));
    setValue(hoursId, Math.floor(total / 3600) || '');
    setValue(minutesId, Math.floor((total % 3600) / 60) || '');
    setValue(secondsId, total % 60 || '');
  }

  function setDuration(totalSeconds) {
    setDurationFields('completeDurationHours', 'completeDurationMinutes', 'completeDurationSeconds', totalSeconds);
  }

  function updatePacePreview() {
    const preview = element('completePacePreview');
    if (!preview) return;
    const pace = calculatePaceMetrics(durationFromForm(), value('completeDistance'));
    if (element('completeSpeedPreview')) element('completeSpeedPreview').textContent = pace.averageSpeedKmh || '-';
    if (element('completePaceTextPreview')) element('completePaceTextPreview').textContent = pace.paceDisplay || '-';
    preview.classList.toggle('hidden', !pace.averageSpeedKmh);
  }

  function clearForm() {
    setValue('completePlannedId');
    setValue('editingCompletedId');
    [
      'completeDate', 'completeTemplate', 'completeManualName',
      'completeDurationHours', 'completeDurationMinutes', 'completeDurationSeconds',
      'completeDistance', 'completeAvgHr', 'completeMaxHr', 'completeElevationGain',
      'completeTreadmillIncline', 'completeTrainingEffect', 'completeExecution',
      'completeFeeling', 'completeRpe', 'completeEnergy', 'completeLegs', 'completeSleep',
      'completeStress', 'completePainBefore', 'completePainAfter', 'completePainAreaRegion',
      'completePainAreaSide', 'completeAdaptation', 'completeBodyNotes', 'completeRaceName',
      'completeRaceDistance', 'completeRaceHours', 'completeRaceMinutes', 'completeRaceSeconds',
      'completeRaceCourse', 'completeRaceNote', 'completeNotes'
    ].forEach(id => setValue(id));
    setValue('completeAdaptation', 'none');
    if (element('completeRaceCountsPb')) element('completeRaceCountsPb').checked = true;
    updatePacePreview();
  }

  function setMode(mode) {
    const isEditing = mode === 'edit';
    const isHistorical = mode === 'historical';
    if (element('completeModalTitle')) {
      element('completeModalTitle').textContent = isEditing ? 'Rediger økt' : isHistorical ? 'Legg inn historisk økt' : 'Loggfør økt';
    }
    if (element('completeSubmitBtn')) {
      element('completeSubmitBtn').textContent = isEditing ? 'Lagre endringer' : isHistorical ? 'Lagre historisk økt' : 'Marker utført';
    }
    element('completeManualFields')?.classList.toggle('hidden', !(isEditing || isHistorical));
  }

  function renderGoldenZoneHint() {
    const hint = element('completeGoldenZoneHint');
    if (!hint) return;
    const state = getState();
    const personProfile = normalizePersonProfile(state.settings.personProfile);
    const trainingProfile = normalizeTrainingProfile(state.settings.trainingProfile);
    const maxHeartRate = Number(personProfile.maxHeartRate) || 0;
    if (!maxHeartRate) {
      hint.hidden = true;
      return;
    }
    const { lowPct, highPct } = goldenZonePercentages(trainingProfile.level);
    hint.textContent = `Din gylne sone: ${Math.round(maxHeartRate * lowPct)}–${Math.round(maxHeartRate * highPct)} bpm (${Math.round(lowPct * 100)}–${Math.round(highPct * 100)}% av maks)`;
    hint.hidden = false;
  }

  function readFormData() {
    const durationSeconds = durationFromForm();
    const distanceKm = value('completeDistance');
    const pace = calculatePaceMetrics(durationSeconds, distanceKm);
    const raceResult = normalizeRaceResult({
      name: value('completeRaceName'),
      distanceKm: value('completeRaceDistance'),
      resultSeconds: durationFromFields('completeRaceHours', 'completeRaceMinutes', 'completeRaceSeconds'),
      course: value('completeRaceCourse'),
      note: value('completeRaceNote'),
      countsAsPersonalBest: element('completeRaceCountsPb')?.checked !== false
    });
    const trainingEffectType = value('completeTrainingEffect');
    const areaRegion = value('completePainAreaRegion');
    const areaSide = value('completePainAreaSide');
    return {
      durationSeconds: durationSeconds || '',
      durationDisplay: durationSeconds ? formatDuration(durationSeconds) : '',
      durationMinutes: durationSeconds ? Math.round(durationSeconds / 60) : '',
      distanceKm,
      averageSpeedKmh: pace.averageSpeedKmh || '',
      paceSecondsPerKm: pace.paceSecondsPerKm || '',
      paceDisplay: pace.paceDisplay || '',
      avgHeartRate: value('completeAvgHr'),
      maxHeartRate: value('completeMaxHr'),
      elevationGainM: value('completeElevationGain'),
      treadmillInclinePercent: value('completeTreadmillIncline'),
      trainingEffectType,
      trainingEffectCategory: trainingEffectCategory(trainingEffectType),
      execution: value('completeExecution'),
      feelingScore: value('completeFeeling'),
      rpe: value('completeRpe'),
      readiness: {
        energy: value('completeEnergy'), legs: value('completeLegs'),
        sleep: value('completeSleep'), stress: value('completeStress')
      },
      bodyStatus: {
        painBefore: value('completePainBefore'),
        painAfter: value('completePainAfter'),
        areaRegion,
        areaSide,
        area: formatAreaLabel(areaRegion, areaSide),
        adaptation: value('completeAdaptation') || 'none',
        notes: value('completeBodyNotes').trim()
      },
      raceResult,
      notes: value('completeNotes').trim()
    };
  }

  function fillForm(completed = {}) {
    setValue('editingCompletedId', completed.id);
    setValue('completePlannedId', completed.plannedWorkoutId);
    setValue('completeDate', completed.date);
    setValue('completeTemplate', completed.templateId);
    setValue('completeManualName', completed.manualName);
    setDuration(completed.durationSeconds || (completed.durationMinutes ? Number(completed.durationMinutes) * 60 : 0));
    setValue('completeDistance', completed.distanceKm);
    setValue('completeAvgHr', completed.avgHeartRate);
    setValue('completeMaxHr', completed.maxHeartRate);
    setValue('completeElevationGain', completed.elevationGainM);
    setValue('completeTreadmillIncline', completed.treadmillInclinePercent);
    setValue('completeTrainingEffect', completed.trainingEffectType);
    setValue('completeExecution', completed.execution);
    setValue('completeFeeling', completed.feelingScore);
    setValue('completeRpe', completed.rpe);
    setValue('completeEnergy', completed.readiness?.energy);
    setValue('completeLegs', completed.readiness?.legs);
    setValue('completeSleep', completed.readiness?.sleep);
    setValue('completeStress', completed.readiness?.stress);
    setValue('completePainBefore', completed.bodyStatus?.painBefore);
    setValue('completePainAfter', completed.bodyStatus?.painAfter);
    setValue('completePainAreaRegion', completed.bodyStatus?.areaRegion);
    setValue('completePainAreaSide', completed.bodyStatus?.areaSide);
    setValue('completeAdaptation', completed.bodyStatus?.adaptation || 'none');
    setValue('completeBodyNotes', completed.bodyStatus?.notes);
    const raceResult = normalizeRaceResult(completed.raceResult);
    setValue('completeRaceName', raceResult?.name);
    setValue('completeRaceDistance', raceResult?.distanceKm);
    setDurationFields('completeRaceHours', 'completeRaceMinutes', 'completeRaceSeconds', raceResult?.resultSeconds || 0);
    setValue('completeRaceCourse', raceResult?.course);
    if (element('completeRaceCountsPb')) element('completeRaceCountsPb').checked = raceResult?.countsAsPersonalBest !== false;
    setValue('completeRaceNote', raceResult?.note);
    setValue('completeNotes', completed.notes);
    updatePacePreview();
  }

  function bindPacePreview() {
    ['completeDurationHours', 'completeDurationMinutes', 'completeDurationSeconds', 'completeDistance']
      .forEach(id => element(id)?.addEventListener('input', updatePacePreview));
  }

  return {
    bindPacePreview,
    clearForm,
    durationFromFields,
    durationFromForm,
    fillForm,
    readFormData,
    renderGoldenZoneHint,
    setDuration,
    setDurationFields,
    setMode,
    updatePacePreview
  };
}
