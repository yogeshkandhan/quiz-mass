"""
QuizMaster Backend - Flask API
Database: SQLite
Authentication: JWT Tokens
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps
import json

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quizmaster.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]}}, supports_credentials=False)

# ============================================
# DATABASE MODELS
# ============================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quiz_results = db.relationship('QuizResult', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def get_stats(self):
        results = self.quiz_results
        if not results:
            return {
                'total_quizzes': 0,
                'average_score': 0,
                'best_score': 0,
                'total_points': 0
            }
        
        percentages = [r.percentage for r in results]
        scores = [r.score for r in results]
        
        return {
            'total_quizzes': len(results),
            'average_score': round(sum(percentages) / len(percentages), 2) if percentages else 0,
            'best_score': max(percentages) if percentages else 0,
            'total_points': sum(scores)
        }
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'stats': self.get_stats()
        }


class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(db.String(20), default='medium')  # easy, medium, hard
    category = db.Column(db.String(100))
    questions_data = db.Column(db.Text, nullable=False)  # JSON format
    total_questions = db.Column(db.Integer, nullable=False)
    time_limit = db.Column(db.Integer)  # in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    quiz_results = db.relationship('QuizResult', backref='quiz', lazy=True, cascade='all, delete-orphan')
    
    def get_questions(self):
        return json.loads(self.questions_data) if self.questions_data else []
    
    def set_questions(self, questions):
        self.questions_data = json.dumps(questions)
    
    def to_dict(self, include_answers=False):
        questions = self.get_questions()
        if not include_answers:
            # Remove correct answers from questions
            for q in questions:
                if 'correctAnswer' in q:
                    del q['correctAnswer']
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'difficulty': self.difficulty,
            'category': self.category,
            'questions': questions,
            'total_questions': self.total_questions,
            'time_limit': self.time_limit,
            'created_at': self.created_at.isoformat()
        }


class QuizResult(db.Model):
    __tablename__ = 'quiz_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Float, nullable=False)
    answers = db.Column(db.Text, nullable=False)  # JSON format
    time_taken = db.Column(db.Integer)  # in seconds
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_answers(self):
        return json.loads(self.answers) if self.answers else []
    
    def set_answers(self, answers):
        self.answers = json.dumps(answers)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title,
            'score': self.score,
            'total_questions': self.total_questions,
            'percentage': self.percentage,
            'time_taken': self.time_taken,
            'attempted_at': self.attempted_at.isoformat()
        }


# ============================================
# AUTHENTICATION
# ============================================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated


def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ============================================
# API ROUTES - AUTHENTICATION
# ============================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'message': 'Missing required fields'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        if len(data['password']) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        user = User(name=data['name'], email=data['email'])
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify(current_user.to_dict()), 200


# ============================================
# API ROUTES - QUIZ MANAGEMENT
# ============================================

@app.route('/api/quizzes', methods=['GET'])
def get_all_quizzes():
    try:
        quizzes = Quiz.query.all()
        return jsonify({
            'quizzes': [quiz.to_dict() for quiz in quizzes]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    try:
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        return jsonify(quiz.to_dict()), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/quizzes', methods=['POST'])
@token_required
def create_quiz(current_user):
    # Only admin can create quizzes (simplified)
    try:
        data = request.get_json()
        
        if not data or not data.get('title') or not data.get('questions'):
            return jsonify({'message': 'Missing required fields'}), 400
        
        questions = data['questions']
        
        quiz = Quiz(
            title=data['title'],
            description=data.get('description', ''),
            difficulty=data.get('difficulty', 'medium'),
            category=data.get('category', ''),
            total_questions=len(questions),
            time_limit=data.get('time_limit')
        )
        quiz.set_questions(questions)
        
        db.session.add(quiz)
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz created successfully',
            'quiz': quiz.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


# ============================================
# API ROUTES - QUIZ RESULTS
# ============================================

@app.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
@token_required
def submit_quiz(current_user, quiz_id):
    try:
        data = request.get_json()
        
        if not data or 'answers' not in data:
            return jsonify({'message': 'Missing answers'}), 400
        
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({'message': 'Quiz not found'}), 404
        
        user_answers = data['answers']
        questions = quiz.get_questions()
        
        # Calculate score
        correct_count = 0
        for i, answer in enumerate(user_answers):
            if i < len(questions) and answer == questions[i].get('correctAnswer'):
                correct_count += 1
        
        percentage = (correct_count / len(questions)) * 100 if questions else 0
        time_taken = data.get('time_taken')
        
        # Save result
        result = QuizResult(
            user_id=current_user.id,
            quiz_id=quiz_id,
            score=correct_count,
            total_questions=len(questions),
            percentage=percentage,
            time_taken=time_taken
        )
        result.set_answers(user_answers)
        
        db.session.add(result)
        db.session.commit()
        
        return jsonify({
            'message': 'Quiz submitted successfully',
            'result': result.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


@app.route('/api/results', methods=['GET'])
@token_required
def get_user_results(current_user):
    try:
        results = QuizResult.query.filter_by(user_id=current_user.id).order_by(
            QuizResult.attempted_at.desc()
        ).all()
        
        return jsonify({
            'results': [result.to_dict() for result in results]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/results/<int:result_id>', methods=['GET'])
@token_required
def get_result(current_user, result_id):
    try:
        result = QuizResult.query.get(result_id)
        
        if not result:
            return jsonify({'message': 'Result not found'}), 404
        
        if result.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        quiz = result.quiz.to_dict(include_answers=True)
        
        return jsonify({
            'result': result.to_dict(),
            'quiz': quiz,
            'user_answers': result.get_answers()
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ============================================
# API ROUTES - DASHBOARD & ANALYTICS
# ============================================

@app.route('/api/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    try:
        stats = current_user.get_stats()
        results = QuizResult.query.filter_by(user_id=current_user.id).order_by(
            QuizResult.attempted_at.desc()
        ).limit(10).all()
        
        return jsonify({
            'user': current_user.to_dict(),
            'stats': stats,
            'recent_results': [result.to_dict() for result in results]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        # Get top users by average score
        users = User.query.all()
        leaderboard = []
        
        for user in users:
            stats = user.get_stats()
            if stats['total_quizzes'] > 0:
                leaderboard.append({
                    'name': user.name,
                    'total_quizzes': stats['total_quizzes'],
                    'average_score': stats['average_score'],
                    'best_score': stats['best_score'],
                    'total_points': stats['total_points']
                })
        
        # Sort by average score
        leaderboard.sort(key=lambda x: x['average_score'], reverse=True)
        
        return jsonify({
            'leaderboard': leaderboard[:20]  # Top 20
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# ============================================
# API ROUTES - USER PROFILE
# ============================================

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200


@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        if 'name' in data:
            current_user.name = data['name']
        
        if 'password' in data:
            if len(data['password']) < 6:
                return jsonify({'message': 'Password must be at least 6 characters'}), 400
            current_user.set_password(data['password'])
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500


# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'message': 'Internal server error'}), 500


# ============================================
# DATABASE INITIALIZATION
# ============================================

def init_db():
    with app.app_context():
        db.create_all()
        
        # Add demo user if doesn't exist
        if User.query.filter_by(email='demo@example.com').first() is None:
            demo_user = User(name='Demo User', email='demo@example.com')
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            db.session.commit()
            print("Demo user created")
        
        # Add sample quizzes if they don't exist
        if Quiz.query.count() == 0:
            sample_questions = [
                {
                    "id": 1,
                    "question": "What is the capital of France?",
                    "options": ["London", "Paris", "Berlin", "Madrid"],
                    "correctAnswer": 1
                },
                {
                    "id": 2,
                    "question": "Which planet is closest to the sun?",
                    "options": ["Venus", "Earth", "Mercury", "Mars"],
                    "correctAnswer": 2
                },
                {
                    "id": 3,
                    "question": "What is the largest ocean on Earth?",
                    "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                    "correctAnswer": 3
                },
                {
                    "id": 4,
                    "question": "Who wrote 'Romeo and Juliet'?",
                    "options": ["Jane Austen", "William Shakespeare", "Charles Dickens", "Mark Twain"],
                    "correctAnswer": 1
                },
                {
                    "id": 5,
                    "question": "What is the chemical symbol for Gold?",
                    "options": ["Go", "Gd", "Au", "Ag"],
                    "correctAnswer": 2
                }
            ]
            
            quiz = Quiz(
                title='General Knowledge Quiz',
                description='Test your knowledge on various topics',
                difficulty='medium',
                category='General Knowledge',
                total_questions=5,
                time_limit=300
            )
            quiz.set_questions(sample_questions)
            db.session.add(quiz)
            
            # Add more sample quizzes
            science_questions = [
                {
                    "id": 1,
                    "question": "What is the chemical formula for water?",
                    "options": ["H2O", "CO2", "O2", "H2"],
                    "correctAnswer": 0
                },
                {
                    "id": 2,
                    "question": "How many bones are in the human body?",
                    "options": ["186", "206", "226", "246"],
                    "correctAnswer": 1
                }
            ]
            
            quiz2 = Quiz(
                title='Science Quiz',
                description='Test your science knowledge',
                difficulty='medium',
                category='Science',
                total_questions=2,
                time_limit=120
            )
            quiz2.set_questions(science_questions)
            db.session.add(quiz2)
            
            db.session.commit()
            print("Database initialized with sample data")


# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='127.0.0.1', port=5000)
