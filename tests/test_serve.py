import unittest

from serve import is_private_path


class PrivatePathTests(unittest.TestCase):
    def test_allows_public_app_paths(self):
        for path in ("/", "/index.html", "/js/app.js", "/assets/photos/place.jpg"):
            with self.subTest(path=path):
                self.assertFalse(is_private_path(path))

    def test_blocks_hidden_project_paths(self):
        for path in (
            "/.certs/key.pem",
            "/.git/config",
            "/.github/workflows/tests.yml",
            "/folder/.secret",
        ):
            with self.subTest(path=path):
                self.assertTrue(is_private_path(path))

    def test_blocks_encoded_and_normalized_hidden_paths(self):
        for path in (
            "/%2ecerts/key.pem",
            "/folder/../.certs/key.pem",
            "/folder/%2e%2e/%2egit/config",
        ):
            with self.subTest(path=path):
                self.assertTrue(is_private_path(path))

    def test_ignores_query_string(self):
        self.assertTrue(is_private_path("/.certs/key.pem?download=1"))
        self.assertFalse(is_private_path("/index.html?mode=app"))


if __name__ == "__main__":
    unittest.main()
