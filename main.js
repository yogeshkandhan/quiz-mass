// ============================================
// CONFIGURATION
// ============================================

const getAPIUrl = () => {
    console.log('Force setting API URL to local backend.');
    return 'http://127.0.0.1:5000/api';
};

let API_URL = getAPIUrl();
console.log('✅ API URL Set to:', API_URL);
let currentUser = null;
let authToken = null;
let offlineMode = false;
let backendOnline = false;


// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeApp();
});

function initializeApp() {
    // Add any initialization here
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('authToken', authToken || '');
    });
}

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuthStatus() {
    authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                currentUser = await response.json();
                updateNavbar();
                showDashboard();
            } else {
                logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    } else {
        showHome();
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        console.log('Login attempt: Missing email or password.');
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    console.log('Login attempt initiated.');
    console.log('Email:', email);
    console.log('Login API URL:', `${API_URL}/auth/login`);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn('Login request timed out after 10 seconds.');
        }, 10000);
        
        const requestBody = JSON.stringify({ email, password });
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: requestBody,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        backendOnline = true;
        offlineMode = false;

        console.log('Raw response:', response);
        
        let data;
        try {
            data = await response.json();
            console.log('Parsed response data:', data);
        } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            showNotification('Invalid response from server', 'error');
            return;
        }
        
        if (response.ok && data.token) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            console.log('Login successful!');
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                updateNavbar();
                showHome();
                document.getElementById('loginForm').reset();
            }, 500);
        } else {
            console.error('Login failed:', data.message || 'Unknown reason.');
            showNotification(data.message || 'Login failed. Check your email and password.', 'error');
        }
    } catch (error) {
        console.error('Login network error:', error);
        backendOnline = false;
        
        if (error.name === 'AbortError') {
            showNotification(
                '⏱️ Connection timeout.\n\nBackend server is not responding. Make sure to run: python app.py',
                'error'
            );
        } else {
            const errorMsg = getNetworkErrorMessage(error);
            showNotification(errorMsg, 'error');
        }
        
        if (error.message === 'Failed to fetch' || error.name === 'AbortError') {
            offerOfflineMode(email);
        }
    }
}

function offerOfflineMode(email) {
    const useOffline = confirm(
        'Backend is unreachable.\n\nUse DEMO MODE to explore the app?\n\n(You can test features with sample data)'
    );
    if (useOffline) {
        enableOfflineMode(email);
    }
}

if (useOffline) {
    enableOfflineMode(email);
}

function enableOfflineMode(email = 'demo@user.com') {
    offlineMode = true;
    authToken = 'offline_mode_' + Date.now();
    currentUser = {
        id: 1,
        name: email.split('@')[0] || 'Demo User',
        email: email,
        stats: {
            total_quizzes: 0,
            average_score: 0,
            best_score: 0,
            total_points: 0
        },
        created_at: new Date().toISOString()
    };
    
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('offlineMode', 'true');

    showNotification('📱 DEMO MODE ACTIVE\n\n(Note: Changes won\'t be saved)', 'success');
    updateNavbar();
    showHome();
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, email, password }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        backendOnline = true;
        offlineMode = false;
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                updateNavbar();
                showHome();
                document.getElementById('signupForm').reset();
            }, 500);
        } else {
            showNotification(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        backendOnline = false;
        
        if (error.name === 'AbortError') {
            showNotification(
                '⏱️ Connection timeout.\n\nBackend server is not responding. Make sure to run: python app.py',
                'error'
            );
            // Optionally, you could add more user-friendly suggestions here if needed.
        } else {
            const errorMsg = getNetworkErrorMessage(error);
            showNotification(errorMsg, 'error');
        }
        
        if (error.message === 'Failed to fetch' || error.name === 'AbortError') {
            offerOfflineMode(email);
        }
    }
}

// ============================================
// ERROR HANDLING & HELPERS
// ============================================

