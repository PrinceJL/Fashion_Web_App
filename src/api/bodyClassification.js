export const predictBodyType = async (measurements) => {
  const res = await fetch('https://body-classification-model.onrender.com/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(measurements),
  });
  if (!res.ok) throw new Error('Body type prediction failed');
  return res.json();
};