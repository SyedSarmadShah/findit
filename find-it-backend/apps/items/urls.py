from rest_framework.routers import DefaultRouter

from .views import ItemClaimViewSet, ItemReportViewSet, ItemViewSet


router = DefaultRouter()
router.register(r"", ItemViewSet, basename="item")
router.register(r"claims", ItemClaimViewSet, basename="item-claim")
router.register(r"reports", ItemReportViewSet, basename="item-report")

urlpatterns = router.urls
