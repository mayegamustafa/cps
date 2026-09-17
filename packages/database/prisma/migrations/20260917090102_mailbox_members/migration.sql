-- CreateTable
CREATE TABLE "mailbox_members" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canSend" BOOLEAN NOT NULL DEFAULT true,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mailbox_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mailbox_members_userId_idx" ON "mailbox_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mailbox_members_mailboxId_userId_key" ON "mailbox_members"("mailboxId", "userId");

-- AddForeignKey
ALTER TABLE "mailbox_members" ADD CONSTRAINT "mailbox_members_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailbox_members" ADD CONSTRAINT "mailbox_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
