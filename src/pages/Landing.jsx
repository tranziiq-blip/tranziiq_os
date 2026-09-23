import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import {
  ADDONS,
  DEVICE,
  PLANS,
  formatRand,
  planForTrucks,
} from "@/lib/siteConfig";

const PROBLEMS = [
  {
    title: "Tickets go missing between the weighbridge and the invoice",
    body: "Paper weighbills, WhatsApp photos and spreadsheets mean short-loads and disputes surface weeks later, when the client queries the invoice.",
  },
  {
    title: "Nobody can say what a truck actually costs per kilometre",
    body: "Fuel, tyres, repairs and driver time sit in different books, so rates get quoted on gut feel instead of real cost per kilometre.",
  },
  {
    title: "Audit week turns into a paper chase",
    body: "Mining houses ask for licences, COFs, driver competencies and toolbox talks on the spot. Expired documents stop trucks at the gate.",
  },
];

const ROLES = [
  {
    who: "Controllers",
    what: "Plan and dispatch loads, track status from loading point to offload, capture weighbills and delivery notes, and see every truck on one board.",
  },
  {
    who: "Drivers",
    what: "Clock in, run the pre-trip inspection, update the load, log fuel and report a breakdown with photos, from a phone or tablet.",
  },
  {
    who: "Workshop and stores",
    what: "Job cards, service schedules by kilometre or date, tyre positions and tread depths, parts on hand and stock movements.",
  },
  {
    who: "SHEQ and compliance",
    what: "Incidents, risk register, toolbox talks, visible felt leadership, shift risk assessments, and document expiry alerts for trucks, trailers and people.",
  },
  {
    who: "Cross-border clearing",
    what: "Cross-border loads open a customs document checklist automatically. Clearing agents work in their own portal and every update reaches the controller and driver.",
  },
  {
    who: "HR and finance",
    what: "Employee files, leave, training and disciplinary records, plus invoices, expenses, budgets and bank reconciliation linked back to loads.",
  },
];

const STEPS = [
  {
    title: "Set up your fleet",
    body: "We load your trucks, trailers, drivers and clients with you, and switch on the modules that match your operation.",
  },
  {
    title: "Drivers go live",
    body: "Drivers sign in on their phones or tablets and do their inspections, load updates and fuel logs in the app instead of on paper.",
  },
  {
    title: "Every load leaves a record",
    body: "Weighbill, delivery note, fuel and incidents attach to the load, so the tonnage invoiced matches the tonnage delivered.",
  },
  {
    title: "You see the numbers",
    body: "Dashboards show cost per kilometre, fleet availability, expiring documents and overdue invoices, with reports ready for your clients.",
  },
];

const BENEFITS = [
  {
    title: "One record from loading point to invoice",
    body: "Load, weighbill, delivery note and invoice are linked, so a client query takes a minute to answer instead of a day.",
  },
  {
    title: "Real cost per kilometre, per truck",
    body: "Fuel, parts, tyres and repairs are captured against the truck that used them, so you quote rates you can defend.",
  },
  {
    title: "Documents renewed before they stop a truck",
    body: "Licence discs, COFs, permits and driver credentials are flagged ahead of expiry instead of at the mine gate.",
  },
  {
    title: "Audit files ready when the mine asks",
    body: "Inspections, toolbox talks, incidents and risk assessments are stored against dates and people, ready to export.",
  },
  {
    title: "Clearing without the phone tag",
    body: "Clearing agents request documents and report holds or inspections through the portal, and the controller and driver are notified straight away.",
  },
  {
    title: "Built for how haulage runs here",
    body: "Designed around South African mining-contract transport and SADC corridors, by people who have run the loads.",
  },
];

const FAQS = [
  {
    q: "Do we need new hardware?",
    a: `No. Drivers use the app on their own Android or iOS phones or tablets. If you would rather supply devices, we offer a rugged tablet with 10 GB of monthly data at ${formatRand(DEVICE.price)} per device per month.`,
  },
  {
    q: "Can it connect to our vehicle tracking?",
    a: "Telematics connections are being added provider by provider. Tell us which tracking company you use when you start your pilot and we will confirm what can be connected.",
  },
  {
    q: "Who owns our data?",
    a: "You do. We process your operational and employee data on your behalf under the Protection of Personal Information Act, and you can export it at any time. Our privacy policy explains the details.",
  },
  {
    q: "How does a pilot work?",
    a: "Create an account, choose your type of operation, and we set up your fleet with you. Pilot scope, duration and pricing are agreed in writing with each operator before any billing starts.",
  },
  {
    q: "Are prices fixed?",
    a: "Prices are per truck per month in rand, excluding VAT where it applies. Enterprise fleets of more than 50 trucks receive a quote.",
  },
];

