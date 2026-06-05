import { config } from "dotenv";

config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { adminUsers } from "../db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env.local antes de rodar o seed.",
    );
    process.exit(1);
  }

  // Importado dinamicamente para garantir que o .env.local já foi carregado
  // (db/index.ts lê DATABASE_URL no topo do módulo).
  const { db } = await import("../db");
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (existing) {
    await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.email, email));
    console.log(`Admin atualizado: ${email}`);
  } else {
    await db.insert(adminUsers).values({ email, passwordHash });
    console.log(`Admin criado: ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
