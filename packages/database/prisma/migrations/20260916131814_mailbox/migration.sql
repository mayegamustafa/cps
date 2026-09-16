-- CreateEnum
CREATE TYPE "MailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MailThreadState" AS ENUM ('OPEN', 'ARCHIVED', 'SPAM', 'TRASH');

-- CreateTable
CREATE TABLE "mailboxes" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isCatchAll" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "signature" TEXT,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplySubject" TEXT,
    "autoReplyBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_threads" (
    "id" TEXT NOT NULL,
    "mailboxId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "participant" TEXT NOT NULL,
    "participantName" TEXT,
    "snippet" TEXT NOT NULL,
    "state" "MailThreadState" NOT NULL DEFAULT 'OPEN',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "direction" "MailDirection" NOT NULL,
    "messageId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fromName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "toEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "text" TEXT,
    "html" TEXT,
    "spamScore" DOUBLE PRECISION,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "headers" JSONB,
    "sizeBytes" INTEGER,
    "sentById" TEXT,
    "deliveryError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" TEXT,
    "storageKey" TEXT,
    "contentId" TEXT,
    "isInline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_address_key" ON "mailboxes"("address");

-- CreateIndex
CREATE INDEX "mailboxes_isActive_sortOrder_idx" ON "mailboxes"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "mail_threads_mailboxId_state_lastMessageAt_idx" ON "mail_threads"("mailboxId", "state", "lastMessageAt");

-- CreateIndex
CREATE INDEX "mail_threads_mailboxId_subjectKey_participant_idx" ON "mail_threads"("mailboxId", "subjectKey", "participant");

-- CreateIndex
CREATE INDEX "mail_threads_assignedToId_idx" ON "mail_threads"("assignedToId");

-- CreateIndex
CREATE INDEX "mail_threads_state_isRead_idx" ON "mail_threads"("state", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "mail_messages_messageId_key" ON "mail_messages"("messageId");

-- CreateIndex
CREATE INDEX "mail_messages_threadId_createdAt_idx" ON "mail_messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "mail_attachments_messageId_idx" ON "mail_attachments"("messageId");

-- AddForeignKey
ALTER TABLE "mail_threads" ADD CONSTRAINT "mail_threads_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_threads" ADD CONSTRAINT "mail_threads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "mail_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "mail_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
