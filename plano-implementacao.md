---
title: "Plano de Implementação --- AR Confecções de Uniformes"
subtitle: "E-commerce com catálogo, reserva e admin"
author: "Plano técnico para Claude Code"
date: "Maio 2026"
geometry: margin=2cm
fontsize: 10pt
mainfont: "DejaVu Sans"
monofont: "DejaVu Sans Mono"
colorlinks: true
linkcolor: "[HTML]{185FA5}"
urlcolor: "[HTML]{185FA5}"
toccolor: "[HTML]{185FA5}"
toc: true
toc-depth: 3
numbersections: true
---

\newpage

# Contexto e objetivo

Site institucional + e-commerce simples para a **AR Confecções de Uniformes**, fabricante de calças de uniforme para construção civil em SP. Cliente final dividido entre empresas (lotes grandes) e pessoas físicas (1-3 peças).

**Fluxo de compra inicial:** todo pedido sai do site direto para o WhatsApp do dono (Amilton). Sem gateway de pagamento agora --- isso entra em fase futura.

**Diferencial de UX vs e-commerces de moda:** toggle "Unidade / Lote" na página de produto, permitindo que o mesmo template atenda os dois perfis sem virar dois sites.

# Decisões consolidadas

| Item | Decisão | Razão |
|------|---------|-------|
| Stack principal | Next.js 15 + TypeScript | SSR para SEO, deploy nativo Vercel |
| UI | Tailwind v4 + shadcn/ui | Componentes prontos, custom via CSS vars |
| Database | Neon Postgres | Free tier, serverless, escala bem |
| ORM | Drizzle | SQL-first, leve, edge-friendly |
| Storage | Vercel Blob | Integração nativa, free 1GB |
| Auth | Auth.js v5 (Credentials) | Padrão da indústria, 1 admin só |
| Imagens | sharp + next/image | Otimização obrigatória no upload |
| Animações | Framer Motion (uso comedido) | Só na home, sem scroll-jacking |
| Notificação reserva | Badge no admin | Sem email; WhatsApp só por escolha do cliente |
| Desconto por volume | Não | Preço fixo por unidade |
| Mínimo no lote | Sem mínimo | Apenas informa que é atacado |
| Múltiplos produtos | Catálogo desde já | 1 produto hoje, N depois sem refactor |
| Dark mode / i18n / PWA | Não | Fora do escopo MVP |

# Stack completa

```
Next.js 15 (App Router) + TypeScript
Tailwind v4 + shadcn/ui
Framer Motion
Drizzle ORM + @neondatabase/serverless
Auth.js v5 (Credentials provider, bcryptjs)
Vercel Blob
sharp
React Hook Form + Zod
lucide-react
clsx + tailwind-merge
```

**Por que Drizzle e não Prisma:** Prisma tem cold start ruim em serverless e binário pesado. Drizzle é SQL-first, tipado, sem engine separada. Casa perfeito com Neon serverless driver.

**Por que Auth.js v5 e não JWT na mão:** Auth.js v5 com Credentials provider são \~40 linhas de config e entregam session via cookie httpOnly, middleware pronto, CSRF protection. Implementar isso do zero é onde dev sênior ainda erra.

\newpage

# Schema do banco (Drizzle)

```typescript
// db/schema.ts
import {
  pgTable, serial, text, integer, boolean,
  timestamp, jsonb, uniqueIndex, index
} from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  specifications: jsonb('specifications').$type<
    { label: string; value: string }[]
  >(),
  // ex: [{label: "Composição", value: "90% poliéster, 10% algodão"}]
  basePrice: integer('base_price').notNull(), // centavos
  active: boolean('active').notNull().default(true),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariants = pgTable('product_variants', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  color: text('color').notNull(),
  colorHex: text('color_hex').notNull(),
  size: text('size').notNull(), // P, M, G, GG, EXG
  hasReflective: boolean('has_reflective').notNull(),
  stock: integer('stock').notNull().default(0),
  sku: text('sku').notNull().unique(),
}, (t) => ({
  uniqVariant: uniqueIndex('uniq_variant')
    .on(t.productId, t.color, t.size, t.hasReflective),
  productIdx: index('variants_product_idx').on(t.productId),
}));

export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  color: text('color'), // null = genérica; preenchida = específica da cor
  url: text('url').notNull(),
  alt: text('alt'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
});

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // RES-0001
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  items: jsonb('items').$type<Array<{
    variantId: number;
    productName: string;
    color: string;
    size: string;
    hasReflective: boolean;
    qty: number;
    unitPriceCents: number;
  }>>().notNull(),
  totalCents: integer('total_cents').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  // pending | contacted | fulfilled | cancelled
  viewed: boolean('viewed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Decisões justificadas no schema

- **`basePrice` em centavos como integer:** nunca use float/decimal pra dinheiro, principalmente em JS
- **`viewed` em reservations:** base do badge. Quando admin abre a lista, marca tudo como `viewed=true`
- **`productImages.color` opcional:** permite imagem genérica do produto OU imagem específica de cor. Resolve o caso de "mesma calça em 3 cores"
- **`specifications` como jsonb:** flexível, adiciona campo novo sem migration
- **`items` da reserva como jsonb:** **versionar com `{ v: 1, data: [...] }` desde o início** para não quebrar reservas antigas quando o shape mudar
- **`uniqueIndex` em variants:** impede duplicar variante com mesma combinação cor+tamanho+refletiva

\newpage

# Estrutura de pastas

```
app/
  (public)/
    layout.tsx              ← navbar + footer
    page.tsx                ← home
    produtos/
      page.tsx              ← listagem
      [slug]/
        page.tsx            ← detalhe (Server Component)
        product-config.tsx  ← toggle unidade/lote (Client)
        reservation-modal.tsx
    sobre/page.tsx
    contato/page.tsx
  (admin)/
    admin/
      layout.tsx            ← protege com auth
      page.tsx              ← dashboard
      login/page.tsx
      produtos/
        page.tsx
        novo/page.tsx
        [id]/page.tsx
      reservas/page.tsx
  api/
    upload/route.ts         ← recebe imagem, processa, sobe Blob
    auth/[...nextauth]/route.ts
