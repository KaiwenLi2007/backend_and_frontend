/**
 * News Intelligence Engine - Enhanced Vanilla SPA
 */

const AppState = {
    history: [],
    currentResult: null,
    isLoading: false,
    status: { message: '', type: '' } // type: 'error', 'info', 'success'
};

const UI = {
    searchForm: document.getElementById('search-form'),
    topicInput: document.getElementById('topic-input'),
    searchBtn: document.getElementById('search-btn'),
    historyList: document.getElementById('history-list'),
    resultsSection: document.getElementById('results-section'),
    statusMsg: document.getElementById('status-message'),
    resultTopic: document.getElementById('result-topic'),
    vibeCheck: document.getElementById('vibe-check'),
    resultSummary: document.getElementById('result-summary')
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    UI.searchForm.addEventListener('submit', handleSearch);
    await fetchHistory();
    render();
}

// --- State Management & Rendering ---

function updateState(newState) {
    Object.assign(AppState, newState);
    render();
}

function render() {
    // 1. Loader & Button State
    if (AppState.isLoading) {
        UI.searchBtn.classList.add('loading');
        UI.searchBtn.disabled = true;
    } else {
        UI.searchBtn.classList.remove('loading');
        UI.searchBtn.disabled = false;
    }

    // 2. Status Message
    if (AppState.status.message) {
        UI.statusMsg.textContent = AppState.status.message;
        UI.statusMsg.className = `status-message ${AppState.status.type}`;
        UI.statusMsg.classList.remove('hidden');
    } else {
        UI.statusMsg.classList.add('hidden');
    }

    // 3. History Sidebar
    if (AppState.history.length === 0) {
        UI.historyList.innerHTML = '<p class="empty-state">No history yet.</p>';
    } else {
        UI.historyList.innerHTML = AppState.history.map(item => `
            <div class="history-item animate-in" onclick="loadFromHistory('${item.topic.replace(/'/g, "\\'")}')">
                <div class="topic">${item.topic}</div>
                <div class="date">${new Date(item.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    // 4. Results Section
    if (AppState.currentResult) {
        UI.resultTopic.textContent = AppState.currentResult.topic;
        UI.resultSummary.innerHTML = formatSummary(AppState.currentResult.summary);

        const sentiment = AppState.currentResult.sentiment;
        UI.vibeCheck.textContent = sentiment;
        UI.vibeCheck.className = 'vibe-badge ' + sentiment.toLowerCase();

        UI.resultsSection.classList.remove('hidden');
        if (!AppState.isLoading) {
            UI.resultsSection.classList.add('fade-in');
        }
    } else {
        UI.resultsSection.classList.add('hidden');
    }
}

// --- Action Handlers ---

async function handleSearch(e) {
    if (e) e.preventDefault();
    const topic = UI.topicInput.value.trim();
    if (!topic) return;

    updateState({ isLoading: true, status: { message: '', type: '' } });

    try {
        const response = await fetch('/get-news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });

        const data = await response.json();

        if (!response.ok) {
            handleError(response.status, data.error);
        } else {
            updateState({ currentResult: data, isLoading: false });
            await fetchHistory();
        }
    } catch (err) {
        updateState({
            isLoading: false,
            status: { message: 'Network error. Server might be waking up.', type: 'info' }
        });
    }
}

async function fetchHistory() {
    try {
        const response = await fetch('/history');
        const data = await response.json();
        updateState({ history: data });
    } catch (err) {
        console.error('History fetch failed', err);
    }
}

window.loadFromHistory = (topic) => {
    const historicalResult = AppState.history.find(h => h.topic === topic);
    if (historicalResult) {
        UI.topicInput.value = topic;
        updateState({ currentResult: historicalResult, status: { message: '', type: '' } });
        UI.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
};

// --- Helpers ---

function handleError(status, errorMsg) {
    let msg = errorMsg || 'An unexpected error occurred.';
    let type = 'error';

    if (status === 500 && msg.includes('Missing configuration')) {
        msg = 'API Keys missing. Configure NEWS_API_KEY and GEMINI_API_KEY.';
    } else if (status === 404) {
        msg = 'No news found for this topic.';
        type = 'info';
    }

    updateState({ isLoading: false, status: { message: msg, type }, currentResult: null });
}

function formatSummary(text) {
    return `<ul>${text.split('\n').filter(p => p.trim()).map(p => `<li>${p.replace(/^[-•*]\s*/, '')}</li>`).join('')}</ul>`;
}
