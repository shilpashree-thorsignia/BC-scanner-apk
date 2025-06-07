from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessCardViewSet, UserRegistrationView, UserLoginView, UserDetailView, EmailConfigViewSet

router = DefaultRouter()
router.register(r'business-cards', BusinessCardViewSet)
router.register(r'email-config', EmailConfigViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
]