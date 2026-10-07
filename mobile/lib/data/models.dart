class CustomerRow {
  final String id;
  final String name;
  final String? nik;
  final String? phone;
  final String? address;
  final String? packageName;
  final int monthlyFee;
  final String? wifiSsid;
  final String? pppoeUser;
  final String status;
  final String? ispPartnerId;
  final String? installedAt;
  final String createdAt;
  final String updatedAt;
  final int dirty;
  final int deletedLocally;

  const CustomerRow({
    required this.id,
    required this.name,
    this.nik,
    this.phone,
    this.address,
    this.packageName,
    this.monthlyFee = 0,
    this.wifiSsid,
    this.pppoeUser,
    this.status = 'aktif',
    this.ispPartnerId,
    this.installedAt,
    required this.createdAt,
    required this.updatedAt,
    this.dirty = 0,
    this.deletedLocally = 0,
  });

  factory CustomerRow.fromMap(Map<String, Object?> m) => CustomerRow(
        id: m['id'] as String,
        name: m['name'] as String,
        nik: m['nik'] as String?,
        phone: m['phone'] as String?,
        address: m['address'] as String?,
        packageName: m['package_name'] as String?,
        monthlyFee: (m['monthly_fee'] as int?) ?? 0,
        wifiSsid: m['wifi_ssid'] as String?,
        pppoeUser: m['pppoe_user'] as String?,
        status: (m['status'] as String?) ?? 'aktif',
        ispPartnerId: m['isp_partner_id'] as String?,
        installedAt: m['installed_at'] as String?,
        createdAt: m['created_at'] as String,
        updatedAt: m['updated_at'] as String,
        dirty: (m['dirty'] as int?) ?? 0,
        deletedLocally: (m['deleted_locally'] as int?) ?? 0,
      );

  Map<String, Object?> toLocalMap() => {
        'id': id,
        'name': name,
        'nik': nik,
        'phone': phone,
        'address': address,
        'package_name': packageName,
        'monthly_fee': monthlyFee,
        'wifi_ssid': wifiSsid,
        'pppoe_user': pppoeUser,
        'status': status,
        'isp_partner_id': ispPartnerId,
        'installed_at': installedAt,
        'created_at': createdAt,
        'updated_at': updatedAt,
        'dirty': dirty,
        'deleted_locally': deletedLocally,
      };

  Map<String, dynamic> toRemoteMap() => {
        'id': id,
        'name': name,
        'nik': nik,
        'phone': phone,
        'address': address,
        'package_name': packageName,
        'monthly_fee': monthlyFee,
        'wifi_ssid': wifiSsid,
        'pppoe_user': pppoeUser,
        'status': status,
        'isp_partner_id': ispPartnerId,
        'installed_at': installedAt,
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  CustomerRow copyWith({
    String? name,
    String? nik,
    String? phone,
    String? address,
    String? packageName,
    int? monthlyFee,
    String? wifiSsid,
    String? pppoeUser,
    String? status,
    String? ispPartnerId,
    String? installedAt,
    String? updatedAt,
    int? dirty,
    int? deletedLocally,
  }) {
    return CustomerRow(
      id: id,
      name: name ?? this.name,
      nik: nik ?? this.nik,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      packageName: packageName ?? this.packageName,
      monthlyFee: monthlyFee ?? this.monthlyFee,
      wifiSsid: wifiSsid ?? this.wifiSsid,
      pppoeUser: pppoeUser ?? this.pppoeUser,
      status: status ?? this.status,
      ispPartnerId: ispPartnerId ?? this.ispPartnerId,
      installedAt: installedAt ?? this.installedAt,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      dirty: dirty ?? this.dirty,
      deletedLocally: deletedLocally ?? this.deletedLocally,
    );
  }
}

class PsbRow {
  final String id;
  final String customerName;
  final String? nik;
  final String? phone;
  final String address;
  final String? packageName;
  final int packagePrice;
  final int fee;
  final String? installDate;
  final String? cableDistance;
  final String? wifiSsid;
  final String? pppoeUser;
  final String? wifiPassword;
  final String status;
  final String? notes;
  final String? ispPartnerId;
  final String? customerId;
  final String createdAt;
  final String updatedAt;
  final int dirty;
  final int deletedLocally;

  const PsbRow({
    required this.id,
    required this.customerName,
    this.nik,
    this.phone,
    required this.address,
    this.packageName,
    this.packagePrice = 0,
    this.fee = 0,
    this.installDate,
    this.cableDistance,
    this.wifiSsid,
    this.pppoeUser,
    this.wifiPassword,
    this.status = 'lead',
    this.notes,
    this.ispPartnerId,
    this.customerId,
    required this.createdAt,
    required this.updatedAt,
    this.dirty = 0,
    this.deletedLocally = 0,
  });

  factory PsbRow.fromMap(Map<String, Object?> m) => PsbRow(
        id: m['id'] as String,
        customerName: m['customer_name'] as String,
        nik: m['nik'] as String?,
        phone: m['phone'] as String?,
        address: m['address'] as String,
        packageName: m['package_name'] as String?,
        packagePrice: (m['package_price'] as int?) ?? 0,
        fee: (m['fee'] as int?) ?? 0,
        installDate: m['install_date'] as String?,
        cableDistance: m['cable_distance'] as String?,
        wifiSsid: m['wifi_ssid'] as String?,
        pppoeUser: m['pppoe_user'] as String?,
        wifiPassword: m['wifi_password'] as String?,
        status: (m['status'] as String?) ?? 'lead',
        notes: m['notes'] as String?,
        ispPartnerId: m['isp_partner_id'] as String?,
        customerId: m['customer_id'] as String?,
        createdAt: m['created_at'] as String,
        updatedAt: m['updated_at'] as String,
        dirty: (m['dirty'] as int?) ?? 0,
        deletedLocally: (m['deleted_locally'] as int?) ?? 0,
      );

  Map<String, Object?> toLocalMap() => {
        'id': id,
        'customer_name': customerName,
        'nik': nik,
        'phone': phone,
        'address': address,
        'package_name': packageName,
        'package_price': packagePrice,
        'fee': fee,
        'install_date': installDate,
        'cable_distance': cableDistance,
        'wifi_ssid': wifiSsid,
        'pppoe_user': pppoeUser,
        'wifi_password': wifiPassword,
        'status': status,
        'notes': notes,
        'isp_partner_id': ispPartnerId,
        'customer_id': customerId,
        'created_at': createdAt,
        'updated_at': updatedAt,
        'dirty': dirty,
        'deleted_locally': deletedLocally,
      };

  Map<String, dynamic> toRemoteMap() => {
        'id': id,
        'customer_name': customerName,
        'nik': nik,
        'phone': phone,
        'address': address,
        'package_name': packageName,
        'package_price': packagePrice,
        'fee': fee,
        'install_date': installDate,
        'cable_distance': cableDistance,
        'wifi_ssid': wifiSsid,
        'pppoe_user': pppoeUser,
        'wifi_password': wifiPassword,
        'status': status,
        'notes': notes,
        'isp_partner_id': ispPartnerId,
        'customer_id': customerId,
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  PsbRow copyWith({
    String? customerName,
    String? nik,
    String? phone,
    String? address,
    String? packageName,
    int? packagePrice,
    int? fee,
    String? installDate,
    String? cableDistance,
    String? wifiSsid,
    String? pppoeUser,
    String? wifiPassword,
    String? status,
    String? notes,
    String? ispPartnerId,
    String? customerId,
    String? updatedAt,
    int? dirty,
    int? deletedLocally,
    bool clearCustomerId = false,
  }) {
    return PsbRow(
      id: id,
      customerName: customerName ?? this.customerName,
      nik: nik ?? this.nik,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      packageName: packageName ?? this.packageName,
      packagePrice: packagePrice ?? this.packagePrice,
      fee: fee ?? this.fee,
      installDate: installDate ?? this.installDate,
      cableDistance: cableDistance ?? this.cableDistance,
      wifiSsid: wifiSsid ?? this.wifiSsid,
      pppoeUser: pppoeUser ?? this.pppoeUser,
      wifiPassword: wifiPassword ?? this.wifiPassword,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      ispPartnerId: ispPartnerId ?? this.ispPartnerId,
      customerId: clearCustomerId ? null : (customerId ?? this.customerId),
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      dirty: dirty ?? this.dirty,
      deletedLocally: deletedLocally ?? this.deletedLocally,
    );
  }
}

class FinanceRow {
  final String id;
  final String category;
  final String type;
  final int amount;
  final int amountTunai;
  final int amountTransfer;
  final String paymentMethod;
  final String description;
  final String? reference;
  final String occurredAt;
  final String inputAt;
  final String createdAt;
  final String updatedAt;
  final int dirty;
  final int deletedLocally;

  const FinanceRow({
    required this.id,
    required this.category,
    required this.type,
    required this.amount,
    this.amountTunai = 0,
    this.amountTransfer = 0,
    this.paymentMethod = 'tunai',
    required this.description,
    this.reference,
    required this.occurredAt,
    required this.inputAt,
    required this.createdAt,
    required this.updatedAt,
    this.dirty = 0,
    this.deletedLocally = 0,
  });

  factory FinanceRow.fromMap(Map<String, Object?> m) => FinanceRow(
        id: m['id'] as String,
        category: m['category'] as String,
        type: m['type'] as String,
        amount: (m['amount'] as int?) ?? 0,
        amountTunai: (m['amount_tunai'] as int?) ?? 0,
        amountTransfer: (m['amount_transfer'] as int?) ?? 0,
        paymentMethod: (m['payment_method'] as String?) ?? 'tunai',
        description: m['description'] as String,
        reference: m['reference'] as String?,
        occurredAt: m['occurred_at'] as String,
        inputAt: m['input_at'] as String,
        createdAt: m['created_at'] as String,
        updatedAt: m['updated_at'] as String,
        dirty: (m['dirty'] as int?) ?? 0,
        deletedLocally: (m['deleted_locally'] as int?) ?? 0,
      );

  Map<String, Object?> toLocalMap() => {
        'id': id,
        'category': category,
        'type': type,
        'amount': amount,
        'amount_tunai': amountTunai,
        'amount_transfer': amountTransfer,
        'payment_method': paymentMethod,
        'description': description,
        'reference': reference,
        'occurred_at': occurredAt,
        'input_at': inputAt,
        'created_at': createdAt,
        'updated_at': updatedAt,
        'dirty': dirty,
        'deleted_locally': deletedLocally,
      };

  Map<String, dynamic> toRemoteMap() => {
        'id': id,
        'category': category,
        'type': type,
        'amount': amount,
        'amount_tunai': amountTunai,
        'amount_transfer': amountTransfer,
        'payment_method': paymentMethod,
        'description': description,
        'reference': reference,
        'occurred_at': occurredAt,
        'input_at': inputAt,
        'created_at': createdAt,
        'updated_at': updatedAt,
      };

  FinanceRow copyWith({
    String? category,
    String? type,
    String? description,
    int? amount,
    int? amountTunai,
    int? amountTransfer,
    String? paymentMethod,
    String? reference,
    String? occurredAt,
    String? inputAt,
    String? updatedAt,
    int? dirty,
    int? deletedLocally,
  }) {
    return FinanceRow(
      id: id,
      category: category ?? this.category,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      amountTunai: amountTunai ?? this.amountTunai,
      amountTransfer: amountTransfer ?? this.amountTransfer,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      description: description ?? this.description,
      reference: reference ?? this.reference,
      occurredAt: occurredAt ?? this.occurredAt,
      inputAt: inputAt ?? this.inputAt,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      dirty: dirty ?? this.dirty,
      deletedLocally: deletedLocally ?? this.deletedLocally,
    );
  }
}

class ProfileRow {
  final String id;
  final String name;
  final String role;
  final String? email;

  const ProfileRow({
    required this.id,
    required this.name,
    required this.role,
    this.email,
  });
}
