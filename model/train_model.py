import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os


def train():
    df = pd.read_csv("data/dataset.csv")

    X = df[["reaction_time", "accuracy", "time_played", "mistakes"]]
    y = df["skill_level"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # decision tree works well here since the boundaries between skill levels are fairly clear
    model = DecisionTreeClassifier(max_depth=5, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"Model Accuracy: {accuracy_score(y_test, preds) * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, preds))

    os.makedirs("model", exist_ok=True)
    with open("model/saved_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("Model saved to model/saved_model.pkl")


if __name__ == "__main__":
    train()
