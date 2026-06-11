from .models import ActivityLog  

def create_log(user, action, description):
    try:
        log = ActivityLog.objects.create(  
            user=user,
            action=action,
            description=description
        )
        username = user.username if user and hasattr(user, 'username') else 'Unknown'
        print(f"[LOG] {username} - {action} - {description}")
        return log
    except Exception as e:
        print(f"[LOG ERROR] {e}")
        return None