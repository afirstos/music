// audio-engine.js — Shared audio context for Music Hub apps
// Provides singleton AudioContext, master volume, and reverb utilities

const AudioEngine = (function() {
    let _ctx = null;
    let _masterGain = null;
    let _reverbMap = {};
    let _savedMasterVolume = 0.7;

    function getContext() {
        if (!_ctx) {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
            _masterGain = _ctx.createGain();
            _masterGain.gain.value = 0.7;
            _masterGain.connect(_ctx.destination);
        }
        if (_ctx.state === 'suspended') {
            _ctx.resume();
        }
        return _ctx;
    }

    function getDestination() {
        getContext();
        return _masterGain;
    }

    function getMasterGain() {
        getContext();
        return _masterGain;
    }

    function setVolume(v) {
        getContext();
        _masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, v)), _ctx.currentTime);
    }

    function getVolume() {
        return _masterGain ? _masterGain.gain.value : 0.7;
    }

    /**
     * 创建高质量脉冲响应
     * @param {AudioContext} audioCtx 
     * @param {number} duration - 混响时长（秒）
     * @param {string} type - 'metal' | 'wood' | 'room'
     * @returns {AudioBuffer}
     */
    function createImpulseResponse(audioCtx, duration = 3.5, type = 'metal') {
        const sampleRate = audioCtx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const impulse = audioCtx.createBuffer(2, length, sampleRate);

        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            const channelOffset = ch * 0.0003; // 左右声道微小差异增加空间感

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;

                // 早期反射（前 80ms，模拟腔体内部反射）
                let earlyReflection = 0;
                if (t < 0.08) {
                    // 多个早期反射点，模拟腔体内壁
                    const reflections = [
                        { time: 0.005, amp: 0.9 },
                        { time: 0.015, amp: 0.6 },
                        { time: 0.030, amp: 0.4 },
                        { time: 0.050, amp: 0.25 },
                        { time: 0.070, amp: 0.15 }
                    ];
                    for (const r of reflections) {
                        if (Math.abs(t - r.time - channelOffset) < 0.002) {
                            earlyReflection += r.amp * (Math.random() * 0.5 + 0.5);
                        }
                    }
                }

                // 主衰减（指数衰减）
                let decayCurve;
                if (type === 'metal') {
                    // 金属腔体：衰减慢，有金属微颤
                    const baseDecay = Math.exp(-t * 0.7);
                    const shimmer = 1 + 0.08 * Math.sin(t * 80 + ch * Math.PI);
                    const harmonics = 0.05 * Math.sin(t * 200) * Math.exp(-t * 2);
                    decayCurve = baseDecay * shimmer + harmonics;
                } else if (type === 'wood') {
                    // 木质腔体：衰减快，温暖
                    decayCurve = Math.exp(-t * 1.2) * (1 + 0.03 * Math.sin(t * 30));
                } else {
                    // 通用房间混响
                    decayCurve = Math.exp(-t * 1.0);
                }

                // 噪声成分（带频率特性的噪声）
                const noise = Math.random() * 2 - 1;
                
                // 低频调制让声音更厚实
                const lowFreqMod = 1 + 0.1 * Math.sin(t * 5);

                // 合成最终采样
                const sample = (earlyReflection + noise * decayCurve * lowFreqMod) * 0.85;
                
                // 避免削波
                data[i] = Math.max(-1, Math.min(1, sample));
            }
        }

        return impulse;
    }

    /**
     * 初始化混响（返回干/湿信号的目标节点）
     * @param {string} type - 'metal' | 'wood' | 'room'
     * @param {number} dryWet - 干湿比 0-1，默认 0.4
     * @returns {{ dry: GainNode, wet: GainNode, convolver: ConvolverNode }}
     */
    function initReverb(type = 'metal', dryWet = 0.4) {
        return getReverb(type, dryWet);
    }

    /**
     * 获取混响节点（如果该类型未初始化会自动创建并缓存）
     */
    function getReverb(type = 'metal', dryWet = 0.4) {
        if (_reverbMap[type]) {
            return _reverbMap[type];
        }

        getContext();

        // 创建脉冲响应
        const impulse = createImpulseResponse(_ctx, 3.5, type);

        // 创建混响节点
        const convolver = _ctx.createConvolver();
        convolver.buffer = impulse;

        const dry = _ctx.createGain();
        dry.gain.value = 1 - dryWet;
        dry.connect(_masterGain);

        const wet = _ctx.createGain();
        wet.gain.value = dryWet;
        wet.connect(_masterGain);

        convolver.connect(wet);

        _reverbMap[type] = { dry, wet, convolver };

        return _reverbMap[type];
    }

    /**
     * 设置混响干湿比
     * @param {string} type - 混响类型
     * @param {number} value - 0-1，0=全干，1=全湿
     */
    function setReverbMix(value, type) {
        const entry = type ? _reverbMap[type] : Object.values(_reverbMap)[0];
        if (!entry) return;
        const v = Math.max(0, Math.min(1, value));
        const now = _ctx.currentTime;
        entry.dry.gain.setValueAtTime(1 - v, now);
        entry.wet.gain.setValueAtTime(v, now);
    }

    /**
     * 快速止音
     */
    function muteAll(duration = 0.3) {
        if (!_masterGain) return;
        const now = _ctx.currentTime;
        _savedMasterVolume = _masterGain.gain.value;
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(_savedMasterVolume, now);
        _masterGain.gain.linearRampToValueAtTime(0, now + duration);
        
        // 恢复音量
        setTimeout(() => {
            if (_masterGain) {
                _masterGain.gain.cancelScheduledValues(_ctx.currentTime);
                _masterGain.gain.setValueAtTime(_savedMasterVolume, _ctx.currentTime);
            }
        }, duration * 1000 + 50);
    }

    /**
     * 创建一个连接到 masterGain 的子 GainNode，供每个 app 独立控制音量
     * @returns {GainNode}
     */
    function createSubGain() {
        getContext();
        const sub = _ctx.createGain();
        sub.gain.value = 1.0;
        sub.connect(_masterGain);
        return sub;
    }

    return {
        getContext,
        getDestination,
        getMasterGain,
        setVolume,
        getVolume,
        initReverb,
        getReverb,
        setReverbMix,
        muteAll,
        createImpulseResponse,
        createSubGain
    };
})();

window.AudioEngine = AudioEngine;
