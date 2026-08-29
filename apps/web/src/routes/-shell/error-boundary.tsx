import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorBlock } from './error-block';

// architecture-web.md rules 23, 27 / FR.16.5: a React error boundary so a
// broken subtree never renders as a blank page. TanStack Router's own
// `errorComponent` covers a route component that throws during render; this
// class catches the throws that happen outside that path (an event handler
// re-render, a child of the shell) and keeps the top bar and the footer — which
// sit outside it — on screen.
type Props = { children: ReactNode; fullWidth?: boolean };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Left deliberately quiet: architecture-web.md rule 27 renders from a
    // `code`, and a render crash has none. The block says what to do.
    void error;
    void info;
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorBlock fullWidth={this.props.fullWidth} />;
    }
    return this.props.children;
  }
}
