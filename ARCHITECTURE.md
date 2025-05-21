# System Architecture & Design Rationale

This document explains the **design decisions** behind the Fashion Recommender Web App, with a focus on modularity, privacy, and practical machine learning integration for a seamless user experience.

---

## Design Goals

- **User Privacy:** Perform body measurement extraction directly in the browser so user images are never uploaded to our servers.
- **Separation of Concerns:** Keep the frontend, measurement extraction, and recommendation logic modular and decoupled for easier maintenance and possible replacement of components.
- **Extensibility:** APIs for body classification and fashion recommendation are externally hosted and can be swapped out or upgraded without impacting the frontend code.
- **Transparency:** The process is easy to follow—users know what data is used and how recommendations are generated.

---

## Architecture Overview

### 1. **Frontend-first Measurement Extraction**

- **Why:** Many users are privacy-sensitive. By doing all measurement extraction in-browser (using TensorFlow BodyPix and MediaPipe), we never transmit their raw images to our servers.
- **How:**  
  - The uploaded image is processed in the browser using pre-trained ML models.
  - Only a few numerical measurements (shoulders, waist, hips) are sent to the backend for body type prediction.

### 2. **Backend as a Set of Lightweight APIs**

- The backend is split into two core APIs:
  - **Body Classification API:** Receives measurements, returns predicted body type using a Random Forest model.
  - **Fashion Recommendation API:** Receives gender, body type, and user's style prompt, returns suitable outfits using a combination of rule-based and prompt-based logic.
- **Why:** This approach allows independent scaling, testing, and potential replacement of either service (e.g., swapping a new ML model).
- **Modularity:** Each API is focused and stateless, making it easier to maintain and scale.

### 3. **Component-Oriented Frontend**

- **React Components:**
  - **CombineSegmentationLandmarks.jsx:** Handles all logic for image upload, measurement extraction, and passing results up.
  - **App.jsx:** Orchestrates user flow, API calls, and state.
  - **Loader.jsx, OutfitList.jsx:** Simple, single-responsibility UI blocks.
- **Why:** Encourages code reuse, easier testing, and clear separation of responsibilities.

### 4. **API Call Abstraction**

- All API communication is handled through dedicated modules:
  - `api.js` (general), `bodyClassification.js`, and `fashionRecommendation.js`.
- **Why:** If an API endpoint changes or a new service is introduced, only the relevant file needs updating, not the whole codebase.

---

## System Data Flow

1. **User uploads image and enters details**  
   → Frontend component extracts measurements in-browser  
   → Sends only measurements, age, and gender to body type API  
   → Receives predicted body type

2. **Recommendation Request**  
   → Sends gender, predicted body type, and user prompt to recommendation API  
   → Receives list of recommended outfits

3. **Display Results**  
   → Results are shown in the frontend via a dedicated component

---

## Benefits of This Design

- **Privacy:** No user image ever leaves the browser.
- **Security:** Only minimal, non-identifiable data sent to backend.
- **Maintainability:** APIs and frontend can evolve independently.
- **Flexibility:** Easy to upgrade ML models or change recommendation logic.
- **User Experience:** Fast, responsive, and transparent process for the end user.

---

## Possible Future Extensions

- **On-device ML for body type prediction** for even greater privacy.
- **Pluggable recommendation engines** (e.g., collaborative filtering, deep learning).
- **Localization and accessibility** enhancements.
- **Integration with e-commerce or wardrobe management platforms**.

---

*This architecture is designed to balance privacy, extensibility, and user-focused simplicity for a modern AI-driven fashion experience.*