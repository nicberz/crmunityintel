import Link from "next/link";

export const metadata = {
  title: "Privātuma politika — UnityIntelCRM",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/login" className="text-sm text-primary hover:underline">
        ← Atpakaļ uz pieteikšanos
      </Link>

      <h1 className="mb-1 mt-4 text-2xl font-semibold">Privātuma politika</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Pēdējo reizi atjaunināts: 21.09.2026. Šī politika attiecas uz UnityIntelCRM sistēmas lietotāju kontu datiem
        (aģentūras un klientu darbinieki, kas pieslēdzas sistēmai).
      </p>

      <div className="space-y-8">
        <Section title="1. Pārzinis">
          <p>
            Par šajā politikā aprakstīto personas datu apstrādi atbild:
            <br />
            SIA &quot;UnityIntel&quot;, reģ. nr. 40203627753 (reģistrēts 20.02.2025.), juridiskā adrese: Strautu iela
            13, Liepāja, LV-3401, Latvija.
            <br />
            Kontakti datu aizsardzības jautājumos:{" "}
            <a href="mailto:info@unityintel.com" className="text-primary hover:underline">
              info@unityintel.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Kādus datus mēs apstrādājam">
          <p>Lai nodrošinātu piekļuvi UnityIntelCRM sistēmai, mēs apstrādājam:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>vārdu, uzvārdu un e-pasta adresi (konta identifikācijai);</li>
            <li>lomu sistēmā (aģentūras administrators vai klienta lietotājs) un piesaisti klientam;</li>
            <li>pieteikšanās un sesijas datus, ko nodrošina mūsu autentifikācijas pakalpojums;</li>
            <li>jūsu sistēmā ievadīto informāciju (piemēram, uzdevumus, piezīmes, kalendāra ierakstus).</li>
          </ul>
        </Section>

        <Section title="3. Kāpēc mēs apstrādājam šos datus">
          <p>
            Datus apstrādājam, lai izpildītu ar jums vai jūsu darba devēju noslēgto līgumu (piekļuves nodrošināšana
            sistēmai), lai nodrošinātu sistēmas drošību un darbību (leģitīmās intereses), un, ja nepieciešams, jūsu
            piekrišanas gadījumā.
          </p>
        </Section>

        <Section title="4. Kur un kā dati tiek glabāti">
          <p>
            Sistēmas datubāze un lietotāju autentifikācija tiek nodrošināta, izmantojot{" "}
            <strong className="text-foreground">Supabase</strong> (Supabase Inc.) infrastruktūru. Jūsu konta dati
            (vārds, e-pasts, parole šifrētā veidā, sesijas informācija) fiziski tiek glabāti Supabase datu centrā
            Eiropas Savienībā — Īrijā (reģions eu-west-1). Sistēmas tīmekļa lietotne un serveru daļa (API) darbojas uz{" "}
            <strong className="text-foreground">Vercel</strong> (Vercel Inc.) infrastruktūras. Piekļuve datiem
            sistēmā ir ierobežota, izmantojot lomu balstītu piekļuves kontroli un datubāzes rindu līmeņa drošības
            politikas (Row Level Security).
          </p>
        </Section>

        <Section title="5. Trešās puses un apakšapstrādātāji">
          <p>Jūsu datu apstrādē mums palīdz šādi pakalpojumu sniedzēji (apakšapstrādātāji):</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Supabase Inc.</strong> — datubāze, autentifikācija un failu
              glabātuve. Dati tiek glabāti ES (Īrija, eu-west-1).
            </li>
            <li>
              <strong className="text-foreground">Vercel Inc.</strong> — tīmekļa lietotnes un servera (API) mitināšana.
              Apstrādā pieprasījumu datus (piemēram, IP adresi) lietotnes darbības nodrošināšanai.
            </li>
            <li>
              <strong className="text-foreground">Meta Platforms, Inc.</strong> (WhatsApp Cloud API) — izmantots
              tikai, lai nosūtītu WhatsApp paziņojumus par jauniem leadiem uz klienta norādīto numuru; šajā procesā
              tiek nosūtīts leada vārds un kontaktinformācija, nevis jūsu konta dati.
            </li>
          </ul>
          <p>
            Ar katru apakšapstrādātāju ir noslēgta atbilstoša datu apstrādes vienošanās. Ja apakšapstrādātājs apstrādā
            datus ārpus Eiropas Savienības/EEZ (piemēram, Vercel Inc. un Meta Platforms, Inc. ir ASV uzņēmumi), datu
            nodošana tiek nodrošināta ar atbilstošiem aizsardzības mehānismiem (piemēram, Eiropas Komisijas apstiprinātām
            līguma standartklauzulām).
          </p>
        </Section>

        <Section title="6. Sīkdatnes">
          <p>
            Sistēma izmanto tikai stingri nepieciešamās sesijas sīkdatnes, ko nodrošina mūsu autentifikācijas
            pakalpojums (Supabase), lai jūs paliktu pieteicies sistēmā. Mēs neizmantojam analītikas, mārketinga vai
            trešo pušu izsekošanas sīkdatnes.
          </p>
        </Section>

        <Section title="7. Datu glabāšanas ilgums">
          <p>
            Jūsu konta datus glabājam, kamēr jūsu konts ir aktīvs. Pēc konta darbības izbeigšanas dati tiek dzēsti vai
            anonimizēti saprātīgā termiņā, ja vien ilgāka glabāšana nav nepieciešama juridisku pienākumu izpildei.
          </p>
        </Section>

        <Section title="8. Jūsu tiesības">
          <p>Saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR) jums ir tiesības:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>piekļūt saviem datiem un saņemt to kopiju;</li>
            <li>pieprasīt datu labošanu, ja tie ir neprecīzi;</li>
            <li>pieprasīt datu dzēšanu ("tiesības tikt aizmirstam");</li>
            <li>ierobežot vai iebilst pret datu apstrādi;</li>
            <li>pieprasīt datu pārnesamību;</li>
            <li>
              iesniegt sūdzību uzraudzības iestādei — Latvijā tā ir{" "}
              <a
                href="https://www.dvi.gov.lv"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Datu valsts inspekcija
              </a>
              .
            </li>
          </ul>
          <p>
            Lai izmantotu šīs tiesības, sazinieties ar mums:{" "}
            <a href="mailto:info@unityintel.com" className="text-primary hover:underline">
              info@unityintel.com
            </a>
            .
          </p>
        </Section>

        <Section title="9. Izmaiņas šajā politikā">
          <p>
            Mēs varam šo politiku laiku pa laikam atjaunināt. Būtisku izmaiņu gadījumā par to informēsim sistēmas
            lietotājus.
          </p>
        </Section>
      </div>
    </div>
  );
}
