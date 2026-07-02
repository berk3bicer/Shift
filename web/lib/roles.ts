// Rol yardımcıları — tek gerçek kaynak me.roles (string[]). Yönetici = Owner veya Manager;
// geri kalan (Staff) personel deneyimine düşer. Yönlendirme + guard bu ikili ayrıma dayanır.

// Owner/Manager mı? (yönetici paneline erişim). Staff bunların hiçbirinde değilse false.
export function isManager(roles: string[]): boolean {
  return roles.includes("Owner") || roles.includes("Manager");
}

// Login/kök sonrası kullanıcı hangi ana ekrana düşmeli?
// Yönetici → mevcut yönetici paneli; Staff → sade personel ana ekranı.
export function homePathFor(roles: string[]): string {
  return isManager(roles) ? "/dashboard" : "/today";
}
