const { Invoice, Client, Placement, Candidate, Job, Payment, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách hóa đơn (có lọc theo trạng thái và tìm kiếm)
exports.getInvoices = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search) {
      where.invoiceCode = { [Op.like]: `%${search}%` };
    }

    const invoices = await Invoice.findAll({
      where,
      include: [
        { model: Client, attributes: ['id', 'companyName', 'taxCode', 'address', 'contactPerson', 'paymentTermDays'] },
        {
          model: Placement,
          include: [
            { model: Candidate, attributes: ['id', 'fullName', 'email'] },
            { model: Job, attributes: ['id', 'title'] }
          ]
        },
        { model: Payment }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ success: true, invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Lấy chi tiết một hóa đơn
exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id, {
            include: [
                { model: Client },
                {
                    model: Placement,
                    include: [{ model: Candidate }, { model: Job }]
                },
                { model: Payment, order: [['id', 'DESC']] }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn!' });
        }

        res.json({ success: true, invoice });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// Phát hành hóa đơn dịch vụ từ Deal tuyển dụng
exports.createInvoiceFromPlacement = async (req, res) => {
    try {
        const { placementId, vatRate, dueDate, customNote } = req.body;

        const placement = await Placement.findByPk(placementId, {
            include: [Client, Job, Candidate]
        });

        if (!placement) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin deal tuyển dụng!' });
        }

