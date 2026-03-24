# Gaming Skill Predictor

A web-based gaming performance analyzer that measures your reaction time and accuracy through interactive mini-games, then uses a machine learning model to predict your skill level and break down your performance.

The entire project runs from the terminal — one command starts the server, everything else happens in the browser.

---

## What It Does

You play through three stages:

1. **Reaction Test** — A box flashes green at a random interval. Click it as fast as you can. Repeated 5 times.
2. **Accuracy Test** — 15 colored targets appear one at a time and disappear after 1.4 seconds. Click as many as you can.
3. **Pressure Mode** — Same two tests repeated, but faster. Targets last only 0.9 seconds, and the reaction window is shorter.

After all three stages, your metrics (average reaction time, accuracy %, misses, session duration) are sent to the Flask backend. The ML model predicts your skill level and the app returns a full analysis.

---

## Results You Get

| Output | Description |
|---|---|
| Skill Level | Beginner / Intermediate / Pro |
| Skill Score | 0–100 weighted composite score |
| Playstyle | Precision / Aggressive / Balanced — based on your speed vs accuracy tradeoff |
| Radar Chart | Reaction, Accuracy, Consistency, Control — all normalized to 0–100 |
| Warmup Trend | Line chart of your 5 reaction times — shows if you improved or declined |
| Pressure Analysis | Side-by-side comparison of normal vs pressure mode performance |
| Weakness Detector | Identifies your weakest metric and gives specific feedback |
| Recommendations | Rule-based suggestions to improve (aim training, reaction drills, etc.) |
| Leaderboard | Top 5 scores saved in your browser's localStorage |

---

## Project Structure

```
Gaming Skill Predictor/
│
├── app.py                    # Flask server, single /predict endpoint
├── requirements.txt          # all dependencies
│
├── data/
│   ├── dataset.csv           # 100-sample synthetic training dataset
│   └── generate_dataset.py   # script to regenerate the dataset
│
├── model/
│   ├── train_model.py        # trains the Decision Tree and saves it
│   └── saved_model.pkl       # pre-trained model (ready to use)
│
├── utils/
│   └── helper.py             # skill score formula, playstyle logic,
│                             # weakness detection, recommendations
│
├── static/
│   ├── script.js             # all game logic, metric collection,
│   │                         # radar chart, trend chart, leaderboard
│   └── style.css             # dark gaming UI
│
└── templates/
    └── index.html            # single-page app (5 screens)
```

---

## How to Run

**Requirements:** Python 3.8 or higher

### Step 1 — Install dependencies

```bash
pip install -r requirements.txt
```

### Step 2 — Start the server

```bash
python app.py
```

### Step 3 — Open in browser

```
http://127.0.0.1:5000
```

That's it. The pre-trained model (`model/saved_model.pkl`) is already included so you don't need to retrain anything.

---

## Optional: Retrain the Model

If you want to regenerate the dataset or retrain from scratch:

```bash
# regenerate dataset
python data/generate_dataset.py

# retrain the model
python model/train_model.py
```

Both scripts run independently from the terminal with no extra setup.

---

## How the ML Model Works

The dataset has 100 synthetic samples with 4 features:

| Feature | Pro Range | Intermediate Range | Beginner Range |
|---|---|---|---|
| reaction_time (ms) | 120 – 220 | 200 – 320 | 300 – 500 |
| accuracy (%) | 78 – 98 | 55 – 80 | 30 – 60 |
| time_played (hrs/day) | 4 – 10 | 2 – 5 | 0.5 – 3 |
| mistakes | 0 – 7 | 5 – 17 | 12 – 34 |

A **Decision Tree classifier** (max_depth=5) is trained on 80% of the data and tested on the remaining 20%. The model is saved as a `.pkl` file and loaded once when the Flask server starts.

The skill score (0–100) is calculated separately using a weighted formula:

```
score = (reaction_score × 0.30) + (accuracy × 0.35) + (time_score × 0.15) + (mistake_score × 0.20)
```

---

## How the Frontend Works

All game logic runs in vanilla JavaScript — no frameworks, no external chart libraries.

- Reaction times are measured using `performance.now()` for millisecond precision
- The radar chart and trend line chart are drawn directly on HTML `<canvas>`
- Metrics are collected automatically and sent to `/predict` using `fetch()` with a JSON body
- The leaderboard is stored and retrieved from `localStorage`

---

## API

**POST** `/predict`

Request body:
```json
{
  "reaction_time": 245,
  "accuracy": 73.3,
  "time_played": 0.8,
  "mistakes": 4
}
```

Response:
```json
{
  "skill_level": "Intermediate",
  "score": 68.4,
  "message": "You're an Intermediate player — good consistency, but room to improve.",
  "tips": [],
  "playstyle": {
    "name": "Balanced Player",
    "key": "balanced",
    "desc": "Solid all-around performance. Consistent and reliable under pressure."
  },
  "weakness": {
    "weakest": "Reaction Time",
    "strongest": "Mistake Control",
    "message": "Your reaction time needs work — try daily reaction drills."
  },
  "recommendations": [
    { "icon": "⚡", "text": "Practice reaction drills — tools like humanbenchmark.com can help." }
  ]
}
```

---

## Dependencies

```
flask>=2.0
scikit-learn>=1.0
pandas>=1.3
numpy>=1.21
```

No other packages required. The frontend uses only browser-native APIs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| ML Model | scikit-learn — DecisionTreeClassifier |
| Data | pandas, numpy |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Charts | Canvas API (no Chart.js or D3) |
| Storage | Browser localStorage |
