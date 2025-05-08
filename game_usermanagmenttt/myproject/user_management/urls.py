from django.urls import path
from .views import RegisterView, LoginView
from .views import RecordMatchView, MatchHistoryView, FriendRequestView, FriendListView, ProfileView, InvitationResponseView, LogoutView, ListusersView, CookiecokieView
from django.conf import settings 
from django.conf.urls.static import static 
from .views import  Generate2FAQRCodeView, VerifyOTPView
from .views import Check2FAScanStatusView
from .views import get_user_token

urlpatterns = [
  path("", get_user_token, name="get_user_token"),
  path('token/', CookiecokieView.as_view(), name='token'),
  path('register/', RegisterView.as_view(), name='register'),
  path('login/', LoginView.as_view(), name='login'),
  path('lougout/', LogoutView.as_view(), name='lougout'),
  path('add-freind/',FriendRequestView.as_view(),name='add-freind'),
  path('profile/<int:id>/', ProfileView.as_view(), name='profile'),
  path('list-users/',ListusersView.as_view(),name='list-users'),
  #path('invitations/', InvitationListView.as_view(), name='invitation-list'),
  path('friends/', FriendListView.as_view(), name='friend-list'),
  path('invitation/<int:invitation_id>/<str:action>/', InvitationResponseView.as_view(), name='invitation-response'),
  path('record/', RecordMatchView.as_view(), name='record-match'),
  path('history/', MatchHistoryView.as_view(), name='match-history'),
  path("2fa/qrcode/", Generate2FAQRCodeView.as_view(), name="generate-qrcode"),
  path("2fa/scanned/", Check2FAScanStatusView.as_view(), name='check-2fa-scan-status'),
  path("2fa/verify/", VerifyOTPView.as_view(), name="verify-otp"),
] + static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
