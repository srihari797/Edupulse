import os
import json
import logging
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from app.core.config import settings

load_dotenv()
logger = logging.getLogger(__name__)

class GroqClient:
    """
    Dedicated Groq Client reading GROQ_API environment variable.
    Handles API communication, models, timeouts, and graceful fallbacks.
    """
    def __init__(self):
        self.api_key = (settings.GROQ_API or os.getenv("GROQ_API") or os.getenv("GROQ_API_KEY") or "").strip()
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self.models = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama3-8b-8192",
            "llama3-70b-8192",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ]

    async def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        timeout_seconds: int = 10
    ) -> Optional[str]:
        """
        Sends chat messages to Groq API and returns generated text response.
        Handles errors and timeouts gracefully.
        """
        if not self.api_key:
            logger.warning("GROQ_API key is not configured in environment.")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        print("Calling Groq API...")
        logger.info("Calling Groq API...")

        for model_name in self.models:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 800
            }

            print("Exact Payload sent to Groq:\n", json.dumps(payload, indent=2))
            logger.info(f"Exact Payload sent to Groq model {model_name}:\n{json.dumps(payload, indent=2)}")

            try:
                req = urllib.request.Request(
                    self.endpoint,
                    data=json.dumps(payload).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                    if resp.status == 200:
                        raw_body = resp.read().decode("utf-8")
                        print("Raw Groq Response:\n", raw_body)
                        logger.info(f"Raw Groq Response:\n{raw_body}")
                        print("Groq response received.")
                        logger.info("Groq response received.")
                        
                        data = json.loads(raw_body)
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            content = choices[0]["message"].get("content", "").strip()
                            if content:
                                return content
            except urllib.error.HTTPError as he:
                print(f"Groq API model {model_name} HTTP error: {he.code} {he.reason}")
                logger.warning(f"Groq API model {model_name} HTTP error: {he.code} {he.reason}")
                continue
            except Exception as e:
                print(f"Groq API model {model_name} connection error: {e}")
                logger.warning(f"Groq API model {model_name} connection error: {e}")
                continue

        return None
