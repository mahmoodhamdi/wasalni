import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';

typedef SocketEventHandler = void Function(dynamic data);

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  String? _driverId;
  String? _tripId;
  final Map<String, List<SocketEventHandler>> _eventHandlers = {};

  bool get isConnected => _socket?.connected ?? false;

  void connect(String driverId, String token) {
    _driverId = driverId;

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
      print('Socket connected');
      _joinDriverRoom();
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
    });

    _socket!.onConnectError((error) {
      print('Socket connection error: $error');
    });

    _socket!.onError((error) {
      print('Socket error: $error');
    });

    _setupListeners();
  }

  void _setupListeners() {
    // Trip request - new trip available for driver
    _socket!.on('trip:request', (data) {
      _dispatchEvent('trip:request', data);
    });

    // Trip assigned to this driver
    _socket!.on('trip:assigned', (data) {
      _dispatchEvent('trip:assigned', data);
    });

    // Trip cancelled by passenger
    _socket!.on('trip:cancelled', (data) {
      _dispatchEvent('trip:cancelled', data);
    });

    // Passenger location update
    _socket!.on('passenger:location', (data) {
      _dispatchEvent('passenger:location', data);
    });

    // Chat message from passenger
    _socket!.on('trip:chat:message', (data) {
      _dispatchEvent('trip:chat:message', data);
    });

    // Trip rated by passenger
    _socket!.on('trip:rated', (data) {
      _dispatchEvent('trip:rated', data);
    });

    // Admin/system messages
    _socket!.on('system:message', (data) {
      _dispatchEvent('system:message', data);
    });
  }

  void _dispatchEvent(String event, dynamic data) {
    final handlers = _eventHandlers[event];
    if (handlers != null) {
      final eventData = data is Map ? Map<String, dynamic>.from(data) : data;
      for (final handler in handlers) {
        try {
          handler(eventData);
        } catch (e) {
          print('Error in socket event handler for $event: $e');
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
      print('Socket not connected, cannot emit $event');
    }
  }

  void _joinDriverRoom() {
    if (_driverId != null && _socket != null) {
      _socket!.emit('join:driver', _driverId);
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

  void updateLocation(double lat, double lng, {double? heading, double? speed}) {
    if (_socket != null) {
      _socket!.emit('driver:location', {
        'driverId': _driverId,
        'latitude': lat,
        'longitude': lng,
        if (heading != null) 'heading': heading,
        if (speed != null) 'speed': speed,
      });
    }
  }

  void updateTripLocation(double lat, double lng, {double? heading}) {
    if (_tripId != null && _socket != null) {
      _socket!.emit('trip:driver:location', {
        'tripId': _tripId,
        'driverId': _driverId,
        'latitude': lat,
        'longitude': lng,
        if (heading != null) 'heading': heading,
      });
    }
  }

  void sendMessage(String message) {
    if (_tripId != null && _socket != null) {
      _socket!.emit('trip:chat', {
        'tripId': _tripId,
        'message': message,
        'senderId': _driverId,
        'senderType': 'driver',
      });
    }
  }

  void acceptTripRequest(String tripId) {
    if (_socket != null) {
      _socket!.emit('trip:accept', {
        'tripId': tripId,
        'driverId': _driverId,
      });
    }
  }

  void rejectTripRequest(String tripId, {String? reason}) {
    if (_socket != null) {
      _socket!.emit('trip:reject', {
        'tripId': tripId,
        'driverId': _driverId,
        if (reason != null) 'reason': reason,
      });
    }
  }

  void notifyArrival(String tripId) {
    if (_socket != null) {
      _socket!.emit('trip:driver_arrived', {
        'tripId': tripId,
        'driverId': _driverId,
      });
    }
  }

  void startTrip(String tripId) {
    if (_socket != null) {
      _socket!.emit('trip:start', {
        'tripId': tripId,
        'driverId': _driverId,
      });
    }
  }

  void completeTrip(String tripId) {
    if (_socket != null) {
      _socket!.emit('trip:complete', {
        'tripId': tripId,
        'driverId': _driverId,
      });
    }
  }

  void cancelTrip(String tripId, String reason) {
    if (_socket != null) {
      _socket!.emit('trip:cancel:driver', {
        'tripId': tripId,
        'driverId': _driverId,
        'reason': reason,
      });
    }
  }

  void sendSOS(String tripId, double lat, double lng) {
    if (_socket != null) {
      _socket!.emit('trip:sos', {
        'tripId': tripId,
        'driverId': _driverId,
        'userType': 'driver',
        'location': {'lat': lat, 'lng': lng},
      });
    }
  }

  void disconnect() {
    leaveTripRoom();
    _eventHandlers.clear();
    _socket?.dispose();
    _socket = null;
    _driverId = null;
  }
}

// Global instance
final socketService = SocketService();
