#!/usr/bin/env bash
# build.sh
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Create superuser if it doesn't exist
python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='degarmo@gmail.com').exists():
    User.objects.create_superuser('degarmo@gmail.com', 'degarmo@gmail.com', 'CHANGE_THIS_PASSWORD')
    print('Superuser created')
else:
    print('Superuser already exists')
END