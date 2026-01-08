import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:latlong2/latlong.dart';

import '../config/theme.dart';
import '../services/map_service.dart';

// TODO: Switch to Google Places when billing is ready
// import 'package:google_places_flutter/google_places_flutter.dart';

/// Place search widget using Nominatim (FREE alternative to Google Places)
class PlaceSearchWidget extends StatefulWidget {
  final String hintText;
  final Function(PlaceResult) onPlaceSelected;
  final LatLng? nearLocation;
  final bool autofocus;
  final TextEditingController? controller;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;

  const PlaceSearchWidget({
    super.key,
    this.hintText = 'ابحث عن موقع...',
    required this.onPlaceSelected,
    this.nearLocation,
    this.autofocus = false,
    this.controller,
    this.prefixIcon,
    this.suffixIcon,
    this.padding,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  State<PlaceSearchWidget> createState() => _PlaceSearchWidgetState();
}

class _PlaceSearchWidgetState extends State<PlaceSearchWidget> {
  late TextEditingController _controller;
  final FocusNode _focusNode = FocusNode();
  List<PlaceResult> _suggestions = [];
  bool _isLoading = false;
  bool _showSuggestions = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    _focusNode.removeListener(_onFocusChange);
    _focusNode.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) {
      // Hide suggestions when focus is lost (with a small delay to allow tap)
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted && !_focusNode.hasFocus) {
          setState(() => _showSuggestions = false);
        }
      });
    }
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();

    if (query.length < 2) {
      setState(() {
        _suggestions = [];
        _showSuggestions = false;
      });
      return;
    }

    setState(() => _isLoading = true);

    // Debounce to respect rate limits and avoid excessive API calls
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      if (!mounted) return;

      try {
        final results = await mapService.searchPlaces(
          query,
          nearLat: widget.nearLocation?.latitude,
          nearLng: widget.nearLocation?.longitude,
          limit: 5,
        );

        if (mounted) {
          setState(() {
            _suggestions = results;
            _showSuggestions = results.isNotEmpty;
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _showSuggestions = false;
          });
        }
      }
    });
  }

  void _selectPlace(PlaceResult place) {
    _controller.text = place.shortName;
    setState(() {
      _showSuggestions = false;
      _suggestions = [];
    });
    _focusNode.unfocus();
    widget.onPlaceSelected(place);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Search field
        Container(
          padding: widget.padding ?? EdgeInsets.symmetric(horizontal: 16.w),
          decoration: BoxDecoration(
            color: widget.backgroundColor ?? Colors.white,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(12.r),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              widget.prefixIcon ??
                  Icon(
                    Icons.search,
                    color: Colors.grey.shade600,
                    size: 20.sp,
                  ),
              SizedBox(width: 12.w),
              Expanded(
                child: TextField(
                  controller: _controller,
                  focusNode: _focusNode,
                  autofocus: widget.autofocus,
                  textDirection: TextDirection.rtl,
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 14.sp,
                    ),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14.h),
                  ),
                  onChanged: _onSearchChanged,
                ),
              ),
              if (_isLoading)
                SizedBox(
                  width: 20.w,
                  height: 20.w,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                )
              else if (_controller.text.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    _controller.clear();
                    setState(() {
                      _suggestions = [];
                      _showSuggestions = false;
                    });
                  },
                  child: Icon(
                    Icons.close,
                    color: Colors.grey.shade600,
                    size: 20.sp,
                  ),
                )
              else
                widget.suffixIcon ?? const SizedBox.shrink(),
            ],
          ),
        ),

        // Suggestions list
        if (_showSuggestions) ...[
          SizedBox(height: 8.h),
          Container(
            constraints: BoxConstraints(maxHeight: 250.h),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12.r),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12.r),
              child: ListView.separated(
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: _suggestions.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade200),
                itemBuilder: (context, index) {
                  final place = _suggestions[index];
                  return _SuggestionTile(
                    place: place,
                    onTap: () => _selectPlace(place),
                  );
                },
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Individual suggestion tile
class _SuggestionTile extends StatelessWidget {
  final PlaceResult place;
  final VoidCallback onTap;

  const _SuggestionTile({
    required this.place,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
          child: Row(
            children: [
              Container(
                width: 40.w,
                height: 40.w,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Icon(
                  Icons.location_on,
                  color: AppColors.primary,
                  size: 20.sp,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      place.shortName,
                      style: TextStyle(
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey.shade800,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      place.address.formattedAddress,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/*
// TODO: Switch to Google Places when billing is ready
// Original Google Places implementation:

GooglePlaceAutoCompleteTextField(
  textEditingController: controller,
  googleAPIKey: "YOUR_API_KEY",
  inputDecoration: InputDecoration(),
  debounceTime: 800,
  countries: ["eg"],
  isLatLngRequired: true,
  getPlaceDetailWithLatLng: (prediction) {
    // Handle place selection
  },
  itemClick: (prediction) {
    controller.text = prediction.description;
  },
);
*/
