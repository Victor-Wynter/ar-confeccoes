# AR Confecções de Uniformes

> Catálogo digital com reserva via WhatsApp para fabricante de uniformes de construção civil em São Paulo.

---

## Sobre o projeto

A **AR Confecções** fabrica calças de uniforme para construção civil e atende dois perfis de clientes: empresas que compram em lote e pessoas físicas que levam de 1 a 3 peças. O site resolve o problema de não ter uma vitrine profissional — hoje os pedidos chegam por indicação ou WhatsApp sem nenhum processo.

**O fluxo é simples:**
o cliente navega pelo catálogo → escolhe cor, tamanho e quantidade → clica em reservar → cai direto no WhatsApp do Amilton (dono) com os detalhes do pedido formatados. Sem carrinho, sem gateway de pagamento, sem cadastro obrigatório.

O admin (acesso restrito ao dono) gerencia reservas, estoque por variante e cadastro de produtos.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind v4 + shadcn/ui |
| Banco de dados | Neon Postgres (serverless) |
| ORM | Drizzle |
| Autenticação | Auth.js v5 (Credentials) |
| Storage de imagens | Vercel Blob |
| Deploy | Vercel |

---

## Funcionalidades do MVP

- **Catálogo público** — listagem de produtos com toggle Unidade / Lote
- **Página de produto** — galeria de imagens por cor, seletor de tamanho/cor/faixa refletiva, estoque em tempo real
- **Reserva** — formulário com nome e telefone; gera código `RES-XXXX` e link WhatsApp com resumo do pedido
- **Admin — Reservas** — lista, filtros por status, marcar como contatado/concluído/cancelado, badge de novas
- **Admin — Produtos** — CRUD de produtos, variantes (cor + tamanho + refletivo) e upload de imagens
- **Auth** — login admin com email/senha; sessão protegida por middleware

---

## Rodando localmente

**Pré-requisitos:** Node.js 20+, pnpm, banco Neon (ou Postgres local)

```bash
# 1. Clone e instale dependências
git clone https://github.com/Victor-Wynter/ar-confeccoes.git
cd ar-confeccoes
pnpm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local com suas credenciais

# 3. Rode as migrations
pnpm db:migrate

# 4. Crie o usuário admin (rode uma vez)
pnpm seed:admin

# 5. Suba o servidor
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) para o catálogo e [http://localhost:3000/admin](http://localhost:3000/admin) para o painel.

---

## Variáveis de ambiente

Veja [`.env.example`](.env.example) para a lista completa. As obrigatórias:

```env
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
AUTH_SECRET=
AUTH_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=   # formato: 5511999999999
```

---

## Scripts úteis

```bash
pnpm dev           # servidor de desenvolvimento
pnpm build         # build de produção
pnpm typecheck     # verifica tipos (rodar antes de commit)
pnpm lint          # eslint
pnpm db:generate   # gera SQL a partir do schema
pnpm db:migrate    # aplica migrations
pnpm db:studio     # GUI do Drizzle para debug
pnpm seed:admin    # cria/atualiza usuário admin
```

---

## Estrutura do projeto

```
app/(public)/    → catálogo e páginas de produto
app/(admin)/     → painel admin (protegido)
app/api/         → auth e upload de imagens
components/ui/   → componentes shadcn/ui
db/              → schema Drizzle, cliente, migrations
lib/             → validações Zod, helpers de formatação
scripts/         → seed do admin
```

---

*Projeto MVP — compra finalizada via WhatsApp. Gateway de pagamento fora do escopo por ora.*
