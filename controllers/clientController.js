const { Client, Job, Candidate, Placement, Invoice, Payment, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách khách hàng doanh nghiệp (có tìm kiếm & lọc)
exports.getClients = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } },
        { taxCode: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'All') {
      where.status = status;
    }

    const clients = await Client.findAll({
      where,
      include: [
        { model: Job, attributes: ['id', 'title', 'status'] },
        { model: Invoice, attributes: ['id', 'invoiceCode', 'totalAmount', 'remainingAmount', 'status'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ success: true, clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

