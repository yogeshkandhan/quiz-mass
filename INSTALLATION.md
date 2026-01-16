# Installation & Setup Instructions

## Prerequisites Check

Before you start, make sure you have:

- ✅ Windows 10/11, Mac, or Linux
- ✅ Python 3.7 or higher installed
- ✅ Modern web browser (Chrome, Firefox, Edge, Safari)
- ✅ About 100MB free disk space

## Step-by-Step Installation

### Step 1: Verify Python Installation

Open Command Prompt/Terminal and run:

```bash
python --version
```

You should see: `Python 3.x.x`

If not, download from: https://www.python.org/downloads/

### Step 2: Navigate to Backend Folder

```bash
cd quiz-websites/backend
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask 2.3.3
- Flask-SQLAlchemy 3.0.5
- Flask-CORS 4.0.0
- PyJWT 2.8.1
- Werkzeug 2.3.7

**Wait for completion** (should take 1-2 minutes)

### Step 4: Start Backend Server

```bash
python app.py
```

You should see:
```
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

**Keep this window open!**

### Step 5: Open Website in Browser

#### Option A: Direct File Opening
1. Navigate to the `quiz-websites` folder
2. Find `index.html`
3. Right-click → Open with → Your browser

#### Option B: Using Local Server
Open another Command Prompt/Terminal:

```bash
# Navigate to quiz-websites folder
cd quiz-websites

# Start local server
python -m http.server 8000
```

Then visit: `http://localhost:8000`

### Step 6: Login

Use demo credentials:
- **Email**: demo@example.com
- **Password**: demo123

## 🎯 What You Should See

### Homepage
- QuizMaster logo with tagline
- Feature cards
- Login/Signup buttons

### Dashboard (After Login)
- Statistics cards (Total Quizzes, Average Score, etc.)
- Recent quiz results table
- "Take a Quiz" button

### Quiz Page
- Quiz title and timer
- Progress bar
- Question with options
- Navigation buttons

### Leaderboard
- Top users ranked
- Average and best scores
- Total points

## 🔧 Configuration

### Change Backend Port

If port 5000 is in use, edit `backend/app.py`:

```python
# Find this line at the bottom:
if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='127.0.0.1', port=5000)

# Change 5000 to your port, e.g., 5001
```

Then in `main.js`, update:

```javascript
const API_URL = 'http://127.0.0.1:5001/api';
```

### Enable Debug Mode

For development, debug mode is enabled by default. To disable:

```python
app.run(debug=False, host='127.0.0.1', port=5000)
```

## 📊 Database

The database is automatically created on first run:
- **Location**: `backend/quizmaster.db`
- **Type**: SQLite (single file, no setup needed)
- **Size**: ~100KB initially

### Reset Database

To clear all data and start fresh:

1. Stop the backend server (Ctrl+C)
2. Delete `backend/quizmaster.db`
3. Restart backend server
4. Database recreates with sample data

## 🧪 Testing Checklist

After setup, test these features:

- [ ] Access homepage without login
- [ ] Signup with new email
- [ ] Login with demo account
- [ ] View dashboard statistics
- [ ] Start a quiz
- [ ] Answer some questions
- [ ] Submit quiz
- [ ] View results
- [ ] Check leaderboard
- [ ] Update profile
- [ ] Logout and login again

## 🚨 Common Issues & Solutions

### Issue: "Port 5000 already in use"
**Solution**: Change port (see Configuration section above)

### Issue: "ModuleNotFoundError: No module named 'flask'"
**Solution**: Run `pip install -r requirements.txt` again

### Issue: "Cannot connect to server from browser"
**Solution**: 
1. Check if backend window shows "Running on..."
2. Make sure backend port matches in main.js
3. Try opening index.html directly

### Issue: "CORS error in console"
**Solution**: This is normal for local testing. CORS is enabled.

### Issue: "Database is locked"
**Solution**: Close backend and restart it

### Issue: "Blank page when opening index.html"
**Solution**: Use local server instead (Option B in Step 5)

## 🔐 First Time Setup Security

1. Change the SECRET_KEY in `backend/app.py`

Find this line:
```python
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
```

Change to something random:
```python
app.config['SECRET_KEY'] = 'your-very-secure-random-key-12345-abc'
```

## 📱 Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎓 File Structure Reference

```
quiz-websites/
├── index.html              # Main website file
├── main.css               # Styling
├── main.js                # Frontend logic
├── QUICKSTART.md          # Quick guide
├── README.md              # Full docs
└── backend/
    ├── app.py            # Backend server
    ├── requirements.txt   # Dependencies
    ├── setup.py          # Setup helper
    └── quizmaster.db      # Database (auto-created)
```

## ⚡ Performance Tips

1. **First Load**: May be slow as database initializes
2. **Subsequent Loads**: Much faster
3. **Browser Cache**: Clear cache if issues persist
4. **Network**: Ensure stable internet connection

## 📞 Getting Help

1. **Check the console**: Press F12 in browser → Console tab
2. **Read README.md**: Comprehensive documentation
3. **Check error messages**: They usually tell you the problem
4. **Restart components**: Stop and restart backend

## 🎉 You're Ready!

Once you can:
1. See the backend "Running on..." message
2. Open index.html in browser
3. Login with demo account
4. See the dashboard

**Everything is working perfectly!**

Start exploring the quiz platform and enjoy! 🚀

---

**Need more help?** See QUICKSTART.md or README.md
