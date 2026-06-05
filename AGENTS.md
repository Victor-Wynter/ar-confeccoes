# AGENTS.md

Guia operacional para agentes de código (Claude Code, Cursor, Aider, Codex) trabalhando neste repositório.

**Antes de qualquer task, leia `PLAN.md`.** Ele contém o escopo, schema, fluxos e fases. Este arquivo é sobre *como* trabalhar, não *o que* construir.

## Sobre o projeto

E-commerce simples para a AR Confecções de Uniformes (fabricante de calças de uniforme para construção civil em SP). Catálogo público + admin + reservas. Compra via WhatsApp (sem gateway de pagamento no MVP).

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- **Banco:** Neon Postgres + Drizzle ORM
- **Auth:** Auth.js v5 (Credentials provider)
- **Storage:** Vercel Blob
- **Deploy:** Vercel

## Comandos

```bash
pnpm dev               # dev server (localhost:3000)
pnpm build             # build de produção (rodar antes de PR pra pegar erros TS)
pnpm lint              # eslint
pnpm typecheck         # tsc --noEmit (rodar sempre antes de commit)
pnpm db:generate       # gera SQL migration a partir do schema
pnpm db:migrate        # aplica migrations no banco apontado por DATABASE_URL
pnpm db:studio         # GUI do Drizzle (debug local)
pnpm seed:admin        # cria/atualiza usuário admin (lê ADMIN_EMAIL/ADMIN_PASSWORD)
```

Use `pnpm`, não npm ou yarn. Lockfile é `pnpm-lock.yaml`.

## Regras inegociáveis

1. **Server Components por padrão.** Só use `"use client"` quando precisar de hook, evento ou state. Se você está colocando "use client" em página inteira, parou de usar Next.js direito.
2. **Dinheiro em centavos como `integer`.** Nunca float, nunca decimal, nunca string. Conversão pra display só na borda (helper `formatBRL`).
3. **Server Actions pra mutação, Route Handlers só pra upload/webhook.** Não crie API route pra coisa que Server Action resolve.
4. **Validação com Zod em toda entrada do usuário.** Schemas em `lib/validations.ts`. Server Action SEM parse Zod é bug aberto.
5. **Nunca exponha `service_role` ou tokens no client.** Cliente Drizzle só em Server Components, Server Actions e Route Handlers.
6. **Sem `any`.** Use `unknown` + narrowing. Drizzle infere bem, aproveite.
7. **Não invente caminhos de import.** Aliases configurados: `@/db`, `@/lib`, `@/components`, `@/app`. Confira `tsconfig.json` antes.
8. **Imagem sempre via `next/image`.** Nunca `<img>` cru, mata o Lighthouse.

## Convenções de código

- **Arquivos:** kebab-case (`product-card.tsx`, `reservation-modal.tsx`)
- **Componentes:** PascalCase no export (`export function ProductCard`)
- **Hooks/utils:** camelCase (`useReservation`, `formatBRL`)
- **Tipos Drizzle:** sempre infira (`type Product = typeof products.$inferSelect`); não duplique em interface manual
- **Strings de UI:** PT-BR sempre. Sem i18n no MVP
- **Cores:** use CSS vars de `globals.css` (`bg-primary`, `text-accent`). Nunca hex hardcoded
- **Ícones:** `lucide-react` apenas (consistência)
- **Forms:** sempre React Hook Form + zodResolver. Não use FormData cru
- **Erros:** Server Action retorna `{ ok: true, data } | { ok: false, error }`. Não jogue exception pro client

## Estrutura de pastas (referência rápida)

```
app/(public)/   ← rotas públicas (catálogo)
app/(admin)/    ← rotas protegidas (/admin/*)
app/api/        ← upload, auth
db/             ← schema Drizzle, cliente
lib/            ← whatsapp.ts, format.ts, validations.ts, auth helpers
components/     ← shadcn/ui + componentes custom
```

Detalhes completos em `PLAN.md > Estrutura de pastas`.

