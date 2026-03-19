from sentence_transformers import SentenceTransformer, util

# your test data — query + expected matching document
test_pairs = [
    {
        "query": "What is the termination clause?",
        "match": "Either party may terminate this agreement with 30 days written notice",
        "no_match": "The governing law shall be the laws of India",
    },
    {
        "query": "Is there a non-compete clause?",
        "match": "Employee shall not engage in any competing business for 2 years",
        "no_match": "Payment shall be made within 30 days of invoice",
    },
    # add 20-50 pairs from your actual contracts
]

models_to_compare = [
    "sentence-transformers/all-MiniLM-L6-v2",
    "BAAI/bge-small-en-v1.5",
    "nlpaueb/legal-bert-base-uncased",
]

for model_name in models_to_compare:
    model = SentenceTransformer(model_name)
    correct = 0

    for pair in test_pairs:
        q = model.encode(pair["query"])
        match = model.encode(pair["match"])
        no_match = model.encode(pair["no_match"])

        sim_match = util.cos_sim(q, match).item()
        sim_no_match = util.cos_sim(q, no_match).item()

        if sim_match > sim_no_match:
            correct += 1

    accuracy = correct / len(test_pairs) * 100
    print(f"{model_name}: {accuracy:.1f}% accuracy on your data")
