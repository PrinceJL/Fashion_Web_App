# System Architecture Diagram

Below is a visual overview of the flow and structure of the Fashion Recommender App:

---

## System Overview

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

## Explanation

1. **User** uploads a photo and enters age, gender, and prompt in the **UI**.
2. **CombineSegmentationLandmarks.jsx** processes the image directly in the browser (using TensorFlow BodyPix and MediaPipe) to extract body measurements.
3. These measurements, along with gender and age, are sent to the **Body Classification API** to predict body type.
4. The predicted body type, gender, and the user's style prompt are sent to the **Fashion Recommendation API**.
5. The Fashion Recommendation API queries a database of outfits, scoring them based on rules and prompt relevance.
6. The final recommendations are returned to the frontend and displayed by **OutfitList.jsx**.

---

**Key Points:**
- Measurement extraction happens in-browser for privacy and speed.
- All API calls are handled in `App.jsx`.
- The backend is split: one model for body type, one for outfit recommendation.
- Components are modular and focused on a single responsibility.

---