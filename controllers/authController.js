const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');
const { Op } = require('sequelize');

// Đăng nhập hệ thống
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên tài khoản và mật khẩu!' });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username.trim() },
          { email: username.trim() }
        ]
      }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.fullName, clientId: user.clientId },
      process.env.JWT_SECRET || 'goddy_secret_key_2026',
      { expiresIn: '7d' }
    );

    await AuditLog.create({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      details: `Người dùng ${user.fullName} (${user.role}) đăng nhập hệ thống thành công.`
    });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        clientId: user.clientId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