db/
  schema.ts
  index.ts                  ← cliente Drizzle
  migrations/
lib/
  whatsapp.ts               ← gera link wa.me com truncamento
  format.ts                 ← formatBRL, formatPhone
  validations.ts            ← schemas Zod
middleware.ts               ← protege /admin/*
auth.ts                     ← config Auth.js v5
```

# Fluxo do botão "Reservar"

1. Usuário em variante sem estoque vê botão **"Reservar"** (laranja, não verde como o "Comprar")
2. Click abre modal com campos: nome, telefone (com mask BR), email (opcional), notas
3. Quantidades vêm pré-preenchidas do que ele escolheu na tela
4. Submit dispara Server Action que grava em `reservations` com `status='pending'`, `viewed=false`, e retorna code (`RES-0042`)
5. Modal mostra tela de sucesso: **"Reserva RES-0042 registrada. Quer falar com o Amilton no WhatsApp agora?"**
6. Dois botões: **"Falar no WhatsApp"** (verde) e **"Fechar"** (transparente)
7. Se clicar WhatsApp, abre `wa.me/...` com mensagem prefixada incluindo o código

**Por que esse fluxo:** a reserva fica registrada mesmo se o cliente não for pro WhatsApp. Quando ele for, o admin já tem contexto pelo código `RES-XXXX`. Sem isso, "reservar" seria só mais uma mensagem indistinguível das outras.

\newpage

# Geração do link WhatsApp (com truncamento)

```typescript
// lib/whatsapp.ts
const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER!;
const MAX_TEXT = 1800; // margem abaixo dos 2000 do wa.me

type Item = {
  productName: string;
  color: string;
  size: string;
  hasReflective: boolean;
  qty: number;
};

export function buildWhatsAppLink(params: {
  intent: 'purchase' | 'reservation';
  code?: string;
  items: Item[];
  totalBRL: string;
  customerName?: string;
}) {
  const header = params.intent === 'reservation'
    ? `Olá! Acabei de fazer uma reserva no site.\nCódigo: ${params.code}\n\n`
    : `Olá! Gostaria de comprar:\n\n`;

  const lines = params.items.map(i =>
    `• ${i.qty}x ${i.productName} ${i.color} ${i.size}` +
    `${i.hasReflective ? ' (c/ faixa)' : ''}`
  );

  const footer = `\nTotal estimado: ${params.totalBRL}` +
    `${params.customerName ? `\nMeu nome: ${params.customerName}` : ''}`;

  let body = header + lines.join('\n') + footer;

  if (body.length > MAX_TEXT) {
    const truncated = [header];
    let used = header.length + footer.length + 80;
    for (const line of lines) {
      if (used + line.length > MAX_TEXT) {
        const remaining = lines.length - truncated.length + 1;
        truncated.push(`(...e mais ${remaining} itens)`);
        break;
      }
      truncated.push(line);
      used += line.length;
    }
    const ref = params.code ?? 'me peço o código no atendimento';
    truncated.push(`\nPedido completo: ${ref}`);
    body = truncated.join('\n') + footer;
  }

  return `https://wa.me/${PHONE}?text=${encodeURIComponent(body)}`;
}
```

\newpage

# Fases de implementação

## Fase 0 --- Setup (2-3h)

```bash
pnpm create next-app@latest ar-uniformes \
  --typescript --tailwind --app --src-dir=false
```

Conta Neon, projeto novo, copiar `DATABASE_URL`. Conta Vercel, projeto importado do GitHub, criar Blob store, copiar `BLOB_READ_WRITE_TOKEN`.

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add next-auth@beta bcryptjs
pnpm add @vercel/blob sharp
pnpm add react-hook-form zod @hookform/resolvers
pnpm add framer-motion lucide-react clsx tailwind-merge
pnpm add -D drizzle-kit @types/bcryptjs
```

```bash
npx shadcn@latest init
```

CSS vars em `app/globals.css`:

```css
:root {
  --primary: 217 91% 35%;        /* azul AR */
  --primary-foreground: 0 0% 100%;
  --accent: 25 95% 53%;          /* laranja AR */
  --accent-foreground: 0 0% 100%;
}
```

`drizzle.config.ts` + scripts no `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Fase 1 --- DB + Auth admin (3-4h)

