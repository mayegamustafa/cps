/**
 * Builds the copy a parent prints after applying online and carries to the
 * school for the interview.
 *
 * It is laid out as the school's paper "New Pupil's Application Form" so the
 * office receives something they already recognise: the answers given online
 * are printed in place, and every line the online form does not ask for stays a
 * ruled blank to be completed by hand on the day.
 *
 * Pure string building on purpose — no DOM — so the sheet can be rendered and
 * checked without opening a print dialog.
 */

export type AdmissionPrintData = {
  reference: string;
  submittedAt: Date;
  values: Record<string, string>;
};

export type SchoolInfo = {
  name: string;
  poBox: string;
  city: string;
  phone: string;
  email: string;
  motto?: string;
  /** Absolute URL — the print window is about:blank, so relative paths break. */
  logoUrl?: string;
};

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A filled value, or a ruled line to write on.
 *
 * `wide` is for rows that hold a single answer; the default width has to stay
 * modest so a row carrying three of them (date of birth, age, gender) still
 * fits across the sheet instead of wrapping.
 */
function slot(value: string | undefined, wide = false): string {
  const v = (value ?? '').trim();
  return v ? `<span class="v">${esc(v)}</span>` : `<span class="blank${wide ? ' wide' : ''}"></span>`;
}

function age(dob: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years -= 1;
  return years >= 0 ? String(years) : '';
}

function longDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

export type PrintoutOptions = {
  /**
   * Print the fee amounts in the closing note. The copy a parent gets after
   * applying online says what to bring and what it costs; the blank form
   * offered on the Downloads page deliberately carries no figures, so nothing
   * on paper can go out of date or contradict the admissions office.
   */
  includeFees?: boolean;
};

