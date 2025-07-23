const db = require("../models");
const { STATUS_CODE } = require("../constants/statusCode");
const Company = db.Company;

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const {
      company_name,
      company_size,
      logo,
      industry,
      company_website,
      country_id,
      subscribe_newsletter = false,
      terms_accepted = false,
    } = req.body;

    const company = await Company.create({
      company_name,
      company_size,
      logo,
      industry,
      company_website,
      country_id,
      subscribe_newsletter,
      terms_accepted,
    });

    res.status(STATUS_CODE.CREATED).json({
      status: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to create company",
      error: error.message,
    });
  }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company list fetched successfully",
      data: companies,
    });
  } catch (error) {
    console.error("Get all companies error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to fetch companies",
      error: error.message,
    });
  }
};

// Get a single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id, {
      nclude: [
        {
          model: db.User,
          as: "users",
        },
      ],
    });

    if (!company) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found",
      });
    }

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    console.error("Get company by ID error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to fetch company",
      error: error.message,
    });
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await Company.update(req.body, {
      where: { id },
    });

    if (updated === 0) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found or nothing to update",
      });
    }

    const updatedCompany = await Company.findByPk(id);

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Update company error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to update company",
      error: error.message,
    });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Company.destroy({ where: { id } });

    if (!deleted) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        status: false,
        message: "Company not found",
      });
    }

    res.status(STATUS_CODE.OK).json({
      status: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Delete company error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};