## Workflow esperado

1. Leia `PLAN.md` na seção da fase atual
2. Faça mudanças pequenas e atômicas (1 commit = 1 conceito)
3. Antes de "concluído": `pnpm typecheck && pnpm lint && pnpm build`
4. Teste manualmente em desktop E em 375px (admin precisa funcionar no mobile do dono)
5. Migrations: rode local primeiro com `pnpm db:migrate`, confira no Studio, só depois commita

## O que NÃO fazer

Não adicione nada disto sem discussão explícita:

- Redux, Zustand, ou qualquer state global (Server Components + URL state bastam)
- Prisma (já decidido: Drizzle)
- Clerk, Lucia, NextAuth v4 (já decidido: Auth.js v5)
- Stripe, Mercado Pago, pix (fora do escopo MVP)
- i18n, dark mode, PWA, service worker
- Testes automatizados (débito técnico aceito pro MVP; valide produto primeiro)
- Componentes "genéricos" do tipo `<Button variant="..." size="..." color="...">` reinventando shadcn
- Animação Framer Motion fora da home (cliente B2B tem pressa, anime de menos)
- `localStorage` ou `sessionStorage` pra coisa que importa (não persistem entre dispositivos)

## Gotchas específicos deste projeto

- **Auth.js v5 está em beta.** Quando travar, vá no [exemplo oficial do GitHub](https://github.com/nextauthjs/next-auth), não Stack Overflow desatualizado.
- **Neon tem cold start de 1-2s** após 5min inativo. Esperado. Não tente "resolver" com workaround estranho — aceita pro MVP.
- **`@vercel/blob` + `sharp` na Vercel Hobby:** timeout de 10s. Limite upload no client a 8MB (`accept="image/*"` + check de `file.size`).
- **`wa.me` tem limite de ~2000 chars no parâmetro `text`.** Use helper `buildWhatsAppLink` de `lib/whatsapp.ts` (já implementa truncamento com fallback pro código RES-XXXX).
- **Drizzle migrations em produção:** rodar `db:migrate` manualmente antes do deploy. NÃO automatizar via `postbuild` — race condition se duas builds rodam juntas.
- **`reservations.items` é jsonb.** Drizzle tipa em TS, Postgres não valida. Use versionamento (`{ v: 1, data: [...] }`) desde o início pra não quebrar reservas antigas se o shape mudar.
- **Estoque é por `productVariants`, não `products`.** Combinação cor+tamanho+refletiva. Não tente colocar `stock` em `products`.

## Variáveis de ambiente

Veja `.env.example`. Em prod, configure na Vercel. Nunca commite `.env.local`.

Obrigatórias:
```
DATABASE_URL
BLOB_READ_WRITE_TOKEN
AUTH_SECRET                       # openssl rand -base64 32
AUTH_URL / NEXTAUTH_URL
NEXT_PUBLIC_WHATSAPP_NUMBER       # formato 5511999999999, sem +
```

Para seed inicial (usar uma vez, depois remover do .env):
```
ADMIN_EMAIL
ADMIN_PASSWORD
```

## Quando pedir confirmação ao humano

- Mudança de schema (qualquer `pgTable` novo, coluna nova, índice novo) → mostre o SQL gerado antes de aplicar
- Instalação de dependência nova → justifique por que não dá pra resolver com o que já tem
- Alteração em `auth.ts`, `middleware.ts` ou Server Actions de admin → segurança, peça revisão
- Qualquer arquivo em `app/(admin)/` que mexa em `reservations` → fluxo crítico do negócio

## Quando seguir sem perguntar

- Estilização, ajuste de Tailwind, microcopy
- Refatoração que não muda comportamento observável
- Novos componentes de UI seguindo padrão existente
- Correção de bug com causa óbvia

---

**Fonte de verdade do escopo:** `PLAN.md`. Se este arquivo conflitar com `PLAN.md` em alguma decisão de produto, `PLAN.md` ganha — e abra issue pra corrigir aqui.
