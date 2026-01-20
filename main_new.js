// ============================================
// CONFIGURATION
// ============================================

const API_URL = 'http://127.0.0.1:5000/api';
let currentUser = null;
let authToken = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeApp();
});

function initializeApp() {
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('authToken', authToken || '');
    });
}

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuthStatus() {
    let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    
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

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                updateNavbar();
                showDashboard();
                document.getElementById('loginForm').reset();
            }, 500);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showNotification('Login error: ' + error.message, 'error');
    }
}

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
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showNotification('Account created successfully!', 'success');
            setTimeout(() => {
                updateNavbar();
                showDashboard();
                document.getElementById('signupForm').reset();
            }, 500);
        } else {
            showNotification(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        showNotification('Signup error: ' + error.message, 'error');
    }
}

function demoLogin() {
    document.getElementById('loginEmail').value = 'demo@example.com';
    document.getElementById('loginPassword').value = 'demo123';
    handleLogin({ preventDefault: () => {} });
}

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
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
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
// QUIZ MANAGEMENT
// ============================================

let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStartTime = null;
let quizTimer = null;

async function loadQuizzes() {
    try {
        const response = await fetch(`${API_URL}/quizzes`);
        const data = await response.json();
        
        const grid = document.getElementById('quizzesGrid');
        grid.innerHTML = '';
        
        if (data.quizzes && data.quizzes.length > 0) {
            data.quizzes.forEach(quiz => {
                const card = createQuizCard(quiz);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: white;">No quizzes available</p>';
        }
    } catch (error) {
        showNotification('Failed to load quizzes: ' + error.message, 'error');
    }
}

function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    
    const difficultyClass = `difficulty-${quiz.difficulty}`;
    const timeDisplay = quiz.time_limit ? `${Math.floor(quiz.time_limit / 60)} mins` : 'No limit';
    
    card.innerHTML = `
        <h3>${quiz.title}</h3>
        <p>${quiz.description || 'No description'}</p>
        <div class="quiz-meta">
            <span class="difficulty-badge ${difficultyClass}">${quiz.difficulty.toUpperCase()}</span>
            <span>${quiz.total_questions} Questions</span>
            <span>⏱️ ${timeDisplay}</span>
        </div>
        <button class="btn btn-primary btn-block" onclick="startQuiz(${quiz.id})">Start Quiz</button>
    `;
    
    return card;
}

function filterQuizzes() {
    loadQuizzes();
}

async function startQuiz(quizId) {
    try {
        const response = await fetch(`${API_URL}/quizzes/${quizId}`);
        currentQuiz = await response.json();
        
        currentQuestionIndex = 0;
        userAnswers = new Array(currentQuiz.total_questions).fill(null);
        quizStartTime = Date.now();
        
        document.getElementById('quizTitle').textContent = currentQuiz.title;
        document.getElementById('totalQuestions').textContent = currentQuiz.total_questions;
        
        showPage('quizPage');
        loadQuestion();
        if (currentQuiz.time_limit) {
            startTimer();
        }
    } catch (error) {
        showNotification('Failed to load quiz: ' + error.message, 'error');
    }
}

function startTimer() {
    if (quizTimer) clearInterval(quizTimer);
    
    const timeLimit = currentQuiz.time_limit;
    let timeLeft = timeLimit;
    
    quizTimer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('timer').textContent = 
            `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            submitQuiz();
        }
    }, 1000);
}

function loadQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuiz.total_questions) * 100;
    
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
            document.querySelectorAll('.answer-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        answersContainer.appendChild(label);
    });
    
    document.getElementById('prevBtn').style.display = currentQuestionIndex > 0 ? 'block' : 'none';
    document.getElementById('nextBtn').style.display = currentQuestionIndex < currentQuiz.total_questions - 1 ? 'block' : 'none';
    document.getElementById('submitBtn').style.display = currentQuestionIndex === currentQuiz.total_questions - 1 ? 'block' : 'none';
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.total_questions - 1) {
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

function backToQuizzes() {
    if (quizTimer) clearInterval(quizTimer);
    showQuizzesPage();
}

async function submitQuiz() {
    if (quizTimer) clearInterval(quizTimer);
    
    if (!confirm('Are you sure you want to submit the quiz?')) {
        if (currentQuiz.time_limit) startTimer();
        return;
    }
    
    try {
        const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
        
        const response = await fetch(`${API_URL}/quizzes/${currentQuiz.id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                answers: userAnswers,
                time_taken: timeTaken
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Quiz submitted successfully!', 'success');
            showQuizResults(data.result);
        } else {
            showNotification(data.message || 'Failed to submit quiz', 'error');
        }
    } catch (error) {
        showNotification('Error submitting quiz: ' + error.message, 'error');
    }
}

