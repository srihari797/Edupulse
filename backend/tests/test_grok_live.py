import unittest
from unittest.mock import MagicMock, patch
from app.modules.ai.providers.grok import GrokAIProvider, AIProviderError
from app.core.config import settings

class TestGrokProviderLive(unittest.TestCase):
    def setUp(self):
        self.provider = GrokAIProvider()

    def test_provider_identity(self):
        """Test provider identity matches contract."""
        self.assertEqual(self.provider.provider_name(), "grok")

    def test_unavailable_without_key(self):
        """Test provider availability when GROK_API_KEY is absent."""
        with patch.object(settings, "GROK_API_KEY", ""):
            provider = GrokAIProvider()
            self.assertFalse(provider.is_available())
            
            with self.assertRaises(AIProviderError):
                import asyncio
                asyncio.run(provider.generate_response("test prompt"))

    @patch("openai.AsyncOpenAI")
    def test_generate_response_mocked(self, mock_openai_class):
        """Mock OpenAI AsyncOpenAI client to verify text generation workflow."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        mock_message = MagicMock()
        mock_message.content = "Mocked Grok response text"
        mock_choice = MagicMock()
        mock_choice.message = mock_message
        
        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        
        # Async mock for chat.completions.create
        async def mock_create(*args, **kwargs):
            return mock_response
            
        mock_client.chat.completions.create = mock_create

        with patch.object(settings, "GROK_API_KEY", "xai-test-key-123"):
            provider = GrokAIProvider()
            self.assertTrue(provider.is_available())
            
            import asyncio
            response = asyncio.run(provider.generate_response("Test prompt", system_instruction="Test instruction"))
            self.assertEqual(response, "Mocked Grok response text")

if __name__ == "__main__":
    unittest.main()
