// app-kongling.js — Kongling (Steel Tongue Drum) module for Music Hub
// Uses shared AudioEngine for audio context

const KonglingApp = (function() {

const CSS = `
.kongling-app{position:relative;width:100%;height:100%;overflow:hidden;--drum-rim:#c9a84c;--drum-rim-light:#e8d48b;--drum-rim-dark:#8a6d2b;--tongue-bg:linear-gradient(145deg,#d4b35a,#a07830);--tongue-active:linear-gradient(145deg,#f0d878,#c9a84c);--tongue-shadow:rgba(201,168,76,.5);--tongue-text:#3a2a0a;--drum-face-bg:radial-gradient(ellipse at 40% 35%,#2a2a40 0%,#1a1a2e 60%,#10101e 100%);--bg:#0e0e1a;--text:#e0dcd0;--text-dim:#888;--accent:#c9a84c;--error:#e74c3c;--success:#4caf50}
.kongling-app.theme-silver{--drum-rim:#b0b0b8;--drum-rim-light:#d8d8e0;--drum-rim-dark:#707078;--tongue-bg:linear-gradient(145deg,#c0c0c8,#909098);--tongue-active:linear-gradient(145deg,#e0e0e8,#b8b8c0);--tongue-shadow:rgba(176,176,184,.5);--tongue-text:#1a1a2e;--accent:#b0b0b8}
.kongling-app.theme-copper{--drum-rim:#b87333;--drum-rim-light:#d4955a;--drum-rim-dark:#8a5220;--tongue-bg:linear-gradient(145deg,#cd8840,#955a25);--tongue-active:linear-gradient(145deg,#e0a060,#b87333);--tongue-shadow:rgba(184,115,51,.5);--tongue-text:#2a1a08;--accent:#b87333}
.kongling-top-bar{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px;flex-wrap:wrap;flex-shrink:0}
.kongling-top-bar label{font-size:12px;color:var(--text-dim)}
.kongling-top-bar select,.kongling-top-bar button{background:rgba(255,255,255,.08);color:var(--text);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:5px 10px;font-size:13px;cursor:pointer;transition:background .2s}
.kongling-top-bar select:hover,.kongling-top-bar button:hover{background:rgba(255,255,255,.15)}
.kongling-top-bar button.active{background:var(--accent);color:#1a1a2e;border-color:var(--accent);font-weight:600}
.kongling-score-bar{height:56px;background:rgba(14,14,26,.88);display:none;align-items:center;padding:0 16px;overflow:hidden;flex-shrink:0}
.kongling-score-bar.visible{display:flex}
.kongling-score-track{display:flex;gap:6px;align-items:center;transition:transform .3s ease;padding:0 40%}
.kongling-score-note{min-width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:13px;font-weight:600;background:rgba(255,255,255,.06);color:var(--text-dim);border:1.5px solid transparent;flex-shrink:0;transition:all .25s;flex-direction:column}
.kongling-score-note.current{background:var(--accent);color:#1a1a2e;border-color:var(--accent);transform:scale(1.15);box-shadow:0 0 12px var(--tongue-shadow)}
.kongling-score-note.played{background:rgba(76,175,80,.2);color:var(--success);border-color:var(--success)}
.kongling-score-note.missed{background:rgba(231,76,60,.2);color:var(--error);border-color:var(--error)}
.kongling-progress-bar{height:3px;background:rgba(255,255,255,.08);display:none;flex-shrink:0}
.kongling-progress-bar.visible{display:block}
.kongling-progress-fill{height:100%;width:0%;background:var(--accent);transition:width .3s}
.kongling-drum-area{flex:1;display:flex;align-items:center;justify-content:center;position:relative;min-height:0}
.kongling-drum-container{width:360px;height:360px;position:relative}
.kongling-drum-face{width:100%;height:100%;border-radius:50%;background:var(--drum-face-bg);border:4px solid var(--drum-rim-dark);box-shadow:0 0 0 6px var(--drum-rim),0 0 0 10px var(--drum-rim-dark),0 0 40px rgba(0,0,0,.6),inset 0 0 60px rgba(0,0,0,.4);position:relative}
.kongling-drum-face::after{content:'';position:absolute;inset:-20px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,var(--tongue-shadow) 0%,transparent 70%);opacity:.15;animation:kongling-breathe 4s ease-in-out infinite;pointer-events:none;z-index:0}
@keyframes kongling-breathe{0%,100%{opacity:.08;transform:scale(.95)}50%{opacity:.2;transform:scale(1.05)}}
.kongling-tongue{position:absolute;width:72px;height:72px;border-radius:50%;background:var(--tongue-bg);border:2px solid var(--drum-rim-dark);box-shadow:0 3px 8px rgba(0,0,0,.4),inset 0 1px 2px rgba(255,255,255,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:transform .1s,box-shadow .1s;z-index:2;transform:translate(-50%,-50%)}
.kongling-tongue:hover{box-shadow:0 3px 8px rgba(0,0,0,.4),inset 0 1px 2px rgba(255,255,255,.25),0 0 16px var(--tongue-shadow)}
.kongling-tongue.hit{transform:translate(-50%,-50%) scale(.88);background:var(--tongue-active);box-shadow:0 1px 4px rgba(0,0,0,.3),0 0 24px var(--tongue-shadow)}
.kongling-tongue .kongling-note-name{font-size:14px;font-weight:700;color:var(--tongue-text);line-height:1}
.kongling-tongue .kongling-key-hint{font-size:10px;color:var(--tongue-text);opacity:.55;margin-top:2px}
.kongling-tongue .kongling-star-hint{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:18px;pointer-events:none;display:none}
.kongling-tongue .kongling-star-hint.visible{display:block;animation:kongling-starPulse .8s ease-in-out infinite}
@keyframes kongling-starPulse{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(1.3);opacity:.7}}
@keyframes kongling-starFlash{0%,100%{transform:translateX(-50%) scale(1);opacity:1}25%{transform:translateX(-50%) scale(1.8);opacity:1}50%{transform:translateX(-50%) scale(.8);opacity:.3}75%{transform:translateX(-50%) scale(1.5);opacity:1}}
.kongling-tongue.wrong{animation:kongling-shake .4s ease}
@keyframes kongling-shake{0%,100%{transform:translate(-50%,-50%) translateX(0)}20%{transform:translate(-50%,-50%) translateX(-5px)}40%{transform:translate(-50%,-50%) translateX(5px)}60%{transform:translate(-50%,-50%) translateX(-4px)}80%{transform:translate(-50%,-50%) translateX(3px)}}
.kongling-ripple{position:absolute;border-radius:50%;border:2px solid var(--accent);opacity:.7;pointer-events:none;animation:kongling-rippleOut .8s ease-out forwards;z-index:1}
@keyframes kongling-rippleOut{0%{width:20px;height:20px;opacity:.7;transform:translate(-50%,-50%) scale(0)}100%{width:160px;height:160px;opacity:0;transform:translate(-50%,-50%) scale(1)}}
.kongling-star-particle{position:fixed;font-size:16px;pointer-events:none;z-index:200;animation:kongling-starFly .7s ease-out forwards}
@keyframes kongling-starFly{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}
.kongling-combo-display{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:800;color:var(--accent);pointer-events:none;z-index:150;opacity:0;transition:opacity .3s;text-shadow:0 0 20px var(--tongue-shadow)}
.kongling-combo-display.show{opacity:1;animation:kongling-comboPop .5s ease-out}
@keyframes kongling-comboPop{0%{transform:translate(-50%,-50%) scale(.5)}50%{transform:translate(-50%,-50%) scale(1.2)}100%{transform:translate(-50%,-50%) scale(1)}}
.kongling-status-bar{padding:10px 16px;background:rgba(14,14,26,.92);display:flex;align-items:center;justify-content:center;gap:12px;font-size:13px;min-height:44px;flex-shrink:0}
.kongling-status-msg{color:var(--text-dim);transition:color .2s}
.kongling-status-msg.error{color:var(--error)}
.kongling-status-msg.success{color:var(--success)}
.kongling-finish-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:300}
.kongling-finish-overlay.show{display:flex}
.kongling-finish-box{background:#1e1e32;border:2px solid var(--accent);border-radius:16px;padding:32px 40px;text-align:center;box-shadow:0 0 40px rgba(0,0,0,.5)}
.kongling-finish-box .kongling-emoji{font-size:48px;margin-bottom:12px}
.kongling-finish-box h2{font-size:22px;margin-bottom:8px;color:var(--accent)}
.kongling-finish-box p{color:var(--text-dim);margin-bottom:20px}
.kongling-finish-box button{background:var(--accent);color:#1a1a2e;border:none;border-radius:8px;padding:10px 28px;font-size:15px;font-weight:600;cursor:pointer}
@media(max-width:420px){.kongling-drum-container{width:300px;height:300px}.kongling-tongue{width:60px;height:60px}.kongling-tongue .kongling-note-name{font-size:12px}.kongling-tongue .kongling-key-hint{font-size:9px}.kongling-top-bar{gap:5px;padding:6px 8px}.kongling-top-bar select,.kongling-top-bar button{font-size:11px;padding:4px 7px}}
@media(max-height:600px){.kongling-drum-container{width:280px;height:280px}.kongling-tongue{width:54px;height:54px}}
@media(orientation:landscape){.kongling-drum-container{width:320px;height:320px}.kongling-tongue{width:64px;height:64px}.kongling-score-note{min-width:32px;height:32px;font-size:11px}}
`;

const HTML_TEMPLATE = `
<div class="kongling-top-bar">
    <label>音阶</label>
    <select class="kongling-scale-select">
        <option value="D">D 大调</option>
        <option value="C">C 五声</option>
        <option value="G">G 大调</option>
    </select>
    <label>配色</label>
    <select class="kongling-theme-select">
        <option value="gold">金色</option>
        <option value="silver">银色</option>
        <option value="copper">铜色</option>
    </select>
    <button class="kongling-score-toggle">📖 曲谱</button>
    <select class="kongling-song-select" style="display:none">
        <option value="twinkle">小星星</option>
        <option value="ode">欢乐颂</option>
        <option value="birthday">生日快乐</option>
        <option value="sea">沧海一声笑</option>
        <option value="bigfish">大鱼</option>
    </select>
    <button class="kongling-restart-btn" style="display:none">↺ 重来</button>
</div>
<div class="kongling-score-bar kongling-score-bar-el">
    <div class="kongling-score-track kongling-score-track-el"></div>
</div>
<div class="kongling-progress-bar kongling-progress-bar-el">
    <div class="kongling-progress-fill kongling-progress-fill-el"></div></div>
<div class="kongling-drum-area">
    <div class="kongling-drum-container kongling-drum-container-el">
        <div class="kongling-drum-face kongling-drum-face-el"></div>
    </div>
</div>
<div class="kongling-combo-display kongling-combo-display-el"></div>
<div class="kongling-status-bar">
    <span class="kongling-status-msg kongling-status-msg-el">按下鼓舌或键盘 A S D F J K L ; 演奏 · 空格止音</span>
</div>
<div class="kongling-finish-overlay kongling-finish-overlay-el">
    <div class="kongling-finish-box">
        <div class="kongling-emoji">🎉</div>
        <h2>演奏完成！</h2>
        <p class="kongling-finish-text-el">太棒了！</p>
        <button class="kongling-reset-btn">再来一次</button>
    </div>
</div>
`;

// ── Constants ──
const SCALES = {
    D: { name:'D 大调', notes:['D4','E4','F#4','A4','B4','D5','E5','F#5'], freqs:[293.66,329.63,369.99,440.00,493.88,587.33,659.25,739.99] },
    C: { name:'C 五声', notes:['C4','D4','E4','G4','A4','C5','D5','E5'], freqs:[261.63,293.66,329.63,392.00,440.00,523.25,587.33,659.25] },
    G: { name:'G 大调', notes:['G3','A3','B3','D4','E4','G4','A4','B4'], freqs:[196.00,220.00,246.94,293.66,329.63,392.00,440.00,493.88] }
};
const KEY_MAP = ['a','s','d','f','j','k','l',';'];
const TONGUE_POSITIONS = [
    {left:35,top:78},{left:65,top:78},{left:22,top:56},{left:78,top:56},{left:50,top:54},
    {left:30,top:33},{left:70,top:33},{left:50,top:15}
];
const SONGS = {
    twinkle: { name:'小星星', degrees:[1,1,5,5,6,6,5,4,4,3,3,2,2,1,5,5,4,4,3,3,2,5,5,4,4,3,3,2,1,1,5,5,6,6,5,4,4,3,3,2,2,1] },
    ode: { name:'欢乐颂', degrees:[3,3,4,5,5,4,3,2,1,1,2,3,3,2,2,3,3,4,5,5,4,3,2,1,1,2,3,2,1,1] },
    birthday: { name:'生日快乐', degrees:[1,1,2,1,4,3,1,1,2,1,5,4,1,1,8,6,4,3,2,7,7,6,4,5,4] },
    sea: { name:'沧海一声笑', degrees:[8,6,5,3,1,1,3,5,6,8,8,6,5,3,5,3,2,1,3,2,1] },
    bigfish: { name:'大鱼', degrees:[3,4,5,6,5,3,2,3,4,5,3,6,5,3,2,1,2,3,5,3,2,1] }
};

// ── State ──
let _container = null;
let currentScale = 'D';
const MAX_VOICES = 12;
let activeVoices = [];
let tongueEls = [];
let scoreMode = false, currentSong = null, songIndex = 0, combo = 0, comboTimer = null;
let _keyDownHandler = null, _keyUpHandler = null;
const keyDown = {};

function playNote(index) {
    AudioEngine.getContext();
    const { dry, wet, convolver } = AudioEngine.getReverb('metal');
    const audioCtx = AudioEngine.getContext();
    const freq = SCALES[currentScale].freqs[index]; const now = audioCtx.currentTime;
    const output = audioCtx.createGain(); output.gain.setValueAtTime(1, now);
    output.connect(dry); output.connect(convolver);
    const osc1 = audioCtx.createOscillator(); osc1.type='sine'; osc1.frequency.value=freq;
    const gain1 = audioCtx.createGain();
    gain1.gain.setValueAtTime(0,now); gain1.gain.linearRampToValueAtTime(0.35,now+0.005); gain1.gain.exponentialRampToValueAtTime(0.001,now+3);
    osc1.connect(gain1); gain1.connect(output); osc1.start(now); osc1.stop(now+3.1);
    const osc2 = audioCtx.createOscillator(); osc2.type='sine'; osc2.frequency.value=freq*2;
    const gain2 = audioCtx.createGain();
    gain2.gain.setValueAtTime(0,now); gain2.gain.linearRampToValueAtTime(0.08,now+0.005); gain2.gain.exponentialRampToValueAtTime(0.001,now+1.5);
    osc2.connect(gain2); gain2.connect(output); osc2.start(now); osc2.stop(now+1.6);
    const voice = {output,time:now}; activeVoices.push(voice);
    if (activeVoices.length > MAX_VOICES) { const old = activeVoices.shift(); try{old.output.disconnect();}catch(e){} }
    setTimeout(() => { const idx = activeVoices.indexOf(voice); if(idx!==-1)activeVoices.splice(idx,1); try{output.disconnect();}catch(e){} }, 3200);
}

function muteAll() {
    const audioCtx = AudioEngine.getContext();
    const now = audioCtx.currentTime;
    activeVoices.forEach(v => { try{v.output.gain.cancelScheduledValues(now);v.output.gain.setValueAtTime(v.output.gain.value,now);v.output.gain.linearRampToValueAtTime(0,now+0.08);}catch(e){} });
    activeVoices = [];
    const msg = _container.querySelector('.kongling-status-msg-el');
    msg.textContent = '🤚 止音'; msg.className = 'kongling-status-msg';
    setTimeout(() => { if(msg.textContent==='🤚 止音'){msg.textContent=scoreMode?'跟着提示弹奏':'按下鼓舌或键盘演奏';msg.className='kongling-status-msg';} }, 800);
}

function buildTongues() {
    const drumFace = _container.querySelector('.kongling-drum-face-el');
    drumFace.innerHTML = ''; tongueEls = [];
    const scale = SCALES[currentScale];
    for (let i = 0; i < 8; i++) {
        const el = document.createElement('div'); el.className = 'kongling-tongue';
        el.style.left = TONGUE_POSITIONS[i].left + '%'; el.style.top = TONGUE_POSITIONS[i].top + '%';
        el.innerHTML = `<span class="kongling-star-hint">✨</span><span class="kongling-note-name">${scale.notes[i]}</span><span class="kongling-key-hint">${KEY_MAP[i].toUpperCase()}</span>`;
        el.dataset.index = i;
        el.addEventListener('pointerdown', e => { e.preventDefault(); hitTongue(i, e); });
        drumFace.appendChild(el); tongueEls.push(el);
    }
}

function hitTongue(index, event) {
    playNote(index); animateHit(index); createRipple(index, event);
    if (scoreMode && currentSong) checkScore(index);
    else { const msg = _container.querySelector('.kongling-status-msg-el'); msg.textContent = `🎵 ${SCALES[currentScale].notes[index]}`; msg.className = 'kongling-status-msg'; }
}

function animateHit(index) { const el = tongueEls[index]; el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 150); }

function createRipple(index, event) {
    const pos = TONGUE_POSITIONS[index]; let left = pos.left+'%', top = pos.top+'%';
    if (event && event.clientX) {
        const faceRect = _container.querySelector('.kongling-drum-face-el').getBoundingClientRect();
        left = ((event.clientX-faceRect.left)/faceRect.width*100)+'%';
        top = ((event.clientY-faceRect.top)/faceRect.height*100)+'%';
    }
    const ripple = document.createElement('div'); ripple.className = 'kongling-ripple';
    ripple.style.left = left; ripple.style.top = top;
    _container.querySelector('.kongling-drum-face-el').appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
}

// ── Score ──
function toggleScoreMode() {
    scoreMode = !scoreMode;
    _container.querySelector('.kongling-score-toggle').classList.toggle('active', scoreMode);
    _container.querySelector('.kongling-song-select').style.display = scoreMode ? '' : 'none';
    _container.querySelector('.kongling-restart-btn').style.display = scoreMode ? '' : 'none';
    _container.querySelector('.kongling-score-bar-el').classList.toggle('visible', scoreMode);
    _container.querySelector('.kongling-progress-bar-el').classList.toggle('visible', scoreMode);
    if (scoreMode) loadSong(_container.querySelector('.kongling-song-select').value);
    else { clearScore(); _container.querySelector('.kongling-status-msg-el').textContent = '按下鼓舌或键盘 A S D F J K L ; 演奏'; }
}

function loadSong(songId) {
    const song = SONGS[songId]; if (!song) return;
    currentSong = { ...song, id: songId }; songIndex = 0; combo = 0; hideCombo();
    renderScore(); highlightNextTongue();
    const msg = _container.querySelector('.kongling-status-msg-el');
    msg.textContent = `🎵 ${song.name} — 跟着提示弹奏`; msg.className = 'kongling-status-msg';
}

function renderScore() {
    const track = _container.querySelector('.kongling-score-track-el'); track.innerHTML = '';
    const scale = SCALES[currentScale];
    currentSong.degrees.forEach((deg, i) => {
        const noteEl = document.createElement('div'); noteEl.className = 'kongling-score-note';
        noteEl.innerHTML = `<span>${scale.notes[deg-1]}</span><span style="font-size:9px;opacity:.5;margin-top:1px">${deg}</span>`;
        noteEl.dataset.idx = i; track.appendChild(noteEl);
    });
    updateScoreScroll(); updateProgress();
}

function updateScoreScroll() {
    const noteWidth = 44; const offset = -songIndex * noteWidth;
    _container.querySelector('.kongling-score-track-el').style.transform = `translateX(${offset}px)`;
    const notes = _container.querySelector('.kongling-score-track-el').children;
    for (let i = 0; i < notes.length; i++) notes[i].classList.remove('current');
    if (notes[songIndex]) notes[songIndex].classList.add('current');
}

function updateProgress() {
    if (!currentSong) return;
    _container.querySelector('.kongling-progress-fill-el').style.width = (songIndex / currentSong.degrees.length * 100) + '%';
}

function highlightNextTongue() {
    tongueEls.forEach(el => el.querySelector('.kongling-star-hint').classList.remove('visible'));
    if (!currentSong || songIndex >= currentSong.degrees.length) return;
    tongueEls[currentSong.degrees[songIndex]-1].querySelector('.kongling-star-hint').classList.add('visible');
}

function checkScore(playedIndex) {
    if (!currentSong || songIndex >= currentSong.degrees.length) return;
    const expectedDeg = currentSong.degrees[songIndex]; const expectedIdx = expectedDeg - 1;
    const msg = _container.querySelector('.kongling-status-msg-el');
    if (playedIndex === expectedIdx) {
        combo++;
        const noteEl = _container.querySelector('.kongling-score-track-el').children[songIndex];
        if (noteEl) noteEl.classList.add('played');
        spawnStarParticles(playedIndex);
        if (combo >= 3) showCombo(combo);
        songIndex++; updateScoreScroll(); updateProgress(); highlightNextTongue();
        msg.textContent = combo >= 3 ? `✨×${combo} 连击！` : '✓ 正确'; msg.className = 'kongling-status-msg success';
        if (songIndex >= currentSong.degrees.length) songFinished();
    } else {
        combo = 0; hideCombo(); const scale = SCALES[currentScale];
        msg.textContent = `✗ 应弹 ${scale.notes[expectedIdx]}`; msg.className = 'kongling-status-msg error';
        const noteEl = _container.querySelector('.kongling-score-track-el').children[songIndex];
        if (noteEl) { noteEl.classList.add('missed'); setTimeout(() => noteEl.classList.remove('missed'), 600); }
        tongueEls[playedIndex].classList.add('wrong'); setTimeout(() => tongueEls[playedIndex].classList.remove('wrong'), 400);
        const starEl = tongueEls[expectedIdx].querySelector('.kongling-star-hint');
        starEl.style.animation = 'none'; starEl.offsetHeight; starEl.style.animation = 'kongling-starFlash .5s ease 2';
    }
}

function spawnStarParticles(index) {
    const el = tongueEls[index]; const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div'); star.className = 'kongling-star-particle'; star.textContent = '✨';
        const angle = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 60;
        star.style.left = cx + 'px'; star.style.top = cy + 'px';
        star.style.setProperty('--dx', Math.cos(angle)*dist+'px');
        star.style.setProperty('--dy', Math.sin(angle)*dist+'px');
        document.body.appendChild(star); setTimeout(() => star.remove(), 700);
    }
}