const COMPLIANCE_ADDONS = ADDONS.filter((a) =>
  ["dg_hazmat", "cold_chain", "abnormal_load"].includes(a.id),
);

function WeighbridgeTicket() {
  return (
    <div
      className="ticket-slot"
      aria-label="Example weighbridge ticket captured in TranziIQ"
    >
      <div className="ticket">
        <div className="ticket__head">
          <strong>Weighbridge ticket</strong>
          <span>WB-20417</span>
        </div>
        <div className="ticket__row">
          <span>Load</span>
          <span>LD-0412</span>
        </div>
        <div className="ticket__row">
          <span>Truck</span>
          <span>Actros 3345 / Side tipper</span>
        </div>
        <div className="ticket__row">
          <span>From</span>
          <span>Shaft 3 stockpile</span>
        </div>
        <div className="ticket__row">
          <span>To</span>
          <span>Concentrator plant</span>
        </div>
        <div className="ticket__row">
          <span>Commodity</span>
          <span>ROM ore</span>
        </div>
        <div className="ticket__weights">
          <div className="ticket__row">
            <span>Gross</span>
            <span>56 140 kg</span>
          </div>
          <div className="ticket__row">
            <span>Tare</span>
            <span>21 880 kg</span>
          </div>
          <div className="ticket__row ticket__net">
            <span>Net</span>
            <span>34.26 t</span>
          </div>
        </div>
        <div className="ticket__checks">
          <span className="ticket__check">Pre-trip inspection passed</span>
          <span className="ticket__check">Driver competency valid</span>
          <span className="ticket__check">COF valid to Mar 2027</span>
          <span className="ticket__check ticket__check--wait">
            Delivery note awaiting signature
          </span>
        </div>
        <span className="ticket__stamp">Captured</span>
      </div>
    </div>
  );
}

