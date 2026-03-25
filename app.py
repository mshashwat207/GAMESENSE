import pickle
import os
import sys
import pandas as pd
from flask import Flask, request, jsonify, render_template

sys.path.append(os.path.dirname(__file__))
from utils.helper import calculate_skill_score, get_feedback, get_playstyle, get_weakness, get_recommendations

app = Flask(__name__)

# load the trained model once at startup
with open("model/saved_model.pkl", "rb") as f:
    model = pickle.load(f)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    try:
        reaction_time = float(data["reaction_time"])
        accuracy = float(data["accuracy"])
        time_played = float(data["time_played"])
        mistakes = int(data["mistakes"])
    except (KeyError, ValueError):
        return jsonify({"error": "Invalid input"}), 400

    features = pd.DataFrame(
        [[reaction_time, accuracy, time_played, mistakes]],
        columns=["reaction_time", "accuracy", "time_played", "mistakes"]
    )

    skill_level = model.predict(features)[0]
    score = calculate_skill_score(reaction_time, accuracy, time_played, mistakes)
    message, tips = get_feedback(skill_level, reaction_time, accuracy, mistakes)
    playstyle_name, playstyle_key, playstyle_desc = get_playstyle(reaction_time, accuracy, mistakes)
    weakest, strongest, weakness_msg = get_weakness(reaction_time, accuracy, mistakes)
    recommendations = get_recommendations(reaction_time, accuracy, mistakes)

    return jsonify({
        "skill_level": skill_level,
        "score": score,
        "message": message,
        "tips": tips,
        "playstyle": {"name": playstyle_name, "key": playstyle_key, "desc": playstyle_desc},
        "weakness": {"weakest": weakest, "strongest": strongest, "message": weakness_msg},
        "recommendations": recommendations
    })

if __name__ == "__main__":
    app.run(debug=True)
