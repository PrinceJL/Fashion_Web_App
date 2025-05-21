import React, { useState } from "react";
import RecommendForm from "./components/RecommendForm";
import RecommendationList from "./components/RecommendationList";
import { getRecommendations } from "./api";
import "./style.css";

export default function App() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRecommend(params) {
    setError("");
    setResults(null);
    setLoading(true);
    try {
      const data = await getRecommendations(params);
      setResults(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="container">
      <h1>Fashion Outfit Recommender</h1>
      <RecommendForm onRecommend={handleRecommend} loading={loading} />
      {error && <div className="error">{error}</div>}
      {results && (
        <RecommendationList recommendations={results.recommendations} />
      )}
    </div>
  );
}