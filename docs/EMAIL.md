# School email in the portal

Real addresses on `cityparentsschool.co.ug`, delivered into `/admin/mailbox` and
answered from there. Unlimited addresses, created from a page, with one DNS
change made once.

## Why one DNS change is unavoidable

When anyone sends to `info@cityparentsschool.co.ug`, their mail server asks the
global DNS a single question: what are the MX records for that domain? Whatever
answers is where the message goes. Nothing else in the internet's mail routing
can be told to deliver somewhere. With no MX records, the message bounces back
to the sender.

So the MX record has to exist. Everything after it lives in this repo.

Good news for this domain: it already runs on Cloudflare nameservers
(`dara.ns.cloudflare.com`, `sonny.ns.cloudflare.com`), so Cloudflare account
access is enough. Registrar access is only needed to change nameservers, which
was already done. The domain also has no MX records today, so switching on Email
Routing cannot interrupt mail that already flows somewhere else.

## How the pieces fit

```
sender (anywhere)
    |  looks up MX for cityparentsschool.co.ug
    v
Cloudflare Email Routing
    |  runs the Email Worker
    v
Worker (docs/cloudflare-email-worker.js)
    |  parses MIME, POSTs JSON + x-mailbox-secret
    v
POST /api/mailbox/inbound   (apps/api/src/modules/mailbox)
    |  route to a Mailbox, match or open a MailThread, store attachments
    v
/admin/mailbox              (apps/web/src/components/admin/MailboxInbox.tsx)
    |  reply as the address the mail came to
    v
SMTP (Admin, Integrations)  ->  back to the sender, correctly threaded
```

## Setting it up

### 1. Generate the webhook secret

Admin, Mailbox, Setup, Generate secret. It is shown once. The portal rejects any
inbound call that does not present it.

### 2. Create the Cloudflare Worker

Cloudflare dashboard, Workers and Pages, Create, Start from Hello World. Replace
the code with the contents of `docs/cloudflare-email-worker.js` and deploy. It
has no npm dependencies, so it runs straight from the dashboard editor.

Then under the Worker's Settings, Variables and Secrets, add:

| Name | Value |
| --- | --- |
| `PORTAL_WEBHOOK_URL` | `https://<your-web-or-api-host>/api/mailbox/inbound` |
| `PORTAL_SECRET` | the secret from step 1 |

### 3. Turn on Email Routing

Cloudflare, the domain, Email, Email Routing. Enabling it writes the MX records
automatically, which is the one DNS change. Then under Routing rules, send each
address (or the catch-all) to the Worker.

### 4. Create the addresses

Admin, Mailbox, Addresses. Each address added here starts receiving immediately,
with no further Cloudflare or DNS work. Mark one as catch-all to collect mail
for addresses nobody has created yet.

### 5. Connect sending

Cloudflare Email Routing receives only; it cannot send. Replies leave through
the SMTP details under Admin, Integrations (any provider: Gmail/Workspace,
Zoho, Brevo, Postmark, SendGrid).

Until SMTP is set, a reply is still saved on the conversation and shown with the
reason it was not delivered, so nothing a staff member types is ever lost.

For replies to reach inboxes rather than spam folders, add the SPF and DKIM TXT
records your SMTP provider gives you, in the same Cloudflare DNS panel. This is
the only other DNS work, and it is also one-time.

There is only ever one SPF record on a domain. Cloudflare Email Routing writes
`v=spf1 include:_spf.mx.cloudflare.net ~all` when it is enabled, so the sending
provider's include is merged into that record rather than added as a second one.
Two SPF records make both fail.

### When SMTP times out

Hosting platforms routinely block outbound ports 587 and 465 to stop their
machines being used as spam relays, and Brevo silently drops connections from an
IP address that is not on its allow list when SMTP key restriction is on. Both
surface as "Connection timeout", which reads like a wrong password and sends
people hunting in the wrong place.

Two ways out, in order:

1. Paste a **Brevo API key** into Integrations. Mail then goes over HTTPS on port
   443, which is never blocked, and the host, port, username and password above
   it are ignored. This is the more reliable option on any PaaS.
