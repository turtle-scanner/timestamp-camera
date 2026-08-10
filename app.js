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
let currentTheme = 'minimal';
let userNickname = '천개의문 / 초수 / 인천';
let userLocation = '인천 연수구 독서실';
let userCustomNote = '가치있는 삶에 전념하기(임용합격) 🔥';
let capturedBlob = null;
let studyStartTime = null;
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

    // Target Exam Date: Nov 21, 2026 (Exact Midnight Comparison)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const examDate = new Date(2026, 10, 21); // Nov 21, 2026
    const diffMs = examDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    let dDayText = 'D-DAY';
    if (diffDays > 0) dDayText = `D-${diffDays}`;
    else if (diffDays < 0) dDayText = `D+${Math.abs(diffDays)}`;

    return { year, month, date, day, hours, minutes, seconds, dDayText, fullDateKey: `${year}-${month}-${date}` };
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
    const studyTimeText = formatTime(timerSeconds);
    const qItem = counselorQuotes[currentQuoteIndex] || counselorQuotes[0];

    if (headerDDay) {
        headerDDay.textContent = `2027 전문상담 1차 ${t.dDayText}`;
    }

    if (!stampOverlay) return;

    const html = `
        <div class="bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/30 shadow-2xl flex flex-col gap-1.5 text-left">
            <div class="flex items-center justify-between">
                <span class="text-amber-400 font-black text-xs tracking-wider">🏆 2027 전문상담 1차 ${t.dDayText}</span>
                <span class="text-xs font-bold text-cyan-300">⏱️ 순공: ${studyTimeText}</span>
            </div>
            <div class="flex items-baseline justify-between py-1 border-y border-white/10">
                <span class="font-display font-black text-2xl text-white tracking-tight leading-none">${t.hours}:${t.minutes}:${t.seconds}</span>
                <span class="text-xs font-bold text-amber-300">${t.year}.${t.month}.${t.date} (${t.day})</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                <span>📍 ${userLocation}</span>
                <span class="text-cyan-300 font-bold">👤 ${userNickname}</span>
            </div>
            <div class="text-[11px] text-cyan-200 font-gowun pt-1 border-t border-white/10 leading-snug">
                💡 <b>${qItem.scholar}</b>: "${qItem.quote}"
            </div>
        </div>
    `;

    stampOverlay.innerHTML = html;
}

