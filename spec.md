# Specification

## Summary
**Goal:** Enhance the Resume Analyzer with NLP preprocessing for ATS scoring and add prediction explanations to the Job Role Prediction feature.

**Planned changes:**
- Apply stopword removal and lemmatization (implemented in TypeScript/Motoko) to both resume and job description text before TF-IDF cosine similarity scoring for ATS computation
- Update the Job Role Prediction backend to return detected skills and matching factors (keywords/skills) as explanation data alongside the top 3 predicted roles and confidence scores
- Update the Job Role Prediction frontend to display detected skills and matching factors for each of the top 3 predicted role cards, presented clearly below or alongside the existing confidence visualization

**User-visible outcome:** ATS scores are computed on preprocessed (stopword-removed, lemmatized) text for more accurate results, and each predicted job role card now shows which skills were detected and which matching factors contributed to that prediction.
