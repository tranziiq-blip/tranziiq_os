import { Link } from "react-router-dom";
import LegalLayout from "./LegalLayout";
import { COMPANY, LEGAL } from "@/lib/siteConfig";

const sections = [
  {
    id: "who-we-are",
    title: "Who we are and what this covers",
    body: (
      <>
        <p>
          {COMPANY.legalName} (registration number {COMPANY.registrationNumber})
          provides TranziIQ, fleet operations software for transport operators.
          This policy explains how we process personal information under the
          Protection of Personal Information Act 4 of 2013 (POPIA).
        </p>
        <p>We process personal information in two roles:</p>
        <ul>
          <li>
            <strong>As a responsible party</strong> for information about our
            own customers, website visitors and the people who create accounts
            with us.
          </li>
          <li>
            <strong>As an operator</strong> for information our customers load
            into TranziIQ about their drivers, employees, contractors and
            clients. In that case the customer is the responsible party and
            decides why and how that information is used. We only process it on
            their instructions and to provide the service.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "information-officer",
    title: "Information officer",
    body: (
      <p>
        Our information officer is {COMPANY.informationOfficer}. Contact them at{" "}
        {COMPANY.privacyEmail} or {COMPANY.phone}, or write to{" "}
        {COMPANY.postalAddress}.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "Personal information we process",
    body: (
      <>
        <h3>Account and customer information</h3>
        <p>
          Name, email address, company, role, operation type, sign-in details
          (passwords are stored by our authentication provider in hashed form,
          never in plain text), billing plan and invoices, and messages you send
          us.
        </p>
        <h3>Operational records</h3>
        <p>
          Loads, weighbills, delivery notes and signatures, vehicle and trailer
          details, fuel logs, inspections, job cards, customs clearance
          documents and messages, and photos or files uploaded to those records.
        </p>
        <h3>Driver and employee records entered by customers</h3>
        <p>
          Depending on the modules a customer uses: names, identity numbers,
          contact details, next of kin, licence and competency details, shift
          and fatigue logs, training, leave and disciplinary records, payroll
          and banking details, and incident reports.
        </p>
        <h3>Location information</h3>
        <p>
          When a driver starts GPS tracking in the driver app during a shift,
          the device's location and distance travelled are recorded against that
          shift. Tracking stops when the driver ends it. Customers must tell
          their drivers about this before using it.
        </p>
        <h3>Special personal information</h3>
        <p>
          Incident reports, medical fitness certificates or disciplinary records
          can contain health information or other special personal information.
          Customers may only record it where section 27 of POPIA permits, for
          example to meet obligations under the Occupational Health and Safety
          Act or the Mine Health and Safety Act.
        </p>
        <h3>Technical information</h3>
        <p>
          IP address, browser and device type, and error and access logs kept by
          our hosting providers to operate and secure the service.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we process it",
    body: (
      <>
        <p>We rely on the lawful grounds in section 11 of POPIA:</p>
        <ul>
          <li>
            to conclude and perform our agreement with you, including providing,
            supporting and billing for the service;
          </li>
          <li>
            to comply with laws that apply to us, such as tax record-keeping;
          </li>
          <li>
            for our legitimate interests in securing, maintaining and improving
            the service, where those interests do not override your rights; and
          </li>
          <li>
            with your consent, for optional cookies and for direct marketing to
            people who are not yet customers.
          </li>
        </ul>
        <p>We do not sell personal information.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share personal information only as needed to run the service:</p>
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase</td>
              <td>Database, sign-in, file storage and server functions</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Hosting and delivery of the web application</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Sending report and notification emails</td>
            </tr>
            <tr>
              <td>Google</td>
              <td>Only if you choose to sign in with Google</td>
            </tr>
            <tr>
              <td>People a customer gives access</td>
              <td>
                For example clearing agents or clients using the client portal,
                limited to what that customer allows
              </td>
            </tr>
            <tr>
              <td>Authorities</td>
              <td>Where a law, court order or regulator requires it</td>
            </tr>
          </tbody>
        </table>
        <p>
          These providers act as our operators and are bound by agreements
          requiring them to keep the information confidential and secure.
        </p>
      </>
    ),
  },
  {
    id: "cross-border",
    title: "Information stored outside South Africa",
    body: (
      <p>
        Our hosting and infrastructure providers may store or process
        information on servers outside South Africa. Under section 72 of POPIA
        we only transfer information where the recipient is bound by law,
        binding corporate rules or an agreement that gives it a level of
        protection substantially similar to POPIA, or where the transfer is
        necessary to perform our agreement with you.
      </p>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <>
        <p>
          Under section 19 of POPIA we take reasonable technical and
          organisational measures, including:
        </p>
        <ul>
          <li>encryption of information in transit;</li>
          <li>
            row-level access rules in the database, so each role only reaches
            the records it is allowed to;
          </li>
          <li>
            financial records such as payroll, invoices and bank transactions
            restricted to administrators; and
          </li>
          <li>limiting staff access to what they need to support you.</li>
        </ul>
        <p>
          If we have reasonable grounds to believe personal information has been
          accessed or acquired by an unauthorised person, we will notify the
          Information Regulator and the affected customer or people as section
          22 of POPIA requires.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep account and customer records for as long as the account is
        active and afterwards for as long as the law requires, for example five
        years for tax records. When a customer's agreement ends, we make their
        data available for export and delete it within 90 days, unless a law
        requires us to keep it longer.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under POPIA you may:</p>
        <ul>
          <li>
            ask whether we hold personal information about you and request a
            copy;
          </li>
          <li>
            ask us to correct or delete information that is inaccurate, out of
            date, excessive or unlawfully obtained;
          </li>
          <li>
            object to processing based on legitimate interests, and to direct
            marketing at any time;
          </li>
          <li>
            withdraw consent you have given, without affecting processing before
            you withdrew it; and
          </li>
          <li>complain to the Information Regulator.</li>
        </ul>
        <p>
          Send requests to {COMPANY.privacyEmail}. If your information was
          loaded into TranziIQ by your employer or a transport company you work
          with, contact them first. They are the responsible party, and we will
          help them respond.
        </p>
        <p>
          {LEGAL.regulator.name}:{" "}
          <a href={LEGAL.regulator.website}>{LEGAL.regulator.website}</a>,
          complaints to {LEGAL.regulator.complaintsEmail}.
        </p>
      </>
    ),
  },
  {
    id: "marketing",
    title: "Direct marketing",
    body: (
      <p>
        We only send marketing to existing customers about similar services, or
        to others who have consented, as section 69 of POPIA requires. Every
        message includes a way to opt out.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        TranziIQ is a business service and is not intended for anyone under 18.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        How we use cookies and browser storage is explained in our{" "}
        <Link to="/cookies">cookie policy</Link>.
      </p>
    ),
  },
  {
    id: "paia",
    title: "Access to information (PAIA)",
    body: (
      <p>
        Our manual under the Promotion of Access to Information Act 2 of 2000 is
        available on request from our information officer.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy we will update the effective date above and,
        for significant changes, tell account holders by email or in the app
        before the change applies.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy policy"
      sections={sections}
      intro={
        <p style={{ marginTop: 18 }}>
          This policy applies to the TranziIQ website, web application and
          driver app.
        </p>
      }
    />
  );
}
