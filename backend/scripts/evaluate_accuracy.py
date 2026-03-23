import json
import os
import sys
from typing import Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

from services.vector_service import search_knowledge_base

load_dotenv()

CUAD_JSON_PATH = os.path.join(os.path.dirname(__file__), "CUAD_v1.json")


def evaluate():
    with open(CUAD_JSON_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)

    true_positives = 0
    false_positives = 0
    false_negatives = 0
    total_tested = 0

    # test first 100 labeled clauses only
    test_clauses: list[dict[str, Any]] = []
    for contract in raw["data"]:
        for para in contract["paragraphs"]:
            for qa in para["qas"]:
                if qa["is_impossible"] or not qa["answers"]:
                    continue
                parts = qa["id"].split("__")
                label = parts[1] if len(parts) >= 2 else "Unknown"
                for answer in qa["answers"]:
                    text = answer["text"].strip()
                    if len(text) > 20:
                        test_clauses.append(
                            {
                                "clause": text,
                                "true_label": label,
                            }
                        )
                if len(test_clauses) >= 100:
                    break
            if len(test_clauses) >= 100:
                break
        if len(test_clauses) >= 100:
            break

    print(f"Testing {len(test_clauses)} clauses...")

    for item in test_clauses:
        clause = item["clause"]
        true_label = item["true_label"]
        total_tested += 1

        matches = search_knowledge_base(
            clause=clause,
            top_k=1,
            score_threshold=0.60,
        )

        if matches:
            predicted_label = matches[0]["label"]
            if predicted_label == true_label:
                true_positives += 1
            else:
                false_positives += 1
        else:
            false_negatives += 1

    precision = (
        true_positives / (true_positives + false_positives)
        if (true_positives + false_positives) > 0
        else 0
    )
    recall = (
        true_positives / (true_positives + false_negatives)
        if (true_positives + false_negatives) > 0
        else 0
    )
    f1 = (
        2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    )

    print("\n=== Accuracy Report ===")
    print(f"Total tested    : {total_tested}")
    print(f"True positives  : {true_positives}")
    print(f"False positives : {false_positives}")
    print(f"False negatives : {false_negatives}")
    print(f"Precision       : {precision:.2%}")
    print(f"Recall          : {recall:.2%}")
    print(f"F1 Score        : {f1:.2%}")


if __name__ == "__main__":
    evaluate()
