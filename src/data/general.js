const currenciesData = [
  {
    name: "Indian Rupee",
    symbol: "₹",
    code: "INR",
    default: true,
  },
  {
    name: "United States Dollar",
    symbol: "$",
    code: "USD",
    default: false,
  },
  {
    name: "Euro",
    symbol: "€",
    code: "EUR",
    default: false,
  },
];

const departmentsData = [
  {
    name: "Engineering",
    description: "Software development and technical roles",
    prefix: "ENG",
  },
  {
    name: "Design",
    description: "UI/UX and creative design roles",
    prefix: "DES",
  },
  {
    name: "Sales",
    description: "Sales and business development roles",
    prefix: "SALE",
  },
  {
    name: "Marketing",
    description: "Marketing and promotional activities",
    prefix: "MARK",
  },
  {
    name: "HR",
    description: "Human resources and administration",
    prefix: "HR",
  },
];

const prefixData = departmentsData.map((dept, index) => ({
  department_id: Math.floor(Math.random() * departmentsData.length) + 1,
  name: dept.name === "HR" ? "HR" : dept.name.substring(0, 3).toUpperCase(),
}));

const designationIndex = {
  0: "Senior Developer",
  1: "UI/UX Designer",
  2: "Sales Manager",
  3: "Marketing Specialist",
  4: "HR Manager",
};

const designationsData = departmentsData.map((dept, index) => ({
  department_id: Math.floor(Math.random() * departmentsData.length) + 1,
  title: designationIndex[index],
}));

const leavesData = [
  {
    type: "Sick Leave",
    annual_days: 10,
  },
  {
    type: "Earned Leave",
    annual_days: 10,
  },
  {
    type: "Casual Leave",
    annual_days: 15,
  },
];

const documentData = [
  {
    type: "Aadhar Card",
    is_required: false,
  },
  {
    type: "Pan Card",
    is_required: false,
  },
  {
    type: "Passport",
    is_required: false,
  },
  {
    type: "Driving License",
    is_required: false,
  },
  {
    type: "Voter ID Card",
    is_required: false,
  },
  {
    type: "Graduation Certificate",
    is_required: false,
  },
  {
    type: "High School Certificate",
    is_required: false,
  },
];

const templateData = [
  {
    id: 1,
    name: "",
    subject: "",
    content: "",
    type: 1,
    employee_variables: {},
    company_variables: {},
  },
];

module.exports = {
  currenciesData,
  departmentsData,
  designationsData,
  leavesData,
  templateData,
  prefixData,
  documentData,
};
