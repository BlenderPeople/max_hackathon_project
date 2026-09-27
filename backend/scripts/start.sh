#!/bin/sh
# This file must keep LF line endings: it is executed by /bin/sh in Linux.
set -eu

alembic upgrade head

if [ "${SEED_DEMO_DATA:-1}" = "1" ]; then
    python -m app.seed
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
