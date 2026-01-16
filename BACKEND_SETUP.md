# Backend Setup & Troubleshooting Guide

## ⚡ Quick Start

### Step 1: Ensure Python is Installed
```bash
python --version
```
Should show Python 3.7 or higher

### Step 2: Install Required Packages
```bash
cd e:\quiz-websites\backend
pip install flask flask-cors flask-sqlalchemy
```

### Step 3: Run the Backend Server
```bash
cd e:\quiz-websites\backend
python app.py
```

You should see output like:
```
 * Running on http://0.0.0.0:5000 (Press CTRL+C to quit)
```

### Step 4: Open Your Browser
- Local access: http://localhost:8000 (or wherever your HTML is hosted)
- The app should automatically connect to `http://127.0.0.1:5000/api`

---

## 🔧 Troubleshooting

### Error: "Connection Error: Cannot reach backend"

**Problem:** Backend server is not running or API URL is wrong

**Solution:**
1. Keep the backend terminal window **open and running**
2. Make sure you see: `Running on http://0.0.0.0:5000`
3. Refresh the webpage
4. Try logging in again

### Error: "ModuleNotFoundError: No module named 'flask'"

**Problem:** Flask is not installed

**Solution:**
```bash
pip install flask flask-cors flask-sqlalchemy
```

### Error: "Address already in use"

**Problem:** Port 5000 is already in use by another application

**Solution:**
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or run on different port:
# Edit app.py line: app.run(debug=True, host='0.0.0.0', port=5001)
```

### Error: "Database locked"

**Problem:** Multiple instances of app.py running

**Solution:**
1. Close all Python terminals
2. Delete `e:\quiz-websites\backend\quizmaster.db` (optional)
3. Start fresh with `python app.py`

---

## ✅ How to Verify Backend is Working

1. Open your browser
2. Navigate to: http://127.0.0.1:5000/api/quizzes
3. If you see JSON data, backend is working ✅
4. If you get error, backend is not running ❌

---

## 📱 For Mobile Access from Same WiFi

1. Find your PC's IP address:
   ```bash
   ipconfig
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. Edit this line in `main.js`:
   ```javascript
   const PC_IP = '192.168.1.100';  // Change to your PC's IP
   ```

3. Access from mobile: `http://192.168.1.100:8000`

---

## 🚀 Keep Backend Running

- **Do NOT close the terminal** while using the app
- The terminal must stay open to handle requests
- If you close it, you'll get "Connection Error"
- To stop the server: Press `CTRL+C` in the terminal

---

## 🎯 Working Setup Checklist

- [ ] Python 3.7+ installed
- [ ] Flask, flask-cors, flask-sqlalchemy installed
- [ ] Backend server running (`python app.py`)
- [ ] Seeing "Running on http://0.0.0.0:5000" in terminal
- [ ] Browser can reach http://127.0.0.1:5000/api/quizzes
- [ ] Login page works and accepts credentials
- [ ] Can create account or use Demo Mode

---

## 💡 Pro Tips

1. **Use Demo Mode:** If backend won't start, click "Try Demo Mode" to explore the app
2. **Check Console:** Open browser DevTools (F12) > Console to see detailed error messages
3. **Verify API URL:** Check if `API_URL` in console shows correct endpoint
4. **Test Connection:** Open http://127.0.0.1:5000/api/quizzes in browser to verify backend

---

Still having issues? Check the browser console (F12) for detailed error messages!
