# CLAUDE.md

Este projeto usa `AGENTS.md` como fonte única de instruções pra agentes de código (padrão aberto, compatível com Cursor, Aider, Codex, etc).

**Leia agora:** @AGENTS.md

E para o escopo/fases: @PLAN.md

---

## Por que este arquivo é curto

`CLAUDE.md` e `AGENTS.md` cumprem a mesma função em ferramentas diferentes. Manter dois arquivos longos e idênticos desincroniza rapidamente. A diretiva `@AGENTS.md` acima faz o Claude Code importar o conteúdo no contexto de cada sessão, então você tem o melhor dos dois mundos: padrão aberto + Claude Code lendo tudo.

Se precisar de instruções específicas SÓ pro Claude Code (que não façam sentido pra outros agentes), adicione abaixo desta linha. Caso contrário, tudo vai em `AGENTS.md`.

## Instruções específicas do Claude Code

(nenhuma por ora — tudo está em `AGENTS.md`)
