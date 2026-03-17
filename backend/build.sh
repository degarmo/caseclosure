#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser if it doesn't exist (credentials from env vars)
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
admin_email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@caseclosure.org')
admin_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
if admin_password and not User.objects.filter(email=admin_email).exists():
    User.objects.create_superuser('admin', admin_email, admin_password)
    print('Superuser created')
elif not admin_password:
    print('Skipping superuser creation: DJANGO_SUPERUSER_PASSWORD not set')
"