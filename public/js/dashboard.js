/**
 * =========================================================
 * GODDY RECRUIT - Dashboard Module
 * FE-13 / FE-14
 * =========================================================
 *
 * FE-13:
 * - Tải KPI Dashboard
 * - Loading / Error / Empty state
 * - Top 5 doanh nghiệp công nợ
 *
 * FE-14:
 * - Tối ưu Line Chart doanh thu
 * - Tối ưu Doughnut Chart cơ cấu ngành
 * - Responsive khi resize
 * - Tooltip rõ ràng
 * - Empty state khi không có dữ liệu biểu đồ
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    function setText(id, value) {
        const element = getElement(id);

        if (element) {
            element.textContent = value;
        }
    }


    function safeNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function formatPercent(value) {
        return safeNumber(value) + '%';
    }


    function formatMoneySafe(value) {

        if (typeof window.formatMoney === 'function') {
            return window.formatMoney(
                safeNumber(value)
            );
        }

        return (
            safeNumber(value).toLocaleString('vi-VN') +
            ' đ'
        );
    }


    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // =======================================================
    // DASHBOARD UI STATE
    // =======================================================

    function showDashboardLoading() {

        const targets = [
            'valTotalRevenue',
            'valTotalAR',
            'valOverdueAR',
            'valPlacementCount',
            'valCollectionRate',
            'valBadDebtRate'
        ];

        targets.forEach(function (id) {

            const element =
                getElement(id);

            if (element) {
                element.classList.add(
                    'placeholder-glow'
                );
            }

        });

    }


    function hideDashboardLoading() {

        const targets = [
            'valTotalRevenue',
            'valTotalAR',
            'valOverdueAR',
            'valPlacementCount',
            'valCollectionRate',
            'valBadDebtRate'
        ];

        targets.forEach(function (id) {

            const element =
                getElement(id);

            if (element) {
                element.classList.remove(
                    'placeholder-glow'
                );
            }

        });

    }


    function showDashboardError(message) {

        const existing =
            getElement('dashboardErrorAlert');

        if (existing) {
            existing.remove();
        }


        const dashboardSection =
            getElement('section-dashboard');

        if (!dashboardSection) {
            return;
        }


        const alert =
            document.createElement('div');

        alert.id =
            'dashboardErrorAlert';

        alert.className =
            'alert alert-warning d-flex align-items-start gap-2 mt-3';

        alert.innerHTML = `
      <i class="fa-solid fa-circle-exclamation mt-1"></i>

      <div>
        <div class="fw-bold">
          Không thể tải dữ liệu Dashboard
        </div>

        <div class="small">
          ${escapeHtml(
            message ||
            'Vui lòng kiểm tra kết nối tới máy chủ.'
        )}
        </div>
      </div>
    `;

        dashboardSection.prepend(
            alert
        );

    }


    function clearDashboardError() {

        const existing =
            getElement('dashboardErrorAlert');

        if (existing) {
            existing.remove();
        }

    }


    // =======================================================
    // KPI
    // =======================================================

    function renderKpis(stats = {}) {

        setText(
            'valTotalRevenue',
            formatMoneySafe(
                stats.totalRevenue
            )
        );


        setText(
            'valTotalAR',
            formatMoneySafe(
                stats.totalAR
            )
        );


        setText(
            'valOverdueAR',
            formatMoneySafe(
                stats.overdueAR
            )
        );


        setText(
            'valPlacementCount',
            safeNumber(
                stats.placementCount
            ) + ' Deals'
        );


        setText(
            'valCollectionRate',
            formatPercent(
                stats.collectionRate
            )
        );


        setText(
            'valBadDebtRate',
            formatPercent(
                stats.badDebtRate
            )
        );

    }


    // =======================================================
    // TOP DEBTORS
    // =======================================================

    function renderTopDebtors(topDebtors) {

        const tbody =
            getElement(
                'topDebtorsTableBody'
            );

        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(topDebtors)
                ? topDebtors
                : [];


        if (items.length === 0) {

            tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="text-center text-muted py-4"
          >
            <i class="fa-solid fa-circle-check me-1"></i>
            Hiện không có công nợ tồn đọng!
          </td>
        </tr>
      `;

            return;
        }


        tbody.innerHTML =
            items
                .slice(0, 5)
                .map(function (item) {

                    return `
            <tr>
              <td>
                <strong>
                  ${escapeHtml(
                        item.companyName
                    )}
                </strong>
              </td>

              <td>
                <code>
                  ${escapeHtml(
                        item.taxCode
                    )}
                </code>
              </td>

              <td>
                <span class="badge bg-secondary">
                  ${safeNumber(
                        item.invoiceCount
                    )}
                  hóa đơn
                </span>
              </td>

              <td class="text-danger fw-bold">
                ${formatMoneySafe(
                        item.totalRemaining
                    )}
              </td>

              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  onclick="switchTab('debt')"
                >
                  <i class="fa-solid fa-eye me-1"></i>
                  Xem Chi Tiết
                </button>
              </td>
            </tr>
          `;

                })
                .join('');

    }


    // =======================================================
    // CHART EMPTY STATE
    // =======================================================

    function showChartEmptyState(
        canvas,
        message
    ) {

        if (!canvas) {
            return;
        }


        const parent =
            canvas.parentElement;

        if (!parent) {
            return;
        }


        let empty =
            parent.querySelector(
                '.dashboard-chart-empty'
            );


        if (!empty) {

            empty =
                document.createElement(
                    'div'
                );

            empty.className =
                'dashboard-chart-empty ui-empty';

            parent.appendChild(
                empty
            );
        }


        empty.innerHTML = `
      <div class="ui-empty-icon">
        <i class="fa-solid fa-chart-simple"></i>
      </div>

      <div class="ui-empty-title">
        Chưa có dữ liệu biểu đồ
      </div>

      <div class="ui-empty-text">
        ${escapeHtml(
            message ||
            'Chưa có dữ liệu để hiển thị.'
        )}
      </div>
    `;


        canvas.style.display =
            'none';

    }


    function hideChartEmptyState(
        canvas
    ) {

        if (!canvas) {
            return;
        }


        const parent =
            canvas.parentElement;

        if (!parent) {
            return;
        }


        const empty =
            parent.querySelector(
                '.dashboard-chart-empty'
            );


        if (empty) {
            empty.remove();
        }


        canvas.style.display =
            'block';

    }


    // =======================================================
    // DESTROY CHARTS
    // =======================================================

    function destroyExistingCharts() {

        if (
            window.revenueChartInstance &&
            typeof window.revenueChartInstance.destroy ===
            'function'
        ) {

            window.revenueChartInstance.destroy();

            window.revenueChartInstance =
                null;
        }


        if (
            window.industryChartInstance &&
            typeof window.industryChartInstance.destroy ===
            'function'
        ) {

            window.industryChartInstance.destroy();

            window.industryChartInstance =
                null;
        }

    }


    // =======================================================
    // REVENUE CHART
    // =======================================================

    function createRevenueChart(
        chartData
    ) {

        const canvas =
            getElement(
                'revenueChart'
            );

        if (!canvas) {
            return;
        }


        const labels =
            Array.isArray(
                chartData?.labels
            )
                ? chartData.labels
                : [];


        const data =
            Array.isArray(
                chartData?.revenueByMonth
            )
                ? chartData.revenueByMonth.map(
                    safeNumber
                )
                : [];


        if (
            labels.length === 0 ||
            data.length === 0
        ) {

            showChartEmptyState(
                canvas,
                'Chưa có dữ liệu doanh thu theo tháng.'
            );

            return;
        }


        hideChartEmptyState(
            canvas
        );


        const context =
            canvas.getContext(
                '2d'
            );


        if (!context) {
            return;
        }


        window.revenueChartInstance =
            new Chart(
                context,
                {
                    type: 'line',

                    data: {
                        labels: labels,

                        datasets: [
                            {
                                label:
                                    'Doanh thu thực tế',

                                data: data,

                                borderColor:
                                    '#4f46e5',

                                backgroundColor:
                                    'rgba(79, 70, 229, 0.08)',

                                fill: true,

                                tension: 0.35,

                                borderWidth: 3,

                                pointRadius: 3,

                                pointHoverRadius: 6,

                                pointHoverBorderWidth: 2
                            }
                        ]
                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio: true,

                        interaction: {
                            mode: 'index',

                            intersect: false
                        },


                        animation: {
                            duration: 600
                        },


                        plugins: {

                            legend: {
                                display: false
                            },


                            tooltip: {

                                backgroundColor:
                                    '#0f172a',

                                titleColor:
                                    '#fff',

                                bodyColor:
                                    '#e2e8f0',

                                borderColor:
                                    '#334155',

                                borderWidth: 1,

                                padding: 11,

                                displayColors: false,

                                callbacks: {

                                    label:
                                        function (context) {

                                            return (
                                                'Doanh thu: ' +
                                                safeNumber(
                                                    context.raw
                                                ).toLocaleString(
                                                    'vi-VN'
                                                ) +
                                                ' triệu VNĐ'
                                            );

                                        }

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero: true,

                                grid: {
                                    color: '#f1f5f9'
                                },

                                border: {
                                    display: false
                                },

                                ticks: {

                                    color:
                                        '#64748b',

                                    padding: 8,

                                    callback:
                                        function (value) {
                                            return (
                                                Number(value).toLocaleString(
                                                    'vi-VN'
                                                ) +
                                                ' tr'
                                            );
                                        }

                                }

                            },


                            x: {

                                grid: {
                                    display: false
                                },

                                border: {
                                    display: false
                                },

                                ticks: {

                                    color:
                                        '#64748b',

                                    maxRotation: 0,

                                    autoSkip: true

                                }

                            }

                        }

                    }

                }
            );

    }


    // =======================================================
    // INDUSTRY CHART
    // =======================================================

    function createIndustryChart(
        chartData
    ) {

        const canvas =
            getElement(
                'industryChart'
            );

        if (!canvas) {
            return;
        }


        const industry =
            chartData?.industryShare ||
            {};


        const labels =
            Array.isArray(
                industry.labels
            )
                ? industry.labels
                : [];


        const data =
            Array.isArray(
                industry.series
            )
                ? industry.series.map(
                    safeNumber
                )
                : [];


        if (
            labels.length === 0 ||
            data.length === 0
        ) {

            showChartEmptyState(
                canvas,
                'Chưa có dữ liệu cơ cấu khách hàng theo ngành.'
            );

            return;
        }


        hideChartEmptyState(
            canvas
        );


        const context =
            canvas.getContext(
                '2d'
            );


        if (!context) {
            return;
        }


        window.industryChartInstance =
            new Chart(
                context,
                {
                    type: 'doughnut',

                    data: {

                        labels: labels,

                        datasets: [
                            {
                                data: data,

                                backgroundColor: [
                                    '#4f46e5',
                                    '#10b981',
                                    '#f59e0b',
                                    '#ec4899',
                                    '#64748b'
                                ],

                                borderColor:
                                    '#ffffff',

                                borderWidth: 3,

                                hoverOffset: 6
                            }
                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio: true,

                        cutout: '62%',


                        animation: {
                            duration: 600
                        },


                        plugins: {

                            legend: {

                                position: 'bottom',

                                labels: {

                                    color:
                                        '#475569',

                                    boxWidth: 12,

                                    boxHeight: 12,

                                    padding: 14,

                                    usePointStyle: true,

                                    pointStyle:
                                        'circle',

                                    font: {
                                        size: 11
                                    }

                                }

                            },


                            tooltip: {

                                backgroundColor:
                                    '#0f172a',

                                titleColor:
                                    '#fff',

                                bodyColor:
                                    '#e2e8f0',

                                borderColor:
                                    '#334155',

                                borderWidth: 1,

                                padding: 11,

                                callbacks: {

                                    label:
                                        function (context) {

                                            const value =
                                                safeNumber(
                                                    context.raw
                                                );

                                            const total =
                                                data.reduce(
                                                    function (
                                                        sum,
                                                        item
                                                    ) {
                                                        return sum + item;
                                                    },
                                                    0
                                                );

                                            const percentage =
                                                total > 0
                                                    ? (
                                                        value /
                                                        total *
                                                        100
                                                    ).toFixed(1)
                                                    : '0.0';

                                            return (
                                                ' ' +
                                                context.label +
                                                ': ' +
                                                value +
                                                ' (' +
                                                percentage +
                                                '%)'
                                            );

                                        }

                                }

                            }

                        }

                    }

                }
            );

    }


    // =======================================================
    // INITIALIZE CHARTS
    // =======================================================

    function initCharts(
        chartData = {}
    ) {

        if (
            typeof Chart ===
            'undefined'
        ) {

            console.warn(
                'Dashboard: Chart.js chưa được tải.'
            );

            return;
        }


        destroyExistingCharts();


        createRevenueChart(
            chartData
        );


        createIndustryChart(
            chartData
        );

    }


    // =======================================================
    // LOAD DASHBOARD
    // =======================================================

    async function loadDashboard() {

        showDashboardLoading();

        clearDashboardError();


        try {

            let data;


            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.get ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.get(
                        '/dashboard/stats'
                    );

            } else {

                const response =
                    await fetch(
                        '/api/dashboard/stats'
                    );

                data =
                    await response.json();
            }


            if (
                !data ||
                data.success !== true
            ) {

                throw new Error(
                    data?.message ||
                    'API Dashboard trả về dữ liệu không hợp lệ.'
                );

            }


            renderKpis(
                data.stats || {}
            );


            renderTopDebtors(
                data.topDebtors || []
            );


            if (data.chartData) {

                initCharts(
                    data.chartData
                );

            } else {

                initCharts({});

            }


            hideDashboardLoading();


            console.log(
                'Dashboard loaded successfully.'
            );


        } catch (error) {

            hideDashboardLoading();


            console.error(
                'Lỗi tải Dashboard:',
                error
            );


            showDashboardError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );


            renderKpis({});


            renderTopDebtors([]);


            initCharts({});

        }

    }


    // =======================================================
    // EXPORT
    // =======================================================

    window.loadDashboard =
        loadDashboard;


    window.initDashboardCharts =
        initCharts;


})(window);