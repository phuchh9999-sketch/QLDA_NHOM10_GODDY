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
exports.createJob = async (req, res) => {
    try {
        const { clientId, title, department, salaryRange, feeRatePercent } = req.body;
        if (!clientId || !title) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn khách hàng và nhập tên vị trí!' });
        }

        const job = await Job.create({
            clientId,
            title: title.trim(),
            department: department ? department.trim() : 'Công nghệ thông tin',
            salaryRange: salaryRange || 'Thỏa thuận',
            feeRatePercent: parseFloat(feeRatePercent) || 18.0,
            status: 'Opening'
        });

        await AuditLog.create({
            userId: req.user ? req.user.id : null,
            action: 'CREATE_JOB',
            module: 'RECRUITMENT',
            details: `Đăng tuyển vị trí mới: ${job.title} (ID: ${job.id})`
        });

        res.status(201).json({ success: true, message: 'Tạo vị trí tuyển dụng thành công!', job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, department, salaryRange, feeRatePercent, status } = req.body;

        const job = await Job.findByPk(id);
        if (!job) return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí tuyển dụng!' });

        if (title) job.title = title.trim();
        if (department) job.department = department.trim();
        if (salaryRange) job.salaryRange = salaryRange;
        if (feeRatePercent) job.feeRatePercent = parseFloat(feeRatePercent);
        if (status) job.status = status;

        await job.save();
        res.json({ success: true, message: 'Cập nhật vị trí tuyển dụng thành công!', job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
