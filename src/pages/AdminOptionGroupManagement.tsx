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
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';

export default function AdminOptionGroupManagement() {
  const { user } = useAuthStore();
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
  const { data: optionGroups = [], isLoading, error } = useQuery<OptionGroupResponse[]>({
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
  }, [optionGroups, selectedGroup?.id, isEditMode]);

  // 옵션 그룹 생성
  const createMutation = useMutation({
    mutationFn: createOptionGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      alert('옵션 그룹이 생성되었습니다.');
      setIsCreateMode(false);
      setGroupFormData({ name: '' });
      setSelectedGroup(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 그룹 생성에 실패했습니다.');
    },
  });

  // 옵션 그룹 수정
  const updateMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: UpdateOptionGroupRequest }) =>
      updateOptionGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      alert('옵션 그룹이 수정되었습니다.');
      setIsEditMode(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 그룹 수정에 실패했습니다.');
    },
  });

  // 옵션 그룹 삭제
  const deleteMutation = useMutation({
    mutationFn: deleteOptionGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      alert('옵션 그룹이 삭제되었습니다.');
      setSelectedGroup(null);
      setGroupFormData({ name: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 그룹 삭제에 실패했습니다.');
    },
  });

  // 옵션 값 추가
  const createValueMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: number; data: CreateOptionValueRequest }) =>
      createOptionValue(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setNewValueName('');
      alert('옵션 값이 추가되었습니다.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 값 추가에 실패했습니다.');
    },
  });

  // 옵션 값 수정
  const updateValueMutation = useMutation({
    mutationFn: ({ valueId, data }: { valueId: number; data: UpdateOptionValueRequest }) =>
      updateOptionValue(valueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      setEditingValueId(null);
      setEditingValueName('');
      alert('옵션 값이 수정되었습니다.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 값 수정에 실패했습니다.');
    },
  });

  // 옵션 값 삭제
  const deleteValueMutation = useMutation({
    mutationFn: deleteOptionValue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optionGroups'] });
      alert('옵션 값이 삭제되었습니다.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || '옵션 값 삭제에 실패했습니다.');
    },
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
  const handleEditClick = () => {
    setIsEditMode(true);
  };

  // 그룹 저장
  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupFormData.name.trim()) {
      alert('그룹 이름을 입력해주세요.');
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
      alert('옵션 값이 있는 경우 삭제할 수 없습니다.');
      return;
    }

    if (confirm(`"${selectedGroup.name}" 옵션 그룹을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(selectedGroup.id);
    }
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
      alert('옵션 그룹을 먼저 선택해주세요.');
      return;
    }

    if (!newValueName.trim()) {
      alert('옵션 값 이름을 입력해주세요.');
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
      alert('옵션 값 이름을 입력해주세요.');
      return;
    }

    updateValueMutation.mutate({
      valueId,
      data: { name: editingValueName.trim() },
    });
  };

  // 옵션 값 삭제
  const handleDeleteValue = (valueId: number, valueName: string) => {
    if (confirm(`"${valueName}" 옵션 값을 삭제하시겠습니까?`)) {
      deleteValueMutation.mutate(valueId);
    }
  };

  // 검색 필터링
  const filteredGroups = optionGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-main dark:text-white">옵션 그룹 관리</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center w-64 h-10 rounded-lg bg-background-light dark:bg-gray-800 px-3 border border-transparent focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-text-secondary">search</span>
              <input
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-text-main dark:text-white placeholder:text-text-secondary focus:ring-0"
                placeholder="검색..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-text-main dark:text-white transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
              </button>
              <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div
                  className="size-8 rounded-full bg-cover bg-center border border-gray-200 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-full h-full flex items-center justify-center text-text-main font-bold text-xs">
                    {user?.name?.charAt(0) || '관'}
                  </div>
                </div>
                <span className="text-sm font-semibold text-text-main dark:text-white hidden lg:block">
                  {user?.name || '관리자'}님
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">옵션 그룹 관리</h1>
                <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                  상품 등록 시 사용되는 옵션 그룹을 관리합니다.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[20px]">download</span>
                내보내기
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] items-stretch">
              {/* 왼쪽: 옵션 그룹 목록 */}
              <section className="lg:col-span-4 flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full max-h-[calc(100vh-200px)] lg:h-auto">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark sticky top-0 z-10 flex-shrink-0">
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">search</span>
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border-none rounded-lg text-sm font-medium focus:ring-1 focus:ring-primary text-text-main dark:text-white placeholder-gray-400 transition-all"
                      placeholder="그룹 검색..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-500 text-sm p-4">옵션 그룹 목록을 불러오는데 실패했습니다.</div>
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-text-sub dark:text-gray-400 text-sm p-4">옵션 그룹이 없습니다.</div>
                  ) : (
                    filteredGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleSelectGroup(group)}
                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center group transition-all ${
                          selectedGroup?.id === group.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-transparent'
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm ${
                              selectedGroup?.id === group.id
                                ? 'font-bold text-text-main dark:text-white'
                                : 'font-medium text-text-main dark:text-gray-300 group-hover:text-primary dark:group-hover:text-primary'
                            }`}
                          >
                            {group.name}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">사용자 정의</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border shadow-sm ${
                              selectedGroup?.id === group.id
                                ? 'bg-white dark:bg-background-dark text-text-main dark:text-white border-gray-100 dark:border-gray-700'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-white dark:group-hover:bg-background-dark'
                            }`}
                          >
                            {group.values.length}
                          </span>
                          {selectedGroup?.id === group.id && (
                            <span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark/50 flex-shrink-0">
                  <button
                    onClick={handleNewGroup}
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-text-main text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20 active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    새 그룹 추가
                  </button>
                </div>
              </section>

              {/* 오른쪽: 옵션 그룹 상세 */}
              <section className="lg:col-span-8 flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden h-full">
                {isCreateMode || selectedGroup ? (
                  <>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start gap-6">
                      <form onSubmit={handleGroupSubmit} className="flex-1 w-full space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                            그룹 이름
                          </label>
                          <input
                            type="text"
                            value={groupFormData.name}
                            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                            readOnly={!isCreateMode && !isEditMode}
                            className={`w-full bg-transparent text-xl font-bold border-0 border-b-2 px-0 py-1.5 text-text-main dark:text-white transition-colors placeholder-gray-300 ${
                              !isCreateMode && !isEditMode
                                ? 'border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-0'
                            }`}
                            placeholder="그룹 이름을 입력하세요"
                            required
                          />
                        </div>
                      </form>
                      <div className="w-[120px] flex justify-end">
                        {!isCreateMode && selectedGroup && !isEditMode && (
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
                      {!isCreateMode && selectedGroup && (
                        <button
                          type="button"
                          onClick={handleDeleteGroup}
                          disabled={deleteMutation.isPending}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-semibold transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          그룹 삭제
                        </button>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="p-4 sm:px-6 sm:py-4 flex items-center justify-between">
                        <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">list</span>
                          옵션 값 관리
                        </h3>
                        {selectedGroup && (
                          <span className="text-xs font-bold bg-background-light dark:bg-background-dark px-3 py-1 rounded-full text-text-secondary border border-gray-100 dark:border-gray-700">
                            총 {selectedGroup.values.length}개 항목
                          </span>
                        )}
                      </div>

                      {selectedGroup && (
                        <>
                          <div className="px-4 sm:px-6 pb-4">
                            <div className="flex flex-col sm:flex-row items-end gap-3 bg-background-light dark:bg-background-dark p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                              <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-0.5">
                                  옵션 값 이름
                                </label>
                                <input
                                  type="text"
                                  value={newValueName}
                                  onChange={(e) => setNewValueName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddValue();
                                    }
                                  }}
                                  className="w-full h-10 rounded-md border-gray-200 dark:border-gray-600 dark:bg-surface-dark dark:text-white text-sm focus:border-primary focus:ring-primary/20 transition-shadow px-4"
                                  placeholder="예: 말티즈"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddValue}
                                disabled={createValueMutation.isPending}
                                className="w-full sm:w-auto h-10 px-5 bg-white dark:bg-surface-dark border border-primary text-primary hover:bg-primary hover:text-text-main text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                추가
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-auto px-4 sm:px-6 pb-4 custom-scrollbar">
                            {selectedGroup.values.length === 0 ? (
                              <div className="text-center py-8 text-text-sub dark:text-gray-400">
                                옵션 값이 없습니다. 위에서 추가해주세요.
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10 text-xs font-bold text-text-secondary uppercase">
                                  <tr>
                                    <th className="py-3 px-4 rounded-l-lg w-16 text-center">No.</th>
                                    <th className="py-3 px-4">값 이름</th>
                                    <th className="py-3 px-4 rounded-r-lg w-24 text-center">관리</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                  {selectedGroup.values.map((value, index) => (
                                    <tr key={value.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                      <td className="py-3 px-4 text-center text-text-secondary">{index + 1}</td>
                                      <td className="py-3 px-4">
                                        {editingValueId === value.id ? (
                                          <input
                                            type="text"
                                            value={editingValueName}
                                            onChange={(e) => setEditingValueName(e.target.value)}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSaveValue(value.id);
                                              }
                                              if (e.key === 'Escape') {
                                                handleCancelEditValue();
                                              }
                                            }}
                                            className="w-full bg-transparent border border-primary focus:ring-1 focus:ring-primary rounded py-1 px-2 text-text-main dark:text-gray-200 font-medium text-sm"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="text-text-main dark:text-gray-200 font-medium text-sm">{value.name}</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {editingValueId === value.id ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => handleSaveValue(value.id)}
                                                disabled={updateValueMutation.isPending}
                                                className="p-1 text-primary hover:bg-primary/10 transition-colors rounded"
                                                title="저장"
                                              >
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={handleCancelEditValue}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                title="취소"
                                              >
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => handleStartEditValue(value)}
                                                className="p-1 text-gray-400 hover:text-primary transition-colors"
                                                title="수정"
                                              >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteValue(value.id, value.name)}
                                                disabled={deleteValueMutation.isPending}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="삭제"
                                              >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {(isCreateMode || isEditMode) && (
                      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark/50 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleGroupSubmit}
                          disabled={createMutation.isPending || updateMutation.isPending}
                          className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-text-main font-bold text-sm rounded-lg transition-all shadow-md shadow-primary/20 flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">save</span>
                          저장하기
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-5 py-2.5 bg-white dark:bg-surface-dark border-2 border-gray-300 dark:border-gray-600 text-text-main dark:text-gray-300 font-bold text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-md"
                        >
                          변경 취소
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-400 mb-4">tune</span>
                      <p className="text-text-sub dark:text-gray-400">옵션 그룹을 선택하거나 새 그룹을 추가해주세요.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

