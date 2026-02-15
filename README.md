# News Intelligence Engine

A full-stack application that leverages AI to synthesize global event data into actionable intelligence.

**Live Demo:** [https://backend-and-frontend-kl5.onrender.com](https://backend-and-frontend-kl5.onrender.com)

## Project Structure

This project is organized into two main components:

- **`backend/`**: Contains the Flask application logic and database.
    -   `app.py`: Main server file.
    -   `news.db`: SQLite database.
    -   `requirements.txt`: Python dependencies.
    -   `prompt_history.txt`: Archive of AI prompts.
- **`frontend/`**: Contains the user interface assets.
    -   `templates/`: HTML templates served by Flask.
    -   `static/`: Static assets (CSS, JS, images).
- **`render.yaml`**: Deployment configuration for Render.

## Features

- **Real-Time Analysis**: Fetches maximum relevance articles via NewsAPI.
- **AI Synthesis**: Uses Google Gemini 2.0 Flash to generate analyst assessments and key points.
- **History Tracking**: Saves searches to a local SQLite database.

## Setup Instructions

### Prerequisites
- Python 3.10+
- API Keys: [NewsAPI](https://newsapi.org/) & [Google Gemini](https://ai.google.dev/)

### Local Development
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/KaiwenLi2007/backend_and_frontend.git
    cd backend_and_frontend
    ```

2.  **Navigate to Backend & Install Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

3.  **Configure Environment:**
    Create a `.env` file in the `backend/` directory:
    ```env
    NEWS_API_KEY=your_news_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the App:**
    ```bash
    python app.py
    ```
    Access the app at `http://127.0.0.1:5000`.

## Deployment (Render)

The included `render.yaml` handles deployment automatically.
1.  Connect your GitHub repository to Render.
2.  Add Environment Variables (`NEWS_API_KEY`, `GEMINI_API_KEY`) in the Render Dashboard.
