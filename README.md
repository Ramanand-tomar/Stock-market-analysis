# NIFTY 50 AI Stock Intelligence App

Full-stack ML-powered stock analysis platform for NSE NIFTY 50 stocks (1999-2026). Combines 14+ ML models with a FastAPI backend and React Native mobile app.

## Architecture

```
Dataset/                    Raw NIFTY 50 CSV (287K records, 49 stocks)
    |
ml/                         ML Pipeline & Training
    pipeline/               Ingest -> Clean -> Features -> Split
    train/                  Regression, Classification, Unsupervised
    models/                 Saved .pkl models + metrics.json
    data/processed/         train/val/test Parquet files
    |
backend/                    FastAPI REST API
    app/api/                Auth, Stocks, Predict, Models, Insights
    app/ml/                 Inference engine + Explainer
    app/core/               Config, Security (JWT), Database
    |                       PostgreSQL (Neon) + MongoDB (Atlas)
    |
mobile/                     React Native Expo App
    app/(tabs)/             6-tab navigator
    components/             Charts, Cards, Tables
    store/                  Redux Toolkit + Persist
    api/                    Axios client with JWT refresh
```

## Prerequisites

- **Python 3.11+** (for backend and ML pipeline)
- **Node.js 18+** (for mobile app)
- **Docker** (optional, for containerized deployment)
- **Expo Go** app on your phone (for mobile testing)

## Setup (8 Steps)

### 1. Clone and install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Neon DB and MongoDB Atlas credentials
```

### 3. Run the data pipeline

```bash
cd ..
python -m ml.pipeline.run_pipeline
```

This generates `train.parquet`, `val.parquet`, `test.parquet` in `ml/data/processed/`.

### 4. Train models (or use Google Colab)

```bash
python -m ml.train.run_training
```

Saves 14+ model `.pkl` files and `metrics.json` to `ml/models/`.

### 5. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs at: **http://localhost:8000/docs**

### 6. Seed stock data into PostgreSQL

```bash
cd backend
python -m app.load_data
```

### 7. Install and run the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android).

### 8. Docker deployment (optional)

```bash
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | - | Health check |
| POST | `/auth/register` | - | Register user |
| POST | `/auth/login` | - | Login, returns JWT |
| POST | `/auth/refresh` | - | Refresh access token |
| GET | `/auth/me` | JWT | Current user |
| GET | `/stocks` | - | Paginated stock list |
| GET | `/stocks/{ticker}` | - | Stock metadata |
| GET | `/stocks/{ticker}/history` | - | OHLCV data with date filter |
| GET | `/stocks/{ticker}/indicators` | - | Technical indicators |
| GET | `/predict/{ticker}` | JWT | AI prediction (cached 1hr) |
| GET | `/predict/{ticker}/explain` | JWT | Feature importance + insight |
| GET | `/models/metrics` | - | All model metrics |
| GET | `/models/{name}/metrics` | - | Single model metrics |
| GET | `/insights/clusters` | - | K-Means cluster assignments |
| GET | `/insights/pca` | - | PCA 2D projection |
| GET/POST | `/user/watchlist` | JWT | Watchlist CRUD |
| DELETE | `/user/watchlist/{ticker}` | JWT | Remove from watchlist |
| GET | `/user/predictions` | JWT | Prediction history |
| GET | `/admin/stats` | Admin | Dashboard stats |

## ML Models

**Regression** (Target: next-day Close price)
- Linear Regression, Decision Tree, Random Forest, Gradient Boosting, SVR, KNN

**Classification** (Target: price direction UP/DOWN)
- Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, SVC, KNN, AdaBoost, Voting Ensemble

**Unsupervised**
- K-Means Clustering (k=5), PCA (2 components)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML | scikit-learn, pandas, numpy |
| Backend | FastAPI, SQLAlchemy (async), Motor |
| Database | PostgreSQL (Neon), MongoDB (Atlas) |
| Auth | JWT (python-jose), bcrypt |
| Mobile | React Native, Expo Router, Redux Toolkit |
| Charts | Victory Native, react-native-svg |
| Deployment | Docker, docker-compose |

## Project Structure

```
Stock-market-analysis/
  Dataset/                  Raw CSV data
  ml/
    pipeline/               Data pipeline (ingest, clean, features, split)
    train/                  Model training scripts
    models/                 Saved models + metrics
    data/processed/         Parquet files
    notebooks/              EDA notebook
  backend/
    app/                    FastAPI application
    Dockerfile
    init.sql                Database schema
    .env.example
  mobile/
    app/                    Expo Router screens
    components/             Reusable UI components
    store/                  Redux state management
    api/                    API client layer
  docker-compose.yml
```
