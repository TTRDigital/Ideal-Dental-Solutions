import { getSite } from "@/lib/site/data";
import { deliverLead } from "@/lib/lead";
import { checkRecaptcha } from "@/lib/recaptcha";
import { clientIp, guardSubmission } from "@/lib/form-guard";
import formFields from "@/content/form-fields.json";

/**
 * The Elementor forms post here, exactly as they posted to WordPress'
 * admin-ajax.php, and get the same JSON answer back (success message or
 * redirect to the form's thank-you page set in Site settings > Forms).
 */

export const dynamic = "force-dynamic";

type Json = Record<string, unknown>;
const reply = (body: Json, status = 200) => Response.json(body, { status });

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return reply({ success: false, data: { message: "Invalid request.", errors: [], data: [] } }, 400);
  }
  if (form.get("action") !== "elementor_pro_forms_send_form") return new Response("0", { status: 400 });

  const postId = String(form.get("post_id") || "");
  const formId = String(form.get("form_id") || "");
  // Field IDs (field_89fc83e) become their labels (Phone) for the CRM and the email.
  const labels = (formFields as Record<string, Record<string, string>>)[`${postId}:${formId}`] || {};
  const fields: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    const m = /^form_fields\[([^\]]+)\]/.exec(k);
    if (!m || typeof v !== "string") continue;
    const label = labels[m[1]] && labels[m[1]] !== m[1] ? labels[m[1]] : m[1];
    fields[label] = fields[label] ? `${fields[label]}, ${v}` : v;
  }
  const page = String(form.get("referrer") || req.headers.get("referer") || "");

  const { settings } = await getSite();
  const setting = (settings.forms || []).find((f) => f.formKey === `${postId}:${formId}`) || (settings.forms || []).find((f) => f.formKey?.endsWith(`:${formId}`) && f.formKey.startsWith(`${postId}:`));
  const origin = new URL(req.url).origin;
  const success = () => {
    const data: Json = setting?.redirect ? { redirect_url: new URL(setting.redirect, origin).toString() } : {};
    return reply({ success: true, data: { message: setting?.message ?? "Your submission was successful.", data } });
  };

  // Invisible spam protection (lib/form-guard.ts). A blocked submission gets the normal success answer,
  // is not delivered and is logged, so a bot learns nothing.
  const str = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : "");
  const ip = clientIp(req.headers);
  const blocked = guardSubmission({ fields, honeypot: str("website_url"), token: str("ttr_ft"), ip, form: setting?.name || `${postId}:${formId}` });
  if (blocked) return success();

  // Honeypot fields (Elementor "honeypot" type) must stay empty.
  if (Object.entries(fields).some(([k, v]) => /honeypot/i.test(k) && v)) return success();

  // reCAPTCHA v3 (lib/recaptcha.ts): Google must confirm the token (this site, this form, score >= 0.5).
  // A refused submission is not delivered; the visitor is asked to call instead, in case it was a person.
  const refused = await checkRecaptcha(str("g-recaptcha-response") || null, ip);
  if (refused) {
    console.warn(`[recaptcha] refused reason=${refused} form=${setting?.name || `${postId}:${formId}`}`);
    return reply({ success: false, data: { message: "We couldn't send your request. Please call us at (703) 442-0442 and we'll book your appointment.", errors: [], data: [] } });
  }

  const delivered = await deliverLead({ form: setting?.name || `${postId}:${formId}`, fields, page, tag: setting?.tag });
  if (!delivered) {
    return reply({ success: false, data: { message: "Something went wrong. Please call us at (703) 442-0442.", errors: [], data: [] } });
  }
  return success();
}