2. Try port **2525**, which Brevo also listens on and which is blocked less often
   than 587.

Either way, IP restriction must be off in Brevo under Security, Authorized IPs.
Railway does not give a service a fixed outbound address on the default plan, so
there is nothing stable to authorize. The restriction exists separately for SMTP
keys and for API keys, so turn off whichever one the chosen route uses.

## Switching provider later

The webhook normalises Cloudflare (via the Worker), Postmark, SendGrid Inbound
Parse and Mailgun Routes into one shape, so moving provider means repointing MX
and the webhook URL. Nothing in the database or the admin screen changes.

| Provider | What to point at the webhook |
| --- | --- |
| Cloudflare Email Routing | the Worker in `docs/cloudflare-email-worker.js` |
| SendGrid Inbound Parse | MX to `mx.sendgrid.net`, POST URL set to the webhook |
| Mailgun Routes | MX to `mxa/mxb.mailgun.org`, route action `forward("<webhook>")` |
| Postmark inbound | MX to Postmark's inbound host, inbound webhook set to the URL |

Send the secret as the `x-mailbox-secret` header, or as `?secret=` on the URL
for providers that cannot set headers.

## How conversations are threaded

1. `In-Reply-To` and `References` are matched against stored Message-IDs. This is
   authoritative and handles the normal case.
2. When a client drops those headers (Outlook and several webmail clients do), a
   message with the same subject, from the same person, to the same mailbox,
   inside 180 days, joins the existing conversation.
3. Otherwise a new conversation is opened.

Replies sent from the portal carry a Message-ID owned by the school domain, so
when the parent replies again it threads back onto the same conversation.

A provider that retries after a timeout cannot double-deliver: Message-ID is
unique in the database, and a repeat returns the original message.

## Safety notes

- The webhook is guarded by a shared secret compared in constant time, and is
  rate limited separately from the rest of the API.
- Sender HTML is never rendered into the admin page. The plain-text body is
  shown by default; "Show original formatting" renders the HTML inside a
  sandboxed iframe with scripts disabled.
- Attachments go to the same storage as other uploads (Cloudinary, then R2).
  Anything over 15MB, or a storage failure, leaves the message intact with the
  file marked as not stored.
- A provider spam verdict files the conversation under Spam instead of Inbox.
- Auto-replies fire only on the first message of a conversation, so two
  auto-responders can never loop.

## Who can see which address

Access to an address is granted, never assumed. A staff member sees an address
only if a super admin has ticked them into it under Mailbox, Addresses.

| Who | Sees |
| --- | --- |
| Super admin | Every address, always |
| Staff ticked into an address | That address only |
| Staff with no addresses | Nothing at all |

Each member is either able to send from the address or limited to reading it.
Guessing a conversation id from another address returns the same "not found" as
a conversation that does not exist, so the mailbox list cannot be mapped out
from the outside.

Staff accounts are created under Staff and Access. An account with no role
ticked can use nothing but the Mailbox, which is the right shape for someone
who only answers email: their sidebar shows the Mailbox and their own profile
and nothing else.

A conversation can only be handed to someone who already has access to that
address, so it can never be assigned somewhere the assignee cannot open.

## Attachments

Files go out with a reply or a new message. Each one is uploaded to the school's
own storage first and sent as a URL, so a large file never travels through the
API as base64 and stays viewable on the conversation afterwards.

Uploads are capped at 20MB, since most receiving servers reject more than 25MB
for the whole message. A link can be attached instead of a file, which is the
better option for anything larger.

Attachment URLs must be https. They are handed to nodemailer as a `path`, which
also accepts local file paths, so without that restriction a crafted
`file:///etc/passwd` would attach a file off the server.

Outgoing attachments need file storage configured (Cloudinary or R2 under
Integrations). Without it the upload says so plainly rather than failing quietly.

## What is not built

- Inline images in sender HTML resolve as `cid:` references and will not display
  inside the sandboxed preview; the files are still listed as attachments.
- Rich text in replies. The body is plain text, wrapped in the school's styling
  when it goes out.
- Per-address signatures per staff member. The signature belongs to the address.
