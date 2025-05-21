# Fashion Outfit Recommender Frontend

A React app that consumes the [Fashion API](https://fashion-api-37s7.onrender.com).

## Features

- User-friendly form for outfit recommendations
- Real-time API integration
- Cards with images and detailed attributes
- Responsive and modern UI

## Setup

```sh
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```sh
npm run build
```

## App Structure

- `src/` — Source code:
  - `App.jsx` — Main app logic
  - `api.js` — API calls
  - `components/` — UI components
  - `style.css` — App-wide CSS
- `public/index.html` — HTML entrypoint

## API Contract

**POST** `https://fashion-api-37s7.onrender.com/recommend`
- Request:
  ```json
  {
    "gender": "male",
    "body_shape": "Hourglass",
    "prompt": "I want a formal outfit for a summer wedding, prefer short sleeves and cotton",
    "topk": 3
  }
  ```
- Response:
  ```json
  {
    "recommendations": [
      {
        "gender": "male",
        "image_label": "...",
        "image_url": "...",
        "attributes": { ... },
        "total_score": 87,
        "style_score": 61,
        "bodyshape_score": 26
      },
      ...
    ]
  }
  ```

## Deployment

Deploy the `dist/` folder to Vercel, Netlify, or any static site host.