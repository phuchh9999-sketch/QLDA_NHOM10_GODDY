const { Invoice, Placement, Client, Payment, Candidate, Job } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const allInvoices = await Invoice.findAll({
      where: { status: { [Op.ne]: 'Cancelled' } },
      include: [Client]
    });
    const allPlacements = await Placement.findAll();
    const allClients = await Client.findAll();
    const allPayments = await Payment.findAll({ order: [['paymentDate', 'ASC']] });

    let totalRevenue = 0; // Da thu thuc te
    let totalAR = 0;      // Tong no phai thu con lai
    let overdueAR = 0;    // No da qua han

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allInvoices.forEach(inv => {
      totalRevenue += parseFloat(inv.paidAmount || 0);
      const remaining = parseFloat(inv.remainingAmount || 0);
      totalAR += remaining;

      if (remaining > 0 && new Date(inv.dueDate) < today) {
        overdueAR += remaining;
      }
    });

    