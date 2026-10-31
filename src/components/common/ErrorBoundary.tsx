import { Component, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  fallback: ReactNode;
  // 이 값이 바뀌면 오류 상태를 지우고 children을 다시 그린다. 예: 주소 이동마다 바뀌는 location.key
  resetKey?: string;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  resetKey?: string;
};

// 아래 화면이 그리는 도중 오류를 던지면 흰 화면 대신 fallback을 보여 준다.
// 클릭·비동기 요청 안의 오류는 잡지 않는다(각 화면이 처리). 오류 내용은 React가 console.error로 남긴다.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) return { hasError: false, resetKey: props.resetKey };
    return null;
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
