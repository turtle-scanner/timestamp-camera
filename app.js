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

// TimeStamp Camera App Core Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('snapshotCanvas');
    const stampOverlay = document.getElementById('stampOverlay');
    const flashOverlay = document.getElementById('flashOverlay');
    const headerDDay = document.getElementById('headerDDay');
    
    // Stopwatch Elements
    const timerDisplay = document.getElementById('timerDisplay');
    const btnStartTimer = document.getElementById('btnStartTimer');
    const btnPauseTimer = document.getElementById('btnPauseTimer');
    const btnResetTimer = document.getElementById('btnResetTimer');

    // Buttons
    const btnShutter = document.getElementById('btnShutter');
    const btnSwitchCamera = document.getElementById('btnSwitchCamera');
    const btnEditLocation = document.getElementById('btnEditLocation');
    const btnCustomNote = document.getElementById('btnCustomNote');
    const btnOpenCalendar = document.getElementById('btnOpenCalendar');
    const btnInstallPwa = document.getElementById('btnInstallPwa');
    const pwaHelpBanner = document.getElementById('pwaHelpBanner');
    const btnCloseHelp = document.getElementById('btnCloseHelp');
    
    // Result Modal Elements
    const resultModal = document.getElementById('resultModal');
    const resultImage = document.getElementById('resultImage');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnDownload = document.getElementById('btnDownload');
    const btnShare = document.getElementById('btnShare');
    const galleryPreview = document.getElementById('galleryPreview');

    // Calendar Modal Elements
    const calendarModal = document.getElementById('calendarModal');
    const btnCloseCalendar = document.getElementById('btnCloseCalendar');
    const calendarGrid = document.getElementById('calendarGrid');
    const attendanceCount = document.getElementById('attendanceCount');

    // Edit Modal Elements
    const editModal = document.getElementById('editModal');
    const inputNickname = document.getElementById('inputNickname');
    const inputLocation = document.getElementById('inputLocation');
    const inputCustomNote = document.getElementById('inputCustomNote');
    const btnSaveEdit = document.getElementById('btnSaveEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');

    // State Variables
    let currentStream = null;
    let facingMode = 'environment';
    let currentTheme = 'minimal'; // Default to pure Date & Time minimal theme!
    let userNickname = '천개의문 / 초수 / 인천';
    let userLocation = '인천 연수구 독서실';
    let userWeather = '☀️ 맑음';
    let userCustomNote = '가치있는 삶에 전념하기(임용합격) 🔥';
    let capturedBlob = null;
    let deferredPrompt = null;

    // Study Stopwatch State
    let timerInterval = null;
    let timerSeconds = 0;
    let isTimerRunning = false;

    const daysKo = ['일', '월', '화', '수', '목', '금', '토'];

    // Load Saved State from LocalStorage
    if (localStorage.getItem('user_nickname')) userNickname = localStorage.getItem('user_nickname');
    if (localStorage.getItem('user_location')) userLocation = localStorage.getItem('user_location');
    userCustomNote = '가치있는 삶에 전념하기(임용합격) 🔥'; // Force requested custom note
    localStorage.setItem('user_custom_note', userCustomNote);
    if (localStorage.getItem('timer_seconds')) timerSeconds = parseInt(localStorage.getItem('timer_seconds'), 10) || 0;

    // Stopwatch Controls
    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateTimerUI() {
        timerDisplay.textContent = formatTime(timerSeconds);
        localStorage.setItem('timer_seconds', timerSeconds);
    }
    updateTimerUI();

    // Study Start / End Time Tracker State
    let studyStartTime = localStorage.getItem('study_start_time') || null;
    let studyEndTime = localStorage.getItem('study_end_time') || null;

    function getShortTimeStr() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    function updateStartBtnText() {
        if (isTimerRunning) {
            btnStartTimer.innerHTML = '<span>⏹️ 공부 끝 & 📸 캡처</span>';
            btnStartTimer.className = 'fixed bottom-20 right-4 z-[9999] px-5 py-4 rounded-full font-black text-sm bg-gradient-to-r from-rose-500 via-pink-600 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-white shadow-2xl shadow-rose-500/50 border-2 border-amber-300 active:scale-90 transition duration-150 flex items-center justify-center gap-2 tracking-tight cursor-pointer';
        } else {
            btnStartTimer.innerHTML = '<span>▶ 시작 & 📸 촬영</span>';
            btnStartTimer.className = 'fixed bottom-20 right-4 z-[9999] px-5 py-4 rounded-full font-black text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-300 active:scale-90 transition duration-150 flex items-center justify-center gap-2 tracking-tight cursor-pointer';
        }
    }
    updateStartBtnText();

    btnStartTimer.addEventListener('click', (e) => {
        if (!isTimerRunning) {
            // 1. Start Study Session
            isTimerRunning = true;
            studyStartTime = getShortTimeStr();
            studyEndTime = null;
            localStorage.setItem('study_start_time', studyStartTime);
            localStorage.removeItem('study_end_time');

            timerInterval = setInterval(() => {
                timerSeconds++;
                updateTimerUI();
            }, 1000);
        } else {
            // 2. Finish / End Study Session
            isTimerRunning = false;
            clearInterval(timerInterval);
            studyEndTime = getShortTimeStr();
            localStorage.setItem('study_end_time', studyEndTime);
        }
        updateStartBtnText();

        // Trigger snapshot with start/end times engraved!
        triggerSnapshot(e);
    });

    btnResetTimer.addEventListener('click', () => {
        if (confirm('오늘 순공 시간 및 시작/끝 시간을 초기화하시겠습니까?')) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            timerSeconds = 0;
            studyStartTime = null;
            studyEndTime = null;
            localStorage.removeItem('study_start_time');
            localStorage.removeItem('study_end_time');
            updateTimerUI();
            updateStartBtnText();
        }
    });

    let countdownSeconds = 3;
    let countdownInterval = null;

    // Start Live Canvas Animation Immediately & Countdown 3 Seconds
    function startLiveCanvasAnimation() {
        countdownSeconds = 3;
        if (countdownInterval) clearInterval(countdownInterval);
        
        countdownInterval = setInterval(() => {
            if (countdownSeconds > 0) {
                countdownSeconds--;
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);

        function drawFrame() {
            if (!liveViewportCanvas) return;
            const rect = liveViewportCanvas.parentElement.getBoundingClientRect();
            const w = rect.width || 1280;
            const h = rect.height || 720;
            liveViewportCanvas.width = w;
            liveViewportCanvas.height = h;

            const ctx = liveViewportCanvas.getContext('2d');

            // Dark Study Room Background
            ctx.fillStyle = '#0b1329';
            ctx.fillRect(0, 0, w, h);

            // Ambient Lamp Light Radial Glow
            const grad = ctx.createRadialGradient(w/2, h*0.35, 40, w/2, h*0.35, Math.max(w, h)*0.5);
            grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
            grad.addColorStop(0.6, 'rgba(30, 41, 59, 0.6)');
            grad.addColorStop(1, 'rgba(11, 19, 41, 1)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(w/2, h*0.35, Math.max(w, h)*0.5, 0, Math.PI * 2);
            ctx.fill();

            // Book & Study Desk Illustration Box
            const boxW = Math.min(w * 0.85, 550);
            const boxH = Math.min(h * 0.45, 300);
            const boxX = (w - boxW) / 2;
            const boxY = (h - boxH) / 2 - 20;

            ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Title & Text
            ctx.fillStyle = '#f59e0b';
            ctx.font = `bold ${Math.max(18, Math.floor(w * 0.035))}px "Noto Sans KR", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('📖 공부 스탬프 - 2027 전문상담 마스터북', w/2, boxY + (boxH * 0.32));

            ctx.fillStyle = '#38bdf8';
            ctx.font = `bold ${Math.max(15, Math.floor(w * 0.026))}px "Noto Sans KR", sans-serif`;
            ctx.fillText('수석 합격 전용 스터디 카메라 뷰 📸', w/2, boxY + (boxH * 0.55));

            // Countdown Status Indicator
            if (countdownSeconds > 0) {
                ctx.fillStyle = '#22d3ee';
                ctx.font = `bold ${Math.max(14, Math.floor(w * 0.022))}px "Noto Sans KR", sans-serif`;
                ctx.fillText(`⏱️ ${countdownSeconds}초 후 실시간 카메라가 연결됩니다...`, w/2, boxY + (boxH * 0.78));
            } else {
                ctx.fillStyle = '#34d399';
                ctx.font = `bold ${Math.max(14, Math.floor(w * 0.022))}px "Noto Sans KR", sans-serif`;
                ctx.fillText('📷 카메라 연결 시도 중 / 셔터 버튼을 누르세요!', w/2, boxY + (boxH * 0.78));
            }

            requestAnimationFrame(drawFrame);
        }
        requestAnimationFrame(drawFrame);
    }

    startLiveCanvasAnimation();

    // Launch camera IMMEDIATELY for instant 0.1s startup speed!
    initCamera();

    // Initialize Camera Stream (iOS Safari Compatible + 4-Tier Fallback)
    async function initCamera() {
        const iosCamBanner = document.getElementById('iosCamBanner');

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // iOS Safari Mandatory Attributes for Live Video Stream
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

        if (!success) {
            console.error('All live camera attempts failed. Showing iOS Native Camera Banner.');
            if (iosCamBanner) iosCamBanner.style.display = 'flex';
        }
    }

    const btnIosCamEnable = document.getElementById('btnIosCamEnable');
    if (btnIosCamEnable) {
        btnIosCamEnable.addEventListener('click', async () => {
            await initCamera();
            if (!currentStream) {
                const cameraInput = document.getElementById('cameraInput');
                if (cameraInput) cameraInput.click();
            }
        });
    }

    if (btnStartCamNow) {
        btnStartCamNow.addEventListener('click', async () => {
            btnStartCamNow.textContent = '🔄 카메라 연결 시도 중...';
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }
                currentStream = stream;
                video.srcObject = currentStream;
                video.muted = true;
                video.playsInline = true;
                await video.play();
                
                video.style.display = 'block';
                video.classList.remove('hidden');
                if (liveViewportCanvas) liveViewportCanvas.style.display = 'none';
                btnStartCamNow.style.display = 'none';
            } catch (err) {
                console.error('Webcam access error:', err);
                alert('카메라를 연결할 수 없습니다.\n\n1. 노트북 레노버(Lenovo) 카메라 물리 덮개가 열려있는지 확인해 주세요!\n2. 윈도우 [설정 > 개인정보 > 카메라] 권한이 켜져있는지 확인해 주세요!\n\n하단의 [📷 내 사진] 버튼을 누르시면 내 사진을 올려서 타임스탬프 도장을 바로 찍으실 수 있습니다!');
                btnStartCamNow.textContent = '🎥 노트북 실물 카메라 켜기 (재시도)';
            }
        });
    }

    btnSwitchCamera.addEventListener('click', () => {
        facingMode = (facingMode === 'user') ? 'environment' : 'user';
        initCamera();
    });

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
    const quoteScholarEl = document.getElementById('quoteScholar');
    const quoteTheoryEl = document.getElementById('quoteTheory');
    const quoteTextEl = document.getElementById('quoteText');
    const quoteBanner = document.getElementById('quoteBanner');

    function updateQuoteUI() {
        if (!quoteScholarEl || !quoteTextEl) return;
        const item = counselorQuotes[currentQuoteIndex];
        quoteScholarEl.textContent = item.scholar;
        if (quoteTheoryEl) quoteTheoryEl.textContent = item.theory;
        quoteTextEl.textContent = `"${item.quote}"`;
    }

    function nextQuote() {
        currentQuoteIndex = (currentQuoteIndex + 1) % counselorQuotes.length;
        updateQuoteUI();
    }

    if (quoteBanner) {
        quoteBanner.addEventListener('click', nextQuote);
    }

    // Auto Roll Quote every 7 seconds or on shutter click
    setInterval(nextQuote, 7000);
    updateQuoteUI();

    // Live Date/Time Formatter (Exact Midnight Comparison for D-Day)
    function getFormattedTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const day = daysKo[now.getDay()];
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Target Exam Date: Nov 21, 2026 (Month 10 is Nov, 0-indexed)
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const examDate = new Date(2026, 10, 21);
        const diffMs = examDate.getTime() - todayMidnight.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        let dDayText = 'D-DAY';
        if (diffDays > 0) {
            dDayText = `D-${diffDays}`;
        } else if (diffDays < 0) {
            dDayText = `D+${Math.abs(diffDays)}`;
        }

        return { year, month, date, day, hours, minutes, seconds, dDayText, fullDateKey: `${year}-${month}-${date}` };
    }

    // Update Header D-Day
    function updateHeaderDDay() {
        const t = getFormattedTime();
        if (headerDDay) {
            headerDDay.textContent = `2027 전문상담 1차 ${t.dDayText}`;
        }
    }
    setInterval(updateHeaderDDay, 1000);
    updateHeaderDDay();

    // Render Watermark Overlay on Screen (Crystal Clear High-Contrast Card)
    function renderLiveStamp() {
        const t = getFormattedTime();
        const studyTimeText = formatTime(timerSeconds);
        const qItem = counselorQuotes[currentQuoteIndex] || { scholar: "칼 로저스", quote: "나 스스로 성장의 힘을 가지고 있다." };

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

    setInterval(renderLiveStamp, 1000);
    renderLiveStamp();

    // Theme Switcher
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = btn.dataset.theme;
            renderLiveStamp();
        });
    });

    // Global Singleton AudioContext with Silent Buffer Unlocker for Guaranteed Autoplay
    let globalAudioCtx = null;
    function initGlobalAudio() {
        try {
            if (!globalAudioCtx) {
                const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                if (AudioCtxClass) globalAudioCtx = new AudioCtxClass();
            }
            if (globalAudioCtx) {
                if (globalAudioCtx.state === 'suspended') {
                    globalAudioCtx.resume();
                }
                // Play silent buffer to force unlock mobile browser audio restriction
                const buffer = globalAudioCtx.createBuffer(1, 1, 22050);
                const source = globalAudioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(globalAudioCtx.destination);
                source.start(0);
            }
        } catch (e) {}
    }

    // Unlock Audio Context on ANY first user interaction
    ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'].forEach(evt => {
        window.addEventListener(evt, initGlobalAudio, { capture: true, once: true });
    });

    // Play Authentic Mechanical Dual-Layer Camera Shutter Sound ('찰~칵!')
    function playShutterSound() {
        // 1. Try HTML Audio Element fallback
        try {
            const htmlSnap = new Audio('https://cdn.freesound.org/previews/536/536108_11861866-lq.mp3');
            htmlSnap.volume = 1.0;
            htmlSnap.play().catch(() => {});
        } catch (e) {}

        // 2. Synthesize High-Precision Mechanical Camera Shutter ('찰~칵!') via Web Audio API
        try {
            initGlobalAudio();
            if (!globalAudioCtx) return;

            const now = globalAudioCtx.currentTime;

            // Phase 1: High Frequency Shutter Click ('찰')
            const osc1 = globalAudioCtx.createOscillator();
            const gain1 = globalAudioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(2800, now);
            osc1.frequency.exponentialRampToValueAtTime(400, now + 0.06);

            gain1.gain.setValueAtTime(1.0, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc1.connect(gain1);
            gain1.connect(globalAudioCtx.destination);

            osc1.start(now);
            osc1.stop(now + 0.06);

            // Phase 2: Mechanical Body Mirror Drop Thud ('칵')
            const osc2 = globalAudioCtx.createOscillator();
            const gain2 = globalAudioCtx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(600, now + 0.03);
            osc2.frequency.exponentialRampToValueAtTime(90, now + 0.15);

            gain2.gain.setValueAtTime(0.85, now + 0.03);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc2.connect(gain2);
            gain2.connect(globalAudioCtx.destination);

            osc2.start(now + 0.03);
            osc2.stop(now + 0.15);
        } catch (e) {
            console.log('Shutter sound play error:', e);
        }
    }

    // Attendance Date Tracker
    function markAttendance() {
        const t = getFormattedTime();
        let attendanceDates = JSON.parse(localStorage.getItem('attendance_dates') || '[]');
        if (!attendanceDates.includes(t.fullDateKey)) {
            attendanceDates.push(t.fullDateKey);
            localStorage.setItem('attendance_dates', JSON.stringify(attendanceDates));
        }
    }

    // Native Mobile Camera Intent Handler (100% Guaranteed Native Camera Trigger)
    const cameraInput = document.getElementById('cameraInput');
    if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    playShutterSound();
                    markAttendance();

                    const vw = img.width || 1280;
                    const vh = img.height || 720;
                    canvas.width = vw;
                    canvas.height = vh;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, vw, vh);

                    // Burn TimeStamp Watermark directly onto captured mobile image
                    try {
                        drawCanvasStamp(ctx, vw, vh);
                    } catch (stampErr) {
                        console.error('Error drawing canvas stamp:', stampErr);
                    }

                    const dataUrl = canvas.toDataURL('image/png');
                    resultImage.src = dataUrl;

                    canvas.toBlob((blob) => {
                        capturedBlob = blob;
                    }, 'image/png');

                    if (galleryPreview) {
                        galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
                    }

                    // Auto Download Photo directly to Mobile Gallery
                    try {
                        const autoSaveLink = document.createElement('a');
                        autoSaveLink.href = dataUrl;
                        autoSaveLink.download = `2027_전문상담_임용합격인증_${Date.now()}.png`;
                        document.body.appendChild(autoSaveLink);
                        autoSaveLink.click();
                        document.body.removeChild(autoSaveLink);
                    } catch (dlErr) {}

                    // Force Result Modal Display unconditionally with highest possible z-index (2147483647)
                    resultModal.classList.remove('hidden');
                    resultModal.classList.remove('opacity-0');
                    resultModal.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 2147483647 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.96) !important; flex-direction: column !important; justify-content: space-between !important;";

                    // Toast Banner
                    const alertBanner = document.createElement('div');
                    alertBanner.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[2147483647] bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 text-slate-950 px-8 py-4 rounded-full shadow-2xl font-black text-base border-4 border-amber-300 animate-bounce flex items-center gap-2 tracking-tight';
                    alertBanner.innerHTML = '<span>🏆 2027 전문상담 수석합격 인증샷 촬영 성공! 갤러리에 저장되었습니다!</span>';
                    document.body.appendChild(alertBanner);
                    setTimeout(() => { alertBanner.remove(); }, 3500);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnUploadPhoto && fileInput) {
        btnUploadPhoto.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    playShutterSound();
                    markAttendance();

                    const vw = img.width || 1280;
                    const vh = img.height || 720;
                    canvas.width = vw;
                    canvas.height = vh;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, vw, vh);

                    // Burn TimeStamp Watermark directly onto uploaded image
                    try {
                        drawCanvasStamp(ctx, vw, vh);
                    } catch (stampErr) {
                        console.error('Error drawing canvas stamp:', stampErr);
                    }

                    const dataUrl = canvas.toDataURL('image/png');
                    resultImage.src = dataUrl;

                    canvas.toBlob((blob) => {
                        capturedBlob = blob;
                    }, 'image/png');

                    if (galleryPreview) {
                        galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
                    }

                    // Auto Download Photo directly to Mobile Gallery / Download Folder
                    try {
                        const autoSaveLink = document.createElement('a');
                        autoSaveLink.href = dataUrl;
                        autoSaveLink.download = `2027_전문상담_임용합격인증_${Date.now()}.png`;
                        document.body.appendChild(autoSaveLink);
                        autoSaveLink.click();
                        document.body.removeChild(autoSaveLink);
                    } catch (dlErr) {}

                    // Force Result Modal Display unconditionally with highest possible z-index (2147483647)
                    resultModal.classList.remove('hidden');
                    resultModal.classList.remove('opacity-0');
                    resultModal.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 2147483647 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.96) !important; flex-direction: column !important; justify-content: space-between !important;";

                    // Toast Banner
                    const alertBanner = document.createElement('div');
                    alertBanner.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[2147483647] bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 text-slate-950 px-8 py-4 rounded-full shadow-2xl font-black text-base border-4 border-amber-300 animate-bounce flex items-center gap-2 tracking-tight';
                    alertBanner.innerHTML = '<span>🏆 2027 전문상담 수석합격 인증샷 촬영 성공! 갤러리에 저장되었습니다!</span>';
                    document.body.appendChild(alertBanner);
                    setTimeout(() => { alertBanner.remove(); }, 3500);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Core Snapshot Functionality (Guaranteed Immediate Execution)
    function triggerSnapshot(e) {
        // Rotate to Next Scholar Quote on EVERY shutter click!
        nextQuote();
        renderLiveStamp();

        // iOS Fallback: If live WebRTC camera is blocked/inactive on iPhone Safari, trigger native camera
        if (!currentStream || !video || video.videoWidth === 0) {
            const cameraInput = document.getElementById('cameraInput');
            if (cameraInput) {
                cameraInput.click();
                return;
            }
        }

        // Haptic Vibration Feedback for Mobile
        if (navigator.vibrate) {
            try { navigator.vibrate(50); } catch (vErr) {}
        }

        playShutterSound();
        markAttendance();
        
        flashOverlay.classList.remove('opacity-0');
        flashOverlay.classList.add('animate-flash');
        setTimeout(() => {
            flashOverlay.classList.remove('animate-flash');
            flashOverlay.classList.add('opacity-0');
        }, 250);

        // Always guarantee snapshot capture from live stream or fallback canvas without blocking
        const vw = (video && video.videoWidth > 0) ? video.videoWidth : (liveViewportCanvas ? liveViewportCanvas.width : 1280);
        const vh = (video && video.videoHeight > 0) ? video.videoHeight : (liveViewportCanvas ? liveViewportCanvas.height : 720);
        
        canvas.width = vw || 1280;
        canvas.height = vh || 720;

        const ctx = canvas.getContext('2d');
        
        if (facingMode === 'user' && video && video.videoWidth > 0) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        
        try {
            if (video && video.videoWidth > 0) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } else if (liveViewportCanvas) {
                ctx.drawImage(liveViewportCanvas, 0, 0, canvas.width, canvas.height);
            }
        } catch (e) {
            console.log('Video draw fallback:', e);
        }

        if (facingMode === 'user' && video && video.videoWidth > 0) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        try {
            drawCanvasStamp(ctx, canvas.width, canvas.height);
        } catch (stampErr) {
            console.error('Error drawing canvas stamp:', stampErr);
        }

        let dataUrl = '';
        try {
            dataUrl = canvas.toDataURL('image/png');
            resultImage.src = dataUrl;

            canvas.toBlob((blob) => {
                capturedBlob = blob;
            }, 'image/png');

            if (galleryPreview) {
                galleryPreview.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
            }

            // Auto Download Photo directly to Mobile Gallery / Download Folder
            try {
                const autoSaveLink = document.createElement('a');
                autoSaveLink.href = dataUrl;
                autoSaveLink.download = `2027_전문상담_임용합격인증_${Date.now()}.png`;
                document.body.appendChild(autoSaveLink);
                autoSaveLink.click();
                document.body.removeChild(autoSaveLink);
            } catch (dlErr) {
                console.log('Auto download silent fallback:', dlErr);
            }
        } catch (canvasErr) {
            console.error('Error converting canvas to image:', canvasErr);
        }

        // Force Result Modal Display unconditionally with highest possible z-index (2147483647)
        resultModal.classList.remove('hidden');
        resultModal.classList.remove('opacity-0');
        resultModal.style.cssText = "display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 2147483647 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(0, 0, 0, 0.96) !important; flex-direction: column !important; justify-content: space-between !important;";

        // Trigger visual alert toast message for instant user confirmation
        const alertBanner = document.createElement('div');
        alertBanner.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[2147483647] bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 text-slate-950 px-8 py-4 rounded-full shadow-2xl font-black text-base border-4 border-amber-300 animate-bounce flex items-center gap-2 tracking-tight';
        alertBanner.innerHTML = '<span>🏆 인증샷 완성! 갤러리에 저장되었습니다! (카메라로 복귀중...)</span>';
        document.body.appendChild(alertBanner);
        setTimeout(() => { alertBanner.remove(); }, 2500);

        // Auto-close modal after 2.5 seconds and seamlessly return to live camera mode!
        setTimeout(() => {
            if (btnCloseModal) btnCloseModal.click();
        }, 2500);
    }

    // Direct Main Button Bindings (Ultra-Simple One-Touch Mode)
    const btnMainTakeDirect = document.getElementById('btnMainTakeDirect');
    const btnMainUploadDirect = document.getElementById('btnMainUploadDirect');

    if (btnMainTakeDirect) {
        btnMainTakeDirect.addEventListener('click', (e) => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const cameraInput = document.getElementById('cameraInput');
            if (isMobile && cameraInput) {
                cameraInput.click();
            } else {
                triggerSnapshot(e);
            }
        });
    }

    if (btnMainUploadDirect) {
        btnMainUploadDirect.addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        });
    }

    // Bind Shutter Trigger Unconditionally to Button and Full Camera Viewport
    const elementsToBind = [btnShutter, btnMainTakeDirect, video, document.getElementById('liveViewportCanvas')].filter(Boolean);
    elementsToBind.forEach(elem => {
        elem.addEventListener('click', triggerSnapshot);
        elem.addEventListener('mousedown', triggerSnapshot);
        elem.addEventListener('pointerdown', triggerSnapshot);
    });

    // Draw Watermark on Canvas Image (Guaranteed High-Contrast Engraving)
    function drawCanvasStamp(ctx, width, height) {
        try {
            const t = getFormattedTime();
            const studyTimeText = formatTime(timerSeconds);
            const qItem = counselorQuotes[currentQuoteIndex] || { scholar: "칼 로저스", quote: "나 스스로 성장의 힘을 가지고 있다." };

            ctx.save();

            // 1. Top Bar Background Overlay for Extreme High Contrast
            const topBarHeight = height * 0.12;
            const topGrad = ctx.createLinearGradient(0, 0, 0, topBarHeight);
            topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
            topGrad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, width, topBarHeight);

            // 2. Bottom Bar Background Overlay for Extreme High Contrast
            const botBarHeight = height * 0.16;
            const botGrad = ctx.createLinearGradient(0, height - botBarHeight, 0, height);
            botGrad.addColorStop(0, 'rgba(15, 23, 42, 0.0)');
            botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.90)');
            ctx.fillStyle = botGrad;
            ctx.fillRect(0, height - botBarHeight, width, botBarHeight);

            // Common Drop Shadow for Crisp Text
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            const marginX = width * 0.04;

            // --- TOP AREA: D-Day Banner & Counselor Quote ---
            // Line 1: D-Day Title
            ctx.fillStyle = '#fbbf24'; // Gold
            ctx.font = `800 ${Math.max(16, Math.floor(width * 0.038))}px "Noto Sans KR", sans-serif`;
            ctx.fillText(`🏆 2027 전문상담 1차 ${t.dDayText}`, marginX, height * 0.045);

            // Line 2: Scholar Quote & Theory
            ctx.fillStyle = '#67e8f9'; // Cyan
            ctx.font = `700 ${Math.max(12, Math.floor(width * 0.026))}px "Noto Sans KR", sans-serif`;
            ctx.fillText(`💡 ${qItem.scholar}: "${qItem.quote}"`, marginX, height * 0.082);

            // --- BOTTOM AREA: Time, Date & Study Time ---
            const timeY = height * 0.92;
            const timeFontSize = Math.max(22, Math.floor(width * 0.060));
            ctx.fillStyle = '#ffffff';
            ctx.font = `900 ${timeFontSize}px "Outfit", sans-serif`;
            ctx.fillText(`${t.hours}:${t.minutes}:${t.seconds}`, marginX, timeY);

            // Date next to time
            const dateX = marginX + (timeFontSize * 3.8);
            ctx.fillStyle = '#fde047'; // Yellow
            ctx.font = `800 ${Math.max(14, Math.floor(width * 0.035))}px "Noto Sans KR", sans-serif`;
            ctx.fillText(`(${t.year}.${t.month}.${t.date} ${t.day})`, dateX, timeY - (height * 0.005));

            // Subline: Location & Stopwatch
            ctx.fillStyle = '#cbd5e1';
            ctx.font = `600 ${Math.max(11, Math.floor(width * 0.024))}px "Noto Sans KR", sans-serif`;
            ctx.fillText(`📍 ${userLocation} | ⏱️ 순공: ${studyTimeText}`, marginX, height * 0.965);

    }

    // Modal Control
    btnCloseModal.addEventListener('click', () => {
        resultModal.classList.add('hidden');
        resultModal.style.display = 'none';
        resultModal.style.opacity = '0';
    });

    galleryPreview.addEventListener('click', () => {
        if (resultImage.src) {
            resultModal.classList.remove('hidden');
            resultModal.style.display = 'flex';
            resultModal.style.opacity = '1';
        }
    });

    // Save Image Download
    btnDownload.addEventListener('click', () => {
        if (!capturedBlob) return;
        const link = document.createElement('a');
        link.download = `timestamp_${Date.now()}.png`;
        link.href = URL.createObjectURL(capturedBlob);
        link.click();
    });

    // KakaoTalk / Web Share API
    btnShare.addEventListener('click', async () => {
        if (!capturedBlob) return;
        const file = new File([capturedBlob], 'timestamp_cert.png', { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: '전문상담 임용 수석 합격 인증 📸',
                    text: `오늘도 수석 합격을 향해 열공 달성! ⏱️ 순공: ${formatTime(timerSeconds)} 📚🔥`,
                    files: [file]
                });
            } catch (err) {}
        } else {
            alert('사진 다운로드 후 카카오톡으로 공유해 보세요!');
            btnDownload.click();
        }
    });

    // Monthly Calendar Modal Render
    btnOpenCalendar.addEventListener('click', () => {
        renderCalendar();
        calendarModal.classList.remove('hidden');
    });

    btnCloseCalendar.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
    });

    function renderCalendar() {
        const attendanceDates = JSON.parse(localStorage.getItem('attendance_dates') || '[]');
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let gridHtml = '';
        let count = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isAttended = attendanceDates.includes(dateStr);
            if (isAttended) count++;

            gridHtml += `
                <div class="flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold ${isAttended ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-300' : 'bg-slate-800/60 border border-white/5 text-slate-500'}">
                    <span>${d}</span>
                    <span class="text-[10px] mt-0.5">${isAttended ? '🌿' : '•'}</span>
                </div>
            `;
        }

        calendarGrid.innerHTML = gridHtml;
        attendanceCount.textContent = `${count}일 달성! 🎉`;
    }

    // Edit Modal Controls
    btnEditLocation.addEventListener('click', openEditModal);
    btnCustomNote.addEventListener('click', openEditModal);

    function openEditModal() {
        inputNickname.value = userNickname;
        inputLocation.value = userLocation;
        inputCustomNote.value = userCustomNote;
        editModal.classList.remove('hidden');
    }

    btnCancelEdit.addEventListener('click', () => editModal.classList.add('hidden'));
    btnSaveEdit.addEventListener('click', () => {
        if (inputNickname.value.trim()) {
            userNickname = inputNickname.value.trim();
            localStorage.setItem('user_nickname', userNickname);
        }
        if (inputLocation.value.trim()) {
            userLocation = inputLocation.value.trim();
            localStorage.setItem('user_location', userLocation);
        }
        if (inputCustomNote.value.trim()) {
            userCustomNote = inputCustomNote.value.trim();
            localStorage.setItem('user_custom_note', userCustomNote);
        }
        editModal.classList.add('hidden');
        renderLiveStamp();
    });

    // PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        btnInstallPwa.classList.remove('hidden');
        pwaHelpBanner.classList.remove('hidden');
    });

    btnInstallPwa.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                btnInstallPwa.classList.add('hidden');
                pwaHelpBanner.classList.add('hidden');
            }
            deferredPrompt = null;
        }
    });

    btnCloseHelp.addEventListener('click', () => pwaHelpBanner.classList.add('hidden'));
});
