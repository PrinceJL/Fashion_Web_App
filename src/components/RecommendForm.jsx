import React, { useState } from "react";

export default function RecommendForm({ onRecommend, loading }) {
  const [form, setForm] = useState({
    gender: "",
    body_shape: "",
    prompt: "",
    topk: 3,
  });

  function handleChange(e) {
    let { name, value } = e.target;
    if (name === "topk") value = Number(value);
    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onRecommend(form);
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <label>
        Gender:
        <select name="gender" value={form.gender} onChange={handleChange} required>
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </label>
      <label>
        Body Shape:
        <input
          name="body_shape"
          value={form.body_shape}
          onChange={handleChange}
          required
          placeholder="e.g. Hourglass"
        />
      </label>
      <label>
        Prompt:
        <input
          name="prompt"
          value={form.prompt}
          onChange={handleChange}
          required
          placeholder="Describe your need..."
        />
      </label>
      <label>
        Top K Recommendations:
        <input
          name="topk"
          type="number"
          min={1}
          max={10}
          value={form.topk}
          onChange={handleChange}
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Get Recommendations"}
      </button>
    </form>
  );
}