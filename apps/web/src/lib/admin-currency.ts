/**
 * Shared currency formatter for admin pages.
 * Uses XOF (FCFA) by default. Admin prices are stored as EUR cents
 * in the DB but displayed in the admin's active currency (XOF by default).
 *
 * For admin, we use a standalone utility (not the React context) since
 * admin pages already have their own local fmt() helpers that we can replace.
 *
 * EUR → XOF fixed rate: 1 EUR = 655.957 XOF
 */
export function fmtAdmin(amount: number, currency: 'XOF' | 'EUR' = 'XOF'): string {
  if (currency === 'XOF') {
    // DB is now in XOF, so amount is already XOF
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  // If showing EUR, convert from XOF to EUR
  const eur = amount / 655.957;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(eur);
}
