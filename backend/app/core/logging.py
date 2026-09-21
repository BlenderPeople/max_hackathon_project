import logging


def configure_logging() -> None:
    """Single place for logging configuration; never add secrets or initData."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
