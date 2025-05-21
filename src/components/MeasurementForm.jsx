import React, { useState } from "react";

const defaultMeasurements = {
  gender: "2.0",
  age: "",
  shoulderWidth: "",
  waist: "",
  hips: ""
};

export default function MeasurementForm({ onSubmit, loading }) {
  const [form, setForm] = useState(defaultMeasurements);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      gender: parseFloat(form.gender),
      age: parseInt(form.age, 10),
      shoulderWidth: parseFloat(form.shoulderWidth),
      waist: parseFloat(form.waist),
      hips: parseFloat(form.hips)
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Gender:
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="1.0">Male</option>
          <option value="2.0">Female</option>
        </select>
      </label>
      <label>
        Age:
        <input name="age" type="number" value={form.age} onChange={handleChange} required />
      </label>
      <label>
        Shoulder Width (cm):
        <input name="shoulderWidth" type="number" value={form.shoulderWidth} onChange={handleChange} required />
      </label>
      <label>
        Waist (cm):
        <input name="waist" type="number" value={form.waist} onChange={handleChange} required />
      </label>
      <label>
        Hips (cm):
        <input name="hips" type="number" value={form.hips} onChange={handleChange} required />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Get Outfit Recommendations"}
      </button>
    </form>
  );
}