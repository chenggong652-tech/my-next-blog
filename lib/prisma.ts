import { PrismaClient } from '@prisma/client';

// 全局单例：整个项目只创建一个数据库连接实例
// 防止开发模式热更新时，不断创建新的 PrismaClient 导致警告
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
