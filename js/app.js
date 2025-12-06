// --- Global State ---
let isMeaningsHidden = false;
let currentTheme = 'light';
let selectedSubject = null;
let selectedVerb = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderVocab(vocab);
    setupMixer();
    initLibrary();
    renderAlphabet();

    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
});

// --- Navigation Logic ---
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    // Show target section
    document.getElementById(sectionId).classList.add('active');

    // Highlight nav button
    // Highlight nav button
    const navIndex = ['dictionary', 'mixer', 'reader', 'alphabet'].indexOf(sectionId);
    if (navIndex >= 0) {
        document.querySelectorAll('.nav-btn')[navIndex].classList.add('active');
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
}

// --- Dictionary Logic ---
function renderVocab(data) {
    const grid = document.getElementById('vocab-grid');
    grid.innerHTML = '';

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = `vocab-card ${isMeaningsHidden ? 'hidden-meaning' : ''}`;
        card.innerHTML = `
            <div class="vocab-icon">${item.icon}</div>
            <div class="vocab-sanskrit">${item.sanskrit}</div>
            <div class="vocab-tamil">${item.tamil_trans}</div>
            <div class="vocab-english">${item.english}</div>
        `;
        grid.appendChild(card);
    });
}

function toggleMeanings() {
    isMeaningsHidden = !isMeaningsHidden;
    const btn = document.querySelector('.toggle-meaning-btn');
    btn.textContent = isMeaningsHidden ? '👁️ Show Meanings' : '👁️ Hide Meanings';

    // Re-render to apply class (or just toggle class on existing elements for performance, but re-render is fine for < 100 items)
    renderVocab(vocab); // Since we have filter, better to re-render or just toggle class on all cards
}

function filterVocab() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const filtered = vocab.filter(item =>
        item.sanskrit.toLowerCase().includes(query) ||
        item.tamil_trans.toLowerCase().includes(query) ||
        item.english.toLowerCase().includes(query)
    );
    renderVocab(filtered);
}

// --- Sentence Mixer Logic ---
const subjects = [
    { id: 'aham', sanskrit: "अहम्", tamil: "அஹம்", eng: "I", suffix: "mi" },  // 1st Person Sing
    { id: 'twam', sanskrit: "त्वम्", tamil: "த்வம்", eng: "You", suffix: "si" }, // 2nd Person Sing
    { id: 'sah', sanskrit: "सः", tamil: "ஸஹ", eng: "He", suffix: "ti" },     // 3rd Person Sing
    { id: 'sa', sanskrit: "सा", tamil: "ஸா", eng: "She", suffix: "ti" }      // 3rd Person Sing
];

