from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_analyzer import analyze_code

app = FastAPI()

# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodeRequest(BaseModel):
    language: str
    code: str


@app.get("/")
def home():
    return {"message": "CodeLens AI is running!"}


@app.post("/analyze")
def analyze(request: CodeRequest):
    result = analyze_code(request.language, request.code)
    return result