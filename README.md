# 👗 Fashion Recommender Web App

A web app for personalized fashion recommendations using **your uploaded photo**, **age**, **gender**, and **fashion prompt** (style/occasion preferences).  
It combines **machine learning** (Random Forest for body shape classification from images) and **rule-based + prompt-driven logic** for recommending outfits.

---

## Features

- **Upload Photo:** The app extracts your body measurements from a single photo (no manual entry required).
- **Specify Age & Gender:** For personalized suggestions.
- **Style Prompts:** Describe your preferred style or occasion (e.g., "business casual", "date night", "summer", etc.).
- **ML-powered Body Shape Classification:** Random Forest model determines your body shape from the image.
- **Personalized Outfit Recommendations:** Each outfit includes detailed attributes.

---

## Project Structure

```
fashion-recommender-app/
│
├── src/
│   ├── api/
│   │   ├── bodyClassification.js        # API for body shape prediction
│   │   └── fashionRecommendation.js     # API for outfit recommendations
│   │
│   ├── components/
│   │   ├── CombineSegmentationLandmarks.jsx # Image upload and measurement extraction
│   │   ├── Loader.jsx                       # Loader spinner
│   │   └── OutfitList.jsx                   # Render recommended outfits
│   │
│   ├── App.jsx                              # Main React component (form, flow, state)
│   ├── main.jsx                             # ReactDOM bootstrap
│   ├── style.css                            # Minimal styling
│   └── api.js                               # General API calls (e.g. getRecommendations)
│
├── public/                                  # Static files (index.html, favicon, etc.)
│
├── README.md
└── package.json
```

---

## System Flow

1. **User** uploads a photo and enters age, gender, and prompt.
2. **CombineSegmentationLandmarks.jsx** processes the photo (in-browser) to extract measurements.
3. Measurements, gender, and age are sent to the **body-classification API** to predict body type.
4. The predicted body type, gender, and prompt are sent to the **fashion recommendation API**.
5. **fashion-api** returns a list of recommended outfits, which are displayed to the user.

---

## Input Parameters

| Field        | Type     | Required | Description                                       |
|--------------|----------|----------|---------------------------------------------------|
| image        | File     | Yes      | User photo (selfie/full-body)                     |
| age          | Number   | Yes      | User's age                                        |
| gender       | String   | Yes      | "male", "female", "other"                         |
| prompt       | String   | Yes      | Style/occasion (e.g. "casual", "wedding", etc.)   |

---

## Example API Usage

**Request for recommendation:**  
```js
import { recommendOutfits } from "./api/fashionRecommendation";
const recs = await recommendOutfits({ gender, body_shape, prompt, topk: 3 });
```

**Request for body type prediction:**  
```js
import { predictBodyType } from "./api/bodyClassification";
const bodyType = await predictBodyType({ shoulderWidth, hips, waist, gender, age });
```

---

## Getting Started

### 1. Clone and Setup

```bash
git clone https://github.com/PrinceJL/fashion-recommender-app.git
cd fashion-recommender-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App

```bash
npm run dev
```

### 4. Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

---

## System Architecture Overview

```
User
 │
 ▼
Frontend (React)
 ├─ App.jsx (main logic & flow)
 ├─ CombineSegmentationLandmarks.jsx (extracts measurements from image)
 ├─ Loader.jsx (shows loading)
 └─ OutfitList.jsx (shows recommendations)
 │
 ▼
API Calls
 ├─ predictBodyType (to body-classification-model API)
 └─ recommendOutfits / getRecommendations (to fashion-api)
 │
 ▼
Backend APIs
 ├─ body-classification-model API (/predict)
 └─ fashion-api (/recommend)
     └─ outfit data & rules
```

---

## FAQ

**Where is machine learning used?**  
For body shape prediction (Random Forest, based on measurements extracted from the image). Outfit recommendation is rule + prompt-based.

**How does prompt work?**  
Prompts are parsed for style, occasion, or other keywords and used to filter and score outfit matches.

**Can I use my own data/model?**  
Yes! You can swap out the model endpoints if you have your own.

**How do I deploy?**  
Deploy as a standard React app. APIs must be reachable from the frontend.

---

## License

MIT License. See [LICENSE](LICENSE) for details.