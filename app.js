// Canvas roundRect Polyfill for Older Mobile Browsers & In-App WebViews (KakaoTalk, etc.)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        if (typeof radii === 'number') radii = [radii, radii, radii, radii];
        else if (!Array.isArray(radii)) radii = [0, 0, 0, 0];
        const r = radii[0] || 0;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r);
        this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h);
        this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r);
        this.arcTo(x, y, x + r, y, r);
        return this;
    };
}

// Counselor Motivational Quotes & Core Theory Database
const counselorQuotes = [
    { scholar: "칼 로저스 (Carl Rogers)", theory: "인간중심 상담 - 자아실현", quote: "어느 누구도 나를 바꿀 수 없지만, 나 스스로 완벽한 성장의 힘을 가지고 있다. 🌱" },
    { scholar: "알프레드 아들러 (Alfred Adler)", theory: "개별심리학 - 열등감 보상", quote: "과거의 상처에 갇히지 마라. 우리에겐 목적을 향해 삶을 재창조할 힘이 있다. 🏆" },
    { scholar: "알버트 엘리스 (Albert Ellis)", theory: "REBT - 합리적 신념", quote: "나를 괴롭히는 것은 시험 자체가 아니라, 반드시 합격해야 한다는 당위적 생각이다. 💡" },
    { scholar: "빅터 프랭클 (Viktor Frankl)", theory: "의미치료 - 실존적 의미", quote: "시련 자체에는 의미가 없지만, 그 시련을 견뎌내는 나의 태도 속에 고귀한 의미가 피어난다. ✨" },
    { scholar: "아론 벡 (Aaron Beck)", theory: "인지치료 - 자동적 사고 재구조화", quote: "생각을 바꾸면 감정과 행동이 바뀌고, 결국 내 삶과 합격의 미래가 바뀐다. 🧠" },
    { scholar: "에릭 번 (Eric Berne)", theory: "교류분석 - I'm OK, You're OK", quote: "나는 OK이고 너도 OK이다. 우리는 누구나 수석 합격을 이뤄낼 주인공이다. 👍" },
    { scholar: "프리츠 펄스 (Fritz Perls)", theory: "게슈탈트 - 지금-여기 (Here & Now)", quote: "과거의 미해결 과제에 집착하지 마라. 지금-여기(Here & Now)에 온전히 깨어있으라. ⚡" },
    { scholar: "살바도르 미누친 (Minuchin)", theory: "구조적 가족치료 - 명확한 경계선", quote: "명확한 경계선을 세울 때 내 안의 자율성과 연대감이 비로소 피어난다. 🧱" },
    { scholar: "카를 융 (Carl Jung)", theory: "분석심리학 - 개성화 (Individuation)", quote: "밖을 보는 자는 꿈을 꾸지만, 내면을 들여다보는 자는 비로소 깨어난다. 🌟" },
    { scholar: "마틴 셀리그만 (Seligman)", theory: "긍정심리학 - PERMA 강점", quote: "학습된 무기력에서 벗어나라. 내 안의 강점과 긍정 정서가 성취의 큰 문을 연다. 🔥" }
];

let currentQuoteIndex = 0;
let timerSeconds = 0;
let isTimerRunning = true;
let timerInterval = null;
let currentStream = null;
let facingMode = 'environment';
let capturedBlob = null;
const daysKo = ['일', '월', '화', '수', '목', '금', '토'];

function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function getFormattedTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = daysKo[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const examDate = new Date(2026, 10, 21);
    const diffMs = examDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    let dDayText = 'D-DAY';
    if (diffDays > 0) dDayText = `D-${diffDays}`;
    else if (diffDays < 0) dDayText = `D+${Math.abs(diffDays)}`;

    return { year, month, date, day, hours, minutes, seconds, dDayText };
}

function updateQuoteUI() {
    const quoteScholarEl = document.getElementById('quoteScholar');
    const quoteTheoryEl = document.getElementById('quoteTheory');
    const quoteTextEl = document.getElementById('quoteText');
    const item = counselorQuotes[currentQuoteIndex];
    if (quoteScholarEl) quoteScholarEl.textContent = item.scholar;
    if (quoteTheoryEl) quoteTheoryEl.textContent = item.theory;
    if (quoteTextEl) quoteTextEl.textContent = `"${item.quote}"`;
}

function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % counselorQuotes.length;
    updateQuoteUI();
}

function updateTimerUI() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
}

