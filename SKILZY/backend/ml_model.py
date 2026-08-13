# backend/ml_model.py

import schemas  # Your Pydantic schemas

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        print("Loading SentenceTransformer model...")
        _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("Model loaded successfully.")
    return _model


# --- 2. Function to create a single text block from a user's profile ---
def create_profile_text(profile_data: schemas.ProfileUpdate):
    """Combines user profile details into a single string for embedding."""
    
    skills_text = " ".join(profile_data.skills)
    interests_text = " ".join(profile_data.interests)
    
    # You can customize this text to give more weight to certain fields
    full_text = (
        f"Professional Title: {profile_data.title}. "
        f"Bio: {profile_data.bio}. "
        f"Skills include: {skills_text}. "
        f"Interests are: {interests_text}. "
        f"Career Goals: {profile_data.careerGoals}."
    )
    return full_text


# --- 3. Function to generate the embedding ---
def generate_embedding(text: str, convert_to_tensor: bool = False):
    """Generates a vector embedding for a given text."""
    model = _get_model()
    embedding = model.encode(text, convert_to_tensor=convert_to_tensor)

    if convert_to_tensor:
        return embedding

    # Convert numpy array to a standard Python list before saving to MongoDB
    return embedding.tolist()