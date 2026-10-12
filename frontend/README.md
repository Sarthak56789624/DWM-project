# Trending India – YouTube Analytics Studio (Frontend)

Modern, animated analytics dashboard built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Apache ECharts** (`echarts-for-react`). It visualizes findings from 251,277 Indian YouTube trending records (August 2020 – April 2024).

---

## Features & Pages

1. **Executive Overview**: Hero with particles & play button glow, 4 animated count-up KPI cards, dataset integrity check, and Pandas `describe()` summary moments.
2. **Distributions & Skew**: Smooth Log1p vs Linear interactive histograms (ECharts), box-plot whiskers, and extreme upper-outlier counts.
3. **Channels & Categories**: Animated horizontal bar race of top channels (Vijay Television, Sourav Joshi Vlogs, Sony SAB, Sun TV), average reach bars, and cross-filterable category donut chart.
4. **Relationships & Correlations**: Pearson correlation heatmap ($r \approx 0.80$ for Likes vs Views) and responsive sampled scatter explorer with brush/scroll zoom.
5. **Time Trends**: Dual-axis line/area chart with range slider (`dataZoom`), day/week/month aggregation switch, and automated peak mark points.
6. **Hall of Fame & Engagement**: Top 10 unique videos leaderboard with 3D-tilt cards and medal badges, engagement-rate distribution, and comments/ratings disabled gauges.
7. **Regression Lab (Interactive)**: Real-time Simple vs Multiple Linear Regression inference, parameter sliders, count-up predicted views, regression hyperplane visualization, and metrics table ($R^2 \approx 0.635$).
8. **Popularity Classifier (Interactive)**: Interactive form predicting whether a video exceeds the 947k median view threshold, confetti celebration, Decision Tree (82.2% acc) vs Gaussian Naive Bayes (74.4% acc) benchmark, and collapsible depth-5 decision tree viewer.
9. **Behavioral Cluster Explorer**: Optimal K evaluation (Elbow & Silhouette), 2D PCA scatter projection (~81.8% variance explained), cluster profile cards, and "Where Does My Video Fall?" real-time K-Means cluster assignment.

---

## Quickstart

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create `.env` (or copy `.env.example`):
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
Outputs static assets into `dist/`.
