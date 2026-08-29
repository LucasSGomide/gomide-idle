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
    EMAIL_TAKEN: 'Esse endereço já tem uma conta. Entre em vez disso.',
    INVALID_CREDENTIALS:
      'E-mail ou senha incorretos. Verifique os dois e tente novamente.',
    TOO_MANY_ATTEMPTS:
      'Tentativas demais. Aguarde um momento e tente novamente.',
    REGISTRATION_CLOSED:
      'Novas contas estão fechadas por enquanto. Entre se você já tiver uma.',
  },
  session: {
    // wireframe 07: the aria-live label while the session resolves.
    loading: 'Carregando sua conta.',
  },
  auth: {
    email: 'E-mail',
    password: 'Senha',
  },
  signIn: {
    title: 'Entrar',
    submit: 'Entrar',
    createLink: 'Ainda não tem conta? Criar uma',
  },
  signUp: {
    title: 'Criar conta',
    submit: 'Criar conta',
    emailHelper: 'Usado para entrar. Nunca enviamos e-mails.',
    passwordHelper: 'De 8 a 128 caracteres.',
    signInLink: 'Já tem uma conta? Entrar',
    closedTitle: 'Os cadastros estão fechados',
    closedBody:
      'Novas contas estão fechadas por enquanto. Entre se você já tiver uma.',
    closedCta: 'Entrar',
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
