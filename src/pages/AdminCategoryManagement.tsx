import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/products.api';
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDeleteDialog from '../components/admin/AdminDeleteDialog';
import { AdminEmpty, AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';

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
          aria-current={isSelected ? 'true' : undefined}
          className={`flex cursor-pointer items-center justify-between min-h-11 gap-2 p-2 rounded-lg transition-colors ${
            isSelected
              ? 'bg-brand/10 border border-brand-focus'
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
          <div className="flex min-w-0 items-center gap-2">
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
            <span className="bg-white dark:bg-stone-800 border border-brand-border dark:border-stone-700 text-text-sub dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {category.children.length}
            </span>
          )}
        </summary>
        {hasChildren && (
          <div className="flex flex-col ml-5 border-l-2 border-brand-border dark:border-stone-700 pl-3 mt-1 gap-1">
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
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);
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
  const { data: categories = [], isLoading, error, refetch } = useQuery<CategoryResponse[]>({
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
  }, [categories, selectedCategory, isEditMode]);

  // 카테고리 생성
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNotice('카테고리가 생성되었습니다.');
      setIsCreateMode(false);
      setFormData({ name: '', description: '', parentId: null });
      setSelectedCategory(null);
    },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
  });

  // 카테고리 수정
  const updateMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: UpdateCategoryRequest }) =>
      updateCategory(categoryId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        setNotice('카테고리가 수정되었습니다.');
        setIsEditMode(false); // 수정 완료 후 readonly 모드로
        // 쿼리 재조회 후 선택된 카테고리 정보가 자동으로 갱신됨
      },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
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
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // 같은 DOM 버튼이 submit으로 바뀌어도 이번 클릭은 편집 전환만 수행한다.
    event.preventDefault();
    setIsEditMode(true);
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setNotice('카테고리 이름을 입력해주세요.');
      return;
    }

    if (isCreateMode) {
      createMutation.mutate(formData);
    } else if (selectedCategory) {
      // 순환 참조 체크
      const validation = canSetParent(selectedCategory.id, formData.parentId ?? null, categories);
      if (!validation.valid) {
        setNotice(validation.reason ?? '상위 카테고리를 확인해 주세요.');
        return;
      }
      updateMutation.mutate({ categoryId: selectedCategory.id, data: formData });
    }
  };

  // 삭제 확인 및 실행
  const handleDelete = () => {
    if (!selectedCategory) return;

    if (selectedCategory.children && selectedCategory.children.length > 0) {
      setNotice('하위 카테고리가 있는 경우 삭제할 수 없습니다.');
      return;
    }

    setDeleting(selectedCategory);
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

  const busy = createMutation.isPending || updateMutation.isPending;
  return <AdminLayout title="카테고리 관리" description="상품 분류를 만들고 상하위 관계를 관리합니다.">
    {notice && <p role="status" className={adminPanel}>{notice}</p>}
    {isLoading ? <AdminLoading /> : error ? <AdminError title="카테고리 조회 실패" retry={() => void refetch()} /> : <fieldset disabled={busy || !!deleting} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">카테고리</h2>
        {!categories.length ? <p className="text-sm text-brand-muted">등록된 카테고리가 없습니다.</p> : categories.map(category => <CategoryTreeNode key={category.id} category={category} selectedId={selectedCategory?.id ?? null} onSelect={handleSelectCategory} />)}
        <button type="button" className={adminPrimary} onClick={handleNewCategory}>새 카테고리</button>
      </section>
      {selectedCategory || isCreateMode ? <section className={`${adminPanel} space-y-4`}><h2 className="break-words text-xl font-bold">{isCreateMode ? '카테고리 등록' : selectedCategory?.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4"><fieldset disabled={!isEditMode || busy} className="space-y-4">
          <label className="block text-sm font-medium">카테고리 이름 (필수)<input className={adminInput} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></label>
          <label className="block text-sm font-medium">상위 카테고리<select className={adminInput} value={formData.parentId ?? ''} onChange={e => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}>{parentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="block text-sm font-medium">설명<textarea className={`${adminInput} min-h-32 resize-y`} value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} /></label>
        </fieldset>
        <div className="flex flex-wrap gap-2">{isEditMode ? <button type="submit" className={adminPrimary}>{busy ? '저장 중…' : '저장'}</button> : <button type="button" className={adminPrimary} onClick={handleEditClick}>수정하기</button>}<button type="button" className={adminControl} onClick={handleCancel}>취소</button>
          {!isCreateMode && <button type="button" className={`${adminControl} text-red-700`} disabled={!!selectedCategory?.children?.length} onClick={handleDelete}>삭제</button>}
        </div>
        {!!selectedCategory?.children?.length && <p className="text-xs text-brand-muted">하위 카테고리가 있는 분류는 삭제할 수 없습니다.</p>}
        </form>
      </section> : <AdminEmpty title="카테고리를 선택해 주세요." />}
    </fieldset>}
    {deleting && <AdminDeleteDialog name={deleting.name} run={() => deleteCategory(deleting.id)} refresh={async () => { const result = await refetch(); if (result.isError) throw new Error('refresh failed'); setSelectedCategory(null); setIsEditMode(false); }} onClose={() => setDeleting(null)} />}
  </AdminLayout>;
}