// Draw High-Contrast Watermark Stamp on Captured Image Canvas
function drawCanvasStamp(ctx, width, height) {
    try {
        const t = getFormattedTime();
        const studyTimeText = formatTime(timerSeconds);
        const qItem = counselorQuotes[currentQuoteIndex] || counselorQuotes[0];

        ctx.save();

        const topBarHeight = height * 0.12;
        const topGrad = ctx.createLinearGradient(0, 0, 0, topBarHeight);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, topBarHeight);

        const botBarHeight = height * 0.16;
        const botGrad = ctx.createLinearGradient(0, height - botBarHeight, 0, height);
        botGrad.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
        botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.90)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - botBarHeight, width, botBarHeight);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const marginX = width * 0.04;

        // Line 1: D-Day
        ctx.fillStyle = '#fbbf24';
        ctx.font = `800 ${Math.max(16, Math.floor(width * 0.038))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`🏆 2027 전문상담 1차 ${t.dDayText}`, marginX, height * 0.045);

        // Line 2: Quote
        ctx.fillStyle = '#67e8f9';
        ctx.font = `700 ${Math.max(12, Math.floor(width * 0.026))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`💡 ${qItem.scholar}: "${qItem.quote}"`, marginX, height * 0.082);

        // Line 3: Time & Date
        const timeY = height * 0.92;
        const timeFontSize = Math.max(22, Math.floor(width * 0.060));
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${timeFontSize}px "Outfit", sans-serif`;
        ctx.fillText(`${t.hours}:${t.minutes}:${t.seconds}`, marginX, timeY);

        const dateX = marginX + (timeFontSize * 3.8);
        ctx.fillStyle = '#fde047';
        ctx.font = `800 ${Math.max(14, Math.floor(width * 0.035))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`(${t.year}.${t.month}.${t.date} ${t.day})`, dateX, timeY - (height * 0.005));

        // Line 4: Location & Study Time
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `600 ${Math.max(11, Math.floor(width * 0.024))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`📍 ${userLocation} | ⏱️ 순공: ${studyTimeText}`, marginX, height * 0.965);

        ctx.restore();
    } catch (e) {
        console.error('Error drawing canvas stamp:', e);
    }
}

// Camera Initialization Logic
async function initCamera() {
    const video = document.getElementById('videoElement');
    const liveViewportCanvas = document.getElementById('liveViewportCanvas');
    const iosCamBanner = document.getElementById('iosCamBanner');

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

    let success = false;
    for (const constraint of options) {
        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraint);
            video.srcObject = currentStream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
            
            video.style.display = 'block';
            video.classList.remove('hidden');
            if (liveViewportCanvas) liveViewportCanvas.style.display = 'none';
            if (iosCamBanner) iosCamBanner.style.display = 'none';
            success = true;
            break;
        } catch (err) {
            console.warn('Camera constraint attempt failed:', constraint, err);
        }
    }

    if (!success && iosCamBanner) {
        iosCamBanner.style.display = 'flex';
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
    
    if (facingMode === 'user' && video && video.videoWidth > 0) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    
    try {
        if (video && video.videoWidth > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
    } catch (e) {}

    if (facingMode === 'user' && video && video.videoWidth > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    try {
        drawCanvasStamp(ctx, canvas.width, canvas.height);
    } catch (stampErr) {}

    try {
        const dataUrl = canvas.toDataURL('image/png');
        if (resultImage) resultImage.src = dataUrl;

        canvas.toBlob((blob) => {
            capturedBlob = blob;
        }, 'image/png');

        if (galleryPreview) {
            galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
        }

        if (resultModal) {
            resultModal.classList.remove('hidden');
            resultModal.style.display = 'flex';
            resultModal.style.opacity = '1';
        }
    } catch (err) {}
}

// Global Unconditional Click Handler for Start & Capture Button
window.handleStartAndCapture = function(e) {
    if (e) e.preventDefault();

    // 1. Force start stopwatch timer immediately
    isTimerRunning = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        renderLiveStamp();
    }, 1000);

    // 2. Rotate to next quote
    nextQuote();
    renderLiveStamp();

    // 3. Immediately trigger camera file picker or snapshot
    const cameraInput = document.getElementById('cameraInput');
    const video = document.getElementById('videoElement');

    if (currentStream && video && video.videoWidth > 0) {
        triggerSnapshot(e);
    } else if (cameraInput) {
        cameraInput.click();
    }
};

// Handle File/Native Camera Selection Output
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
            
            canvas.toBlob((blob) => {
                capturedBlob = blob;
            }, 'image/png');

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

// Global Instant Initialization
(function initAppNow() {
    // 1. Start Stopwatch Timer 1s Counter Immediately
    isTimerRunning = true;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerUI();
        renderLiveStamp();
    }, 1000);

    // 2. Initial Quote and Live Stamp Render
    updateQuoteUI();
    renderLiveStamp();

    // 3. Auto-Roll Quote every 7s
    setInterval(nextQuote, 7000);

    // 4. Bind Quote Banner Click
    document.addEventListener('DOMContentLoaded', () => {
        const quoteBanner = document.getElementById('quoteBanner');
        if (quoteBanner) quoteBanner.addEventListener('click', nextQuote);

        const cameraInput = document.getElementById('cameraInput');
        const fileInput = document.getElementById('fileInput');

        if (cameraInput) {
            cameraInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                }
            });
        }

        const btnResetTimer = document.getElementById('btnResetTimer');
        if (btnResetTimer) {
            btnResetTimer.addEventListener('click', () => {
                if (confirm('오늘 순공 시간을 초기화하시겠습니까?')) {
                    timerSeconds = 0;
                    updateTimerUI();
                    renderLiveStamp();
                }
            });
        }

        const btnCloseModal = document.getElementById('btnCloseModal');
        const resultModal = document.getElementById('resultModal');
        if (btnCloseModal && resultModal) {
            btnCloseModal.addEventListener('click', () => {
                resultModal.classList.add('hidden');
                resultModal.style.display = 'none';
            });
        }

        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => {
                if (!capturedBlob) return;
                const link = document.createElement('a');
                link.download = `timestamp_${Date.now()}.png`;
                link.href = URL.createObjectURL(capturedBlob);
                link.click();
            });
        }
    });

    // 5. Try starting webcam/camera stream
    initCamera().catch(() => {});
})();
