import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOptionGroups,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
} from '../api/products.api';
import type {
  OptionGroupResponse,
  OptionValue,
  UpdateOptionGroupRequest,
  CreateOptionValueRequest,
  UpdateOptionValueRequest,
} from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import AdminDeleteDialog from '../components/admin/AdminDeleteDialog';
import { AdminEmpty, AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';

export default function AdminOptionGroupManagement() {
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<{ kind: 'group' | 'value'; id: number; name: string } | null>(null);
  const queryClient = useQueryClient();

  const [selectedGroup, setSelectedGroup] = useState<OptionGroupResponse | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFormData, setGroupFormData] = useState({ name: '' });
  const [newValueName, setNewValueName] = useState('');
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editingValueName, setEditingValueName] = useState('');

  // 옵션 그룹 목록 조회
  const { data: optionGroups = [], isLoading, error, refetch } = useQuery<OptionGroupResponse[]>({
    queryKey: ['optionGroups'],
    queryFn: getOptionGroups,
  });

  // 옵션 그룹 목록이 갱신되면 선택된 그룹 정보도 갱신
  useEffect(() => {
    if (selectedGroup && optionGroups.length > 0 && !isEditMode) {
      const updatedGroup = optionGroups.find((g) => g.id === selectedGroup.id);
      if (updatedGroup) {
        setSelectedGroup(updatedGroup);
        setGroupFormData({ 
          name: updatedGroup.name
        });
      }
    }
  }, [optionGroups, selectedGroup, isEditMode]);

  // 옵션 그룹 생성
  const createMutation = useMutation({
    mutationFn: createOptionGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setNotice('옵션 그룹이 생성되었습니다.');
      setIsCreateMode(false);
      setGroupFormData({ name: '' });
      setSelectedGroup(null);
    },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
  });

  // 옵션 그룹 수정
  const updateMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: UpdateOptionGroupRequest }) =>
      updateOptionGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setNotice('옵션 그룹이 수정되었습니다.');
      setIsEditMode(false);
    },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
  });

  // 옵션 값 추가
  const createValueMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: CreateOptionValueRequest }) =>
      createOptionValue(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setNewValueName('');
      setNotice('옵션 값이 추가되었습니다.');
    },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
  });

  // 옵션 값 수정
  const updateValueMutation = useMutation({
    mutationFn: ({ valueId, data }: { valueId: number; data: UpdateOptionValueRequest }) =>
      updateOptionValue(valueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setEditingValueId(null);
      setEditingValueName('');
      setNotice('옵션 값이 수정되었습니다.');
    },
    onError: () => { setNotice('저장에 실패했습니다. 입력 내용을 확인한 후 다시 시도해 주세요.'); },
  });

  // 옵션 그룹 선택
  const handleSelectGroup = (group: OptionGroupResponse) => {
    setSelectedGroup(group);
    setIsCreateMode(false);
    setIsEditMode(false);
      setGroupFormData({ 
        name: group.name
      });
    setNewValueName('');
    setEditingValueId(null);
    setEditingValueName('');
  };

  // 새 그룹 추가
  const handleNewGroup = () => {
    setIsCreateMode(true);
    setIsEditMode(true);
    setSelectedGroup(null);
    setGroupFormData({ name: '' });
    setNewValueName('');
    setEditingValueId(null);
    setEditingValueName('');
  };

  // 수정하기 버튼 클릭
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // 편집 전환으로 버튼 type이 바뀌어도 같은 클릭에서 저장하지 않는다.
    event.preventDefault();
    setIsEditMode(true);
  };

  // 그룹 저장
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupFormData.name.trim()) {
      setNotice('그룹 이름을 입력해주세요.');
      return;
    }

    if (isCreateMode) {
      createMutation.mutate({ 
        name: groupFormData.name
      });
    } else if (selectedGroup) {
      updateMutation.mutate({ 
        groupId: selectedGroup.id, 
        data: { 
          name: groupFormData.name
        }
      });
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = () => {
    if (!selectedGroup) return;

    if (selectedGroup.values && selectedGroup.values.length > 0) {
      setNotice('옵션 값이 있는 경우 삭제할 수 없습니다.');
      return;
    }

    setDeleting({ kind: 'group', id: selectedGroup.id, name: selectedGroup.name });
  };

  // 취소
  const handleCancel = () => {
    if (isCreateMode) {
      setIsCreateMode(false);
      setIsEditMode(false);
      setGroupFormData({ name: '' });
      setSelectedGroup(null);
    } else if (selectedGroup) {
      setIsEditMode(false);
      setGroupFormData({ 
        name: selectedGroup.name
      });
    }
    setNewValueName('');
    setEditingValueId(null);
    setEditingValueName('');
  };

  // 옵션 값 추가
  const handleAddValue = () => {
    if (!selectedGroup) {
      setNotice('옵션 그룹을 먼저 선택해주세요.');
      return;
    }

    if (!newValueName.trim()) {
      setNotice('옵션 값 이름을 입력해주세요.');
      return;
    }

    createValueMutation.mutate({
      groupId: selectedGroup.id,
      data: { name: newValueName.trim() },
    });
  };

  // 옵션 값 수정 시작
  const handleStartEditValue = (value: OptionValue) => {
    setEditingValueId(value.id);
    setEditingValueName(value.name);
  };

  // 옵션 값 수정 취소
  const handleCancelEditValue = () => {
    setEditingValueId(null);
    setEditingValueName('');
  };

  // 옵션 값 수정 저장
  const handleSaveValue = (valueId: number) => {
    if (!editingValueName.trim()) {
      setNotice('옵션 값 이름을 입력해주세요.');
      return;
    }

    updateValueMutation.mutate({
      valueId,
      data: { name: editingValueName.trim() },
    });
  };

  // 옵션 값 삭제
  const handleDeleteValue = (valueId: number, valueName: string) => {
    setDeleting({ kind: 'value', id: valueId, name: valueName });
  };

  // 검색 필터링
  const filteredGroups = optionGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const busy = createMutation.isPending || updateMutation.isPending || createValueMutation.isPending || updateValueMutation.isPending;
  return <AdminLayout title="옵션 그룹 관리" description="상품 옵션 그룹과 선택 가능한 값을 관리합니다.">
    {notice && <p role="status" className={adminPanel}>{notice}</p>}
    {isLoading ? <AdminLoading /> : error ? <AdminError title="옵션 그룹 조회 실패" retry={() => void refetch()} /> : <fieldset disabled={busy || !!deleting} className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">옵션 그룹</h2>
        <label className="block text-sm font-medium">그룹 검색<input className={adminInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></label>
        <ul className="space-y-2">{filteredGroups.map(group => <li key={group.id}><button type="button" className={`${adminControl} w-full !justify-start break-words ${selectedGroup?.id === group.id ? '!bg-brand-soft' : ''}`} aria-pressed={selectedGroup?.id === group.id} onClick={() => handleSelectGroup(group)}>{group.name}</button></li>)}</ul>
        {!filteredGroups.length && <p className="text-sm text-brand-muted">{optionGroups.length ? '검색 결과가 없습니다.' : '등록된 옵션 그룹이 없습니다.'}</p>}
        <button type="button" className={adminPrimary} onClick={handleNewGroup}>새 그룹 추가</button>
      </section>
      {selectedGroup || isCreateMode ? <section className={`${adminPanel} space-y-6`}><h2 className="break-words text-xl font-bold">{isCreateMode ? '옵션 그룹 등록' : selectedGroup?.name}</h2>
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <label className="block text-sm font-medium">그룹 이름 (필수)<input disabled={!isEditMode} className={adminInput} value={groupFormData.name} onChange={e => setGroupFormData({ name: e.target.value })} /></label>
          <div className="flex flex-wrap gap-2">{isEditMode ? <button type="submit" className={adminPrimary}>{busy ? '저장 중…' : '저장'}</button> : <button type="button" className={adminPrimary} onClick={handleEditClick}>그룹 수정</button>}<button type="button" className={adminControl} onClick={handleCancel}>취소</button></div>
        </form>
        {selectedGroup && !isCreateMode && <section className="space-y-4"><h3 className="text-lg font-bold">옵션 값 · {selectedGroup.values.length}개</h3>
          <ul className="space-y-3">{selectedGroup.values.map(value => <li key={value.id} className="flex min-w-0 flex-col gap-3 rounded-xl bg-stone-50 p-4 sm:flex-row sm:items-center dark:bg-stone-800">
            {editingValueId === value.id ? <><label className="min-w-0 flex-1 text-sm">옵션 값 수정<input className={adminInput} value={editingValueName} onChange={e => setEditingValueName(e.target.value)} /></label><div className="flex flex-wrap gap-2"><button className={adminPrimary} type="button" onClick={() => handleSaveValue(value.id)}>저장</button><button className={adminControl} type="button" onClick={handleCancelEditValue}>취소</button></div></> : <><span className="min-w-0 flex-1 break-words text-sm">{value.name}</span><div className="flex flex-wrap gap-2"><button className={adminControl} type="button" onClick={() => handleStartEditValue(value)}>수정</button><button className={`${adminControl} text-red-700`} type="button" onClick={() => handleDeleteValue(value.id, value.name)}>삭제</button></div></>}
          </li>)}</ul>
          <label className="block text-sm font-medium">추가할 옵션 값<input className={adminInput} value={newValueName} onChange={e => setNewValueName(e.target.value)} /></label><button className={adminControl} type="button" onClick={handleAddValue}>옵션 값 추가</button>
          <div><button className={`${adminControl} text-red-700`} type="button" disabled={!!selectedGroup.values.length} onClick={handleDeleteGroup}>그룹 삭제</button><p className="mt-3 text-xs text-brand-muted">옵션 값이 있는 그룹은 삭제할 수 없습니다.</p></div>
        </section>}
      </section> : <AdminEmpty title="옵션 그룹을 선택해 주세요." />}
    </fieldset>}
    {deleting && <AdminDeleteDialog name={deleting.name} run={() => deleting.kind === 'group' ? deleteOptionGroup(deleting.id) : deleteOptionValue(deleting.id)} refresh={async () => { const result = await refetch(); if (result.isError) throw new Error('refresh failed'); if (deleting.kind === 'group') { setSelectedGroup(null); setIsEditMode(false); } }} onClose={() => setDeleting(null)} />}
  </AdminLayout>;
}

