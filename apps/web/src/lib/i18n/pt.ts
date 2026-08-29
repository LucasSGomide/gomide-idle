import type { en } from './en';

// stack-web.md rule 50: written `satisfies typeof en`, so a key present in
// English but missing or misspelled here fails type-check rather than falling
// back to an English string on a Portuguese screen without saying so.
export const pt = {
  topBar: {
    languageSwitcher: {
      label: 'Alterar idioma',
    },
    // wireframe 07: the signed-in account menu trigger and its sign-out row.
    account: 'Conta',
    signOut: 'Sair',
  },
  footer: {
    protocol: 'protocolo {{version}}',
    contentPack: 'pacote de conteúdo {{version}}',
    build: 'compilação {{id}}',
  },
  errors: {
    GENERIC: 'Algo deu errado. Recarregue para tentar novamente.',
    INTERNAL_ERROR:
      'Os detalhes da versão estão indisponíveis. Recarregue para tentar novamente.',
    VALIDATION_FAILED:
      'A solicitação foi rejeitada. Recarregue para tentar novamente.',
  },
  session: {
    // wireframe 07: the aria-live label while the session resolves.
    loading: 'Carregando sua conta.',
  },
  errorBoundary: {
    title: 'Esta seção não pôde ser carregada.',
    reload: 'Recarregar',
  },
  outOfDate: {
    title: 'Seu cliente está desatualizado.',
    body: 'Recarregue a página para continuar.',
    reload: 'Recarregar',
  },
} satisfies typeof en;
