/**
 * score-controller.js — 共享曲谱控制器
 *
 * 将三个乐器 app 中重复的曲谱逻辑抽取为通用模块。
 * 只管「状态 + 判定」，不管「DOM 渲染 + 音频」——
 * 各 app 通过回调 (callbacks) 接收状态变化，自行更新 UI。
 *
 * 依赖：MusicSongs（songs.js）
 *
 * 用法：
 *   var sc = ScoreController.create({ ... });
 *   sc.toggle();           // 开关曲谱模式
 *   sc.loadSong('twinkle');
 *   sc.check(playedIndex); // 弹奏时调用
 *   sc.reset();            // 重头开始
 *   sc.destroy();          // 清理
 */
window.ScoreController = (function () {

    var SONGS = MusicSongs.songs;

    // ════════════════════════════════════════════════════════════════
    // 辅助：构建曲谱下拉菜单（纯 DOM，三个 app 都一样的逻辑）
    // ════════════════════════════════════════════════════════════════
    /**
     * 填充 <select> 的曲谱列表
     * @param {HTMLSelectElement} selectEl - 目标 <select>
     * @param {string[]} scaleNotes - 当前音阶可用音名
     * @param {Object} [opts]
     * @param {string} [opts.fitFilter] - 过滤 fit 字段，如 'piano'。null 表示不排除任何
     * @param {string} [opts.currentValue] - 填充后保持选中的 songId
     */
    function populateSongSelect(selectEl, scaleNotes, opts) {
        opts = opts || {};
        var fitFilter = opts.fitFilter !== undefined ? opts.fitFilter : null;
        selectEl.innerHTML = '';

        MusicSongs.groups.forEach(function (g) {
            var optgroup = document.createElement('optgroup');
            optgroup.label = g.label;
            var hasAny = false;

            g.keys.forEach(function (k) {
                var song = MusicSongs.songs[k];
                // fit 过滤：如果指定了 fitFilter，排除不匹配的
                if (fitFilter && song.fit === fitFilter) return;
                // 对不使用 resolveNotes 的乐器（如钢琴），scaleNotes 可以传 null 跳过检查
                var label = song.name;
                if (scaleNotes) {
                    var check = MusicSongs.checkPlayable(song.notes, scaleNotes);
                    if (check.unplayable > 0) label += ' ⚠️(' + check.unplayable + '音不可弹)';
                    var opt = document.createElement('option');
                    opt.value = k;
                    opt.textContent = label;
                    opt.title = check.unplayable > 0
                        ? check.unplayable + '个音在当前音阶下无法弹奏'
                        : '所有音均可弹奏';
                    optgroup.appendChild(opt);
                } else {
                    var opt = document.createElement('option');
                    opt.value = k;
                    opt.textContent = label;
                    optgroup.appendChild(opt);
                }
                hasAny = true;
            });

            if (hasAny) selectEl.appendChild(optgroup);
        });

        if (opts.currentValue) selectEl.value = opts.currentValue;
    }

    // ════════════════════════════════════════════════════════════════
    // 工厂函数
    // ════════════════════════════════════════════════════════════════

    /**
     * 创建一个曲谱控制器实例
     *
     * @param {Object} options
     * @param {string}   options.instrument   - 'piano' | 'songbo' | 'kongling'
     * @param {Function} options.getScaleNotes
     *        返回当前音阶的音名数组，如 ['C4','D4','E4',...]。
     *        对钢琴来说就是当前两个八度内的所有音名；
     *        对颂钵/空灵鼓就是 SCALES[currentScale] 的 notes。
     *
     * @param {Function} [options.resolveNotes]
     *        将曲谱音名数组映射为乐器索引数组的函数。
     *        签名: (songNotes: string[]) => number[]
     *        默认使用 MusicSongs.resolveNotes(songNotes, getScaleNotes())。
     *        钢琴可以覆盖此方法实现自己的映射逻辑（直接匹配音名）。
     *
     * @param {boolean} [options.skipRests=true]
     *        是否在 check() 时自动跳过休止符(-1)和无法映射的音符(-2)。
     *        钢琴模式下设为 false（钢琴使用 scoreRealNotes，自行过滤了 '_'）。
     *
     * @param {string} [options.defaultSong]
     *        默认曲谱 ID，如 'twinkle'
     *
     * ── 回调 ──
     * @param {Function} options.onToggle(active)
     *        曲谱模式开/关时调用。app 在此切换 UI 可见性。
     *
     * @param {Function} options.onLoad(songId, songData, resolved)
     *        加载曲谱后调用。
     *        songData = { name, notes, fit, scaleHint }
     *        resolved = resolveNotes 结果 (number[])
     *        app 在此渲染谱面 DOM、高亮第一个音符。
     *
     * @param {Function} options.onCorrect(info)
     *        弹对时调用。info = { scoreIndex, combo, note, totalNotes, isFinished }
     *        app 在此更新 UI（进度、连击、滚动、高亮下一个音符）。
     *
     * @param {Function} options.onWrong(info)
     *        弹错时调用。info = { playedIndex, expectedIndex, expectedNote }
     *        app 在此显示错误反馈（抖动、提示正确音符）。
     *
     * @param {Function} options.onFinish(stats)
     *        曲谱弹完时调用。stats = { combo, maxCombo, totalNotes }
     *        app 在此显示完成弹窗。
     *
     * @param {Function} options.onReset()
     *        重置后调用。app 在此清空 UI 回到曲谱开头。
     *
     * @param {Function} [options.onCombo(combo)]
     *        连击数 ≥ 3 时调用。app 在此显示连击特效。
     *
     * @param {Function} [options.onProgress(pct)]
     *        进度变化时调用。pct = 0~100。
     *
     * @param {Function} [options.onScoreIndexChange(index, total)]
     *        scoreIndex 变化时调用。方便 app 更新谱面滚动/高亮。
     */
    function create(options) {
        if (!options) throw new Error('ScoreController.create: options required');

        var instrument = options.instrument || 'unknown';
        var getScaleNotes = options.getScaleNotes;
        var customResolve = options.resolveNotes || null;
        var skipRests = options.skipRests !== undefined ? options.skipRests : true;
        var defaultSong = options.defaultSong || null;

        // 回调
        var onToggle = options.onToggle || noop;
        var onLoad = options.onLoad || noop;
        var onCorrect = options.onCorrect || noop;
        var onWrong = options.onWrong || noop;
        var onFinish = options.onFinish || noop;
        var onReset = options.onReset || noop;
        var onCombo = options.onCombo || noop;
        var onProgress = options.onProgress || noop;
        var onScoreIndexChange = options.onScoreIndexChange || noop;

        // ── 内部状态 ──
        var scoreMode = false;
        var currentSongId = defaultSong;
        var currentSongData = null;   // SONGS[id] 引用
        var scoreIndex = 0;           // 当前需要弹的位置（在原始 notes 数组中的下标）
        var combo = 0;
        var maxCombo = 0;
        var resolved = [];            // resolveNotes 结果

        // ── resolveNotes 封装 ──
        function doResolve(songNotes) {
            if (customResolve) {
                return customResolve(songNotes);
            }
            var scale = getScaleNotes ? getScaleNotes() : [];
            return MusicSongs.resolveNotes(songNotes, scale);
        }

        // ── 计算可弹音符总数 ──
        function countPlayable() {
            var count = 0;
            for (var i = 0; i < resolved.length; i++) {
                if (resolved[i] >= 0) count++;
            }
            return count;
        }

        // ── 计算已完成的可弹音符数 ──
        function countPlayed() {
            var count = 0;
            for (var i = 0; i < scoreIndex && i < resolved.length; i++) {
                if (resolved[i] >= 0) count++;
            }
            return count;
        }

        // ── 进度百分比 ──
        function calcProgress() {
            var total = resolved.length;
            if (total === 0) return 0;
            return (scoreIndex / total) * 100;
        }

        // ── 通知进度 ──
        function notifyProgress() {
            onProgress(calcProgress());
            onScoreIndexChange(scoreIndex, resolved.length);
        }

        // ── 跳过休止符和无法映射的音 ──
        function skipNonPlayable() {
            if (!skipRests) return;
            while (scoreIndex < resolved.length && resolved[scoreIndex] < 0) {
                scoreIndex++;
            }
        }

        // ── Public API ──

        /**
         * 当前是否处于曲谱模式
         */
        function isActive() {
            return scoreMode;
        }

        /**
         * 开关曲谱模式
         * @param {boolean} [force] - 指定开/关，不传则 toggle
         */
        function toggle(force) {
            scoreMode = force !== undefined ? !!force : !scoreMode;
            onToggle(scoreMode);
            if (scoreMode && currentSongId) {
                loadSong(currentSongId);
            }
        }

        /**
         * 加载指定曲谱
         * @param {string} songId - songs.js 中的 key
         */
        function loadSong(songId) {
            var song = SONGS[songId];
            if (!song) return;
            currentSongId = songId;
            currentSongData = song;
            scoreIndex = 0;
            combo = 0;
            maxCombo = 0;
            resolved = doResolve(song.notes);

            // 如果 skipRests，跳过开头的休止符
            skipNonPlayable();

            onLoad(songId, song, resolved);
            notifyProgress();
        }

        /**
         * 检查弹奏是否正确
         *
         * @param {number|string} played - 弹奏的索引或音名。
         *   - 颂钵/空灵鼓传碗/鼓舌的 index (number)，与 resolved[scoreIndex] 比较。
         *   - 钢琴传音名 (string)，与 currentSongData.notes[scoreIndex] 比较
         *     （或由 app 自行在 resolveNotes 中实现映射后传 index）。
         *
         * @param {string} [mode='index'] - 'index' 按索引比较 | 'name' 按音名比较
         */
        function check(played, mode) {
            if (!scoreMode || !currentSongData) return;
            if (scoreIndex >= resolved.length) return;

            mode = mode || 'index';

            // 先跳过不可弹的
            skipNonPlayable();
            if (scoreIndex >= resolved.length) {
                // 全部跳完，直接完成
                _doFinish();
                return;
            }

            var expected;
            var match = false;

            if (mode === 'name') {
                // 按音名比较（钢琴模式）
                // resolved 数组存的是过滤后的音名，scoreIndex 是 resolved 中的下标
                expected = resolved[scoreIndex];
                match = (played === expected);
            } else {
                // 按索引比较（颂钵/空灵鼓模式）
                expected = resolved[scoreIndex];
                match = (played === expected);
            }

            if (match) {
                combo++;
                if (combo > maxCombo) maxCombo = combo;

                var prevIndex = scoreIndex;
                scoreIndex++;

                // 跳过后续休止符
                skipNonPlayable();

                var isFinished = scoreIndex >= resolved.length;

                onCorrect({
                    scoreIndex: prevIndex,
                    newScoreIndex: scoreIndex,
                    combo: combo,
                    maxCombo: maxCombo,
                    note: mode === 'name' ? played : null,
                    noteIndex: mode === 'index' ? played : null,
                    totalNotes: resolved.length,
                    isFinished: isFinished
                });

                if (combo >= 3) {
                    onCombo(combo);
                }

                notifyProgress();

                if (isFinished) {
                    _doFinish();
                }
            } else {
                combo = 0;

                var expectedNote;
                if (mode === 'name') {
                    expectedNote = expected;
                } else {
                    // 用音阶音名反查
                    var scaleNames = getScaleNotes ? getScaleNotes() : [];
                    expectedNote = expected >= 0 && expected < scaleNames.length
                        ? scaleNames[expected]
                        : '?';
                }

                onWrong({
                    playedIndex: played,
                    expectedIndex: mode === 'index' ? expected : scoreIndex,
                    expectedNote: expectedNote,
                    scoreIndex: scoreIndex
                });
            }
        }

        /**
         * 触发完成
         */
        function _doFinish() {
            onFinish({
                combo: combo,
                maxCombo: maxCombo,
                totalNotes: resolved.length
            });
        }

        /**
         * 重置当前曲谱到开头
         */
        function reset() {
            scoreIndex = 0;
            combo = 0;
            maxCombo = 0;
            if (currentSongData) {
                resolved = doResolve(currentSongData.notes);
                skipNonPlayable();
            }
            onReset();
            notifyProgress();
        }

        /**
         * 重新解析当前曲谱（音阶变化后调用）
         * 保持 scoreIndex 和 combo 不变，但重新 resolve
         */
        function reResolve() {
            if (!currentSongData) return;
            resolved = doResolve(currentSongData.notes);
        }

        /**
         * 销毁实例，清理状态
         */
        function destroy() {
            scoreMode = false;
            currentSongId = null;
            currentSongData = null;
            scoreIndex = 0;
            combo = 0;
            maxCombo = 0;
            resolved = [];
        }

        /**
         * 获取当前曲谱 ID
         */
        function getCurrentSongId() {
            return currentSongId;
        }

        /**
         * 获取当前曲谱数据 (SONGS[id] 引用)
         */
        function getCurrentSong() {
            return currentSongData;
        }

        /**
         * 获取当前 resolved 数组
         */
        function getResolved() {
            return resolved;
        }

        /**
         * 获取当前 scoreIndex
         */
        function getIndex() {
            return scoreIndex;
        }

        /**
         * 设置 scoreIndex（特殊情况下用，如音阶切换后恢复位置）
         */
        function setIndex(idx) {
            scoreIndex = idx;
            skipNonPlayable();
            notifyProgress();
        }

        /**
         * 获取 combo
         */
        function getCombo() {
            return combo;
        }

        /**
         * 获取 maxCombo
         */
        function getMaxCombo() {
            return maxCombo;
        }

        /**
         * 获取当前进度百分比 (0~100)
         */
        function getProgress() {
            return calcProgress();
        }

        // ── 返回实例 ──
        return {
            // 状态查询
            isActive: isActive,
            getCurrentSongId: getCurrentSongId,
            getCurrentSong: getCurrentSong,
            getResolved: getResolved,
            getIndex: getIndex,
            setIndex: setIndex,
            getCombo: getCombo,
            getMaxCombo: getMaxCombo,
            getProgress: getProgress,

            // 操作
            toggle: toggle,
            loadSong: loadSong,
            check: check,
            reset: reset,
            reResolve: reResolve,
            destroy: destroy
        };
    }

    function noop() {}

    // ════════════════════════════════════════════════════════════════
    // 公开 API
    // ════════════════════════════════════════════════════════════════
    return {
        create: create,
        populateSongSelect: populateSongSelect
    };

})();
