// switch between screens
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// countdown before each test starts (3, 2, 1...)
function runCountdown(label, onDone) {
  const overlay = document.getElementById("countdownOverlay");
  const numEl = document.getElementById("countdownNum");
  const lblEl = document.getElementById("countdownLabel");

  lblEl.textContent = label;
  overlay.classList.add("active");

  let count = 3;
  numEl.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(timer);
      overlay.classList.remove("active");
      onDone();
    } else {
      numEl.textContent = count;
    }
  }, 900);
}

// all the data we collect during the session
const state = {
  reactionTimes: [],
  hits: 0,
  misses: 0,
  sessionStart: null,
  pressureReactionTimes: [],
  pressureHits: 0,
  pressureMisses: 0
};

// reaction test variables
const TOTAL_ROUNDS = 5;
let reactionRound = 0;
let waitTimer = null;
let flashStart = null;
let arenaReady = false;

const arena = document.getElementById("reactionArena");
const rLabel = document.getElementById("reactionLabel");
const rSub = document.getElementById("reactionSub");
const liveRound = document.getElementById("liveRound");
const liveLast = document.getElementById("liveLast");
const liveBest = document.getElementById("liveBest");
const roundDots = document.getElementById("roundDots");

function buildDots(containerId) {
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const dot = document.createElement("div");
    dot.className = "round-dot";
    dot.id = containerId + "-dot-" + i;
    el.appendChild(dot);
  }
}

function setDot(containerId, i, cls) {
  const dot = document.getElementById(containerId + "-dot-" + i);
  if (dot) dot.className = "round-dot " + cls;
}

function startReactionRound() {
  arenaReady = false;
  arena.className = "reaction-arena waiting";
  rLabel.textContent = "Wait for it...";
  rSub.textContent = "";
  setDot("roundDots", reactionRound, "current");

  // random delay so you can't predict when it flashes
  const delay = 1500 + Math.random() * 2500;
  waitTimer = setTimeout(() => {
    arena.className = "reaction-arena go";
    rLabel.textContent = "CLICK NOW!";
    flashStart = performance.now();
    arenaReady = true;
  }, delay);
}

function handleReactionClick() {
  if (reactionRound >= TOTAL_ROUNDS) return;

  if (!arenaReady) {
    clearTimeout(waitTimer);
    arena.className = "reaction-arena too-early";
    rLabel.textContent = "Too early! 😬";
    rSub.textContent = "Wait for the green flash";
    setTimeout(startReactionRound, 1200);
    return;
  }

  const rt = Math.round(performance.now() - flashStart);
  state.reactionTimes.push(rt);
  arenaReady = false;

  liveLast.textContent = rt + " ms";
  liveBest.textContent = Math.min(...state.reactionTimes) + " ms";
  setDot("roundDots", reactionRound, "done");
  reactionRound++;
  liveRound.textContent = reactionRound + " / " + TOTAL_ROUNDS;

  if (reactionRound >= TOTAL_ROUNDS) {
    arena.className = "reaction-arena";
    rLabel.textContent = "Done! ✓";
    rSub.textContent = "Moving to accuracy test...";
    setTimeout(startAccuracyTest, 1000);
    return;
  }

  arena.className = "reaction-arena";
  rLabel.textContent = "Nice! Next round...";
  setTimeout(startReactionRound, 900);
}

arena.addEventListener("click", handleReactionClick);


// accuracy test
const TOTAL_TARGETS = 15;
const TARGET_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

let targetsShown = 0;
let activeTarget = null;
let targetTimer = null;
let isPressureAccuracy = false;

const accArena = document.getElementById("accuracyArena");
const hitCountEl = document.getElementById("hitCount");
const missCountEl = document.getElementById("missCount");
const targetCountEl = document.getElementById("targetCount");
const accBar = document.getElementById("accProgressBar");

function updateAccCounters() {
  const h = isPressureAccuracy ? state.pressureHits : state.hits;
  const m = isPressureAccuracy ? state.pressureMisses : state.misses;
  hitCountEl.textContent = "Hits: " + h;
  missCountEl.textContent = "Missed: " + m;
  targetCountEl.textContent = targetsShown + " / " + TOTAL_TARGETS;
  accBar.style.width = (targetsShown / TOTAL_TARGETS * 100) + "%";
}

