// ============================================
// CONFIGURATION
// ============================================

// Detect if running on mobile/different device
// For mobile access: use your PC's IP address
// For local access: use 127.0.0.1
const getAPIUrl = () => {
    // Check if localhost is accessible
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:5000/api';
    }
    // For mobile/external access, use the same host but port 5000
    return `http://${window.location.hostname}:5000/api`;
};

const API_URL = getAPIUrl();
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
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
                showHome();
                document.getElementById('loginForm').reset();
            }, 500);
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login error: ' + error.message + '. Is the backend running on http://127.0.0.1:5000?', 'error');
    }
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
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            
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
        showNotification('Signup error: ' + error.message, 'error');
    }
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
// MOBILE ACCESS SETUP
// ============================================

function showMobileAccessPage() {
    showPage('mobileAccessPage');
    detectAndDisplayIPAddress();
}

async function detectAndDisplayIPAddress() {
    try {
        // Try to fetch the local IP from the browser
        const response = await fetch('http://127.0.0.1:5000/api/config', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(() => null);
        
        // Fallback: display instructions for manual IP detection
        const pcIpElement = document.getElementById('pcIpAddress');
        const mobileUrlElement = document.getElementById('mobileUrl');
        
        // Try to detect if on local machine or external
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            pcIpElement.textContent = 'Find your PC IP address (see instructions below)';
            mobileUrlElement.textContent = 'http://[YOUR_PC_IP]:8000';
        } else {
            // If already on external IP, show it
            pcIpElement.textContent = window.location.hostname;
            mobileUrlElement.textContent = `http://${window.location.hostname}:8000`;
        }
    } catch (error) {
        console.log('Could not detect IP, showing manual instructions');
    }
}

function copyIPAddress() {
    const ipElement = document.getElementById('pcIpAddress');
    const text = ipElement.textContent;
    
    if (text.includes('YOUR_PC_IP')) {
        showNotification('Please replace [YOUR_PC_IP] with your actual PC IP address', 'info');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('IP address copied to clipboard!', 'success');
    }).catch(err => {
        showNotification('Failed to copy IP address', 'error');
    });
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
// ============================================

async function loadDashboardData() {
    try {
        // Load platform statistics
        const quizzesResponse = await fetch(`${API_URL}/quizzes`);
        const quizzesData = await quizzesResponse.json();
        
        const meResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const userData = await meResponse.json();
        
        // Get all results for platform stats
        const resultsResponse = await fetch(`${API_URL}/results`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const resultsData = await resultsResponse.json();
        
        // Calculate platform statistics
        const totalQuizzes = quizzesData.quizzes ? quizzesData.quizzes.length : 0;
        const totalResults = resultsData.results ? resultsData.results.length : 0;
        
        let platformAvgScore = 0;
        if (totalResults > 0) {
            const totalPercentage = resultsData.results.reduce((sum, r) => sum + r.percentage, 0);
            platformAvgScore = Math.round(totalPercentage / totalResults);
        }
        
        // Update dashboard header
        document.getElementById('dashboardUser').textContent = `Platform Overview & Your Stats | User: ${userData.name}`;
        
        // Update platform stats
        document.getElementById('totalUsers').textContent = '5+'; // Demo count
        document.getElementById('totalQuizzesAdmin').textContent = totalQuizzes;
        document.getElementById('testsCompleted').textContent = totalResults;
        document.getElementById('avgPlatformScore').textContent = platformAvgScore + '%';
        
        // Update user personal stats
        const userStats = userData.stats;
        document.getElementById('userQuizzesTaken').textContent = userStats.total_quizzes;
        document.getElementById('userAvgScore').textContent = userStats.average_score.toFixed(1) + '%';
        document.getElementById('userBestScore').textContent = userStats.best_score + '%';
        document.getElementById('userTotalPoints').textContent = userStats.total_points;
        
        // Load quiz categories info
        loadQuizCategoriesInfo(quizzesData.quizzes);
        
        // Load user's recent results
        loadResultsTable(resultsData.results);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
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