function setupMixer() {
    // Populate Verb List from Vocab (only verbs)
    const verbList = vocab.filter(v => v.type === 'verb');
    const verbContainer = document.getElementById('verb-options');

    verbList.forEach(verb => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<strong>${verb.sanskrit}</strong><br><small>${verb.english}</small>`;
        btn.onclick = () => selectVerb(verb, btn);
        verbContainer.appendChild(btn);
    });
}

function selectSubject(id, btnElement) {
    selectedSubject = subjects.find(s => s.id === id);

    // UI Update
    document.querySelectorAll('#subject-options .option-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    updateResult();
}

function selectVerb(verbObj, btnElement) {
    selectedVerb = verbObj;

    // UI Update
    document.querySelectorAll('#verb-options .option-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    updateResult();
}

function updateResult() {
    if (!selectedSubject || !selectedVerb) return;

    // CONJUGATION LOGIC (Simplified for MVP)
    // 1. Get the 3rd person form from data (e.g., "Gacchati")
    // 2. Remove 'ti' to get the base stem (e.g., "Gaccha"). Note: This assumes all input verbs end in 'ti' which is true for our list.
    // 3. Add the appropriate suffix based on subject.

    let baseStem = "";
    if (selectedVerb.sanskrit.endsWith("ति")) {
        let stem = selectedVerb.sanskrit.substring(0, selectedVerb.sanskrit.lastIndexOf("ति"));

        // Special handling for 'Aham' (Add 'aami')
        if (selectedSubject.id === 'aham') {
            conjugatedSanskrit = stem + "ामि"; // "aami"
        } else if (selectedSubject.id === 'twam') {
            conjugatedSanskrit = stem + "सि"; // "si"
        } else {
            conjugatedSanskrit = selectedVerb.sanskrit; // Default is 'ti'
        }

        // Tamil logic update
        let stemTamil = selectedVerb.tamil_trans.replace("தி", "");
        if (selectedSubject.id === 'aham') {
            stemTamil += "ாமி"; // aami
        } else if (selectedSubject.id === 'twam') {
            stemTamil += "ஸி"; // si
        } else {
            stemTamil = selectedVerb.tamil_trans;
        }

        document.getElementById('result-tamil').textContent = `${selectedSubject.tamil} ${stemTamil}`;
    } else {
        // Fallback for non-TI ending verbs
        conjugatedSanskrit = selectedVerb.sanskrit;
        document.getElementById('result-tamil').textContent = `${selectedSubject.tamil} ${selectedVerb.tamil_trans}`;
    }


    document.getElementById('result-sanskrit').textContent = `${selectedSubject.sanskrit} ${conjugatedSanskrit}`;
    document.getElementById('result-tamil').textContent = `${selectedSubject.tamil} ${stemTamil}`;
    document.getElementById('result-english').textContent = `${selectedSubject.eng} ${selectedVerb.english}`;
}

// --- Consolidated Library Logic ---

// Variable to track current data source
let currentCategoryData = [];

function initLibrary() {
    // Initialize with default category (Principal Upanishads)
    updateTextCategory();
}

function updateTextCategory() {
    const categorySelect = document.getElementById('text-category');
    const textSelect = document.getElementById('text-select');
    const selectedCategory = categorySelect.value;

    // Clear existing options
    textSelect.innerHTML = '';

    if (selectedCategory === 'upanishads') {
        currentCategoryData = upanishads;
    } else {
        currentCategoryData = panchaSuktams;
    }

    // Populate Text Selector
    currentCategoryData.forEach((item, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = item.title;
        textSelect.appendChild(opt);
    });

    // Automatically render the first text of the new category
    renderText(0);
}

function renderText(selectedIndex) {
    const data = currentCategoryData[selectedIndex];
    if (!data) return;

    // Update Dropdown Visual State (if triggered programmatically)
    document.getElementById('text-select').value = selectedIndex;

    const titleEl = document.getElementById('reader-title');
    const subtitleEl = document.getElementById('reader-subtitle');
    const mantraContainer = document.getElementById('shanti-mantra-container');
    const versesContainer = document.getElementById('verses-container');

    titleEl.textContent = data.title;
    subtitleEl.textContent = data.subtitle;

    // Render Shanti Mantra
    if (data.shanti_mantra) {
        mantraContainer.style.display = 'block';
        mantraContainer.innerHTML = `
            <div class="verse-sanskrit">${formatSanskrit(data.shanti_mantra.sanskrit)}</div>
            <div class="verse-tamil">${formatSanskrit(data.shanti_mantra.tamil_trans)}</div>
            <p style="text-align: center; font-style: italic;">${data.shanti_mantra.english}</p>
        `;
    } else {
        mantraContainer.style.display = 'none';
    }

    // Render Verses
    versesContainer.innerHTML = ''; // Clear previous
    data.verses.forEach(verse => {
        const vDiv = document.createElement('div');
        vDiv.className = 'verse-card';

        let commentaryHtml = '';
        if (verse.commentary_tamil || verse.commentary_english) {
            commentaryHtml = `
            <div class="verse-commentary">
                <h4>Adi Shankara Bhashya (Essence)</h4>
                ${verse.commentary_tamil ? `<p><strong>தமிழ்:</strong> ${verse.commentary_tamil}</p>` : ''}
                ${verse.commentary_english ? `<br><p><strong>English:</strong> ${verse.commentary_english}</p>` : ''}
            </div>`;
        }

        vDiv.innerHTML = `
            <div class="verse-sanskrit">${formatSanskrit(verse.sanskrit)}</div>
            <div class="verse-tamil">${formatSanskrit(verse.tamil_trans)}</div>
            <p style="text-align: center; margin-bottom: 1rem;">${verse.english}</p>
            ${commentaryHtml}
        `;
        versesContainer.appendChild(vDiv);
    });
}

function formatSanskrit(text) {
    return text ? text.replace(/\n/g, '<br>') : '';
}
// Update Dropdown
suktamSelect.value = index;



// --- Alphabet Logic ---
function renderAlphabet() {
    if (typeof alphabet === 'undefined') return;

    // Render Vowels
    const vGrid = document.getElementById('vowels-grid');
    if (vGrid) {
        vGrid.innerHTML = '';
        alphabet.vowels.forEach(v => {
            const div = document.createElement('div');
            div.className = 'vocab-card';
            div.style.padding = '0.5rem';
            div.style.textAlign = 'center';
            div.innerHTML = `<div style="font-size: 1.5rem; color: var(--accent-color);">${v.char}</div><div style="font-size: 0.8rem;">${v.trans}</div><div style="font-size: 0.8rem; color: var(--secondary-text);">${v.tamil}</div>`;
            vGrid.appendChild(div);
        });
    }

    // Render Consonants
    const cGrid = document.getElementById('consonants-grid');
    if (cGrid) {
        cGrid.innerHTML = '';
        alphabet.consonants.forEach(c => {
            const div = document.createElement('div');
            div.className = 'vocab-card';
            div.style.padding = '0.5rem';
            div.style.textAlign = 'center';
            div.innerHTML = `<div style="font-size: 1.5rem; color: var(--accent-color);">${c.char}</div><div style="font-size: 0.8rem;">${c.trans}</div><div style="font-size: 0.8rem; color: var(--secondary-text);">${c.tamil}</div>`;
            cGrid.appendChild(div);
        });
    }

    // Populate Mixer Dropdowns
    const mCons = document.getElementById('mixer-consonant');
    const mVow = document.getElementById('mixer-vowel');

    if (mCons && mCons.children.length === 0) {
        alphabet.consonants.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.char;
            opt.setAttribute('data-trans', c.trans);
            opt.setAttribute('data-tamil', c.tamil);
            opt.innerHTML = `${c.char} (${c.trans})`;
            mCons.appendChild(opt);
        });
        mCons.selectedIndex = 0;
    }

    if (mVow && mVow.children.length === 0) {
        alphabet.matras.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.char;
            opt.setAttribute('data-vowel', m.vowel);
            opt.setAttribute('data-name', m.name);
            opt.setAttribute('data-tamil-mark', m.tamil_mark);
            opt.innerHTML = `${m.vowel} - ${m.name}`;
            mVow.appendChild(opt);
        });
        mVow.selectedIndex = 1;
    }

    updateLetterMixer();
    renderBarakhadi();
}

function updateLetterMixer() {
    const cSelect = document.getElementById('mixer-consonant');
    const vSelect = document.getElementById('mixer-vowel');

    if (!cSelect || !vSelect) return;

    const cChar = cSelect.value;
    const cOption = cSelect.options[cSelect.selectedIndex];
    const cTrans = cOption.getAttribute('data-trans');
    const cTamil = cOption.getAttribute('data-tamil');

    const vMatra = vSelect.value;
    const vOption = vSelect.options[vSelect.selectedIndex];
    const vVowel = vOption.getAttribute('data-vowel');
    const vName = vOption.getAttribute('data-name');
    const vTamilMark = vOption.getAttribute('data-tamil-mark');

    let resultSanskrit = cChar + vMatra;
    // Handle Halant (Virama) special display in logic if needed, but font usually handles it.

    let resultTamil = cTamil + vTamilMark;

    document.getElementById('mixer-result-sanskrit').textContent = resultSanskrit;
    document.getElementById('mixer-result-tamil').textContent = resultTamil;
    document.getElementById('mixer-result-details').textContent = `${cTrans} + ${vName}`;
}

function renderBarakhadi() {
    const grid = document.getElementById('barakhadi-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // For each consonant
    alphabet.consonants.forEach(c => {
        // Loop through all matras to create syllables
        alphabet.matras.forEach(m => {
            const sanskrit = c.char + m.char;
            const tamil = c.tamil + m.tamil_mark;

            let english = "";
            let baseTrans = c.trans;
            if (baseTrans.endsWith('a')) {
                baseTrans = baseTrans.slice(0, -1);
            }

            if (m.name === "Mukta") {
                english = c.trans;
            } else if (m.name === "Virama" || m.name === "Halant") {
                english = baseTrans;
            } else if (m.name === "Anusvara") {
                english = c.trans + "m";
            } else if (m.name === "Visarga") {
                english = c.trans + "h";
            } else {
                const vowelObj = alphabet.vowels.find(v => v.char === m.vowel);
                const vowelTrans = vowelObj ? vowelObj.trans : "";
                english = baseTrans + vowelTrans;
            }

            const card = document.createElement('div');
            card.className = 'vocab-card';
            card.style.padding = '0.5rem';
            card.style.textAlign = 'center';
            card.style.border = '1px solid var(--border-color)';

            card.innerHTML = `
                <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent-color);">${sanskrit}</div>
                <div style="font-size: 0.9rem;">${tamil}</div>
                <div style="font-size: 0.8rem; color: var(--secondary-text);">${english}</div>
            `;
            grid.appendChild(card);
        });
    });
}
