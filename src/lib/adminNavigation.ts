export const adminNavigation = [
  { label: '운영', items: [
    { label: '대시보드', path: '/admin/dashboard' },
    { label: '통계', path: '/admin/statistics' },
    { label: '회원 관리', path: '/admin/users' },
  ] },
  { label: '보호소 관리', items: [
    { label: '보호소 목록', path: '/admin/shelters' },
    { label: '담당자 신청', path: '/admin/shelter-applications' },
  ] },
  { label: '커뮤니티 관리', items: [{ label: '게시글 관리', path: '/admin/posts' }] },
  { label: '펫마켓', items: [
    { label: '상품 목록', path: '/admin/products' },
    { label: '상품 등록', path: '/products/new' },
    { label: '주문 관리', path: '/admin/orders' },
    { label: '카테고리 관리', path: '/admin/categories' },
    { label: '옵션 그룹 관리', path: '/admin/option-groups' },
  ] },
];

export function currentAdminPath(pathname: string): string | undefined {
  return adminNavigation.flatMap(group => group.items)
    .find(item => pathname === item.path || pathname.startsWith(`${item.path}/`))?.path;
}

export function adminSection(pathname: string): string {
  const current = currentAdminPath(pathname);
  return adminNavigation.find(group => group.items.some(item => item.path === current))?.label ?? '운영';
}
