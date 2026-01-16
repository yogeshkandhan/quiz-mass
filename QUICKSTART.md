# QuizMaster - Quick Start Guide

## 🎯 Minimum Requirements

- Python 3.7+
- Modern web browser
- 100MB free disk space

## ⚡ Quick Setup (3 Steps)

### Step 1: Install Dependencies

Open Command Prompt in the `backend` folder and run:

```
pip install -r requirements.txt
```

### Step 2: Start Backend Server

In the same `backend` folder, run:

```
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

**Keep this window open!**

### Step 3: Open Website

1. Open `index.html` in your web browser
   - Right-click → Open with → Browser
   - OR double-click the file

2. You should see the QuizMaster homepage

## 🔓 Login Credentials

**Demo Account (Pre-created):**
- Email: `demo@example.com`
- Password: `demo123`

**Or Create New Account:**
- Click "Sign Up"
- Fill in your details
- Password must be 6+ characters

## 📝 What You Can Do

1. **View Dashboard** - See your stats and progress
2. **Take Quizzes** - Choose from available quizzes
3. **Check Leaderboard** - Compare scores with others
4. **View Profile** - Update name/password
5. **See Results** - Review past quiz answers

## 🎮 Sample Quizzes

The system includes:
- **General Knowledge Quiz** (5 questions, Medium difficulty)
- **Science Quiz** (2 questions, Medium difficulty)

## ⏱️ Quiz Features

- **Timer** - Quizzes with time limits auto-submit
- **Progress Bar** - See how far you are in the quiz
- **Review** - Check correct answers after submission
- **Scoring** - Get percentage and points for each quiz

## 🚨 Troubleshooting

### "Cannot connect to server"
- Check if backend is running (Step 2)
- Make sure you see "Running on http://127.0.0.1:5000"

### "Page won't load"
- Check browser console (F12 → Console)
- Look for error messages
- Refresh the page (Ctrl+R)

### "404 Not Found" errors
- Backend is not running
- Open new Command Prompt window
- Go to `backend` folder
- Run `python app.py`

### Database issues
- Delete `backend/quizmaster.db` if it exists
- Restart backend server
- It will recreate the database

## 🔧 Configuration

**To use a different port:**

Edit `backend/app.py` at the bottom:
```python
app.run(debug=True, host='127.0.0.1', port=5000)  # Change 5000 to your port
```

Then update `main.js`:
```javascript
const API_URL = 'http://127.0.0.1:YOUR_PORT/api';
```

## 📊 Database Info

- **Location**: `backend/quizmaster.db`
- **Type**: SQLite (local file)
- **Auto-created**: Yes, on first run
- **Sample data**: Yes, auto-populated

## 🔐 Security Notes

- Passwords are encrypted
- JWTtokens expire after 30 days
- Don't share your login credentials
- For production, change `SECRET_KEY` in `app.py`

## 📞 Need Help?

Check these files for more info:
- `README.md` - Full documentation
- `backend/app.py` - Backend code
- `main.js` - Frontend code
- Browser Console (F12) - Error messages

## 🎓 Learning Path

1. Create an account
2. Take a demo quiz
3. Check your dashboard
4. View the leaderboard
5. Update your profile
6. Try different quizzes

Enjoy QuizMaster! 🚀
