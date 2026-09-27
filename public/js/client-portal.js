/**
 * =========================================================
 * GODDY RECRUIT - Client Portal
 * FE-22: Client Portal
 * =========================================================
 *
 * Giữ nguyên contract hiện tại:
 * GET  /api/clients/portal/:clientId
 * POST /api/recruitment/jobs
 *
 * Portal gồm:
 * - Hóa Đơn & Thanh Toán
 * - Vị Trí Tuyển Dụng
 * - Ứng Viên & Bảo Hành
 * - Hồ Sơ Doanh Nghiệp
 *
 * FE-22 cải thiện:
 * - Loading state
 * - Error state
 * - Empty state
 * - Escape dữ liệu HTML
 * - Giữ nguyên switchUserRole / currentClientId
 * - Giữ nguyên hành vi cũ
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
        const element =
            getElement(id);

        if (element) {
            element.textContent =
                value ?? '';
        }
    }


    function safeText(
        value,
        fallback = '-'
    ) {
        const text =
            String(value ?? '').trim();

        return text || fallback;
    }


    function safeNumber(value) {
        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    function formatMoneySafe(value) {

        if (
            typeof window.formatMoney ===
            'function'
        ) {
            return window.formatMoney(
                safeNumber(value)
            );
        }

        return (
            safeNumber(value).toLocaleString(
                'vi-VN'
            ) +
            ' đ'
        );
    }


    function getClientIdSafe(clientId) {

        const id =
            Number(clientId);

        return Number.isFinite(id) &&
            id > 0
            ? id
            : 1;
    }


    // =======================================================
    // PORTAL ROOT
    // =======================================================

    function getPortalSection() {
        return getElement(
            'section-client-portal'
        );
    }


    // =======================================================
    // LOADING
    // =======================================================

    function showPortalLoading() {

        const portal =
            getPortalSection();

        if (!portal) {
            return;
        }


        let overlay =
            getElement(
                'clientPortalLoading'
            );


        if (!overlay) {

            overlay =
                document.createElement(
                    'div'
                );


            overlay.id =
                'clientPortalLoading';


            overlay.className =
                'ui-loading py-5';


            overlay.innerHTML = `
        <div class="ui-spinner"></div>

        <div class="fw-semibold">
          Đang tải dữ liệu cổng khách hàng...
        </div>
      `;


            portal.prepend(
                overlay
            );

        }


        overlay.style.display =
            'flex';

    }


    function hidePortalLoading() {

        const overlay =
            getElement(
                'clientPortalLoading'
            );


        if (overlay) {
            overlay.style.display =
                'none';
        }

    }


    // =======================================================
    // ERROR
    // =======================================================

    function clearPortalError() {

        const existing =
            getElement(
                'clientPortalError'
            );


        if (existing) {
            existing.remove();
        }

    }


    function showPortalError(
        message
    ) {

        clearPortalError();


        const portal =
            getPortalSection();

        if (!portal) {
            return;
        }


        const alert =
            document.createElement(
                'div'
            );


        alert.id =
            'clientPortalError';


        alert.className =
            'ui-alert ui-alert-warning mb-4';


        alert.innerHTML = `
      <i class="fa-solid fa-circle-exclamation"></i>

      <div>

        <div class="fw-bold">
          Không thể tải dữ liệu cổng khách hàng
        </div>

        <div class="small">
          ${escapeHtml(
            message ||
            'Vui lòng kiểm tra kết nối tới máy chủ.'
        )}
        </div>

      </div>
    `;


        portal.prepend(
            alert
        );

    }


    // =======================================================
    // EMPTY STATE
    // =======================================================

    function renderPortalEmpty(
        elementId,
        colspan,
        message
    ) {

        const tbody =
            getElement(
                elementId
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>

        <td
          colspan="${colspan}"
          class="text-center text-muted py-4"
        >

          <div class="ui-empty">

            <div class="ui-empty-icon">
              <i class="fa-solid fa-inbox"></i>
            </div>

            <div class="ui-empty-title">
              ${escapeHtml(
            message
        )}
            </div>

            <div class="ui-empty-text">
              Hiện chưa có dữ liệu để hiển thị.
            </div>

          </div>

        </td>

      </tr>
    `;

    }


    // =======================================================
    // TAB NAVIGATION
    // =======================================================

    function switchClientSubTab(
        subTabKey
    ) {

        const tabs = [
            'invoices',
            'jobs',
            'placements',
            'profile'
        ];


        const activeKey =
            tabs.includes(
                subTabKey
            )
                ? subTabKey
                : 'invoices';


        tabs.forEach(
            function (tab) {

                const suffix =
                    tab.charAt(0).toUpperCase() +
                    tab.slice(1);


                const tabEl =
                    getElement(
                        'clientSubTab' +
                        suffix
                    );


                if (tabEl) {

                    tabEl.style.display =
                        tab === activeKey
                            ? 'block'
                            : 'none';

                }


                const btn =
                    getElement(
                        'btnSubNav' +
                        suffix
                    );


                if (btn) {

                    if (
                        tab === activeKey
                    ) {

                        btn.classList.add(
                            'active'
                        );

                        btn.setAttribute(
                            'aria-current',
                            'page'
                        );

                    } else {

                        btn.classList.remove(
                            'active'
                        );

                        btn.removeAttribute(
                            'aria-current'
                        );

                    }

                }

            }
        );


        const sidebarItems =
            document.querySelectorAll(
                '#sidebarMenuClient .sidebar-item'
            );


        sidebarItems.forEach(
            function (item) {

                const onclick =
                    item.getAttribute(
                        'onclick'
                    ) ||
                    '';


                if (
                    onclick.includes(
                        `'${activeKey}'`
                    ) ||
                    onclick.includes(
                        `"${activeKey}"`
                    )
                ) {

                    item.classList.add(
                        'active'
                    );

                } else {

                    item.classList.remove(
                        'active'
                    );

                }

            }
        );

    }


    // =======================================================
    // LOAD DATA
    // =======================================================

    async function getClientPortalData(
        clientId
    ) {

        const id =
            getClientIdSafe(
                clientId
            );


        /*
         * client-portal.html hiện tại chưa load api.js
         * nên ưu tiên fetch để giữ nguyên cấu trúc public.
         *
         * Nếu sau này api.js được load trong standalone portal,
         * vẫn có thể dùng GoddyAPI mà không phá code.
         */

        if (
            window.GoddyAPI &&
            window.GoddyAPI.get &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                `/clients/portal/${id}`
            );

        }


        const response =
            await fetch(
                `/api/clients/portal/${id}`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // LOAD CLIENT PORTAL
    // =======================================================

    async function loadClientPortal(
        clientId
    ) {

        const id =
            getClientIdSafe(
                clientId
            );


        showPortalLoading();

        clearPortalError();


        try {

            const data =
                await getClientPortalData(
                    id
                );


            if (
                !data ||
                data.success !== true ||
                !data.client
            ) {

                throw new Error(
                    data?.message ||
                    'Dữ liệu cổng khách hàng không hợp lệ.'
                );

            }


            const client =
                data.client;


            const summary =
                data.summary || {};


            // ===================================================
            // HERO
            // ===================================================

            setText(
                'cpCompanyName',
                safeText(
                    client.companyName
                )
            );


            setText(
                'cpTaxCode',
                safeText(
                    client.taxCode
                )
            );


            setText(
                'cpNetDays',
                `Net ${safeText(
                    client.paymentTermDays,
                    '30'
                )} ngày`
            );


            setText(
                'cpStatus',
                safeText(
                    client.status,
                    'Active'
                )
            );


            setText(
                'cpContactPerson',
                safeText(
                    client.contactPerson
                )
            );


            setText(
                'cpContactEmail',
                safeText(
                    client.contactEmail
                )
            );


            // ===================================================
            // 4 KPI
            // ===================================================

            setText(
                'cpValRemaining',
                formatMoneySafe(
                    summary.totalRemaining
                )
            );


            setText(
                'cpValPaid',
                formatMoneySafe(
                    summary.totalPaid
                )
            );


            setText(
                'cpValActiveJobs',
                safeNumber(
                    summary.activeJobs
                ) +
                ' Vị trí'
            );


            setText(
                'cpValWarranty',
                safeNumber(
                    summary.warrantyActive
                ) +
                ' Ứng viên'
            );


            // ===================================================
            // 1. INVOICES
            // ===================================================

            const tbodyInv =
                getElement(
                    'cpInvoicesTableBody'
                );


            if (tbodyInv) {

                const invoices =
                    Array.isArray(
                        data.invoices
                    )
                        ? data.invoices
                        : [];


                if (invoices.length === 0) {

                    renderPortalEmpty(
                        'cpInvoicesTableBody',
                        8,
                        'Công ty chưa có hóa đơn phát hành nào.'
                    );

                } else {

                    tbodyInv.innerHTML =
                        invoices
                            .map(
                                function (invoice) {

                                    const status =
                                        safeText(
                                            invoice?.status
                                        );


                                    let badgeClass =
                                        'badge-sent';


                                    let statusText =
                                        'Chờ thanh toán';


                                    if (
                                        status === 'Paid'
                                    ) {

                                        badgeClass =
                                            'badge-paid';

                                        statusText =
                                            'Đã thanh toán';

                                    } else if (
                                        status === 'Partial'
                                    ) {

                                        badgeClass =
                                            'badge-partial';

                                        statusText =
                                            'Đã trả một phần';

                                    } else if (
                                        status === 'Overdue' ||
                                        safeNumber(
                                            invoice?.overdueDays
                                        ) > 0
                                    ) {

                                        badgeClass =
                                            'badge-overdue';

                                        statusText =
                                            safeNumber(
                                                invoice?.overdueDays
                                            ) +
                                            ' ngày quá hạn';

                                    }


                                    const invoiceId =
                                        safeNumber(
                                            invoice?.id
                                        );


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
                                        safeText(
                                            invoice?.issueDate
                                        )
                                    )}
                      </td>


                      <td>
                        ${escapeHtml(
                                        safeText(
                                            invoice?.dueDate
                                        )
                                    )}
                      </td>


                      <td class="fw-bold">
                        ${formatMoneySafe(
                                        invoice?.totalAmount
                                    )}
                      </td>


                      <td class="text-success">
                        ${formatMoneySafe(
                                        invoice?.paidAmount
                                    )}
                      </td>


                      <td class="text-danger fw-bold">
                        ${formatMoneySafe(
                                        invoice?.remainingAmount
                                    )}
                      </td>


                      <td>
                        <span
                          class="status-badge ${badgeClass}"
                        >
                          ${escapeHtml(
                                        statusText
                                    )}
                        </span>
                      </td>


                      <td>

                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          ${invoiceId
                                            ? `onclick="viewInvoiceDetail(${invoiceId})"`
                                            : 'disabled'
                                        }
                        >
                          <i class="fa-solid fa-file-lines me-1"></i>
                          Xem &amp; In
                        </button>

                      </td>

                    </tr>

                  `;

                                }
                            )
                            .join('');

                }

            }


            // ===================================================
            // 2. JOBS
            // ===================================================

            const tbodyJobs =
                getElement(
                    'cpJobsTableBody'
                );


            if (tbodyJobs) {

                const jobs =
                    Array.isArray(
                        data.jobs
                    )
                        ? data.jobs
                        : [];


                if (jobs.length === 0) {

                    renderPortalEmpty(
                        'cpJobsTableBody',
                        6,
                        'Chưa có vị trí tuyển dụng nào được đặt hàng.'
                    );

                } else {

                    tbodyJobs.innerHTML =
                        jobs
                            .map(
                                function (job) {

                                    const isOpen =
                                        job?.status ===
                                        'Opening';


                                    return `

                    <tr>

                      <td>
                        #${safeNumber(
                                        job?.id
                                    )}
                      </td>


                      <td>
                        <strong
                          class="text-primary"
                        >
                          ${escapeHtml(
                                        safeText(
                                            job?.title
                                        )
                                    )}
                        </strong>
                      </td>


                      <td>
                        ${escapeHtml(
                                        safeText(
                                            job?.department,
                                            'Bộ phận Kỹ thuật'
                                        )
                                    )}
                      </td>


                      <td>
                        ${escapeHtml(
                                        safeText(
                                            job?.salaryRange
                                        )
                                    )}
                      </td>


                      <td>
                        ${safeNumber(
                                        job?.feeRatePercent
                                    )}%
                      </td>


                      <td>

                        <span
                          class="badge ${isOpen
                                            ? 'bg-success'
                                            : 'bg-secondary'
                                        }"
                        >
                          ${isOpen
                                            ? 'Đang Tuyển (Opening)'
                                            : 'Đã Đóng (Closed)'
                                        }
                        </span>

                      </td>

                    </tr>

                  `;

                                }
                            )
                            .join('');

                }

            }


            // ===================================================
            // 3. PLACEMENTS
            // ===================================================

            const tbodyPlacements =
                getElement(
                    'cpPlacementsTableBody'
                );


            if (tbodyPlacements) {

                const placements =
                    Array.isArray(
                        data.placements
                    )
                        ? data.placements
                        : [];


                if (
                    placements.length ===
                    0
                ) {

                    renderPortalEmpty(
                        'cpPlacementsTableBody',
                        7,
                        'Chưa có ứng viên nào onboard cho công ty.'
                    );

                } else {

                    tbodyPlacements.innerHTML =
                        placements
                            .map(
                                function (placement) {

                                    const isWarranty =
                                        placement?.status ===
                                        'UnderWarranty';


                                    const candidateName =
                                        placement?.Candidate
                                            ?.fullName ||
                                        'Ứng viên';


                                    const candidateEmail =
                                        placement?.Candidate
                                            ?.email ||
                                        '';


                                    const jobTitle =
                                        placement?.Job
                                            ?.title ||
                                        '-';


                                    return `

                    <tr>

                      <td>

                        <strong>
                          ${escapeHtml(
                                        candidateName
                                    )}
                        </strong>

                        ${candidateEmail
                                            ? `
                              <div class="text-muted small">
                                ${escapeHtml(
                                                candidateEmail
                                            )}
                              </div>
                            `
                                            : ''
                                        }

                      </td>


                      <td>
                        ${escapeHtml(
                                            jobTitle
                                        )}
                      </td>


                      <td class="fw-bold">
                        ${formatMoneySafe(
                                            placement?.officialSalary
                                        )}
                      </td>


                      <td>
                        ${escapeHtml(
                                            safeText(
                                                placement?.onboardDate
                                            )
                                        )}
                      </td>


                      <td>

                        <span
                          class="badge bg-light text-dark border"
                        >
                          ${safeNumber(
                                            placement?.warrantyDays
                                        )}
                          ngày
                        </span>

                      </td>


                      <td>
                        ${escapeHtml(
                                            safeText(
                                                placement?.warrantyEndDate
                                            )
                                        )}
                      </td>


                      <td>

                        <span
                          class="badge ${isWarranty
                                            ? 'bg-warning text-dark'
                                            : 'bg-success'
                                        }"
                        >

                          <i
                            class="fa-solid ${isWarranty
                                            ? 'fa-clock'
                                            : 'fa-check'
                                        } me-1"
                          ></i>

                          ${isWarranty
                                            ? 'Đang Bảo Hành'
                                            : 'Hoàn Thành'
                                        }

                        </span>

                      </td>

                    </tr>

                  `;

                                }
                            )
                            .join('');

                }

            }


            // ===================================================
            // 4. PROFILE
            // ===================================================

            setText(
                'cpProfName',
                safeText(
                    client.companyName
                )
            );


            setText(
                'cpProfTaxCode',
                safeText(
                    client.taxCode
                )
            );


            setText(
                'cpProfAddress',
                safeText(
                    client.address,
                    'Chưa cập nhật'
                )
            );


            setText(
                'cpProfPerson',
                safeText(
                    client.contactPerson
                )
            );


            setText(
                'cpProfEmail',
                safeText(
                    client.contactEmail
                )
            );


            setText(
                'cpProfPhone',
                safeText(
                    client.contactPhone
                )
            );


            setText(
                'cpProfNetDays',
                `Net ${safeText(
                    client.paymentTermDays,
                    '30'
                )} ngày kể từ ngày xuất HĐ VAT`
            );


            setText(
                'cpProfStatus',
                `${safeText(
                    client.status,
                    'Active'
                )} (Hợp đồng nguyên tắc có hiệu lực)`
            );


            // Mặc định mở tab hóa đơn
            switchClientSubTab(
                'invoices'
            );


            console.log(
                'Client portal loaded successfully.',
                {
                    clientId:
                        id,

                    companyName:
                        client.companyName
                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải Cổng khách hàng:',
                error
            );


            showPortalError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );


        } finally {

            hidePortalLoading();

        }

    }


    // =======================================================
    // JOB REQUEST MODAL
    // =======================================================

    function openClientRequestJobModal() {

        const form =
            getElement(
                'formClientRequestJob'
            );


        if (form) {
            form.reset();
        }


        const modalEl =
            getElement(
                'modalClientRequestJob'
            );


        if (
            modalEl &&
            window.bootstrap?.Modal
        ) {

            const modal =
                window.bootstrap.Modal
                    .getOrCreateInstance(
                        modalEl
                    );


            modal.show();


            return;

        }


        alert(
            'Không tìm thấy hộp thoại đặt hàng tuyển dụng!'
        );

    }


    // =======================================================
    // SUBMIT JOB REQUEST
    // =======================================================

    async function submitClientRequestJob(e) {

        e.preventDefault();


        const getValue =
            function (id) {

                const element =
                    getElement(id);


                return element
                    ? element.value.trim()
                    : '';

            };


        const clientId =
            getClientIdSafe(
                window.currentClientId
            );


        const body = {

            clientId:
                clientId,

            title:
                getValue(
                    'cpJobTitle'
                ),

            department:
                getValue(
                    'cpJobDepartment'
                ),

            salaryRange:
                getValue(
                    'cpJobSalary'
                ) ||
                'Thỏa thuận',

            feeRatePercent:
                18.0

        };


        if (!body.title) {

            alert(
                'Vui lòng nhập chức danh / vị trí tuyển dụng.'
            );

            return;

        }


        if (!body.department) {

            alert(
                'Vui lòng nhập khối / phòng ban.'
            );

            return;

        }


        const submitButton =
            e.submitter;


        const originalHtml =
            submitButton
                ? submitButton.innerHTML
                : '';


        if (submitButton) {

            submitButton.disabled =
                true;


            submitButton.innerHTML = `
        <span
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        Đang gửi...
      `;

        }


        try {

            let data;


            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.post ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.post(
                        '/recruitment/jobs',
                        body
                    );

            } else {

                const response =
                    await fetch(
                        '/api/recruitment/jobs',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    body
                                )
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );

                }


                data =
                    await response.json();

            }


            if (
                data?.success === false
            ) {

                throw new Error(
                    data?.message ||
                    'Không thể gửi yêu cầu tuyển dụng.'
                );

            }


            const modalEl =
                getElement(
                    'modalClientRequestJob'
                );


            if (modalEl) {

                const modal =
                    window.bootstrap?.Modal
                        .getInstance(
                            modalEl
                        );


                if (modal) {
                    modal.hide();
                }

            }


            alert(
                data?.message ||
                'Gửi yêu cầu tuyển dụng mới thành công! GODDY Recruit đã tiếp nhận và sẽ sớm liên hệ.'
            );


            await loadClientPortal(
                clientId
            );


        } catch (error) {

            console.error(
                'Lỗi gửi yêu cầu tuyển dụng:',
                error
            );


            alert(
                error?.message ||
                'Lỗi kết nối máy chủ!'
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;


                submitButton.innerHTML =
                    originalHtml ||
                    `
            <i class="fa-solid fa-paper-plane me-1"></i>
            Gửi Yêu Cầu
          `;

            }

        }

    }


    // =======================================================
    // EXPORT GLOBAL
    // =======================================================

    window.switchClientSubTab =
        switchClientSubTab;


    window.loadClientPortal =
        loadClientPortal;


    window.openClientRequestJobModal =
        openClientRequestJobModal;


    window.submitClientRequestJob =
        submitClientRequestJob;


})(window);