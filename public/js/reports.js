/**
 * =========================================================
 * GODDY RECRUIT - Reports Module
 * FE-33
 * =========================================================
 *
 * FR-REP-01:
 * - Dashboard tổng quan công nợ
 *
 * FR-REP-02:
 * - Aging
 * - Cơ cấu công nợ theo tuổi nợ
 *
 * FR-REP-03:
 * - Top đối tác còn nợ / quá hạn
 *
 * FR-REP-04:
 * - Báo cáo hóa đơn
 * - Báo cáo công nợ
 * - Báo cáo thanh toán
 * - Lọc theo thời gian
 * - Lọc theo đối tác
 * - Xuất Excel
 * - In / Xuất PDF
 *
 * Không sửa debt.js / invoices.js.
 * Không tạo API backend mới.
 * =========================================================
 */

(function (window) {

    'use strict';


    // =======================================================
    // CONFIG
    // =======================================================

    const API_ENDPOINTS = {

        invoices:
            '/invoices',

        debt:
            '/debt/overview'

    };


    // =======================================================
    // STATE
    // =======================================================

    let invoices = [];

    let debtList = [];

    let debtSummary = {

        aging0to30:
            0,

        aging31to60:
            0,

        agingAbove60:
            0

    };


    let reportInitialized =
        false;


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {

        return document.getElementById(id);

    }


    function safeText(
        value,
        fallback = '-'
    ) {

        const text =
            String(
                value ?? ''
            ).trim();


        return (
            text ||
            fallback
        );

    }


    function safeNumber(value) {

        const number =
            Number(
                value
            );


        return Number.isFinite(
            number
        )
            ? number
            : 0;

    }


    function normalize(value) {

        return String(
            value ?? ''
        )
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            );

    }


    function escapeHtml(value) {

        return String(
            value ?? ''
        )
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );

    }


    function formatMoney(value) {

        if (
            typeof window.formatMoney ===
            'function'
        ) {

            return window.formatMoney(
                safeNumber(
                    value
                )
            );

        }


        return (
            safeNumber(
                value
            ).toLocaleString(
                'vi-VN'
            ) +
            ' đ'
        );

    }


    function formatDate(value) {

        if (!value) {

            return '-';

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return safeText(
                value
            );

        }


        return date.toLocaleDateString(
            'vi-VN'
        );

    }


    function parseDate(value) {

        if (!value) {

            return null;

        }


        const date =
            new Date(
                value
            );


        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    // =======================================================
    // API
    // =======================================================

    async function apiGet(
        endpoint
    ) {

        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                endpoint
            );

        }


        const response =
            await fetch(
                `/api${endpoint}`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // LOAD DATA
    // =======================================================

    async function loadReportData() {

        const results =
            await Promise.allSettled([

                apiGet(
                    API_ENDPOINTS.invoices
                ),

                apiGet(
                    API_ENDPOINTS.debt
                )

            ]);


        // ---------------------------------------------------
        // INVOICES
        // ---------------------------------------------------

        if (
            results[0].status ===
            'fulfilled'
        ) {

            const data =
                results[0].value;


            invoices =
                Array.isArray(
                    data?.invoices
                )
                    ? data.invoices
                    : [];

        } else {

            invoices =
                [];


            console.error(
                'FE-33: Không thể tải hóa đơn.',
                results[0].reason
            );

        }


        // ---------------------------------------------------
        // DEBT
        // ---------------------------------------------------

        if (
            results[1].status ===
            'fulfilled'
        ) {

            const data =
                results[1].value;


            debtList =
                Array.isArray(
                    data?.debtList
                )
                    ? data.debtList
                    : [];


            debtSummary = {

                aging0to30:
                    safeNumber(
                        data?.summary
                            ?.aging0to30
                    ),

                aging31to60:
                    safeNumber(
                        data?.summary
                            ?.aging31to60
                    ),

                agingAbove60:
                    safeNumber(
                        data?.summary
                            ?.agingAbove60
                    )

            };

        } else {

            debtList =
                [];


            debtSummary = {

                aging0to30:
                    0,

                aging31to60:
                    0,

                agingAbove60:
                    0

            };


            console.error(
                'FE-33: Không thể tải công nợ.',
                results[1].reason
            );

        }


        renderReports();

    }


    // =======================================================
    // REPORT PANEL
    // =======================================================

    function ensureReportsPanel() {

        const section =
            getElement(
                'section-debt'
            );


        if (!section) {

            return null;

        }


        let panel =
            getElement(
                'reportsPanel'
            );


        if (panel) {

            return panel;

        }


        panel =
            document.createElement(
                'section'
            );


        panel.id =
            'reportsPanel';


        panel.className =
            'table-box mt-4';


        panel.innerHTML = `

      <div
        class="box-header"
      >

        <div>

          <h3
            class="box-title"
          >

            <i
              class="fa-solid fa-file-chart-column text-primary me-2"
            ></i>

            Báo Cáo & Xuất Dữ Liệu

          </h3>


          <div
            class="text-muted small mt-1"
          >

            Lập báo cáo hóa đơn, công nợ và thanh toán
            theo thời gian và đối tác

          </div>

        </div>


        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          id="btnRefreshReports"
        >

          <i
            class="fa-solid fa-rotate me-1"
          ></i>

          Làm mới

        </button>

      </div>


      <!-- FILTER -->
      <div
        class="p-3"
      >

        <div
          class="report-filter-box"
        >

          <div>

            <label
              class="form-label small fw-bold mb-1"
            >
              Loại báo cáo
            </label>

            <select
              id="reportType"
              class="form-select"
            >

              <option value="summary">
                Tổng quan
              </option>

              <option value="invoices">
                Hóa đơn
              </option>

              <option value="debt">
                Công nợ
              </option>

              <option value="payments">
                Thanh toán
              </option>

            </select>

          </div>


          <div>

            <label
              class="form-label small fw-bold mb-1"
            >
              Từ ngày
            </label>

            <input
              type="date"
              id="reportFromDate"
              class="form-control"
            >

          </div>


          <div>

            <label
              class="form-label small fw-bold mb-1"
            >
              Đến ngày
            </label>

            <input
              type="date"
              id="reportToDate"
              class="form-control"
            >

          </div>


          <div>

            <label
              class="form-label small fw-bold mb-1"
            >
              Đối tác
            </label>

            <select
              id="reportPartner"
              class="form-select"
            >

              <option value="All">
                Tất cả đối tác
              </option>

            </select>

          </div>


          <div
            class="d-flex align-items-end gap-2"
          >

            <button
              type="button"
              class="btn btn-primary"
              id="btnApplyReport"
            >

              <i
                class="fa-solid fa-filter me-1"
              ></i>

              Lọc báo cáo

            </button>


            <button
              type="button"
              class="btn btn-outline-secondary"
              id="btnResetReport"
            >

              <i
                class="fa-solid fa-rotate-left"
              ></i>

            </button>

          </div>

        </div>

      </div>


      <!-- KPI -->
      <div
        id="reportKpiArea"
        class="px-3"
      ></div>


      <!-- AGING -->
      <div
        id="reportAgingArea"
        class="px-3"
      ></div>


      <!-- TOP PARTNERS -->
      <div
        id="reportTopPartnersArea"
        class="px-3"
      ></div>


      <!-- TABLE -->
      <div
        class="px-3 pt-3"
      >

        <div
          class="d-flex justify-content-between align-items-center mb-2"
        >

          <div
            id="reportResultText"
            class="small text-muted"
          >
            0 dòng dữ liệu
          </div>


          <div
            class="d-flex gap-2"
          >

            <button
              type="button"
              class="btn btn-sm btn-outline-success"
              id="btnExportReportExcel"
            >

              <i
                class="fa-solid fa-file-excel me-1"
              ></i>

              Xuất Excel

            </button>


            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              id="btnExportReportPdf"
            >

              <i
                class="fa-solid fa-file-pdf me-1"
              ></i>

              Xuất PDF

            </button>

          </div>

        </div>


        <div
          class="table-responsive"
        >

          <table
            class="table table-hover align-middle"
            id="reportResultTable"
          >

            <thead
              id="reportResultHead"
            ></thead>

            <tbody
              id="reportResultBody"
            ></tbody>

          </table>

        </div>

      </div>

    `;


        section.appendChild(
            panel
        );


        addReportStyles();

        bindReportEvents();


        reportInitialized =
            true;


        return panel;

    }


    // =======================================================
    // STYLES
    // =======================================================

    function addReportStyles() {

        if (
            getElement(
                'reportsModuleStyles'
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'reportsModuleStyles';


        style.textContent = `

      #reportsPanel .report-filter-box {

        display: grid;

        grid-template-columns:
          1.1fr
          1fr
          1fr
          1.3fr
          auto;

        gap: 12px;

        padding: 16px;

        border:
          1px solid #e2e8f0;

        border-radius: 14px;

        background:
          #f8fafc;

      }


      #reportsPanel .report-kpi {

        border:
          1px solid #e2e8f0;

        border-radius: 14px;

        background:
          #ffffff;

        padding: 18px;

        height:
          100%;

      }


      #reportsPanel .report-kpi-label {

        color:
          #64748b;

        font-size:
          12px;

        font-weight:
          700;

        text-transform:
          uppercase;

      }


      #reportsPanel .report-kpi-value {

        font-size:
          24px;

        font-weight:
          800;

        margin-top:
          6px;

        color:
          #0f172a;

      }


      #reportsPanel .report-aging {

        border:
          1px solid #e2e8f0;

        border-radius:
          14px;

        padding:
          16px;

        background:
          #ffffff;

        height:
          100%;

      }


      #reportsPanel .report-aging-value {

        font-size:
          22px;

        font-weight:
          800;

        margin-top:
          8px;

      }


      #reportsPanel .report-section-title {

        font-weight:
          800;

        color:
          #0f172a;

        margin-bottom:
          12px;

      }


      #reportsPanel .report-empty {

        padding:
          48px 20px;

        text-align:
          center;

        color:
          #64748b;

      }


      @media (max-width: 1100px) {

        #reportsPanel .report-filter-box {

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

        }

      }


      @media (max-width: 700px) {

        #reportsPanel .report-filter-box {

          grid-template-columns:
            1fr;

        }

      }

    `;


        document.head.appendChild(
            style
        );

    }


    // =======================================================
    // EVENTS
    // =======================================================

    function bindReportEvents() {

        getElement(
            'btnRefreshReports'
        )?.addEventListener(
            'click',
            loadReportData
        );


        getElement(
            'btnApplyReport'
        )?.addEventListener(
            'click',
            renderReports
        );


        getElement(
            'btnResetReport'
        )?.addEventListener(
            'click',
            resetReportFilters
        );


        getElement(
            'reportType'
        )?.addEventListener(
            'change',
            renderReports
        );


        getElement(
            'reportPartner'
        )?.addEventListener(
            'change',
            renderReports
        );


        getElement(
            'reportFromDate'
        )?.addEventListener(
            'change',
            renderReports
        );


        getElement(
            'reportToDate'
        )?.addEventListener(
            'change',
            renderReports
        );


        getElement(
            'btnExportReportExcel'
        )?.addEventListener(
            'click',
            exportReportExcel
        );


        getElement(
            'btnExportReportPdf'
        )?.addEventListener(
            'click',
            exportReportPdf
        );

    }


    // =======================================================
    // FILTER DATA
    // =======================================================

    function getSelectedPartner() {

        return (
            getElement(
                'reportPartner'
            )?.value ||
            'All'
        );

    }


    function getFromDate() {

        const value =
            getElement(
                'reportFromDate'
            )?.value ||
            '';


        if (!value) {

            return null;

        }


        const date =
            new Date(
                `${value}T00:00:00`
            );


        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    function getToDate() {

        const value =
            getElement(
                'reportToDate'
            )?.value ||
            '';


        if (!value) {

            return null;

        }


        const date =
            new Date(
                `${value}T23:59:59`
            );


        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    function getInvoicePartner(
        invoice
    ) {

        return safeText(
            invoice?.Client?.companyName,
            ''
        );

    }


    function getDebtPartner(
        item
    ) {

        return safeText(
            item?.Client?.companyName,
            ''
        );

    }


    function dateInRange(
        value
    ) {

        const date =
            parseDate(
                value
            );


        const from =
            getFromDate();


        const to =
            getToDate();


        if (!date) {

            if (
                !from &&
                !to
            ) {

                return true;

            }


            return false;

        }


        if (
            from &&
            date < from
        ) {

            return false;

        }


        if (
            to &&
            date > to
        ) {

            return false;

        }


        return true;

    }


    function partnerMatches(
        partnerName
    ) {

        const selected =
            getSelectedPartner();


        if (
            selected ===
            'All'
        ) {

            return true;

        }


        return (
            normalize(
                partnerName
            ) ===
            normalize(
                selected
            )
        );

    }


    function getFilteredInvoices() {

        return invoices.filter(
            function (invoice) {

                const partner =
                    getInvoicePartner(
                        invoice
                    );


                const date =
                    invoice?.issueDate ||
                    invoice?.dueDate;


                return (
                    partnerMatches(
                        partner
                    ) &&
                    dateInRange(
                        date
                    )
                );

            }
        );

    }


    function getFilteredDebt() {

        return debtList.filter(
            function (item) {

                const partner =
                    getDebtPartner(
                        item
                    );


                const date =
                    item?.dueDate;


                return (
                    partnerMatches(
                        partner
                    ) &&
                    dateInRange(
                        date
                    )
                );

            }
        );

    }


    // =======================================================
    // PARTNER SELECT
    // =======================================================

    function populatePartnerFilter() {

        const select =
            getElement(
                'reportPartner'
            );


        if (!select) {

            return;

        }


        const names =
            Array.from(
                new Set(
                    [
                        ...invoices.map(
                            getInvoicePartner
                        ),

                        ...debtList.map(
                            getDebtPartner
                        )

                    ]
                        .filter(
                            function (name) {

                                return Boolean(
                                    name
                                );

                            }
                        )
                )
            )
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return a.localeCompare(
                            b,
                            'vi'
                        );

                    }
                );


        const current =
            select.value ||
            'All';


        select.innerHTML = `

      <option value="All">
        Tất cả đối tác
      </option>

    `;


        names.forEach(
            function (name) {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    name;


                option.textContent =
                    name;


                select.appendChild(
                    option
                );

            }
        );


        if (
            names.includes(
                current
            )
        ) {

            select.value =
                current;

        } else {

            select.value =
                'All';

        }

    }


    // =======================================================
    // SUMMARY
    // =======================================================

    function calculateSummary(
        filteredInvoices,
        filteredDebt
    ) {

        const invoiced =
            filteredInvoices.reduce(
                function (
                    total,
                    invoice
                ) {

                    return (
                        total +
                        safeNumber(
                            invoice?.totalAmount
                        )
                    );

                },
                0
            );


        const paid =
            filteredInvoices.reduce(
                function (
                    total,
                    invoice
                ) {

                    return (
                        total +
                        safeNumber(
                            invoice?.paidAmount
                        )
                    );

                },
                0
            );


        const remaining =
            filteredInvoices.reduce(
                function (
                    total,
                    invoice
                ) {

                    return (
                        total +
                        safeNumber(
                            invoice?.remainingAmount
                        )
                    );

                },
                0
            );


        const overdue =
            filteredDebt.reduce(
                function (
                    total,
                    item
                ) {

                    return (
                        total +
                        (
                            safeNumber(
                                item?.overdueDays
                            ) > 0
                                ? safeNumber(
                                    item?.remainingAmount
                                )
                                : 0
                        )
                    );

                },
                0
            );


        return {

            invoiced,

            paid,

            remaining,

            overdue

        };

    }


    function renderKpis(
        summary
    ) {

        const area =
            getElement(
                'reportKpiArea'
            );


        if (!area) {

            return;

        }


        const collectionRate =
            summary.invoiced > 0
                ? (
                    summary.paid /
                    summary.invoiced *
                    100
                )
                : 0;


        const overdueRate =
            summary.remaining > 0
                ? (
                    summary.overdue /
                    summary.remaining *
                    100
                )
                : 0;


        area.innerHTML = `

      <div
        class="row g-3"
      >

        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Tổng hóa đơn
            </div>

            <div
              class="report-kpi-value text-primary"
            >
              ${formatMoney(
            summary.invoiced
        )}
            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Đã thanh toán
            </div>

            <div
              class="report-kpi-value text-success"
            >
              ${formatMoney(
            summary.paid
        )}
            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Còn phải thu
            </div>

            <div
              class="report-kpi-value text-danger"
            >
              ${formatMoney(
            summary.remaining
        )}
            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Tỷ lệ thu hồi
            </div>

            <div
              class="report-kpi-value text-success"
            >
              ${collectionRate.toFixed(
            1
        )}%
            </div>

          </div>

        </div>

      </div>


      <div
        class="row g-3 mt-1"
      >

        <div
          class="col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Nợ quá hạn
            </div>

            <div
              class="report-kpi-value text-danger"
            >
              ${formatMoney(
            summary.overdue
        )}
            </div>

          </div>

        </div>


        <div
          class="col-md-6"
        >

          <div
            class="report-kpi"
          >

            <div
              class="report-kpi-label"
            >
              Tỷ lệ quá hạn / còn phải thu
            </div>

            <div
              class="report-kpi-value text-warning"
            >
              ${overdueRate.toFixed(
            1
        )}%
            </div>

          </div>

        </div>

      </div>

    `;

    }


    // =======================================================
    // AGING
    // =======================================================

    function renderAging(
        filteredDebt
    ) {

        const area =
            getElement(
                'reportAgingArea'
            );


        if (!area) {

            return;

        }


        let age1 =
            0;

        let age2 =
            0;

        let age3 =
            0;


        filteredDebt.forEach(
            function (item) {

                const amount =
                    safeNumber(
                        item?.remainingAmount
                    );


                const days =
                    safeNumber(
                        item?.overdueDays
                    );


                if (
                    days >= 1 &&
                    days <= 30
                ) {

                    age1 +=
                        amount;

                } else if (
                    days >= 31 &&
                    days <= 60
                ) {

                    age2 +=
                        amount;

                } else if (
                    days > 60
                ) {

                    age3 +=
                        amount;

                }

            }
        );


        // Khi filter không có dữ liệu nhưng API có summary,
        // vẫn giữ đúng trạng thái 0 theo bộ lọc.

        area.innerHTML = `

      <div
        class="report-section-title mt-4"
      >

        <i
          class="fa-solid fa-chart-column text-danger me-2"
        ></i>

        Phân Tích Tuổi Nợ (Aging)

      </div>


      <div
        class="row g-3"
      >

        <div
          class="col-md-4"
        >

          <div
            class="report-aging border-danger"
          >

            <div
              class="text-danger fw-bold"
            >
              Quá hạn 1 - 30 ngày
            </div>


            <div
              class="report-aging-value text-danger"
            >
              ${formatMoney(
            age1
        )}
            </div>

          </div>

        </div>


        <div
          class="col-md-4"
        >

          <div
            class="report-aging border-warning"
          >

            <div
              class="text-warning fw-bold"
            >
              Quá hạn 31 - 60 ngày
            </div>


            <div
              class="report-aging-value text-warning"
            >
              ${formatMoney(
            age2
        )}
            </div>

          </div>

        </div>


        <div
          class="col-md-4"
        >

          <div
            class="report-aging"
          >

            <div
              class="fw-bold"
            >
              Nợ khó đòi &gt; 60 ngày
            </div>


            <div
              class="report-aging-value"
            >
              ${formatMoney(
            age3
        )}
            </div>

          </div>

        </div>

      </div>

    `;

    }


    // =======================================================
    // TOP PARTNERS
    // =======================================================

    function renderTopPartners(
        filteredDebt
    ) {

        const area =
            getElement(
                'reportTopPartnersArea'
            );


        if (!area) {

            return;

        }


        const grouped =
        {};


        filteredDebt.forEach(
            function (item) {

                const partner =
                    getDebtPartner(
                        item
                    );


                if (!partner) {

                    return;

                }


                if (
                    !grouped[partner]
                ) {

                    grouped[partner] = {

                        invoiceCount:
                            0,

                        remaining:
                            0,

                        overdue:
                            0

                    };

                }


                grouped[
                    partner
                ].invoiceCount +=
                    1;


                grouped[
                    partner
                ].remaining +=
                    safeNumber(
                        item?.remainingAmount
                    );


                if (
                    safeNumber(
                        item?.overdueDays
                    ) > 0
                ) {

                    grouped[
                        partner
                    ].overdue +=
                        safeNumber(
                            item?.remainingAmount
                        );

                }

            }
        );


        const topPartners =
            Object.entries(
                grouped
            )
                .map(
                    function (
                        [name, value]
                    ) {

                        return {

                            name,

                            ...value

                        };

                    }
                )
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return (
                            b.remaining -
                            a.remaining
                        );

                    }
                )
                .slice(
                    0,
                    5
                );


        if (
            topPartners.length ===
            0
        ) {

            area.innerHTML = '';

            return;

        }


        area.innerHTML = `

      <div
        class="report-section-title mt-4"
      >

        <i
          class="fa-solid fa-ranking-star text-warning me-2"
        ></i>

        Top 5 Đối Tác Còn Nợ

      </div>


      <div
        class="table-responsive"
      >

        <table
          class="table table-sm table-hover"
        >

          <thead>

            <tr>

              <th>#</th>

              <th>Đối tác</th>

              <th>Số hóa đơn</th>

              <th>Còn nợ</th>

              <th>Đã quá hạn</th>

            </tr>

          </thead>


          <tbody>

            ${topPartners
                .map(
                    function (
                        partner,
                        index
                    ) {

                        return `

                  <tr>

                    <td>
                      <span
                        class="badge bg-light text-dark border"
                      >
                        ${index + 1}
                      </span>
                    </td>


                    <td>

                      <strong>
                        ${escapeHtml(
                            partner.name
                        )}
                      </strong>

                    </td>


                    <td>
                      ${partner.invoiceCount}
                    </td>


                    <td
                      class="text-danger fw-bold"
                    >
                      ${formatMoney(
                            partner.remaining
                        )}
                    </td>


                    <td
                      class="text-warning fw-bold"
                    >
                      ${formatMoney(
                            partner.overdue
                        )}
                    </td>

                  </tr>

                `;

                    }
                )
                .join('')
            }

          </tbody>

        </table>

      </div>

    `;

    }


    // =======================================================
    // REPORT TABLE
    // =======================================================

    function renderReportTable(
        reportType,
        filteredInvoices,
        filteredDebt
    ) {

        const head =
            getElement(
                'reportResultHead'
            );


        const body =
            getElement(
                'reportResultBody'
            );


        const resultText =
            getElement(
                'reportResultText'
            );


        if (
            !head ||
            !body
        ) {

            return;

        }


        if (
            reportType ===
            'invoices'
        ) {

            renderInvoiceReport(
                head,
                body,
                resultText,
                filteredInvoices
            );


            return;

        }


        if (
            reportType ===
            'debt'
        ) {

            renderDebtReport(
                head,
                body,
                resultText,
                filteredDebt
            );


            return;

        }


        if (
            reportType ===
            'payments'
        ) {

            renderPaymentReport(
                head,
                body,
                resultText,
                filteredInvoices
            );


            return;

        }


        renderSummaryReport(
            head,
            body,
            resultText,
            filteredInvoices,
            filteredDebt
        );

    }


    function renderInvoiceReport(
        head,
        body,
        resultText,
        data
    ) {

        head.innerHTML = `

      <tr>

        <th>Mã Hóa Đơn</th>
        <th>Khách Hàng</th>
        <th>Ngày Lập</th>
        <th>Tổng Tiền</th>
        <th>Đã Trả</th>
        <th>Còn Nợ</th>
        <th>Trạng Thái</th>

      </tr>

    `;


        if (
            data.length ===
            0
        ) {

            renderEmptyReport(
                body,
                7
            );


            resultText.textContent =
                '0 hóa đơn';


            return;

        }


        body.innerHTML =
            data.map(
                function (invoice) {

                    return `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(
                        safeText(
                            invoice?.invoiceCode
                        )
                    )}
                  </strong>

                </td>


                <td>
                  ${escapeHtml(
                        getInvoicePartner(
                            invoice
                        )
                    )}
                </td>


                <td>
                  ${formatDate(
                        invoice?.issueDate
                    )}
                </td>


                <td>
                  ${formatMoney(
                        invoice?.totalAmount
                    )}
                </td>


                <td
                  class="text-success"
                >
                  ${formatMoney(
                        invoice?.paidAmount
                    )}
                </td>


                <td
                  class="text-danger fw-bold"
                >
                  ${formatMoney(
                        invoice?.remainingAmount
                    )}
                </td>


                <td>

                  <span
                    class="badge bg-light text-dark border"
                  >
                    ${escapeHtml(
                        safeText(
                            invoice?.status
                        )
                    )}
                  </span>

                </td>

              </tr>

            `;

                }
            )
                .join('');


        resultText.textContent =
            `${data.length} hóa đơn`;

    }


    function renderDebtReport(
        head,
        body,
        resultText,
        data
    ) {

        head.innerHTML = `

      <tr>

        <th>Hóa Đơn</th>
        <th>Khách Hàng</th>
        <th>Số Tiền Còn Nợ</th>
        <th>Hạn Trả</th>
        <th>Ngày Quá Hạn</th>
        <th>Phân Loại Tuổi Nợ</th>

      </tr>

    `;


        if (
            data.length ===
            0
        ) {

            renderEmptyReport(
                body,
                6
            );


            resultText.textContent =
                '0 khoản nợ';


            return;

        }


        body.innerHTML =
            data.map(
                function (item) {

                    return `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(
                        safeText(
                            item?.invoiceCode
                        )
                    )}
                  </strong>

                </td>


                <td>
                  ${escapeHtml(
                        getDebtPartner(
                            item
                        )
                    )}
                </td>


                <td
                  class="text-danger fw-bold"
                >
                  ${formatMoney(
                        item?.remainingAmount
                    )}
                </td>


                <td>
                  ${formatDate(
                        item?.dueDate
                    )}
                </td>


                <td>

                  ${safeNumber(
                        item?.overdueDays
                    ) > 0

                            ? `
                      <span
                        class="badge bg-danger"
                      >
                        ${safeNumber(
                                item?.overdueDays
                            )} ngày
                      </span>
                    `

                            : `
                      <span
                        class="badge bg-success"
                      >
                        Trong hạn
                      </span>
                    `
                        }

                </td>


                <td>
                  ${escapeHtml(
                            safeText(
                                item?.agingCategory
                            )
                        )}
                </td>

              </tr>

            `;

                }
            )
                .join('');


        resultText.textContent =
            `${data.length} khoản nợ`;

    }


    function renderPaymentReport(
        head,
        body,
        resultText,
        data
    ) {

        head.innerHTML = `

      <tr>

        <th>Mã Hóa Đơn</th>
        <th>Khách Hàng</th>
        <th>Ngày</th>
        <th>Giá Trị Hóa Đơn</th>
        <th>Đã Thanh Toán</th>
        <th>Tỷ Lệ Thanh Toán</th>

      </tr>

    `;


        if (
            data.length ===
            0
        ) {

            renderEmptyReport(
                body,
                6
            );


            resultText.textContent =
                '0 giao dịch hóa đơn';


            return;

        }


        body.innerHTML =
            data.map(
                function (invoice) {

                    const total =
                        safeNumber(
                            invoice?.totalAmount
                        );


                    const paid =
                        safeNumber(
                            invoice?.paidAmount
                        );


                    const ratio =
                        total > 0
                            ? (
                                paid /
                                total *
                                100
                            )
                            : 0;


                    return `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(
                        safeText(
                            invoice?.invoiceCode
                        )
                    )}
                  </strong>

                </td>


                <td>
                  ${escapeHtml(
                        getInvoicePartner(
                            invoice
                        )
                    )}
                </td>


                <td>
                  ${formatDate(
                        invoice?.issueDate
                    )}
                </td>


                <td>
                  ${formatMoney(
                        total
                    )}
                </td>


                <td
                  class="text-success fw-bold"
                >
                  ${formatMoney(
                        paid
                    )}
                </td>


                <td>

                  <div
                    class="fw-bold"
                  >
                    ${ratio.toFixed(
                        1
                    )}%
                  </div>

                </td>

              </tr>

            `;

                }
            )
                .join('');


        resultText.textContent =
            `${data.length} dòng thanh toán`;

    }


    function renderSummaryReport(
        head,
        body,
        resultText,
        filteredInvoices,
        filteredDebt
    ) {

        head.innerHTML = `

      <tr>

        <th>Chỉ Tiêu</th>
        <th>Giá Trị</th>
        <th>Ghi Chú</th>

      </tr>

    `;


        const summary =
            calculateSummary(
                filteredInvoices,
                filteredDebt
            );


        const rows = [

            [
                'Tổng giá trị hóa đơn',
                formatMoney(
                    summary.invoiced
                ),
                `${filteredInvoices.length} hóa đơn`
            ],

            [
                'Đã thanh toán',
                formatMoney(
                    summary.paid
                ),
                'Tổng paidAmount'
            ],

            [
                'Còn phải thu',
                formatMoney(
                    summary.remaining
                ),
                'Tổng remainingAmount'
            ],

            [
                'Nợ quá hạn',
                formatMoney(
                    summary.overdue
                ),
                `${filteredDebt.length} khoản công nợ`
            ],

            [
                'Aging 1 - 30 ngày',
                formatMoney(
                    calculateAgingByDays(
                        filteredDebt,
                        1,
                        30
                    )
                ),
                'Công nợ quá hạn'
            ],

            [
                'Aging 31 - 60 ngày',
                formatMoney(
                    calculateAgingByDays(
                        filteredDebt,
                        31,
                        60
                    )
                ),
                'Công nợ quá hạn'
            ],

            [
                'Aging > 60 ngày',
                formatMoney(
                    calculateAgingByDays(
                        filteredDebt,
                        61,
                        Infinity
                    )
                ),
                'Công nợ khó đòi'
            ]

        ];


        body.innerHTML =
            rows.map(
                function (row) {

                    return `

              <tr>

                <td>
                  <strong>
                    ${escapeHtml(
                        row[0]
                    )}
                  </strong>
                </td>


                <td
                  class="fw-bold text-primary"
                >
                  ${escapeHtml(
                        row[1]
                    )}
                </td>


                <td
                  class="text-muted"
                >
                  ${escapeHtml(
                        row[2]
                    )}
                </td>

              </tr>

            `;

                }
            )
                .join('');


        resultText.textContent =
            `${rows.length} chỉ tiêu`;

    }


    function calculateAgingByDays(
        data,
        min,
        max
    ) {

        return data.reduce(
            function (
                total,
                item
            ) {

                const days =
                    safeNumber(
                        item?.overdueDays
                    );


                if (
                    days >= min &&
                    days <= max
                ) {

                    return (
                        total +
                        safeNumber(
                            item?.remainingAmount
                        )
                    );

                }


                return total;

            },
            0
        );

    }


    function renderEmptyReport(
        body,
        colspan
    ) {

        body.innerHTML = `

      <tr>

        <td
          colspan="${colspan}"
        >

          <div
            class="report-empty"
          >

            <div
              style="
                width:60px;
                height:60px;
                margin:0 auto 16px;
                border-radius:16px;
                background:#f1f5f9;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:24px;
                color:#94a3b8;
              "
            >

              <i
                class="fa-solid fa-file-circle-xmark"
              ></i>

            </div>


            <div
              class="fw-bold text-dark mb-1"
            >
              Chưa có dữ liệu báo cáo
            </div>


            <div>
              Không có dữ liệu phù hợp với bộ lọc hiện tại.
            </div>

          </div>

        </td>

      </tr>

    `;

    }


    // =======================================================
    // MAIN RENDER
    // =======================================================

    function renderReports() {

        ensureReportsPanel();


        populatePartnerFilter();


        const reportType =
            getElement(
                'reportType'
            )?.value ||
            'summary';


        const filteredInvoices =
            getFilteredInvoices();


        const filteredDebt =
            getFilteredDebt();


        const summary =
            calculateSummary(
                filteredInvoices,
                filteredDebt
            );


        renderKpis(
            summary
        );


        renderAging(
            filteredDebt
        );


        renderTopPartners(
            filteredDebt
        );


        renderReportTable(
            reportType,
            filteredInvoices,
            filteredDebt
        );

    }


    // =======================================================
    // RESET
    // =======================================================

    function resetReportFilters() {

        const type =
            getElement(
                'reportType'
            );


        const from =
            getElement(
                'reportFromDate'
            );


        const to =
            getElement(
                'reportToDate'
            );


        const partner =
            getElement(
                'reportPartner'
            );


        if (type) {

            type.value =
                'summary';

        }


        if (from) {

            from.value =
                '';

        }


        if (to) {

            to.value =
                '';

        }


        if (partner) {

            partner.value =
                'All';

        }


        renderReports();

    }


    // =======================================================
    // EXPORT EXCEL
    // =======================================================

    function exportReportExcel() {

        const table =
            getElement(
                'reportResultTable'
            );


        if (!table) {

            alert(
                'Không tìm thấy bảng báo cáo.'
            );

            return;

        }


        const reportType =
            getElement(
                'reportType'
            )?.value ||
            'summary';


        const typeName = {

            summary:
                'Tong_Quan',

            invoices:
                'Hoa_Don',

            debt:
                'Cong_No',

            payments:
                'Thanh_Toan'

        }[
            reportType
        ] || 'Bao_Cao';


        const html =
            `

<!DOCTYPE html>

<html lang="vi">

<head>

  <meta charset="UTF-8">

  <style>

    body {
      font-family: Arial, sans-serif;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      border: 1px solid #cccccc;
      padding: 8px;
    }

    th {
      font-weight: bold;
      background: #f2f2f2;
    }

  </style>

</head>

<body>

  <h2>GODDY RECRUIT - Báo cáo ${typeName}</h2>

  ${table.outerHTML}

</body>

</html>

`;


        const blob =
            new Blob(
                [
                    '\ufeff',
                    html
                ],
                {
                    type:
                        'application/vnd.ms-excel'
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                'a'
            );


        link.href =
            url;


        link.download =
            `GODDY_Bao_Cao_${typeName}.xls`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    // =======================================================
    // EXPORT PDF
    // =======================================================

    function exportReportPdf() {

        const table =
            getElement(
                'reportResultTable'
            );


        if (!table) {

            alert(
                'Không tìm thấy bảng báo cáo.'
            );

            return;

        }


        const reportType =
            getElement(
                'reportType'
            )?.value ||
            'summary';


        const typeName = {

            summary:
                'Tổng Quan',

            invoices:
                'Hóa Đơn',

            debt:
                'Công Nợ',

            payments:
                'Thanh Toán'

        }[
            reportType
        ] || 'Báo Cáo';


        const popup =
            window.open(
                '',
                '_blank',
                'width=1200,height=800'
            );


        if (!popup) {

            alert(
                'Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup cho trang này.'
            );

            return;

        }


        const kpi =
            getElement(
                'reportKpiArea'
            );


        const aging =
            getElement(
                'reportAgingArea'
            );


        const topPartners =
            getElement(
                'reportTopPartnersArea'
            );


        popup.document.open();


        popup.document.write(`

<!DOCTYPE html>

<html lang="vi">

<head>

  <meta charset="UTF-8">

  <title>
    GODDY RECRUIT - ${escapeHtml(
            typeName
        )}
  </title>


  <style>

    * {
      box-sizing: border-box;
    }


    body {

      font-family:
        Arial,
        sans-serif;

      margin:
        32px;

      color:
        #0f172a;

    }


    h1 {

      margin:
        0 0 4px;

      font-size:
        24px;

    }


    .subtitle {

      color:
        #64748b;

      margin-bottom:
        24px;

    }


    .report-grid {

      display:
        grid;

      grid-template-columns:
        repeat(4, 1fr);

      gap:
        12px;

      margin-bottom:
        20px;

    }


    .card {

      border:
        1px solid #dbe1e8;

      border-radius:
        10px;

      padding:
        14px;

    }


    .label {

      font-size:
        11px;

      font-weight:
        700;

      text-transform:
        uppercase;

      color:
        #64748b;

    }


    .value {

      font-size:
        20px;

      font-weight:
        800;

      margin-top:
        6px;

    }


    .section {

      margin-top:
        24px;

    }


    .section h2 {

      font-size:
        17px;

      margin-bottom:
        10px;

    }


    table {

      width:
        100%;

      border-collapse:
        collapse;

      margin-top:
        10px;

    }


    th,
    td {

      border:
        1px solid #d1d5db;

      padding:
        8px;

      text-align:
        left;

    }


    th {

      background:
        #f8fafc;

    }


    @media print {

      body {

        margin:
          12mm;

      }


      .no-print {

        display:
          none;

      }

    }

  </style>

</head>


<body>

  <h1>
    GODDY RECRUIT - Báo Cáo ${escapeHtml(
            typeName
        )}
  </h1>


  <div
    class="subtitle"
  >
    Báo cáo được tạo từ dữ liệu Frontend hiện tại
  </div>


  <div
    class="section"
  >

    ${kpi?.innerHTML || ''}

  </div>


  <div
    class="section"
  >

    ${aging?.innerHTML || ''}

  </div>


  <div
    class="section"
  >

    ${topPartners?.innerHTML || ''}

  </div>


  <div
    class="section"
  >

    <h2>
      Chi tiết báo cáo
    </h2>

    ${table.outerHTML}

  </div>


  <script>

    window.onload = function () {

      setTimeout(
        function () {

          window.print();

        },
        250
      );

    };

  <\/script>


</body>

</html>

`);


        popup.document.close();

    }


    // =======================================================
    // GLOBAL
    // =======================================================

    window.GoddyReports = {

        initialize:
            function () {

                ensureReportsPanel();

                loadReportData();

            },

        reload:
            loadReportData,

        render:
            renderReports,

        exportExcel:
            exportReportExcel,

        exportPdf:
            exportReportPdf

    };


    // =======================================================
    // INIT
    // =======================================================

    function initialize() {

        ensureReportsPanel();

        loadReportData();

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initialize
        );

    } else {

        initialize();

    }


})(window);