function spawnTarget(lifetime) {
  if (targetsShown >= TOTAL_TARGETS) return;

  const size = 44 + Math.random() * 24;
  const arenaW = accArena.offsetWidth;
  const arenaH = accArena.offsetHeight;
  const x = size / 2 + Math.random() * (arenaW - size);
  const y = size / 2 + Math.random() * (arenaH - size);
  const color = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];

  const t = document.createElement("div");
  t.className = "target";
  t.style.cssText = `width:${size}px; height:${size}px; left:${x - size/2}px; top:${y - size/2}px; background:${color}; opacity:0.85;`;
  t.innerHTML = `<div class="target-inner"></div>`;
  accArena.appendChild(t);

  activeTarget = t;
  targetsShown++;
  updateAccCounters();

  // double rAF trick to trigger the CSS transition
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("visible")));

  t.addEventListener("click", () => {
    clearTimeout(targetTimer);
    if (isPressureAccuracy) state.pressureHits++;
    else state.hits++;

    t.classList.add("hit");
    setTimeout(() => t.remove(), 120);
    activeTarget = null;
    updateAccCounters();

    if (targetsShown >= TOTAL_TARGETS) {
      finishAccuracy();
    } else {
      setTimeout(() => spawnTarget(lifetime), 250);
    }
  });

  // if player misses, count it and move on
  targetTimer = setTimeout(() => {
    if (!t.isConnected) return;
    if (isPressureAccuracy) state.pressureMisses++;
    else state.misses++;

    t.classList.remove("visible");
    setTimeout(() => t.remove(), 150);
    activeTarget = null;
    updateAccCounters();

    if (targetsShown >= TOTAL_TARGETS) {
      finishAccuracy();
    } else {
      setTimeout(() => spawnTarget(lifetime), 180);
    }
  }, lifetime);
}

function finishAccuracy() {
  clearTimeout(targetTimer);
  if (isPressureAccuracy) {
    setTimeout(submitResults, 600);
  } else {
    setTimeout(startPressureMode, 600);
  }
}

function startAccuracyTest() {
  isPressureAccuracy = false;
  showScreen("screenAccuracy");
  accArena.className = "accuracy-arena";
  state.hits = 0;
  state.misses = 0;
  targetsShown = 0;
  activeTarget = null;
  accArena.innerHTML = "";
  updateAccCounters();
  setTimeout(() => spawnTarget(1400), 500);
}


// pressure mode - same tests but faster
let pressureRound = 0;
let pressureArenaReady = false;
let pressureWaitTimer = null;
let pressureFlashStart = null;

const pArena = document.getElementById("pressureArena");
const pLabel = document.getElementById("pressureLabel");
const pRound = document.getElementById("pressureRound");
const pLast = document.getElementById("pressureLast");
const pBest = document.getElementById("pressureBest");

function startPressureMode() {
  showScreen("screenPressure");
  pressureRound = 0;
  state.pressureReactionTimes = [];
  buildDots("pressureDots");
  pRound.textContent = "0 / " + TOTAL_ROUNDS;
  pLast.textContent = "—";
  pBest.textContent = "—";
  runCountdown("Pressure Mode", startPressureReactionRound);
}

function startPressureReactionRound() {
  pressureArenaReady = false;
  pArena.className = "reaction-arena pressure-mode waiting";
  pLabel.textContent = "Stay sharp...";
  setDot("pressureDots", pressureRound, "current");

  // shorter window than normal mode
  const delay = 800 + Math.random() * 1400;
  pressureWaitTimer = setTimeout(() => {
    pArena.className = "reaction-arena pressure-mode go";
    pLabel.textContent = "NOW!";
    pressureFlashStart = performance.now();
    pressureArenaReady = true;
  }, delay);
}

