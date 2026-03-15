# MySQL-AI-Natural-Language-to-SQL-using-Gemini-API-or-Local-AI-Qwen2-1.5B
MySQL-AI is particularly useful for developers, analysts, and non-technical users who want to explore databases without needing deep knowledge of SQL syntax. It simplifies database interactions and accelerates data analysis workflows.

**Features**

1.Natural Language → SQL query generation

2.Execute generated SQL queries on MySQL database

3.Support for Gemini API (cloud AI)

4.Support for Local LLM (Qwen2 1.5B)

5.Works offline using local models

6.Schema-aware SQL generation

7.REST API backend for easy integration

------------Installation---------

----------Clone the repository:---------

**git clone https://github.com/yourusername/mysql-ai.git**

**cd mysql-ai**

-----------Install dependencies:---------

**pip install -r requirements.txt**

--------Configuration---------

The AI provider and model can be configured using the .env file. This allows you to easily switch between Gemini API and Local AI.

Create a .env file in the project root and configure the AI provider.

-----Using Gemini API (Cloud AI)--------

**AI_PROVIDER=gemini**

**AI_MODEL=gemini-2.5-flash**

**GEMINI_API_KEY=your_api_key**




------Run the Gemini server:------

**python gemini_server.py**

This mode is useful for:

High quality SQL generation

Complex query understanding


-------Cloud-based AI inference-------

-------Using Local AI (Offline Mode)--------

**AI_PROVIDER=openai**
**AI_MODEL=qwen2-1_5b-instruct-q4_0.gguf**



-------Run the local AI server:-------

**python local_ai_server.py**

This mode is useful for:

1. Offline usage

2. No API request limits

3. Better data privacy

4. Running AI models locally on your machine

Make sure the Qwen2 1.5B GGUF model file is downloaded and available in the model directory.

--------Example Query--------

User Input: **Show the top 5 customers with highest purchases**

---------Generated SQL:--------

**SELECT customer_name, SUM(amount)
FROM orders
GROUP BY customer_name
ORDER BY SUM(amount) DESC
LIMIT 5;**

----------Use Cases--------

1. AI-powered database assistants

2. Natural language database querying

3. Business data analytics

4. Developer productivity tools
