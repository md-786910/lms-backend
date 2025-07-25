const CONTENT = {};

const TEMPLATE_TYPE = {
  PDF: 1,
  EMAIL: 2,
};

const SUBJECTS = {
  payslip: "Payslip for {{month_year}} - {{employee_name}}",
  leave_request: "Leave Application Approved - {{employee_name}}",
  leave_approved: "Leave Application Approved - {{employee_name}}",
  employment: "Employment Verification - {{employee_name}}",
  invitation: "Welcome to {{company_name}}!",
};

const TITLES = {
  payslip: "Payslip",
  leave_request: "Leave Request",
  leave_approved: "Leave Approved",
  employment: "Employment Verification",
  invitation: "Employee Invitation",
};

// Very naive classifier – adapt to your needs
const EMPLOYEE_KEYS = new Set([
  "employee_name",
  "employee_id",
  "department",
  "designation",
  "joining_date",
  "employment_status",
  "salary",
  "start_date",
  "office_location",
  "days_worked",
  "working_days",
]);
const COMPANY_KEYS = new Set([
  "company_name",
  "company_address",
  "currency",
  "hr_email",
  "current_date",
  "setup_link",
  "leave_type",
]);

// ---- utils --------------------------------------------------------
const uniq = (arr) => Array.from(new Set(arr));

const extractVars = (html) => {
  const re = /{{\s*([\w.]+)\s*}}/g;
  const vars = [];
  let m;
  while ((m = re.exec(html)) !== null) vars.push(m[1]);
  return uniq(vars);
};

const splitVars = (vars) => {
  const employee_variables = [];
  const company_variables = [];
  const other_variables = [];

  vars.forEach((v) => {
    if (EMPLOYEE_KEYS.has(v)) employee_variables.push(v);
    else if (COMPANY_KEYS.has(v)) company_variables.push(v);
    else other_variables.push(v);
  });

  return {
    employee_variables,
    company_variables,
    other_variables, // keep if you want to track what's uncategorized
  };
};

// ---- builder ------------------------------------------------------
const buildTemplateSeeds = (templates) => {
  let id = 1;
  return Object.entries(templates).map(([key, tpl]) => {
    const allVars = extractVars(tpl.content);
    const { employee_variables, company_variables, other_variables } =
      splitVars(allVars);

    return {
      id: id++,
      name: TITLES[key] || key,
      subject: SUBJECTS[key] || "",
      content: tpl.content,
      type: tpl.type === "pdf" ? TEMPLATE_TYPE.PDF : TEMPLATE_TYPE.EMAIL,
      employee_variables,
      company_variables,
      other_variables, // optional – drop if you don't want it
      meta: {
        key,
        rawType: tpl.type,
      },
    };
  });
};

const templateData = buildTemplateSeeds(templates);
