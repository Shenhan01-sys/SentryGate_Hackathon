import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(); // Biarkan kosong, Prisma 7 akan membaca config otomatis

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;