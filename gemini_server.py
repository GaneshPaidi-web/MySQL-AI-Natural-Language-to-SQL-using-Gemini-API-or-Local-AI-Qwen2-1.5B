from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

# Load dependencies from .env.gemini
load_dotenv(".env.gemini")

app = Flask(__name__)
CORS(app)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or api_key == "YOUR_GEMINI_API_KEY":
    print("WARNING: GEMINI_API_KEY not found or default value used in .env.gemini")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    try:
        data = request.json
        messages = data.get("messages", [])
        
        # Extract the last user message as the prompt
        prompt = ""
        for msg in messages:
            if msg.get("role") == "user":
                prompt = msg.get("content")
        
        print(f"Received Prompt: {prompt[:100]}...")

        # Generate content using Gemini
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Simple cleaning of markdown code blocks if Gemini returns them
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```sql" in response_text:
            response_text = response_text.split("```sql")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        print(f"Gemini Response: {response_text[:100]}...")

        # Return OpenAI-compatible response
        return jsonify({
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": "gemini-1.5-flash",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    },
                    "finish_reason": "stop"
                }
            ]
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("=================================")
    print(" Gemini AI SQL Server Running ")
    print(" http://localhost:5001")
    print("=================================")
    app.run(port=5001, debug=False)