export function buildAdmissionPrintout(
  data: AdmissionPrintData,
  school: SchoolInfo,
  options: PrintoutOptions = {},
): string {
  const { includeFees = true } = options;
  // No reference means this is a blank form, not a record of a submission.
  const isBlank = !data.reference;
  const v = data.values;
  const dob = v.pupilDob ?? '';
  const dobText = dob ? longDate(new Date(dob)) : '';

  const sibling = [v.siblingName, v.siblingClass].filter(Boolean).join(', ');

  return `<!doctype html><html><head><meta charset="utf-8">
<title>Application Form: ${esc(v.pupilFirstName ?? '')} ${esc(v.pupilLastName ?? '')}</title>
<style>
  /* Tuned to land the whole form — including the interview note — on ONE A4
     sheet, so a parent is not asked to print two pages. */
  @page{size:A4;margin:10mm;}
  *{box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:11px;margin:0;line-height:1.34;}
  .head{display:flex;align-items:center;gap:12px;border-bottom:3px double #111;padding-bottom:6px;}
  .crest{width:52px;height:52px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;}
  .crest img{max-width:100%;max-height:100%;}
  .crest .fallback{width:48px;height:48px;border:2px solid #6e1f23;border-radius:50%;display:flex;
    align-items:center;justify-content:center;color:#6e1f23;font-weight:bold;font-size:14px;}
  .head .t{flex:1;text-align:center;}
  .school{font-size:19px;font-weight:bold;letter-spacing:.02em;}
  .sub{font-size:10.5px;}
  .motto{font-style:italic;font-size:10px;}
  h1{text-align:center;font-size:12.5px;text-transform:uppercase;text-decoration:underline;
     margin:9px 0 7px;letter-spacing:.03em;}
  .row{margin:1px 0;}
  .v{font-weight:bold;border-bottom:1px dotted #444;padding:0 4px;}
  .blank{display:inline-block;min-width:130px;border-bottom:1px dotted #777;height:11px;}
  .blank.wide{min-width:330px;}
  .grow{min-width:220px;}
  h2{font-size:11px;margin:7px 0 2px;font-weight:bold;}
  .indent{padding-left:15px;}
  .note{margin-top:9px;border:1px solid #6e1f23;padding:7px 10px;background:#faf6f6;}
  .note h3{color:#6e1f23;font-size:11px;margin:0 0 3px;text-transform:uppercase;letter-spacing:.05em;}
  .note ul{margin:2px 0 0;padding-left:16px;}
  .note li{margin:0;}
  .ref{display:flex;justify-content:space-between;gap:12px;border:1px solid #999;
     padding:4px 9px;margin:7px 0;background:#f6f6f6;font-size:10.5px;}
  .ref b{font-family:"Courier New",monospace;}
  .sign{margin-top:9px;}
  footer{margin-top:8px;border-top:1px solid #ccc;padding-top:4px;color:#666;font-size:9px;
     display:flex;justify-content:space-between;}
  @media print{ body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
</style></head><body>

<div class="head">
  <div class="crest">${
    school.logoUrl
      ? `<img src="${esc(school.logoUrl)}" alt="">`
      : '<span class="fallback">CPS</span>'
  }</div>
  <div class="t">
    <div class="school">${esc(school.name).toUpperCase()}</div>
    <div class="sub">${esc(school.poBox)}, ${esc(school.city).toUpperCase()}.</div>
    <div class="sub">Tel: ${esc(school.phone)} &nbsp; Email: ${esc(school.email)}</div>
    ${school.motto ? `<div class="motto">“${esc(school.motto)}”</div>` : ''}
  </div>
  <div style="width:52px"></div>
</div>

<h1>New Pupil's Application Form</h1>

${
  isBlank
    ? ''
    : `<div class="ref">
  <span>Reference: <b>${esc(data.reference)}</b></span>
  <span>Applied online: <b>${esc(longDate(data.submittedAt))}</b></span>
</div>`
}

<div class="row">Date: ${slot(isBlank ? '' : longDate(data.submittedAt))} &nbsp; Class applied for: ${slot(v.gradeApplyingFor, true)}</div>

<h2>A. &nbsp;Pupil's Particulars</h2>
<div class="indent">
  <div class="row">(i) &nbsp;Name: ${slot(`${v.pupilFirstName ?? ''} ${v.pupilLastName ?? ''}`.trim(), true)}</div>
  <div class="row">(ii) &nbsp;Date of birth ${slot(dobText)} &nbsp; Age: ${slot(age(dob))} &nbsp; Gender: ${slot(v.gender)}</div>
  <div class="row">(iii) &nbsp;Nationality: ${slot(v.nationality)} &nbsp; (iv) Religion: ${slot(v.religion)}</div>
  <div class="row">(v) &nbsp;Day or Boarding: ${slot(v.residenceLabel)} &nbsp; Section: ${slot(v.sectionLabel)}</div>
</div>

<h2>B. &nbsp;Parent's / Guardian's details</h2>
<div class="indent">
  <div class="row">(i) &nbsp;Father/Guardian's Name: ${slot(v.guardianName, true)}</div>
  <div class="row">Phone contact: ${slot(v.guardianPhone)} &nbsp; E-mail: ${slot(v.guardianEmail)}</div>
  <div class="row">Occupation: ${slot(v.guardianOccupation)} &nbsp; Place of work: ${slot(v.guardianWorkplace)}</div>
  <div class="row">Residence: ${slot(v.guardianResidence)} &nbsp; District: ${slot(v.guardianDistrict)}</div>
  <div class="row">If Guardian, relationship with the child: ${slot(v.relationship, true)}</div>

  <div class="row" style="margin-top:5px">(ii) &nbsp;Mother's Names: ${slot(v.motherName, true)}</div>
  <div class="row">Phone contact: ${slot(v.motherPhone)} &nbsp; E-mail: ${slot(v.motherEmail)}</div>
  <div class="row">Occupation: ${slot(v.motherOccupation)} &nbsp; Place of work: ${slot(v.motherWorkplace)}</div>
  <div class="row">Residence: ${slot(v.motherResidence)} &nbsp; District: ${slot(v.motherDistrict)}</div>

  <div class="row" style="margin-top:5px">(iii) &nbsp;Other immediate contact person</div>
  <div class="row">Name: ${slot(v.contactName, true)}</div>
  <div class="row">Phone contact: ${slot(v.contactPhone)} &nbsp; E-mail: ${slot(v.contactEmail)}</div>
  <div class="row">Occupation: ${slot(v.contactOccupation)} &nbsp; Place of work: ${slot(v.contactWorkplace)}</div>
  <div class="row">Residence: ${slot(v.contactResidence)} &nbsp; District: ${slot(v.contactDistrict)}</div>
  <div class="row">Relationship to the child: ${slot(v.contactRelationship, true)}</div>
</div>

<h2>C. &nbsp;Former School's details <span style="font-weight:normal">(Attach copy of Report Card)</span></h2>
<div class="indent">
  <div class="row">(i) &nbsp;Former school: ${slot(v.formerSchool)} &nbsp; Former Class attended: ${slot(v.formerClass)}</div>
  <div class="row">(ii) &nbsp;How did you get to know about us? ${slot(v.heardAboutUs, true)}</div>
</div>

<h2>D. &nbsp;Health background</h2>
<div class="indent">
  <div class="row">(i) &nbsp;State if the child has any special illness: ${slot(v.specialIllness, true)}</div>
  <div class="row">(ii) &nbsp;Do you have children in our school? ${slot(sibling ? 'Yes' : '')}</div>
  <div class="row">Name: ${slot(v.siblingName)} &nbsp; Class: ${slot(v.siblingClass)}</div>
</div>

<div class="sign">
  <div class="row">Parent/ Guardian's Signature: ${slot('', true)}</div>
  <div class="row">Name: ${slot(v.declarationName || v.guardianName, true)}</div>
  <div class="row">Date: ${slot('')}</div>
</div>

<div class="note">
  <h3>Bring this form to the school</h3>
  <p style="margin:0">
    ${
      isBlank
        ? 'Complete this form by hand and <b>bring it to the school together with your child</b> on any interview day.'
        : 'Applying online does not complete the admission. Please <b>bring this printed form to the school together with your child</b> on any interview day. Sign above, and complete by hand any line left blank.'
    }
  </p>
  <p style="margin:5px 0 0"><b>Come with:</b> the child being admitted and this completed form.</p>
  <p style="margin:3px 0 0"><b>Interviews:</b> Monday to Friday, 9:00am to 12:00 noon.</p>
  ${
    includeFees
      ? `<p style="margin:3px 0 0"><b>Interview / registration fee:</b> UGX 50,000 (non-refundable), payable in cash on the day.</p>`
      : `<p style="margin:3px 0 0"><b>Fees:</b> for the registration and school fee structure, call or WhatsApp ${esc(school.phone)}.</p>`
  }
  <p style="margin:5px 0 3px"><b>Also bring:</b></p>
  <ul>
    <li>1 passport photo for the child</li>
    <li>1 passport photo for the mother</li>
    <li>1 passport photo for the father</li>
    <li>Photocopy of the recent report card from the previous school</li>
    <li>Photocopy of the immunization card or Birth Certificate</li>
  </ul>
</div>

<footer>
  <span>${esc(school.name)} · Reference ${esc(data.reference)}</span>
  <span>Printed ${esc(new Date().toLocaleString())}</span>
</footer>
</body></html>`;
}
