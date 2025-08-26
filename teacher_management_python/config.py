import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys - should be set in environment variables or .env file
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY", "your_upstage_api_key_here")
HF_TOKEN = os.getenv("HF_TOKEN", "your_huggingface_token_here")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "your_stability_api_key_here")
AAI_API_KEY = os.getenv("AAI_API_KEY", "your_assemblyai_api_key_here")

# API URLs
SD_API_URL = "https://api.stability.ai/v2beta/stable-image/generate/sd3"