function renderLiveStamp() {
    const stampOverlay = document.getElementById('stampOverlay');
    const headerDDay = document.getElementById('headerDDay');
    const t = getFormattedTime();
    const qItem = counselorQuotes[currentQuoteIndex] || counselorQuotes[0];

    const selectSubject = document.getElementById('selectSubject');
    const selectTargetGoal = document.getElementById('selectTargetGoal');
    const selectMood = document.getElementById('selectMood');

    const subjectTag = selectSubject ? selectSubject.value : '[전공상담 - 이상심리학]';
    const targetHours = selectTargetGoal ? parseInt(selectTargetGoal.value, 10) : 5;
    const moodTag = selectMood ? selectMood.value : '🔥 열공중';

    const targetSec = targetHours * 3600;
    const progressPct = Math.min(100, Math.round((timerSeconds / targetSec) * 100));
    const studyTimeText = formatTime(timerSeconds);

    if (headerDDay) {
        headerDDay.textContent = `2027 전문상담 1차 ${t.dDayText}`;
    }

    if (!stampOverlay) return;

    stampOverlay.innerHTML = `
        <div class="bg-slate-900/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-cyan-500/30 shadow-2xl flex flex-col gap-1.5 text-left">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-amber-400 font-black text-xs tracking-wider">🏆 2027 전문상담 1차 ${t.dDayText}</span>
                    <span class="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded-md">${subjectTag}</span>
                    <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-1.5 py-0.5 rounded-md">${moodTag}</span>
                </div>
                <span class="text-xs font-bold text-amber-300 shrink-0">${t.year}.${t.month}.${t.date} (${t.day})</span>
            </div>
            <div class="flex items-baseline justify-between py-0.5">
                <span class="font-display font-black text-2xl text-white tracking-tight leading-none">${t.hours}:${t.minutes}:${t.seconds}</span>
                <span class="text-[11px] font-bold text-amber-300">🎯 목표 달성: ${progressPct}% (${studyTimeText}/${targetHours}시간)</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div class="bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400 h-full rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-white/10">
                <span class="text-cyan-200 font-gowun truncate max-w-[65%]">💡 <b>${qItem.scholar}</b>: "${qItem.quote}"</span>
                <span class="text-amber-300 font-bold shrink-0">#${t.dDayText} #상담천개의문</span>
            </div>
        </div>
    `;
}

function drawCanvasStamp(ctx, width, height) {
    try {
        const t = getFormattedTime();
        const qItem = counselorQuotes[currentQuoteIndex] || counselorQuotes[0];

        const selectSubject = document.getElementById('selectSubject');
        const selectTargetGoal = document.getElementById('selectTargetGoal');
        const selectMood = document.getElementById('selectMood');

        const subjectTag = selectSubject ? selectSubject.value : '[전공상담 - 이상심리학]';
        const targetHours = selectTargetGoal ? parseInt(selectTargetGoal.value, 10) : 5;
        const moodTag = selectMood ? selectMood.value : '🔥 열공중';

        const targetSec = targetHours * 3600;
        const progressPct = Math.min(100, Math.round((timerSeconds / targetSec) * 100));
        const studyTimeText = formatTime(timerSeconds);

        ctx.save();

        const topBarHeight = height * 0.14;
        const topGrad = ctx.createLinearGradient(0, 0, 0, topBarHeight);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, topBarHeight);

        const botBarHeight = height * 0.18;
        const botGrad = ctx.createLinearGradient(0, height - botBarHeight, 0, height);
        botGrad.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
        botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - botBarHeight, width, botBarHeight);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const marginX = width * 0.04;

        // Line 1: D-Day & Tags
        ctx.fillStyle = '#fbbf24';
        ctx.font = `800 ${Math.max(16, Math.floor(width * 0.038))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`🏆 2027 전문상담 1차 ${t.dDayText}  ${subjectTag}  ${moodTag}`, marginX, height * 0.048);

        // Line 2: Quote
        ctx.fillStyle = '#67e8f9';
        ctx.font = `700 ${Math.max(12, Math.floor(width * 0.026))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`💡 ${qItem.scholar}: "${qItem.quote}"`, marginX, height * 0.088);

        // Line 3: Time & Date
        const timeY = height * 0.89;
        const timeFontSize = Math.max(22, Math.floor(width * 0.060));
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${timeFontSize}px "Outfit", sans-serif`;
        ctx.fillText(`${t.hours}:${t.minutes}:${t.seconds}`, marginX, timeY);

        const dateX = marginX + (timeFontSize * 3.8);
        ctx.fillStyle = '#fde047';
        ctx.font = `800 ${Math.max(14, Math.floor(width * 0.035))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`(${t.year}.${t.month}.${t.date} ${t.day})`, dateX, timeY - (height * 0.004));

        // Line 4: Progress Bar
        const barY = height * 0.93;
        const barWidth = width * 0.92;
        const barHeight = Math.max(6, Math.floor(height * 0.012));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(marginX, barY, barWidth, barHeight);

        const activeWidth = (barWidth * progressPct) / 100;
        const fillGrad = ctx.createLinearGradient(marginX, 0, marginX + barWidth, 0);
        fillGrad.addColorStop(0, '#22d3ee');
        fillGrad.addColorStop(0.5, '#3b82f6');
        fillGrad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = fillGrad;
        ctx.fillRect(marginX, barY, activeWidth, barHeight);

        // Subline 3: Progress text + Hashtags
        ctx.fillStyle = '#fde047';
        ctx.font = `700 ${Math.max(11, Math.floor(width * 0.025))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`🎯 달성률: ${progressPct}% (${studyTimeText}/${targetHours}h)`, marginX, height * 0.97);

        const tagX = width * 0.58;
        ctx.fillStyle = '#67e8f9';
        ctx.font = `800 ${Math.max(11, Math.floor(width * 0.025))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`#${t.dDayText} #상담천개의문 #합격인증`, tagX, height * 0.97);

        ctx.restore();
    } catch (e) {}
}

