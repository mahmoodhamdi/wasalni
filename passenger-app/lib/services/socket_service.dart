import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';
import '../utils/app_logger.dart';

const String _tag = 'SocketService';

typedef SocketEventHandler = void Function(dynamic data);

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  String? _userId;
  String? _tripId;
  final Map<String, List<SocketEventHandler>> _eventHandlers = {};

  // Legacy callbacks (kept for backward compatibility)
  Function(Map<String, dynamic>)? onDriverLocationUpdate;
  Function(Map<String, dynamic>)? onTripAccepted;
  Function(Map<String, dynamic>)? onDriverArrived;
  Function(Map<String, dynamic>)? onTripStarted;
  Function(Map<String, dynamic>)? onTripCompleted;
  Function(Map<String, dynamic>)? onTripCancelled;
  Function(Map<String, dynamic>)? onDriverMessage;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String userId, String token) {
    _userId = userId;

    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _socket!.onConnect((_) {
      AppLogger.info('Socket connected', tag: _tag);
      _joinUserRoom();
    });

    _socket!.onDisconnect((_) {
      AppLogger.warning('Socket disconnected', tag: _tag);
    });

    _socket!.onConnectError((error) {
      AppLogger.error('Socket connection error', tag: _tag, error: error);
    });

    _socket!.onError((error) {
      AppLogger.error('Socket error', tag: _tag, error: error);
    });

    // Listen to events
    _setupListeners();
  }

  void _setupListeners() {
    // Driver location updates
    _socket!.on('driver:location', (data) {
      _dispatchEvent('driver:location', data);
      if (onDriverLocationUpdate != null && data != null) {
        onDriverLocationUpdate!(Map<String, dynamic>.from(data));
      }
    });

    // Trip accepted by driver
    _socket!.on('trip:accepted', (data) {
      _dispatchEvent('trip:accepted', data);
      if (onTripAccepted != null && data != null) {
        onTripAccepted!(Map<String, dynamic>.from(data));
      }
    });

    // Driver arriving
    _socket!.on('trip:driver_arriving', (data) {
      _dispatchEvent('trip:driver_arriving', data);
    });

    // Driver arrived at pickup
    _socket!.on('trip:driver_arrived', (data) {
      _dispatchEvent('trip:driver_arrived', data);
      if (onDriverArrived != null && data != null) {
        onDriverArrived!(Map<String, dynamic>.from(data));
      }
    });

    // Trip started
    _socket!.on('trip:started', (data) {
      _dispatchEvent('trip:started', data);
      if (onTripStarted != null && data != null) {
        onTripStarted!(Map<String, dynamic>.from(data));
      }
    });

    // Trip completed
    _socket!.on('trip:completed', (data) {
      _dispatchEvent('trip:completed', data);
      if (onTripCompleted != null && data != null) {
        onTripCompleted!(Map<String, dynamic>.from(data));
      }
    });

    // Trip cancelled
    _socket!.on('trip:cancelled', (data) {
      _dispatchEvent('trip:cancelled', data);
      if (onTripCancelled != null && data != null) {
        onTripCancelled!(Map<String, dynamic>.from(data));
      }
    });

    // Driver message
    _socket!.on('chat:message', (data) {
      _dispatchEvent('chat:message', data);
      if (onDriverMessage != null && data != null) {
        onDriverMessage!(Map<String, dynamic>.from(data));
      }
    });

    // Trip-specific events
    _socket!.on('trip:driver:location', (data) {
      _dispatchEvent('trip:driver:location', data);
    });

    _socket!.on('trip:no_drivers', (data) {
      _dispatchEvent('trip:no_drivers', data);
    });

    _socket!.on('trip:timeout', (data) {
      _dispatchEvent('trip:timeout', data);
    });

    _socket!.on('trip:status:changed', (data) {
      _dispatchEvent('trip:status:changed', data);
    });

    _socket!.on('trip:chat:message', (data) {
      _dispatchEvent('trip:chat:message', data);
    });

    _socket!.on('trip:rated', (data) {
      _dispatchEvent('trip:rated', data);
    });
  }

  void _dispatchEvent(String event, dynamic data) {
    final handlers = _eventHandlers[event];
    if (handlers != null) {
      final eventData = data is Map ? Map<String, dynamic>.from(data) : data;
      for (final handler in handlers) {
        try {
          handler(eventData);
        } catch (e, stackTrace) {
          AppLogger.error('Error in socket event handler for $event', tag: _tag, error: e, stackTrace: stackTrace);
        }
      }
    }
  }

  /// Register an event handler
  void on(String event, SocketEventHandler handler) {
    _eventHandlers.putIfAbsent(event, () => []);
    _eventHandlers[event]!.add(handler);
  }

  /// Remove an event handler
  void off(String event, [SocketEventHandler? handler]) {
    if (handler != null) {
      _eventHandlers[event]?.remove(handler);
    } else {
      _eventHandlers.remove(event);
    }
  }

  /// Emit an event
  void emit(String event, dynamic data) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit(event, data);
    } else {
      AppLogger.warning('Socket not connected, cannot emit $event', tag: _tag);
    }
  }

  void _joinUserRoom() {
    if (_userId != null && _socket != null) {
      _socket!.emit('join:user', _userId);
    }
  }

  void joinTripRoom(String tripId) {
    _tripId = tripId;
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join:trip', tripId);
    }
  }

  void leaveTripRoom() {
    if (_tripId != null && _socket != null && _socket!.connected) {
      _socket!.emit('leave:trip', _tripId);
      _tripId = null;
    }
  }

  void sendMessage(String message) {
    if (_tripId != null && _socket != null) {
      _socket!.emit('trip:chat', {
        'tripId': _tripId,
        'message': message,
        'senderId': _userId,
        'senderType': 'passenger',
      });
    }
  }

  void updatePassengerLocation(double lat, double lng) {
    if (_socket != null) {
      _socket!.emit('passenger:location', {
        'userId': _userId,
        'latitude': lat,
        'longitude': lng,
      });
    }
  }

  void sendSOS(String tripId, double lat, double lng) {
    if (_socket != null) {
      _socket!.emit('trip:sos', {
        'tripId': tripId,
        'userId': _userId,
        'userType': 'passenger',
        'location': {'lat': lat, 'lng': lng},
      });
    }
  }

  void cancelTripRequest(String tripId, String reason) {
    if (_socket != null) {
      _socket!.emit('trip:cancel:passenger', {
        'tripId': tripId,
        'passengerId': _userId,
        'reason': reason,
      });
    }
  }

  void disconnect() {
    leaveTripRoom();
    _eventHandlers.clear();
    _socket?.dispose();
    _socket = null;
    _userId = null;
  }
}

// Global instance
final socketService = SocketService();