function showCombo(n) {
    const el = _container.querySelector('.kongling-combo-display-el'); el.textContent = `✨×${n}`;
    el.classList.add('show'); clearTimeout(comboTimer); comboTimer = setTimeout(() => el.classList.remove('show'), 1000);
}
function hideCombo() { _container.querySelector('.kongling-combo-display-el').classList.remove('show'); }

function songFinished() {
    highlightNextTongue();
    _container.querySelector('.kongling-finish-text-el').textContent = combo >= 10 ? '太棒了！完美演奏！🌟' : '演奏完成，继续加油！';
    _container.querySelector('.kongling-finish-overlay-el').classList.add('show');
}

function resetSong() {
    _container.querySelector('.kongling-finish-overlay-el').classList.remove('show');
    if (currentSong) loadSong(currentSong.id);
}

function clearScore() {
    _container.querySelector('.kongling-score-track-el').innerHTML = '';
    _container.querySelector('.kongling-progress-fill-el').style.width = '0%';
    currentSong = null; songIndex = 0; combo = 0; hideCombo();
    tongueEls.forEach(el => el.querySelector('.kongling-star-hint').classList.remove('visible'));
}

// ── init ──
function init(container) {
    _container = container;

    const styleEl = document.createElement('style'); styleEl.textContent = CSS; container.appendChild(styleEl);
    const wrapper = document.createElement('div'); wrapper.className = 'kongling-app';
    wrapper.innerHTML = HTML_TEMPLATE; container.appendChild(wrapper);

    // Keyboard handlers
    _keyDownHandler = (e) => {
        if (keyDown[e.key]) return; keyDown[e.key] = true;
        if (e.key === ' ') { e.preventDefault(); muteAll(); return; }
        const idx = KEY_MAP.indexOf(e.key.toLowerCase());
        if (idx !== -1) { e.preventDefault(); hitTongue(idx, null); }
    };
    _keyUpHandler = (e) => { keyDown[e.key] = false; };

    // Control events
    _container.querySelector('.kongling-scale-select').addEventListener('change', () => {
        currentScale = _container.querySelector('.kongling-scale-select').value;
        buildTongues();
        if (scoreMode && currentSong) {
            const si = songIndex, co = combo; loadSong(currentSong.id); songIndex = si; combo = co;
            const notes = _container.querySelector('.kongling-score-track-el').children;
            for (let i = 0; i < si && i < notes.length; i++) notes[i].classList.add('played');
            updateScoreScroll(); updateProgress(); highlightNextTongue();
        }
    });

    _container.querySelector('.kongling-theme-select').addEventListener('change', () => {
        const appEl = _container.querySelector('.kongling-app');
        appEl.classList.remove('theme-silver', 'theme-copper');
        const val = _container.querySelector('.kongling-theme-select').value;
        if (val === 'silver') appEl.classList.add('theme-silver');
        if (val === 'copper') appEl.classList.add('theme-copper');
    });

    _container.querySelector('.kongling-score-toggle').addEventListener('click', toggleScoreMode);
    _container.querySelector('.kongling-song-select').addEventListener('change', () => { if (scoreMode) loadSong(_container.querySelector('.kongling-song-select').value); });
    _container.querySelector('.kongling-restart-btn').addEventListener('click', () => { if (currentSong) loadSong(currentSong.id); });
    _container.querySelector('.kongling-reset-btn').addEventListener('click', resetSong);

    container.addEventListener('touchstart', () => AudioEngine.getContext(), { once: true });
    container.addEventListener('click', () => AudioEngine.getContext(), { once: true });

    requestAnimationFrame(() => buildTongues());

    return {
        attachKeyboard() { document.addEventListener('keydown', _keyDownHandler); document.addEventListener('keyup', _keyUpHandler); },
        detachKeyboard() { document.removeEventListener('keydown', _keyDownHandler); document.removeEventListener('keyup', _keyUpHandler); },
        destroy() {
            this.detachKeyboard();
            // 清理音频节点（但不关闭共享的 AudioContext）
            activeVoices.forEach(v => { try{v.output.disconnect();}catch(e){} });
            activeVoices = [];
        }
    };
}

return { init };
})();

window.KonglingApp = KonglingApp;
