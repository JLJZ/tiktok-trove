import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("error" | "info" | "query" | "warn")[];
    errorFormat: "minimal";
}, "error" | "info" | "query" | "warn", import("@prisma/client/runtime/library").DefaultArgs>;
export declare const disconnectDatabase: () => Promise<void>;
