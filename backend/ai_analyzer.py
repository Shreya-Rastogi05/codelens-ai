import os
from dotenv import load_dotenv
from google import genai
from google.genai import errors

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)


def analyze_code(language, code):

    prompt = f"""
You are an expert software engineer and highly accurate code reviewer.

Review ONLY the code provided below.

IMPORTANT:
- Do not invent problems.
- Only report problems that actually exist.
- If the code already has type hints, do not say type hints are missing.
- If the code already has a docstring, do not say the docstring is missing.
- If the code already handles division by zero, do not report division by zero as a bug.

### 1. BUGS / ERRORS
Identify actual bugs or errors.
If there are none, say:
"No obvious bugs found."

### 2. CODE QUALITY
Discuss readability, structure, naming, style, documentation, and maintainability.

### 3. IMPROVEMENTS
Give practical improvements that apply to this code.

### 4. TIME COMPLEXITY
Give the time complexity and briefly explain it.

IMPORTANT:
- Use plain text only.
- Write O(1), O(n), O(n^2), O(log n), etc.
- Do NOT use LaTeX.
- Do NOT use $ symbols.
- Do NOT use mathematical formatting.

### 5. SPACE COMPLEXITY
Give the space complexity and briefly explain it.

IMPORTANT:
- Use plain text only.
- Write O(1), O(n), O(n^2), O(log n), etc.
- Do NOT use LaTeX.
- Do NOT use $ symbols.
- Do NOT use mathematical formatting.

### 6. CORRECTED CODE
Provide the complete corrected or improved code.
Put it inside ONE Markdown code block.
If the code is already correct, return the same code.

CODE TO REVIEW:

Language: {language}

{code}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return {
            "language": language,
            "code": code,
            "analysis": response.text
        }

    except errors.ServerError as e:
        print("GEMINI SERVER ERROR:", e)

        return {
            "language": language,
            "code": code,
            "analysis": f"Gemini server error: {str(e)}"
        }

    except Exception as e:
        print("GEMINI ERROR:", e)

        return {
            "language": language,
            "code": code,
            "analysis": f"Gemini error: {str(e)}"
        }