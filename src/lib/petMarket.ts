// Navigation visibility while the market is not publicly launched; not API authorization.
export function canSeePetMarket(role: string | null | undefined): boolean {
  return role === 'ROLE_ADMIN';
}
