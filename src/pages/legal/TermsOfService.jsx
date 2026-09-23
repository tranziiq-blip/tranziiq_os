import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { COMPANY } from "@/lib/siteConfig";

const sections = [
  {
    id: "agreement",
    title: "This agreement",
    body: (
      <>
        <p>
          These terms form an agreement between {COMPANY.legalName} ("TranziIQ",
          "we") and the business that creates a TranziIQ account ("the
          customer", "you"). By creating an account or using the service you
          accept them. The person accepting confirms they have authority to bind
          the customer.
        </p>
        <p>
          A signed quote, order form or pilot agreement may add to these terms.
          If it conflicts with these terms, the signed document applies.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "The service",
    body: (
      <>
        <p>
          TranziIQ is web and mobile software for managing transport operations,
          including loads, weighbills, fleet, drivers, maintenance, compliance,
          safety, HR, finance and reporting. The modules available depend on
          your plan and add-ons.
        </p>
        <p>
          <strong>Pilots.</strong> During a pilot the service may still be
          changing. Features can be added, changed or removed, and pilot scope,
          duration and pricing are agreed in writing before billing starts.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and users",
    body: (
      <ul>
        <li>
          You are responsible for the users you invite and the roles you give
          them, including clearing agents and client portal users.
        </li>
        <li>
          Keep sign-in details confidential and tell us at once if you suspect
          an account has been compromised.
        </li>
        <li>
          Account information you give us must be accurate and kept up to date.
        </li>
      </ul>
    ),
  },
  {
    id: "your-data",
    title: "Your data and POPIA",
    body: (
      <>
        <p>
          You own the data you load into TranziIQ. For personal information
          about your drivers, employees, contractors and clients, you are the
          responsible party and we are your operator under the Protection of
          Personal Information Act 4 of 2013. We will:
        </p>
        <ul>
          <li>
            process that information only to provide the service or on your
            documented instructions;
          </li>
          <li>
            keep it confidential and apply the security measures in our{" "}
            <Link to="/privacy">privacy policy</Link>; and
          </li>
          <li>
            tell you without undue delay if we believe it has been accessed or
            acquired by an unauthorised person.
          </li>
        </ul>
        <p>You are responsible for:</p>
        <ul>
          <li>
            having a lawful basis to collect and use the information you load;
          </li>
          <li>
            telling your drivers and employees how their information is used,
            including GPS tracking during shifts; and
          </li>
          <li>
            only recording special personal information, such as health
            information, where POPIA allows it.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You and your users must not:</p>
        <ul>
          <li>
            use the driver app while driving, other than in a way that is lawful
            and hands-free;
          </li>
          <li>
            use the service for anything unlawful, including loading data you
            have no right to process;
          </li>
          <li>
            try to access other customers' data, bypass security, or copy,
            reverse engineer or resell the software; or
          </li>
          <li>upload malicious code or overload the service.</li>
        </ul>
        <p>
          We may suspend access that breaches this section, after notice where
          that is practical.
        </p>
      </>
    ),
  },
  {
    id: "compliance",
    title: "Your legal obligations stay yours",
    body: (
      <p>
        TranziIQ helps you keep records, track expiry dates and follow
        processes. It does not replace your obligations under laws such as the
        National Road Traffic Act, the Mine Health and Safety Act, the
        Occupational Health and Safety Act, road transport management standards,
        or customs and excise legislation. Clearance tracking in the portal does
        not submit declarations to the South African Revenue Service or any
        other authority. You remain responsible for checking that records, loads
        and vehicles comply.
      </p>
    ),
  },
  {
    id: "fees",
    title: "Fees and payment",
    body: (
      <>
        <p>
          Fees are charged per truck per month for your plan and add-ons, at the
          prices on our <a href="/#pricing">pricing page</a> or in your written
          quote. Prices are in South African rand and exclude VAT where it
          applies.
        </p>
        <ul>
          <li>Invoices are payable on the terms stated on the invoice.</li>
          <li>
            We may suspend the service if an undisputed invoice remains unpaid
            14 days after written notice.
          </li>
          <li>
            We will give at least 30 days' written notice of any price increase.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "term",
    title: "Term and cancellation",
    body: (
      <>
        <p>
          Unless a signed agreement says otherwise, the service runs month to
          month. Either party may cancel with 30 days' written notice. We may
          end the agreement immediately if you materially breach these terms and
          do not fix the breach within 14 days of notice.
        </p>
        <p>
          After the agreement ends you can export your data for 90 days. After
          that we delete it, unless a law requires us to keep it.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        We own the TranziIQ software, design and documentation. You get a
        non-exclusive, non-transferable right to use the service during the
        agreement. You give us permission to host, copy and process your data
        only as needed to provide the service. If you send us suggestions, we
        may use them without obligation to you.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and support",
    body: (
      <p>
        We work to keep the service available and fix faults promptly, but we do
        not guarantee uninterrupted or error-free operation unless a signed
        service level agreement says so. Planned maintenance will be announced
        in advance where possible. Service availability also depends on
        third-party providers and your own internet and mobile connections.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>To the extent the law allows:</p>
        <ul>
          <li>
            neither party is liable for indirect or consequential loss,
            including loss of profit, revenue or contracts;
          </li>
          <li>
            our total liability under this agreement is limited to the fees you
            paid in the 12 months before the claim arose; and
          </li>
          <li>
            these limits do not apply to fraud, deliberate misconduct or gross
            negligence.
          </li>
        </ul>
        <p>
          You indemnify us against third-party claims arising from data you
          loaded without a lawful basis, or from use of the service in breach of
          these terms.
        </p>
        <p>
          If the Consumer Protection Act 68 of 2008 applies to you, nothing in
          these terms limits rights that Act gives you.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. For changes that materially affect you, we
        will give at least 30 days' notice by email or in the app. If you do not
        agree, you may cancel before the change applies.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        South African law governs this agreement. The parties first try to
        settle disputes by negotiation between senior representatives within 20
        business days. After that, either party may approach a competent South
        African court.
      </p>
    ),
  },
  {
    id: "supplier",
    title: "Supplier information",
    body: (
      <>
        <p>
          Provided under section 43 of the Electronic Communications and
          Transactions Act 25 of 2002:
        </p>
        <table>
          <tbody>
            <tr>
              <th scope="row">Legal name</th>
              <td>{COMPANY.legalName}</td>
            </tr>
            <tr>
              <th scope="row">Registration number</th>
              <td>{COMPANY.registrationNumber}</td>
            </tr>
            {COMPANY.vatNumber && (
              <tr>
                <th scope="row">VAT number</th>
                <td>{COMPANY.vatNumber}</td>
              </tr>
            )}
            <tr>
              <th scope="row">Directors</th>
              <td>{COMPANY.directors}</td>
            </tr>
            <tr>
              <th scope="row">Physical address</th>
              <td>{COMPANY.physicalAddress}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{COMPANY.email}</td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>{COMPANY.phone}</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
];

export default function TermsOfService() {
  return <LegalLayout title="Terms of service" sections={sections} />;
}
