import pandas as pd
import numpy as np

np.random.seed(42)
n = 100
data = []

for _ in range(n):
    skill = np.random.choice(["Beginner", "Intermediate", "Pro"], p=[0.35, 0.40, 0.25])

    if skill == "Pro":
        reaction_time = round(np.random.uniform(120, 220), 1)
        accuracy = round(np.random.uniform(78, 98), 1)
        time_played = round(np.random.uniform(4, 10), 1)
        mistakes = int(np.random.randint(0, 8))

    elif skill == "Intermediate":
        reaction_time = round(np.random.uniform(200, 320), 1)
        accuracy = round(np.random.uniform(55, 80), 1)
        time_played = round(np.random.uniform(2, 5), 1)
        mistakes = int(np.random.randint(5, 18))

    else:  # Beginner
        reaction_time = round(np.random.uniform(300, 500), 1)
        accuracy = round(np.random.uniform(30, 60), 1)
        time_played = round(np.random.uniform(0.5, 3), 1)
        mistakes = int(np.random.randint(12, 35))

    data.append([reaction_time, accuracy, time_played, mistakes, skill])

df = pd.DataFrame(data, columns=["reaction_time", "accuracy", "time_played", "mistakes", "skill_level"])
df.to_csv("data/dataset.csv", index=False)

print(f"Dataset saved with {len(df)} rows.")
print(df["skill_level"].value_counts())
