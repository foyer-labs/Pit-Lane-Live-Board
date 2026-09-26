"""Fixtures of the Home Assistant suite.

Run with the plugin enabled explicitly, so the pure suite never loads it:

    pytest -p pytest_homeassistant_custom_component tests/ha
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def custom_integrations(enable_custom_integrations):
    """Home Assistant loads custom_components/ only when asked to."""
    return
