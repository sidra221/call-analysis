import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Search row + Filters button — mirrors React `FilterToolbar`.
class AppFilterToolbar extends StatelessWidget {
  final Widget searchField;
  final int activeFilterCount;
  final VoidCallback onOpenFilters;
  final VoidCallback? onResetFilters;
  final bool showReset;

  const AppFilterToolbar({
    super.key,
    required this.searchField,
    this.activeFilterCount = 0,
    required this.onOpenFilters,
    this.onResetFilters,
    this.showReset = false,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(child: searchField),
        const SizedBox(width: 10),
        SizedBox(
          height: 56,
          width: 56,
          child: IconButton(
            onPressed: onOpenFilters,
            style: IconButton.styleFrom(
              backgroundColor: activeFilterCount > 0
                  ? scheme.primary.withValues(alpha: 0.12)
                  : scheme.surfaceContainerHighest.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: Badge(
              isLabelVisible: activeFilterCount > 0,
              label: Text('$activeFilterCount'),
              child: Icon(
                Icons.tune_outlined,
                size: 18,
                color: activeFilterCount > 0
                    ? scheme.primary
                    : scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
        if (showReset && onResetFilters != null) ...[
          const SizedBox(width: 8),
          TextButton.icon(
            onPressed: onResetFilters,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Reset'),
            style: TextButton.styleFrom(foregroundColor: scheme.error),
          ),
        ],
      ],
    );
  }
}

/// Username autocomplete — inline list (works inside bottom sheets / web).
class AppUsernameAutocomplete extends StatefulWidget {
  final String initialValue;
  final List<String> options;
  final ValueChanged<String> onChanged;

  const AppUsernameAutocomplete({
    super.key,
    required this.initialValue,
    required this.options,
    required this.onChanged,
  });

  @override
  State<AppUsernameAutocomplete> createState() =>
      _AppUsernameAutocompleteState();
}

class _AppUsernameAutocompleteState extends State<AppUsernameAutocomplete> {
  late final TextEditingController _controller;
  late final FocusNode _focusNode;
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue);
    _focusNode = FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    setState(() => _expanded = _focusNode.hasFocus);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  List<String> get _filteredOptions {
    final q = _controller.text.trim().toLowerCase();
    if (q.isEmpty) return widget.options;
    return widget.options
        .where((u) => u.toLowerCase().contains(q))
        .toList();
  }

  void _selectOption(String value) {
    _controller.text = value;
    _controller.selection = TextSelection.collapsed(offset: value.length);
    widget.onChanged(value);
    setState(() => _expanded = false);
    _focusNode.unfocus();
  }

  void _clearField() {
    _controller.clear();
    widget.onChanged('');
    setState(() => _expanded = _focusNode.hasFocus);
  }

  @override
  Widget build(BuildContext context) {
    final options = _filteredOptions;
    final showList = _expanded && options.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _controller,
          focusNode: _focusNode,
          onChanged: (value) {
            widget.onChanged(value);
            setState(() => _expanded = true);
          },
          onTap: () => setState(() => _expanded = true),
          decoration: InputDecoration(
            labelText: 'Username',
            border: const OutlineInputBorder(),
            hintText: 'Type to search users...',
            suffixIcon: _controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded, size: 20),
                    onPressed: _clearField,
                  )
                : const Icon(Icons.arrow_drop_down_rounded),
          ),
        ),
        if (showList) ...[
          const SizedBox(height: 6),
          Material(
            elevation: 3,
            borderRadius: BorderRadius.circular(8),
            clipBehavior: Clip.antiAlias,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200),
              child: ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: options.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final user = options[index];
                  return ListTile(
                    dense: true,
                    visualDensity: VisualDensity.compact,
                    leading: CircleAvatar(
                      radius: 14,
                      child: Text(
                        user.isNotEmpty ? user[0].toUpperCase() : '?',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    title: Text(user),
                    onTap: () => _selectOption(user),
                  );
                },
              ),
            ),
          ),
        ] else if (_expanded && widget.options.isEmpty) ...[
          const SizedBox(height: 6),
          Text(
            'No users found in logs',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
          ),
        ],
      ],
    );
  }
}

/// Search with suggestions dropdown.
class AppSearchAutocomplete extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintText;
  final List<String> suggestions;
  final ValueChanged<String> onChanged;
  final VoidCallback? onClear;

  const AppSearchAutocomplete({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.hintText,
    required this.suggestions,
    required this.onChanged,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return RawAutocomplete<String>(
      textEditingController: controller,
      focusNode: focusNode,
      optionsBuilder: (value) {
        final q = value.text.trim().toLowerCase();
        if (q.length < 1) return const Iterable<String>.empty();
        return suggestions
            .where((s) => s.toLowerCase().contains(q))
            .take(8);
      },
      onSelected: (selection) {
        controller.text = selection;
        onChanged(selection);
      },
      fieldViewBuilder: (context, fieldController, fieldFocus, onSubmitted) {
        return TextField(
          controller: fieldController,
          focusNode: fieldFocus,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: GoogleFonts.roboto(
              fontSize: 14,
              color: scheme.onSurfaceVariant,
            ),
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear_rounded),
                    onPressed: onClear,
                  )
                : null,
            filled: true,
            fillColor: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        );
      },
      optionsViewBuilder: (context, onSelected, options) {
        if (options.isEmpty) return const SizedBox.shrink();
        return Align(
          alignment: Alignment.topLeft,
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(12),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final option = options.elementAt(index);
                  final isUser = !option.contains(' ') && option.length < 30;
                  return ListTile(
                    dense: true,
                    leading: Icon(
                      isUser ? Icons.person_outline : Icons.search,
                      size: 18,
                    ),
                    title: Text(
                      option,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () => onSelected(option),
                  );
                },
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Bottom sheet shell with Apply button — mirrors React `FilterPopover`.
class AppFilterSheet extends StatelessWidget {
  final String title;
  final List<Widget> children;
  final VoidCallback onApply;
  final String applyLabel;

  const AppFilterSheet({
    super.key,
    required this.title,
    required this.children,
    required this.onApply,
    this.applyLabel = 'Apply Filters',
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        8,
        20,
        24 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 18),
          ...children,
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              onApply();
              Navigator.pop(context);
            },
            child: Text(applyLabel),
          ),
        ],
      ),
    );
  }
}
