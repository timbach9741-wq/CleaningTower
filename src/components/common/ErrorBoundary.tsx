import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // ChunkLoadError 처리: 배포 후 이전 버전의 JS 청크를 불러오지 못할 때 자동 새로고침
    // iOS Safari 등 다양한 브라우저의 에러 메시지를 포괄하기 위해, 
    // 그리고 알 수 없는 렌더링 오류의 일시적 해소를 위해 1회 자동 새로고침을 시도합니다.
    const hasReloaded = sessionStorage.getItem('error_reloaded');
    
    if (!hasReloaded) {
      sessionStorage.setItem('error_reloaded', 'true');
      window.location.reload();
      return;
    }
  }

  public render() {
    if (this.state.hasError) {
      // 1회 새로고침 후에도 에러가 발생한 경우 폴백 UI 표시
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>
            앗, 일시적인 오류가 발생했습니다!
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            네트워크 연결이 불안정하거나 앱이 업데이트 되었습니다.<br/>
            새로고침 버튼을 눌러 다시 시도해주세요.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            새로고침 하기
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
