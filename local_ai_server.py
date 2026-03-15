from flask import Flask, request, jsonify
from flask_cors import CORS
from gpt4all import GPT4All
import time
import os

app = Flask(__name__)
CORS(app)

# -----------------------------
# MODEL SETTINGS
# -----------------------------
MODEL_NAME = "qwen2-1_5b-instruct-q4_0.gguf"
MODEL_PATH = os.path.expanduser("~/.cache/gpt4all/")

print("Loading model...")

try:
    model = GPT4All(
        MODEL_NAME,
        model_path=MODEL_PATH,
        allow_download=False
    )
    print("Model loaded successfully")

except Exception as e:
    print("Error loading model:", e)
    raise e


# -----------------------------
# CHAT COMPLETION ENDPOINT
# -----------------------------
@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():

    data = request.json
    messages = data.get("messages", [])

    user_question = ""

    # Extract user question
    for msg in messages:
        if msg.get("role") == "user":
            user_question = msg.get("content")

    # Prompt template for Text → SQL
    # If the user_question already looks like a structured prompt from aiService.js, pass it through.
    instruct_keywords = ["Context:", "Task:", "DATABASE SCHEMA:", "MySQL expert", "INSTRUCTIONS:"]
    if any(kw in user_question for kw in instruct_keywords):
        prompt = user_question
    else:
        prompt = f"""
You are an expert MySQL assistant.

Convert the question into a valid SQL query.

Return ONLY SQL.

Question:
{user_question}

SQL:
"""

    print("User question:", user_question)

    # Generate response
    with model.chat_session():
        response_text = model.generate(
            prompt,
            max_tokens=512, # Increased for JSON responses
            temp=0.1,
            top_k=40,
            top_p=0.9,
            repeat_penalty=1.1
        )

    response_text = response_text.strip()

    # Remove unwanted tokens if present
    if "<|im_end|>" in response_text:
        response_text = response_text.split("<|im_end|>")[0]

    if "<|endoftext|>" in response_text:
        response_text = response_text.split("<|endoftext|>")[0]

    # Quick fix for common Qwen/LocalAI "thinking" or "markdown" output
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```sql" in response_text:
        response_text = response_text.split("```sql")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()
    else:
        # Improved response cleaning: stop at the first semicolon
        # IMPORTANT: Only do this if it doesn't look like JSON, otherwise we break the JSON structure
        stripped_text = response_text.strip()
        if not stripped_text.startswith('{'):
            if ";" in response_text:
                response_text = response_text.split(";")[0] + ";"
        else:
            response_text = stripped_text

    print("Generated SQL/JSON:", response_text)

    # OpenAI compatible response
    return jsonify({
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": MODEL_NAME,
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


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":

    print("=================================")
    print(" Local AI SQL Server Running ")
    print(" http://localhost:5001")
    print("=================================")

    app.run(port=5001, debug=False)