// Camera Initialization Logic
async function initCamera() {
    const video = document.getElementById('videoElement');
    if (!video) return;
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.autoplay = true;

    const options = [
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false }
    ];

    for (const constraint of options) {
        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraint);
            video.srcObject = currentStream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
            video.style.display = 'block';
            break;
        } catch (err) {}
    }
}

// Core Snapshot Functionality
function triggerSnapshot(e) {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('snapshotCanvas');
    const resultModal = document.getElementById('resultModal');
    const resultImage = document.getElementById('resultImage');
    const galleryPreview = document.getElementById('galleryPreview');

    nextQuote();
    renderLiveStamp();
    if (!canvas) return;

    const vw = (video && video.videoWidth > 0) ? video.videoWidth : 1280;
    const vh = (video && video.videoHeight > 0) ? video.videoHeight : 720;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');

    try {
        if (video && video.videoWidth > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
    } catch (e) {}

    try {
        drawCanvasStamp(ctx, canvas.width, canvas.height);
    } catch (e) {}

    try {
        const dataUrl = canvas.toDataURL('image/png');
        if (resultImage) resultImage.src = dataUrl;
        canvas.toBlob((blob) => { capturedBlob = blob; }, 'image/png');

        if (galleryPreview) {
            galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
        }
        if (resultModal) {
            resultModal.classList.remove('hidden');
            resultModal.style.display = 'flex';
            resultModal.style.opacity = '1';
        }
    } catch (e) {}
}

window.handleStartAndCapture = function(e) {
    if (e) e.preventDefault();
    isTimerRunning = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        renderLiveStamp();
    }, 1000);

    nextQuote();
    renderLiveStamp();

    const cameraInput = document.getElementById('cameraInput');
    const video = document.getElementById('videoElement');

    if (currentStream && video && video.videoWidth > 0) {
        triggerSnapshot(e);
    } else if (cameraInput) {
        cameraInput.click();
    }
};

function handleFileSelect(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('snapshotCanvas');
            const resultModal = document.getElementById('resultModal');
            const resultImage = document.getElementById('resultImage');
            const galleryPreview = document.getElementById('galleryPreview');

            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            nextQuote();
            renderLiveStamp();
            drawCanvasStamp(ctx, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/png');
            if (resultImage) resultImage.src = dataUrl;
            canvas.toBlob((blob) => { capturedBlob = blob; }, 'image/png');

            if (galleryPreview) {
                galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
            }
            if (resultModal) {
                resultModal.classList.remove('hidden');
                resultModal.style.display = 'flex';
                resultModal.style.opacity = '1';
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Auto Startup Engine
(function initAppNow() {
    isTimerRunning = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        renderLiveStamp();
    }, 1000);

    updateQuoteUI();
    renderLiveStamp();
    setInterval(nextQuote, 7000);

    initCamera().catch(() => {});
})();
