import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'news.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Models
class SearchHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    summary = db.Column(db.Text, nullable=False)
    sentiment = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

# API Keys
NEWS_API_KEY = os.environ.get('NEWS_API_KEY')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@app.route('/', methods=['GET'])
def home():
    return "Live and Running!"                                

@app.route('/history', methods=['GET'])
def get_history():
    try:
        history = SearchHistory.query.order_by(SearchHistory.timestamp.desc()).limit(15).all()
        return jsonify([{
            'topic': h.topic,
            'summary': h.summary,
            'sentiment': h.sentiment,
            'timestamp': h.timestamp.isoformat()
        } for h in history])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get-news', methods=['POST'])
def get_news():
    if not NEWS_API_KEY or not GEMINI_API_KEY:
        missing = []
        if not NEWS_API_KEY: missing.append("NEWS_API_KEY")
        if not GEMINI_API_KEY: missing.append("GEMINI_API_KEY")
        return jsonify({'error': f"Missing configuration: {', '.join(missing)}"}), 500

    data = request.json
    topic = data.get('topic')
    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    try:
        # 1. Fetch from NewsAPI
        news_url = f"https://newsapi.org/v2/everything?q={topic}&pageSize=10&sortBy=relevancy&apiKey={NEWS_API_KEY}"
        response = requests.get(news_url)
        news_data = response.json()

        if news_data.get('status') != 'ok':
            return jsonify({'error': 'Failed to fetch news'}), 500

        articles = news_data.get('articles', [])
        if not articles:
            return jsonify({'error': 'No news found for this topic'}), 404

        # Prepare text for Gemini
        article_snippets = []
        for art in articles:
            title = art.get('title', '')
            desc = art.get('description', '')
            article_snippets.append(f"Title: {title}\nDescription: {desc}")

        context = "\n\n".join(article_snippets)

        # 2. Gemini Summary & Vibe Check with Fallback
        
        # List of models to try in order of preference
        models_to_try = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-flash-latest'
        ]
        
        model = None
        gemini_response = None
        last_error = None

        for model_name in models_to_try:
            try:
                print(f"Trying Gemini model: {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                prompt = (
                    f"Analyze the following news snippets about '{topic}' and provide a structured report:\n"
                    "1. **Analyst Assessment**: A 2-3 sentence 'big picture' summary of the situation.\n"
                    "2. **Key Developments**: 3-5 distinct bullet points of the most important details.\n"
                    "3. **Vibe Check**: One of (Positive, Neutral, Negative).\n\n"
                    f"News Snippets:\n{context}\n\n"
                    "Respond in this EXACT format:\n"
                    "Assessment: [Your Analyst Assessment paragraph]\n"
                    "Key Points:\n- [Point 1]\n- [Point 2]\n..."
                    "Sentiment: [Vibe Check]"
                )
                
                gemini_response = model.generate_content(prompt)
                if gemini_response:
                    print(f"Success with model: {model_name}")
                    break
            except Exception as e:
                print(f"Failed with {model_name}: {e}")
                last_error = e
                continue
        
        if not gemini_response:
            raise Exception(f"All Gemini models failed. Last error: {last_error}")

        full_text = gemini_response.text

        # Parsing
        parts = full_text.split("Sentiment:")
        # Store everything before "Sentiment:" (Assessment + Key Points) as the summary
        summary = parts[0].strip()
        sentiment = parts[1].strip() if len(parts) > 1 else "Neutral"

        # 3. Save to History
        new_entry = SearchHistory(topic=topic, summary=summary, sentiment=sentiment)
        db.session.add(new_entry)
        db.session.commit()

        return jsonify({
            'topic': topic,
            'summary': summary,
            'sentiment': sentiment
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
