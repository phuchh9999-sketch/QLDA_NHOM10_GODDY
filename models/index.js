/**
 * =========================================================
 * GODDY RECRUIT - Sequelize Models
 * =========================================================
 *
 * Các model:
 * - User
 * - Client
 * - Job
 * - Candidate
 * - Placement
 * - Invoice
 * - Payment
 * - AuditLog
 *
 * Thiết kế bám theo:
 * - server.js
 * - config/seed.js
 * - controllers/*
 * - routes/*
 *
 * Database connection:
 * ../config/db.js
 * =========================================================
 */

const {
    DataTypes
} = require('sequelize');


const sequelize =
    require('../config/db');


// =========================================================
// 1. USER
// =========================================================

const User =
    sequelize.define(
        'User',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            username: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false,

                unique:
                    true

            },


            email: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                unique:
                    true,

                validate: {

                    isEmail:
                        true

                }

            },


            password: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            fullName: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            role: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'recruiter'

            },


            isActive: {

                type:
                    DataTypes.BOOLEAN,

                allowNull:
                    false,

                defaultValue:
                    true

            },


            clientId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    true

            }

        },

        {

            tableName:
                'Users',

            timestamps:
                true

        }
    );


// =========================================================
// 2. CLIENT
// =========================================================

const Client =
    sequelize.define(
        'Client',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            companyName: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            taxCode: {

                type:
                    DataTypes.STRING(20),

                allowNull:
                    false,

                unique:
                    true

            },


            address: {

                type:
                    DataTypes.STRING(500),

                allowNull:
                    false,

                defaultValue:
                    ''

            },


            contactPerson: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                defaultValue:
                    ''

            },


            contactEmail: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                defaultValue:
                    ''

            },


            contactPhone: {

                type:
                    DataTypes.STRING(30),

                allowNull:
                    false,

                defaultValue:
                    ''

            },


            paymentTermDays: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false,

                defaultValue:
                    30

            },


            status: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'Active'

            }

        },

        {

            tableName:
                'Clients',

            timestamps:
                true

        }
    );


// =========================================================
// 3. JOB
// =========================================================

const Job =
    sequelize.define(
        'Job',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            clientId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            title: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            department: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                defaultValue:
                    'Công nghệ thông tin'

            },


            salaryRange: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                defaultValue:
                    'Thỏa thuận'

            },


            feeRatePercent: {

                type:
                    DataTypes.DECIMAL(5, 2),

                allowNull:
                    false,

                defaultValue:
                    18.0

            },


            status: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'Opening'

            }

        },

        {

            tableName:
                'Jobs',

            timestamps:
                true

        }
    );


// =========================================================
// 4. CANDIDATE
// =========================================================

const Candidate =
    sequelize.define(
        'Candidate',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            fullName: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            email: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false

            },


            phone: {

                type:
                    DataTypes.STRING(30),

                allowNull:
                    false,

                defaultValue:
                    ''

            },


            currentPosition: {

                type:
                    DataTypes.STRING(255),

                allowNull:
                    false,

                defaultValue:
                    'Chuyên viên'

            },


            status: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'Available'

            }

        },

        {

            tableName:
                'Candidates',

            timestamps:
                true

        }
    );


// =========================================================
// 5. PLACEMENT
// =========================================================

const Placement =
    sequelize.define(
        'Placement',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            jobId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            candidateId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            clientId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            recruiterId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            officialSalary: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false

            },


            serviceFee: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false

            },


            onboardDate: {

                type:
                    DataTypes.DATEONLY,

                allowNull:
                    false

            },


            warrantyDays: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false,

                defaultValue:
                    60

            },


            warrantyEndDate: {

                type:
                    DataTypes.DATEONLY,

                allowNull:
                    false

            },


            status: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'UnderWarranty'

            }

        },

        {

            tableName:
                'Placements',

            timestamps:
                true

        }
    );


// =========================================================
// 6. INVOICE
// =========================================================

const Invoice =
    sequelize.define(
        'Invoice',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            invoiceCode: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false,

                unique:
                    true

            },


            clientId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            placementId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    true

            },


            subtotal: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false,

                defaultValue:
                    0

            },


            vatRate: {

                type:
                    DataTypes.DECIMAL(5, 2),

                allowNull:
                    false,

                defaultValue:
                    8.0

            },


            vatAmount: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false,

                defaultValue:
                    0

            },


            totalAmount: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false,

                defaultValue:
                    0

            },


            paidAmount: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false,

                defaultValue:
                    0

            },


            remainingAmount: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false,

                defaultValue:
                    0

            },


            issueDate: {

                type:
                    DataTypes.DATEONLY,

                allowNull:
                    false

            },


            dueDate: {

                type:
                    DataTypes.DATEONLY,

                allowNull:
                    false

            },


            status: {

                type:
                    DataTypes.STRING(50),

                allowNull:
                    false,

                defaultValue:
                    'Sent'

            }

        },

        {

            tableName:
                'Invoices',

            timestamps:
                true

        }
    );


