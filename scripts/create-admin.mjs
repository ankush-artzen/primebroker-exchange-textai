import { randomBytes, scryptSync } from "crypto";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

loadEnvFile();

const asSuperadmin = process.argv[2] === "superadmin";
const envPrefix = asSuperadmin ? "SUPERADMIN" : "ADMIN";
const role = asSuperadmin ? "SUPERADMIN" : "ADMIN";
const username = process.env[`${envPrefix}_USERNAME`]?.trim().toLowerCase();
const password = process.env[`${envPrefix}_PASSWORD`] ?? "";
const name =
  process.env[`${envPrefix}_NAME`]?.trim() ||
  (asSuperadmin ? "Super Admin" : "Admin");

if (!username || username.length < 3) {
  console.error(`Set ${envPrefix}_USERNAME in .env (at least 3 characters).`);
  process.exit(1);
}

if (password.length < 8) {
  console.error(`Set ${envPrefix}_PASSWORD in .env (at least 8 characters).`);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { phone: null },
        u: { $unset: { phone: "" } },
        multi: true,
      },
    ],
  });

  try {
    await prisma.$runCommandRaw({
      dropIndexes: "User",
      index: "User_phone_key",
    });
  } catch {
    // Index may already be absent.
  }

  await prisma.$runCommandRaw({
    createIndexes: "User",
    indexes: [
      {
        key: { username: 1 },
        name: "User_username_key",
        unique: true,
        sparse: true,
      },
      {
        key: { phone: 1 },
        name: "User_phone_key",
        unique: true,
        sparse: true,
      },
    ],
  });

  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { $or: [{ role: { $exists: false } }, { role: null }] },
        u: { $set: { role: "USER" } },
        multi: true,
      },
    ],
  });

  await prisma.$runCommandRaw({
    update: "User",
    updates: [
      {
        q: { canAddUsers: { $exists: false } },
        u: { $set: { canAddUsers: false } },
        multi: true,
      },
      {
        q: { userLimit: { $exists: false } },
        u: { $set: { userLimit: 0 } },
        multi: true,
      },
    ],
  });

  const passwordHash = hashPassword(password);
  const existing = await prisma.user.findFirst({ where: { username } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, passwordHash, role },
      })
    : await prisma.user.create({
        data: { name, username, passwordHash, role, canAddUsers: false, userLimit: 0 },
      });

  if (!user.phone) {
    await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { _id: { $oid: user.id } },
          u: { $unset: { phone: "" } },
        },
      ],
    });
  }

  console.log(`${asSuperadmin ? "Superadmin" : "Admin"} ready: ${user.username}`);
} finally {
  await prisma.$disconnect();
}