function handlePressureClick() {
  if (pressureRound >= TOTAL_ROUNDS) return;

  if (!pressureArenaReady) {
    clearTimeout(pressureWaitTimer);
    pArena.className = "reaction-arena pressure-mode too-early";
    pLabel.textContent = "Too early! 😬";
    setTimeout(startPressureReactionRound, 1000);
    return;
  }

  const rt = Math.round(performance.now() - pressureFlashStart);
  state.pressureReactionTimes.push(rt);
  pressureArenaReady = false;

  pLast.textContent = rt + " ms";
  pBest.textContent = Math.min(...state.pressureReactionTimes) + " ms";
  setDot("pressureDots", pressureRound, "pressure-done");
  pressureRound++;
  pRound.textContent = pressureRound + " / " + TOTAL_ROUNDS;

  if (pressureRound >= TOTAL_ROUNDS) {
    pArena.className = "reaction-arena pressure-mode";
    pLabel.textContent = "Done! ✓";
    setTimeout(startPressureAccuracy, 1000);
    return;
  }

  pArena.className = "reaction-arena pressure-mode";
  pLabel.textContent = "Keep going...";
  setTimeout(startPressureReactionRound, 700);
}

pArena.addEventListener("click", handlePressureClick);

function startPressureAccuracy() {
  isPressureAccuracy = true;
  showScreen("screenAccuracy");
  accArena.className = "accuracy-arena pressure-arena";
  document.getElementById("accInstruction").textContent = "🔥 Pressure Mode — faster targets!";
  state.pressureHits = 0;
  state.pressureMisses = 0;
  targetsShown = 0;
  activeTarget = null;
  accArena.innerHTML = "";
  updateAccCounters();
  setTimeout(() => spawnTarget(900), 400);
}


// radar chart drawn on canvas
function drawRadar(scores) {
  const canvas = document.getElementById("radarCanvas");
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 30;

  const keys = Object.keys(scores);
  const vals = Object.values(scores);
  const n = keys.length;
  const dotColors = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw background grid rings
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (radius * ring) / 4;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // axis lines from center
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // the actual data polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (radius * vals[i]) / 100;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(124,58,237,0.2)";
  ctx.fill();
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  ctx.stroke();

  // dots on each axis point + labels
  const labelsEl = document.getElementById("radarLabels");
  labelsEl.innerHTML = "";

  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (radius * vals[i]) / 100;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = dotColors[i];
    ctx.fill();

    // label on the outer edge
    const lx = cx + (radius + 18) * Math.cos(angle);
    const ly = cy + (radius + 18) * Math.sin(angle);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(keys[i], lx, ly);

    // legend below chart
    const item = document.createElement("div");
    item.className = "radar-label-item";
    item.innerHTML = `<div class="radar-dot" style="background:${dotColors[i]}"></div>${keys[i]}: <strong style="color:#e2e8f0; margin-left:4px">${Math.round(vals[i])}</strong>`;
    labelsEl.appendChild(item);
  }
}


// line chart showing reaction time across rounds
function drawTrend(times) {
  const canvas = document.getElementById("trendCanvas");
  canvas.width = canvas.parentElement.offsetWidth - 28;
  canvas.height = 70;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const pad = 10;

  const minVal = Math.min(...times);
  const maxVal = Math.max(...times);
  const range = maxVal - minVal || 1;

  ctx.clearRect(0, 0, w, h);

  const pts = times.map((t, i) => ({
    x: pad + (i / (times.length - 1)) * (w - pad * 2),
    y: h - pad - ((t - minVal) / range) * (h - pad * 2)
  }));

  // gradient fill under the line
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(124,58,237,0.3)");
  grad.addColorStop(1, "rgba(124,58,237,0)");

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // the line itself
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  ctx.stroke();

  // small dots at each data point
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#06b6d4";
    ctx.fill();
  });
}

function getTrendMessage(times) {
  const early = (times[0] + times[1]) / 2;
  const late = (times[times.length - 2] + times[times.length - 1]) / 2;
  const diff = early - late;

  if (diff > 30)
    return `<span class="good">📈 You improved after warming up</span> — reaction time dropped by ~${Math.round(diff)}ms over rounds.`;
  if (diff < -30)
    return `<span class="warn">📉 Performance declined under repetition</span> — fatigue may be a factor.`;

  const spread = Math.max(...times) - Math.min(...times);
  if (spread < 60)
    return `<span class="good">✅ Very consistent performance</span> — minimal variance across all rounds.`;

  return `<span class="warn">〰️ Mixed performance</span> — inconsistent reaction times suggest room for focus improvement.`;
}


