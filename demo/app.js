import { generateTimeslots } from '../dist/index.js';

const form = document.querySelector('#config-form');
const slotCountEl = document.querySelector('#slot-count');
const statusMessageEl = document.querySelector('#status-message');
const resultsBody = document.querySelector('#results-body');
const jsonOutputEl = document.querySelector('#json-output');
const copyButton = document.querySelector('#btn-copy-json');
const exclusionsContainer = document.querySelector('#exclusions');
const addExclusionButton = document.querySelector('#btn-add-exclusion');

const dayInput = document.querySelector('#input-day');
const timezoneInput = document.querySelector('#input-timezone');
const startInput = document.querySelector('#input-start');
const endInput = document.querySelector('#input-end');
const durationInput = document.querySelector('#input-duration');
const intervalInput = document.querySelector('#input-interval');
const bufferBeforeInput = document.querySelector('#input-buffer-before');
const bufferAfterInput = document.querySelector('#input-buffer-after');
const minDurationInput = document.querySelector('#input-min-duration');
const maxSlotsInput = document.querySelector('#input-max-slots');
const alignmentSelect = document.querySelector('#input-alignment');
const includeEdgeCheckbox = document.querySelector('#input-include-edge');
const labelSelect = document.querySelector('#input-label');

function setDefaultValues() {
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  dayInput.value = iso;
  startInput.value = '09:00';
  endInput.value = '17:00';
  durationInput.value = '30';
  intervalInput.value = '';
  bufferBeforeInput.value = '0';
  bufferAfterInput.value = '0';
  minDurationInput.value = '';
  maxSlotsInput.value = '';
  timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
}

function createExclusionRow(values = { start: '', end: '' }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-end gap-3';
  wrapper.innerHTML = `
    <label class="flex-1">
      <span class="text-xs font-medium text-slate-300">Start</span>
      <input type="time" value="${values.start}" class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
    </label>
    <label class="flex-1">
      <span class="text-xs font-medium text-slate-300">End</span>
      <input type="time" value="${values.end}" class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
    </label>
    <button type="button" class="mb-2 inline-flex items-center rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10">Remove</button>
  `;

  const removeButton = wrapper.querySelector('button');
  removeButton.addEventListener('click', () => {
    wrapper.remove();
    if (!exclusionsContainer.children.length) {
      statusMessageEl.textContent = 'No exclusions applied.';
    }
  });

  exclusionsContainer.append(wrapper);
}

