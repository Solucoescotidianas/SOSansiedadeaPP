/* script.js
   SOS Ansiedade — navegação, exercício respiratório e PWA registration
*/

/* ------------------------
   Seleção de elementos
   ------------------------ */
const screens = {
  welcome: document.getElementById('screen-welcome'),
  choice: document.getElementById('screen-choice'),
  exercise: document.getElementById('screen-exercise'),
  finish: document.getElementById('screen-finish')
};

const btnStart = document.getElementById('btn-start');
const choiceButtons = Array.from(document.querySelectorAll('.choice'));
const btnBackFromChoice = document.getElementById('btn-back-from-choice');

const exerciseTitle = document.getElementById('exercise-title');
const timeOptions = Array.from(document.querySelectorAll('.time-option'));
const btnInitExercise = document.getElementById('btn-init-exercise');
const btnBackFromExercise = document.getElementById('btn-back-from-exercise');
const breathCircle = document.getElementById('breath-circle');
const breathText = document.getElementById('breath-text');
const timerDisplay = document.getElementById('timer-display');

const btnFinishRepeat = document.getElementById('btn-restart');
const btnFinishHome = document.getElementById('btn-home');

const btnAudioToggle = document.getElementById('btn-audio-toggle');

/* ------------------------
   Estado do app
   ------------------------ */
let selectedChoice = null;
let exerciseTotalSeconds = 180; // default 3 minutos
let breathAnimationId = null;
const BREATH_CYCLE_MS = 10000; // 10s por ciclo (4s inspirar, 6s expirar)
const INSPIRE_MS = 4000;
const EXPIRE_MS = 6000;

// Áudio / WebAudio
let audioEnabled = JSON.parse(localStorage.getItem('sos_audio_enabled') || 'true');
let audioCtx = null;

/* ------------------------
   PWA: registrar service worker
   ------------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registrado', reg))
      .catch(err => console.warn('Falha ao registrar SW', err));
  });
}

/* ------------------------
   Navegação entre telas
   ------------------------ */
function showScreen(key) {
  Object.keys(screens).forEach(k => {
    const el = screens[k];
    const active = k === key;
    if (active) {
      el.classList.add('active');
      el.setAttribute('aria-hidden', 'false');
    } else {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

/* ------------------------
   Utilitários de tempo
   ------------------------ */
function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/* ------------------------
   Handlers de interface
   ------------------------ */
btnStart.addEventListener('click', () => {
  showScreen('choice');
  setTimeout(()=> choiceButtons[0].focus(), 200);
});

btnBackFromChoice.addEventListener('click', () => showScreen('welcome'));

choiceButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    selectedChoice = btn.dataset.choice;
    const titles = {
      ansiosa: 'Respiração para ansiedade',
      mente: 'Acalmar a mente',
      dormir: 'Preparar para dormir'
    };
    exerciseTitle.textContent = titles[selectedChoice] || 'Respiração guiada';
    showScreen('exercise');
    timerDisplay.textContent = formatTime(exerciseTotalSeconds);
    updateTimeOptionsUI();
    setTimeout(()=> btnInitExercise.focus(), 200);
  });
});

btnBackFromExercise.addEventListener('click', () => showScreen('choice'));

timeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    timeOptions.forEach(o => o.setAttribute('aria-checked', 'false'));
    opt.setAttribute('aria-checked', 'true');
    const mins = Number(opt.dataset.minutes) || 3;
    exerciseTotalSeconds = mins * 60;
    timerDisplay.textContent = formatTime(exerciseTotalSeconds);
    localStorage.setItem('sos_exercise_minutes', String(mins));
  });
});

function updateTimeOptionsUI(){
  timeOptions.forEach(o => {
    const mins = Number(o.dataset.minutes);
    o.setAttribute('aria-checked', (mins * 60) === exerciseTotalSeconds ? 'true' : 'false');
  });
}

/* ------------------------
   Áudio: WebAudio synth (sino suave)
   ------------------------ */
function ensureAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      console.warn('WebAudio não suportado', err);
      audioCtx = null;
    }
  }
  return audioCtx;
}

function playBell() {
  if (!audioEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  const g = ctx.createGain();

  o1.type = 'sine';
  o2.type = 'sine';

  o1.frequency.setValueAtTime(420, now);
  o2.frequency.setValueAtTime(660, now);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.08, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

  o1.frequency.exponentialRampToValueAtTime(360, now + 1.2);
  o2.frequency.exponentialRampToValueAtTime(580, now + 1.2);

  o1.connect(g);
  o2.connect(g);
  g.connect(ctx.destination);

  o1.start(now);
  o2.start(now);
  o1.stop(now + 2.0);
  o2.stop(now + 2.0);
}

function updateAudioToggleUI() {
  btnAudioToggle.setAttribute('aria-pressed', String(audioEnabled));
  btnAudioToggle.style.background = audioEnabled ? 'linear-gradient(180deg,#7b6bff,#5f57ff)' : 'var(--glass)';
  btnAudioToggle.style.color = audioEnabled ? '#061025' : 'var(--calm)';
}

btnAudioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  localStorage.setItem('sos_audio_enabled', JSON.stringify(audioEnabled));
  updateAudioToggleUI();
  if (audioEnabled) ensureAudioContext();
});

/* ------------------------
   Lógica do exercício
   ------------------------ */
function startBreathing(){
  stopBreathing();

  const startAt = performance.now();
  const endAt = startAt + exerciseTotalSeconds * 1000;
  breathCircle.classList.add('breathing');

  playBell();

  function tick(now) {
    const remainingMs = Math.max(0, endAt - now);
    timerDisplay.textContent = formatTime(Math.max(0, Math.floor((remainingMs + 999) / 1000)));

    const elapsedSinceStart = now - startAt;
    const cyclePos = elapsedSinceStart % BREATH_CYCLE_MS;
    if (cyclePos < INSPIRE_MS) {
      breathText.textContent = 'Inspire';
    } else {
      breathText.textContent = 'Expire';
    }

    if (remainingMs <= 0) {
      stopBreathing();
      playBell();
      setTimeout(()=> showScreen('finish'), 400);
      return;
    }

    breathAnimationId = requestAnimationFrame(tick);
  }

  breathAnimationId = requestAnimationFrame(tick);
}

function stopBreathing(){
  if (breathAnimationId) {
    cancelAnimationFrame(breathAnimationId);
    breathAnimationId = null;
  }
  breathCircle.classList.remove('breathing');
  breathText.textContent = 'Pronto';
}

btnInitExercise.addEventListener('click', () => {
  breathText.textContent = 'Inspire';
  startBreathing();
});

btnFinishRepeat.addEventListener('click', () => {
  showScreen('exercise');
  timerDisplay.textContent = formatTime(exerciseTotalSeconds);
  setTimeout(()=> btnInitExercise.focus(), 200);
});
btnFinishHome.addEventListener('click', () => {
  stopBreathing();
  selectedChoice = null;
  exerciseTotalSeconds = 180;
  localStorage.removeItem('sos_exercise_minutes');
  updateTimeOptionsUI();
  showScreen('welcome');
  setTimeout(()=> btnStart.focus(), 200);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopBreathing();
  }
});

/* ------------------------
   Inicialização
   ------------------------ */
(function init(){
  const savedMins = Number(localStorage.getItem('sos_exercise_minutes'));
  if (savedMins && [3,5,7].includes(savedMins)) exerciseTotalSeconds = savedMins * 60;
  updateAudioToggleUI();
  timerDisplay.textContent = formatTime(exerciseTotalSeconds);
  updateTimeOptionsUI();
})();