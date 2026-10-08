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
    const examDate = new Date(2026, 10, 28);
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

    if (headerDDay) {
        headerDDay.textContent = `2027 전문상담 1차 ${t.dDayText}`;
    }

    // 촬영 전 화면에서는 카메라를 가리지 않도록 스탬프 오버레이 숨김
    if (stampOverlay) {
        stampOverlay.innerHTML = '';
        stampOverlay.style.display = 'none';
    }
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

        // 1. 상단 / 하단 자연스러운 비네팅
        const topBarHeight = height * 0.16;
        const topGrad = ctx.createLinearGradient(0, 0, 0, topBarHeight);
        topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
        topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, topBarHeight);

        const botBarHeight = height * 0.20;
        const botGrad = ctx.createLinearGradient(0, height - botBarHeight, 0, height);
        botGrad.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
        botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.90)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, height - botBarHeight, width, botBarHeight);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const marginX = width * 0.04;

        // 🌟 2. [천개의 문 1000] 공식 엠블럼 마크 (우측 상단)
        const badgeWidth = Math.max(160, Math.floor(width * 0.32));
        const badgeHeight = Math.max(38, Math.floor(height * 0.055));
        const badgeX = width - badgeWidth - marginX;
        const badgeY = height * 0.035;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(1.5, Math.floor(width * 0.003));
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 14);
        } else {
            ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = `900 ${Math.max(13, Math.floor(width * 0.032))}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚪 천개의 문 1000', badgeX + (badgeWidth / 2), badgeY + (badgeHeight * 0.52));
        ctx.restore();

        // 3. 좌측 상단: D-Day & 과목 / 컨디션 태그
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fde047';
        ctx.font = `800 ${Math.max(15, Math.floor(width * 0.035))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`🏆 2027 전문상담 1차 ${t.dDayText}`, marginX, height * 0.052);

        ctx.fillStyle = '#67e8f9';
        ctx.font = `700 ${Math.max(11, Math.floor(width * 0.024))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`${subjectTag}  ${moodTag}`, marginX, height * 0.088);

        // 4. 하단부: 시계 & 날짜
        const timeY = height * 0.87;
        const timeFontSize = Math.max(26, Math.floor(width * 0.068));
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${timeFontSize}px "Outfit", sans-serif`;
        ctx.fillText(`${t.hours}:${t.minutes}:${t.seconds}`, marginX, timeY);

        const dateX = marginX + (timeFontSize * 3.6);
        ctx.fillStyle = '#fbbf24';
        ctx.font = `800 ${Math.max(13, Math.floor(width * 0.032))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`(${t.year}.${t.month}.${t.date} ${t.day})`, dateX, timeY - (height * 0.005));

        // 5. 하단 프로그레스 바
        const barY = height * 0.915;
        const barWidth = width * 0.92;
        const barHeight = Math.max(6, Math.floor(height * 0.012));

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(marginX, barY, barWidth, barHeight);

        const activeWidth = (barWidth * progressPct) / 100;
        const fillGrad = ctx.createLinearGradient(marginX, 0, marginX + barWidth, 0);
        fillGrad.addColorStop(0, '#06b6d4');
        fillGrad.addColorStop(0.5, '#3b82f6');
        fillGrad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = fillGrad;
        ctx.fillRect(marginX, barY, activeWidth, barHeight);

        // 6. 최하단 정보 & 천개의문1000 해시태그
        ctx.fillStyle = '#fde047';
        ctx.font = `700 ${Math.max(11, Math.floor(width * 0.024))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`🎯 목표 달성률: ${progressPct}% (${studyTimeText}/${targetHours}h)`, marginX, height * 0.965);

        const tagX = width * 0.52;
        ctx.fillStyle = '#67e8f9';
        ctx.font = `800 ${Math.max(11, Math.floor(width * 0.024))}px "Noto Sans KR", sans-serif`;
        ctx.fillText(`#${t.dDayText} #천개의문1000 #수석합격`, tagX, height * 0.965);

        ctx.restore();
    } catch (e) {}
}

// Camera Initialization Logic (4K / FHD High Resolution Prioritized)
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
        {
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 3840, min: 1920 },
                height: { ideal: 2160, min: 1080 }
            },
            audio: false
        },
        {
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        },
        {
            video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        },
        { video: { facingMode: facingMode }, audio: false },
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

// Core High-Definition Snapshot Functionality
async function triggerSnapshot(e) {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('snapshotCanvas');
    const resultModal = document.getElementById('resultModal');
    const resultImage = document.getElementById('resultImage');
    const galleryPreview = document.getElementById('galleryPreview');

    nextQuote();
    renderLiveStamp();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let capturedImageSource = false;

    // 🌟 1. 스마트폰 카메라 원본 센서 고화질 촬영 (ImageCapture API 지원 기기)
    const track = currentStream ? currentStream.getVideoTracks()[0] : null;
    if (window.ImageCapture && track) {
        try {
            const imageCapture = new ImageCapture(track);
            const photoBlob = await imageCapture.takePhoto();
            const imageBitmap = await createImageBitmap(photoBlob);
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            ctx.drawImage(imageBitmap, 0, 0);
            capturedImageSource = true;
        } catch (err) {
            console.warn('ImageCapture 폴백 전환:', err);
        }
    }

    // 🌟 2. 미지원 기기 폴백: 비디오 프레임 최고 해상도로 매핑
    if (!capturedImageSource && video && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // 3. 고화질 스탬프 (천개의 문 1000 마크) 각인
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawCanvasStamp(ctx, canvas.width, canvas.height);

    // 4. 고화질 95% JPEG 데이터 변환
    try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (resultImage) resultImage.src = dataUrl;
        canvas.toBlob((blob) => { capturedBlob = blob; }, 'image/jpeg', 0.95);

        if (galleryPreview) {
            galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
        }
        if (resultModal) {
            resultModal.classList.remove('hidden');
            resultModal.style.display = 'flex';
            resultModal.style.opacity = '1';
        }
    } catch (e) {
        console.error('캡처 데이터 변환 오류:', e);
    }
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