function getNetworkErrorMessage(error) {
    console.error('Network Error Details:', {
        message: error.message,
        name: error.name,
        apiUrl: API_URL
    });
    
    if (error.message === 'Failed to fetch' || error.name === 'AbortError') {
        return `❌ CANNOT CONNECT TO BACKEND

API URL: ${API_URL}

✅ TO FIX:

1. Open Command Prompt or PowerShell
2. Navigate to: e:\\quiz-websites\\backend
3. Run: python app.py
4. You should see: "Running on http://0.0.0.0:5000"
5. Refresh this page

📋 Required:
  • Python installed
  • Flask installed (pip install flask flask-cors)
  • Port 5000 not in use`;
    }

    return 'Error: ' + (error.message || 'Connection failed');
}

// Demo Login
function demoLogin() {
    document.getElementById('loginEmail').value = 'demo@example.com';
    document.getElementById('loginPassword').value = 'demo123';
    handleLogin({ preventDefault: () => {} });
}

// Logout
function logoutUser() {
    logout();
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        updateNavbar();
        showHome();
    }, 500);
}

function updateNavbar() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (currentUser) {
        logoutBtn.style.display = 'block';
    } else {
        logoutBtn.style.display = 'none';
    }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

function showHome() {
    showPage('homePage');
}

function showLoginPage() {
    showPage('loginPage');
}

function showSignupPage() {
    showPage('signupPage');
}

function showDashboard() {
    if (!currentUser) {
        showLoginPage();
        return;
    }
    showPage('dashboardPage');
    loadDashboardData();
    loadPlatformStatsAndQuizzes();
}

function showQuizzesPage() {
    if (!currentUser) {
        showLoginPage();
        return;
    }
    showPage('quizzesPage');
    loadQuizzes();
}

function showLeaderboard() {
    if (!currentUser) {
        showLoginPage();
        return;
    }
    showPage('leaderboardPage');
    loadLeaderboard();
}

function showProfilePage() {
    if (!currentUser) {
        showLoginPage();
        return;
    }
    showPage('profilePage');
    loadProfileData();
}

// ============================================
// QUIZ SYSTEM
// ============================================

// Sample Quiz Questions
const sampleQuestions = [
    {
        id: 1,
        question: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        correctAnswer: 1
    },
    {
        id: 2,
        question: "Which planet is closest to the sun?",
        options: ["Venus", "Earth", "Mercury", "Mars"],
        correctAnswer: 2
    },
    {
        id: 3,
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: 3
    },
    {
        id: 4,
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Jane Austen", "William Shakespeare", "Charles Dickens", "Mark Twain"],
        correctAnswer: 1
    },
    {
        id: 5,
        question: "What is the chemical symbol for Gold?",
        options: ["Go", "Gd", "Au", "Ag"],
        correctAnswer: 2
    }
];

let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStartTime = null;

function loadQuizOptions() {
    document.getElementById('quizOptions').style.display = 'block';
    document.getElementById('googleFormContainer').style.display = 'none';
    document.getElementById('sampleQuizContainer').style.display = 'none';
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('userGreeting').textContent = 'Welcome, ' + user.name + '!';
    }
}

// Google Form Integration
function startGoogleFormQuiz() {
    // Replace 'YOUR_FORM_ID' with actual Google Form ID
    // Form URL example: https://forms.google.com/u/0/forms/d/YOUR_FORM_ID/edit
    
    const formId = 'YOUR_GOOGLE_FORM_ID_HERE';
    
    if (formId === 'YOUR_GOOGLE_FORM_ID_HERE') {
        showNotification('Please set your Google Form ID in the code', 'info');
        const formUrl = prompt('Enter your Google Form ID (from the URL):', '');
        if (formUrl) {
            startGoogleFormWithId(formUrl);
        }
    } else {
        startGoogleFormWithId(formId);
    }
}

