/**
 * =========================================================
 * GODDY RECRUIT - Dashboard Module
 * FE-13: Dashboard KPI
 * =========================================================
 *
 * Chức năng:
 * - Tải KPI Dashboard từ Backend API
 * - Hiển thị doanh thu, công nợ, nợ quá hạn, deal
 * - Hiển thị tỷ lệ thu hồi / nợ quá hạn
 * - Vẽ biểu đồ doanh thu theo tháng
 * - Vẽ biểu đồ cơ cấu khách hàng
 * - Hiển thị Top 5 doanh nghiệp công nợ
 * - Có trạng thái loading / error / empty
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
    // UI STATE
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

        targets.forEach((id) => {
            const element = getElement(id);

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

        targets.forEach((id) => {
            const element = getElement(id);

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

        const alert = document.createElement('div');

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

        dashboardSection.prepend(alert);
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
                .map((item) => {

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
    // CHARTS
    // =======================================================

    function destroyExistingCharts() {

        if (
            typeof window.revenueChartInstance !==
            'undefined' &&
            window.revenueChartInstance
        ) {

            window.revenueChartInstance.destroy();

            window.revenueChartInstance = null;
        }


        if (
            typeof window.industryChartInstance !==
            'undefined' &&
            window.industryChartInstance
        ) {

            window.industryChartInstance.destroy();

            window.industryChartInstance = null;
        }

    }


    function initCharts(chartData = {}) {

        if (
            typeof Chart === 'undefined'
        ) {
            console.warn(
                'Dashboard: Chart.js chưa được tải.'
            );

            return;
        }


        destroyExistingCharts();


        // -----------------------------------------------------
        // REVENUE CHART
        // -----------------------------------------------------

        const revenueCanvas =
            getElement('revenueChart');


        const labels =
            Array.isArray(
                chartData.labels
            )
                ? chartData.labels
                : [];


        const revenueData =
            Array.isArray(
                chartData.revenueByMonth
            )
                ? chartData.revenueByMonth.map(
                    safeNumber
                )
                : [];


        if (
            revenueCanvas &&
            labels.length > 0
        ) {

            const context =
                revenueCanvas.getContext(
                    '2d'
                );


            const chart =
                new Chart(
                    context,
                    {
                        type: 'line',

                        data: {
                            labels,

                            datasets: [
                                {
                                    label:
                                        'Doanh thu thực tế (triệu VNĐ)',

                                    data:
                                        revenueData,

                                    borderColor:
                                        '#4f46e5',

                                    backgroundColor:
                                        'rgba(79, 70, 229, 0.08)',

                                    fill: true,

                                    tension: 0.35,

                                    borderWidth: 3,

                                    pointRadius: 4,

                                    pointHoverRadius: 6
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

                            plugins: {
                                legend: {
                                    display: false
                                },

                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            return (
                                                ' ' +
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

                                    ticks: {
                                        callback: function (value) {
                                            return value + ' tr';
                                        }
                                    }
                                },

                                x: {
                                    grid: {
                                        display: false
                                    }
                                }
                            }
                        }
                    }
                );


            window.revenueChartInstance =
                chart;
        }


        // -----------------------------------------------------
        // INDUSTRY CHART
        // -----------------------------------------------------

        const industryCanvas =
            getElement('industryChart');


        const industryShare =
            chartData.industryShare || {};


        const industryLabels =
            Array.isArray(
                industryShare.labels
            )
                ? industryShare.labels
                : [];


        const industrySeries =
            Array.isArray(
                industryShare.series
            )
                ? industryShare.series.map(
                    safeNumber
                )
                : [];


        if (
            industryCanvas &&
            industryLabels.length > 0
        ) {

            const context =
                industryCanvas.getContext(
                    '2d'
                );


            const chart =
                new Chart(
                    context,
                    {
                        type: 'doughnut',

                        data: {
                            labels:
                                industryLabels,

                            datasets: [
                                {
                                    data:
                                        industrySeries,

                                    backgroundColor: [
                                        '#4f46e5',
                                        '#10b981',
                                        '#f59e0b',
                                        '#ec4899',
                                        '#64748b'
                                    ],

                                    borderWidth: 2,

                                    borderColor: '#fff'
                                }
                            ]
                        },

                        options: {
                            responsive: true,

                            maintainAspectRatio: true,

                            cutout: '62%',

                            plugins: {
                                legend: {
                                    position: 'bottom',

                                    labels: {
                                        boxWidth: 12,

                                        padding: 14,

                                        font: {
                                            size: 11
                                        }
                                    }
                                }
                            }
                        }
                    }
                );


            window.industryChartInstance =
                chart;
        }

    }


    // =======================================================
    // LOAD DASHBOARD
    // =======================================================

    async function loadDashboard() {

        showDashboardLoading();

        clearDashboardError();


        try {

            let data;


            // Ưu tiên API Layer đã xây dựng ở FE-06 / FE-07
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

                // Fallback an toàn nếu API Layer chưa được load
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


            // Đảm bảo Dashboard vẫn có giá trị mặc định
            renderKpis({});

            renderTopDebtors([]);

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