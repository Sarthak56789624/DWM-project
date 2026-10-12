# 🇮🇳 YouTube Trending India — Analytics & Predictive ML System

A full-stack **Data Warehousing & Data Mining (DWM)** analytics platform analyzing **251,277** Indian YouTube Trending video records (August 2020 – April 2024).

The platform features an optimized **FastAPI REST API**, an interactive **React + TypeScript + Tailwind + ECharts** dashboard, pre-trained **Machine Learning inference pipelines**, **Tag Association Rule Mining (Apriori)**, an interactive **Creator Virality Simulator**, a **Live YouTube URL Analyzer**, and an **Executive DWM Audit Report exporter**.

---

## 🏗️ System Architecture

```
dwm-project/
├── backend/                      # FastAPI Backend Service
│   ├── app/                      # Application source code
│   │   ├── routers/              # Modular API routers (11 endpoints)
│   │   │   ├── overview.py       # Dataset profiling & metadata
│   │   │   ├── eda.py            # Distributions, boxplots, correlation, scatter
│   │   │   ├── channels.py       # Top channels & category analytics
│   │   │   ├── timeseries.py     # Temporal aggregation & lag metrics
│   │   │   ├── regression.py     # Simple & Multiple Linear Regression
│   │   │   ├── classification.py # Decision Tree & Gaussian Naive Bayes
│   │   │   ├── clustering.py     # K-Means (K=4) clustering & 2D PCA
│   │   │   ├── mining.py         # Tag Association Mining (Apriori/FP-Growth)
│   │   │   ├── creator.py        # Creator Virality Simulator & Timing Heatmap
│   │   │   ├── live_youtube.py   # Live YouTube Video URL Analyzer
│   │   │   └── report.py         # Executive DWM Audit Report bundle
│   │   ├── services/             # Business logic & ML inference
│   │   ├── config.py             # Environment configuration & paths
│   │   ├── data_loader.py        # In-memory singleton DataLoader & cache
│   │   ├── schemas.py            # Pydantic validation schemas
│   │   └── main.py               # FastAPI entrypoint & middleware
│   ├── data/
│   │   └── processed/            # 18 MB Parquet, rules & timing profiles
│   ├── models/                   # Serialized ML joblib models & metrics.json
│   ├── scripts/                  # Data prep, training & association mining scripts
│   ├── tests/                    # Automated pytest suite (14/14 passed)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind Dashboard
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, UI widgets
│   │   ├── pages/                # 13 Interactive Dashboard Pages
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── DistributionsPage.tsx
│   │   │   ├── ChannelsCategoriesPage.tsx
│   │   │   ├── RelationshipsPage.tsx
│   │   │   ├── TimeTrendsPage.tsx
│   │   │   ├── TopVideosPage.tsx
│   │   │   ├── RegressionLabPage.tsx
│   │   │   ├── ClassifierPage.tsx
│   │   │   ├── ClusterExplorerPage.tsx
│   │   │   ├── AssociationMiningPage.tsx  # Force-Directed Tag Graph & Rules
│   │   │   ├── CreatorSimulatorPage.tsx   # "Will My Video Trend?" Virality Tool
│   │   │   ├── LiveAnalyzerPage.tsx       # Live Video URL Analyzer
│   │   │   └── ExecutiveReportPage.tsx    # Technical DWM Audit Report & PDF
│   │   ├── lib/                  # TanStack React Query API client
│   │   └── types/                # Strict TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── DWM_India_youtube_project.ipynb # Research & exploration notebook
└── README.md
```

---

## 🚀 Key Features

### 1. Data Warehousing & Fast In-Memory Parquet
- Replaces raw 420 MB CSV parsing with an optimized **18.4 MB Parquet** file loaded once into memory via lifespan startup handler.
- Sub-15ms aggregation response times with `@lru_cache` memoization.

### 2. Machine Learning & Mining Parity
- **Simple Linear Regression:** Predicts Views from Likes ($R^2 \approx 0.628$).
- **Multiple Linear Regression:** Predicts Views from Likes, Dislikes, Comments ($R^2 \approx 0.635$).
- **Decision Tree Classifier:** Predicts video popularity at Depth 5 with $\approx 82.2\%$ accuracy.
- **Gaussian Naive Bayes:** Binary classification with $\approx 97\%$ precision.
- **K-Means Clustering ($K=4$):** Standard and Log-transformed clustering with Elbow inertia, Silhouette scores, and 2D PCA projection.
- **Association Rule Mining:** Mined 19,555 rules across 64,768 transactions using Apriori/FP-Growth principles.

### 3. Interactive Analytics & Tooling
- **Virality Simulator:** Enter a prospective video title, category, target publish day/hour (IST), and expected engagement to calculate a composite **Virality Readiness Score (0–100)** with category heatmap recommendations and high-lift tag suggestions.
- **Live YouTube Video Analyzer:** Paste any live YouTube URL or choose sample presets to benchmark real-world video performance against the 251k trending baseline.
- **Executive Report & PDF Exporter:** Generate and download a comprehensive academic/technical DWM report with one-click print-to-PDF formatting, JSON audit download, and Markdown summary.

---

## 🛠️ Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API is available at: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
- Web Application is available at: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 🧪 Running Automated Tests

Run the full pytest suite covering all 11 API routers:

```bash
cd backend
python -m pytest tests/test_api.py -v
```
*(14 of 14 passed with 100% router coverage)*

---

## 📜 License
MIT License.
