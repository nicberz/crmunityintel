// Thin client for the Meta WhatsApp Cloud API (see README "WhatsApp paziņojumi").
// Sends a pre-approved template message to a client's WhatsApp number whenever
// a new lead is created for them. Never throws — a missing/broken WhatsApp
// setup must not block lead creation.

const GRAPH_API_VERSION = "v21.0";

interface LeadNotificationArgs {
  to: string | null | undefined;
  leadName: string | null;
  leadContact: string | null;
}

function getConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    templateName: process.env.WHATSAPP_TEMPLATE_NAME?.trim() || "new_lead_notification",
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG?.trim() || "en_US",
  };
}

export async function sendNewLeadWhatsAppNotification({ to, leadName, leadContact }: LeadNotificationArgs) {
  if (!to) return;

  const { accessToken, phoneNumberId, templateName, templateLang } = getConfig();
  if (!accessToken || !phoneNumberId) {
    console.warn(
      "WhatsApp nav konfigurēts (trūkst WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID) — paziņojums netiek sūtīts."
    );
    return;
  }

  const recipient = to.replace(/[^\d]/g, "");
  if (!recipient) return;

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: leadName || "Nezināms" },
                { type: "text", text: leadContact || "-" },
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`WhatsApp paziņojums neizdevās (${response.status}): ${body}`);
    }
  } catch (err) {
    console.error("WhatsApp paziņojuma sūtīšana neizdevās:", err);
  }
}
