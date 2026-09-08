enum AppRole { superAdmin, admin, teknisi }

AppRole parseRole(String? value) {
  switch (value) {
    case 'super_admin':
      return AppRole.superAdmin;
    case 'admin':
      return AppRole.admin;
    default:
      return AppRole.teknisi;
  }
}

String roleLabel(AppRole role) {
  switch (role) {
    case AppRole.superAdmin:
      return 'Super Admin';
    case AppRole.admin:
      return 'Admin';
    case AppRole.teknisi:
      return 'Teknisi';
  }
}

class Permissions {
  final AppRole role;
  final bool canMutatePsb;
  final bool canViewFinance;
  final bool canManageUsers;

  const Permissions({
    required this.role,
    required this.canMutatePsb,
    required this.canViewFinance,
    required this.canManageUsers,
  });

  factory Permissions.forRole(AppRole role) {
    return Permissions(
      role: role,
      canMutatePsb: role == AppRole.superAdmin || role == AppRole.teknisi,
      canViewFinance: role == AppRole.superAdmin || role == AppRole.admin,
      canManageUsers: role == AppRole.superAdmin,
    );
  }
}
