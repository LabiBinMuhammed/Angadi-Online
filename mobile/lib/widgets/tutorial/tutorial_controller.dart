import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import 'tutorial_step.dart';
import 'tutorial_overlay_painter.dart';
import 'tutorial_tooltip.dart';

class TutorialController extends ChangeNotifier {
  List<TutorialStep> _steps = [];
  int _currentStepIndex = 0;
  OverlayEntry? _overlayEntry;
  bool _isActive = false;

  bool get isActive => _isActive;
  int get currentStepIndex => _currentStepIndex;
  int get totalSteps => _steps.length;
  TutorialStep? get currentStep => _steps.isNotEmpty && _currentStepIndex < _steps.length
      ? _steps[_currentStepIndex]
      : null;

  void startTutorial(BuildContext context, List<TutorialStep> steps) {
    if (_isActive) {
      dismiss();
    }
    if (steps.isEmpty) return;

    _steps = steps;
    _currentStepIndex = 0;
    _isActive = true;

    // Trigger onStepActive callback for first step
    _steps[0].onStepActive?.call();

    _overlayEntry = OverlayEntry(
      builder: (context) => _TutorialOverlayWidget(controller: this),
    );

    Overlay.of(context).insert(_overlayEntry!);
    notifyListeners();
  }

  void nextStep() {
    if (!_isActive) return;

    if (_currentStepIndex < _steps.length - 1) {
      _currentStepIndex++;
      _steps[_currentStepIndex].onStepActive?.call();
      notifyListeners();
    } else {
      dismiss();
    }
  }

  void skipTutorial() {
    dismiss();
  }

  void dismiss() {
    if (!_isActive) return;
    _overlayEntry?.remove();
    _overlayEntry = null;
    _isActive = false;
    _steps = [];
    _currentStepIndex = 0;
    notifyListeners();
  }

  Rect? getTargetRect() {
    final step = currentStep;
    if (step == null) return null;

    final context = step.targetKey.currentContext;
    if (context == null) return null;

    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null || !renderBox.hasSize) return null;

    final offset = renderBox.localToGlobal(Offset.zero);
    return offset & renderBox.size;
  }
}

class _TutorialOverlayWidget extends StatefulWidget {
  final TutorialController controller;
  const _TutorialOverlayWidget({required this.controller});

  @override
  State<_TutorialOverlayWidget> createState() => _TutorialOverlayWidgetState();
}

class _TutorialOverlayWidgetState extends State<_TutorialOverlayWidget> with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    widget.controller.addListener(_onStateChange);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onStateChange);
    _animCtrl.dispose();
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final step = widget.controller.currentStep;
    if (step == null) return const SizedBox.shrink();

    final targetRect = widget.controller.getTargetRect();
    if (targetRect == null) {
      // If the target widget is not rendered yet, retry rendering on next frame
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() {});
      });
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context)!;
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    // Calculate tooltip coordinates
    const double tooltipWidth = 280.0;
    const double spacing = 12.0;

    double tooltipLeft = 0.0;
    double? tooltipTop;
    double? tooltipBottom;

    switch (step.arrowPosition) {
      case TutorialArrowPosition.top:
        // Tooltip placed below target
        tooltipLeft = targetRect.center.dx - tooltipWidth / 2;
        tooltipTop = targetRect.bottom + spacing;
        break;
      case TutorialArrowPosition.bottom:
        // Tooltip placed above target: anchor from bottom of tooltip to top of target
        tooltipLeft = targetRect.center.dx - tooltipWidth / 2;
        tooltipBottom = (screenHeight - targetRect.top + spacing).clamp(16.0, screenHeight - 60.0);
        break;
      case TutorialArrowPosition.left:
        // Tooltip placed to the right
        tooltipLeft = targetRect.right + spacing;
        tooltipTop = targetRect.center.dy - 60.0;
        break;
      case TutorialArrowPosition.right:
        // Tooltip placed to the left
        tooltipLeft = targetRect.left - spacing - tooltipWidth;
        tooltipTop = targetRect.center.dy - 60.0;
        break;
    }

    // Clamp tooltip horizontal positions within screen bounds with 16px safe margins
    tooltipLeft = tooltipLeft.clamp(16.0, screenWidth - tooltipWidth - 16.0);

    // Dynamic relative arrow pointer offset along the tooltip width
    final double arrowTargetX = (targetRect.center.dx - tooltipLeft).clamp(24.0, tooltipWidth - 24.0);
    
    // Auto-adjust vertical boundaries for top-positioned tooltips
    if (tooltipTop != null) {
      tooltipTop = tooltipTop.clamp(16.0, screenHeight - 180.0);
    }

    return Material(
      type: MaterialType.transparency,
      child: Stack(
        children: [
          // 1. Dark Backdrop with highlighted cutout
          AnimatedBuilder(
            animation: _animCtrl,
            builder: (context, child) {
              return CustomPaint(
                size: Size(screenWidth, screenHeight),
                painter: TutorialOverlayPainter(
                  targetRect: targetRect,
                  shape: step.shape,
                  animationValue: _animCtrl.value,
                ),
              );
            },
          ),
          // 2. Click shield/detector for blocking background taps
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {
                // Prevent tapping through, but don't close.
                // The user must interact with Skip or Next.
              },
            ),
          ),
          // 3. Floating Tooltip bubble
          Positioned(
            left: tooltipLeft,
            top: tooltipTop,
            bottom: tooltipBottom,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (child, animation) => FadeTransition(
                opacity: animation,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.95, end: 1.0).animate(animation),
                  child: child,
                ),
              ),
              child: TutorialTooltip(
                key: ValueKey(widget.controller.currentStepIndex),
                title: step.title(l10n),
                description: step.description(l10n),
                arrowPosition: step.arrowPosition,
                arrowOffset: arrowTargetX,
                progressText: '${widget.controller.currentStepIndex + 1}/${widget.controller.totalSteps}',
                onNext: widget.controller.nextStep,
                onSkip: widget.controller.skipTutorial,
                isLast: widget.controller.currentStepIndex == widget.controller.totalSteps - 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
