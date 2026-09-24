const { Job, Candidate, Placement, Client, User, Invoice, AuditLog } = require('../models');

// =================== 1. QUẢN LÝ JOBS (VỊ TRÍ TUYỂN DỤNG) ===================
exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      include: [{ model: Client, attributes: ['id', 'companyName', 'taxCode'] }],
      order: [['id', 'DESC']]
    });
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

