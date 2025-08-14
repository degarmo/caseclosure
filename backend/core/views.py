
"""
Custom error handlers for the API
"""
from django.http import JsonResponse


def custom_400(request, exception=None):
    """Handle 400 Bad Request errors"""
    return JsonResponse({
        'error': 'Bad Request',
        'message': 'The request could not be understood by the server.',
        'status_code': 400
    }, status=400)


def custom_403(request, exception=None):
    """Handle 403 Forbidden errors"""
    return JsonResponse({
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource.',
        'status_code': 403
    }, status=403)


def custom_404(request, exception=None):
    """Handle 404 Not Found errors"""
    return JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource was not found.',
        'status_code': 404
    }, status=404)


def custom_500(request):
    """Handle 500 Internal Server errors"""
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An error occurred while processing your request. Please try again later.',
        'status_code': 500
    }, status=500)