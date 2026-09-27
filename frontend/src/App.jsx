import { useEffect, useState } from "react";
import "./App.css";

const domains = [
  "All",
  "Routing & Switching",
  "Wireless",
  "AAA/NAC",
  "WAN",
  "Security"
];

function App() {
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("All");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem("netassist-history") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("netassist-history", JSON.stringify(history));
  }, [history]);

  async function askNetAssist(e) {
    e.preventDefault();

    if (!question.trim()) {
      setError("Please enter a network troubleshooting question.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, domain })
      });

      if (!response.ok) throw new Error("Backend request failed.");

      const data = await response.json();
      setAnswer(data);

      setHistory((old) => [
        {
          question,
          domain,
          supported: data.supported,
          time: new Date().toLocaleTimeString()
        },
        ...old
      ].slice(0, 8));
    } catch {
      setError(
        "Unable to reach the NetAssist backend. Confirm the API is running on localhost:3001."
      );
    } finally {
      setLoading(false);
    }
  }

  function giveFeedback(value) {
    const stored = JSON.parse(localStorage.getItem("netassist-feedback") || "[]");
    stored.push({
      question,
      value,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem("netassist-feedback", JSON.stringify(stored));
    alert(`Feedback saved: ${value}`);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="brand">NETASSIST</div>
          <div className="subbrand">NETWORK OPERATIONS COPILOT</div>
        </div>

        <div className="status">
          <span className="dot"></span>
          CONSOLE ONLINE
        </div>

        <div className="section-title">DOMAIN FILTER</div>

        <div className="filters">
          {domains.map((item) => (
            <button
              key={item}
              className={domain === item ? "active" : ""}
              onClick={() => setDomain(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="section-title">RECENT QUERIES</div>

        <div className="history">
          {history.length === 0 && <p>No recent queries.</p>}
          {history.map((item, i) => (
            <div className="history-item" key={i}>
              <strong>{item.domain}</strong>
              <span>{item.question}</span>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
      </aside>

      <main>
        <header>
          <div>
            <h1>Network Incident Query Terminal</h1>
            <p>Grounded troubleshooting from approved network knowledge</p>
          </div>
          <span className="readonly">READ-ONLY</span>
        </header>

        <div className="safety">
          NetAssist provides troubleshooting guidance from approved sources.
          Validate commands before use. This prototype cannot access or modify
          network devices.
        </div>

        <form className="query-box" onSubmit={askNetAssist}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Why can users authenticate to Wi-Fi but fail to receive an IP address?"'
          />

          <div className="query-actions">
            <span>Selected domain: {domain}</span>
            <button type="submit" disabled={loading}>
              {loading ? "ANALYZING..." : "QUERY NETASSIST"}
            </button>
          </div>
        </form>

        <div className="examples">
          Try:
          <button
            onClick={() =>
              setQuestion(
                "Why can users authenticate successfully to Wi-Fi but fail to receive an IP address?"
              )
            }
          >
            Wireless DHCP
          </button>

          <button
            onClick={() =>
              setQuestion("What should I check when a BGP neighbor stays in Active state?")
            }
          >
            BGP Active
          </button>

          <button
            onClick={() =>
              setQuestion("What should I check when a Cisco switch reports RADIUS dead?")
            }
          >
            RADIUS
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {answer && !answer.supported && (
          <section className="unsupported">
            <h2>⚠ Insufficient Evidence</h2>
            <p>{answer.message}</p>
            <p>
              NetAssist will not invent or extrapolate unsupported operational
              guidance.
            </p>
          </section>
        )}

        {answer?.supported && (
          <section className="answer">
            <div className="answer-heading">
              <div>
                <span className="badge">NETASSIST ADVISORY</span>
                <h2>Evidence-Based Response</h2>
              </div>
            </div>

            <article>
              <h3>Diagnosis</h3>
              <p>{answer.diagnosis}</p>
            </article>

            <article>
              <h3>Checks</h3>
              <ol>
                {answer.checks.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </article>

            <article>
              <h3>Recommended Next Steps</h3>
              <ol>
                {answer.nextSteps.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </article>

            <article>
              <h3>Approved Sources</h3>

              {answer.sources.map((source) => (
                <div className="source" key={source.id}>
                  <strong>[{source.id}] {source.title}</strong>
                  <span>{source.domain} · {source.status}</span>
                </div>
              ))}
            </article>

            <div className="feedback">
              <span>Was this response useful?</span>
              <button onClick={() => giveFeedback("Helpful")}>👍 Helpful</button>
              <button onClick={() => giveFeedback("Not Helpful")}>
                👎 Not Helpful
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
