def calculate_skill_score(reaction_time, accuracy, time_played, mistakes):
    # lower reaction time = better, so we flip it
    reaction_score = max(0, 100 - ((reaction_time - 120) / 380) * 100)
    accuracy_score = accuracy  # already 0-100
    time_score = min(100, (time_played / 10) * 100)
    mistake_score = max(0, 100 - (mistakes / 35) * 100)

    # weighted average - accuracy matters most
    score = (reaction_score * 0.30 + accuracy_score * 0.35 +
             time_score * 0.15 + mistake_score * 0.20)
    return round(score, 1)


def get_feedback(skill_level, reaction_time, accuracy, mistakes):
    messages = {
        "Pro": "You're a Pro player — sharp reflexes and great accuracy. Keep dominating!",
        "Intermediate": "You're an Intermediate player — good consistency, but room to improve.",
        "Beginner": "You're a Beginner — everyone starts somewhere. Focus on accuracy and reduce mistakes."
    }

    tips = []
    if reaction_time > 280:
        tips.append("Work on reducing your reaction time (aim for under 250ms).")
    if accuracy < 60:
        tips.append("Try to improve your accuracy — slow down and aim better.")
    if mistakes > 15:
        tips.append("Too many mistakes — focus on precision over speed.")

    return messages.get(skill_level, "Unknown level"), tips


def get_playstyle(reaction_time, accuracy, mistakes):
    fast = reaction_time < 220
    accurate = accuracy >= 70
    low_mistakes = mistakes <= 8

    if accurate and low_mistakes and not fast:
        return "Precision Player", "precision", "High accuracy, methodical approach. You aim before you shoot."
    if fast and not accurate:
        return "Aggressive Player", "aggressive", "Fast reactions but trades accuracy for speed. High risk, high reward."
    return "Balanced Player", "balanced", "Solid all-around performance. Consistent and reliable under pressure."


def get_weakness(reaction_time, accuracy, mistakes):
    scores = {
        "Reaction Time": max(0, 100 - ((reaction_time - 120) / 380) * 100),
        "Accuracy": accuracy,
        "Mistake Control": max(0, 100 - (mistakes / 35) * 100)
    }

    weakest = min(scores, key=scores.get)
    strongest = max(scores, key=scores.get)

    feedback = {
        "Reaction Time": "Your reaction time needs work — try daily reaction drills.",
        "Accuracy": "Your accuracy needs improvement — slow down and aim more carefully.",
        "Mistake Control": "You're making too many mistakes — focus on precision over speed."
    }
    return weakest, strongest, feedback[weakest]


def get_recommendations(reaction_time, accuracy, mistakes):
    recos = []

    if reaction_time > 280:
        recos.append({"icon": "⚡", "text": "Practice reaction drills — tools like humanbenchmark.com can help."})
    if accuracy < 65:
        recos.append({"icon": "🎯", "text": "Practice aim training — try Aim Lab or KovaaK's for 10 min daily."})
    if mistakes > 12:
        recos.append({"icon": "🧘", "text": "Slow down and focus on control. Accuracy beats speed in the long run."})
    if reaction_time <= 220 and accuracy >= 75:
        recos.append({"icon": "🏆", "text": "You're performing well — try harder difficulty modes to push your limits."})

    if not recos:
        recos.append({"icon": "💪", "text": "Keep playing consistently to maintain and improve your skill level."})

    return recos


def print_summary(name, reaction_time, accuracy, time_played, mistakes, score, skill_level):
    print("\n" + "=" * 50)
    print(f"  Player Report: {name}")
    print("=" * 50)
    print(f"  Reaction Time : {reaction_time} ms")
    print(f"  Accuracy      : {accuracy}%")
    print(f"  Time Played   : {time_played} hrs/day")
    print(f"  Mistakes      : {mistakes}")
    print(f"  Skill Score   : {score}/100")
    print("-" * 50)

    message, tips = get_feedback(skill_level, reaction_time, accuracy, mistakes)
    print(f"\n  >> {message}")

    if tips:
        print("\n  Tips to improve:")
        for tip in tips:
            print(f"   - {tip}")
    print("=" * 50 + "\n")
