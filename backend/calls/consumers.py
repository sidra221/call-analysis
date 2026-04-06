import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.group_name = f'call_{self.call_id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Event handlers (dispatched via group_send)
    async def analysis_started(self, event):
        await self.send(text_data=json.dumps({
            "type": "analysis_started",
            "call_id": event.get("call_id"),
            "message": event.get("message", "Analysis started")
        }))

    async def analysis_completed(self, event):
        await self.send(text_data=json.dumps({
            "type": "analysis_completed",
            "call_id": event.get("call_id"),
            "analysis_id": event.get("analysis_id"),
            "message": event.get("message", "Analysis completed")
        }))

    async def analysis_failed(self, event):
        await self.send(text_data=json.dumps({
            "type": "analysis_failed",
            "call_id": event.get("call_id"),
            "error": event.get("error", "Analysis failed"),
        }))

