document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const inputBaseW = document.getElementById('base-w');
    const inputBaseH = document.getElementById('base-h');
    const inputResW = document.getElementById('res-w');
    const inputResH = document.getElementById('res-h');
    
    const resPreset = document.getElementById('res-preset');
    const lockBtn = document.getElementById('lock-btn');
    const linkIcon = document.getElementById('link-icon');
    
    const baseRatioText = document.getElementById('base-ratio-text');
    const currentRatioText = document.getElementById('current-ratio-text');
    
    const scaleBtns = document.querySelectorAll('.scale-btn');
    const customScaleInput = document.getElementById('custom-scale-input');
    const evenFixArea = document.getElementById('even-fix-area');
    const snapEvenBtn = document.getElementById('snap-even-btn');
    
    const targetFrame = document.getElementById('target-frame');
    const refFrame = document.getElementById('reference-frame');
    const targetLabel = document.getElementById('target-label');
    const baseLabelText = document.getElementById('base-label-text');
    const infoBadge = document.getElementById('current-info-badge');

    const ratioInfoIcon = document.getElementById('ratio-info-icon');
    const ratioPopup = document.getElementById('ratio-popup');
    const ratioPopupText = document.getElementById('ratio-popup-text');
    const closePopupBtn = document.getElementById('close-popup');

    // SVGs for Link Icon
    const SVG_BROKEN = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2"></path></svg>';
    const SVG_LINKED = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';

    // State
    let isLocked = true;
    let isUpdating = false;
    let currentScale = 100;

    // Helper: GCD
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);

    function getRatio(w, h) {
        if (!w || !h) return "0:0";
        const common = gcd(Math.round(w), Math.round(h));
        return `${Math.round(w) / common}:${Math.round(h) / common}`;
    }

    function checkEvenStatus() {
        const w = parseFloat(inputResW.value);
        const h = parseFloat(inputResH.value);
        const isBad = !Number.isInteger(w) || !Number.isInteger(h) || w % 2 !== 0 || h % 2 !== 0;
        evenFixArea.classList.toggle('hidden', !isBad);
    }

    function updateVisualizer() {
        const bw = parseFloat(inputBaseW.value) || 1;
        const bh = parseFloat(inputBaseH.value) || 1;
        const w = parseFloat(inputResW.value) || 1;
        const h = parseFloat(inputResH.value) || 1;

        const masterMax = Math.max(bw, bh, w, h);

        refFrame.style.width = `${(bw / masterMax) * 100}%`;
        refFrame.style.height = `${(bh / masterMax) * 100}%`;

        targetFrame.style.width = `${(w / masterMax) * 100}%`;
        targetFrame.style.height = `${(h / masterMax) * 100}%`;
        
        targetLabel.textContent = `${Math.round(w)} x ${Math.round(h)}`;
        baseLabelText.textContent = `Original Base (${Math.round(bw)}x${Math.round(bh)})`;
        
        baseRatioText.textContent = getRatio(bw, bh);
        
        // --- Smart Ratio Display Logic ---
        const theoreticalH = (w * bh) / bw;
        const drift = Math.abs(h - theoreticalH);
        const baseRatio = getRatio(bw, bh);
        const actualRatio = getRatio(w, h);

        if (drift > 0 && drift < 2.0) {
            // Drift is small (< 2.0px), show Base Ratio + Info Icon
            currentRatioText.textContent = baseRatio;
            ratioInfoIcon.classList.remove('hidden');
            ratioPopupText.innerHTML = `조절된 정밀 비율은 <strong>${actualRatio}</strong> 이지만, 2픽셀 이내 오차를 무시하면 원본과 동일한 <strong>${baseRatio}</strong> 입니다.`;
        } else {
            // No drift or large drift
            currentRatioText.textContent = actualRatio;
            ratioInfoIcon.classList.add('hidden');
            ratioPopup.classList.add('hidden');
        }

        // --- Reset Button Dynamic Glow ---
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            // Using a tiny epsilon or simple rounding to check for differences
            const diffW = Math.abs(parseFloat(bw) - parseFloat(w));
            const diffH = Math.abs(parseFloat(bh) - parseFloat(h));
            const isModified = diffW > 0.01 || diffH > 0.01;
            resetBtn.classList.toggle('reset-active-glow', isModified);
        }
        
        checkEvenStatus();
    }

    // Popup Toggle
    ratioInfoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        ratioPopup.classList.toggle('hidden');
    });

    closePopupBtn.addEventListener('click', () => {
        ratioPopup.classList.add('hidden');
    });

    document.addEventListener('click', () => {
        ratioPopup.classList.add('hidden');
    });

    ratioPopup.addEventListener('click', e => e.stopPropagation());

    function setLock(state) {
        isLocked = state;
        lockBtn.classList.toggle('active', isLocked);
        lockBtn.querySelector('.lock-icon').textContent = isLocked ? '🔒' : '🔓';
        linkIcon.innerHTML = isLocked ? SVG_LINKED : SVG_BROKEN;
        linkIcon.classList.toggle('active', isLocked);
    }

    lockBtn.addEventListener('click', () => setLock(!isLocked));

    // Input: Base (Original)
    function onBaseChange() {
        if (isUpdating) return;
        isUpdating = true;
        // Apply current scale to new base
        inputResW.value = (parseFloat(inputBaseW.value) * currentScale) / 100;
        inputResH.value = (parseFloat(inputBaseH.value) * currentScale) / 100;
        isUpdating = false;
        updateVisualizer();
    }
    inputBaseW.addEventListener('input', onBaseChange);
    inputBaseH.addEventListener('input', onBaseChange);

    // Input: Scaled
    inputResW.addEventListener('input', () => {
        if (isUpdating) return;
        if (isLocked) {
            isUpdating = true;
            const w = parseFloat(inputResW.value);
            const bw = parseFloat(inputBaseW.value);
            const bh = parseFloat(inputBaseH.value);
            inputResH.value = Math.round((w * bh) / bw);
            isUpdating = false;
        }
        updateScaleFromRes();
        updateVisualizer();
    });

    inputResH.addEventListener('input', () => {
        if (isUpdating) return;
        if (isLocked) {
            isUpdating = true;
            const h = parseFloat(inputResH.value);
            const bw = parseFloat(inputBaseW.value);
            const bh = parseFloat(inputBaseH.value);
            inputResW.value = Math.round((h * bw) / bh);
            isUpdating = false;
        }
        updateScaleFromRes();
        updateVisualizer();
    });

    function updateScaleFromRes() {
        const w = parseFloat(inputResW.value);
        const bw = parseFloat(inputBaseW.value);
        currentScale = (w / bw) * 100;
        customScaleInput.value = Math.round(currentScale * 10) / 10;
        clearScaleHighlights();
    }

    // Preset Dropdown (Applies to Base)
    resPreset.addEventListener('change', () => {
        if (!resPreset.value) return;
        const [w, h] = resPreset.value.split('x').map(Number);
        isUpdating = true;
        inputBaseW.value = w;
        inputBaseH.value = h;
        isUpdating = false;
        onBaseChange();
    });

    // Scaling Controls
    function applyScale(percent) {
        currentScale = percent;
        isUpdating = true;
        inputResW.value = (parseFloat(inputBaseW.value) * percent) / 100;
        inputResH.value = (parseFloat(inputBaseH.value) * percent) / 100;
        isUpdating = false;
        updateVisualizer();
    }

    scaleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clearScaleHighlights();
            // Only add 'active' highlight if it's NOT the reset button
            if (!btn.classList.contains('reset-btn')) {
                btn.classList.add('active');
            }
            const percent = parseFloat(btn.dataset.scale);
            customScaleInput.value = percent === 100 ? "" : percent;
            applyScale(percent);
        });
    });

    customScaleInput.addEventListener('input', () => {
        clearScaleHighlights();
        const percent = parseFloat(customScaleInput.value);
        if (percent > 0) applyScale(percent);
    });

    function clearScaleHighlights() {
        scaleBtns.forEach(b => b.classList.remove('active'));
    }

    // Snap Even with Ratio Preservation (Ceiling Priority to avoid shrinking)
    snapEvenBtn.addEventListener('click', () => {
        isUpdating = true;
        const bw = parseFloat(inputBaseW.value);
        const bh = parseFloat(inputBaseH.value);
        
        // 1. Target Width: Round UP to next Even
        // (Math.ceil(val/2)*2 ensures we never go smaller than original decimal)
        let w = Math.ceil(parseFloat(inputResW.value) / 2) * 2;
        
        // 2. Calculate Height based on exact original ratio from the new Width
        let h_theory = (w * bh) / bw;
        
        // 3. Snap Height: Round UP to next Even
        let h = Math.ceil(h_theory / 2) * 2;
        
        inputResW.value = w;
        inputResH.value = h;
        isUpdating = false;
        
        updateScaleFromRes();
        updateVisualizer();
    });

    // Init
    setLock(true);
    updateVisualizer();
});
