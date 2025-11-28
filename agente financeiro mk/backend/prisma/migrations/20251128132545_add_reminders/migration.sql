-- CreateTable
CREATE TABLE "ReminderConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "diasAntesVencimento" TEXT NOT NULL,
    "telefoneDestino" TEXT NOT NULL,
    "emailDestino" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "enviarEmail" BOOLEAN NOT NULL DEFAULT true,
    "fazerLigacao" BOOLEAN NOT NULL DEFAULT true,
    "horarioLigacao" TEXT NOT NULL DEFAULT '09:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionId" INTEGER,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensagem" TEXT,
    "erro" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
