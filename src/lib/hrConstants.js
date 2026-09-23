export const DEPARTMENTS = [
  "Production",
  "Engineering",
  "Transport",
  "SHERQ",
  "Stores",
  "HR",
  "Finance",
  "Admin",
];

export const JOB_TITLES = [
  "Driver",
  "Mechanic",
  "Storekeeper",
  "Forklift  Operator",
  "Safety Officer",
  "Fleet Manager",
  "Dispatcher",
  "Administrator",
  "Workshop Supervisor",
  "Operations Manager",
  "Finance Clerk",
  "HR Manager",
  "General Worker",
  "Workshop Foreman",
  "Controller",
];

export const EMPLOYMENT_TYPES = [
  { key: "permanent", label: "Permanent" },
  { key: "contract", label: "Contract" },
  { key: "casual", label: "Casual" },
  { key: "probation", label: "Probation" },
];

export const EMPLOYEE_STATUS = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  on_leave: { label: "On Leave", color: "bg-amber-100 text-amber-700" },
  suspended: { label: "Suspended", color: "bg-orange-100 text-orange-700" },
  terminated: { label: "Terminated", color: "bg-rose-100 text-rose-700" },
  resigned: { label: "Resigned", color: "bg-slate-100 text-slate-600" },
};

export const EMP_DOC_TYPES = {
  id_document: { label: "ID Document", color: "bg-blue-100 text-blue-700" },
  cv: { label: "CV", color: "bg-violet-100 text-violet-700" },
  contract: { label: "Contract", color: "bg-brand-navy text-white" },
  job_description: {
    label: "Job Description",
    color: "bg-brand-teal  text-white",
  },
  certificate: { label: "Certificate", color: "bg-amber-100 text-amber-700" },
  qualification: {
    label: "Qualification",
    color: "bg-emerald-100  text-emerald-700",
  },
  medical: { label: "Medical", color: "bg-rose-100 text-rose-700" },
  other: { label: "Other", color: "bg-slate-100 text-slate-600" },
};

export const DISCIPLINARY_TYPES = {
  verbal_warning: {
    label: "Verbal Warning",
    color: "bg-amber-100  text-amber-700",
  },
  written_warning: {
    label: "Written Warning",
    color: "bg-orange-100  text-orange-700",
  },
  final_warning: { label: "Final Warning", color: "bg-rose-100 text-rose-700" },
  suspension: { label: "Suspension", color: "bg-red-100 text-red-700" },
  dismissal: { label: "Dismissal", color: "bg-red-100 text-red-700" },
  enquiry: {
    label: "Disciplinary Enquiry",
    color: "bg-violet-100  text-violet-700",
  },
};

export const LEAVE_TYPES = [
  { key: "annual", label: "Annual Leave" },
  { key: "sick", label: "Sick Leave" },
  { key: "unpaid", label: "Unpaid Leave" },
  { key: "maternity", label: "Maternity" },
  { key: "paternity", label: "Paternity" },
  { key: "family", label: "Family Responsibility" },
  { key: "study", label: "Study Leave" },
  { key: "compassionate", label: "Compassionate" },
];

export const LEAVE_STATUS = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-600" },
};

export const TRAINING_STATUS = {
  not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", color: "bg-sky-100 text-sky-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Overdue", color: "bg-rose-100 text-rose-700" },
};

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
