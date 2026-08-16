import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import Call

User = get_user_model()


class CallConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time call analysis notifications.
    Each client connects to a specific call's channel group
    and receives events as the Celery task progresses.

    Expected WebSocket URL: ws/calls/{call_id}/?token=<access_token>
    """

    @database_sync_to_async
    def _get_user_from_token(self, raw_token):
        try:
            access = AccessToken(raw_token)
            user_id = access['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except (TokenError, User.DoesNotExist, KeyError):
            return None

    @database_sync_to_async
    def _user_is_manager_or_qa(self, user):
        try:
            return user.profile.role.lower() in ('manager', 'qa')
        except Exception:
            return False

    @database_sync_to_async
    def _call_exists(self, call_id):
        return Call.objects.filter(id=call_id).exists()

    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]

        if not token:
            await self.close(code=4001)
            return

        user = await self._get_user_from_token(token)
        if user is None:
            await self.close(code=4001)
            return

        if not await self._user_is_manager_or_qa(user):
            await self.close(code=4001)
            return

        self.call_id = self.scope['url_route']['kwargs']['call_id']

        if not await self._call_exists(self.call_id):
            await self.close(code=4001)
            return

        self.scope['user'] = user
        self.group_name = f'call_{self.call_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Remove the client from the channel group on disconnect."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def analysis_started(self, event):
        """
        Forward the analysis_started event to the connected WebSocket client.
        Triggered by the Celery task when processing begins.
        """
        await self.send(text_data=json.dumps({
            "type": "analysis_started",
            "call_id": event.get("call_id"),
            "message": event.get("message", "Analysis started"),
        }))

    async def analysis_completed(self, event):
        """
        Forward the analysis_completed event to the connected WebSocket client.
        Triggered by the Celery task when results are saved successfully.
        """
        await self.send(text_data=json.dumps({
            "type": "analysis_completed",
            "call_id": event.get("call_id"),
            "analysis_id": event.get("analysis_id"),
            "message": event.get("message", "Analysis completed"),
        }))

    async def analysis_failed(self, event):
        """
        Forward the analysis_failed event to the connected WebSocket client.
        Triggered by the Celery task when an unrecoverable error occurs.
        """
        await self.send(text_data=json.dumps({
            "type": "analysis_failed",
            "call_id": event.get("call_id"),
            "error": event.get("error", "Analysis failed"),
        }))
