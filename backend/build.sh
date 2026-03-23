#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# ── GeoLite2 database (optional) ────────────────────────────────────────────
# Set MAXMIND_LICENSE_KEY in Render env vars to enable accurate geo lookups.
# Get a free key at: https://www.maxmind.com/en/geolite2/signup
# Without this, the tracker falls back to ip-api.com (free, 1k req/min).
if [ -n "$MAXMIND_LICENSE_KEY" ]; then
    echo "Downloading GeoLite2-City database..."
    mkdir -p geoip
    GEOIP_URL="https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${MAXMIND_LICENSE_KEY}&suffix=tar.gz"
    curl -sL "$GEOIP_URL" | tar -xz --wildcards --strip-components=1 -C geoip '*.mmdb'
    if [ -f "geoip/GeoLite2-City.mmdb" ]; then
        echo "GeoLite2-City.mmdb installed successfully."
    else
        echo "Warning: GeoLite2-City.mmdb not found after extraction — falling back to ip-api.com."
    fi
else
    echo "MAXMIND_LICENSE_KEY not set — using ip-api.com for geo lookups (50k req/day free)."
fi

# Create superuser if it doesn't exist (credentials from env vars)
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@caseclosure.org')
admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
if admin_password and not User.objects.filter(email=admin_email).exists():
    User.objects.create_superuser(email=admin_email, password=admin_password)
    print('Superuser created: ' + admin_email)
elif not admin_password:
    print('Skipping superuser creation: DJANGO_SUPERUSER_PASSWORD not set')
else:
    print('Superuser already exists: ' + admin_email)
"