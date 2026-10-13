import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_and_meta(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["total_rows"] == 251277

    r_meta = client.get("/api/v1/meta")
    assert r_meta.status_code == 200
    meta = r_meta.json()
    assert meta["total_rows"] == 251277
    assert "simple_linear_regression" in meta["models_available"]
    assert "decision_tree" in meta["models_available"]

def test_overview_notebook_values(client):
    r = client.get("/api/v1/overview")
    assert r.status_code == 200
    data = r.json()
    assert data["total_rows"] == 251277
    assert data["unique_videos"] == 78847
    assert data["median_views"] == 947434.0
    assert "view_count" in data["numerical_summary"]
    assert data["missing_values"]["channelTitle"] == 1

def test_distributions(client):
    # Linear scale
    r = client.get("/api/v1/distributions?metric=view_count&bins=30&log=false")
    assert r.status_code == 200
    data = r.json()
    assert len(data["counts"]) == 30
    assert data["boxplot"]["median"] == 947434.0
    assert data["boxplot"]["outlier_count"] > 0

    # Log scale
    r_log = client.get("/api/v1/distributions?metric=view_count&bins=30&log=true")
    assert r_log.status_code == 200
    data_log = r_log.json()
    assert data_log["is_log"] is True

def test_channels_and_categories(client):
    r_top = client.get("/api/v1/channels/top?limit=10")
    assert r_top.status_code == 200
    channels = r_top.json()
    assert len(channels) == 10
    top_channel_names = [c["channel"] for c in channels]
    assert any("Vijay Television" in name or "Sourav Joshi" in name or "Sony SAB" in name for name in top_channel_names)

    r_avg = client.get("/api/v1/channels/avg-views?limit=10")
    assert r_avg.status_code == 200
    assert len(r_avg.json()) == 10

    r_cat = client.get("/api/v1/categories")
    assert r_cat.status_code == 200
    cats = r_cat.json()
    assert len(cats) > 0
    # Category 24 Entertainment should be first with ~39%
    assert cats[0]["categoryId"] == 24
    assert 38.0 <= cats[0]["percentage"] <= 40.0
    assert cats[0]["name"] == "Entertainment"

def test_correlation_and_scatter(client):
    r_corr = client.get("/api/v1/correlation")
    assert r_corr.status_code == 200
    corr = r_corr.json()
    assert "view_count" in corr["columns"]
    views_idx = corr["columns"].index("view_count")
    likes_idx = corr["columns"].index("likes")
    # Correlation between likes and views is ~0.80
    assert 0.75 <= corr["matrix"][views_idx][likes_idx] <= 0.85

    r_scat = client.get("/api/v1/scatter?x=view_count&y=likes&sample=500")
    assert r_scat.status_code == 200
    scat = r_scat.json()
    assert scat["sample_size"] == 500
    assert len(scat["points"]) == 500

def test_timeseries(client):
    for gran in ["day", "week", "month"]:
        r = client.get(f"/api/v1/timeseries/daily?granularity={gran}")
        assert r.status_code == 200
        data = r.json()
        assert data["granularity"] == gran
        assert len(data["series"]) > 0

def test_top_videos_and_engagement(client):
    r_vid = client.get("/api/v1/videos/top?limit=10")
    assert r_vid.status_code == 200
    vids = r_vid.json()
    assert len(vids) == 10
    # Ensure descending sort
    views = [v["view_count"] for v in vids]
    assert views == sorted(views, reverse=True)
    assert vids[0]["thumbnail_url"].startswith("http")

    r_eng = client.get("/api/v1/engagement")
    assert r_eng.status_code == 200
    eng = r_eng.json()
    assert "mean" in eng["describe"]
    assert "enabled" in eng["comments_status"]

def test_regression_endpoints(client):
    r_m = client.get("/api/v1/regression/metrics")
    assert r_m.status_code == 200
    metrics = r_m.json()
    # Check parity with notebook: R2 ≈ 0.628 for SLR, ≈ 0.635 for MLR
    assert abs(metrics["simple"]["r2"] - 0.6283) < 0.01
    assert abs(metrics["multiple"]["r2"] - 0.6346) < 0.01

    # Predict Simple
    r_p1 = client.post("/api/v1/regression/predict", json={"likes": 50000, "dislikes": 500, "comment_count": 2000, "model": "simple"})
    assert r_p1.status_code == 200
    p1 = r_p1.json()
    assert p1["predicted_views"] > 0

    # Predict Multiple
    r_p2 = client.post("/api/v1/regression/predict", json={"likes": 50000, "dislikes": 500, "comment_count": 2000, "model": "multiple"})
    assert r_p2.status_code == 200
    p2 = r_p2.json()
    assert p2["predicted_views"] > 0

def test_classification_endpoints(client):
    r_m = client.get("/api/v1/classification/metrics")
    assert r_m.status_code == 200
    metrics = r_m.json()
    # Check parity: DT accuracy ≈ 0.822, NB accuracy ≈ 0.744
    assert abs(metrics["decision_tree"]["accuracy"] - 0.8224) < 0.01
    assert abs(metrics["naive_bayes"]["accuracy"] - 0.7444) < 0.01
    assert "children" in metrics["decision_tree"]["tree_structure"]

    # Predict DT
    r_p1 = client.post("/api/v1/classification/predict", json={"likes": 100000, "dislikes": 1000, "comment_count": 5000, "categoryId": 24, "model": "decision_tree"})
    assert r_p1.status_code == 200
    p1 = r_p1.json()
    assert p1["predicted_class"] in ["Popular", "Not Popular"]
    assert "Popular" in p1["probabilities"]

    # Predict NB
    r_p2 = client.post("/api/v1/classification/predict", json={"likes": 500, "dislikes": 10, "comment_count": 20, "categoryId": 24, "model": "naive_bayes"})
    assert r_p2.status_code == 200
    p2 = r_p2.json()
    assert p2["predicted_class"] in ["Popular", "Not Popular"]

    # Predict via URL with channel analytics
    r_url = client.post("/api/v1/classification/predict-url", json={"url": "https://www.youtube.com/watch?v=v7K4vGYL9ow", "model": "decision_tree"})
    assert r_url.status_code == 200
    res_url = r_url.json()
    assert "metadata" in res_url
    assert "channel_analytics" in res_url
    assert "classification" in res_url
    assert res_url["classification"]["predicted_class"] in ["Popular", "Not Popular"]
    assert "analytical_verdict" in res_url["classification"]
    assert res_url["channel_analytics"]["is_tracked"] is True
    assert res_url["channel_analytics"]["channel_title"] == "YRF"

def test_clustering_endpoints(client):
    r_sum = client.get("/api/v1/clustering/summary")
    assert r_sum.status_code == 200
    summary = r_sum.json()
    assert "elbow_inertia" in summary["standard"]
    assert "silhouette_scores" in summary["standard"]
    assert len(summary["standard"]["pca_sample_points"]) > 0

    # Assign standard
    r_a1 = client.post("/api/v1/clustering/assign", json={"view_count": 1000000, "likes": 50000, "dislikes": 500, "comment_count": 1000, "log_transform": False})
    assert r_a1.status_code == 200
    a1 = r_a1.json()
    assert a1["cluster_id"] in [0, 1, 2, 3]

    # Assign log_transform
    r_a2 = client.post("/api/v1/clustering/assign", json={"view_count": 1000000, "likes": 50000, "dislikes": 500, "comment_count": 1000, "log_transform": True})
    assert r_a2.status_code == 200
    a2 = r_a2.json()
    assert a2["cluster_id"] in [0, 1, 2, 3]

def test_association_mining_endpoints(client):
    r_rules = client.get("/api/v1/mining/rules?min_support=0.001&limit=10")
    assert r_rules.status_code == 200
    data = r_rules.json()
    assert data["total_rules"] > 0
    assert len(data["rules"]) > 0
    rule = data["rules"][0]
    assert "antecedent" in rule and "consequent" in rule
    assert rule["lift"] >= 1.0

    r_graph = client.get("/api/v1/mining/graph?limit=20")
    assert r_graph.status_code == 200
    graph = r_graph.json()
    assert len(graph["nodes"]) > 0
    assert len(graph["links"]) > 0

    r_cats = client.get("/api/v1/mining/categories")
    assert r_cats.status_code == 200
    assert len(r_cats.json()) > 0

def test_creator_simulator_endpoints(client):
    r_sim = client.post("/api/v1/creator/simulate", json={
        "title": "Pathaan Official Trailer | Shah Rukh Khan",
        "categoryId": 24,
        "planned_day": "Friday",
        "planned_hour_ist": 18,
        "expected_likes": 150000,
        "expected_dislikes": 2000,
        "expected_comments": 10000,
        "planned_tags": "bollywood, action, trailer"
    })
    assert r_sim.status_code == 200
    sim = r_sim.json()
    assert "virality_index" in sim
    assert 0 <= sim["virality_index"] <= 100
    assert sim["predicted_metrics"]["predicted_views"] > 0
    assert "timing_insights" in sim

    r_timing = client.get("/api/v1/creator/timing/24")
    assert r_timing.status_code == 200
    timing = r_timing.json()
    assert timing["categoryId"] == 24
    assert "best_day" in timing
    assert len(timing["heatmap_grid"]) > 0

def test_live_youtube_endpoints(client):
    r_samples = client.get("/api/v1/youtube/samples")
    assert r_samples.status_code == 200
    samples = r_samples.json()
    assert len(samples) >= 4

    # Analyze sample video preset
    r_ana = client.post("/api/v1/youtube/analyze", json={
        "url": "https://www.youtube.com/watch?v=v7K4vGYL9ow"
    })
    assert r_ana.status_code == 200
    ana = r_ana.json()
    assert "benchmark_analysis" in ana
    assert ana["benchmark_analysis"]["actual_views"] > 0
    assert ana["benchmark_analysis"]["virality_grade"] in ["S+", "A", "B", "C"]
    assert "classification" in ana
    assert "clustering" in ana

def test_executive_report_endpoint(client):
    r_rep = client.get("/api/v1/report/summary")
    assert r_rep.status_code == 200
    rep = r_rep.json()
    assert "dataset_profile" in rep
    assert "ml_evaluation" in rep
    assert "association_rule_mining" in rep
    assert len(rep["key_insights"]) >= 5

