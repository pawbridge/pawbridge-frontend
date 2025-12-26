import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/products.api';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api.types';
import { useAuthStore } from '../store/authStore';
import CustomSelect from '../components/common/CustomSelect';

interface CategoryTreeNodeProps {
  category: CategoryResponse;
  selectedId: number | null;
  onSelect: (category: CategoryResponse) => void;
  level?: number;
}

function CategoryTreeNode({ category, selectedId, onSelect, level = 0 }: CategoryTreeNodeProps) {
  // 최상위 레벨(level 0)은 기본적으로 열려있고, 하위는 접혀있음
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
        <summary
          className={`flex cursor-pointer items-center justify-between gap-2 p-2 rounded-lg transition-colors ${
            isSelected
              ? 'bg-primary/10 border border-primary/20'
              : 'hover:bg-background-light dark:hover:bg-background-dark/50'
          }`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(category);
            // 하위 카테고리가 있는 경우에만 토글
            if (hasChildren) {
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <span
                className={`material-symbols-outlined text-text-sub dark:text-gray-400 transition-transform text-[20px] ${
                  isOpen ? 'rotate-90' : ''
                }`}
              >
                arrow_right
              </span>
            )}
            {!hasChildren && <span className="w-[20px]"></span>}
            <span
              className={`text-sm ${isSelected ? 'font-bold text-text-main dark:text-white' : 'font-medium text-text-main dark:text-gray-200'}`}
            >
              {category.name}
            </span>
          </div>
          {hasChildren && (
            <span className="bg-white dark:bg-[#203632] border border-[#dbe6e3] dark:border-[#2a3c38] text-text-sub dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {category.children.length}
            </span>
          )}
        </summary>
        {hasChildren && (
          <div className="flex flex-col ml-5 border-l-2 border-[#dbe6e3] dark:border-[#2a3c38] pl-3 mt-1 gap-1">
            {category.children.map((child) => (
              <CategoryTreeNode
                key={child.id}
                category={child}
                selectedId={selectedId}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </details>
    </div>
  );
}

// 모든 카테고리를 평면 배열로 변환 (상위 카테고리 선택 드롭다운용)
function flattenCategories(categories: CategoryResponse[], excludeId?: number): CategoryResponse[] {
  const result: CategoryResponse[] = [];
  
  function traverse(cats: CategoryResponse[]) {
    for (const cat of cats) {
      if (cat.id !== excludeId) {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children);
        }
      }
    }
  }
  
  traverse(categories);
  return result;
}

// 순환 참조 체크 (자기 자신이나 하위 카테고리를 부모로 지정할 수 없음)
function canSetParent(
  categoryId: number,
  parentId: number | null,
  allCategories: CategoryResponse[]
): { valid: boolean; reason?: string } {
  if (parentId === null) return { valid: true };
  if (categoryId === parentId) {
    return { valid: false, reason: '자기 자신을 부모로 지정할 수 없습니다.' };
  }

  // 하위 카테고리인지 확인
  function isDescendant(parentId: number, categoryId: number, categories: CategoryResponse[]): boolean {
    for (const cat of categories) {
      if (cat.id === parentId) {
        if (cat.children) {
          for (const child of cat.children) {
            if (child.id === categoryId) return true;
            if (isDescendant(child.id, categoryId, [child])) return true;
          }
        }
      }
      if (cat.children && cat.children.length > 0) {
        if (isDescendant(parentId, categoryId, cat.children)) return true;
      }
    }
    return false;
  }

  if (isDescendant(categoryId, parentId, allCategories)) {
    return { valid: false, reason: '자신의 하위 카테고리를 부모로 지정할 수 없습니다.' };
  }

  return { valid: true };
}

export default function AdminCategoryManagement() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    parentId: null,
  });

  // 카테고리 목록 조회
  const { data: categories = [], isLoading, error } = useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // 카테고리 목록이 갱신되면 선택된 카테고리 정보도 갱신
  useEffect(() => {
    if (selectedCategory && categories.length > 0 && !isEditMode) {
      const findCategory = (cats: CategoryResponse[], id: number): CategoryResponse | null => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children && cat.children.length > 0) {
            const found = findCategory(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const updatedCategory = findCategory(categories, selectedCategory.id);
      if (updatedCategory) {
        setSelectedCategory(updatedCategory);
        setFormData({
          name: updatedCategory.name,
          description: updatedCategory.description || '',
          parentId: updatedCategory.parentId,
        });
      }
    }
  }, [categories, selectedCategory?.id, isEditMode]);

  // 카테고리 생성
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert('카테고리가 생성되었습니다.');
      setIsCreateMode(false);
      setFormData({ name: '', description: '', parentId: null });
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '카테고리 생성에 실패했습니다.');
    },
  });

  // 카테고리 수정
  const updateMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: UpdateCategoryRequest }) =>
      updateCategory(categoryId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        alert('카테고리가 수정되었습니다.');
        setIsEditMode(false); // 수정 완료 후 readonly 모드로
        // 쿼리 재조회 후 선택된 카테고리 정보가 자동으로 갱신됨
      },
    onError: (error: any) => {
      alert(error.response?.data?.message || '카테고리 수정에 실패했습니다.');
    },
  });

  // 카테고리 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      alert('카테고리가 삭제되었습니다.');
      setSelectedCategory(null);
      setFormData({ name: '', description: '', parentId: null });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '카테고리 삭제에 실패했습니다.');
    },
  });

  // 카테고리 선택
  const handleSelectCategory = (category: CategoryResponse) => {
    setSelectedCategory(category);
    setIsCreateMode(false);
    setIsEditMode(false); // 선택 시 readonly 모드
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId,
    });
  };

  // 새 카테고리 버튼 클릭
  const handleNewCategory = () => {
    setIsCreateMode(true);
    setIsEditMode(true); // 등록 모드는 바로 편집 가능
    setSelectedCategory(null);
    setFormData({ name: '', description: '', parentId: null });
  };

  // 수정하기 버튼 클릭
  const handleEditClick = () => {
    setIsEditMode(true);
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    if (isCreateMode) {
      createMutation.mutate(formData);
    } else if (selectedCategory) {
      // 순환 참조 체크
      const validation = canSetParent(selectedCategory.id, formData.parentId, categories);
      if (!validation.valid) {
        alert(validation.reason);
        return;
      }
      updateMutation.mutate({ categoryId: selectedCategory.id, data: formData });
    }
  };

  // 삭제 확인 및 실행
  const handleDelete = () => {
    if (!selectedCategory) return;

    if (selectedCategory.children && selectedCategory.children.length > 0) {
      alert('하위 카테고리가 있는 경우 삭제할 수 없습니다.');
      return;
    }

    if (confirm(`"${selectedCategory.name}" 카테고리를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  // 취소
  const handleCancel = () => {
    if (isCreateMode) {
      // 등록 모드 취소
      setSelectedCategory(null);
      setIsCreateMode(false);
      setIsEditMode(false);
      setFormData({ name: '', description: '', parentId: null });
    } else if (selectedCategory) {
      // 수정 모드 취소 - 다시 readonly 모드로
      setIsEditMode(false);
      setFormData({
        name: selectedCategory.name,
        description: selectedCategory.description || '',
        parentId: selectedCategory.parentId,
      });
    }
  };


  // 상위 카테고리 선택 옵션 생성
  const parentOptions = [
    { value: '', label: '없음 (최상위)' },
    ...flattenCategories(categories, selectedCategory?.id).map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main font-sans min-h-screen flex overflow-hidden">
      {/* 사이드바 */}
      <aside className="w-64 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-r border-[#dbe6e3] dark:border-[#2a3c38] flex flex-col h-screen z-20">
        <div className="h-16 flex items-center px-6 border-b border-[#f0f5f3] dark:border-[#2a3c38]">
          <div className="flex items-center gap-3">
            <div className="size-8 text-primary flex items-center justify-center bg-background-dark rounded-lg">
              <span className="material-symbols-outlined text-[24px]">pets</span>
            </div>
            <h1 className="text-text-main dark:text-white text-lg font-extrabold tracking-tight">PawBridge</h1>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1 no-scrollbar">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors group"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-sm font-medium">대시보드</span>
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors group">
            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            <span className="text-sm font-medium">통계</span>
          </button>
          <div className="my-2 border-t border-[#f0f5f3] dark:border-[#2a3c38]"></div>
          <div className="px-3 pb-2 pt-1 text-xs font-bold text-text-sub/70 dark:text-gray-500 uppercase tracking-wider">
            운영 관리
          </div>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors group">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="text-sm font-medium">회원 관리</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors group">
            <span className="material-symbols-outlined text-[20px]">article</span>
            <span className="text-sm font-medium">게시글 관리</span>
          </button>
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-teal-900 dark:text-primary font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-primary dark:text-primary">category</span>
            <span className="text-sm">카테고리 관리</span>
          </Link>
          <div className="my-2 border-t border-[#f0f5f3] dark:border-[#2a3c38]"></div>
          <div className="px-3 pb-2 pt-1 text-xs font-bold text-text-sub/70 dark:text-gray-500 uppercase tracking-wider">
            쇼핑몰 관리
          </div>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                <span className="text-sm font-medium">상품 관리</span>
              </div>
              <span className="material-symbols-outlined text-[18px] group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="pl-10 pr-2 pb-1 mt-1 flex flex-col gap-1">
              <button className="block px-3 py-2 rounded-lg text-sm text-text-sub dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-background-light dark:hover:bg-background-dark/30 transition-colors text-left">
                상품 목록
              </button>
              <Link
                to="/products/new"
                className="block px-3 py-2 rounded-lg text-sm text-text-sub dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-background-light dark:hover:bg-background-dark/30 transition-colors"
              >
                상품 등록
              </Link>
            </div>
          </details>
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-text-sub dark:text-gray-400 hover:bg-background-light dark:hover:bg-background-dark/50 hover:text-text-main dark:hover:text-white transition-colors select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span className="text-sm font-medium">옵션 관리</span>
              </div>
              <span className="material-symbols-outlined text-[18px] group-open:rotate-180 transition-transform">
                expand_more
              </span>
            </summary>
            <div className="pl-10 pr-2 pb-1 mt-1 flex flex-col gap-1">
              <button className="block px-3 py-2 rounded-lg text-sm text-text-sub dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-background-light dark:hover:bg-background-dark/30 transition-colors text-left">
                옵션 그룹 관리
              </button>
              <button className="block px-3 py-2 rounded-lg text-sm text-text-sub dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-background-light dark:hover:bg-background-dark/30 transition-colors text-left">
                옵션 값 관리
              </button>
            </div>
          </details>
        </nav>
        <div className="p-4 border-t border-[#f0f5f3] dark:border-[#2a3c38]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark/50 cursor-pointer transition-colors">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-9 border border-primary/50 bg-primary/20 flex items-center justify-center"
            >
              <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xs">
                {user?.name?.charAt(0) || '관'}
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-text-main dark:text-white truncate">{user?.name || '관리자'}</span>
              <span className="text-xs text-text-sub dark:text-gray-400 truncate">{user?.email || 'admin@pawbridge.com'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* 헤더 */}
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-[#f0f5f3] dark:border-[#2a3c38] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-text-sub dark:text-gray-400">
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>/</span>
            <span>카테고리 관리</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-text-sub dark:text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-text-sub dark:text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 bg-background-light dark:bg-background-dark">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white mb-2">카테고리 관리</h1>
              <p className="text-text-sub dark:text-gray-400">
                유기동물 입양 및 쇼핑몰 서비스의 카테고리 구조를 설정하고 관리합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* 왼쪽: 카테고리 트리 구조 */}
              <section className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#dbe6e3] dark:border-[#2a3c38] shadow-sm p-5 flex flex-col min-h-[600px]">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#f0f5f3] dark:border-[#2a3c38]">
                    <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">account_tree</span>
                      카테고리 구조
                    </h3>
                    <button
                      onClick={handleNewCategory}
                      className="flex items-center justify-center gap-1 bg-primary text-background-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      새 카테고리
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 text-sm">카테고리 목록을 불러오는데 실패했습니다.</div>
                    ) : categories.length === 0 ? (
                      <div className="text-text-sub dark:text-gray-400 text-sm">카테고리가 없습니다.</div>
                    ) : (
                      categories.map((category) => (
                        <CategoryTreeNode
                          key={category.id}
                          category={category}
                          selectedId={selectedCategory?.id || null}
                          onSelect={handleSelectCategory}
                        />
                      ))
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#dbe6e3] dark:border-[#2a3c38] text-center">
                    <p className="text-xs text-text-sub dark:text-gray-500 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                      드래그 앤 드롭으로 순서 변경 가능
                    </p>
                  </div>
                </div>
              </section>

              {/* 오른쪽: 카테고리 수정 폼 */}
              <section className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-[#dbe6e3] dark:border-[#2a3c38] shadow-sm overflow-hidden flex flex-col flex-1">
                  <div className="p-6 border-b border-[#f0f5f3] dark:border-[#2a3c38] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[28px]">edit_note</span>
                      {isCreateMode ? '카테고리 등록' : selectedCategory ? '카테고리 상세' : '카테고리 수정'}
                    </h2>
                    <div className="w-[120px] flex justify-end">
                      {!isCreateMode && selectedCategory && !isEditMode && (
                        <button
                          type="button"
                          onClick={handleEditClick}
                          className="px-4 py-2 rounded-lg bg-primary hover:bg-[#0fd6a3] text-[#0f231e] text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          수정하기
                        </button>
                      )}
                    </div>
                  </div>
                  <form className="p-6 md:p-8 flex flex-col gap-6 flex-1" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-main dark:text-gray-200" htmlFor="cat-name">
                          카테고리 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="cat-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="카테고리 이름을 입력하세요"
                          readOnly={!isCreateMode && !isEditMode}
                          className={`w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a3c38] dark:bg-[#203632] dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-gray-400 ${
                            !isCreateMode && !isEditMode ? 'bg-gray-50 dark:bg-[#1a2e29] cursor-not-allowed' : ''
                          }`}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-text-main dark:text-gray-200" htmlFor="parent-cat">
                          상위 카테고리
                        </label>
                        <CustomSelect
                          value={formData.parentId || ''}
                          onChange={(value) => setFormData({ ...formData, parentId: value ? Number(value) : null })}
                          options={parentOptions}
                          placeholder="상위 카테고리 선택"
                          disabled={!isCreateMode && !isEditMode}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-text-main dark:text-gray-200" htmlFor="cat-desc">
                        설명
                      </label>
                        <textarea
                          id="cat-desc"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="카테고리에 대한 설명을 입력하세요..."
                          rows={4}
                          readOnly={!isCreateMode && !isEditMode}
                          className={`w-full rounded-lg border border-[#dbe6e3] dark:border-[#2a3c38] dark:bg-[#203632] dark:text-white px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all placeholder:text-gray-400 resize-none ${
                            !isCreateMode && !isEditMode ? 'bg-gray-50 dark:bg-[#1a2e29] cursor-not-allowed' : ''
                          }`}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#f0f5f3] dark:border-[#2a3c38] mt-auto">
                      {!isCreateMode && selectedCategory && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          삭제
                        </button>
                      )}
                      {isCreateMode && <div></div>}
                      {(!isCreateMode && !isEditMode) ? (
                        <div className="w-full sm:w-auto flex justify-end">
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2.5 rounded-lg border border-[#dbe6e3] dark:border-[#2a3c38] text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-[#203632] text-sm font-bold transition-all"
                          >
                            닫기
                          </button>
                        </div>
                      ) : (
                        <div className="w-full sm:w-auto flex gap-3 ml-auto">
                          <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 sm:flex-none px-8 py-2.5 rounded-lg bg-primary hover:bg-[#0fd6a3] text-[#0f231e] text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[20px]">check</span>
                            저장하기
                          </button>
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-[#dbe6e3] dark:border-[#2a3c38] text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-[#203632] text-sm font-bold transition-all"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex gap-4">
                  <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Tip: 카테고리 순서 변경</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      좌측 트리에서 항목을 드래그하여 순서를 변경하거나 상위 카테고리를 이동할 수 있습니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

