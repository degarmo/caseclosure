from rest_framework import serializers
from .models import ContactInquiry, Tip


class ContactInquirySerializer(serializers.ModelSerializer):
    """Serializer for contact inquiries from main site"""
    
    class Meta:
        model = ContactInquiry
        fields = [
            'id', 'name', 'email', 'phone', 'inquiry_type',
            'subject', 'message', 'case_reference', 'status',
            'submitted_at', 'user_agent', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipSerializer(serializers.ModelSerializer):
    """Serializer for tips from victim memorial sites"""
    
    case_id = serializers.CharField(write_only=True)
    
    class Meta:
        model = Tip
        fields = [
            'id', 'case_id', 'submitter_name', 'submitter_email',
            'submitter_phone', 'tip_content', 'is_anonymous',
            'urgency', 'status', 'submitted_at', 'user_agent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        case_id = validated_data.pop('case_id')
        validated_data['case_id'] = case_id
        
        # If anonymous, clear personal info
        if validated_data.get('is_anonymous', True):
            validated_data['submitter_name'] = None
            validated_data['submitter_email'] = None
            validated_data['submitter_phone'] = None
        
        return super().create(validated_data)