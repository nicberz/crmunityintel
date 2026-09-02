# UnityIntelCRM

Multi-tenant CRM MVP: aģentūra pārvalda klientus, katram klientam uzstāda fiksētu komisiju
par leadu, un klients redz savus leadus (statusa izsekošana) un izmaksas ar automātiski
pieskaitītu komisiju (piem., Facebook rāda 4€/lead, komisija 2€ → klients redz 6€/lead).

Šī versija strādā **bez Facebook API atkarības**: leadi tiek ievadīti manuāli vai importēti
no CSV, un dienas izmaksu/leadu skaita dati (kas nosaka cenu par leadu) tiek ievadīti manuāli
aģentūras panelī. Datu modelis (`leads.source`, `ad_metrics_daily.source`) jau atbalsta
`facebook`/`facebook_api` vērtības, lai vēlāk pievienotu automātisku Facebook Marketing API /
Lead Ads sinhronizāciju bez shēmas izmaiņām — tas prasīs Meta App Review (skat. sarunas
piezīmes plāna failā), tāpēc netika būvēts pirmajā versijā.

## 1. Uzstādīšana lokāli

```bash
npm install
cp .env.example .env.local
```

## 2. Supabase projekta izveide

1. Izveido jaunu projektu [supabase.com](https://supabase.com).
2. **Project Settings → API** — nokopē `Project URL` un `anon public` key uz `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Tur pat nokopē `service_role` key uz `SUPABASE_SERVICE_ROLE_KEY` (**turi to noslēpumā** —
   to izmanto tikai servera pusē, lai ielūgtu klientu lietotājus).
4. **SQL Editor** — ielīmē un izpildi secīgi [`db/migrations/0001_init.sql`](db/migrations/0001_init.sql),
   [`0002_website_leads.sql`](db/migrations/0002_website_leads.sql),
   [`0003_commission_settings.sql`](db/migrations/0003_commission_settings.sql),
   [`0004_custom_fields.sql`](db/migrations/0004_custom_fields.sql),
   [`0005_leads_delete.sql`](db/migrations/0005_leads_delete.sql),
   [`0006_client_whatsapp.sql`](db/migrations/0006_client_whatsapp.sql) un
   [`0007_calendar_events.sql`](db/migrations/0007_calendar_events.sql).
   Tas izveido visas tabulas, statusus, RLS politikas un trigerus.
5. **Authentication → URL Configuration** — pievieno savu lokālo/produkcijas URL
   (piem. `http://localhost:3000`) pie *Redirect URLs*, lai ielūguma e-pasti strādātu.
6. **Authentication → Email Templates → Invite user** — **obligāti jāmaina** saites `href`
   no noklusējuma `{{ .ConfirmationURL }}` uz:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/set-password
   ```
   Bez šī soļa ielūguma saite ielogo lietotāju, bet neaizved viņu uz paroles iestatīšanas
   lapu (`/set-password`) — konts paliktu bez paroles un lietotājs nevarētu vēlreiz
   pieslēgties.

## 3. Pirmā lietotāja (aģentūras admina) izveide

Sistēmā nav publiskas reģistrācijas — visus lietotājus izveido/ielūdz aģentūras admins.
Pirmais admins jāizveido manuāli:

1. Supabase Dashboard → **Authentication → Users → Add user** — izveido lietotāju ar
   e-pastu/paroli (vai izmanto "Invite").
2. **SQL Editor** — atrodi jaunā lietotāja `id` (kolonnā `Users`) un izpildi:
   ```sql
   update public.profiles set role = 'agency_admin', client_id = null where id = '<user-uuid>';
   ```
3. Pieslēdzies ar šo kontu `/login` — nonāksi aģentūras panelī `/dashboard`.

Klientu lietotājus pēc tam vari ielūgt tieši no CRM (klienta detaļu lapā), sistēma
automātiski nosūta ielūguma e-pastu ar `client_user` lomu un piesaisti attiecīgajam klientam.
Uzklikšķinot uz saites, lietotājs nonāk `/set-password` lapā, kur iestata savu paroli, un
tad tiek ielogots CRM sistēmā (skat. iepriekš 6. soli par e-pasta veidnes iestatīšanu).

## 4. Palaišana

```bash
npm run dev
```

Atver [http://localhost:3000](http://localhost:3000).

## Struktūra

- `app/(agency)` — aģentūras admina panelis (`/dashboard`, `/clients`, `/clients/[id]`,
  `/clients/[id]/leads/[leadId]`)
- `app/(client)` — klienta panelis (`/overview`, `/leads`, `/leads/[id]`)
- `app/api/leads` — publisks API mājaslapas anketas datu pieņemšanai (skat. zemāk)
- `lib/commission.ts` — komisijas/cenas par leadu aprēķinu loģika (viena vieta, ko lieto
  gan agency, gan client panelis)
- `db/migrations/` — pilna DB shēma: statusi, komentāri, komisijas iestatījumi un RLS
  politikas
- `app/auth/confirm` — apstiprina ielūguma/paroles saites (`token_hash`), pēc tam aizved uz
  `/set-password`

## Mājaslapas anketas API

Katram klientam aģentūras panelī (`/clients/[id]`) var ģenerēt API atslēgu ("API
integrācija" kartīte). Mājaslapas anketai jānosūta:

```
POST https://<jūsu-domēns>/api/leads
x-api-key: <klienta API atslēga>
Content-Type: application/json

{
  "phone": "+371 20000000",
  "email": "anna@piemers.lv",
  "group": "Iesācēju grupa",
  "dates": ["2026-09-01", "2026-09-08"],
  "fields": {
    "uzvards": "Kalniņa",
    "vecums": "34"
  }
}
```

`phone` un `email` vienmēr ir obligāti. `group` un `dates` ir neobligāti (paliek kā bija —
esošās integrācijas nekas nemainās). `fields` ir neobligāts objekts pielāgotiem laukiem, kurus
katrs klients pats definē CRM panelī ("Pielāgotie lauki" kartīte, `/clients/[id]` vai
`/leads`) — atslēga ir lauka `key` (ģenerēts no nosaukuma), vērtība tiek validēta pret lauka
tipu (teksts/skaitlis/datums/izvēlne). Ja lauks atzīmēts kā obligāts un netiek nosūtīts,
API atgriež `400`.

Veiksmīgas atbildes gadījumā atgriež `201 { "id": "<lead-id>" }`. Leads automātiski
saglabājas ar avotu `website_form` un statusu "Jāpārzvana" — CRM lietotājs to redz
attiecīgā klienta leadu sarakstā un var mainīt statusu, pievienot komentārus, un visa
vēsture (dati, komentāri, statusu izmaiņas) tiek glabāta datubāzē.

Statusi: Jāpārzvana → Neatbild / Pārdomāja / Neinteresē / Noslēgts.

## WhatsApp paziņojumi

Kad klientam tiek pievienots jauns leads (manuāli `/leads` vai `/clients/[id]` lapā, vai caur
[mājaslapas anketas API](#mājaslapas-anketas-api)), CRM var nosūtīt WhatsApp paziņojumu uz
šī klienta norādīto numuru, izmantojot [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api).
CSV importam paziņojumi netiek sūtīti (lai imports ar simtiem rindu neradītu simtiem ziņu).

Šai funkcijai **nav nepieciešams kļūt par Meta Tech Provider/partneri** — tas ir domāts
platformām, kas savieno *citu* uzņēmumu pašu WhatsApp numurus. Šeit pietiek ar parasto
Cloud API un vienu numuru, kas pieder tev (aģentūrai) un no kura tiek sūtīti paziņojumi
visiem taviem klientiem.

1. [developers.facebook.com](https://developers.facebook.com) → izveido jaunu App → pievieno
   "WhatsApp" produktu. Meta uzreiz izveido **bezmaksas testa numuru** — biznesa verifikācija
   vai īsts telefona numurs sākumā nav vajadzīgs.
2. WhatsApp → API Setup sadaļā atrodi `Phone number ID` un pagaidu (vēlāk — pastāvīgu)
   `Access token`.
3. Tajā pašā sadaļā pievieno testētāju numurus ("To" lauks) — testa numurs drīkst sūtīt
   ziņas tikai uz līdz 5 iepriekš verificētiem numuriem, kamēr biznesa konts nav verificēts.
4. WhatsApp → Message Templates → izveido veidni (piem. `new_lead_notification`) ar diviem
   mainīgajiem body tekstā, piem.: `Jauns leads: {{1}}, kontakti: {{2}}`. Veidnei jāiziet Meta
   apstiprināšana (parasti minūtes līdz ~1 diena) pirms to var izmantot.
5. `.env.local` (skat. [`.env.example`](.env.example)) pievieno:
   ```
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_TEMPLATE_NAME=new_lead_notification
   WHATSAPP_TEMPLATE_LANG=en_US
   ```
   `WHATSAPP_TEMPLATE_LANG` jāatbilst valodai, ko izvēlējies, izveidojot veidni (Meta veidņu
   valodu sarakstā latviešu valoda var nebūt pieejama visos kontos — ja nav, izmanto angļu
   veidni).
6. Katram klientam aģentūras admins norāda WhatsApp numuru lapā `/clients/[id]` → "Ielūgumi
   un API piekļuve" → "WhatsApp paziņojumi".

Ja `WHATSAPP_ACCESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` nav iestatīti vai klientam nav norādīts
WhatsApp numurs, leadu pievienošana turpina darboties normāli — paziņojums vienkārši netiek
sūtīts (kļūda tiek tikai ierakstīta servera logā).

## Nākamie soļi (out of scope šai versijai)

- Facebook Marketing API sinhronizācija (`ad_metrics_daily.source = 'facebook_api'`)
- Facebook Lead Ads webhook (`leads.source = 'facebook'`) — prasa Meta App Review
