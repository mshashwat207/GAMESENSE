import pandas as pd
import numpy as np

np.random.seed(42)
n = 100

reaction_time = []
accuracy = []
time_played = []
mistakes = []
skill_level = []

# Pro players: fast reaction, high accuracy, more hours, fewer mistakes
for _ in range(33):
    reaction_time.append(round(np.random.uniform(150, 250), 1))
    accuracy.append(round(np.random.uniform(80, 98), 1))
    time_played.append(round(np.random.uniform(4, 8), 1))
    mistakes.append(int(np.random.randint(1, 10)))
    skill_level.append("Pro")

# Intermediate players
for _ in range(34):
    reaction_time.append(round(np.random.uniform(250, 380), 1))
    accuracy.append(round(np.random.uniform(55, 80), 1))
    time_played.append(round(np.random.uniform(2, 5), 1))
    mistakes.append(int(np.random.randint(8, 20)))
    skill_level.append("Intermediate")

# Beginner players: slow, low accuracy, less time, many mistakes
for _ in range(33):
    reaction_time.append(round(np.random.uniform(380, 600), 1))
    accuracy.append(round(np.random.uniform(20, 55), 1))
    time_played.append(round(np.random.uniform(0.5, 2.5), 1))
    mistakes.append(int(np.random.randint(18, 40)))
    skill_level.append("Beginner")

df = pd.DataFrame({
    "reaction_time": reaction_time,
    "accuracy": accuracy,
    "time_played": time_played,
    "mistakes": mistakes,
    "skill_level": skill_level
})

df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv("dataset.csv", index=False)
print(f"Dataset created with {len(df)} rows.")
print(df["skill_level"].value_counts())
