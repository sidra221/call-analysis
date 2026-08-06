import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<Map<String, dynamic>> _notifications = [
    {
      'title': 'Missed Call',
      'body': 'John Doe tried to reach you',
      'time': '2 min ago',
      'icon': Icons.call_missed,
      'color': Colors.red,
      'read': false,
    },
    {
      'title': 'New Report',
      'body': 'Monthly report is ready',
      'time': '15 min ago',
      'icon': Icons.bar_chart,
      'color': Colors.green,
      'read': false,
    },
    {
      'title': 'Follow-up Reminder',
      'body': 'Sarah is waiting for a callback',
      'time': '1 hr ago',
      'icon': Icons.task,
      'color': Colors.orange,
      'read': false,
    },
  ];

  final List<Map<String, dynamic>> _allCalls = [
    {'name': 'John Doe', 'type': 'Missed Call', 'icon': Icons.call_missed},
    {'name': 'Sarah', 'type': 'Incoming Call', 'icon': Icons.call_received},
    {'name': 'Ahmed', 'type': 'Outgoing Call', 'icon': Icons.call_made},
    {'name': 'Mohammed', 'type': 'Outgoing Call', 'icon': Icons.call_made},
    {'name': 'Fatima', 'type': 'Incoming Call', 'icon': Icons.call_received},
  ];

  int get _unreadCount => _notifications.where((n) => n['read'] == false).length;

  List<Map<String, dynamic>> get _filteredCalls {
    if (_searchQuery.isEmpty) return _allCalls;
    return _allCalls
        .where((call) =>
            call['name'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
            call['type'].toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  void _showNotificationsPanel(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.55,
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius:const  BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: scheme.onSurface,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setModalState(() {
                          for (var n in _notifications) {
                            n['read'] = true;
                          }
                        });
                        setState(() {}); // update badge
                      },
                      child: const Text('Mark all read'),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // List
              Expanded(
                child: _notifications.isEmpty
                    ? const Center(child: Text('No notifications'))
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) =>
                            const Divider(height: 1, indent: 72),
                        itemBuilder: (_, i) {
                          final n = _notifications[i];
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 4),
                            leading: CircleAvatar(
                              backgroundColor:
                                  (n['color'] as Color).withValues(alpha: 0.12),
                              child: Icon(n['icon'] as IconData,
                                  color: n['color'] as Color, size: 20),
                            ),
                            title: Text(
                              n['title'],
                              style: TextStyle(
                                fontWeight: n['read'] == false
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                            subtitle: Text(n['body']),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  n['time'],
                                  style: TextStyle(
                                      fontSize: 11, color: scheme.onSurfaceVariant),
                                ),
                                if (n['read'] == false)
                                  Container(
                                    margin: const EdgeInsets.only(top: 4),
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: scheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                            onTap: () {
                              setModalState(() => n['read'] = true);
                              setState(() {}); // update badge
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: scheme.surface,
      appBar: AppBar(
        title: _isSearching
            ? TextField(
  controller: _searchController,
  onChanged: (value) {
    setState(() {
      _searchQuery = value;
    });
  },
  decoration: InputDecoration(
    hintText: 'Search calls...',
    prefixIcon: const Icon(Icons.search_rounded),
    suffixIcon: _searchQuery.isNotEmpty
        ? IconButton(
            icon: const Icon(Icons.clear_rounded),
            onPressed: () {
              _searchController.clear();
              setState(() {
                _searchQuery = '';
              });
            },
          )
        : null,
    filled: true,
    fillColor: Theme.of(context)
        .colorScheme
        .surfaceContainerHighest
        .withValues(alpha: 0.45),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(
        color: Theme.of(context)
            .colorScheme
            .primary
            .withValues(alpha: 0.4),
      ),
    ),
  ),
)
            : const Text("Dashboard"),
        centerTitle: false,
        backgroundColor: scheme.surface,
        elevation: 0,
        actions: [
          // Search toggle
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  _searchQuery = '';
                }
              });
            },
          ),
          // Notification bell with badge
          Padding(
            
            padding: const EdgeInsets.only(right: 12),
            child: Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => _showNotificationsPanel(context),
                ),
                if (_unreadCount > 0)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      width: 18,
                      height: 18,
                      decoration:  BoxDecoration(
                        color: Theme.of(context).colorScheme.error,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '$_unreadCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!_isSearching) ...[
              Text(
                "Welcome back 👋",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: scheme.onSurface),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  _buildStatCard("Calls", "128", Icons.call, scheme.primary),
                  const SizedBox(width: 12),
                  _buildStatCard(
                      "Reports", "32", Icons.bar_chart, AppTheme.success),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildStatCard(
                      "Followups", "14", Icons.task, AppTheme.warning),
                  const SizedBox(width: 12),
                  _buildStatCard("Alerts", "5", Icons.warning, AppTheme.danger),
                ],
              ),
              const SizedBox(height: 25),
            ],
            Text(
              _isSearching
                  ? 'Results for "$_searchQuery"'
                  : "Recent Calls",
              style: TextStyle(
                  fontSize: 18, fontWeight: FontWeight.bold, color: scheme.onSurface),
            ),
            const SizedBox(height: 10),
            if (_filteredCalls.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text('No calls found',
                      style: TextStyle(color: scheme.onSurfaceVariant)),
                ),
              )
            else
              ..._filteredCalls.map(
                (call) => _buildCallTile(
                    call['name'], call['type'], call['icon']),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    final scheme = Theme.of(context).colorScheme;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: scheme.shadow.withValues(alpha: 0.05),
              blurRadius: 10,
            )
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(height: 10),
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: scheme.onSurface)),
            Text(title, style: TextStyle(color: scheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }

  Widget _buildCallTile(String name, String type, IconData icon) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: scheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(name,
                style: TextStyle(fontWeight: FontWeight.bold, color: scheme.onSurface)),
          ),
          Text(type, style: TextStyle(color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}