function parseNumberInput(input) {
  const value = input.value.trim();
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function buildLabelFormatter(option) {
  if (option === 'time') {
    return ({ start, end }) => {
      return `${formatTime(start)} – ${formatTime(end)}`;
    };
  }

  if (option === 'index') {
    return (_slot, index) => `Slot ${index + 1}`;
  }

  return undefined;
}

function collectExclusions() {
  const rows = Array.from(exclusionsContainer.children);
  return rows
    .map((row) => {
      const inputs = row.querySelectorAll('input');
      const start = inputs[0]?.value.trim();
      const end = inputs[1]?.value.trim();
      if (!start || !end) return null;
      return { start, end };
    })
    .filter(Boolean);
}

function buildConfig() {
  const day = dayInput.value;
  const timezone = timezoneInput.value.trim();
  const start = startInput.value.trim();
  const end = endInput.value.trim();
  const slotDurationMinutes = Number.parseInt(durationInput.value, 10);

  if (!day || !start || !end || Number.isNaN(slotDurationMinutes)) {
    throw new Error('Please provide a valid day, start/end times, and slot duration.');
  }

  const config = {
    day,
    timezone: timezone || undefined,
    range: {
      start,
      end
    },
    slotDurationMinutes
  };

  const slotIntervalMinutes = parseNumberInput(intervalInput);
  if (slotIntervalMinutes) config.slotIntervalMinutes = slotIntervalMinutes;

  const bufferBeforeMinutes = parseNumberInput(bufferBeforeInput);
  if (bufferBeforeMinutes !== undefined) config.bufferBeforeMinutes = bufferBeforeMinutes;

  const bufferAfterMinutes = parseNumberInput(bufferAfterInput);
  if (bufferAfterMinutes !== undefined) config.bufferAfterMinutes = bufferAfterMinutes;

  const minimumSlotDurationMinutes = parseNumberInput(minDurationInput);
  if (minimumSlotDurationMinutes) config.minimumSlotDurationMinutes = minimumSlotDurationMinutes;

  const maxSlots = parseNumberInput(maxSlotsInput);
  if (maxSlots) config.maxSlots = maxSlots;

  config.alignment = alignmentSelect.value;
  config.includeEdge = includeEdgeCheckbox.checked;

  const exclusions = collectExclusions();
  if (exclusions.length) {
    config.excludedWindows = exclusions;
  }

  const formatter = buildLabelFormatter(labelSelect.value);
  if (formatter) {
    config.labelFormatter = formatter;
  }

  return config;
}

function formatTime(date, timezone) {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone || undefined
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function renderResults(slots, config) {
  resultsBody.innerHTML = '';

  if (!slots.length) {
    statusMessageEl.textContent = 'No slots generated with the current configuration.';
    slotCountEl.textContent = '0 slots';
    jsonOutputEl.textContent = '[]';
    return;
  }

  const { timezone } = config;
  slots.forEach((slot) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-2 text-slate-400">${slot.metadata?.index ?? ''}</td>
      <td class="px-4 py-2">${formatTime(slot.start, timezone)}</td>
      <td class="px-4 py-2">${formatTime(slot.end, timezone)}</td>
      <td class="px-4 py-2 text-slate-300">${slot.metadata?.durationMinutes ?? ''} min</td>
      <td class="px-4 py-2 text-slate-400">${slot.metadata?.label ?? ''}</td>
    `;
    resultsBody.append(row);
  });

  statusMessageEl.textContent = `Generated ${slots.length} slot${slots.length === 1 ? '' : 's'} from ${formatTime(slots[0].start, timezone)} to ${formatTime(slots.at(-1).end, timezone)}.`;
  slotCountEl.textContent = `${slots.length} slot${slots.length === 1 ? '' : 's'}`;

  const serialized = JSON.stringify(
    slots.map((slot) => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      metadata: slot.metadata
    })),
    null,
    2
  );
  jsonOutputEl.textContent = serialized;
}

function handleSubmit(event) {
  event.preventDefault();
  try {
    const config = buildConfig();
    const slots = generateTimeslots(config);
    renderResults(slots, config);
    statusMessageEl.classList.remove('text-red-300');
    statusMessageEl.classList.add('text-slate-400');
  } catch (error) {
    console.error(error);
    resultsBody.innerHTML = '';
    slotCountEl.textContent = '0 slots';
    statusMessageEl.textContent = error instanceof Error ? error.message : 'An unknown error occurred.';
    statusMessageEl.classList.add('text-red-300');
    statusMessageEl.classList.remove('text-slate-400');
    jsonOutputEl.textContent = '';
  }
}

function handleCopyJson() {
  const text = jsonOutputEl.textContent;
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => {
        copyButton.textContent = 'Copy JSON';
      }, 1500);
    })
    .catch(() => {
      copyButton.textContent = 'Copy failed';
      setTimeout(() => {
        copyButton.textContent = 'Copy JSON';
      }, 2000);
    });
}

function init() {
  setDefaultValues();
  createExclusionRow({ start: '12:00', end: '13:00' });
  form.addEventListener('submit', handleSubmit);
  copyButton.addEventListener('click', handleCopyJson);
  addExclusionButton.addEventListener('click', () => createExclusionRow());

  const autoSubmitTargets = [
    dayInput,
    timezoneInput,
    startInput,
    endInput,
    durationInput,
    intervalInput,
    bufferBeforeInput,
    bufferAfterInput,
    minDurationInput,
    maxSlotsInput,
    alignmentSelect,
    includeEdgeCheckbox,
    labelSelect
  ];

  autoSubmitTargets.forEach((element) => {
    element.addEventListener('change', () => form.requestSubmit());
    element.addEventListener('input', () => form.requestSubmit());
  });

  exclusionsContainer.addEventListener('change', () => form.requestSubmit());
  exclusionsContainer.addEventListener('input', () => form.requestSubmit());

  form.requestSubmit();
}

init();
