import os
import unittest
from unittest.mock import patch
from app.core.config import Settings

class TestConfig(unittest.TestCase):
    def test_default_settings(self):
        """Test that default values are set correctly."""
        settings = Settings()
        self.assertEqual(settings.APP_NAME, "")  # Loaded from .env or defaults
        self.assertTrue(settings.DEBUG)
        self.assertEqual(settings.DATA_SOURCE, "mock")
        self.assertEqual(settings.STUDENT_PROFILE_MODE, "MOCK")

    @patch.dict(os.environ, {
        "APP_NAME": "TestEduPulse",
        "DATA_SOURCE": "real",
        "STUDENT_PROFILE_MODE": "REAL",
        "STUDENT_ATTENDANCE_MODE": "HYBRID"
    })
    def test_environment_override(self):
        """Test that environment variables override settings."""
        settings = Settings()
        self.assertEqual(settings.APP_NAME, "TestEduPulse")
        self.assertEqual(settings.DATA_SOURCE, "real")
        self.assertEqual(settings.STUDENT_PROFILE_MODE, "REAL")
        self.assertEqual(settings.STUDENT_ATTENDANCE_MODE, "HYBRID")

    def test_get_resolved_mode(self):
        """Test ADSA mode resolution logic."""
        # When DATA_SOURCE is mock
        settings_mock = Settings(DATA_SOURCE="mock", STUDENT_PROFILE_MODE="REAL")
        self.assertEqual(settings_mock.get_resolved_mode("student.profile"), "MOCK")
        
        # When DATA_SOURCE is real
        settings_real = Settings(DATA_SOURCE="real", STUDENT_PROFILE_MODE="MOCK")
        self.assertEqual(settings_real.get_resolved_mode("student.profile"), "REAL")

        # When DATA_SOURCE is hybrid
        settings_hybrid = Settings(DATA_SOURCE="hybrid", STUDENT_PROFILE_MODE="REAL")
        self.assertEqual(settings_hybrid.get_resolved_mode("student.profile"), "REAL")
        self.assertEqual(settings_hybrid.get_resolved_mode("invalid.feature"), "MOCK")

    def test_invalid_mode_validation(self):
        """Test that invalid values for ADSA modes raise a validation error."""
        with self.assertRaises(ValueError):
            Settings(STUDENT_PROFILE_MODE="INVALID")

if __name__ == "__main__":
    unittest.main()