// compare normal vs pressure mode results
function renderPressureCompare(normalRT, pressureRT, normalAcc, pressureAcc) {
  const fasterUnderPressure = pressureRT < normalRT;
  const accurateUnderPressure = pressureAcc >= normalAcc;

  const rtClass = fasterUnderPressure ? "better" : "worse";
  const accClass = accurateUnderPressure ? "better" : "worse";

  let insight = "";
  if (fasterUnderPressure && accurateUnderPressure)
    insight = "🔥 <span>You thrive under pressure</span> — both speed and accuracy improved!";
  else if (fasterUnderPressure && !accurateUnderPressure)
    insight = "⚡ <span>You get faster under pressure</span> but accuracy drops. Work on staying precise.";
  else if (!fasterUnderPressure && accurateUnderPressure)
    insight = "🎯 <span>Accuracy holds under pressure</span> but reaction slows. Good composure!";
  else
    insight = "😤 <span>Pressure affects your performance</span> — practice stress-resistance drills.";

  document.getElementById("pressureCompare").innerHTML = `
    <div class="pc-item">
      <div class="pc-label">Normal Reaction</div>
      <div class="pc-val">${normalRT} ms</div>
    </div>
    <div class="pc-item">
      <div class="pc-label">Pressure Reaction</div>
      <div class="pc-val ${rtClass}">${pressureRT} ms ${fasterUnderPressure ? "▲" : "▼"}</div>
    </div>
    <div class="pc-item">
      <div class="pc-label">Normal Accuracy</div>
      <div class="pc-val">${normalAcc}%</div>
    </div>
    <div class="pc-item">
      <div class="pc-label">Pressure Accuracy</div>
      <div class="pc-val ${accClass}">${pressureAcc}% ${accurateUnderPressure ? "▲" : "▼"}</div>
    </div>
    <div class="pressure-insight">${insight}</div>`;
}

function renderWeakness(weakness) {
  document.getElementById("weaknessBox").innerHTML = `
    <span class="weak-tag">Weakest: ${weakness.weakest}</span>
    <span class="strong-tag">Strongest: ${weakness.strongest}</span>
    <p style="margin-top:8px">${weakness.message}</p>`;
}

function renderRecommendations(recos) {
  document.getElementById("recoList").innerHTML = recos
    .map(r => `<div class="reco-item"><span class="reco-icon">${r.icon}</span>${r.text}</div>`)
    .join("");
}


// leaderboard stored in localStorage
const LB_KEY = "gsp_leaderboard_v2";

function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToLeaderboard(score, level) {
  const lb = loadLeaderboard();
  lb.push({ score, level, date: new Date().toLocaleDateString() });
  lb.sort((a, b) => b.score - a.score);
  const top5 = lb.slice(0, 5);
  localStorage.setItem(LB_KEY, JSON.stringify(top5));
  return top5;
}

function renderLeaderboard(current) {
  const lb = saveToLeaderboard(current.score, current.level);
  const icons = ["🥇", "🥈", "🥉", "4", "5"];
  const classes = ["gold", "silver", "bronze", "other", "other"];
  const today = new Date().toLocaleDateString();

  document.getElementById("leaderboard").innerHTML = lb.map((entry, i) => {
    const isCurrentRun = entry.score === current.score && entry.date === today
      && i === lb.findIndex(e => e.score === current.score);
    return `
      <div class="lb-row ${isCurrentRun ? "current-run" : ""}">
        <span class="lb-rank ${classes[i]}">${icons[i]}</span>
        <span class="lb-level">${entry.level}</span>
        <span class="lb-date">${entry.date}</span>
        <span class="lb-score">${entry.score} / 100</span>
      </div>`;
  }).join("");
}


