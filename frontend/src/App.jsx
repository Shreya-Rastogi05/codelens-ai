import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError("Please enter some code first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://codelens-ai-6o1r.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: language,
          code: code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      console.log("BACKEND RESPONSE:", data);

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        "Could not connect to the backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setCode("");
    setResult(null);
    setError("");
  };

  const copyCode = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Apply corrected code from Gemini response
  const applyFix = () => {
    if (!result?.analysis) return;

    const currentSections = getSections(result.analysis);
    let fixedCode = currentSections.corrected;

    if (!fixedCode) {
      setError("Could not find corrected code.");
      return;
    }

    // Extract code from Markdown code block
    const codeMatch = fixedCode.match(
      /```(?:python|java|javascript|cpp|c)?\s*([\s\S]*?)```/i
    );

    if (codeMatch) {
      fixedCode = codeMatch[1].trim();
    }

    // Remove any accidental Markdown text before the code
    fixedCode = fixedCode
      .replace(/^Corrected Code\s*/i, "")
      .replace(/^IMPROVED\s*/i, "")
      .trim();

    if (!fixedCode) {
      setError("Could not find corrected code.");
      return;
    }

    // Put corrected code into editor
    setCode(fixedCode);
    setResult(null);
    setError("");

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = 0;
      }
    }, 0);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
    Split Gemini's response into sections.
  */
  const getSections = (text) => {
    const sections = {
      bugs: "",
      quality: "",
      improvements: "",
      time: "",
      space: "",
      corrected: "",
    };

    if (!text) return sections;

    const patterns = [
      {
        key: "bugs",
        regex:
          /(?:###?\s*)?1\.\s*(?:BUGS?\s*\/?\s*ERRORS?|BUGS?\s+OR\s+ERRORS?)([\s\S]*?)(?=(?:###?\s*)?2\.\s*)/i,
      },
      {
        key: "quality",
        regex:
          /(?:###?\s*)?2\.\s*(?:CODE\s+QUALITY(?:\s+ISSUES?)?|CODE\s+QUALITY)([\s\S]*?)(?=(?:###?\s*)?3\.\s*)/i,
      },
      {
        key: "improvements",
        regex:
          /(?:###?\s*)?3\.\s*(?:SUGGESTIONS?\s+FOR\s+IMPROVEMENT|IMPROVEMENTS?|SUGGESTIONS?)([\s\S]*?)(?=(?:###?\s*)?4\.\s*)/i,
      },
      {
        key: "time",
        regex:
          /(?:###?\s*)?4\.\s*TIME\s+COMPLEXITY([\s\S]*?)(?=(?:###?\s*)?5\.\s*)/i,
      },
      {
        key: "space",
        regex:
          /(?:###?\s*)?5\.\s*SPACE\s+COMPLEXITY([\s\S]*?)(?=(?:###?\s*)?6\.\s*)/i,
      },
      {
        key: "corrected",
        regex:
          /(?:###?\s*)?6\.\s*(?:CORRECTED(?:\s*&\s*IMPROVED|\s+VERSION\s+OF)?\s+CODE|CORRECTED\s+VERSION|CORRECTED\s+CODE)([\s\S]*)/i,
      },
    ];

    patterns.forEach(({ key, regex }) => {
      const match = text.match(regex);

      if (match) {
        let content = match[1].trim();

        if (key === "corrected") {
          content = content
            .replace(/^of the Code\s*/i, "")
            .replace(/^of the code\s*/i, "")
            .replace(
              /^Below are two ways to correct the implementation depending on your use case:\s*/i,
              ""
            )
            .replace(
              /^Below is a robust, production-ready version of the function.*?:\s*/i,
              ""
            )
            .replace(
              /^Here is the improved, production-ready version of the code:\s*/i,
              ""
            )
            .trim();
        }

        sections[key] = content;
      }
    });

    return sections;
  };

  const sections = result ? getSections(result.analysis) : null;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="logo">⌘</div>

          <div>
            <h1>CodeLens AI</h1>
            <p>AI Code Review & Debugging Platform</p>
          </div>
        </div>
      </header>

      <main className="container">
        {/* INTRO */}
        <section className="intro">
          <span className="eyebrow">AI-POWERED CODE REVIEW</span>

          <h2>Analyze your code with AI</h2>

          <p>
            Find bugs, understand complexity, and get practical suggestions
            to improve your code.
          </p>
        </section>

        {/* EDITOR */}
        <section className="editor-section">
          <div className="section-top">
            <div>
              <h3>Code Input</h3>

              <p>
                Paste your code below and let CodeLens AI review it.
              </p>
            </div>

            <button className="clear-button" onClick={clearAll}>
              Clear
            </button>
          </div>

          <div className="toolbar">
            <label htmlFor="language">Programming Language</label>

            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>Python</option>
              <option>Java</option>
              <option>C</option>
              <option>C++</option>
              <option>JavaScript</option>
            </select>
          </div>

          <div className="editor-wrapper">
            <div className="editor-header">
              <span>CODE</span>

              <button onClick={copyCode} disabled={!code}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your code here..."
              spellCheck="false"
            />
          </div>

          <button
            className="analyze-button"
            onClick={analyzeCode}
            disabled={!code.trim() || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>Analyze Code →</>
            )}
          </button>

          {error && <div className="error">{error}</div>}
        </section>

        {/* RESULTS */}
        {result && (
          <section className="result">
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {result.analysis}
            </pre>
            <div className="result-header">
              <div>
                <span className="eyebrow">AI CODE REVIEW</span>

                <h2>Analysis Result</h2>

                <p>
                  <strong>Language:</strong> {result.language}
                </p>
              </div>

              <span className="status">✓ Analysis Complete</span>
            </div>

            <div className="analysis">
              <div className="analysis-title">
                <h2>AI Review</h2>

                <p>Insights generated by CodeLens AI</p>
              </div>

              <div className="review-grid">
                {/* BUGS */}
                <div className="review-card">
                  <div className="card-icon">🐛</div>

                  <h3>Bugs / Errors</h3>

                  <div className="card-content">
                    <ReactMarkdown>
                      {sections.bugs || "No bugs or errors identified."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* QUALITY */}
                <div className="review-card">
                  <div className="card-icon">🧹</div>

                  <h3>Code Quality</h3>

                  <div className="card-content">
                    <ReactMarkdown>
                      {sections.quality ||
                        "No major quality issues identified."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* IMPROVEMENTS */}
                <div className="review-card">
                  <div className="card-icon">💡</div>

                  <h3>Improvements</h3>

                  <div className="card-content">
                    <ReactMarkdown>
                      {sections.improvements ||
                        "No specific improvements suggested."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* TIME */}
                <div className="review-card compact">
                  <div className="card-icon">⏱️</div>

                  <h3>Time Complexity</h3>

                  <div className="card-content">
                    <ReactMarkdown>
                      {sections.time || "Not available."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* SPACE */}
                <div className="review-card compact">
                  <div className="card-icon">💾</div>

                  <h3>Space Complexity</h3>

                  <div className="card-content">
                    <ReactMarkdown>
                      {sections.space || "Not available."}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* CORRECTED CODE */}
                <div className="review-card corrected-card">
                  <div className="corrected-header">
                    <div>
                      <div className="card-icon">💻</div>

                      <h3>Corrected Code</h3>
                    </div>

                    <div className="corrected-actions">
                      <span>IMPROVED</span>

                      <button
                        className="apply-fix-button"
                        onClick={applyFix}
                      >
                        Apply Fix →
                      </button>
                    </div>
                  </div>

                  <div className="corrected-code">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => {
                          const text = String(children);

                          if (
                            text.toLowerCase().includes("below is") ||
                            text.toLowerCase().includes("here is") ||
                            text
                              .toLowerCase()
                              .includes("production-ready")
                          ) {
                            return null;
                          }

                          return <p>{children}</p>;
                        },
                      }}
                    >
                      {sections.corrected || "No corrected code provided."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;