// =========================================================
// 7. PAYMENT
// =========================================================

const Payment =
    sequelize.define(
        'Payment',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            invoiceId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    false

            },


            amount: {

                type:
                    DataTypes.DECIMAL(15, 2),

                allowNull:
                    false

            },


            paymentDate: {

                type:
                    DataTypes.DATEONLY,

                allowNull:
                    false

            },


            paymentMethod: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false,

                defaultValue:
                    'BankTransfer'

            },


            referenceCode: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false

            },


            notes: {

                type:
                    DataTypes.TEXT,

                allowNull:
                    false,

                defaultValue:
                    ''

            }

        },

        {

            tableName:
                'Payments',

            timestamps:
                true

        }
    );


// =========================================================
// 8. AUDIT LOG
// =========================================================

const AuditLog =
    sequelize.define(
        'AuditLog',
        {

            id: {

                type:
                    DataTypes.INTEGER,

                primaryKey:
                    true,

                autoIncrement:
                    true

            },


            userId: {

                type:
                    DataTypes.INTEGER,

                allowNull:
                    true

            },


            action: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false

            },


            module: {

                type:
                    DataTypes.STRING(100),

                allowNull:
                    false

            },


            details: {

                type:
                    DataTypes.TEXT,

                allowNull:
                    false,

                defaultValue:
                    ''

            }

        },

        {

            tableName:
                'AuditLogs',

            timestamps:
                true

        }
    );


// =========================================================
// ASSOCIATIONS
// =========================================================


// ---------------- USER / CLIENT ----------------

Client.hasMany(
    User,
    {
        foreignKey:
            'clientId'
    }
);


User.belongsTo(
    Client,
    {
        foreignKey:
            'clientId'
    }
);


// ---------------- CLIENT / JOB ----------------

Client.hasMany(
    Job,
    {
        foreignKey:
            'clientId'
    }
);


Job.belongsTo(
    Client,
    {
        foreignKey:
            'clientId'
    }
);


// ---------------- CLIENT / PLACEMENT ----------------

Client.hasMany(
    Placement,
    {
        foreignKey:
            'clientId'
    }
);


Placement.belongsTo(
    Client,
    {
        foreignKey:
            'clientId'
    }
);


// ---------------- CLIENT / INVOICE ----------------

Client.hasMany(
    Invoice,
    {
        foreignKey:
            'clientId'
    }
);


Invoice.belongsTo(
    Client,
    {
        foreignKey:
            'clientId'
    }
);


// ---------------- JOB / PLACEMENT ----------------

Job.hasMany(
    Placement,
    {
        foreignKey:
            'jobId'
    }
);


Placement.belongsTo(
    Job,
    {
        foreignKey:
            'jobId'
    }
);


// ---------------- CANDIDATE / PLACEMENT ----------------

Candidate.hasMany(
    Placement,
    {
        foreignKey:
            'candidateId'
    }
);


Placement.belongsTo(
    Candidate,
    {
        foreignKey:
            'candidateId'
    }
);


// ---------------- USER / PLACEMENT ----------------

User.hasMany(
    Placement,
    {
        foreignKey:
            'recruiterId',

        as:
            'placements'
    }
);


Placement.belongsTo(
    User,
    {
        foreignKey:
            'recruiterId',

        as:
            'recruiter'
    }
);


// ---------------- PLACEMENT / INVOICE ----------------

Placement.hasOne(
    Invoice,
    {
        foreignKey:
            'placementId'
    }
);


Invoice.belongsTo(
    Placement,
    {
        foreignKey:
            'placementId'
    }
);


// ---------------- INVOICE / PAYMENT ----------------

Invoice.hasMany(
    Payment,
    {
        foreignKey:
            'invoiceId'
    }
);


Payment.belongsTo(
    Invoice,
    {
        foreignKey:
            'invoiceId'
    }
);


// ---------------- USER / AUDIT ----------------

User.hasMany(
    AuditLog,
    {
        foreignKey:
            'userId'
    }
);


AuditLog.belongsTo(
    User,
    {
        foreignKey:
            'userId'
    }
);


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    sequelize,

    User,

    Client,

    Job,

    Candidate,

    Placement,

    Invoice,

    Payment,

    AuditLog

};