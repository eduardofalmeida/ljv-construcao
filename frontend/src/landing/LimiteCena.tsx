import { Component, type ReactNode } from 'react'

export default class LimiteCena extends Component<{ children: ReactNode; fallback: ReactNode }, { erro: boolean }> {
  state = { erro: false }
  static getDerivedStateFromError() {
    return { erro: true }
  }
  componentDidCatch(erro: Error) {
    document.querySelector('.lp')?.setAttribute('data-erro', (erro?.message || 'falha na cena').slice(0, 220))
  }
  render() {
    return this.state.erro ? this.props.fallback : this.props.children
  }
}
