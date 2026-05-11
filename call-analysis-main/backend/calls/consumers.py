import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time call analysis notifications.
    Each client connects to a specific call's channel group
    and receives events as the Celery task progresses.

    Expected WebSocket URL: ws/calls/{call_id}/
    """

    async def connect(self):
        """
        Accept the WebSocket connection and add the client to
        the call-specific channel group.
        """
        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.group_name = f'call_{self.call_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        """Remove the client from the channel group on disconnect."""
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