// collect everything and send to Flask
async function submitResults() {
  const sessionEnd = performance.now();
  const sessionMins = (sessionEnd - state.sessionStart) / 60000;
  const timePlayed = parseFloat(Math.min(10, Math.max(0.5, sessionMins)).toFixed(2));

  const totalTargets = state.hits + state.misses;
  const accuracy = totalTargets > 0
    ? parseFloat(((state.hits / totalTargets) * 100).toFixed(1))
    : 0;

  const avgRT = Math.round(
    state.reactionTimes.reduce((a, b) => a + b, 0) / state.reactionTimes.length
  );
  const mistakes = state.misses;

  const pTotal = state.pressureHits + state.pressureMisses;
  const pressureAcc = pTotal > 0
    ? parseFloat(((state.pressureHits / pTotal) * 100).toFixed(1))
    : 0;
  const pressureRT = state.pressureReactionTimes.length
    ? Math.round(state.pressureReactionTimes.reduce((a, b) => a + b, 0) / state.pressureReactionTimes.length)
    : avgRT;

  showScreen("screenResult");

  document.getElementById("measuredRT").textContent = avgRT + " ms";
  document.getElementById("measuredAcc").textContent = accuracy + "%";
  document.getElementById("measuredMis").textContent = mistakes;
  document.getElementById("measuredTime").textContent = sessionMins.toFixed(1) + " min";

  // normalize each metric to 0-100 for the radar
  const radarScores = {
    "Reaction": Math.round(Math.max(0, 100 - ((avgRT - 120) / 380) * 100)),
    "Accuracy": Math.round(Math.min(100, accuracy)),
    "Consistency": Math.round(Math.max(0, 100 - ((Math.max(...state.reactionTimes) - Math.min(...state.reactionTimes)) / 4))),
    "Control": Math.round(Math.max(0, 100 - (mistakes / 35) * 100))
  };

  drawRadar(radarScores);
  drawTrend(state.reactionTimes);
  document.getElementById("trendMsg").innerHTML = getTrendMessage(state.reactionTimes);
  renderPressureCompare(avgRT, pressureRT, accuracy, pressureAcc);

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reaction_time: avgRT,
        accuracy: accuracy,
        time_played: timePlayed,
        mistakes: mistakes
      })
    });

    if (!res.ok) throw new Error("server error");
    const data = await res.json();

    document.getElementById("skillBadge").textContent = data.skill_level;
    document.getElementById("skillBadge").className = "skill-badge " + getBadgeClass(data.skill_level);
    document.getElementById("resultMessage").textContent = data.message;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById("progressFill").style.width = data.score + "%";
    }));
    animateScore(data.score);

    document.getElementById("playstyleBadge").textContent = data.playstyle.name;
    document.getElementById("playstyleBadge").className = "playstyle-badge " + data.playstyle.key;
    document.getElementById("playstyleDesc").textContent = data.playstyle.desc;

    renderWeakness(data.weakness);
    renderRecommendations(data.recommendations);
    renderLeaderboard({ score: data.score, level: data.skill_level });

  } catch (err) {
    document.getElementById("resultMessage").textContent = "Could not reach server. Is Flask running?";
    document.getElementById("skillBadge").textContent = "Error";
    renderWeakness({ weakest: "Unknown", strongest: "Unknown", message: "Server unavailable." });
    renderRecommendations([{ icon: "⚠️", text: "Start the Flask server and try again." }]);
    renderLeaderboard({ score: 0, level: "N/A" });
  }
}

function animateScore(target) {
  const el = document.getElementById("scoreValue");
  let cur = 0;
  const step = target / 40;
  const iv = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.round(cur) + " / 100";
    if (cur >= target) clearInterval(iv);
  }, 25);
}

function getBadgeClass(level) {
  const map = { "Pro": "pro", "Intermediate": "intermediate", "Beginner": "beginner" };
  return map[level] || "";
}


// reset everything and go back to start
document.getElementById("btnRetry").addEventListener("click", () => {
  state.reactionTimes = [];
  state.hits = 0;
  state.misses = 0;
  state.sessionStart = null;
  state.pressureReactionTimes = [];
  state.pressureHits = 0;
  state.pressureMisses = 0;

  reactionRound = 0;
  pressureRound = 0;
  arenaReady = false;
  pressureArenaReady = false;
  isPressureAccuracy = false;

  clearTimeout(waitTimer);
  clearTimeout(targetTimer);
  clearTimeout(pressureWaitTimer);

  document.getElementById("accInstruction").textContent = "Click the targets before they disappear!";
  showScreen("screenStart");
});

document.getElementById("btnStart").addEventListener("click", () => {
  state.sessionStart = performance.now();
  reactionRound = 0;
  state.reactionTimes = [];

  buildDots("roundDots");
  liveRound.textContent = "0 / " + TOTAL_ROUNDS;
  liveLast.textContent = "—";
  liveBest.textContent = "—";

  showScreen("screenReaction");
  runCountdown("Get Ready", startReactionRound);
});
