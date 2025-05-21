export const recommendOutfits = async ({ gender, body_shape, prompt, topk = 3 }) => {
  const res = await fetch('https://fashion-api-37s7.onrender.com/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gender, body_shape, prompt, topk }),
  });
  if (!res.ok) throw new Error('Fashion recommendation failed');
  return res.json();
};