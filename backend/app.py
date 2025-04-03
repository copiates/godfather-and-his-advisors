from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple response templates based on keywords
RESPONSE_TEMPLATES = {
    "distraction": [
        "Based on your profile, I notice you struggle with distractions. Try implementing the Pomodoro technique - work for 25 minutes, then take a 5-minute break.",
        "Distractions can significantly impact your focus. Consider using website blockers during your deep work sessions.",
        "For managing distractions, create a dedicated workspace that signals to your brain it's time to focus."
    ],
    "energy": [
        "Your energy levels fluctuate throughout the day. Try scheduling your most demanding tasks during your peak energy hours.",
        "To maintain energy throughout the day, consider short movement breaks every hour.",
        "Proper hydration and nutrition can help maintain consistent energy levels during focus sessions."
    ],
    "environment": [
        "Your work environment plays a crucial role in maintaining focus. Consider noise-cancelling headphones if you're in a noisy space.",
        "Optimize your workspace by removing visual clutter and ensuring proper lighting.",
        "Try working in different environments to see which one helps you maintain focus the longest."
    ],
    "time": [
        "Time management is essential for deep focus. Try timeboxing your tasks to create a sense of urgency.",
        "Consider using the 2-minute rule: if a task takes less than 2 minutes, do it immediately.",
        "Track your focus sessions to identify patterns in your productivity throughout the day."
    ],
    "productivity": [
        "To boost productivity, try batching similar tasks together to reduce context switching.",
        "The 'eat the frog' technique suggests tackling your most challenging task first thing in the morning.",
        "Regular breaks are essential for sustained productivity. Try the 52/17 rule - 52 minutes of work followed by 17 minutes of rest."
    ]
}

# Default responses when no keywords match
DEFAULT_RESPONSES = [
    "I recommend starting with a clear intention for each work session. What specific outcome do you want to achieve?",
    "Deep focus requires practice. Start with shorter sessions and gradually increase the duration as your focus muscle strengthens.",
    "Consider creating a pre-work ritual that signals to your brain it's time to enter a focused state.",
    "Reflection is key to improving focus. At the end of each day, note what helped and hindered your concentration.",
    "Remember that focus is a skill that improves with consistent practice. Be patient with yourself as you develop this ability."
]

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    focus_profile = data.get('profile', {})
    
    # Simulate processing time
    time.sleep(1)
    
    # Generate response based on user input and profile
    response = generate_response(user_input, focus_profile)
    
    return jsonify({
        'message': response,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S')
    })

def generate_response(user_input, profile):
    # Convert input to lowercase for easier matching
    input_lower = user_input.lower()
    
    # Check for keywords in the input
    for keyword, responses in RESPONSE_TEMPLATES.items():
        if keyword in input_lower:
            return random.choice(responses)
    
    # If profile has information, use it to personalize response
    if profile and any(profile.values()):
        if profile.get('distractions'):
            distractions = profile.get('distractions', '')
            if isinstance(distractions, list) and distractions:
                distraction = distractions[0] if isinstance(distractions, list) else distractions
                return f"I notice that {distraction} is a significant distraction for you. Try setting specific times to check on these things rather than allowing them to interrupt your focus."
        
        if profile.get('productiveHours'):
            return f"You mentioned you're most productive during {profile.get('productiveHours')}. Try scheduling your most challenging tasks during this time to maximize your natural energy flow."
        
        if profile.get('currentChallenges'):
            return f"Regarding your challenge with {profile.get('currentChallenges')}, breaking this down into smaller, manageable tasks might help you make progress without feeling overwhelmed."
    
    # Default response if no specific matches
    return random.choice(DEFAULT_RESPONSES)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
