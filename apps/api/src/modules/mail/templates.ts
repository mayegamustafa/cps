/** Minimal branded HTML wrapper for transactional email. */
export function emailLayout(opts: { heading: string; body: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f3f4;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e0e1;">
      <tr><td style="background:#6e1f23;padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.02em;">City Parents School</span>
      </td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:20px;color:#6e1f23;">${opts.heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3a3a3a;">${opts.body}</div>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#faf8f8;border-top:1px solid #eee;color:#8a8a8a;font-size:12px;">
        This is an automated message from City Parents School. Please do not reply unless asked to.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function admissionReceivedEmail(p: { guardian: string; pupil: string; reference: string }) {
  return emailLayout({
    heading: 'We received your application',
    body: `<p>Dear ${escapeHtml(p.guardian)},</p>
      <p>Thank you for applying to City Parents School for <strong>${escapeHtml(p.pupil)}</strong>.
      Your application has been received and is now under review.</p>
      <p>Your tracking reference is:</p>
      <p style="font-size:22px;font-weight:bold;color:#6e1f23;letter-spacing:.05em;">${escapeHtml(p.reference)}</p>
      <p>Keep this reference safe — you can use it to track your application status at any time.</p>
      <p>Warm regards,<br/>The Admissions Office</p>`,
  });
}

export function admissionDecisionEmail(p: {
  guardian: string;
  pupil: string;
  reference: string;
  status: string;
  note?: string;
}) {
  const pretty = p.status.replace(/_/g, ' ').toLowerCase();
  return emailLayout({
    heading: `Update on your application (${p.reference})`,
    body: `<p>Dear ${escapeHtml(p.guardian)},</p>
      <p>There is an update on the application for <strong>${escapeHtml(p.pupil)}</strong>.</p>
      <p>New status: <strong style="text-transform:capitalize;">${escapeHtml(pretty)}</strong></p>
      ${p.note ? `<p style="background:#faf8f8;border-left:3px solid #6e1f23;padding:10px 14px;">${escapeHtml(p.note)}</p>` : ''}
      <p>You can track the latest status using your reference <strong>${escapeHtml(p.reference)}</strong>.</p>
      <p>Warm regards,<br/>The Admissions Office</p>`,
  });
}

export function contactReplyEmail(p: { name: string; original?: string; reply: string }) {
  return emailLayout({
    heading: 'Reply from City Parents School',
    body: `<p>Dear ${escapeHtml(p.name)},</p>
      <div>${p.reply.split('\n').map((l) => `<p>${escapeHtml(l)}</p>`).join('')}</div>
      ${p.original ? `<hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
        <p style="color:#8a8a8a;font-size:13px;">Your original message:</p>
        <p style="color:#8a8a8a;font-size:13px;white-space:pre-line;">${escapeHtml(p.original)}</p>` : ''}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
