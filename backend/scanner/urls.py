from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BusinessCardViewSet, 
    UserRegistrationView, 
    UserRegistrationRequestView, 
    UserRegistrationVerifyView, 
    UserRegistrationResendOTPView,
    UserLoginView, 
    UserDetailView, 
    EmailConfigViewSet
)

router = DefaultRouter()
router.register(r'business-cards', BusinessCardViewSet)
router.register(r'email-config', EmailConfigViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Legacy registration endpoint (now shows new process info)
    path('register/', UserRegistrationView.as_view(), name='register'),
    # New two-step registration process
    path('register/request/', UserRegistrationRequestView.as_view(), name='register-request'),
    path('register/verify/', UserRegistrationVerifyView.as_view(), name='register-verify'),
    path('register/resend/', UserRegistrationResendOTPView.as_view(), name='register-resend'),
    # Login and user endpoints
    path('login/', UserLoginView.as_view(), name='login'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
]