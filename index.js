
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let activeSound = null;
    let currentQuote = null;
    let selectedMood = null;
    let currentMeditation = null;
    let meditationAudio = null;
    let breathInterval;
    let isBreathing = false;
    let isPaused = false;
    let currentStep = 0;
    let breathPhases = [];
    let breathTimer = 0;
    let totalSeconds = 0;
    let moodChart = null;

    // DOM Elements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const darkModeSwitch = document.getElementById('dark-mode-switch');
    const greetingMessage = document.getElementById('greeting-message');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const breathCircle = document.getElementById('breath-circle');
    const breathPulse = document.getElementById('breath-pulse');
    const startBtn = document.getElementById('start-breath');
    const pauseBtn = document.getElementById('pause-breath');
    const resetBtn = document.getElementById('reset-breath');
    const breathPattern = document.getElementById('breath-pattern');
    const soundsGrid = document.getElementById('sounds-grid');
    const masterVolume = document.getElementById('master-volume');
    const meditationList = document.getElementById('meditation-list');
    const meditationPlayer = document.getElementById('meditation-player');
    const quoteDisplay = document.querySelector('#quote-display');
    const newQuoteBtn = document.getElementById('new-quote');
    const saveQuoteBtn = document.getElementById('save-quote');
    const shareQuoteBtn = document.getElementById('share-quote');
    const savedQuotesContainer = document.getElementById('saved-quotes');
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const moodNotes = document.getElementById('mood-notes');
    const saveMoodBtn = document.getElementById('save-mood');
    const moodHistory = document.getElementById('mood-history');
    const viewStatsBtn = document.getElementById('view-stats');
    const clearHistoryBtn = document.getElementById('clear-history');
    const moodStatsContainer = document.getElementById('mood-stats-container');
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');

    // Initialize app
    initApp();

    function initApp() {
        // Set dark mode if enabled
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeSwitch.checked = true;
            darkModeToggle.innerHTML = '<i class="material-icons">light_mode</i>';
            darkModeToggle.title = 'وضع النهار';
        }

        // Set greeting message
        setGreeting();

        // Load active tab
        const savedTab = localStorage.getItem('activeTab') || 'breathing';
        document.querySelector(`.tab-btn[data-tab="${savedTab}"]`).click();

        // Initialize breathing exercises
        initBreathing();

        // Initialize sounds
        initSounds();

        // Initialize meditations
        initMeditations();

        // Initialize quotes
        initQuotes();

        // Initialize mood tracker
        initMoodTracker();

        // Initialize settings
        initSettings();

        // Load stats
        loadBreathStats();
    }

    function setGreeting() {
        const hour = new Date().getHours();
        let greeting = '';

        if (hour < 12) {
            greeting = 'صباح الخير!';
        } else if (hour < 18) {
            greeting = 'مساء الخير!';
        } else {
            greeting = 'مساء الخير!';
        }

        greetingMessage.textContent = greeting;
    }

    // Tab switching functionality
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Save active tab to localStorage
            localStorage.setItem('activeTab', tabId);

            // If mood tab is selected, load mood stats
            if (tabId === 'mood') {
                loadMoodStats();
            }
        });
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    darkModeSwitch.addEventListener('change', toggleDarkMode);

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);

        if (isDarkMode) {
            darkModeToggle.innerHTML = '<i class="material-icons">light_mode</i>';
            darkModeToggle.title = 'وضع النهار';
        } else {
            darkModeToggle.innerHTML = '<i class="material-icons">dark_mode</i>';
            darkModeToggle.title = 'وضع الليل';
        }
    }

    // Breathing Exercise Functionality
    function initBreathing() {
        // Load saved pattern
        const savedPattern = localStorage.getItem('breathPattern') || '4-4-4-4';
        breathPattern.value = savedPattern;

        // Update stats
        updateBreathStats();

        breathPattern.addEventListener('change', function() {
            localStorage.setItem('breathPattern', this.value);
        });

        startBtn.addEventListener('click', startBreathing);
        pauseBtn.addEventListener('click', pauseBreathing);
        resetBtn.addEventListener('click', resetBreathing);
    }

    function startBreathing() {
        if (isBreathing && !isPaused) return;
        
        if (isPaused) {
            // Resume from pause
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            breathInterval = setInterval(updateBreathing, 1000);
            return;
        }
        
        // Start new session
        isBreathing = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = true;
        
        const pattern = breathPattern.value.split('-');
        breathPhases = [
            { name: "شهيق", duration: parseInt(pattern[0]) },
            { name: "حبس", duration: parseInt(pattern[1]) },
            { name: "زفير", duration: parseInt(pattern[2]) }
        ];
        
        if (pattern.length > 3 && parseInt(pattern[3]) > 0) {
            breathPhases.push({ name: "انتظر", duration: parseInt(pattern[3]) });
        }
        
        currentStep = 0;
        breathTimer = breathPhases[currentStep].duration;
        totalSeconds = 0;
        updateBreathDisplay();

        // Animation based on step
        if (currentStep === 0) {
            breathCircle.style.transform = 'scale(1.1)';
            breathCircle.style.backgroundColor = '#5D12D2';
            breathPulse.style.opacity = '0';
        } else if (currentStep === 2) {
            breathCircle.style.transform = 'scale(0.9)';
            breathCircle.style.backgroundColor = '#B931FC';
        }
        
        breathInterval = setInterval(updateBreathing, 1000);
        
        // Save session count
        const today = new Date().toDateString();
        const sessions = JSON.parse(localStorage.getItem('breathSessions')) || { total: 0, days: {}, time: 0 };
        
        sessions.total += 1;
        sessions.days[today] = (sessions.days[today] || 0) + 1;
        
        localStorage.setItem('breathSessions', JSON.stringify(sessions));
        updateBreathStats();
    }

    function updateBreathing() {
        breathTimer--;
        totalSeconds++;
        
        if (breathTimer <= 0) {
            currentStep = (currentStep + 1) % breathPhases.length;
            breathTimer = breathPhases[currentStep].duration;
            
            // Animation based on step
            if (currentStep === 0) {
                // Inhale - grow
                breathCircle.style.backgroundColor = '#5D12D2';
                breathCircle.style.transform = 'scale(1.1)';
                breathPulse.style.opacity = '0';
            } else if (currentStep === 1) {
                // Hold
                breathPulse.style.opacity = '0.7';
                breathPulse.style.animation = 'pulse 2s infinite';
            } else if (currentStep === 2) {
                // Exhale - shrink
                breathCircle.style.backgroundColor = '#B931FC';
                breathCircle.style.transform = 'scale(0.9)';
                breathPulse.style.opacity = '0';
            } else {
                // Wait
                breathPulse.style.opacity = '0';
            }
        }
        
        updateBreathDisplay();
    }

    function updateBreathDisplay() {
        breathCircle.textContent = `${breathPhases[currentStep].name}\n${breathTimer}`;
    }

    function pauseBreathing() {
        isPaused = true;
        clearInterval(breathInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        breathCircle.textContent = "متوقف";
        breathPulse.style.opacity = '0';
        breathPulse.style.animation = 'none';
    }

    function resetBreathing() {
        clearInterval(breathInterval);
        isBreathing = false;
        isPaused = false;
        breathCircle.textContent = "جاهز";
        breathCircle.style.transform = 'scale(1)';
        breathCircle.style.backgroundColor = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        breathPulse.style.opacity = '0';
        breathPulse.style.animation = 'none';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resetBtn.disabled = true;

        // Update total time
        if (totalSeconds > 0) {
            const sessions = JSON.parse(localStorage.getItem('breathSessions')) || { total: 0, days: {}, time: 0 };
            sessions.time += Math.floor(totalSeconds / 60);
            localStorage.setItem('breathSessions', JSON.stringify(sessions));
            updateBreathStats();
        }
    }

    function updateBreathStats() {
        const sessions = JSON.parse(localStorage.getItem('breathSessions')) || { total: 0, days: {}, time: 0 };
        const today = new Date().toDateString();
        
        document.getElementById('today-sessions').textContent = sessions.days[today] || 0;
        document.getElementById('total-sessions').textContent = sessions.total;
        document.getElementById('total-time').textContent = sessions.time;
    }

    function loadBreathStats() {
        const sessions = JSON.parse(localStorage.getItem('breathSessions')) || { total: 0, days: {}, time: 0 };
        const statsContainer = document.getElementById('breath-stats');
        statsContainer.innerHTML = '';

        // Calculate streak
        let streak = 0;
        const dates = Object.keys(sessions.days).sort();
        const today = new Date();
        let currentDate = new Date(today);

        for (let i = 0; i < 30; i++) {
            const dateStr = currentDate.toDateString();
            if (sessions.days[dateStr]) {
                streak++;
            } else if (streak > 0) {
                break;
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Add stats cards
        const stats = [
            { label: "أيام متتالية", value: streak, icon: "local_fire_department" },
            { label: "متوسط الجلسات", value: sessions.total > 0 ? Math.round(sessions.total / Object.keys(sessions.days).length) : 0, icon: "avg_pace" },
            { label: "أفضل يوم", value: Math.max(...Object.values(sessions.days)), icon: "stars" },
            { label: "إجمالي الدقائق", value: sessions.time, icon: "timer" }
        ];

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stats-card';
            card.innerHTML = `
                <div class="stats-value">${stat.value}</div>
                <div class="stats-label">${stat.label}</div>
                <i class="material-icons" style="margin-top: 15px; color: var(--accent);">${stat.icon}</i>
            `;
            statsContainer.appendChild(card);
        });
    }

    // Sounds Functionality
    function initSounds() {
        const sounds = [
            { id: 'rain', name: 'المطر', desc: 'صوت مطر هادئ مع رعد بعيد', img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'waves', name: 'أمواج البحر', desc: 'أمواج المحيط الهادئة', img: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'forest', name: 'الغابة', desc: 'أصوات الطيور وأوراق الشجر في الغابة', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'birds', name: 'الطيور', desc: 'زقزقة الطيور في الصباح', img: 'https://images.unsplash.com/photo-1470114716159-e389f8712fda?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'wind', name: 'الرياح', desc: 'صوت الرياح عبر الأشجار', img: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'stream', name: 'جدول ماء', desc: 'صوت مياه متدفقة في النهر', img: 'https://images.unsplash.com/photo-1531512073830-ba890ca4eba2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'whitenoise', name: 'الضوضاء البيضاء', desc: 'ضوضاء ثابتة لإخفاء الأصوات المزعجة', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { id: 'singingbowl', name: 'وعاء غناء', desc: 'أصوات وعاء غناء تبتي', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
        ];

        // Load saved volume
        const savedVolume = localStorage.getItem('masterVolume') || '0.5';
        masterVolume.value = savedVolume;
        Howler.volume(parseFloat(savedVolume));

        // Create sound cards
        sounds.forEach(sound => {
            const card = document.createElement('div');
            card.className = 'sound-card';
            card.innerHTML = `
                <div class="sound-img" style="background-image: url('${sound.img}')"></div>
                <div class="sound-info">
                    <div class="sound-title">${sound.name}</div>
                    <div class="sound-desc">${sound.desc}</div>
                    <input type="range" min="0" max="1" step="0.1" value="0.5" class="volume-control" data-sound="${sound.id}">
                </div>
            `;
            
            card.addEventListener('click', () => toggleSound(sound.id));
            soundsGrid.appendChild(card);
            
            // Load saved sound volume
            const savedSoundVolume = localStorage.getItem(`soundVolume_${sound.id}`) || '0.5';
            card.querySelector('.volume-control').value = savedSoundVolume;
        });

        // Volume controls
        document.querySelectorAll('.volume-control').forEach(control => {
            control.addEventListener('input', function() {
                const soundId = this.getAttribute('data-sound');
                if (soundId) {
                    // Individual sound volume
                    const sound = soundPlayers.find(s => s.id === soundId);
                    if (sound) {
                        sound.player.volume(parseFloat(this.value) * parseFloat(masterVolume.value));
                    }
                    localStorage.setItem(`soundVolume_${soundId}`, this.value);
                } else {
                    // Master volume
                    Howler.volume(parseFloat(this.value));
                    soundPlayers.forEach(sound => {
                        const control = document.querySelector(`.volume-control[data-sound="${sound.id}"]`);
                        if (control) {
                            sound.player.volume(parseFloat(control.value) * parseFloat(this.value));
                        }
                    });
                    localStorage.setItem('masterVolume', this.value);
                }
            });
        });

        // Initialize sound players
        const soundPlayers = sounds.map(sound => ({
            id: sound.id,
            player: new Howl({
                src: [`https://assets.mixkit.co/sfx/preview/${sound.id}.mp3`],
                loop: true,
                volume: parseFloat(document.querySelector(`.volume-control[data-sound="${sound.id}"]`).value) * parseFloat(masterVolume.value)
            })
        }));

        function toggleSound(soundId) {
            const card = document.querySelector(`.sound-card:nth-child(${sounds.findIndex(s => s.id === soundId) + 1})`);
            const sound = soundPlayers.find(s => s.id === soundId);
            
            if (!sound) return;
            
            if (activeSound === soundId) {
                // Stop this sound
                sound.player.stop();
                card.classList.remove('active');
                activeSound = null;
                document.getElementById('sound-mixer').style.display = 'none';
            } else {
                // Stop any currently playing sound
                if (activeSound) {
                    const activeSoundObj = soundPlayers.find(s => s.id === activeSound);
                    if (activeSoundObj) {
                        activeSoundObj.player.stop();
                    }
                    document.querySelector(`.sound-card:nth-child(${sounds.findIndex(s => s.id === activeSound) + 1})`).classList.remove('active');
                }
                
                // Start new sound
                sound.player.play();
                card.classList.add('active');
                activeSound = soundId;
                
                // Show mixer if more than one sound is available
                if (sounds.length > 1) {
                    document.getElementById('sound-mixer').style.display = 'block';
                }
            }
        }
    }

    // Meditation Functionality
    function initMeditations() {
        const meditations = [
            { id: 1, title: 'التأمل للمبتدئين', duration: '5 دقائق', level: 'مبتدئ', desc: 'جلسة تأمل قصيرة للمبتدئين لتعلم الأساسيات', audio: 'meditation1.mp3' },
            { id: 2, title: 'التنفس الواعي', duration: '10 دقائق', level: 'متوسط', desc: 'تركيز على التنفس لتهدئة العقل وتقليل التوتر', audio: 'meditation2.mp3' },
            { id: 3, title: 'مسح الجسم', duration: '15 دقائق', level: 'متوسط', desc: 'استكشاف الأحاسيس الجسدية لتحقيق الاسترخاء العميق', audio: 'meditation3.mp3' },
            { id: 4, title: 'التأمل المحب', duration: '20 دقائق', level: 'متقدم', desc: 'تطوير مشاعر الحب واللطف تجاه الذات والآخرين', audio: 'meditation4.mp3' },
            { id: 5, title: 'النوم العميق', duration: '30 دقائق', level: 'متقدم', desc: 'تأمل موجه للنوم المريح والاسترخاء العميق', audio: 'meditation5.mp3' }
        ];

        meditations.forEach(med => {
            const item = document.createElement('div');
            item.className = 'meditation-item';
            item.innerHTML = `
                <div class="meditation-icon">
                    <i class="material-icons">self_improvement</i>
                </div>
                <div class="meditation-details">
                    <div class="meditation-title">${med.title}</div>
                    <div class="meditation-meta">
                        <div class="meditation-duration">
                            <i class="material-icons">schedule</i> ${med.duration}
                        </div>
                        <div class="meditation-level">
                            <i class="material-icons">grade</i> ${med.level}
                        </div>
                    </div>
                    <div class="meditation-desc">${med.desc}</div>
                </div>
                <div class="play-btn">
                    <i class="material-icons">play_arrow</i>
                </div>
            `;
            
            item.addEventListener('click', () => playMeditation(med));
            meditationList.appendChild(item);
        });

        // Player controls
        document.getElementById('play-pause-meditation').addEventListener('click', toggleMeditation);
        document.getElementById('stop-meditation').addEventListener('click', stopMeditation);
    }

    function playMeditation(meditation) {
        // Stop current meditation if playing
        if (meditationAudio) {
            meditationAudio.stop();
        }

        // Set current meditation
        currentMeditation = meditation;

        // Show player
        meditationPlayer.style.display = 'block';

        // Initialize audio
        meditationAudio = new Howl({
            src: [`sounds/${meditation.audio}`],
            onplay: () => {
                document.getElementById('play-pause-meditation').innerHTML = '<i class="material-icons">pause</i> إيقاف';
            },
            onpause: () => {
                document.getElementById('play-pause-meditation').innerHTML = '<i class="material-icons">play_arrow</i> تشغيل';
            },
            onend: () => {
                document.getElementById('play-pause-meditation').innerHTML = '<i class="material-icons">play_arrow</i> تشغيل';
            }
        });

        // Play audio
        meditationAudio.play();

        // Update UI
        document.getElementById('play-pause-meditation').innerHTML = '<i class="material-icons">pause</i> إيقاف';
    }

    function toggleMeditation() {
        if (!meditationAudio) return;

        if (meditationAudio.playing()) {
            meditationAudio.pause();
        } else {
            meditationAudio.play();
        }
    }

    function stopMeditation() {
        if (!meditationAudio) return;

        meditationAudio.stop();
        meditationPlayer.style.display = 'none';
        document.getElementById('play-pause-meditation').innerHTML = '<i class="material-icons">play_arrow</i> تشغيل';
    }

    // Quotes Functionality
    function initQuotes() {
        const quotes = [
            { text: "السلام لا يعني أن تكون في مكان خالٍ من المشاكل، بل يعني أن تكون في مكان مليء بالمشاكل وتظل هادئًا في قلبك.", author: "مجهول" },
            { text: "أعظم اكتشاف لأي جيل هو أن الإنسان يمكنه تغيير حياته بتغيير موقفه.", author: "ويليام جيمس" },
            { text: "في وسط كل صعوبة تكمن الفرصة.", author: "ألبرت أينشتاين" },
            { text: "لا يمكنك عبور البحر بمجرد الوقوف والتحديق في الماء.", author: "رابندرانات طاغور" },
            { text: "الرحلة الألف ميل تبدأ بخطوة واحدة.", author: "لاوتزو" },
            { text: "كن أنت التغيير الذي تريد أن تراه في العالم.", author: "المهاتما غاندي" },
            { text: "كل ما نحن عليه هو نتيجة أفكارنا.", author: "بوذا" },
            { text: "الحياة ليست مشكلة يجب حلها، بل واقع يجب اختباره.", author: "سورين كيركغور" },
            { text: "الوقت الذي تقضيه في التأمل ليس وقتًا ضائعًا، إنه استثمار في سلامك الداخلي.", author: "مجهول" },
            { text: "عندما تتنفس، أنت تأخذ القوة من الله. عندما تزفر، فإنها تخدم العالم.", author: "مجهول" }
        ];

        // Load saved quotes
        loadSavedQuotes();

        newQuoteBtn.addEventListener('click', displayRandomQuote);
        saveQuoteBtn.addEventListener('click', saveCurrentQuote);
        shareQuoteBtn.addEventListener('click', shareCurrentQuote);

        // Display initial quote
        displayRandomQuote();
    }

    function displayRandomQuote() {
        const quotes = [
            { text: "السلام لا يعني أن تكون في مكان خالٍ من المشاكل، بل يعني أن تكون في مكان مليء بالمشاكل وتظل هادئًا في قلبك.", author: "مجهول" },
            { text: "أعظم اكتشاف لأي جيل هو أن الإنسان يمكنه تغيير حياته بتغيير موقفه.", author: "ويليام جيمس" },
            { text: "في وسط كل صعوبة تكمن الفرصة.", author: "ألبرت أينشتاين" },
            { text: "لا يمكنك عبور البحر بمجرد الوقوف والتحديق في الماء.", author: "رابندرانات طاغور" },
            { text: "الرحلة الألف ميل تبدأ بخطوة واحدة.", author: "لاوتزو" },
            { text: "كن أنت التغيير الذي تريد أن تراه في العالم.", author: "المهاتما غاندي" },
            { text: "كل ما نحن عليه هو نتيجة أفكارنا.", author: "بوذا" },
            { text: "الحياة ليست مشكلة يجب حلها، بل واقع يجب اختباره.", author: "سورين كيركغور" },
            { text: "الوقت الذي تقضيه في التأمل ليس وقتًا ضائعًا، إنه استثمار في سلامك الداخلي.", author: "مجهول" },
            { text: "عندما تتنفس، أنت تأخذ القوة من الله. عندما تزفر، فإنها تخدم العالم.", author: "مجهول" }
        ];

        const randomIndex = Math.floor(Math.random() * quotes.length);
        currentQuote = quotes[randomIndex];
        
        quoteDisplay.querySelector('.quote-text').textContent = currentQuote.text;
        quoteDisplay.querySelector('.quote-author').textContent = currentQuote.author;
    }

    function saveCurrentQuote() {
        if (!currentQuote) return;
        
        const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];
        
        // Check if quote already exists
        const exists = savedQuotes.some(q => 
            q.text === currentQuote.text && q.author === currentQuote.author
        );
        
        if (!exists) {
            savedQuotes.push(currentQuote);
            localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
            loadSavedQuotes();
            showToast('تم حفظ الاقتباس بنجاح!', 'success');
        } else {
            showToast('هذا الاقتباس محفوظ مسبقاً!', 'warning');
        }
    }

    function shareCurrentQuote() {
        if (!currentQuote) return;
        
        const text = `"${currentQuote.text}" - ${currentQuote.author}\n\nمشاركة من تطبيق نوار للاسترخاء`;
        
        if (navigator.share) {
            navigator.share({
                title: 'اقتباس ملهم',
                text: text,
            }).catch(err => {
                console.log('Error sharing:', err);
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
    }

    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('تم نسخ الاقتباس إلى الحافظة!', 'success');
    }

    function loadSavedQuotes() {
        const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];
        savedQuotesContainer.innerHTML = '';
        
        if (savedQuotes.length === 0) {
            savedQuotesContainer.innerHTML = '<p>لا توجد اقتباسات محفوظة بعد.</p>';
            return;
        }
        
        savedQuotes.forEach((quote, index) => {
            const quoteEl = document.createElement('div');
            quoteEl.className = 'saved-quote-card';
            quoteEl.innerHTML = `
                <button class="delete-quote-btn" data-index="${index}">
                    <i class="material-icons">delete</i>
                </button>
                <p class="saved-quote-text">${quote.text}</p>
                <p class="saved-quote-author">- ${quote.author}</p>
            `;
            
            savedQuotesContainer.appendChild(quoteEl);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-quote-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                deleteSavedQuote(index);
            });
        });
    }

    function deleteSavedQuote(index) {
        showModal(
            'حذف الاقتباس',
            'هل أنت متأكد أنك تريد حذف هذا الاقتباس؟ لا يمكن التراجع عن هذا الإجراء.',
            () => {
                const savedQuotes = JSON.parse(localStorage.getItem('savedQuotes')) || [];
                savedQuotes.splice(index, 1);
                localStorage.setItem('savedQuotes', JSON.stringify(savedQuotes));
                loadSavedQuotes();
                showToast('تم حذف الاقتباس بنجاح!', 'success');
            }
        );
    }

    // Mood Tracker Functionality
    function initMoodTracker() {
        moodEmojis.forEach(emoji => {
            emoji.addEventListener('click', function() {
                moodEmojis.forEach(e => e.classList.remove('selected'));
                this.classList.add('selected');
                selectedMood = parseInt(this.getAttribute('data-mood'));
            });
        });

        saveMoodBtn.addEventListener('click', saveMoodEntry);
        viewStatsBtn.addEventListener('click', toggleMoodStats);
        clearHistoryBtn.addEventListener('click', confirmClearHistory);

        // Load mood history
        loadMoodHistory();
    }

    function saveMoodEntry() {
        if (!selectedMood) {
            showToast('الرجاء اختيار مزاجك أولاً', 'warning');
            return;
        }

        const entry = {
            date: new Date().toLocaleString('ar-SA'),
            mood: selectedMood,
            notes: moodNotes.value.trim(),
            activities: []
        };

        const moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        moodEntries.push(entry);
        localStorage.setItem('moodEntries', JSON.stringify(moodEntries));

        loadMoodHistory();
        showToast('تم حفظ حالتك المزاجية بنجاح!', 'success');

        // Reset form
        moodEmojis.forEach(e => e.classList.remove('selected'));
        moodNotes.value = '';
        selectedMood = null;
    }

    function loadMoodHistory() {
        const moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        moodHistory.innerHTML = '';

        if (moodEntries.length === 0) {
            moodHistory.innerHTML = '<p>لا توجد سجلات مزاجية حتى الآن.</p>';
            return;
        }

        // Display in reverse order (newest first)
        moodEntries.slice().reverse().forEach((entry, index) => {
            const emoji = getMoodEmoji(entry.mood);
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-info">
                    <div class="history-date">${entry.date}</div>
                    <div class="history-notes">${entry.notes || 'لا توجد ملاحظات'}</div>
                    ${entry.activities && entry.activities.length > 0 ? 
                        `<div class="history-activities">
                            <i class="material-icons">tag</i>
                            ${entry.activities.join('، ')}
                        </div>` : ''
                    }
                </div>
                <div class="history-mood">${emoji}</div>
            `;
            
            moodHistory.appendChild(item);
        });
    }

    function toggleMoodStats() {
        const isVisible = moodStatsContainer.style.display === 'block';
        moodStatsContainer.style.display = isVisible ? 'none' : 'block';
        viewStatsBtn.innerHTML = isVisible ? 
            '<i class="material-icons">bar_chart</i> الإحصائيات' : 
            '<i class="material-icons">close</i> إغلاق الإحصائيات';

        if (!isVisible) {
            loadMoodStats();
        }
    }

    function loadMoodStats() {
        const moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        const statsContainer = document.getElementById('mood-stats');
        statsContainer.innerHTML = '';

        if (moodEntries.length === 0) return;

        // Calculate stats
        const totalEntries = moodEntries.length;
        const avgMood = (moodEntries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries).toFixed(1);
        const bestDay = moodEntries.reduce((best, entry) => entry.mood > best.mood ? entry : best, { mood: 0 });
        const worstDay = moodEntries.reduce((worst, entry) => entry.mood < worst.mood ? entry : worst, { mood: 6 });

        // Add stats cards
        const stats = [
            { label: "متوسط المزاج", value: avgMood, icon: "insights" },
            { label: "إجمالي التسجيلات", value: totalEntries, icon: "library_books" },
            { label: "أفضل يوم", value: bestDay.mood, icon: "sentiment_very_satisfied" },
            { label: "أسوأ يوم", value: worstDay.mood, icon: "sentiment_very_dissatisfied" }
        ];

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stats-card';
            card.innerHTML = `
                <div class="stats-value">${stat.value}</div>
                <div class="stats-label">${stat.label}</div>
                <i class="material-icons" style="margin-top: 15px; color: var(--accent);">${stat.icon}</i>
            `;
            statsContainer.appendChild(card);
        });

        // Create mood chart
        createMoodChart(moodEntries);
    }

    function createMoodChart(entries) {
        const ctx = document.getElementById('mood-chart').getContext('2d');
        
        // Group entries by date
        const groupedEntries = entries.reduce((groups, entry) => {
            const date = entry.date.split(',')[0];
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
            return groups;
        }, {});

        // Calculate average mood per day
        const dates = Object.keys(groupedEntries).sort();
        const avgMoods = dates.map(date => {
            const dayEntries = groupedEntries[date];
            return (dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length).toFixed(1);
        });

        if (moodChart) {
            moodChart.destroy();
        }

        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'متوسط المزاج',
                    data: avgMoods,
                    backgroundColor: 'rgba(93, 18, 210, 0.2)',
                    borderColor: 'rgba(93, 18, 210, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 1,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                return getMoodEmoji(value);
                            },
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `المزاج: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function confirmClearHistory() {
        showModal(
            'مسح سجل المزاج',
            'هل أنت متأكد أنك تريد مسح سجل المزاج بالكامل؟ لا يمكن التراجع عن هذا الإجراء.',
            () => {
                localStorage.removeItem('moodEntries');
                loadMoodHistory();
                showToast('تم مسح سجل المزاج بنجاح!', 'success');
            }
        );
    }

    function getMoodEmoji(moodValue) {
        switch(parseInt(moodValue)) {
            case 1: return '😞';
            case 2: return '🙁';
            case 3: return '😐';
            case 4: return '🙂';
            case 5: return '😊';
            default: return '😐';
        }
    }

    // Settings Functionality
    function initSettings() {
        // Theme color
        const savedTheme = localStorage.getItem('themeColor') || 'purple';
        document.getElementById('theme-color').value = savedTheme;
        document.getElementById('theme-color').addEventListener('change', function() {
            localStorage.setItem('themeColor', this.value);
            applyTheme(this.value);
        });

        // Font size
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        document.getElementById('font-size').value = savedFontSize;
        document.getElementById('font-size').addEventListener('change', function() {
            localStorage.setItem('fontSize', this.value);
            applyFontSize(this.value);
        });

        // Notifications
        const savedBreathNotifications = localStorage.getItem('breathNotifications') === 'true';
        document.getElementById('breath-notifications').checked = savedBreathNotifications;
        document.getElementById('breath-notifications').addEventListener('change', function() {
            localStorage.setItem('breathNotifications', this.checked);
        });

        const savedMoodNotifications = localStorage.getItem('moodNotifications') === 'true';
        document.getElementById('mood-notifications').checked = savedMoodNotifications;
        document.getElementById('mood-notifications').addEventListener('change', function() {
            localStorage.setItem('moodNotifications', this.checked);
        });

        // Daily reminder
        const savedReminder = localStorage.getItem('dailyReminder') || '';
        document.getElementById('daily-reminder').value = savedReminder;
        document.getElementById('daily-reminder').addEventListener('change', function() {
            localStorage.setItem('dailyReminder', this.value);
            setupReminder(this.value);
        });

        // Data management
        document.getElementById('backup-data').addEventListener('click', backupData);
        document.getElementById('restore-data').addEventListener('click', restoreData);
        document.getElementById('clear-cache').addEventListener('click', confirmClearCache);
        document.getElementById('reset-data').addEventListener('click', confirmResetData);
        document.getElementById('reset-app').addEventListener('click', confirmResetApp);
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        
        switch(theme) {
            case 'purple':
                root.style.setProperty('--primary', '#5D12D2');
                root.style.setProperty('--secondary', '#B931FC');
                root.style.setProperty('--accent', '#FF6AC2');
                break;
            case 'blue':
                root.style.setProperty('--primary', '#4a6fa5');
                root.style.setProperty('--secondary', '#166088');
                root.style.setProperty('--accent', '#4fc3f7');
                break;
            case 'green':
                root.style.setProperty('--primary', '#4a8c5a');
                root.style.setProperty('--secondary', '#2e5d3a');
                root.style.setProperty('--accent', '#81c784');
                break;
            case 'red':
                root.style.setProperty('--primary', '#c75a5a');
                root.style.setProperty('--secondary', '#8c2e2e');
                root.style.setProperty('--accent', '#ff8a80');
                break;
        }
    }

    function applyFontSize(size) {
        const root = document.documentElement;
        
        switch(size) {
            case 'small':
                root.style.fontSize = '14px';
                break;
            case 'medium':
                root.style.fontSize = '16px';
                break;
            case 'large':
                root.style.fontSize = '18px';
                break;
        }
    }

    function setupReminder(time) {
        // In a real app, this would use the Notifications API
        console.log(`Reminder set for ${time}`);
    }

    function backupData() {
        const data = {
            breathSessions: localStorage.getItem('breathSessions'),
            savedQuotes: localStorage.getItem('savedQuotes'),
            moodEntries: localStorage.getItem('moodEntries'),
            settings: {
                themeColor: localStorage.getItem('themeColor'),
                fontSize: localStorage.getItem('fontSize'),
                darkMode: localStorage.getItem('darkMode'),
                breathNotifications: localStorage.getItem('breathNotifications'),
                moodNotifications: localStorage.getItem('moodNotifications'),
                dailyReminder: localStorage.getItem('dailyReminder')
            }
        };

        const dataStr = JSON.stringify(data);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `noura-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('تم إنشاء نسخة احتياطية بنجاح!', 'success');
    }

    function restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    showModal(
                        'استعادة النسخة الاحتياطية',
                        'هل أنت متأكد أنك تريد استعادة هذه النسخة؟ سيتم استبدال جميع البيانات الحالية.',
                        () => {
                            if (data.breathSessions) localStorage.setItem('breathSessions', data.breathSessions);
                            if (data.savedQuotes) localStorage.setItem('savedQuotes', data.savedQuotes);
                            if (data.moodEntries) localStorage.setItem('moodEntries', data.moodEntries);
                            
                            if (data.settings) {
                                for (const [key, value] of Object.entries(data.settings)) {
                                    if (value) localStorage.setItem(key, value);
                                }
                            }
                            
                            // Refresh app
                            location.reload();
                        }
                    );
                } catch (err) {
                    showToast('خطأ في قراءة ملف النسخة الاحتياطية', 'danger');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    function confirmClearCache() {
        showModal(
            'مسح ذاكرة التخزين',
            'هل أنت متأكد أنك تريد مسح ذاكرة التخزين المؤقت؟ هذا لن يحذف بياناتك الأساسية.',
            () => {
                // In a real app, this would clear cache
                showToast('تم مسح ذاكرة التخزين المؤقت بنجاح!', 'success');
            }
        );
    }

    function confirmResetData() {
        showModal(
            'مسح جميع البيانات',
            'هل أنت متأكد أنك تريد مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف كل شيء.',
            () => {
                localStorage.clear();
                location.reload();
            }
        );
    }

    function confirmResetApp() {
        showModal(
            'إعادة تعيين التطبيق',
            'هل أنت متأكد أنك تريد إعادة تعيين التطبيق إلى إعداداته الافتراضية؟ سيتم حذف جميع البيانات والإعدادات.',
            () => {
                localStorage.clear();
                location.reload();
            }
        );
    }

    // Modal Functionality
    function showModal(title, message, confirmCallback) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        modalConfirm.onclick = function() {
            modal.classList.remove('active');
            if (confirmCallback) confirmCallback();
        };
        
        modalCancel.onclick = function() {
            modal.classList.remove('active');
        };
        
        modal.classList.add('active');
    }

    // Toast Notification
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Add toast styles
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 30px;
            color: white;
            font-weight: 600;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .toast.show {
            bottom: 30px;
            opacity: 1;
        }
        
        .toast-success {
            background: var(--success);
        }
        
        .toast-warning {
            background: var(--warning);
            color: var(--dark);
        }
        
        .toast-danger {
            background: var(--danger);
        }
    `;
    document.head.appendChild(toastStyles);
});
