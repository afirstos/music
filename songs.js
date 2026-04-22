/**
 * songs.js — 共享曲谱库
 * 所有乐器共用，notes 统一用音名格式 ['C4', 'E4', '_', ...]
 * fit: 'all' | 'piano' — 标记适合哪些乐器（默认 all）
 * scaleHint: 建议音阶 key（帮助空灵鼓/颂钵自动选音阶）
 * 颂钵/空灵鼓通过 resolveNotes() 将音名映射到自己的编号
 */
var MusicSongs = (function () {

    var songs = {
        // ── 经典小曲 ──
        twinkle: {
            name: '小星星',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'C4','C4','G4','G4','A4','A4','G4','_','F4','F4','E4','E4','D4','D4','C4','_',
                'G4','G4','F4','F4','E4','E4','D4','_','G4','G4','F4','F4','E4','E4','D4','_',
                'C4','C4','G4','G4','A4','A4','G4','_','F4','F4','E4','E4','D4','D4','C4'
            ]
        },
        ode: {
            name: '欢乐颂',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'E4','E4','F4','G4','G4','F4','E4','D4','C4','C4','D4','E4','E4','_','D4','D4',
                'E4','E4','F4','G4','G4','F4','E4','D4','C4','C4','D4','E4','D4','_','C4','C4'
            ]
        },
        birthday: {
            name: '生日快乐',
            fit: 'piano', // 包含 A#4，只有钢琴能弹
            notes: [
                'C4','C4','D4','C4','F4','E4','_','C4','C4','D4','C4','G4','F4','_',
                'C4','C4','C5','A4','F4','E4','D4','_','A#4','A#4','A4','F4','G4','F4'
            ]
        },
        canon: {
            name: '卡农 (简单版)',
            fit: 'all', scaleHint: { kongling: 'C' },
            notes: [
                'E5','D5','C5','B4','A4','G4','A4','B4','C5','B4','A4','G4','F4','E4','F4','G4',
                'A4','G4','F4','E4','D4','C4','D4','E4'
            ]
        },
        mary: {
            name: '玛丽的小羊羔',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'E4','D4','C4','D4','E4','E4','E4','_','D4','D4','D4','_','E4','G4','G4','_',
                'E4','D4','C4','D4','E4','E4','E4','E4','D4','D4','E4','D4','C4'
            ]
        },

        // ── 空灵鼓/颂钵经典 ──
        sea: {
            name: '沧海一声笑',
            fit: 'all', scaleHint: { songbo: 'chakra', kongling: 'G' },
            notes: [
                'A3','G3','F3','D3','C3','_','C3','D3','F3','G3','A3','_',
                'A3','G3','F3','D3','F3','D3','C3','D3','C3'
            ]
        },
        bigfish: {
            name: '大鱼',
            fit: 'all', scaleHint: { songbo: 'chakra', kongling: 'G' },
            notes: [
                'D3','E3','F3','G3','F3','D3','C3','D3',
                'E3','F3','D3','G3','F3','D3','C3','C3','D3','F3','D3','C3'
            ]
        },
        chakra_med: {
            name: '脉轮冥想',
            fit: 'all', scaleHint: { songbo: 'chakra' },
            notes: [
                'C3','D3','E3','F3','G3','A3','B3','_','B3','A3','G3','F3','E3','D3','C3','_',
                'C3','E3','G3','B3','G3','E3','C3'
            ]
        },
        peaceful: {
            name: '宁静之心',
            fit: 'all', scaleHint: { songbo: 'chakra', kongling: 'G' },
            notes: [
                'C3','E3','G3','E3','C3','E3','G3','E3','C3','G3','E3','C3',
                'G3','E3','C3','E3','G3','C3'
            ]
        },
        bell: {
            name: '晨钟暮鼓',
            fit: 'all', scaleHint: { songbo: 'chakra', kongling: 'G' },
            notes: [
                'C3','C3','D3','C3','_','C3','D3','E3','_','C3','D3','E3','F3','_',
                'C3','C3','E3','_','D3','C3','_','C3'
            ]
        },

        // ── Sahaja Yoga ──
        sennen: {
            name: '千年盛开',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'A4','_','A4','B4','C5','_','B4','A4',
                'G4','_','G4','A4','B4','_','A4','G4',
                'F4','_','F4','G4','A4','C5','_','A4',
                'E4','_','E4','F4','G4','_','F4','E4',
                'A4','C5','E5','_','D5','C5','B4','_','A4',
                'G4','B4','D5','_','C5','B4','A4','_','G4',
                'F4','A4','C5','_','B4','A4','G4','F4','_','E4',
                'A4','_','G4','_','A4'
            ]
        },
        jaijagadambe: {
            name: 'Jai Jagadambe',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'C4','E4','G4','_','G4','A4','G4','_',
                'E4','G4','E4','C4','_','D4','E4','_',
                'F4','A4','C5','_','A4','G4','F4','_',
                'E4','G4','A4','_','G4','_','E4','_',
                'C4','E4','G4','A4','_','G4','E4','_',
                'F4','G4','A4','_','G4','F4','E4','_',
                'D4','F4','A4','_','G4','F4','D4','_',
                'C4','E4','G4','_','C4','_'
            ]
        },
        nirmala: {
            name: 'Nirmala Mata',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'G4','A4','B4','_','A4','G4','E4','_',
                'G4','A4','C5','_','B4','A4','G4','_',
                'E4','G4','A4','G4','_','E4','D4','_',
                'E4','G4','A4','_','G4','_','E4','_',
                'C5','B4','A4','G4','_','A4','B4','_',
                'G4','A4','B4','C5','_','B4','G4','_',
                'A4','G4','E4','G4','_','A4','G4','_',
                'E4','D4','E4','_','G4','_'
            ]
        },
        omnamah: {
            name: 'Om Namah Shivaya',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'E4','_','E4','D4','E4','_','G4','G4','E4','_',
                'A4','_','A4','G4','A4','_','C5','B4','A4','_',
                'G4','E4','G4','A4','_','G4','E4','D4','_','E4','_',
                'A4','G4','E4','_','D4','E4','G4','_','E4','_',
                'G4','A4','C5','_','B4','A4','G4','E4','_',
                'D4','E4','G4','A4','_','G4','_','E4'
            ]
        },
        omtwameva: {
            name: 'Om Twameva',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'E4','E4','G4','A4','_','G4','E4','_',
                'D4','E4','G4','_','E4','_','D4','_',
                'C4','D4','E4','G4','_','A4','G4','_',
                'E4','G4','A4','_','G4','E4','_','C4','_',
                'E4','G4','A4','C5','_','B4','A4','_',
                'G4','A4','B4','_','A4','G4','E4','_',
                'D4','G4','A4','G4','_','E4','D4','_',
                'E4','_','G4','_','E4'
            ]
        },
        ganesha: {
            name: 'Ganesha Vandana',
            fit: 'all', scaleHint: { songbo: 'highC', kongling: 'C' },
            notes: [
                'G4','A4','B4','C5','_','B4','A4','G4','_',
                'E4','G4','A4','G4','_','E4','D4','E4','_',
                'G4','G4','A4','B4','C5','B4','_','A4','G4',
                'E4','F4','G4','A4','_','G4','E4','_',
                'C5','B4','A4','G4','_','A4','B4','C5','_',
                'G4','A4','B4','_','A4','G4','E4','_',
                'D4','E4','G4','A4','G4','_','E4','D4','_','C4'
            ]
        }
    };

    /**
     * 分组信息 — 用于渲染下拉菜单的 optgroup
     */
    var groups = [
        { label: '🎵 经典小曲', keys: ['twinkle','ode','birthday','canon','mary'] },
        { label: '🥁 鼓/钵曲目', keys: ['sea','bigfish','chakra_med','peaceful','bell'] },
        { label: '🙏 Sahaja Yoga', keys: ['sennen','jaijagadambe','nirmala','omnamah','omtwameva','ganesha'] }
    ];

    // 升降号映射：找不到 F# 时尝试 F 或 G
    var SHARP_ALIASES = {
        'C#': ['C','D'], 'D#': ['D','E'], 'F#': ['F','G'],
        'G#': ['G','A'], 'A#': ['A','B']
    };
    var FLAT_TO_SHARP = { 'Db':'C#','Eb':'D#','Fb':'E','Gb':'F#','Ab':'G#','Bb':'A#','Cb':'B' };

    /**
     * 将音名音符列表解析为乐器索引列表
     * 支持八度移位（找不到 C4 时尝试 C3/C5）和升降号模糊映射
     * @param {string[]} notes - 音名列表如 ['C4','E4','_']
     * @param {string[]} scaleNotes - 乐器的可用音名列表如 ['D4','E4','F#4','A4',...]
     * @returns {number[]} - 索引列表（-1=休止符, -2=无法映射）
     */
    function resolveNotes(notes, scaleNotes) {
        return notes.map(function (n) {
            if (n === '_') return -1;
            // 1. 精确匹配
            var idx = scaleNotes.indexOf(n);
            if (idx >= 0) return idx;

            // 2. 解析音名和八度
            var match = n.match(/^([A-Ga-g][#b]?)(\d)$/);
            if (!match) return -2;
            var noteName = match[1], octave = parseInt(match[2]);
            // 标准化降号为升号
            if (FLAT_TO_SHARP[noteName.toUpperCase()]) {
                noteName = FLAT_TO_SHARP[noteName.toUpperCase()];
            }

            // 3. 同八度升降号映射（F#4 → F4 或 G4）
            var aliases = SHARP_ALIASES[noteName];
            if (aliases) {
                for (var a = 0; a < aliases.length; a++) {
                    var alt = aliases[a] + octave;
                    idx = scaleNotes.indexOf(alt);
                    if (idx >= 0) return idx;
                }
            }

            // 4. 相邻八度移位（C4 → C3, C5）
            for (var d = -1; d <= 1; d += 2) {
                var shifted = noteName + (octave + d);
                idx = scaleNotes.indexOf(shifted);
                if (idx >= 0) return idx;
                // 升降号映射 + 八度移位
                if (aliases) {
                    for (var b = 0; b < aliases.length; b++) {
                        idx = scaleNotes.indexOf(aliases[b] + (octave + d));
                        if (idx >= 0) return idx;
                    }
                }
            }

            return -2; // 无法映射
        });
    }

    /**
     * 检查一首曲谱在给定音阶下有多少音符无法映射
     * @param {string[]} notes - 曲谱音名列表
     * @param {string[]} scaleNotes - 乐器的可用音名列表
     * @returns {{ total: number, playable: number, unplayable: number }}
     */
    function checkPlayable(notes, scaleNotes) {
        var resolved = resolveNotes(notes, scaleNotes);
        var total = 0, playable = 0, unplayable = 0;
        for (var i = 0; i < resolved.length; i++) {
            if (resolved[i] === -1) continue; // 休止符不计
            total++;
            if (resolved[i] >= 0) playable++;
            else unplayable++;
        }
        return { total: total, playable: playable, unplayable: unplayable };
    }

    return {
        songs: songs,
        groups: groups,
        resolveNotes: resolveNotes,
        checkPlayable: checkPlayable
    };

})();
