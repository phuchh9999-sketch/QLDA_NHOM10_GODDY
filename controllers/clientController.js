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
// Lấy thông tin chi tiết một khách hàng
exports.getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findByPk(id, {
            include: [Job, Placement, Invoice]
        });

        if (!client) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }

        res.json({ success: true, client });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// Thêm mới khách hàng doanh nghiệp
exports.createClient = async (req, res) => {
    try {
        const { companyName, taxCode, address, contactPerson, contactEmail, contactPhone, paymentTermDays } = req.body;

        if (!companyName || !taxCode) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên công ty và mã số thuế!' });
        }

        // Kiểm tra định dạng mã số thuế (10 hoặc 13 số)
        const cleanTaxCode = taxCode.trim().replace('-', '');
        if (!/^\d{10}(\d{3})?$/.test(cleanTaxCode)) {
            return res.status(400).json({ success: false, message: 'Mã số thuế không hợp lệ! (Phải gồm 10 hoặc 13 chữ số)' });
        }
        // Kiểm tra trùng lặp MST
        const exist = await Client.findOne({ where: { taxCode: cleanTaxCode } });
        if (exist) {
            return res.status(400).json({ success: false, message: 'Mã số thuế này đã tồn tại trong hệ thống!' });
        }

        const newClient = await Client.create({
            companyName: companyName.trim(),
            taxCode: cleanTaxCode,
            address: address ? address.trim() : '',
            contactPerson: contactPerson ? contactPerson.trim() : '',
            contactEmail: contactEmail ? contactEmail.trim() : '',
            contactPhone: contactPhone ? contactPhone.trim() : '',
            paymentTermDays: parseInt(paymentTermDays) || 30,
            status: 'Active'
        });

        await AuditLog.create({
            userId: req.user ? req.user.id : null,
            action: 'CREATE_CLIENT',
            module: 'CLIENTS',
            details: `Thêm mới đối tác B2B: ${newClient.companyName} (MST: ${newClient.taxCode})`
        });

        res.status(201).json({ success: true, message: 'Thêm khách hàng thành công!', client: newClient });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
