import axios from 'axios';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { sendAnimalChatbotMessage } from '../../api/animals.api';

interface AnimalChatbotProps {
  animalId: number;
  animalName: string;
}

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  provider?: string;
}

const MAX_QUESTION_LENGTH = 500;

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data as { message?: string; data?: { message?: string } } | undefined;
    const serverMessage = responseData?.message || responseData?.data?.message;

    if (status === 400) return serverMessage || '질문 내용을 다시 확인해주세요.';
    if (status === 429) return serverMessage || '질문이 잠시 많습니다. 잠시 후 다시 시도해주세요.';
    if (status && status >= 500) return '서버 응답이 원활하지 않습니다. 잠시 후 다시 시도해주세요.';

    return serverMessage || '답변 요청 중 오류가 발생했습니다.';
  }

  return '답변 요청 중 오류가 발생했습니다.';
};

export default function AnimalChatbot({ animalId, animalName }: AnimalChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [safetyNotice, setSafetyNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const animalIdRef = useRef(animalId);
  const requestIdRef = useRef(0);

  useEffect(() => {
    animalIdRef.current = animalId;
    requestIdRef.current += 1;
    setIsOpen(false);
    setSessionId(undefined);
    setMessages([]);
    setQuestion('');
    setSafetyNotice('');
    setErrorMessage('');
    setIsSending(false);
  }, [animalId]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSending) {
      return;
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      setErrorMessage(`질문은 ${MAX_QUESTION_LENGTH}자 이하로 입력해주세요.`);
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      text: trimmedQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setErrorMessage('');
    setIsSending(true);
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const response = await sendAnimalChatbotMessage(animalId, {
        sessionId,
        question: trimmedQuestion,
      });

      if (requestId !== requestIdRef.current || animalId !== animalIdRef.current) {
        return;
      }

      setSessionId(response.sessionId);
      setSafetyNotice(response.safetyNotice);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          text: response.answer,
          provider: response.provider,
        },
      ]);
    } catch (error) {
      if (requestId !== requestIdRef.current || animalId !== animalIdRef.current) {
        return;
      }

      setErrorMessage(getErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current && animalId === animalIdRef.current) {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex w-[calc(100%-2rem)] max-w-[380px] flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 flex h-[560px] max-h-[calc(100vh-7rem)] w-full flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark">
          <div className="flex items-start justify-between gap-3 bg-primary px-5 py-4 text-text-light">
            <div>
              <p className="text-sm font-bold">입양 상담 챗봇</p>
              <p className="mt-1 text-xs font-medium text-text-light/80">{animalName}에 대해 물어보세요</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-text-light hover:bg-white/20"
              aria-label="챗봇 닫기"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7fbf9] px-4 py-4 dark:bg-[#111816]">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-primary/20 bg-white p-4 text-sm text-text-light shadow-sm dark:border-primary/30 dark:bg-card-dark dark:text-text-dark">
                <p className="font-bold">무엇을 도와드릴까요?</p>
                <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-gray-300">
                  성격, 보호 상태, 입양 전 확인할 점처럼 상세 페이지를 보며 궁금한 내용을 질문해보세요.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-text-light'
                      : 'border border-border-light bg-white text-text-light dark:border-border-dark dark:bg-[#1b2421] dark:text-text-dark'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  {message.provider && (
                    <p className="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      provider: {message.provider}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border-light bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-border-dark dark:bg-[#1b2421] dark:text-gray-300">
                  답변을 준비하고 있습니다...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border-light bg-white p-4 dark:border-border-dark dark:bg-card-dark">
            {errorMessage && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {errorMessage}
              </p>
            )}

            {safetyNotice && (
              <p className="mb-2 rounded-lg bg-blue-50 px-3 py-2 text-[11px] leading-5 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {safetyNotice}
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={question}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                maxLength={MAX_QUESTION_LENGTH}
                placeholder="궁금한 점을 입력하세요"
                className="min-w-0 flex-1 rounded-xl border-border-light bg-white text-sm text-text-light placeholder:text-gray-400 focus:border-primary focus:ring-primary dark:border-border-dark dark:bg-[#111816] dark:text-text-dark"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !question.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-text-light transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="질문 보내기"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
            <p className="mt-2 text-right text-[11px] text-gray-500">
              {question.length}/{MAX_QUESTION_LENGTH}
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-bold text-text-light shadow-xl transition-transform hover:scale-[1.02] hover:bg-primary/90"
        aria-expanded={isOpen}
        aria-label={isOpen ? '입양 상담 챗봇 닫기' : '입양 상담 챗봇 열기'}
      >
        <span className="material-symbols-outlined">chat</span>
        <span className="text-sm">입양 상담</span>
      </button>
    </div>
  );
}
