from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from app.data_loader import data_loader

router = APIRouter(prefix="/mining", tags=["Data Mining"])

@router.get("/rules")
def get_association_rules(
    min_support: float = Query(default=0.002, ge=0.0001, le=1.0),
    min_confidence: float = Query(default=0.20, ge=0.01, le=1.0),
    min_lift: float = Query(default=1.3, ge=1.0, le=50.0),
    category_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
):
    """
    Returns mined tag association rules with Apriori/FP-Growth metrics:
    Support, Confidence, and Lift. Supports category filtering and text search.
    """
    rules_data = data_loader.association_rules
    if not rules_data:
        return {"total_rules": 0, "rules": []}

    all_rules: List[Dict[str, Any]] = []
    if category_id is not None and str(category_id) in rules_data.get("category_rules", {}):
        all_rules = rules_data["category_rules"][str(category_id)].get("rules", [])
    else:
        all_rules = rules_data.get("top_rules", [])

    filtered = []
    search_lower = search.strip().lower() if search else None

    for r in all_rules:
        if r["support"] < min_support:
            continue
        if r["confidence"] < min_confidence:
            continue
        if r["lift"] < min_lift:
            continue

        if search_lower:
            ante_match = any(search_lower in tag.lower() for tag in r["antecedent"])
            cons_match = any(search_lower in tag.lower() for tag in r["consequent"])
            if not (ante_match or cons_match):
                continue

        filtered.append(r)
        if len(filtered) >= limit:
            break

    return {
        "total_rules": len(filtered),
        "total_mined_pool": rules_data.get("unique_mined_rules", 0),
        "total_transactions": rules_data.get("total_transactions", 0),
        "rules": filtered,
    }

@router.get("/graph")
def get_tag_graph(limit: int = Query(default=60, ge=10, le=120)):
    """
    Returns graph nodes and directional links for interactive network visualization.
    """
    rules_data = data_loader.association_rules
    if not rules_data or "graph" not in rules_data:
        return {"nodes": [], "links": []}

    graph = rules_data["graph"]
    links = graph.get("links", [])[:limit]
    active_nodes = set()
    for l in links:
        active_nodes.add(l["source"])
        active_nodes.add(l["target"])

    nodes = [n for n in graph.get("nodes", []) if n["id"] in active_nodes]
    return {"nodes": nodes, "links": links}

@router.get("/categories")
def get_mining_categories():
    """
    Returns list of categories that have specific mined association rules.
    """
    rules_data = data_loader.association_rules
    if not rules_data:
        return []

    cats = []
    for cat_id, info in rules_data.get("category_rules", {}).items():
        cats.append({
            "categoryId": int(cat_id),
            "category_name": info["category_name"],
            "rules_count": len(info.get("rules", [])),
            "top_tags_count": len(info.get("top_tags", [])),
        })
    return cats
