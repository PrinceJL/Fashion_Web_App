import React, { useState } from "react";
import CombinedSegmentationLandmarks from "./components/CombineSegmentationLandmarks";
import Loader from "./components/Loader";
import { predictBodyType } from "./api/bodyClassification";
import { recommendOutfits } from "./api/fashionRecommendation";
import OutfitList from "./components/OutfitList";
import "./style.css";

export default function App() {
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState(25);
  const [prompt, setPrompt] = useState("I want a casual stylish outfit");
  const [measurements, setMeasurements] = useState(null);
  const [bodyType, setBodyType] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Called when CombinedSegmentationLandmarks completes measurement extraction
  const handleExtract = async (meas) => {
    setMeasurements(meas);
    setLoading(true);
    setError("");
    setBodyType("");
    setRecommendations([]);
    try {
      // Predict body type
      const inputMeasurements = {
        ...meas,
        gender: gender === "male" ? 1.0 : 2.0,
        age: Number(age),
      };
      const pred = await predictBodyType(inputMeasurements);
      if (!pred.bodyType) throw new Error("Could not determine body type.");
      setBodyType(pred.bodyType);

      // Recommend outfits
      const recData = await recommendOutfits({
        gender,
        body_shape: pred.bodyType,
        prompt,
        topk: 3,
      });
      setRecommendations(recData.recommendations || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <h1>AI Fashion Outfit Recommender</h1>
      <div className="input-group">
        <label>
          Gender:
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <label>
          Age:
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={e => setAge(e.target.value)}
          />
        </label>
        <label>
          Outfit prompt:
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your desired outfit"
          />
        </label>
      </div>
      <h3>Upload a full-body image and extract measurements:</h3>
      <CombinedSegmentationLandmarks onExtract={handleExtract} />
      {loading && <Loader />}
      {bodyType && (
        <div className="body-type">
          Your body type: <strong>{bodyType}</strong>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      <OutfitList recommendations={recommendations} />
    </div>
  );
}