import unittest
from unittest.mock import MagicMock, patch
from app.modules.ai.providers.gemini import GeminiAIProvider, AIProviderError
from app.core.config import settings

class TestGeminiProviderLive(unittest.TestCase):
    def setUp(self):
        self.provider = GeminiAIProvider()

    def test_provider_identity(self):
        """Test provider identity matches contract."""
        self.assertEqual(self.provider.provider_name(), "gemini")

    def test_unavailable_without_key(self):
        """Test provider availability and expected exceptions when key is absent."""
        with patch.object(settings, "GEMINI_API_KEY", ""):
            provider = GeminiAIProvider()
            self.assertFalse(provider.is_available())
            
            # Should raise AIProviderError immediately
            with self.assertRaises(AIProviderError):
                import asyncio
                asyncio.run(provider.generate_response("test prompt"))

    @patch("google.genai.Client")
    def test_generate_response_mocked(self, mock_client_class):
        """Mock the google-genai Client call to verify text generation logic flow."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.text = "Mocked LLM response text"
        mock_client.models.generate_content.return_value = mock_response

        # Set API key to enable provider
        with patch.object(settings, "GEMINI_API_KEY", "dummy_api_key"):
            provider = GeminiAIProvider()
            self.assertTrue(provider.is_available())
            
            import asyncio
            response = asyncio.run(provider.generate_response("Test prompt", system_instruction="Test instruction"))
            self.assertEqual(response, "Mocked LLM response text")
            mock_client.models.generate_content.assert_called_once()

    @patch("google.genai.Client")
    def test_generate_embedding_mocked(self, mock_client_class):
        """Mock the google-genai Client call to verify embedding generation logic flow."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        mock_val = MagicMock()
        mock_val.values = [0.1, 0.2, 0.3]
        mock_emb = MagicMock()
        mock_emb.values = [0.1, 0.2, 0.3]
        
        mock_result = MagicMock()
        mock_result.embeddings = [mock_emb]
        mock_client.models.embed_content.return_value = mock_result

        with patch.object(settings, "GEMINI_API_KEY", "dummy_api_key"):
            provider = GeminiAIProvider()
            self.assertTrue(provider.is_available())
            
            import asyncio
            embedding = asyncio.run(provider.generate_embedding("Test embedding text"))
            self.assertEqual(embedding, [0.1, 0.2, 0.3])
            mock_client.models.embed_content.assert_called_once()

if __name__ == "__main__":
    unittest.main()
