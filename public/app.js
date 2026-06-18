// Global State
let isLoginMode = true;

// DOM Elements
const authSection = document.getElementById('auth-section');
const authModal = document.getElementById('auth-modal');
const authModalContent = document.getElementById('auth-modal-content');
const closeModalBtn = document.getElementById('close-modal');
const switchAuthModeBtn = document.getElementById('switch-auth-mode');
const modalTitle = document.getElementById('modal-title');
const modalSwitchText = document.getElementById('modal-switch-text');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');

const codeInput = document.getElementById('code-input');
const languageSelect = document.getElementById('language-select');
const submitBtn = document.getElementById('submit-btn');

const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const resultsState = document.getElementById('results-state');
const cacheBadge = document.getElementById('cache-badge');
const toast = document.getElementById('toast');

// Initialize
function init() {
    updateAuthUI();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    closeModalBtn.addEventListener('click', closeAuthModal);
    switchAuthModeBtn.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuthSubmit);
    submitBtn.addEventListener('click', handleReviewSubmit);
}

// Auth UI Logic
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (token && username) {
        authSection.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-gray-300">
                    <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-cta border border-cta/30">
                        ${username.charAt(0).toUpperCase()}
                    </div>
                    <span class="hidden sm:inline">${username}</span>
                </div>
                <button onclick="handleLogout()" class="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors cursor-pointer">Logout</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <button onclick="openAuthModal(true)" class="text-gray-300 hover:text-text font-medium transition-colors cursor-pointer">Sign In</button>
            <button onclick="openAuthModal(false)" class="bg-cta hover:bg-green-600 text-background font-bold py-2 px-4 rounded-lg transition-all shadow-lg shadow-cta/20 cursor-pointer">Sign Up</button>
        `;
    }
}

// Modal Logic
window.openAuthModal = (isLogin) => {
    isLoginMode = isLogin;
    modalTitle.textContent = isLogin ? 'Sign In' : 'Create Account';
    modalSwitchText.textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    switchAuthModeBtn.textContent = isLogin ? 'Sign Up' : 'Sign In';
    authError.classList.add('hidden');
    
    authModal.classList.remove('hidden');
    // slight delay for animation
    setTimeout(() => {
        authModalContent.classList.add('modal-open');
    }, 10);
};

function closeAuthModal() {
    authModalContent.classList.remove('modal-open');
    setTimeout(() => {
        authModal.classList.add('hidden');
        authForm.reset();
    }, 300);
}

function toggleAuthMode() {
    openAuthModal(!isLoginMode);
}

window.handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    updateAuthUI();
    showToast('Logged out successfully', 'success');
}

// API Calls
async function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const endpoint = isLoginMode ? '/signin' : '/signup';

    try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username || username);
            closeAuthModal();
            updateAuthUI();
            showToast(isLoginMode ? 'Welcome back!' : 'Account created successfully!', 'success');
        } else {
            authError.textContent = data.msg || 'An error occurred';
            authError.classList.remove('hidden');
        }
    } catch (err) {
        authError.textContent = 'Network error, please try again.';
        authError.classList.remove('hidden');
    }
}

async function handleReviewSubmit() {
    const token = localStorage.getItem('token');
    if (!token) {
        openAuthModal(true);
        showToast('Please sign in to review code', 'error');
        return;
    }

    const code = codeInput.value.trim();
    if (!code) {
        showToast('Please enter some code', 'error');
        return;
    }

    const language = languageSelect.value;

    // UI Updates
    emptyState.classList.add('hidden');
    resultsState.classList.add('hidden');
    cacheBadge.classList.add('hidden');
    loadingState.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Analyzing...`;
    lucide.createIcons();

    try {
        const response = await fetch('http://localhost:3000/review/submit', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ code, language })
        });

        const data = await response.json();

        if (response.ok) {
            renderFeedback(data.feedback, data.fromCache);
        } else {
            showToast(data.msg || 'Error analyzing code', 'error');
            resetReviewUI();
        }
    } catch (err) {
        showToast('Network error, please try again.', 'error');
        resetReviewUI();
    }
}

function renderFeedback(feedbackObj, fromCache) {
    loadingState.classList.add('hidden');
    resultsState.classList.remove('hidden');
    
    if (fromCache) {
        cacheBadge.classList.remove('hidden');
    } else {
        cacheBadge.classList.add('hidden');
    }

    let htmlContent = '';
    
    if (typeof feedbackObj === 'string') {
        htmlContent = formatMarkdown(feedbackObj);
    } else {
        htmlContent = formatMarkdown(JSON.stringify(feedbackObj, null, 2));
    }

    resultsState.innerHTML = htmlContent;
    
    resetReviewBtn();
}

// Simple markdown formatter
function formatMarkdown(text) {
    let formatted = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/gim, '<code>$1</code>')
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\n<ul>/gim, '');
    
    return formatted.split('\\n\\n').map(p => {
        if(p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<pre')) return p;
        return `<p>${p}</p>`;
    }).join('');
}

function resetReviewUI() {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    resetReviewBtn();
}

function resetReviewBtn() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i> Analyze`;
    lucide.createIcons();
}

function showToast(message, type = 'info') {
    const isError = type === 'error';
    
    toast.className = `fixed bottom-6 right-6 transform opacity-100 translate-y-0 transition-all duration-300 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
        isError ? 'bg-red-900/50 border-red-500/50 text-red-200' : 'bg-primary border-cta/30 text-text'
    }`;
    
    toast.innerHTML = `
        <i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" class="${isError ? 'text-red-400' : 'text-cta'}"></i>
        <span class="font-medium">${message}</span>
    `;
    lucide.createIcons();
    
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-24');
    }, 3000);
}

// Run
init();
