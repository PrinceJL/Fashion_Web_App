import React from "react";

function AttributeTable({ attributes }) {
  if (!attributes) return null;
  return (
    <table className="attr-table" style={{ marginTop: 6, fontSize: 13, background: "#f8f8ff", borderRadius: 4 }}>
      <tbody>
        {Object.entries(attributes).map(([key, value]) => (
          <tr key={key}>
            <td style={{ fontWeight: 600, textTransform: "capitalize", paddingRight: 8 }}>{key.replace(/_/g, " ")}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function OutfitList({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <div className="outfits">
      <h2>Recommended Outfits</h2>
      <ul>
        {recommendations.map((rec, idx) => (
          <li key={idx} className="outfit-item" style={{ marginBottom: 24, display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div>
              {rec.image_url ? (
                <a href={rec.image_url} target="_blank" rel="noopener noreferrer">
                  <img src={rec.image_url} alt={rec.image_label} width={150} style={{ borderRadius: 6, border: "1px solid #eee" }} />
                </a>
              ) : (
                <span>No Image</span>
              )}
            </div>
            <div style={{ minWidth: 200 }}>
              <strong>{rec.image_label}</strong>
              <div>Gender: {rec.gender}</div>
              <div>Body Shape: {rec.attributes?.body_shape || "N/A"}</div>
              <div>Style Score: {rec.style_score}</div>
              <div>Total Score: {rec.total_score}</div>
              <div>Bodyshape Score: {rec.bodyshape_score ?? "N/A"}</div>
              <AttributeTable attributes={rec.attributes} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}