function showQuizResults(result) {
    const resultsHTML = `
        <div style="text-align: center; padding: 3rem 2rem;">
            <h2 style="color: #1f2937; margin-bottom: 1rem;">Quiz Complete!</h2>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem; border-radius: 12px; margin: 2rem 0;">
                <p style="font-size: 1rem; margin-bottom: 1rem;">Your Score</p>
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">${result.percentage.toFixed(1)}%</h1>
                <p style="font-size: 1.2rem;">${result.score} out of ${result.total_questions} correct</p>
            </div>
            <div style="margin: 2rem 0;">
                <button class="btn btn-primary" onclick="showQuizzesPage()">Take Another Quiz</button>
                <button class="btn btn-secondary" style="margin-left: 1rem;" onclick="showDashboard()">Go to Dashboard</button>
            </div>
        </div>
    `;
    
    document.getElementById('quizContent').innerHTML = resultsHTML;
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        document.getElementById('dashboardUser').textContent = `Welcome, ${data.user.name}!`;

        // Platform Statistics
        document.getElementById('totalUsers').textContent = data.stats.total_users || 0;
        document.getElementById('totalQuizzesAdmin').textContent = data.stats.total_quizzes || 0;
        document.getElementById('testsCompleted').textContent = data.stats.tests_completed || 0;
        document.getElementById('avgPlatformScore').textContent = (data.stats.average_platform_score || 0).toFixed(1) + '%';

        // User Personal Stats
        document.getElementById('userQuizzesTaken').textContent = (data.user_stats.quizzes_taken || 0);
        document.getElementById('userAvgScore').textContent = (data.user_stats.average_score || 0).toFixed(1) + '%';
        document.getElementById('userBestScore').textContent = (data.user_stats.best_score || 0) + '%';
        document.getElementById('userTotalPoints').textContent = (data.user_stats.total_points || 0);
        
        loadResultsTable(data.recent_results);
    } catch (error) {
        showNotification('Failed to load dashboard: ' + error.message, 'error');
    }
}

function loadResultsTable(results) {
    const tbody = document.getElementById('resultsTableBody');
    
    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-results">No quiz results yet. Start taking quizzes!</td></tr>';
        return;
    }
    
    tbody.innerHTML = results.map(result => `
        <tr>
            <td>${result.quiz_title}</td>
            <td>${result.score}/${result.total_questions}</td>
            <td>${result.percentage.toFixed(1)}%</td>
            <td>${new Date(result.attempted_at).toLocaleDateString()}</td>
            <td><button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="viewResult(${result.id})">View</button></td>
        </tr>
    `).join('');
}

// ============================================
// LEADERBOARD
// ============================================

async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const data = await response.json();
        
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = '';
        
        if (data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-weight: 600; font-size: 1.1rem;">${index + 1}</td>
                    <td>${user.name}</td>
                    <td>${user.average_score.toFixed(1)}%</td>
                    <td>${user.best_score}%</td>
                    <td>${user.total_quizzes}</td>
                    <td>${user.total_points}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No data available</td></tr>';
        }
    } catch (error) {
        showNotification('Failed to load leaderboard: ' + error.message, 'error');
    }
}

// ============================================
// PROFILE
// ============================================

function loadProfileData() {
    if (currentUser) {
        document.getElementById('profileName').value = currentUser.name;
        document.getElementById('profileEmail').value = currentUser.email;
    }
}

async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;
    const confirmPassword = document.getElementById('profileConfirmPassword').value;
    
    if (!name.trim()) {
        showNotification('Name cannot be empty', 'error');
        return;
    }
    
    if (password && password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const body = { name };
        if (password) body.password = password;
        
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showNotification('Profile updated successfully!', 'success');
            document.getElementById('profilePassword').value = '';
            document.getElementById('profileConfirmPassword').value = '';
        } else {
            showNotification(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        showNotification('Error updating profile: ' + error.message, 'error');
    }
}

async function viewResult(resultId) {
    try {
        const response = await fetch(`${API_URL}/results/${resultId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResultDetail(data.result, data.quiz, data.user_answers);
        } else {
            showNotification(data.message || 'Failed to load result', 'error');
        }
    } catch (error) {
        showNotification('Error loading result: ' + error.message, 'error');
    }
}

function showResultDetail(result, quiz, userAnswers) {
    let detailHTML = `
        <div style="max-width: 900px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px;">
            <button class="btn btn-secondary" onclick="showDashboard()" style="margin-bottom: 1rem;">← Back</button>
            <h2 style="color: #1f2937; margin-bottom: 1rem;">${result.quiz_title}</h2>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                <p>Score: <strong>${result.score}/${result.total_questions}</strong></p>
                <p>Percentage: <strong>${result.percentage.toFixed(1)}%</strong></p>
                <p>Time Taken: <strong>${Math.floor(result.time_taken / 60)}m ${result.time_taken % 60}s</strong></p>
            </div>
            <h3 style="color: #1f2937; margin-bottom: 1rem;">Answer Review</h3>
    `;
    
    quiz.questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.correctAnswer;
        const userAnswerText = question.options[userAnswers[index]];
        const correctAnswerText = question.options[question.correctAnswer];
        
        detailHTML += `
            <div style="background: ${isCorrect ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${isCorrect ? '#10b981' : '#ef4444'}; padding: 1.5rem; margin-bottom: 1rem; border-radius: 12px;">
                <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.5rem;">Q${index + 1}: ${question.question}</p>
                <p style="color: #6b7280; margin-bottom: 0.5rem;">Your answer: <strong>${userAnswerText || 'Not answered'}</strong></p>
                ${!isCorrect ? `<p style="color: #6b7280;">Correct answer: <strong style="color: #10b981;">${correctAnswerText}</strong></p>` : ''}
                <p style="margin-top: 0.5rem; color: ${isCorrect ? '#10b981' : '#ef4444'}; font-weight: 600;">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </p>
            </div>
        `;
    });
    
    detailHTML += '<button class="btn btn-secondary" onclick="showDashboard()">Back to Dashboard</button></div>';
    
    document.getElementById('quizContent').innerHTML = detailHTML;
    showPage('quizPage');
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