1. Criar `db/schema.ts` (ver seção Schema)
2. `pnpm db:generate && pnpm db:migrate`
3. Script `scripts/seed-admin.ts` que lê email/senha de env, hasheia com bcrypt, insere
4. Configurar `auth.ts` com Auth.js v5 Credentials provider
5. `middleware.ts` protege `/admin/*` (redireciona pra `/admin/login` sem sessão)
6. Tela `/admin/login` com form + Server Action chamando `signIn('credentials', ...)`
7. **Teste:** acessar `/admin` deslogado deve redirecionar; logar deve dar acesso

## Fase 2 --- Admin CRUD (4-6h)

**Ordem importante:** admin primeiro, público depois. Razão: sem admin, você não tem dados pra testar o público.

1. `/admin/produtos` --- tabela com lista, busca, toggle `active`
2. `/admin/produtos/novo` --- form: nome, slug (auto-gerado), descrição, preço, specifications (key-value dinâmico)
3. `/admin/produtos/[id]` --- três abas:
   - **Geral:** campos do produto
   - **Variantes:** matriz cor × tamanho × refletiva, estoque editável inline
   - **Imagens:** upload drag-and-drop, reorder, marcar como primária, associar a cor (opcional)
4. API route `/api/upload`:
   ```typescript
   import { put } from '@vercel/blob';
   import sharp from 'sharp';
   import { nanoid } from 'nanoid';

   const buffer = await file.arrayBuffer();
   const optimized = await sharp(Buffer.from(buffer))
     .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
     .webp({ quality: 85 })
     .toBuffer();
   const blob = await put(
     `products/${productId}/${nanoid()}.webp`,
     optimized,
     { access: 'public' }
   );
   // insere registro em productImages com blob.url
   ```
5. `/admin/reservas` --- lista filtrada por status, click expande detalhes, botões "Marcar como contatada / atendida / cancelar"
6. `/admin` dashboard --- cards: total reservas pendentes, produtos ativos, peças em estoque. **Badge no menu lateral em "Reservas" com contagem de `viewed=false`**
7. Ao entrar em `/admin/reservas`, faz UPDATE marcando tudo como `viewed=true`

**Mobile-first no admin desde o início.** Teste em 375px antes de seguir adiante.

## Fase 3 --- Catálogo público (3-4h)

1. `/produtos` --- Server Component busca produtos ativos + variante primária pra preço/imagem
2. Filtros via query params: cor, faixa refletiva
3. `<ProductCard>`: imagem (`next/image`), nome, preço "a partir de", badge **"Sem estoque"** se `sum(stock) = 0`
4. `/produtos/[slug]` --- Server Component busca produto + variantes + imagens
5. Passa pro Client Component `<ProductConfig>` o estado todo
6. `<ProductConfig>` implementa o mockup aprovado:
   - Galeria de imagens (estado filtra por cor selecionada)
   - Seletor de cor (swatch circular)
   - Toggle faixa refletiva (botão duplo)
   - **Toggle "Unidade / Lote" no topo**
   - Modo unidade: grid de tamanhos, estoque embaixo, botão Comprar/Reservar
   - Modo lote: tabela com input numérico por tamanho, total ao vivo, botão único
7. Tabela de especificações renderizada do jsonb `specifications`

## Fase 4 --- Reserva (2-3h)

1. `<ReservationModal>` (Client) usando shadcn `Dialog`
2. React Hook Form + Zod: nome (min 2), telefone (regex BR), email opcional, notas opcional
3. Server Action `createReservation`:
   - Gera código (`RES-` + id zero-padded para 4 dígitos)
   - Insere com `viewed: false`
   - Retorna `{ code, whatsappUrl }`
4. Após sucesso, modal vai pra tela 2: código grande, opção WhatsApp ou fechar
5. Link WhatsApp construído com `buildWhatsAppLink` (com truncamento)

## Fase 5 --- Home + páginas estáticas (3-4h)

