# System Architecture Diagram

Below is a visual overview of the flow and structure of the Fashion Recommender App:

## High-level Flow

```mermaid
flowchart TD
  User([User])
    subgraph Frontend (React)
      UI[Form: Upload Image<br>Enter Gender, Age, Prompt]
      Combine[CombineSegmentationLandmarks.jsx<br>(extracts measurements)]
      APIcall[App.jsx<br>(handles API calls)]
      Loader[Loader.jsx]
      Outfits[OutfitList.jsx]
    end

    subgraph Backend (APIs)
      ImgProc[Image Processing<br/>(BodyPix + MediaPipe in browser)]
      BodyAPI[body-classification-model API<br>/predict]
      FashionAPI[fashion-api API<br>/recommend]
      DB[Outfit Data]
    end

    User --> UI
    UI --> Combine
    Combine -- "shoulder, waist, hips" --> APIcall
    APIcall -- "measurements, gender, age" --> BodyAPI
    BodyAPI -- "body type" --> APIcall
    APIcall -- "gender, body type, prompt" --> FashionAPI
    FashionAPI -- "recommendations" --> APIcall
    APIcall --> Outfits
    Loader -.-> APIcall
    FashionAPI --- DB
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