function startGoogleFormWithId(formId) {
    const iframeUrl = `https://docs.google.com/forms/d/${formId}/viewform?embedded=true`;
    document.getElementById('googleFormIframe').src = iframeUrl;
    
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('googleFormContainer').style.display = 'block';
    
    showNotification('Google Form loaded. Complete the form to submit your response.', 'info');
}

function backToQuizOptions() {
    document.getElementById('googleFormContainer').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'block';
}

// Start Sample Quiz
function startSampleQuiz() {
    currentQuiz = sampleQuestions;
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.length).fill(null);
    quizStartTime = Date.now();
    
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('sampleQuizContainer').style.display = 'block';
    document.getElementById('totalQuestions').textContent = currentQuiz.length;
    
    loadQuestion();
}

function loadQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
    
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('questionText').textContent = question.question;
    
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const label = document.createElement('label');
        label.className = 'answer-option';
        
        if (userAnswers[currentQuestionIndex] === index) {
            label.classList.add('selected');
        }
        
        label.innerHTML = `
            <input type="radio" name="answer" value="${index}" 
                ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
            ${option}
        `;
        
        label.addEventListener('click', function() {
            userAnswers[currentQuestionIndex] = index;
            document.querySelectorAll('.answer-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        answersContainer.appendChild(label);
    });
    
    // Update button visibility
    document.getElementById('prevBtn').style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    document.getElementById('nextBtn').style.display = currentQuestionIndex < currentQuiz.length - 1 ? 'block' : 'none';
    document.getElementById('submitBtn').style.display = currentQuestionIndex === currentQuiz.length - 1 ? 'block' : 'none';
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function submitQuiz() {
    if (!confirm('Are you sure you want to submit the quiz?')) {
        return;
    }
    
    // Calculate score
    let correctCount = 0;
    for (let i = 0; i < currentQuiz.length; i++) {
        if (userAnswers[i] === currentQuiz[i].correctAnswer) {
            correctCount++;
        }
    }
    
    const percentage = Math.round((correctCount / currentQuiz.length) * 100);
    const quizDuration = Math.round((Date.now() - quizStartTime) / 1000);
    
    // Save result
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const quizResult = {
        id: Date.now(),
        quizName: 'Sample Quiz',
        score: correctCount,
        totalQuestions: currentQuiz.length,
        percentage: percentage,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        duration: quizDuration
    };
    
    // Add to user's quiz history
    let userQuizzes = JSON.parse(localStorage.getItem('userQuizzes_' + user.id)) || [];
    userQuizzes.push(quizResult);
    localStorage.setItem('userQuizzes_' + user.id, JSON.stringify(userQuizzes));
    
    // Update user data
    updateUserStats(user.id, correctCount);
    
    // Show results
    showQuizResults(correctCount, percentage);
}

function showQuizResults(correctCount, percentage) {
    document.getElementById('sampleQuizContainer').style.display = 'none';
    
    const resultsHTML = `
        <div style="text-align: center; padding: 3rem 2rem;">
            <h2 style="color: #1f2937; margin-bottom: 1rem;">Quiz Complete!</h2>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 3rem; border-radius: 12px; margin: 2rem 0;">
                <p style="font-size: 1rem; margin-bottom: 1rem;">Your Score</p>
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">${percentage}%</h1>
                <p style="font-size: 1.2rem;">${correctCount} out of ${currentQuiz.length} correct</p>
            </div>
            
            <div style="margin: 2rem 0;">
                <button class="btn btn-primary" onclick="showQuizReview()">Review Answers</button>
                <button class="btn btn-secondary" style="margin-left: 1rem;" onclick="goToDashboard()">Go to Dashboard</button>
            </div>
        </div>
    `;
    
    document.getElementById('quizPage').innerHTML = document.getElementById('quizPage').innerHTML.replace(
        '<div id="sampleQuizContainer" style="display:none;">',
        '<div id="sampleQuizContainer" style="display:none;">'
    );
    
    document.getElementById('quizOptions').innerHTML = resultsHTML;
    document.getElementById('quizOptions').style.display = 'block';
}

function showQuizReview() {
    let reviewHTML = '<div style="padding: 2rem;"><h2 style="color: #1f2937; margin-bottom: 2rem;">Answer Review</h2>';
    
    currentQuiz.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.correctAnswer;
        const userAnswerText = question.options[userAnswers[index]];
        const correctAnswerText = question.options[question.correctAnswer];
        
        reviewHTML += `
            <div style="background: ${isCorrect ? '#f0fdf4' : '#fef2f2'}; 
                        border: 2px solid ${isCorrect ? '#10b981' : '#ef4444'}; 
                        padding: 1.5rem; margin-bottom: 1rem; border-radius: 12px;">
                <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Q${index + 1}: ${question.question}</p>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Your answer: <strong>${userAnswerText || 'Not answered'}</strong></p>
                ${!isCorrect ? `<p style="color: #6b7280;">Correct answer: <strong style="color: #10b981;">${correctAnswerText}</strong></p>` : ''}
                <p style="margin-top: 0.5rem; color: ${isCorrect ? '#10b981' : '#ef4444'}; font-weight: 600;">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </p>
            </div>
        `;
    });
    
    reviewHTML += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-secondary" onclick="goToDashboard()">Back to Dashboard</button>
        </div>
    </div>`;
    
    document.getElementById('quizOptions').innerHTML = reviewHTML;
}

function goToDashboard() {
    showDashboardPage();
}

// ============================================
// DASHBOARD & STATISTICS
// ================================
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        document.getElementById('dashboardUser').textContent = `Welcome, ${data.user.name}!`;

        // User Personal Stats (from backend /dashboard endpoint)
        document.getElementById('userQuizzesTaken').textContent = (data.stats.total_quizzes || 0);
        document.getElementById('userAvgScore').textContent = (data.stats.average_score || 0).toFixed(1) + '%';
        document.getElementById('userBestScore').textContent = (data.stats.best_score || 0) + '%';
        document.getElementById('userTotalPoints').textContent = (data.stats.total_points || 0);
        
        loadResultsTable(data.recent_results);
        
        // Now fetch additional platform-wide data
        await loadPlatformStatsAndQuizzes();

    } catch (error) {
        showNotification('Failed to load dashboard: ' + error.message, 'error');
        console.error('Dashboard load error:', error);
    }
}

async function loadPlatformStatsAndQuizzes() {
    try {
        const [quizzesResponse, allResultsResponse] = await Promise.all([
            fetch(`${API_URL}/quizzes`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
            fetch(`${API_URL}/results/all`, { headers: { 'Authorization': `Bearer ${authToken}` } }) // Assuming a new endpoint for all results
        ]);

        const quizzesData = await quizzesResponse.json();
        const allResultsData = await allResultsResponse.json();
        
        const totalQuizzes = quizzesData.quizzes ? quizzesData.quizzes.length : 0;
        const totalResults = allResultsData.results ? allResultsData.results.length : 0;
        
        let platformAvgScore = 0;
        if (totalResults > 0) {
            const totalPercentage = allResultsData.results.reduce((sum, r) => sum + r.percentage, 0);
            platformAvgScore = Math.round(totalPercentage / totalResults);
        }
        
        document.getElementById('totalUsers').textContent = '5+'; // Placeholder for total users
        document.getElementById('totalQuizzesAdmin').textContent = totalQuizzes;
        document.getElementById('testsCompleted').textContent = totalResults;
        document.getElementById('avgPlatformScore').textContent = platformAvgScore + '%';
        
        loadQuizCategoriesInfo(quizzesData.quizzes);

    } catch (error) {
        showNotification('Failed to load platform statistics and quizzes: ' + error.message, 'error');
        console.error('Platform stats load error:', error);
    }
}

function loadQuizCategoriesInfo(quizzes) {
    const quizInfoGrid = document.getElementById('quizInfoGrid');
    
    if (!quizzes || quizzes.length === 0) {
        quizInfoGrid.innerHTML = '<p class="no-results">No quizzes available</p>';
        return;
    }
    
    quizInfoGrid.innerHTML = quizzes.map(quiz => `
        <div class="quiz-info-card">
            <div class="quiz-info-header">
                <h4>${quiz.title}</h4>
                <span class="difficulty-badge ${quiz.difficulty}">${quiz.difficulty}</span>
            </div>
            <p class="quiz-category">📁 ${quiz.category || 'General'}</p>
            <div class="quiz-details">
                <div class="detail-item">
                    <span class="detail-label">Questions:</span>
                    <span class="detail-value">${quiz.total_questions}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${quiz.time_limit ? Math.round(quiz.time_limit / 60) + ' min' : 'Unlimited'}</span>
                </div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="startQuiz(${quiz.id})">Take Quiz</button>
        </div>
    `).join('');
}

function loadResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');
    
    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-results">No quiz results yet. Start taking quizzes!</td></tr>';
        return;
    }
    
    // Sort by date (newest first) and get last 10
    const sortedResults = results.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at)).slice(0, 10);
    
    tbody.innerHTML = sortedResults.map(result => {
        const date = new Date(result.attempted_at).toLocaleDateString();
        return `
            <tr>
                <td>${result.quiz_title}</td>
                <td>${result.score}/${result.total_questions}</td>
                <td>${result.percentage}%</td>
                <td>${date}</td>
                <td><button class="btn btn-sm btn-secondary" onclick="viewResult(${result.id})">View</button></td>
            </tr>
        `;
    }).join('');
}

function updateUserStats(userId, score) {
    // This is already done in submitQuiz, but kept here for clarity
}

function loadUserData() {
    // Initialize demo user if needed
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.find(u => u.email === 'demo@example.com')) {
        users.push({
            id: 1,
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'demo123',
            createdAt: new Date().toLocaleDateString()
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function initializeApp() {
    // Add any additional initialization here
}

// Export user data (optional feature)
function exportUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userQuizzes = JSON.parse(localStorage.getItem('userQuizzes_' + user.id)) || [];
    
    const data = {
        user: user,
        quizzes: userQuizzes,
        exportDate: new Date().toLocaleDateString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz_data.json';
    link.click();
}

// Clear all user data (optional feature)
function clearAllData() {
    if (confirm('Are you sure? This will delete all user data.')) {
        localStorage.clear();
        location.reload();
    }
}

// ============================================
// 3D ANIMATIONS FOR LOGIN/SIGNUP PAGES
// ============================================

// Function to show login page with 3D animation
const originalShowLoginPage = showLoginPage;
showLoginPage = function() {
    originalShowLoginPage();
    setTimeout(() => {
        init3DLoginAnimation();
    }, 100);
};

// Function to show signup page with 3D animation
const originalShowSignupPage = showSignupPage;
showSignupPage = function() {
    originalShowSignupPage();
    setTimeout(() => {
        init3DSignupAnimation();
    }, 100);
};

// Initialize 3D animation for login page
function init3DLoginAnimation() {
    const container = document.getElementById('canvas3d-container');
    if (!container) return;
    
    // Clear previous canvas if exists
    container.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    // Setup scene
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Animation variables
    let animationId;
    let time = 0;
    
    // Create animated shapes
    const shapes = [];
    
    // Add floating cubes
    for (let i = 0; i < 5; i++) {
        shapes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 20 + Math.random() * 40,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            rotationX: Math.random() * Math.PI * 2,
            rotationY: Math.random() * Math.PI * 2,
            rotationZ: Math.random() * Math.PI * 2,
            rotationSpeedX: (Math.random() - 0.5) * 0.02,
            rotationSpeedY: (Math.random() - 0.5) * 0.02,
            rotationSpeedZ: (Math.random() - 0.5) * 0.02,
            hue: 240 + Math.random() * 60,
            type: 'cube'
        });
    }
    
    // Add floating spheres
    for (let i = 0; i < 3; i++) {
        shapes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 15 + Math.random() * 25,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1.5,
            rotationX: Math.random() * Math.PI * 2,
            rotationY: Math.random() * Math.PI * 2,
            rotationSpeedX: (Math.random() - 0.5) * 0.015,
            rotationSpeedY: (Math.random() - 0.5) * 0.015,
            hue: 280 + Math.random() * 40,
            type: 'sphere'
        });
    }
    
    // Add particles
    const particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: Math.random() * 1,
            size: 1 + Math.random() * 3,
            hue: 240 + Math.random() * 120
        });
    }
    
    function drawCube(x, y, size, rotX, rotY, rotZ, hue) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        
        // Calculate perspective scaling
        const scale = 1 + Math.sin(rotX) * 0.1;
        const scaledSize = size * scale;
        
        // Draw cube with gradient
        const gradient = ctx.createLinearGradient(x - scaledSize / 2, y - scaledSize / 2, 
                                                   x + scaledSize / 2, y + scaledSize / 2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue + 30}, 100%, 40%, 0.6)`);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 2;
        
        // Draw rotated square (isometric view of cube)
        const points = [];
        const angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        for (let angle of angles) {
            const px = x + scaledSize / 2 * Math.cos(angle + rotZ);
            const py = y + scaledSize / 2 * Math.sin(angle + rotZ);
            points.push([px, py]);
        }
        
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let point of points) {
            ctx.lineTo(point[0], point[1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawSphere(x, y, radius, rotX, rotY, hue) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        
        // Draw sphere with gradient
        const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 3,
                                                  x, y, radius);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`);
        gradient.addColorStop(0.7, `hsla(${hue}, 100%, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 30%, 0.6)`);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw some rings for 3D effect
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 0.8, radius * 0.3, Math.PI / 6 + rotY, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawParticles() {
        ctx.globalAlpha = 0.6;
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.005;
            
            if (p.life <= 0) {
                particles[i] = {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 1,
                    size: 1 + Math.random() * 3,
                    hue: 240 + Math.random() * 120
                };
            }
            
            // Wrap around
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            
            ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    function animate() {
        // Clear canvas with semi-transparent background for trail effect
        ctx.fillStyle = 'rgba(10, 10, 30, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        time += 0.016;
        
        // Update and draw shapes
        shapes.forEach(shape => {
            // Update position
            shape.x += shape.speedX;
            shape.y += shape.speedY;
            
            // Update rotation
            shape.rotationX += shape.rotationSpeedX;
            shape.rotationY += shape.rotationSpeedY;
            if (shape.rotationZ !== undefined) {
                shape.rotationZ += shape.rotationSpeedZ;
            }
            
            // Wrap around screen
            if (shape.x < -50) shape.x = width + 50;
            if (shape.x > width + 50) shape.x = -50;
            if (shape.y < -50) shape.y = height + 50;
            if (shape.y > height + 50) shape.y = -50;
            
            // Draw shape
            if (shape.type === 'cube') {
                drawCube(shape.x, shape.y, shape.size, shape.rotationX, 
                        shape.rotationY, shape.rotationZ, shape.hue);
            } else if (shape.type === 'sphere') {
                drawSphere(shape.x, shape.y, shape.radius, shape.rotationX, 
                          shape.rotationY, shape.hue);
            }
        });
        
        // Draw particles
        drawParticles();
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Store animation ID for cleanup
    container.animationId = animationId;
}

// Initialize 3D animation for signup page (similar but different style)
function init3DSignupAnimation() {
    const container = document.getElementById('canvas3d-container-signup');
    if (!container) return;
    
    // Clear previous canvas if exists
    container.innerHTML = '';
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    // Setup scene
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    // Animation variables
    let animationId;
    let time = 0;
    
    // Create more energetic animated shapes for signup
    const shapes = [];
    
    // Add pyramids
    for (let i = 0; i < 4; i++) {
        shapes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 25 + Math.random() * 35,
            speedX: (Math.random() - 0.5) * 2.5,
            speedY: (Math.random() - 0.5) * 2.5,
            rotationX: Math.random() * Math.PI * 2,
            rotationY: Math.random() * Math.PI * 2,
            rotationZ: Math.random() * Math.PI * 2,
            rotationSpeedX: (Math.random() - 0.5) * 0.025,
            rotationSpeedY: (Math.random() - 0.5) * 0.025,
            rotationSpeedZ: (Math.random() - 0.5) * 0.025,
            hue: 120 + Math.random() * 80,
            type: 'pyramid'
        });
    }
    
    // Add more spheres for signup
    for (let i = 0; i < 5; i++) {
        shapes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: 10 + Math.random() * 30,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            rotationX: Math.random() * Math.PI * 2,
            rotationY: Math.random() * Math.PI * 2,
            rotationSpeedX: (Math.random() - 0.5) * 0.02,
            rotationSpeedY: (Math.random() - 0.5) * 0.02,
            hue: 100 + Math.random() * 100,
            type: 'sphere'
        });
    }
    
    // Add more particles
    const particles = [];
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: Math.random() * 1,
            size: 0.5 + Math.random() * 2,
            hue: 100 + Math.random() * 150
        });
    }
    
    function drawPyramid(x, y, size, rotX, rotY, rotZ, hue) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        
        // Calculate scale based on rotation
        const scale = 1 + Math.cos(rotY) * 0.15;
        const scaledSize = size * scale;
        
        // Draw pyramid
        const gradient = ctx.createLinearGradient(x - scaledSize / 2, y + scaledSize / 2,
                                                  x, y - scaledSize / 2);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0.9)`);
        gradient.addColorStop(1, `hsla(${hue + 40}, 100%, 55%, 0.7)`);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 2;
        
        // Three points of pyramid
        const points = [
            [x, y - scaledSize / 2],  // top
            [x - scaledSize / 2, y + scaledSize / 2],  // left
            [x + scaledSize / 2, y + scaledSize / 2]   // right
        ];
        
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[1][0], points[1][1]);
        ctx.lineTo(points[2][0], points[2][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawSphere(x, y, radius, rotX, rotY, hue) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        
        const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 3,
                                                  x, y, radius);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 75%, 0.95)`);
        gradient.addColorStop(0.6, `hsla(${hue}, 100%, 55%, 0.85)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 35%, 0.7)`);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    function drawParticles() {
        ctx.globalAlpha = 0.7;
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.004;
            
            if (p.life <= 0) {
                particles[i] = {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    life: 1,
                    size: 0.5 + Math.random() * 2,
                    hue: 100 + Math.random() * 150
                };
            }
            
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            
            ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life * 0.7})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(15, 25, 20, 0.12)';
        ctx.fillRect(0, 0, width, height);
        
        time += 0.016;
        
        shapes.forEach(shape => {
            shape.x += shape.speedX;
            shape.y += shape.speedY;
            
            shape.rotationX += shape.rotationSpeedX;
            shape.rotationY += shape.rotationSpeedY;
            if (shape.rotationZ !== undefined) {
                shape.rotationZ += shape.rotationSpeedZ;
            }
            
            if (shape.x < -50) shape.x = width + 50;
            if (shape.x > width + 50) shape.x = -50;
            if (shape.y < -50) shape.y = height + 50;
            if (shape.y > height + 50) shape.y = -50;
            
            if (shape.type === 'pyramid') {
                drawPyramid(shape.x, shape.y, shape.size, shape.rotationX, 
                           shape.rotationY, shape.rotationZ, shape.hue);
            } else if (shape.type === 'sphere') {
                drawSphere(shape.x, shape.y, shape.radius, shape.rotationX, 
                          shape.rotationY, shape.hue);
            }
        });
        
        drawParticles();
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    container.animationId = animationId;
        showNotification(errorMsg, 'error');

        }
