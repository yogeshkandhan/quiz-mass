# QuizMaster - Complete Quiz Platform

A modern, user-friendly quiz platform with backend API, user authentication, score tracking, and leaderboard.

## 🌟 Features

- **User Authentication** - Secure signup/login with JWT tokens
- **Multiple Quizzes** - Take quizzes with different difficulty levels
- **Quiz Timer** - Time-limited quizzes with automatic submission
- **Score Tracking** - Track all quiz results and progress
- **Dashboard** - View statistics, recent results, and achievements
- **Leaderboard** - See top performers on the platform
- **User Profile** - Update name and password
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Database** - SQLite for persistent data storage

## 📁 Project Structure

```
quiz-websites/
├── index.html              # Main HTML file
├── main.css               # Stylesheet
├── main.js                # Frontend JavaScript
├── backend/
│   ├── app.py            # Flask backend API
│   ├── requirements.txt   # Python dependencies
│   └── quizmaster.db      # SQLite database (auto-created)
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will run on `http://127.0.0.1:5000`

### 2. Open Frontend

Open `index.html` in your web browser or use a local server:

```bash
# Using Python
python -m http.server 8000
# Then visit: http://localhost:8000
```

### 3. Login or Create Account

- **Demo Login**: demo@example.com / demo123
- **New Account**: Click "Sign Up" and create an account

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Quizzes
- `GET /api/quizzes` - Get all quizzes
- `GET /api/quizzes/<id>` - Get quiz details
- `POST /api/quizzes/<id>/submit` - Submit quiz answers

### Results & Dashboard
- `GET /api/dashboard` - Get user dashboard data
- `GET /api/results` - Get user's quiz results
- `GET /api/results/<id>` - Get specific result details
- `GET /api/leaderboard` - Get top users

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

## 📊 Database Models

### User
```
- id: Primary Key
- name: String
- email: Unique String
- password: Hashed
- created_at: DateTime
- updated_at: DateTime
```

### Quiz
```
- id: Primary Key
- title: String
- description: Text
- difficulty: String (easy/medium/hard)
- category: String
- questions_data: JSON
- total_questions: Integer
- time_limit: Integer (seconds)
- created_at: DateTime
```

### QuizResult
```
- id: Primary Key
- user_id: Foreign Key
- quiz_id: Foreign Key
- score: Integer
- total_questions: Integer
- percentage: Float
- answers: JSON
- time_taken: Integer (seconds)
- attempted_at: DateTime
```

## 🔐 Security

- Passwords are hashed using Werkzeug security
- JWT tokens for API authentication
- Token expiration set to 30 days
- CORS enabled for local development

## 🎨 UI Features

- **Modern Design** - Gradient backgrounds and smooth animations
- **Responsive Layout** - Mobile-first approach
- **Real-time Updates** - Quiz timer and progress tracking
- **Visual Feedback** - Notifications and status messages
- **Quiz Review** - See correct answers after submission

## 📝 Sample Quiz Questions

The system includes 5 sample general knowledge questions:
1. Capital of France
2. Closest planet to sun
3. Largest ocean
4. Romeo and Juliet author
5. Chemical symbol for Gold

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Python Flask, Flask-SQLAlchemy
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Custom CSS with animations
- **HTTP**: RESTful API

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🔧 Configuration

To change the backend URL in JavaScript, edit `main.js`:

```javascript
const API_URL = 'http://127.0.0.1:5000/api';
```

To add your own quizzes, modify `backend/app.py` in the `init_db()` function.

## 📈 Features to Add

- [ ] Email verification
- [ ] Password reset
- [ ] Quiz creation dashboard
- [ ] Analytics charts
- [ ] Quiz categories filter
- [ ] Difficulty-based scoring
- [ ] Achievement badges
- [ ] Share results
- [ ] Duplicate quizzes for practice

## 🐛 Troubleshooting

### Backend won't start
- Ensure Python 3.7+ is installed
- Check if port 5000 is available
- Run: `pip install -r requirements.txt` again

### Frontend can't connect to API
- Check if backend is running
- Verify API_URL in main.js matches backend address
- Check browser console for CORS errors
- Allow localhost in firewall

### Database issues
- Delete `quizmaster.db` and restart backend
- This will reinitialize the database

## 📧 Support

For issues or questions, check the API responses and browser console for error messages.

## 📄 License

This project is free to use for educational purposes.

---

**Created**: January 2026
**Last Updated**: January 16, 2026