1. **Hero:** imagem de fundo (calça da foto institucional), headline ("Uniformes que duram. Direto da fábrica."), 2 CTAs: "Ver calças" e "Falar no WhatsApp"
2. **Seção Destaques** --- produtos com `featured: true`
3. **Seção "Por que a AR"** --- 4 cards: Qualidade NBR, Faixa refletiva, Entrega SP, Atendimento direto
4. **Seção CTA atacado** --- "Precisa de uniforme em quantidade?" → WhatsApp
5. **Footer** com endereço do cartão, WhatsApp, Gmail, horário
6. Framer Motion **só aqui** e com moderação:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

Nada de scroll-jacking. Nada de hero animado de 5 segundos. Cliente B2B com pressa não tem paciência.

## Fase 6 --- SEO + perf + polimento (2-3h)

1. `generateMetadata` por produto (title, description, openGraph com imagem primária)
2. `app/sitemap.ts` dinâmico listando produtos ativos
3. `app/robots.ts` permitindo tudo exceto `/admin`
4. JSON-LD Schema.org `Product` em cada página de produto
5. **Lighthouse mobile:** mira 90+ em performance e SEO
6. Open Graph testar em opengraph.xyz
7. Favicon, manifest, apple-touch-icon

## Fase 7 --- Deploy (1h)

1. Push GitHub
2. Conectar Vercel ao repo
3. Env vars na Vercel: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`
4. Deploy. Subdomínio `.vercel.app` temporário
5. Quando comprar domínio: aponta DNS, SSL automático

**Total estimado:** 20-27 horas de trabalho focado. Em ritmo de fim de semana / noites: \~3 semanas.

\newpage

# Variáveis de ambiente

```env
# Banco
DATABASE_URL=postgresql://...neon.tech/...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Auth
AUTH_SECRET=        # gerar com: openssl rand -base64 32
AUTH_URL=http://localhost:3000     # em prod: https://seusite.com
NEXTAUTH_URL=http://localhost:3000

# WhatsApp do admin (sem +, com DDI 55)
NEXT_PUBLIC_WHATSAPP_NUMBER=5511991335307

# Seed inicial (usar uma vez e remover)
ADMIN_EMAIL=amilton@example.com
ADMIN_PASSWORD=     # senha forte, trocar depois do primeiro login
```

# Os 5 riscos que vão te atrasar

1. **Auth.js v5 ainda está em beta** (na data deste plano). Documentação às vezes desatualizada. Quando travar, vá direto ao código fonte do exemplo oficial, não Stack Overflow.

2. **Drizzle migrations em produção:** rode `migrate` manualmente antes do deploy. Não automatize via build, dá race condition se duas builds rodarem juntas.

3. **Neon cold start de 1-2s** vai aparecer no primeiro acesso após inatividade. Aceitável pra MVP. Quando incomodar, ative "Always-on" (pago) ou um warm-up cron.

4. **Upload de imagem com sharp na Vercel:** funciona, mas tem limite de tempo no Hobby plan (10s). Se for processar imagem gigante, pode dar timeout. Limite o input no client antes: `accept="image/*"` + check de tamanho ≤ 8MB.

5. **Tipo do `items` da reserva (jsonb):** Drizzle tipa em TS, mas Postgres não valida. Se você mudar shape depois, reservas antigas quebram o painel. Solução: versionar com `items: { v: 1, data: [...] }` desde o início.

# O que NÃO fazer no MVP

- Não criar carrinho. Pedido sai direto do produto → WhatsApp
- Não implementar busca textual. Com 1-5 produtos, filtro por cor/faixa basta
- Não fazer i18n. Site é PT-BR fixo
- Não fazer dark mode. Cliente uniforme não pede. Energia em outro lugar
- Não implementar PWA, push notification ou service worker
- Não fazer testes automatizados antes do MVP no ar. Aceita o débito técnico, valida o produto primeiro

# Limites do tier gratuito

| Serviço | Free tier | Aviso |
|---------|-----------|-------|
| Vercel Hobby | 100GB bandwidth/mês | Imagens via `next/image` cacheiam no CDN |
| Vercel Blob | 1GB storage, 10GB bandwidth/mês | \~5.000 pageviews/mês se cada um carrega 2MB |
| Neon | 0.5GB storage, autosuspend 5min | Cold start 1-2s; suficiente para o volume |
| Auth.js | Gratuito sem limite | Self-hosted |

Para o volume esperado (1 produto, dezenas de visitas/dia inicialmente), o tier gratuito atende. **Bandwidth de imagens é o primeiro a estourar** se o site bombar.

# Próximos passos imediatos

1. Criar repo no GitHub
2. Executar Fase 0 e Fase 1
3. Quando admin estiver autenticado, partir para Fase 2 (CRUD de produtos)
4. Validar upload e otimização de imagens antes de seguir
5. Só depois implementar o público (Fases 3-5)

Esse ordem garante que cada peça subsequente seja testável.
