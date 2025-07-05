from rest_framework import serializers
from .models import Tip

class TipSerializer(serializers.ModelSerializer):
    captcha_token = serializers.CharField(write_only=True)

    class Meta:
        model = Tip
        fields = [
            'id','victim','anonymous','name','email','phone',
            'message','document','created_at','approved','captcha_token'
        ]
        read_only_fields = ['id','created_at','approved']

    def validate(self, data):
        # 1) CAPTCHA check (example with reCAPTCHA v3)
        token = data.pop('captcha_token')
        from django.conf import settings
        import requests
        resp = requests.post(
          'https://www.google.com/recaptcha/api/siteverify',
          data={'secret': settings.RECAPTCHA_SECRET, 'response': token}
        ).json()
        if not resp.get('success') or resp.get('score',0)<0.5:
            raise serializers.ValidationError('CAPTCHA failed')
        return data
