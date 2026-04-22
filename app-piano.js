// app-piano.js — Piano module for Music Hub
// Exports: { init(container), destroy(container) }
// Uses shared AudioEngine for audio context

const PianoApp = (function () {
    // ════════════════════════════════════════════════════════════════
    // CSS（所有类名带 piano- 前缀）
    // ════════════════════════════════════════════════════════════════
    const PIANO_CSS = `
    .piano-controls-area {
        flex-shrink: 0; width: 100%; max-width: 600px;
        display: flex; flex-direction: column; gap: 4px;
        padding-top: 2px;
    }
    .piano-score-controls {
        display: flex; align-items: center; gap: 6px;
    }
    .piano-octave-control {
        display: flex; align-items: center; gap: 4px;
        margin-left: auto; flex-shrink: 0;
    }
    .piano-octave-btn {
        width: 32px; height: 32px; border: none; border-radius: 6px;
        background: #e0e0e0; color: #323232; font-size: 16px; font-weight: 700;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.15s; touch-action: manipulation;
    }
    .piano-octave-btn:active { background: #c0c0c0; }
    .piano-octave-label {
        font-size: 12px; color: #666; min-width: 54px; text-align: center; font-weight: 500;
    }
    .piano-score-btn {
        padding: 4px 10px; border: 1px solid #d0d0d0; border-radius: 6px;
        background: #fff; color: #323232; font-size: 11px; cursor: pointer;
        transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
        touch-action: manipulation;
    }
    .piano-score-btn:active { background: #e8e8e8; }
    .piano-score-btn.active { background: #4a7ab5; color: #fff; border-color: #4a7ab5; }
    .piano-score-select {
        padding: 4px 6px; border: 1px solid #d0d0d0; border-radius: 6px;
        font-size: 11px; color: #323232; background: #fff; flex: 1;
        max-width: 140px; touch-action: manipulation;
    }
    .piano-score-display {
        display: flex; gap: 2px; overflow-x: auto; padding: 4px 3px;
        background: #fff; border-radius: 6px; border: 1px solid #e0e0e0;
        scrollbar-width: thin; -webkit-overflow-scrolling: touch;
        min-height: 42px; max-height: 42px; align-items: center;
        touch-action: pan-x;
    }
    .piano-score-display::-webkit-scrollbar { height: 2px; }
    .piano-score-display::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
    .piano-score-note {
        display: inline-flex; flex-direction: column; align-items: center;
        justify-content: center; min-width: 32px; height: 34px;
        border-radius: 5px; font-size: 11px; font-weight: 600;
        flex-shrink: 0; transition: all 0.2s;
    }
    .piano-score-note.white-note { background: #f5f5f5; color: #333; border: 1.5px solid #ddd; }
    .piano-score-note.black-note { background: #3a3a3a; color: #fff; border: 1.5px solid #222; }
    .piano-score-note.current { transform: scale(1.15); box-shadow: 0 0 0 2px #4a7ab5; z-index: 1; }
    .piano-score-note.played { opacity: 0.35; transform: scale(0.9); }
    .piano-score-note .note-label { font-size: 10px; line-height: 1; }
    .piano-score-progress {
        width: 100%; height: 2px; background: #e0e0e0; border-radius: 2px;
        overflow: hidden; flex-shrink: 0;
    }
    .piano-score-progress-bar {
        height: 100%; background: #4a7ab5; border-radius: 2px;
        transition: width 0.2s; width: 0%;
    }
    .piano-piano-container {
        width: 100%; max-width: 600px;
        padding: 8px; background: #fafafa; border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex; flex-direction: column; min-height: 0;
        margin-top: 4px;
        flex: 1;
        max-height: 55dvh;
    }
    .piano-keys-wrapper {
        flex: 1; position: relative; width: 100%; min-height: 0;
    }
    .piano-white-keys {
        display: flex; width: 100%; height: 100%; gap: 1.5px;
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    }
    .piano-white-key {
        flex: 1; background: linear-gradient(180deg, #fff 0%, #f0f0f0 100%);
        border: 1px solid #d0d0d0; border-radius: 0 0 5px 5px;
        cursor: pointer; position: relative; transition: all 0.08s ease;
        display: flex; flex-direction: column; align-items: center;
        justify-content: flex-end; padding-bottom: 4px; user-select: none;
        touch-action: none;
    }
    .piano-white-key:active, .piano-white-key.active {
        background: linear-gradient(180deg, #c8dcf0 0%, #b8d0e8 100%);
        border-color: #90b0d0; transform: translateY(2px);
    }
    .piano-white-key.highlight {
        background: linear-gradient(180deg, #ffe0b2 0%, #ffcc80 100%) !important;
        border-color: #ffb74d !important;
    }
    .piano-key-flame {
        position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
        font-size: 20px; pointer-events: none; z-index: 20;
        animation: piano-flame-float 0.8s ease-in-out infinite;
        filter: drop-shadow(0 0 4px rgba(255,100,0,0.6));
    }
    .piano-black-key .piano-key-flame {
        top: -10px; font-size: 16px;
        filter: drop-shadow(0 0 6px rgba(100,180,255,0.8));
    }
    @keyframes piano-flame-float {
        0%, 100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        50% { transform: translateX(-50%) translateY(-4px) scale(1.15); opacity: 0.85; }
    }
    @keyframes piano-flame-out {
        0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-20px) scale(0.3); opacity: 0; }
    }
    .piano-white-key .piano-note-name { font-size: 9px; color: #aaa; font-weight: 400; line-height: 1.1; }
    .piano-white-key .piano-label { font-size: 11px; color: #505050; font-weight: 600; }

    .piano-black-keys {
        position: absolute; top: 0; left: 0; width: 100%; height: 58%;
        pointer-events: none; overflow: visible;
    }
    .piano-black-key {
        position: absolute; width: 7.5%; height: 100%;
        background: linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%);
        border: 1px solid #1a1a1a; border-radius: 0 0 3px 3px;
        cursor: pointer; pointer-events: auto; transition: all 0.08s ease;
        display: flex; align-items: flex-end; justify-content: center;
        padding-bottom: 4px; user-select: none; overflow: visible;
        touch-action: none;
    }
    .piano-black-key:active, .piano-black-key.active {
        background: linear-gradient(180deg, #6a5a8a 0%, #5a4a7a 100%);
        border-color: #4a3a6a; transform: translateY(2px);
    }
    .piano-black-key.highlight {
        background: linear-gradient(180deg, #e65100 0%, #bf360c 100%) !important;
        border-color: #e65100 !important;
    }
    .piano-black-key .piano-label { font-size: 9px; color: #fff; font-weight: 500; line-height: 1.1; text-align: center; }
    .piano-black-key .piano-label .shortcut { display: block; font-size: 11px; font-weight: 600; margin-bottom: 1px; }
    .piano-black-key .piano-label .piano-note-name { display: block; font-size: 8px; opacity: 0.6; }

    .piano-status-bar {
        flex-shrink: 0; padding: 4px 12px; background: #f0f0f0;
        border-radius: 6px; text-align: center; min-height: 24px;
        width: 100%; max-width: 600px; margin-top: 4px;
    }
    .piano-status-text { font-size: 12px; color: #323232; font-weight: 500; }
    .piano-hint { flex-shrink: 0; margin-top: 3px; font-size: 10px; color: #999; text-align: center; }
    .piano-install-hint {
        display: none; flex-shrink: 0; margin-top: 3px; font-size: 10px; color: #5a8a5a;
        text-align: center; background: #e8f5e8; padding: 4px 10px;
        border-radius: 6px; width: 100%; max-width: 600px;
    }

    @keyframes piano-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-3px); }
        40% { transform: translateX(3px); }
        60% { transform: translateX(-2px); }
        80% { transform: translateX(2px); }
    }

    @media (orientation: landscape) {
        .piano-controls-area { padding-top: 0; gap: 2px; }
        .piano-score-controls { gap: 4px; }
        .piano-octave-btn { width: 28px; height: 28px; font-size: 14px; }
        .piano-octave-label { font-size: 11px; min-width: 48px; }
        .piano-score-btn { padding: 3px 8px; font-size: 10px; }
        .piano-score-select { padding: 3px 4px; font-size: 10px; max-width: 110px; }
        .piano-score-display { min-height: 32px; max-height: 32px; padding: 2px 3px; }
        .piano-score-note { min-width: 26px; height: 26px; font-size: 9px; }
        .piano-piano-container { padding: 4px; border-radius: 6px; margin-top: 2px; height: auto; flex: 1; }
        .piano-status-bar { padding: 2px 10px; min-height: 20px; margin-top: 2px; }
        .piano-status-text { font-size: 11px; }
        .piano-hint { display: none; }
        .piano-install-hint { display: none; }
    }

    .piano-finish-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.7);
        display: none; align-items: center; justify-content: center;
        z-index: 300;
    }
    .piano-finish-overlay.show { display: flex; }
    .piano-finish-box {
        background: #fff; border: 2px solid #4a7ab5;
        border-radius: 16px; padding: 32px 40px;
        text-align: center; box-shadow: 0 0 40px rgba(0,0,0,.3);
    }
    .piano-finish-box .piano-finish-emoji { font-size: 48px; margin-bottom: 12px; }
    .piano-finish-box h2 { font-size: 22px; margin-bottom: 8px; color: #4a7ab5; }
    .piano-finish-box p { color: #666; margin-bottom: 20px; }
    .piano-finish-box button {
        background: #4a7ab5; color: #fff; border: none;
        border-radius: 8px; padding: 10px 28px;
        font-size: 15px; font-weight: 600; cursor: pointer;
        touch-action: manipulation;
    }

    @media (max-width: 360px) {
        .piano-white-key .piano-label { font-size: 10px; }
        .piano-white-key .piano-note-name { font-size: 8px; }
        .piano-black-key .piano-label { font-size: 8px; }
        .piano-black-key .piano-label .shortcut { font-size: 10px; }
        .piano-black-key .piano-label .piano-note-name { font-size: 7px; }
    }
`;

    // HTML 模板
    const PIANO_HTML = `<div class="piano-controls-area">
    <div class="piano-score-controls">
        <button class="piano-score-btn" id="scoreToggle">📖 曲谱</button>
        <select class="piano-score-select" id="songSelect">
            <!-- 动态生成 by ScoreController.populateSongSelect() -->
        </select>
        <button class="piano-score-btn" id="scoreReset" style="display:none">↺</button>
        <div class="piano-octave-control">
            <button class="piano-octave-btn" id="octDown">−</button>
            <span class="piano-octave-label" id="octaveLabel">C4 – B5</span>
            <button class="piano-octave-btn" id="octUp">+</button>
        </div>
    </div>
    <div class="piano-score-display" id="scoreDisplay" style="display:none"></div>
    <div class="piano-score-progress" id="scoreProgressWrap" style="display:none"><div class="piano-score-progress-bar" id="scoreProgressBar"></div></div>
</div>
<div class="piano-piano-container">
    <div class="piano-keys-wrapper">
        <div class="piano-white-keys" id="whiteKeys"></div>
        <div class="piano-black-keys" id="blackKeys"></div>
    </div>
</div>
<div class="piano-status-bar"><div class="piano-status-text" id="statusText">点击琴键开始演奏</div></div>
<div class="piano-hint">触摸/鼠标演奏 · 键盘 A~' 白键 W E T Y U I O 黑键 · Z/X 切换八度</div>
<div class="piano-finish-overlay piano-finish-overlay-el">
    <div class="piano-finish-box">
        <div class="piano-finish-emoji">🎉</div>
        <h2>演奏完成！</h2>
        <p class="piano-finish-text-el">太棒了！</p>
        <button class="piano-reset-btn">再来一次</button>
    </div>
</div>`;

    // ════════════════════════════════════════════════════════════════
    // 音符系统
    // ════════════════════════════════════════════════════════════════
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const WHITE_NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const BLACK_NOTE_INDICES = [1, 3, 6, 8, 10];

    function getFrequency(noteName, octave) {
        const noteIndex = NOTE_NAMES.indexOf(noteName);
        const midi = (octave + 1) * 12 + noteIndex;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    let baseOctave = 4;
    const MIN_OCTAVE = 2;
    const MAX_OCTAVE = 6;

    const WHITE_SHORTCUTS = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", '', '', ''];
    const BLACK_SHORTCUTS_FLAT = ['W', 'E', 'T', 'Y', 'U', 'I', 'O'];

    function generateKeys() {
        const whiteKeys = [], blackKeys = [];
        let blackCount = 0;
        for (let oct = baseOctave; oct <= baseOctave + 1; oct++) {
            WHITE_NOTE_NAMES.forEach((name) => {
                whiteKeys.push({ note: `${name}${oct}`, freq: getFrequency(name, oct) });
            });
            BLACK_NOTE_INDICES.forEach((idx) => {
                blackKeys.push({
                    note: `${NOTE_NAMES[idx]}${oct}`,
                    freq: getFrequency(NOTE_NAMES[idx], oct),
                    shortcut: blackCount < BLACK_SHORTCUTS_FLAT.length ? BLACK_SHORTCUTS_FLAT[blackCount] : '',
                    octOffset: oct - baseOctave
                });
                blackCount++;
            });
        }
        return { whiteKeys, blackKeys };
    }

    function getBlackKeyPosition(octOffset, whiteKeyIdx) {
        const totalWhites = 14;
        const pos = octOffset * 7 + whiteKeyIdx;
        const gapCenter = pos + 0.5;
        const pct = (gapCenter / totalWhites) * 100;
        return pct - 3.75;
    }

    // ════════════════════════════════════════════════════════════════
    // 音频引擎 — 使用共享 AudioEngine
    // ════════════════════════════════════════════════════════════════
    const MAX_POLYPHONY = 10;
    let activeOscillators = [];

    function playNote(frequency) {
        const audioContext = AudioEngine.getContext();
        
        if (activeOscillators.length >= MAX_POLYPHONY) {
            const oldest = activeOscillators.shift();
            try { oldest.forEach(o => o.stop()); } catch (e) { }
        }
        const now = audioContext.currentTime;
        const lpf = audioContext.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(Math.min(frequency * 6, 8000), now);
        lpf.frequency.linearRampToValueAtTime(Math.min(frequency * 3, 4000), now + 0.5);
        lpf.Q.setValueAtTime(0.7, now);
        // 连接到 subGain（再由 subGain 分发到 dry/convolver）
        lpf.connect(_subGain);

        const masterGain = audioContext.createGain();
        masterGain.gain.setValueAtTime(0.5, now);
        masterGain.connect(lpf);
        const oscs = [];

        const o1 = audioContext.createOscillator(), g1 = audioContext.createGain();
        o1.type = 'triangle'; o1.frequency.setValueAtTime(frequency, now);
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.5, now + 0.01);
        g1.gain.linearRampToValueAtTime(0.35, now + 0.1);
        g1.gain.linearRampToValueAtTime(0.25, now + 0.8);
        g1.gain.linearRampToValueAtTime(0, now + 2.0);
        o1.connect(g1); g1.connect(masterGain);
        o1.start(now); o1.stop(now + 2.0); oscs.push(o1);

        const o2 = audioContext.createOscillator(), g2 = audioContext.createGain();
        o2.type = 'sine'; o2.frequency.setValueAtTime(frequency * 2, now);
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(0.15, now + 0.01);
        g2.gain.linearRampToValueAtTime(0.08, now + 0.15);
        g2.gain.linearRampToValueAtTime(0, now + 1.2);
        o2.connect(g2); g2.connect(masterGain);
        o2.start(now); o2.stop(now + 1.2); oscs.push(o2);

        const o3 = audioContext.createOscillator(), g3 = audioContext.createGain();
        o3.type = 'sine'; o3.frequency.setValueAtTime(frequency * 3, now);
        g3.gain.setValueAtTime(0, now);
        g3.gain.linearRampToValueAtTime(0.06, now + 0.005);
        g3.gain.linearRampToValueAtTime(0.02, now + 0.08);
        g3.gain.linearRampToValueAtTime(0, now + 0.6);
        o3.connect(g3); g3.connect(masterGain);
        o3.start(now); o3.stop(now + 0.6); oscs.push(o3);

        activeOscillators.push(oscs);
        _setTimeout(function () {
            const idx = activeOscillators.indexOf(oscs);
            if (idx !== -1) activeOscillators.splice(idx, 1);
            lpf.disconnect();
            masterGain.disconnect();
        }, 2100);
    }

    // ════════════════════════════════════════════════════════════════
    // 曲谱系统
    // ════════════════════════════════════════════════════════════════
    const SONGS = MusicSongs.songs;

    // scoreRealNotes 作为本地缓存，从 _sc.getResolved() 同步
    let scoreRealNotes = [];

    function mapSongNoteToCurrent(note) {
        if (note === '_') return null;
        const match = note.match(/^([A-G]#?)(\d)$/);
        if (!match) return null;
        const [, name, oct] = match;
        const targetOct = parseInt(oct);
        if (targetOct >= baseOctave && targetOct <= baseOctave + 1) return note;
        return null;
    }

    // ════════════════════════════════════════════════════════════════
    // 自动八度适配 — 检查曲谱音符范围，自动调整 baseOctave
    // ════════════════════════════════════════════════════════════════
    function autoShiftOctaveForSong(songId) {
        const song = SONGS[songId];
        if (!song) return;
        const octaves = [];
        song.notes.forEach(n => {
            if (n === '_') return;
            const m = n.match(/^([A-G]#?)(\d)$/);
            if (m) octaves.push(parseInt(m[2]));
        });
        if (octaves.length === 0) return;
        const minOct = Math.min(...octaves);
        const maxOct = Math.max(...octaves);
        // 当前范围: baseOctave 到 baseOctave+1
        if (minOct >= baseOctave && maxOct <= baseOctave + 1) return; // 已经适配
        // 尝试找到一个能覆盖所有音符的八度范围
        for (let oct = MIN_OCTAVE; oct <= MAX_OCTAVE; oct++) {
            if (minOct >= oct && maxOct <= oct + 1) {
                baseOctave = oct;
                buildPiano();
                return;
            }
        }
        // 如果没有单个八度范围能完全覆盖，选择覆盖最多音符的
        let bestOct = baseOctave, bestCount = 0;
        for (let oct = MIN_OCTAVE; oct <= MAX_OCTAVE; oct++) {
            let count = 0;
            song.notes.forEach(n => {
                if (n === '_') return;
                const m = n.match(/^([A-G]#?)(\d)$/);
                if (m) {
                    const o = parseInt(m[2]);
                    if (o >= oct && o <= oct + 1) count++;
                }
            });
            if (count > bestCount) { bestCount = count; bestOct = oct; }
        }
        if (bestOct !== baseOctave) {
            baseOctave = bestOct;
            buildPiano();
        }
    }

    // ── 模块级状态：container 引用，供内部函数使用 ──
    let _container = null;

    // ── 定时器 ID 收集（destroy 时清理）──
    let _timers = [];

    function _setTimeout(fn, ms) {
        const id = setTimeout(fn, ms);
        _timers.push(id);
        return id;
    }

    // ── ScoreController 实例 ──
    var _sc = null;

    // ════════════════════════════════════════════════════════════════
    // 初始化
    // ════════════════════════════════════════════════════════════════
    let _subGain = null;

    function init(container) {
        _container = container;

        // 创建钢琴专属子 GainNode，连接到混响链路
        const { dry, convolver } = AudioEngine.getReverb('metal');
        _subGain = AudioEngine.createSubGain();
        _subGain.disconnect();
        _subGain.connect(dry);
        _subGain.connect(convolver);

        // 1. 注入 CSS
        if (container.parentElement) {
            container.insertAdjacentHTML('beforebegin', '<style>' + PIANO_CSS + '</style>');
        } else {
            document.head.insertAdjacentHTML('beforeend', '<style>' + PIANO_CSS + '</style>');
        }

        // 2. 注入 HTML
        container.innerHTML = PIANO_HTML;

        // 3. 获取 DOM 引用
        const pianoContainerEl = container.querySelector('.piano-piano-container');

        // 4. 构建钢琴
        buildPiano();

        // 5. 触摸事件绑定 — 加 stopPropagation 防止与 shell 滑动冲突
        pianoContainerEl.addEventListener('touchstart', handleTouchStart, { passive: false });
        pianoContainerEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        pianoContainerEl.addEventListener('touchend', handleTouchEnd, { passive: false });
        pianoContainerEl.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        // 6. 创建 ScoreController 实例
        _sc = ScoreController.create({
            instrument: 'piano',
            getScaleNotes: function () { return null; }, // 钢琴不按音阶过滤
            skipRests: false,
            resolveNotes: function (songNotes) {
                // 钢琴的 resolved 是过滤掉 '_' 后的音名数组
                return songNotes.filter(function (n) { return n !== '_'; });
            },
            defaultSong: 'twinkle',
            onToggle: function (active) {
                $id('scoreToggle').classList.toggle('active', active);
                $id('scoreDisplay').style.display = active ? 'flex' : 'none';
                $id('scoreProgressWrap').style.display = active ? 'block' : 'none';
                $id('songSelect').style.display = active ? 'block' : 'none';
                $id('scoreReset').style.display = active ? 'inline-block' : 'none';
                if (!active) {
                    clearScoreHighlights(false);
                    $id('statusText').textContent = '点击琴键开始演奏';
                }
            },
            onLoad: function (songId, songData, resolved) {
                // resolved = 过滤掉 '_' 后的音名数组
                scoreRealNotes = resolved;
                // 自动调整八度
                autoShiftOctaveForSong(songId);
                renderScore(songData);
                var sd = $id('scoreDisplay');
                if (sd) sd.scrollLeft = 0;
                highlightNextNote();
            },
            onCorrect: function (info) {
                clearScoreHighlights(true);
                var comboText = info.combo >= 3 ? ' \uD83D\uDD25\xD7' + info.combo : '';
                $id('statusText').textContent = '\uD83C\uDFB5 ' + (info.note || '') + comboText;
                updateScoreUI();
                _setTimeout(function () { highlightNextNote(); }, 100);
                if (info.isFinished) {
                    var finishText = info.maxCombo >= 10 ? '太棒了！完美演奏！🌟' : '演奏完成，继续加油！';
                    _container.querySelector('.piano-finish-text-el').textContent = finishText;
                    _container.querySelector('.piano-finish-overlay-el').classList.add('show');
                    _setTimeout(function () {
                        _container.querySelector('.piano-finish-overlay-el').classList.remove('show');
                        _sc.reset();
                    }, 3000);
                }
            },
            onWrong: function (info) {
                var wrongEl = _container.querySelectorAll('.piano-piano-container [data-note="' + info.playedIndex + '"]')[0] || null;
                if (wrongEl) {
                    wrongEl.style.animation = 'piano-shake 0.3s ease';
                    _setTimeout(function () { wrongEl.style.animation = ''; }, 300);
                }
                $id('statusText').textContent = '\u2717 应弹 ' + info.expectedNote;
            },
            onFinish: function (stats) {
                // 完成由 onCorrect 中 isFinished 触发
            },
            onReset: function () {
                scoreRealNotes = _sc.getResolved();
                if (_sc.getCurrentSong()) renderScore(_sc.getCurrentSong());
                var sd = $id('scoreDisplay');
                if (sd) sd.scrollLeft = 0;
                highlightNextNote();
            },
            onCombo: function (c) {
                // combo 显示已集成到 onCorrect 的 statusText 中
            },
            onProgress: function (pct) {
                $id('scoreProgressBar').style.width = pct + '%';
            }
        });

        // 7. 动态生成曲谱下拉
        _populateSongSelect();

        // 8. 按钮事件
        container.querySelector('#octDown').addEventListener('click', function () { shiftOctave(-1); });
        container.querySelector('#octUp').addEventListener('click', function () { shiftOctave(1); });
        container.querySelector('#scoreToggle').addEventListener('click', function () {
            _sc.toggle();
            if (_sc.isActive() && !_sc.getCurrentSongId()) {
                var sel = container.querySelector('#songSelect');
                if (sel && sel.value) _sc.loadSong(sel.value);
            }
        });
        container.querySelector('#songSelect').addEventListener('change', function (e) {
            _sc.loadSong(e.target.value);
        });
        container.querySelector('#scoreReset').addEventListener('click', function () {
            _sc.loadSong(_sc.getCurrentSongId());
        });
        container.querySelector('.piano-reset-btn').addEventListener('click', function () {
            container.querySelector('.piano-finish-overlay-el').classList.remove('show');
            _sc.reset();
        });

        // 9. install hint
        if (!window.matchMedia('(display-mode: fullscreen)').matches &&
            !window.matchMedia('(display-mode: standalone)').matches &&
            !window.navigator.standalone) {
            var ih = container.querySelector('.piano-install-hint');
            if (ih) ih.style.display = 'block';
        }

        // 10. 存储 keyboard / mouse handlers 到 container 上
        container._keydownHandler = function (e) {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            if (key === 'z') { shiftOctave(-1); return; }
            if (key === 'x') { shiftOctave(1); return; }
            if (KEYBOARD_MAP[key]) {
                const note = KEYBOARD_MAP[key];
                const el = container.querySelector(`.piano-piano-container [data-note="${note}"]`);
                if (el) activateKey(el, note);
            }
        };
        container._keyupHandler = function (e) {
            const key = e.key.toLowerCase();
            if (KEYBOARD_MAP[key]) {
                const note = KEYBOARD_MAP[key];
                const el = container.querySelector(`.piano-piano-container [data-note="${note}"]`);
                if (el) deactivateKey(el);
            }
        };

        container._mousedownHandler = function (e) {
            mouseIsDown = true; AudioEngine.getContext();
            const el = getKeyElementAt(e.clientX, e.clientY);
            if (el) { mouseActiveKey = el; activateKey(el, el.dataset.note); }
        };
        container._mousemoveHandler = function (e) {
            if (!mouseIsDown) return;
            const newEl = getKeyElementAt(e.clientX, e.clientY);
            if (newEl !== mouseActiveKey) {
                if (mouseActiveKey) deactivateKey(mouseActiveKey);
                if (newEl) { mouseActiveKey = newEl; activateKey(newEl, newEl.dataset.note); }
                else mouseActiveKey = null;
            }
        };
        container._mouseupHandler = function () {
            mouseIsDown = false;
            if (mouseActiveKey) deactivateKey(mouseActiveKey);
            mouseActiveKey = null;
        };

        return { muteAll: muteAll, destroy: destroy };
    }

    function destroy(container) {
        if (!container) container = _container;
        // 清理定时器
        _timers.forEach(function (id) { clearTimeout(id); });
        _timers = [];
        // 清理 ScoreController
        if (_sc) { _sc.destroy(); _sc = null; }
        // 清理音频振荡器（但不关闭共享的 AudioContext）
        activeOscillators.forEach(oscs => {
            try { oscs.forEach(o => o.stop()); } catch (e) { }
        });
        activeOscillators = [];
        // 清除 handler 引用
        if (container) {
            container._keydownHandler = null;
            container._keyupHandler = null;
            container._mousedownHandler = null;
            container._mousemoveHandler = null;
            container._mouseupHandler = null;
        }
        _container = null;
    }

    // ════════════════════════════════════════════════════════════════
    // 辅助函数
    // ════════════════════════════════════════════════════════════════
    function $(sel) {
        return (_container || document).querySelector(sel);
    }
    function $id(id) {
        return (_container || document).querySelector('#' + id);
    }

    // ════════════════════════════════════════════════════════════════
    // 曲谱系统函数
    // ════════════════════════════════════════════════════════════════
    function _populateSongSelect() {
        var sel = $id('songSelect');
        ScoreController.populateSongSelect(sel, null);
    }

    function renderScore(songData) {
        var scContainer = $id('scoreDisplay');
        scContainer.innerHTML = '';
        songData.notes.forEach(function (note) {
            if (note === '_') {
                var rest = document.createElement('div');
                rest.className = 'piano-score-note';
                rest.style.background = 'transparent';
                rest.style.border = 'none';
                rest.style.minWidth = '14px';
                rest.style.color = '#ccc';
                rest.textContent = '\u00B7';
                scContainer.appendChild(rest);
                return;
            }
            var el = document.createElement('div');
            var isBlack = note.includes('#');
            el.className = 'piano-score-note ' + (isBlack ? 'black-note' : 'white-note');
            el.dataset.note = note;
            el.innerHTML = '<span class="note-label">' + note.replace('#', '\u266F') + '</span>';
            scContainer.appendChild(el);
        });
        updateScoreUI();
    }

    function updateScoreUI() {
        var idx = _sc ? _sc.getIndex() : 0;
        var allNotes = _container.querySelectorAll('#scoreDisplay .piano-score-note[data-note]');
        allNotes.forEach(function (el, i) {
            el.classList.remove('current', 'played');
            if (i < idx) el.classList.add('played');
            else if (i === idx) el.classList.add('current');
        });
        var current = (_container.querySelector('#scoreDisplay .piano-score-note.current')) || null;
        if (current) {
            var sc = $id('scoreDisplay');
            var noteLeft = current.offsetLeft;
            var noteWidth = current.offsetWidth;
            var scWidth = sc.offsetWidth;
            var scScrollLeft = sc.scrollLeft;
            if (noteLeft - scScrollLeft < 10) {
                sc.scrollLeft = noteLeft - 10;
            } else if (noteLeft + noteWidth - scScrollLeft > scWidth - 10) {
                sc.scrollLeft = noteLeft + noteWidth - scWidth + 10;
            }
        }
        var total = scoreRealNotes.length;
        var pct = total > 0 ? (idx / total) * 100 : 0;
        $id('scoreProgressBar').style.width = pct + '%';
    }

    function checkScoreInput(note) {
        if (!_sc || !_sc.isActive()) return;
        _sc.check(note, 'name');
    }

    function highlightNextNote() {
        clearScoreHighlights(false);
        if (!_sc || !_sc.isActive()) return;
        var idx = _sc.getIndex();
        if (idx >= scoreRealNotes.length) return;
        var nextNote = scoreRealNotes[idx];
        var mappedNote = mapSongNoteToCurrent(nextNote);
        if (mappedNote) {
            var el = _container.querySelectorAll('.piano-piano-container [data-note="' + mappedNote + '"]')[0] || null;
            if (el) {
                el.classList.add('highlight');
                var isBlack = el.classList.contains('piano-black-key');
                var flame = document.createElement('span');
                flame.className = 'piano-key-flame';
                flame.textContent = isBlack ? '\uD83D\uDC99' : '\uD83D\uDD25';
                el.appendChild(flame);
            }
        }
    }

    function clearScoreHighlights(animate) {
        _container.querySelectorAll('.highlight').forEach(function (el) {
            el.classList.remove('highlight');
            var flame = el.querySelector('.piano-key-flame');
            if (flame) {
                if (animate) {
                    flame.style.animation = 'piano-flame-out 0.3s ease-out forwards';
                    _setTimeout(function () { flame.remove(); }, 300);
                } else {
                    flame.remove();
                }
            }
        });
    }

    // ════════════════════════════════════════════════════════════════
    // 琴键渲染
    // ════════════════════════════════════════════════════════════════
    let currentWhiteKeys = [];
    let currentBlackKeys = [];
    const BLACK_KEY_WHITE_POSITIONS = [0, 1, 3, 4, 5];
    let KEYBOARD_MAP = {};

    function buildPiano() {
        var keys = generateKeys();
        currentWhiteKeys = keys.whiteKeys;
        currentBlackKeys = keys.blackKeys;

        $id('whiteKeys').innerHTML = '';
        $id('blackKeys').innerHTML = '';

        keys.whiteKeys.forEach(function (k, i) {
            var el = document.createElement('div');
            el.className = 'piano-white-key';
            el.dataset.note = k.note;
            var shortcut = i < WHITE_SHORTCUTS.length ? WHITE_SHORTCUTS[i] : '';
            el.innerHTML = '<span class="piano-note-name">' + k.note.replace('#', '\u266F') + '</span><span class="piano-label">' + shortcut + '</span>';
            $id('whiteKeys').appendChild(el);
        });

        keys.blackKeys.forEach(function (k, i) {
            var octIdx = k.octOffset;
            var posInOct = BLACK_KEY_WHITE_POSITIONS[i % 5];
            var leftPct = getBlackKeyPosition(octIdx, posInOct);
            var el = document.createElement('div');
            el.className = 'piano-black-key';
            el.dataset.note = k.note;
            el.style.left = leftPct + '%';
            el.innerHTML = '<span class="piano-label"><span class="shortcut">' + k.shortcut + '</span><span class="piano-note-name">' + k.note.replace('#', '\u266F') + '</span></span>';
            $id('blackKeys').appendChild(el);
        });

        $id('octaveLabel').textContent = 'C' + baseOctave + ' \u2013 B' + (baseOctave + 1);
        buildKeyboardMap();
        if (_sc && _sc.isActive()) highlightNextNote();
    }

    function buildKeyboardMap() {
        KEYBOARD_MAP = {};
        var wShortcuts = 'asdfghjkl;\'';
        var bShortcuts = 'wetyuio';
        currentWhiteKeys.forEach(function (k, i) {
            if (i < wShortcuts.length) KEYBOARD_MAP[wShortcuts[i]] = k.note;
        });
        var bOrder = [0, 1, 2, 3, 4, 5, 6];
        bOrder.forEach(function (idx, i) {
            if (i < bShortcuts.length && idx < currentBlackKeys.length) {
                KEYBOARD_MAP[bShortcuts[i]] = currentBlackKeys[idx].note;
            }
        });
    }

    // ════════════════════════════════════════════════════════════════
    // 琴键交互
    // ════════════════════════════════════════════════════════════════
    const touchActiveKeys = new Map();
    let mouseIsDown = false, mouseActiveKey = null;

    function activateKey(keyElement, note) {
        if (!keyElement || keyElement.classList.contains('active')) return;
        keyElement.classList.add('active');
        var k = currentWhiteKeys.concat(currentBlackKeys).find(function (x) { return x.note === note; });
        if (k) playNote(k.freq);
        $id('statusText').textContent = '\uD83C\uDFB5 ' + note;
        checkScoreInput(note);
    }

    function deactivateKey(keyElement) {
        if (!keyElement) return;
        keyElement.classList.remove('active');
    }

    function getKeyElementAt(x, y) {
        var el = document.elementFromPoint(x, y);
        if (!el) return null;
        if (el.classList.contains('piano-white-key') || el.classList.contains('piano-black-key')) return el;
        return el.closest('.piano-white-key, .piano-black-key') || null;
    }

    function handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation(); // 阻止冒泡到 shell，防止滑动手势冲突
        AudioEngine.getContext();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            var el = getKeyElementAt(touch.clientX, touch.clientY);
            if (el) { touchActiveKeys.set(touch.identifier, el); activateKey(el, el.dataset.note); }
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation(); // 同上
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            if (!touchActiveKeys.has(touch.identifier)) continue;
            var newEl = getKeyElementAt(touch.clientX, touch.clientY);
            var prev = touchActiveKeys.get(touch.identifier);
            if (newEl !== prev) {
                if (prev) deactivateKey(prev);
                if (newEl) { touchActiveKeys.set(touch.identifier, newEl); activateKey(newEl, newEl.dataset.note); }
                else touchActiveKeys.delete(touch.identifier);
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation(); // 同上
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            var el = touchActiveKeys.get(touch.identifier);
            if (el) deactivateKey(el);
            touchActiveKeys.delete(touch.identifier);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 八度切换
    // ════════════════════════════════════════════════════════════════
    function shiftOctave(delta) {
        var next = baseOctave + delta;
        if (next < MIN_OCTAVE || next > MAX_OCTAVE) return;
        baseOctave = next;
        buildPiano();
    }

    function muteAll() {
        const ctx = AudioEngine.getContext();
        if (!ctx || !_subGain) return;
        const now = ctx.currentTime;
        const savedVol = _subGain.gain.value;
        _subGain.gain.cancelScheduledValues(now);
        _subGain.gain.setValueAtTime(savedVol, now);
        _subGain.gain.linearRampToValueAtTime(0, now + 0.3);
        _setTimeout(function() {
            // 停止所有振荡器
            activeOscillators.forEach(function(oscs) { try { oscs.forEach(function(o) { o.stop(); }); } catch(e) {} });
            activeOscillators = [];
            // 恢复音量
            _subGain.gain.cancelScheduledValues(ctx.currentTime);
            _subGain.gain.setValueAtTime(savedVol, ctx.currentTime);
        }, 400);
    }

    return { init: init, destroy: destroy, muteAll: muteAll };
})();

if (typeof window !== 'undefined') {
    window.PianoApp = PianoApp;
}
