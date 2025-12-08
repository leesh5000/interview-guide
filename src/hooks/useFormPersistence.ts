"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseFormPersistenceOptions<T> {
  key: string;
  initialData: T;
  storage?: "session" | "local";
}

export function useFormPersistence<T>({
  key,
  initialData,
  storage = "session",
}: UseFormPersistenceOptions<T>) {
  const storageKey = `form_${key}`;
  const isInitialized = useRef(false);

  // 초기값 설정: sessionStorage에서 불러오거나 initialData 사용
  const [formData, setFormData] = useState<T>(() => {
    // SSR에서는 initialData 반환
    if (typeof window === "undefined") {
      return initialData;
    }

    try {
      const storageApi = storage === "session" ? sessionStorage : localStorage;
      const saved = storageApi.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // initialData와 병합 (새 필드가 추가된 경우 대비)
        return { ...initialData, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load form data from storage:", e);
    }
    return initialData;
  });

  // 컴포넌트 마운트 시 스토리지에서 데이터 복원 (hydration 이후)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      const storageApi = storage === "session" ? sessionStorage : localStorage;
      const saved = storageApi.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData({ ...initialData, ...parsed });
      }
    } catch (e) {
      console.error("Failed to restore form data:", e);
    }
  }, [storageKey, storage, initialData]);

  // formData가 변경될 때마다 스토리지에 저장
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storageApi = storage === "session" ? sessionStorage : localStorage;
      storageApi.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to save form data to storage:", e);
    }
  }, [formData, storageKey, storage]);

  // 폼 데이터 업데이트 함수
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData((prev) => {
      if (typeof updates === "function") {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  // 스토리지에서 폼 데이터 삭제 (제출 성공 시 호출)
  const clearPersistedData = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const storageApi = storage === "session" ? sessionStorage : localStorage;
      storageApi.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to clear persisted form data:", e);
    }
  }, [storageKey, storage]);

  // 폼 데이터 초기화 (스토리지도 함께 초기화)
  const resetFormData = useCallback(() => {
    setFormData(initialData);
    clearPersistedData();
  }, [initialData, clearPersistedData]);

  return {
    formData,
    setFormData,
    updateFormData,
    clearPersistedData,
    resetFormData,
  };
}
