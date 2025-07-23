const { EmployeeAddress } = require("../models");
const { StatusCodes } = require("http-status-codes");

module.exports = {
  // Create Employee Address
  createEmployeeAddress: async (req, res) => {
    try {
      const data = req.body;
      const newAddress = await EmployeeAddress.create(data);
      return res.status(StatusCodes.CREATED).json({
        message: "Employee address created successfully",
        data: newAddress,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to create employee address",
        error: error.message,
      });
    }
  },

  // Get All Addresses
  getAllEmployeeAddresses: async (req, res) => {
    try {
      const addresses = await EmployeeAddress.findAll();
      return res.status(StatusCodes.OK).json(addresses);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch addresses",
        error: error.message,
      });
    }
  },

  // Get Address by ID
  getEmployeeAddressById: async (req, res) => {
    try {
      const { id } = req.params;
      const address = await EmployeeAddress.findByPk(id);
      if (!address) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: "Address not found",
        });
      }
      return res.status(StatusCodes.OK).json(address);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch address",
        error: error.message,
      });
    }
  },

  // Update Address
  updateEmployeeAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [updated] = await EmployeeAddress.update(data, {
        where: { id },
      });

      if (!updated) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: "Address not found or not updated",
        });
      }

      const updatedAddress = await EmployeeAddress.findByPk(id);

      return res.status(StatusCodes.OK).json({
        message: "Address updated successfully",
        data: updatedAddress,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to update address",
        error: error.message,
      });
    }
  },

  // Delete Address
  deleteEmployeeAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await EmployeeAddress.destroy({
        where: { id },
      });

      if (!deleted) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: "Address not found or already deleted",
        });
      }

      return res.status(StatusCodes.OK).json({
        message: "Address deleted successfully",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to delete address",
        error: error.message,
      });
    }
  },
};
