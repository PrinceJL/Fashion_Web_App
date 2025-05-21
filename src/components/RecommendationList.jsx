import React from "react";

export default function RecommendationList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return <div>No recommendations found.</div>;
  }
  return (
    <div className="recommendation-list">
      {recommendations.map((rec, idx) => (
        <div className="recommendation-card" key={rec.image_label + idx}>
          <img
            src={rec.image_url}
            alt={rec.image_label}
            className="recommendation-image"
          />
          <div className="recommendation-info">
            <h3>{rec.image_label.replace(/-/g, " ")}</h3>
            <ul>
              <li><strong>Gender:</strong> {rec.gender}</li>
              <li><strong>Total Score:</strong> {rec.total_score}</li>
              <li><strong>Style Score:</strong> {rec.style_score}</li>
              <li><strong>Bodyshape Score:</strong> {rec.bodyshape_score}</li>
            </ul>
            <details>
              <summary>Show Attributes</summary>
              <ul>
                {Object.entries(rec.attributes).map(([attr, val]) => (
                  <li key={attr}>
                    <strong>{attr.replace(/_/g, " ")}:</strong> {val}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      ))}
    </div>
  );
}