import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Search row + filter dropdown anchored under the tune button.
class AppFilterToolbar extends StatelessWidget {
  final Widget searchField;
  final int activeFilterCount;
  final Widget filterPanel;
  final VoidCallback? onResetFilters;
  final bool showReset;

  const AppFilterToolbar({
    super.key,
    required this.searchField,
    required this.filterPanel,
    this.activeFilterCount = 0,
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
        _FilterDropdownButton(
          activeFilterCount: activeFilterCount,
          panel: filterPanel,
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

class _FilterDropdownButton extends StatefulWidget {
  final int activeFilterCount;
  final Widget panel;

  const _FilterDropdownButton({
    required this.activeFilterCount,
    required this.panel,
  });

  @override
  State<_FilterDropdownButton> createState() => _FilterDropdownButtonState();
}

class _FilterDropdownButtonState extends State<_FilterDropdownButton> {
  final OverlayPortalController _overlay = OverlayPortalController();
  final LayerLink _link = LayerLink();

  void _toggle() {
    if (_overlay.isShowing) {
      _overlay.hide();
    } else {
      _overlay.show();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    final active = widget.activeFilterCount > 0;

    return CompositedTransformTarget(
      link: _link,
      child: OverlayPortal(
        controller: _overlay,
        overlayChildBuilder: (context) {
          return Positioned.fill(
            child: Stack(
              children: [
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.translucent,
                    onTap: _overlay.hide,
                  ),
                ),
                CompositedTransformFollower(
                  link: _link,
                  showWhenUnlinked: false,
                  targetAnchor:
                      isRtl ? Alignment.bottomLeft : Alignment.bottomRight,
                  followerAnchor:
                      isRtl ? Alignment.topLeft : Alignment.topRight,
                  offset: const Offset(0, 8),
                  child: Material(
                    elevation: 8,
                    color: scheme.surface,
                    shadowColor: Colors.black.withValues(alpha: 0.28),
                    borderRadius: BorderRadius.circular(16),
                    clipBehavior: Clip.antiAlias,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minWidth: 260,
                        maxWidth: 320,
                        maxHeight: 440,
                      ),
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                        child: widget.panel,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        child: SizedBox(
          height: 56,
          width: 56,
          child: IconButton(
            onPressed: _toggle,
            style: IconButton.styleFrom(
              backgroundColor: active
                  ? scheme.primary.withValues(alpha: 0.12)
                  : scheme.surfaceContainerHighest.withValues(alpha: 0.45),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            icon: Badge(
              isLabelVisible: active,
              label: Text('${widget.activeFilterCount}'),
              child: Icon(
                Icons.tune,
                size: 20,
                color: active ? scheme.primary : scheme.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AppSelectOption<T> {
  final T? value;
  final String label;

  const AppSelectOption({this.value, required this.label});
}

/// Options expand under the field (no overlay / bottom sheet).
class AppExpandingSelect<T> extends StatefulWidget {
  final String label;
  final T? value;
  final List<AppSelectOption<T>> options;
  final ValueChanged<T?> onChanged;

  const AppExpandingSelect({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  State<AppExpandingSelect<T>> createState() => _AppExpandingSelectState<T>();
}

class _AppExpandingSelectState<T> extends State<AppExpandingSelect<T>> {
  bool _open = false;

  String get _currentLabel {
    for (final option in widget.options) {
      if (option.value == widget.value) return option.label;
    }
    return widget.options.isEmpty ? '' : widget.options.first.label;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        InkWell(
          onTap: () => setState(() => _open = !_open),
          borderRadius: BorderRadius.circular(12),
          child: InputDecorator(
            decoration: InputDecoration(
              labelText: widget.label,
              border: const OutlineInputBorder(),
              suffixIcon: Icon(
                _open ? Icons.expand_less : Icons.expand_more,
              ),
            ),
            child: Text(
              _currentLabel,
              style: GoogleFonts.roboto(fontSize: 14),
            ),
          ),
        ),
        if (_open) ...[
          const SizedBox(height: 6),
          Material(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
            borderRadius: BorderRadius.circular(12),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (var i = 0; i < widget.options.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  ListTile(
                    dense: true,
                    selected: widget.options[i].value == widget.value,
                    title: Text(widget.options[i].label),
                    trailing: widget.options[i].value == widget.value
                        ? Icon(Icons.check, size: 18, color: scheme.primary)
                        : null,
                    onTap: () {
                      widget.onChanged(widget.options[i].value);
                      setState(() => _open = false);
                    },
                  ),
                ],
              ],
            ),
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
            prefixIcon: const Icon(Icons.search),
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
                      isUser ? Icons.person : Icons.search,
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
