#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser if it doesn't exist
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@caseclosure.org').exists():
    User.objects.create_superuser('admin', 'admin@caseclosure.org', 'changeme123')
    print('Superuser created')
"