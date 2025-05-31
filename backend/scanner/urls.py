from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessCardViewSet

router = DefaultRouter()
router.register(r'business-cards', BusinessCardViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 