import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

/// Mirrors `frontend/src/pages/Logs.jsx` + `constants/colors.js`.
class LogActionOption {
  final String value;
  final String label;

  const LogActionOption({required this.value, required this.label});
}

const logActionOptions = [
  LogActionOption(value: 'all', label: 'All Actions'),
  LogActionOption(value: 'upload_call', label: 'Upload Call'),
  LogActionOption(value: 'delete_call', label: 'Delete Call'),
  LogActionOption(value: 'call_processing', label: 'Call Processing'),
  LogActionOption(value: 'call_status_change', label: 'Call Status Change'),
  LogActionOption(value: 'review_call', label: 'Review Call'),
  LogActionOption(value: 'generate_report', label: 'Generate Report'),
  LogActionOption(value: 'publish_report', label: 'Publish Report'),
  LogActionOption(value: 'delete_report', label: 'Delete Report'),
  LogActionOption(value: 'user_created', label: 'User Created'),
  LogActionOption(value: 'user_updated', label: 'User Updated'),
  LogActionOption(value: 'user_deleted', label: 'User Deleted'),
  LogActionOption(value: 'create_followup', label: 'Create Followup'),
  LogActionOption(value: 'delete_followup', label: 'Delete Followup'),
  LogActionOption(value: 'update_followup', label: 'Update Followup'),
];

Color logActionColor(String action, ColorScheme scheme) {
  switch (action) {
    case 'upload_call':
      return AppTheme.primary;
    case 'delete_call':
      return AppTheme.danger;
    case 'call_processing':
      return AppTheme.orangeMain;
    case 'call_status_change':
      return AppTheme.secondary;
    case 'review_call':
      return AppTheme.success;
    case 'publish_report':
      return AppTheme.secondaryDark;
    case 'generate_report':
      return AppTheme.secondary;
    case 'delete_report':
      return AppTheme.errorDark;
    case 'user_created':
      return AppTheme.successDark;
    case 'user_deleted':
      return AppTheme.danger;
    case 'create_followup':
      return AppTheme.success;
    case 'delete_followup':
      return AppTheme.danger;
    case 'update_followup':
      return AppTheme.orangeMain;
    default:
      return scheme.onSurfaceVariant;
  }
}

IconData logActionIcon(String action) {
  switch (action) {
    case 'upload_call':
      return Icons.phone_outlined;
    case 'delete_call':
      return Icons.delete_outline;
    case 'call_processing':
      return Icons.hourglass_top_outlined;
    case 'call_status_change':
      return Icons.swap_horiz;
    case 'review_call':
      return Icons.check;
    case 'publish_report':
      return Icons.analytics_outlined;
    case 'generate_report':
      return Icons.description_outlined;
    case 'delete_report':
      return Icons.description_outlined;
    case 'user_created':
      return Icons.person_add_outlined;
    case 'user_updated':
      return Icons.edit_outlined;
    case 'user_deleted':
      return Icons.person_remove_outlined;
    case 'create_followup':
      return Icons.add_comment_outlined;
    case 'delete_followup':
      return Icons.remove_circle_outline;
    case 'update_followup':
      return Icons.edit_note_outlined;
    default:
      return Icons.history;
  }
}

String logActionLabel(String action) {
  switch (action) {
    case 'upload_call':
      return 'Uploaded a call';
    case 'delete_call':
      return 'Deleted a call';
    case 'call_processing':
      return 'Started processing call';
    case 'call_status_change':
      return 'Call status changed';
    case 'review_call':
      return 'Reviewed a call';
    case 'publish_report':
      return 'Published a report';
    case 'generate_report':
      return 'Generated a report';
    case 'delete_report':
      return 'Deleted a report';
    case 'user_created':
      return 'User was created';
    case 'user_updated':
      return 'User was updated';
    case 'user_deleted':
      return 'User was deleted';
    case 'create_followup':
      return 'Created a followup';
    case 'delete_followup':
      return 'Deleted a followup';
    case 'update_followup':
      return 'Updated a followup';
    default:
      return action.replaceAll('_', ' ');
  }
}

String logActionTag(String action) => action.replaceAll('_', ' ');