function PriceCalculator({ trucks, setTrucks }) {
  const [addons, setAddons] = useState([]);
  const [devices, setDevices] = useState(false);
  const plan = planForTrucks(trucks);

  const lines = useMemo(() => {
    const out = [];
    if (plan.price)
      out.push([`${plan.name} plan, ${trucks} trucks`, plan.price * trucks]);
    for (const id of addons) {
      const a = ADDONS.find((x) => x.id === id);
      out.push([a.name, a.price * trucks]);
    }
    if (devices) out.push([`${trucks} driver tablets`, DEVICE.price * trucks]);
    return out;
  }, [plan, trucks, addons, devices]);

  const total = lines.reduce((s, [, v]) => s + v, 0);
  const toggle = (id) =>
    setAddons((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  return (
    <div className="calc">
      <div>
        <label htmlFor="truck-count">How many trucks do you run?</label>
        <input
          id="truck-count"
          type="range"
          min="1"
          max="120"
          value={trucks}
          onChange={(e) => setTrucks(Number(e.target.value))}
          aria-valuetext={`${trucks} trucks`}
        />
        <div className="calc__count">
          {trucks} {trucks === 1 ? "truck" : "trucks"}
        </div>
        <fieldset
          className="calc__opts"
          style={{ border: 0, padding: 0, margin: "18px 0 0" }}
        >
          <legend style={{ fontWeight: 650, marginBottom: 6 }}>
            Add to the estimate
          </legend>
          {COMPLIANCE_ADDONS.map((a) => (
            <label key={a.id}>
              <input
                type="checkbox"
                checked={addons.includes(a.id)}
                onChange={() => toggle(a.id)}
              />
              <span>
                {a.name} ({formatRand(a.price)} {a.unit})
              </span>
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={devices}
              onChange={(e) => setDevices(e.target.checked)}
            />
            <span>
              A rugged tablet for every truck ({formatRand(DEVICE.price)}{" "}
              {DEVICE.unit})
            </span>
          </label>
        </fieldset>
      </div>
      <div className="calc__total" aria-live="polite">
        {plan.price ? (
          <>
            <dl>
              {lines.map(([label, value]) => (
                <div key={label} style={{ display: "contents" }}>
                  <dt>{label}</dt>
                  <dd>{formatRand(value)}</dd>
                </div>
              ))}
            </dl>
            <div className="calc__sum">{formatRand(total)} a month</div>
            <p className="calc__fine">
              Estimate in rand, excluding VAT where it applies.
            </p>
          </>
        ) : (
          <>
            <div className="calc__sum" style={{ marginTop: 0 }}>
              Enterprise quote
            </div>
            <p className="site-body" style={{ marginTop: 10 }}>
              Fleets of more than 50 trucks are priced per operation, including
              integrations and service levels. Start a pilot and we will send a
              written quote.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Landing() {
  const [trucks, setTrucks] = useState(20);
  const activePlan = planForTrucks(trucks);

  return (
    <SiteLayout title="TranziIQ | Fleet operations for bulk haulage and mining transport">
      <section className="hero">
        <div className="site-wrap hero__grid">
          <div>
            <h1 className="site-h1">
              Every load, ticket and truck in one place.
            </h1>
            <p className="site-lead" style={{ marginTop: 22 }}>
              TranziIQ runs the day-to-day of bulk haulage and mining-contract
              transport: dispatch, weighbills, driver inspections, workshop,
              compliance and invoicing, on a phone in the cab and a screen in
              the office.
            </p>
            <div className="hero__ctas">
              <Link to="/register" className="btn btn-primary">
                Start a pilot
              </Link>
              <a href="#how-it-works" className="btn btn-ghost">
                See how it works
              </a>
            </div>
            <p className="hero__note">
              From {formatRand(PLANS[1].price)} per truck per month. No hardware
              required.
            </p>
          </div>
          <WeighbridgeTicket />
        </div>
      </section>

      <section className="band band--paper" aria-labelledby="problems-title">
        <div className="site-wrap">
          <div className="band__intro">
            <h2 id="problems-title" className="site-h2">
              Where haulage operations leak money
            </h2>
          </div>
          <div className="problems">
            {PROBLEMS.map((p) => (
              <div key={p.title}>
                <h3 className="site-h3">{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="band" aria-labelledby="modules-title">
        <div className="site-wrap">
          <div className="band__intro">
            <h2 id="modules-title" className="site-h2">
              What it covers, by who uses it
            </h2>
            <p className="site-body">
              Each person sees the part of the operation they run. Modules
              switch on to match your type of operation, from side tippers on a
              mine contract to cold-chain or abnormal loads.
            </p>
          </div>
          <div className="roles">
            {ROLES.map((r) => (
              <div className="role" key={r.who}>
                <h3 className="site-h3">{r.who}</h3>
                <p>{r.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="band band--road"
        aria-labelledby="how-title"
      >
        <div className="site-wrap">
          <div className="band__intro">
            <h2 id="how-title" className="site-h2" style={{ color: "#fff" }}>
              How it works
            </h2>
            <p className="site-lead">
              From sign-up to your first month of numbers.
            </p>
          </div>
          <ol className="road" style={{ listStyle: "none", margin: 0 }}>
            {STEPS.map((s, i) => (
              <li className="stop" key={s.title}>
                <span className="stop__marker" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="site-h3">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band--paper" aria-labelledby="benefits-title">
        <div className="site-wrap">
          <div className="band__intro">
            <h2 id="benefits-title" className="site-h2">
              What changes for your operation
            </h2>
          </div>
          <div className="benefits">
            {BENEFITS.map((b) => (
              <div className="benefit" key={b.title}>
                <h3 className="site-h3">{b.title}</h3>
                <p>{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="band" aria-labelledby="pricing-title">
        <div className="site-wrap">
          <div className="band__intro">
            <h2 id="pricing-title" className="site-h2">
              Pricing per truck
            </h2>
            <p className="site-body">
              The rate drops as your fleet grows. Move the slider to see what
              your fleet would cost each month.
            </p>
          </div>
          <PriceCalculator trucks={trucks} setTrucks={setTrucks} />
          <div className="plans">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`plan ${p.id === activePlan.id ? "plan--active" : ""}`}
              >
                <h3 className="site-h3">{p.name}</h3>
                <p className="plan__range">{p.range}</p>
                <p className="plan__price">
                  {p.price ? formatRand(p.price) : "Quote"}
                </p>
                <p className="plan__unit">{p.unit}</p>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <table className="addons">
            <caption>Add-ons</caption>
            <thead>
              <tr>
                <th scope="col">Add-on</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {ADDONS.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>
                    {formatRand(a.price)} {a.unit}
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  {DEVICE.name} ({DEVICE.note.toLowerCase()})
                </td>
                <td>
                  {formatRand(DEVICE.price)} {DEVICE.unit}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="calc__fine" style={{ marginTop: 14 }}>
            All prices in South African rand, excluding VAT where it applies.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="band band--paper"
        aria-labelledby="faq-title"
      >
        <div className="site-wrap" style={{ maxWidth: 860 }}>
          <h2 id="faq-title" className="site-h2" style={{ marginBottom: 28 }}>
            Questions operators ask
          </h2>
          <div className="faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="pilot-title">
        <div className="site-wrap pilot">
          <div>
            <h2 id="pilot-title" className="site-h2">
              Run a pilot on your own fleet
            </h2>
            <p className="site-lead" style={{ marginTop: 16 }}>
              Create an account, pick your type of operation, and we will set up
              your trucks and drivers with you.
            </p>
          </div>
          <div className="hero__ctas" style={{ marginTop: 0 }}>
            <Link to="/register" className="btn btn-primary">
              Start a pilot
            </Link>
            <Link to="/login" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
