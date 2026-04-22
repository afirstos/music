// app-songbo.js — Songbo (Singing Bowl) module for Music Hub
// Uses shared AudioEngine for audio context

const SongboApp = (function() {

const CSS = `
.songbo-app{position:relative;display:flex;flex-direction:column;height:100%;overflow:hidden;--bowl-outer:#8b5e3c;--bowl-mid:#b8860b;--bowl-inner:#cd9934;--bowl-highlight:#daa520;--bowl-rim:#e8c56d;--bowl-shadow:rgba(139,94,60,.6);--bg-primary:#1a1212;--bg-secondary:#2a1f1f;--text-primary:#e8d5b7;--text-secondary:#a08060;--accent:#daa520;--particle-color:rgba(218,165,32,.3)}
.songbo-app[data-theme="gold"]{--bowl-outer:#b8960b;--bowl-mid:#d4af37;--bowl-inner:#f0d060;--bowl-highlight:#ffe680;--bowl-rim:#fff4b0;--bowl-shadow:rgba(212,175,55,.6);--accent:#f0d060;--particle-color:rgba(240,208,96,.3)}
.songbo-app[data-theme="dark"]{--bowl-outer:#2a2a3a;--bowl-mid:#3a3a5a;--bowl-inner:#4a4a6a;--bowl-highlight:#6a6a9a;--bowl-rim:#8080c0;--bowl-shadow:rgba(80,80,160,.6);--bg-primary:#0a0a14;--bg-secondary:#14142a;--text-primary:#b0b0e0;--text-secondary:#6060a0;--accent:#8080c0;--particle-color:rgba(100,100,200,.3)}
.songbo-particles{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.songbo-particle{position:absolute;border-radius:50%;background:var(--particle-color);filter:blur(2px);animation:songbo-float-particle linear infinite}
@keyframes songbo-float-particle{0%{transform:translateY(100vh) translateX(0) scale(.5);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-10vh) translateX(var(--drift)) scale(1.2);opacity:0}}
.songbo-controls{position:relative;z-index:10;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px 6px;flex-wrap:wrap}
.songbo-controls select,.songbo-controls button{background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--text-secondary);border-radius:8px;padding:5px 10px;font-size:13px;cursor:pointer;transition:all .2s}
.songbo-controls select:hover,.songbo-controls button:hover{border-color:var(--accent);background:rgba(218,165,32,.1)}
.songbo-controls button.active{background:var(--accent);color:var(--bg-primary);border-color:var(--accent)}
.songbo-score-panel{position:relative;z-index:10;max-height:0;overflow:hidden;transition:max-height .4s ease;display:flex;flex-direction:column;align-items:center}
.songbo-score-panel.open{max-height:180px}
.songbo-score-bar{display:flex;align-items:center;gap:6px;padding:6px 12px;flex-wrap:wrap}
.songbo-score-bar select,.songbo-score-bar button{background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--text-secondary);border-radius:8px;padding:4px 8px;font-size:12px;cursor:pointer}
.songbo-score-display{display:flex;gap:4px;padding:4px 12px;flex-wrap:wrap;justify-content:center;max-width:600px}
.songbo-score-note{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:bold;background:var(--bg-secondary);border:1.5px solid var(--text-secondary);transition:all .3s;flex-shrink:0}
.songbo-score-note.played{opacity:.35;border-color:transparent}
.songbo-score-note.current{background:var(--accent);color:var(--bg-primary);border-color:var(--accent);transform:scale(1.2);box-shadow:0 0 12px var(--accent)}
.songbo-score-note.wrong{animation:songbo-shake-note .4s ease}
@keyframes songbo-shake-note{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.songbo-score-progress{width:min(400px,80vw);height:4px;background:var(--bg-secondary);border-radius:2px;margin:4px 0 6px;overflow:hidden}
.songbo-score-progress-fill{height:100%;background:var(--accent);transition:width .3s;border-radius:2px}
.songbo-combo-display{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:36px;font-weight:bold;color:var(--accent);pointer-events:none;z-index:100;opacity:0;text-shadow:0 0 20px var(--accent);transition:opacity .3s}
.songbo-combo-display.show{opacity:1;animation:songbo-combo-pop .6s ease}
@keyframes songbo-combo-pop{0%{transform:translate(-50%,-50%) scale(.5)}50%{transform:translate(-50%,-50%) scale(1.3)}100%{transform:translate(-50%,-50%) scale(1)}}
.songbo-completion-overlay{position:absolute;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);opacity:0;pointer-events:none;transition:opacity .4s}
.songbo-completion-overlay.show{opacity:1;pointer-events:auto}
.songbo-completion-box{background:var(--bg-secondary);border:2px solid var(--accent);border-radius:20px;padding:30px 40px;text-align:center;transform:scale(.8);transition:transform .4s}
.songbo-completion-overlay.show .songbo-completion-box{transform:scale(1)}
.songbo-completion-box .songbo-emoji{font-size:48px;margin-bottom:10px}
.songbo-completion-box h2{color:var(--accent);margin-bottom:6px}
.songbo-completion-box p{color:var(--text-secondary);font-size:14px;margin-bottom:16px}
.songbo-completion-box button{background:var(--accent);color:var(--bg-primary);border:none;border-radius:10px;padding:8px 24px;font-size:15px;cursor:pointer}
.songbo-bowl-stage{position:relative;z-index:5;flex:1;display:flex;align-items:center;justify-content:center}
.songbo-bowl-container{position:relative;width:340px;height:340px}
.songbo-bowl{position:absolute;border-radius:50%;cursor:pointer;touch-action:none;display:flex;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(ellipse at 35% 30%,var(--bowl-rim) 0%,var(--bowl-highlight) 15%,var(--bowl-inner) 35%,var(--bowl-mid) 60%,var(--bowl-outer) 85%,rgba(0,0,0,.4) 100%);box-shadow:inset 0 -4px 12px rgba(0,0,0,.5),inset 0 2px 6px rgba(255,255,255,.15),0 4px 16px var(--bowl-shadow),0 0 0 2px rgba(0,0,0,.3);transition:transform .15s ease,box-shadow .3s;-webkit-tap-highlight-color:transparent}
.songbo-bowl::before{content:'';position:absolute;inset:15%;border-radius:50%;background:radial-gradient(ellipse at 40% 35%,transparent 30%,rgba(0,0,0,.08) 50%,transparent 52%,rgba(0,0,0,.05) 70%,transparent 72%,rgba(0,0,0,.04) 88%,transparent 90%);pointer-events:none}
.songbo-bowl .songbo-label{font-size:13px;font-weight:700;color:rgba(26,18,18,.8);text-shadow:0 1px 1px rgba(255,255,255,.2);z-index:2;line-height:1.1;text-align:center}
.songbo-bowl .songbo-label small{font-size:10px;font-weight:400;opacity:.7;display:block}
.songbo-bowl .songbo-hint{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:20px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:3;filter:drop-shadow(0 0 6px var(--accent))}
.songbo-bowl .songbo-hint.show{opacity:1;animation:songbo-hint-pulse 1s ease infinite}
@keyframes songbo-hint-pulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.15)}}
.songbo-bowl .songbo-hint.correct{animation:songbo-hint-correct .5s ease forwards}
@keyframes songbo-hint-correct{0%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(2)}}
.songbo-bowl .songbo-hint.blink{animation:songbo-hint-blink .3s ease 3}
@keyframes songbo-hint-blink{0%,100%{opacity:1}50%{opacity:.2}}
.songbo-bowl .songbo-ripple{position:absolute;inset:0;border-radius:50%;border:2px solid var(--bowl-rim);opacity:0;pointer-events:none;z-index:1;animation:songbo-ripple-out 1.2s ease-out forwards}
@keyframes songbo-ripple-out{0%{transform:scale(.7);opacity:.7}100%{transform:scale(1.8);opacity:0}}
.songbo-bowl.strike{animation:songbo-bowl-strike .3s ease}
@keyframes songbo-bowl-strike{0%{transform:scale(1)}30%{transform:scale(.93)}60%{transform:scale(1.03)}100%{transform:scale(1)}}
.songbo-bowl.glow{box-shadow:inset 0 -4px 12px rgba(0,0,0,.5),inset 0 2px 6px rgba(255,255,255,.15),0 4px 16px var(--bowl-shadow),0 0 30px var(--accent),0 0 60px rgba(218,165,32,.3)}
.songbo-bowl .songbo-rub-ring{position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:var(--bowl-rim);border-right-color:var(--accent);opacity:0;pointer-events:none;z-index:4;transition:opacity .4s}
.songbo-bowl.rubbing .songbo-rub-ring{opacity:1;animation:songbo-rub-rotate 1.2s linear infinite}
@keyframes songbo-rub-rotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.songbo-bowl.rubbing::after{content:'';position:absolute;inset:20%;border-radius:50%;background:radial-gradient(circle,rgba(218,165,32,.2) 0%,transparent 70%);animation:songbo-inner-glow 2s ease-in-out infinite alternate;pointer-events:none}
@keyframes songbo-inner-glow{0%{opacity:.4}100%{opacity:.8}}
.songbo-bowl.wrong-shake{animation:songbo-shake-bowl .4s ease}
@keyframes songbo-shake-bowl{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,0)}40%{transform:translate(5px,0)}60%{transform:translate(-3px,0)}80%{transform:translate(3px,0)}}
.songbo-footer{position:relative;z-index:10;text-align:center;padding:6px;font-size:11px;color:var(--text-secondary)}
@media(max-width:420px){.songbo-bowl-container{width:280px;height:280px}.songbo-controls{gap:5px;padding:8px 8px 4px}.songbo-controls select,.songbo-controls button{font-size:11px;padding:4px 7px}}
@media(max-height:600px){.songbo-bowl-container{width:250px;height:250px}.songbo-controls{padding:4px 8px 2px}.songbo-score-panel.open{max-height:120px}}
@media(min-width:768px){.songbo-bowl-container{width:420px;height:420px}}
@media(orientation:landscape){.songbo-bowl-container{width:300px;height:300px}}
`;

const HTML_TEMPLATE = `
<div class="songbo-particles songbo-particles-el"></div>
<div class="songbo-controls">
    <select class="songbo-scale-select" title="音阶选择">
        <option value="chakra">🕉️ 脉轮音阶</option>
        <option value="highC">🎵 C大调高八度</option>
        <option value="penta">🧘 冥想五声</option>
    </select>
    <select class="songbo-theme-select" title="配色">
        <option value="copper">🟤 铜钵</option>
        <option value="gold">🟡 金钵</option>
        <option value="dark">🔵 黑钵</option>
    </select>
    <button class="songbo-score-toggle" title="曲谱模式">📖 曲谱</button>
    <button class="songbo-mute-btn" title="止音 (空格)">🔇 止音</button>
</div>
<div class="songbo-score-panel songbo-score-panel-el">
    <div class="songbo-score-bar">
        <select class="songbo-song-select">
            <!-- 动态生成 by ScoreController.populateSongSelect() -->
        </select>
        <button class="songbo-restart-btn">↺ 重来</button>
    </div>
    <div class="songbo-score-display songbo-score-display-el"></div>
    <div class="songbo-score-progress"><div class="songbo-score-progress-fill songbo-progress-fill-el"></div></div>
</div>
<div class="songbo-bowl-stage">
    <div class="songbo-bowl-container songbo-bowl-container-el"></div>
</div>
<div class="songbo-footer">短按敲击 · 长按磨钵 · 空格止音 · 键盘 A S D F J K L</div>
<div class="songbo-combo-display songbo-combo-display-el"></div>
<div class="songbo-completion-overlay songbo-completion-overlay-el">
    <div class="songbo-completion-box">
        <div class="songbo-emoji">🎉</div>
        <h2>演奏完成！</h2>
        <p class="songbo-completion-msg-el">宁静的旋律，美妙的冥想。</p>
        <button class="songbo-continue-btn">🕉️ 继续冥想</button>
    </div>
</div>
`;

// ── Constants ──
const SCALES = {
    chakra: [{note:'C3',freq:130.81},{note:'D3',freq:146.83},{note:'E3',freq:164.81},{note:'F3',freq:174.61},{note:'G3',freq:196.00},{note:'A3',freq:220.00},{note:'B3',freq:246.94}],
    highC: [{note:'C4',freq:261.63},{note:'D4',freq:293.66},{note:'E4',freq:329.63},{note:'F4',freq:349.23},{note:'G4',freq:392.00},{note:'A4',freq:440.00},{note:'B4',freq:493.88}],
    penta: [{note:'C3',freq:130.81},{note:'D3',freq:146.83},{note:'F3',freq:174.61},{note:'G3',freq:196.00},{note:'A3',freq:220.00},{note:'C4',freq:261.63},{note:'D4',freq:293.66}]
};

const SONGS = MusicSongs.songs;

const KEY_MAP = {a:0,s:1,d:2,f:3,j:4,k:5,l:6};

// ── State ──
let _container = null;
let _subGain = null;
let _savedSubVolume = 1.0;
let currentScale = 'chakra';
let voices = [], rubVoices = new Map();
const MAX_VOICES = 10;
let comboTimer = null;
let pointerDownTime = {}, pointerTimers = {}, keyDownState = {};
let _keyDownHandler = null, _keyUpHandler = null;
let _resizeHandler = null;
let _timers = [];
var _sc = null;

function getScaleNoteNames() {
    return SCALES[currentScale].map(function (item) { return item.note; });
}

function _populateSongSelect() {
    var sel = _container.querySelector('.songbo-song-select');
    ScoreController.populateSongSelect(sel, getScaleNoteNames(), { fitFilter: 'piano', currentValue: _sc ? _sc.getCurrentSongId() : null });
}

function getBowlSize(i) { return 110 - (i * 40 / 6); }
function getBowlPosition(i, containerSize) {
    const cx = containerSize / 2, cy = containerSize / 2, size = getBowlSize(i);
    if (i === 0) return { x: cx - size/2, y: cy - size/2 };
    const angle = (-90 + (i - 1) * 60) * Math.PI / 180;
    const radius = containerSize * 0.33;
    return { x: cx + radius * Math.cos(angle) - size/2, y: cy + radius * Math.sin(angle) - size/2 };
}

function getReverbNodes() {
    // 使用 AudioEngine 的高质量金属腔体混响
    const { dry, wet, convolver } = AudioEngine.getReverb('metal');
    return { dryGain: dry, wetGain: wet, convolver, subGain: _subGain };
}

function playStrike(freq) {
    AudioEngine.getContext();
    const { dryGain, convolver, subGain } = getReverbNodes();
    const audioCtx = AudioEngine.getContext();
    const now = audioCtx.currentTime;
    if (voices.length >= MAX_VOICES) { const old = voices.shift(); old.forEach(n => { try{n.stop(now+0.05);}catch(e){} }); }
    const nodes = [];
    const osc1 = audioCtx.createOscillator(); osc1.type='sine'; osc1.frequency.value=freq;
    const gain1 = audioCtx.createGain();
    gain1.gain.setValueAtTime(0,now); gain1.gain.linearRampToValueAtTime(0.3,now+0.003);
    gain1.gain.linearRampToValueAtTime(0.4,now+0.15); gain1.gain.linearRampToValueAtTime(0.35,now+0.3);
    gain1.gain.exponentialRampToValueAtTime(0.001,now+10);
    const lfo1 = audioCtx.createOscillator(); lfo1.frequency.value=5.5+Math.random()*1.5;
    const lfoGain1 = audioCtx.createGain(); lfoGain1.gain.value=2;
    lfo1.connect(lfoGain1); lfoGain1.connect(osc1.frequency); lfo1.start(now);
    osc1.connect(gain1); gain1.connect(subGain); osc1.start(now); osc1.stop(now+10.5); lfo1.stop(now+10.5);
    nodes.push(osc1,lfo1);

    const osc2 = audioCtx.createOscillator(); osc2.type='sine'; osc2.frequency.value=freq*2;
    const gain2 = audioCtx.createGain(); gain2.gain.setValueAtTime(0,now); gain2.gain.linearRampToValueAtTime(0.2,now+0.003);
    gain2.gain.exponentialRampToValueAtTime(0.001,now+7);
    osc2.connect(gain2); gain2.connect(subGain); osc2.start(now); osc2.stop(now+7.5); nodes.push(osc2);

    const osc3 = audioCtx.createOscillator(); osc3.type='sine'; osc3.frequency.value=freq*3;
    const gain3 = audioCtx.createGain(); gain3.gain.setValueAtTime(0,now); gain3.gain.linearRampToValueAtTime(0.08,now+0.003);
    gain3.gain.exponentialRampToValueAtTime(0.001,now+4);
    osc3.connect(gain3); gain3.connect(subGain); osc3.start(now); osc3.stop(now+4.5); nodes.push(osc3);

    voices.push(nodes);
    const tid = setTimeout(() => { const idx = voices.indexOf(nodes); if (idx > -1) voices.splice(idx, 1); }, 11000);
    _timers.push(tid);
}

function startRub(bowlIndex, freq) {
    AudioEngine.getContext();
    const { subGain } = getReverbNodes();
    const audioCtx = AudioEngine.getContext();
    if (rubVoices.has(bowlIndex)) return;
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator(); osc1.type='sine'; osc1.frequency.value=freq;
    const gain1 = audioCtx.createGain(); gain1.gain.setValueAtTime(0,now); gain1.gain.linearRampToValueAtTime(0.3,now+1.5);
    const lfo = audioCtx.createOscillator(); lfo.frequency.value=5+Math.random()*2;
    const lfoGain = audioCtx.createGain(); lfoGain.gain.value=4;
    lfo.connect(lfoGain); lfoGain.connect(osc1.frequency); lfo.start(now);
    osc1.connect(gain1); gain1.connect(subGain); osc1.start(now);
    const osc2 = audioCtx.createOscillator(); osc2.type='sine'; osc2.frequency.value=freq*2;
    const gain2 = audioCtx.createGain(); gain2.gain.setValueAtTime(0,now); gain2.gain.linearRampToValueAtTime(0.12,now+1.5);
    osc2.connect(gain2); gain2.connect(subGain); osc2.start(now);
    rubVoices.set(bowlIndex, {osc1,osc2,lfo,gain1,gain2});
}

function stopRub(bowlIndex) {
    const v = rubVoices.get(bowlIndex); if (!v) return;
    const audioCtx = AudioEngine.getContext();
    const now = audioCtx.currentTime;
    v.gain1.gain.cancelScheduledValues(now); v.gain1.gain.setValueAtTime(v.gain1.gain.value,now); v.gain1.gain.linearRampToValueAtTime(0,now+2);
    v.gain2.gain.cancelScheduledValues(now); v.gain2.gain.setValueAtTime(v.gain2.gain.value,now); v.gain2.gain.linearRampToValueAtTime(0,now+2);
    const tid = setTimeout(() => { try{v.osc1.stop();}catch(e){} try{v.osc2.stop();}catch(e){} try{v.lfo.stop();}catch(e){} }, 2200);
    _timers.push(tid);
    rubVoices.delete(bowlIndex);
}

function muteAll() {
    if (!_subGain) return;
    const audioCtx = AudioEngine.getContext();
    const now = audioCtx.currentTime;
    _savedSubVolume = _subGain.gain.value;
    _subGain.gain.cancelScheduledValues(now); _subGain.gain.setValueAtTime(_savedSubVolume,now); _subGain.gain.linearRampToValueAtTime(0,now+0.5);
    for (const [idx] of rubVoices) { const bowl = _container.querySelectorAll('.songbo-bowl')[idx]; if(bowl) bowl.classList.remove('rubbing'); }
    rubVoices.clear();
    const tid = setTimeout(() => {
        voices.forEach(nodes => nodes.forEach(n => { try{n.stop();}catch(e){} })); voices = [];
        if(_subGain){_subGain.gain.cancelScheduledValues(audioCtx.currentTime);_subGain.gain.setValueAtTime(_savedSubVolume,audioCtx.currentTime);}
    }, 600);
    _timers.push(tid);
}

function renderBowls() {
    const container = _container.querySelector('.songbo-bowl-container-el');
    const containerSize = container.offsetWidth;
    if (containerSize === 0) return;
    container.innerHTML = '';
    const scale = SCALES[currentScale]; const keys = ['A','S','D','F','J','K','L'];
    scale.forEach((item, i) => {
        const size = getBowlSize(i) * (containerSize / 340);
        const pos = getBowlPosition(i, containerSize);
        const bowl = document.createElement('div'); bowl.className = 'songbo-bowl'; bowl.dataset.index = i;
        bowl.style.cssText = `width:${size}px;height:${size}px;left:${pos.x}px;top:${pos.y}px`;
        bowl.innerHTML = `<div class="songbo-label">${item.note}<small>${keys[i]}</small></div><div class="songbo-hint">🕉️</div><div class="songbo-rub-ring"></div>`;
        bowl.addEventListener('pointerdown', e => { onBowlDown(i, bowl); });
        bowl.addEventListener('pointerup', e => { onBowlUp(i, bowl); });
        bowl.addEventListener('pointerleave', () => onBowlUp(i, bowl));
        bowl.addEventListener('pointercancel', () => onBowlUp(i, bowl));
        container.appendChild(bowl);
    });
    updateScoreHints();
}

function onBowlDown(index, bowlEl) {
    AudioEngine.getContext();
    pointerDownTime[index] = Date.now();
    pointerTimers[index] = setTimeout(() => { startRub(index, SCALES[currentScale][index].freq); bowlEl.classList.add('rubbing'); }, 300);
}

function onBowlUp(index, bowlEl) {
    const downTime = pointerDownTime[index]; if (!downTime) return;
    const elapsed = Date.now() - downTime; delete pointerDownTime[index];
    clearTimeout(pointerTimers[index]); delete pointerTimers[index];
    if (elapsed < 300) triggerStrike(index, bowlEl);
    else { stopRub(index); bowlEl.classList.remove('rubbing'); }
}

function triggerStrike(index, bowlEl) {
    playStrike(SCALES[currentScale][index].freq);
    bowlEl.classList.remove('strike','glow'); void bowlEl.offsetWidth;
    bowlEl.classList.add('strike','glow'); setTimeout(() => bowlEl.classList.remove('glow'), 1500);
    const ripple = document.createElement('div'); ripple.className = 'songbo-ripple';
    bowlEl.appendChild(ripple); setTimeout(() => ripple.remove(), 1200);
    if (_sc && _sc.isActive()) _sc.check(index);
}

// ── Score DOM / UI (kept in app, driven by ScoreController callbacks) ──

function showCombo(n) {
    const el = _container.querySelector('.songbo-combo-display-el'); el.textContent = `🕉️ ×${n}`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(comboTimer); comboTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

function buildScoreDOM() {
    var display = _container.querySelector('.songbo-score-display-el');
    var song = _sc.getCurrentSong();
    var resolved = _sc.getResolved();
    display.innerHTML = '';
    song.notes.forEach(function (n, i) {
        const div = document.createElement('div'); div.className = 'songbo-score-note';
        if (n === '_') {
            div.textContent = '·';
        } else if (resolved[i] === -2) {
            div.textContent = '?'; div.style.opacity = '0.35'; div.title = '当前音阶无法弹奏此音';
        } else {
            div.textContent = n;
        }
        display.appendChild(div);
    });
}

function updateScoreDisplay() {
    var idx = _sc.getIndex();
    const notes = _container.querySelectorAll('.songbo-score-display-el .songbo-score-note');
    notes.forEach(function (el, i) {
        el.classList.remove('played', 'current', 'missed');
        if (i < idx) el.classList.add('played');
        else if (i === idx) el.classList.add('current');
    });
}

function updateScoreHints() {
    _container.querySelectorAll('.songbo-bowl .songbo-hint').forEach(h => h.classList.remove('show','correct','blink'));
    if (!_sc || !_sc.isActive()) return;
    var resolved = _sc.getResolved();
    var idx = _sc.getIndex();
    if (idx >= resolved.length) return;
    var bowls = _container.querySelectorAll('.songbo-bowl');
    var bowlIdx = resolved[idx];
    if (bowlIdx >= 0 && bowls[bowlIdx]) bowls[bowlIdx].querySelector('.songbo-hint').classList.add('show');
}

function updateProgress(pct) {
    _container.querySelector('.songbo-progress-fill-el').style.width = pct + '%';
}

function showCompletion() {
    _container.querySelector('.songbo-completion-overlay-el').classList.add('show');
    setTimeout(function () { closeCompletion(); }, 3000);
}
function closeCompletion() {
    _container.querySelector('.songbo-completion-overlay-el').classList.remove('show');
    if (_sc) _sc.reset();
}

function createParticles() {
    const container = _container.querySelector('.songbo-particles-el'); container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const p = document.createElement('div'); p.className = 'songbo-particle';
        const size = 4 + Math.random() * 8;
        p.style.cssText = `width:${size}px;height:${size}px;left:${5+Math.random()*90}%;--drift:${Math.random()*60-30}px;animation-duration:${12+Math.random()*18}s;animation-delay:${Math.random()*15}s`;
        container.appendChild(p);
    }
}

// ── init ──
function init(container) {
    _container = container;

    // 创建颂钵专属子 GainNode，连接到混响链路
    _subGain = AudioEngine.createSubGain();
    const { dry, convolver } = AudioEngine.getReverb('metal');
    // 断开 subGain 到 masterGain 的直连（createSubGain 自动连了），改接混响链路
    _subGain.disconnect();
    _subGain.connect(dry);
    _subGain.connect(convolver);

    const styleEl = document.createElement('style'); styleEl.textContent = CSS; container.appendChild(styleEl);
    const wrapper = document.createElement('div'); wrapper.className = 'songbo-app';
    wrapper.innerHTML = HTML_TEMPLATE; container.appendChild(wrapper);

    // ── 创建 ScoreController 实例 ──
    _sc = ScoreController.create({
        instrument: 'songbo',
        getScaleNotes: getScaleNoteNames,
        skipRests: true,
        defaultSong: null,
        onToggle: function (active) {
            _container.querySelector('.songbo-score-toggle').classList.toggle('active', active);
            _container.querySelector('.songbo-score-panel-el').classList.toggle('open', active);
            if (!active) updateScoreHints();
        },
        onLoad: function (songId, songData, resolved) {
            buildScoreDOM();
            updateScoreDisplay();
            updateScoreHints();
        },
        onCorrect: function (info) {
            // 高亮正确碗的 hint
            var bowls = _container.querySelectorAll('.songbo-bowl');
            var bowlIdx = info.noteIndex;
            if (bowlIdx >= 0 && bowls[bowlIdx]) {
                var hint = bowls[bowlIdx].querySelector('.songbo-hint');
                hint.classList.remove('show', 'blink');
                hint.classList.add('correct');
                setTimeout(function () { hint.classList.remove('correct'); }, 500);
            }
            updateScoreDisplay();
            updateScoreHints();
            if (info.isFinished) {
                setTimeout(function () { showCompletion(); }, 600);
            }
        },
        onWrong: function (info) {
            // 抖动弹错的碗
            var bowls = _container.querySelectorAll('.songbo-bowl');
            var playedBowl = bowls[info.playedIndex];
            if (playedBowl) {
                playedBowl.classList.remove('wrong-shake'); void playedBowl.offsetWidth;
                playedBowl.classList.add('wrong-shake');
                setTimeout(function () { playedBowl.classList.remove('wrong-shake'); }, 400);
            }
            // 闪烁正确碗的提示
            var expectedIdx = info.expectedIndex;
            var correctBowl = bowls[expectedIdx];
            if (correctBowl) {
                var ch = correctBowl.querySelector('.songbo-hint');
                ch.classList.remove('blink'); void correctBowl.offsetWidth;
                ch.classList.add('blink');
                setTimeout(function () { ch.classList.remove('blink'); }, 1000);
            }
        },
        onFinish: function (stats) {
            // 完成由 onCorrect 中 isFinished 触发 showCompletion
        },
        onReset: function () {
            buildScoreDOM();
            updateScoreDisplay();
            updateScoreHints();
        },
        onCombo: function (c) {
            showCombo(c);
        },
        onProgress: function (pct) {
            updateProgress(pct);
        }
    });

    // Keyboard handlers
    _keyDownHandler = (e) => {
        if (e.repeat && !keyDownState[e.key]) {
            keyDownState[e.key] = 'rubbing';
            const idx = KEY_MAP[e.key.toLowerCase()];
            if (idx !== undefined) { const bowls = _container.querySelectorAll('.songbo-bowl'); startRub(idx, SCALES[currentScale][idx].freq); bowls[idx]?.classList.add('rubbing'); }
            return;
        }
        if (keyDownState[e.key]) return;
        const key = e.key.toLowerCase();
        if (key === ' ') { e.preventDefault(); muteAll(); return; }
        const idx = KEY_MAP[key]; if (idx === undefined) return; e.preventDefault();
        keyDownState[key] = 'down'; pointerDownTime['key_'+key] = Date.now();
        pointerTimers['key_'+key] = setTimeout(() => { keyDownState[key] = 'rubbing'; const bowls = _container.querySelectorAll('.songbo-bowl'); startRub(idx, SCALES[currentScale][idx].freq); bowls[idx]?.classList.add('rubbing'); }, 300);
    };
    _keyUpHandler = (e) => {
        const key = e.key.toLowerCase(); const idx = KEY_MAP[key]; if (idx === undefined) return; e.preventDefault();
        clearTimeout(pointerTimers['key_'+key]); delete pointerTimers['key_'+key];
        const state = keyDownState[key]; delete keyDownState[key]; delete pointerDownTime['key_'+key];
        const bowls = _container.querySelectorAll('.songbo-bowl');
        if (state === 'rubbing') { stopRub(idx); bowls[idx]?.classList.remove('rubbing'); }
        else triggerStrike(idx, bowls[idx]);
    };

    _resizeHandler = () => { clearTimeout(_resizeHandler._t); _resizeHandler._t = setTimeout(renderBowls, 200); };

    // Control events
    _populateSongSelect();
    container.querySelector('.songbo-scale-select').addEventListener('change', e => {
        currentScale = e.target.value;
        muteAll();
        renderBowls();
        _populateSongSelect();
        if (_sc.isActive()) {
            _sc.reResolve();
            _sc.reset();
        }
    });
    container.querySelector('.songbo-theme-select').addEventListener('change', e => {
        const val = e.target.value;
        const appEl = container.querySelector('.songbo-app');
        if (val === 'copper') appEl.removeAttribute('data-theme');
        else appEl.setAttribute('data-theme', val);
    });
    container.querySelector('.songbo-score-toggle').addEventListener('click', function () {
        _sc.toggle();
        if (_sc.isActive() && !_sc.getCurrentSongId()) {
            var sel = container.querySelector('.songbo-song-select');
            if (sel && sel.value) _sc.loadSong(sel.value);
        }
    });
    container.querySelector('.songbo-mute-btn').addEventListener('click', muteAll);
    container.querySelector('.songbo-song-select').addEventListener('change', e => {
        var songId = e.target.value;
        // 自动切换到建议音阶
        var song = MusicSongs.songs[songId];
        if (song && song.scaleHint && song.scaleHint.songbo && song.scaleHint.songbo !== currentScale) {
            currentScale = song.scaleHint.songbo;
            container.querySelector('.songbo-scale-select').value = currentScale;
            muteAll(); renderBowls(); _populateSongSelect();
            container.querySelector('.songbo-song-select').value = songId;
        }
        _sc.loadSong(songId);
    });
    container.querySelector('.songbo-restart-btn').addEventListener('click', function () {
        _sc.reset();
    });
    container.querySelector('.songbo-continue-btn').addEventListener('click', closeCompletion);

    container.addEventListener('touchstart', () => AudioEngine.getContext(), { once: true });

    createParticles();
    requestAnimationFrame(() => renderBowls());

    return {
        muteAll,
        attachKeyboard() { document.addEventListener('keydown', _keyDownHandler); document.addEventListener('keyup', _keyUpHandler); window.addEventListener('resize', _resizeHandler); renderBowls(); },
        detachKeyboard() { document.removeEventListener('keydown', _keyDownHandler); document.removeEventListener('keyup', _keyUpHandler); window.removeEventListener('resize', _resizeHandler); },
        destroy() {
            this.detachKeyboard();
            // 清理定时器
            _timers.forEach(id => clearTimeout(id));
            _timers = [];
            // 清理 ScoreController
            if (_sc) { _sc.destroy(); _sc = null; }
            // 清理音频节点（但不关闭共享的 AudioContext）
            voices.forEach(nodes => nodes.forEach(n => { try{n.stop();}catch(e){} }));
            voices = [];
            rubVoices.forEach((v, idx) => {
                try{v.osc1.stop();}catch(e){}
                try{v.osc2.stop();}catch(e){}
                try{v.lfo.stop();}catch(e){}
            });
            rubVoices.clear();
        }
    };
}

return { init };
})();

window.SongboApp = SongboApp;
