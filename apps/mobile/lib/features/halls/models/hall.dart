double _asDouble(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

String _asString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  if (value is String) return value;
  return value.toString();
}

String? _asNullableString(dynamic value) {
  if (value == null) return null;
  final parsed = value.toString();
  return parsed.isEmpty ? null : parsed;
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

class DaytimePrice {
  final String id;
  final String daytime;
  final double price;

  DaytimePrice({required this.id, required this.daytime, required this.price});

  factory DaytimePrice.fromJson(Map<String, dynamic> json) {
    return DaytimePrice(
      id: _asString(json['id']),
      daytime: _asString(json['daytime']),
      price: _asDouble(json['price']),
    );
  }
}

class BankAccount {
  final String id;
  final String bankCode;
  final String accountHolder;
  final String accountNumber;

  BankAccount({
    required this.id,
    required this.bankCode,
    required this.accountHolder,
    required this.accountNumber,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) {
    return BankAccount(
      id: _asString(json['id']),
      bankCode: _asString(json['bankCode']),
      accountHolder: _asString(json['accountHolder']),
      accountNumber: _asString(json['accountNumber']),
    );
  }
}

class Hall {
  final String id;
  final String name;
  final String city;
  final String? area;
  final int capacity;
  final double? depositAmount;
  final String currency;
  final String? coverPhoto;
  final String? status;
  final double? startingFrom;
  final List<DaytimePrice> daytimePrices;
  final List<BankAccount> bankAccounts;

  Hall({
    required this.id,
    required this.name,
    required this.city,
    this.area,
    required this.capacity,
    this.depositAmount,
    required this.currency,
    this.coverPhoto,
    this.status,
    this.startingFrom,
    this.daytimePrices = const [],
    this.bankAccounts = const [],
  });

  factory Hall.fromJson(Map<String, dynamic> json) {
    List<DaytimePrice> prices = [];
    if (json['daytimePrices'] is List) {
      prices = (json['daytimePrices'] as List)
          .whereType<Map>()
          .map((dp) => DaytimePrice.fromJson(Map<String, dynamic>.from(dp)))
          .toList();
    }

    List<BankAccount> accounts = [];
    if (json['bankAccounts'] is List) {
      accounts = (json['bankAccounts'] as List)
          .whereType<Map>()
          .map((a) => BankAccount.fromJson(Map<String, dynamic>.from(a)))
          .toList();
    }

    return Hall(
      id: _asString(json['id']),
      name: _asString(json['name'], fallback: 'Unknown Hall'),
      city: _asString(json['city']),
      area: _asNullableString(json['area']),
      capacity: _asInt(json['capacity']),
      depositAmount: json['depositAmount'] != null
          ? _asDouble(json['depositAmount'])
          : null,
      currency: _asString(json['currency'], fallback: 'YER'),
      coverPhoto: _asNullableString(json['coverPhoto']),
      status: _asNullableString(json['status']),
      startingFrom: json['startingFrom'] != null
          ? _asDouble(json['startingFrom'])
          : null,
      daytimePrices: prices,
      bankAccounts: accounts,
    );
  }
}
