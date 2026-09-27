/**
 * =========================================================
 * GODDY RECRUIT - Debt & Aging Module
 * FE-15 / FE-16 / FE-17 / FE-18
 * =========================================================
 *
 * FE-15:
 * - Tổng quan công nợ / Aging KPI
 * - Loading / Error state
 * - Empty state
 * - GoddyAPI + fallback fetch
 *
 * FE-16:
 * - Tìm kiếm mã hóa đơn / khách hàng
 * - Lọc theo tuổi nợ
 * - Đếm số kết quả
 *
 * FE-17:
 * - Xem chi tiết một khoản công nợ
 * - Modal chi tiết tạo động
 *
 * FE-18:
 * - Xác nhận trước khi gửi nhắc nợ
 * - Trạng thái đang gửi
 * - Chống click nhiều lần
 * - Gọi API qua GoddyAPI
 * - Khôi phục button khi lỗi
 *
 * Giữ nguyên:
 * - Thu Tiền
 * - Nhắc Nợ
 * - Xuất CSV
 * - Endpoint/backend contract hiện tại
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // STATE
    // =======================================================

    let currentDebtList = [];

    let currentDebtSearch = '';

    let currentDebtFilter = 'all';


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    function safeNumber(value) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
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


    function getClientName(item) {
        return (
            item?.Client?.companyName ||
            '-'
        );
    }


    function getAgingType(item) {

        const overdueDays =
            safeNumber(
                item?.overdueDays
            );


        if (overdueDays <= 0) {
            return 'current';
        }


        if (overdueDays <= 30) {
            return '1-30';
        }


        if (overdueDays <= 60) {
            return '31-60';
        }


        return '60+';
    }


    // =======================================================
    // ERROR
    // =======================================================

    function clearDebtError() {

        const existing =
            getElement(
                'debtErrorAlert'
            );


        if (existing) {
            existing.remove();
        }

    }


    function showDebtError(message) {

        clearDebtError();


        const section =
            getElement(
                'section-debt'
            );


        if (!section) {
            return;
        }


        const alert =
            document.createElement(
                'div'
            );


        alert.id =
            'debtErrorAlert';


        alert.className =
            'alert alert-warning d-flex align-items-start gap-2 mt-3';


        alert.innerHTML = `
      <i class="fa-solid fa-circle-exclamation mt-1"></i>

      <div>
        <div class="fw-bold">
          Không thể tải dữ liệu công nợ
        </div>

        <div class="small">
          ${escapeHtml(
            message ||
            'Vui lòng kiểm tra kết nối tới máy chủ.'
        )}
        </div>
      </div>
    `;


        section.prepend(
            alert
        );

    }


    // =======================================================
    // KPI LOADING
    // =======================================================

    function setSummaryLoading(
        isLoading
    ) {

        const ids = [
            'debtAging1to30',
            'debtAging31to60',
            'debtAgingAbove60'
        ];


        ids.forEach(
            function (id) {

                const element =
                    getElement(id);


                if (!element) {
                    return;
                }


                if (isLoading) {

                    element.textContent =
                        'Đang tải...';

                    element.classList.add(
                        'placeholder-glow'
                    );

                } else {

                    element.classList.remove(
                        'placeholder-glow'
                    );

                }

            }
        );

    }


    // =======================================================
    // SUMMARY
    // =======================================================

    function renderDebtSummary(
        summary = {}
    ) {

        const aging0to30 =
            getElement(
                'debtAging1to30'
            );


        const aging31to60 =
            getElement(
                'debtAging31to60'
            );


        const agingAbove60 =
            getElement(
                'debtAgingAbove60'
            );


        if (aging0to30) {

            aging0to30.textContent =
                formatMoneySafe(
                    summary.aging0to30
                );

        }


        if (aging31to60) {

            aging31to60.textContent =
                formatMoneySafe(
                    summary.aging31to60
                );

        }


        if (agingAbove60) {

            agingAbove60.textContent =
                formatMoneySafe(
                    summary.agingAbove60
                );

        }

    }


    // =======================================================
    // DEBT LIST TOOLBAR - FE-16
    // =======================================================

    function ensureDebtToolbar() {

        const tableBody =
            getElement(
                'debtTableBody'
            );


        if (!tableBody) {
            return null;
        }


        const tableBox =
            tableBody.closest(
                '.table-box'
            );


        if (!tableBox) {
            return null;
        }


        let toolbar =
            getElement(
                'debtListToolbar'
            );


        if (toolbar) {
            return toolbar;
        }


        toolbar =
            document.createElement(
                'div'
            );


        toolbar.id =
            'debtListToolbar';


        toolbar.className =
            'ui-toolbar mb-3';


        toolbar.innerHTML = `
      <div class="ui-toolbar-left">

        <div
          class="ui-search"
          style="min-width: 280px;"
        >
          <i class="fa-solid fa-magnifying-glass"></i>

          <input
            type="search"
            id="debtSearchInput"
            placeholder="Tìm mã hóa đơn hoặc khách hàng..."
            autocomplete="off"
            aria-label="Tìm kiếm công nợ"
          >
        </div>

        <select
          id="debtAgingFilter"
          class="ui-filter"
          aria-label="Lọc theo tuổi nợ"
        >
          <option value="all">
            Tất cả tuổi nợ
          </option>

          <option value="current">
            Trong hạn
          </option>

          <option value="1-30">
            Quá hạn 1 - 30 ngày
          </option>

          <option value="31-60">
            Quá hạn 31 - 60 ngày
          </option>

          <option value="60+">
            Nợ khó đòi &gt; 60 ngày
          </option>
        </select>

        <button
          type="button"
          id="debtResetFilter"
          class="ui-btn ui-btn-secondary ui-btn-sm"
        >
          <i class="fa-solid fa-rotate-left"></i>
          Xóa lọc
        </button>

      </div>

      <div class="ui-toolbar-right">

        <span
          id="debtResultCount"
          class="ui-data-count"
        >
          0 kết quả
        </span>

      </div>
    `;


        const tableResponsive =
            tableBox.querySelector(
                '.table-responsive'
            );


        if (tableResponsive) {

            tableBox.insertBefore(
                toolbar,
                tableResponsive
            );

        } else {

            tableBox.appendChild(
                toolbar
            );

        }


        const searchInput =
            getElement(
                'debtSearchInput'
            );


        const filterSelect =
            getElement(
                'debtAgingFilter'
            );


        const resetButton =
            getElement(
                'debtResetFilter'
            );


        if (searchInput) {

            searchInput.addEventListener(
                'input',
                function () {

                    currentDebtSearch =
                        searchInput.value.trim();

                    applyDebtFilters();

                }
            );

        }


        if (filterSelect) {

            filterSelect.addEventListener(
                'change',
                function () {

                    currentDebtFilter =
                        filterSelect.value;

                    applyDebtFilters();

                }
            );

        }


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    currentDebtSearch =
                        '';

                    currentDebtFilter =
                        'all';


                    if (searchInput) {
                        searchInput.value =
                            '';
                    }


                    if (filterSelect) {
                        filterSelect.value =
                            'all';
                    }


                    applyDebtFilters();

                }
            );

        }


        return toolbar;
    }


    // =======================================================
    // FILTER
    // =======================================================

    function getFilteredDebtList() {

        const search =
            currentDebtSearch.toLowerCase();


        return currentDebtList.filter(
            function (item) {

                const invoiceCode =
                    String(
                        item?.invoiceCode ||
                        ''
                    ).toLowerCase();


                const companyName =
                    String(
                        getClientName(item)
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    invoiceCode.includes(
                        search
                    ) ||
                    companyName.includes(
                        search
                    );


                const aging =
                    getAgingType(
                        item
                    );


                const matchesFilter =
                    currentDebtFilter === 'all' ||
                    currentDebtFilter === aging;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );

    }


    // =======================================================
    // RESULT COUNT
    // =======================================================

    function renderDebtResultCount(
        count
    ) {

        const element =
            getElement(
                'debtResultCount'
            );


        if (!element) {
            return;
        }


        element.textContent =
            `${count} kết quả`;

    }


    // =======================================================
    // EMPTY TABLE
    // =======================================================

    function renderDebtEmpty(
        message =
            'Hiện không có công nợ cần thu!'
    ) {

        const tbody =
            getElement(
                'debtTableBody'
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="text-center text-muted py-4"
        >
          <i class="fa-solid fa-circle-check me-1"></i>
          ${escapeHtml(message)}
        </td>
      </tr>
    `;


        renderDebtResultCount(
            0
        );

    }


    // =======================================================
    // FE-17 - DETAIL MODAL
    // =======================================================

    function ensureDebtDetailModal() {

        let modal =
            getElement(
                'modalDebtDetail'
            );


        if (modal) {
            return modal;
        }


        modal =
            document.createElement(
                'div'
            );


        modal.id =
            'modalDebtDetail';


        modal.className =
            'modal fade';


        modal.tabIndex =
            -1;


        modal.setAttribute(
            'aria-hidden',
            'true'
        );


        modal.innerHTML = `
      <div
        class="modal-dialog modal-lg modal-dialog-centered"
      >

        <div class="modal-content border-0 shadow-lg">

          <div class="modal-header">

            <div>

              <div
                class="text-muted small text-uppercase fw-bold mb-1"
              >
                Chi tiết khoản công nợ
              </div>

              <h5
                class="modal-title"
                id="debtDetailTitle"
              >
                Chi tiết hóa đơn
              </h5>

            </div>

            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Đóng"
            ></button>

          </div>


          <div class="modal-body">

            <div
              id="debtDetailBody"
            ></div>

          </div>


          <div class="modal-footer">

            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Đóng
            </button>

          </div>

        </div>

      </div>
    `;


        document.body.appendChild(
            modal
        );


        return modal;
    }


    function showDebtDetail(
        debt
    ) {

        if (!debt) {
            return;
        }


        const modalEl =
            ensureDebtDetailModal();


        const titleEl =
            getElement(
                'debtDetailTitle'
            );


        const bodyEl =
            getElement(
                'debtDetailBody'
            );


        if (!modalEl || !bodyEl) {
            return;
        }


        const invoiceCode =
            debt.invoiceCode ||
            '-';


        const clientName =
            getClientName(
                debt
            );


        const remaining =
            safeNumber(
                debt.remainingAmount
            );


        const overdueDays =
            safeNumber(
                debt.overdueDays
            );


        const aging =
            debt.agingCategory ||
            '-';


        const dueDate =
            debt.dueDate ||
            '-';


        const statusClass =
            overdueDays > 0
                ? 'bg-danger'
                : 'bg-success';


        const statusText =
            overdueDays > 0
                ? `${overdueDays} ngày quá hạn`
                : 'Trong hạn';


        if (titleEl) {

            titleEl.textContent =
                invoiceCode;

        }


        bodyEl.innerHTML = `

      <div class="row g-3">

        <div class="col-md-6">

          <div class="ui-card h-100">

            <div
              class="ui-card-subtitle"
            >
              Hóa đơn
            </div>

            <div
              class="ui-card-title"
            >
              ${escapeHtml(
            invoiceCode
        )}
            </div>

            <div
              class="mt-3 small"
            >

              <div class="mb-2">
                <span class="text-muted">
                  Khách hàng:
                </span>

                <strong>
                  ${escapeHtml(
            clientName
        )}
                </strong>
              </div>

              <div class="mb-2">
                <span class="text-muted">
                  Hạn trả:
                </span>

                <strong>
                  ${escapeHtml(
            dueDate
        )}
                </strong>
              </div>

              <div>
                <span class="text-muted">
                  Phân loại:
                </span>

                <strong>
                  ${escapeHtml(
            aging
        )}
                </strong>
              </div>

            </div>

          </div>

        </div>


        <div class="col-md-6">

          <div class="ui-card h-100">

            <div
              class="ui-card-subtitle"
            >
              Trạng thái công nợ
            </div>

            <div class="mt-2">

              <span
                class="badge ${statusClass}"
              >
                ${escapeHtml(
            statusText
        )}
              </span>

            </div>

            <div class="mt-3">

              <div
                class="ui-card-subtitle"
              >
                Số tiền còn nợ
              </div>

              <div
                class="fs-4 fw-bold text-danger"
              >
                ${formatMoneySafe(
            remaining
        )}
              </div>

            </div>

          </div>

        </div>


        <div class="col-12">

          <div
            class="ui-alert ${overdueDays > 0
                ? 'ui-alert-danger'
                : 'ui-alert-success'
            }"
          >

            <i
              class="fa-solid ${overdueDays > 0
                ? 'fa-triangle-exclamation'
                : 'fa-circle-check'
            }"
            ></i>

            <div>

              <div class="fw-bold">
                ${overdueDays > 0
                ? 'Khoản nợ đang quá hạn'
                : 'Khoản nợ đang trong hạn'
            }
              </div>

              <div class="small">

                ${overdueDays > 0
                ? `Hóa đơn đã quá hạn ${overdueDays} ngày.`
                : 'Hóa đơn chưa vượt quá ngày thanh toán.'
            }

              </div>

            </div>

          </div>

        </div>

      </div>

    `;


        if (
            window.bootstrap &&
            window.bootstrap.Modal
        ) {

            const modal =
                window.bootstrap.Modal
                    .getOrCreateInstance(
                        modalEl
                    );


            modal.show();

        }

    }


    // =======================================================
    // RENDER TABLE
    // =======================================================

    function renderDebtList(
        debtList
    ) {

        const tbody =
            getElement(
                'debtTableBody'
            );


        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(
                debtList
            )
                ? debtList
                : [];


        if (items.length === 0) {

            renderDebtEmpty();

            return;

        }


        tbody.innerHTML =
            items
                .map(
                    function (item) {

                        const overdueDays =
                            safeNumber(
                                item?.overdueDays
                            );


                        const invoiceId =
                            safeNumber(
                                item?.id
                            );


                        const remaining =
                            safeNumber(
                                item?.remainingAmount
                            );


                        const invoiceCode =
                            item?.invoiceCode ||
                            '';


                        const agingCategory =
                            item?.agingCategory ||
                            '-';


                        const companyName =
                            getClientName(
                                item
                            );


                        const statusClass =
                            overdueDays > 0
                                ? 'bg-danger'
                                : 'bg-success';


                        const statusText =
                            overdueDays > 0
                                ? `${overdueDays} ngày quá hạn`
                                : 'Trong hạn';


                        return `
              <tr>

                <td>
                  <strong>
                    ${escapeHtml(
                            invoiceCode
                        )}
                  </strong>
                </td>

                <td>
                  ${escapeHtml(
                            companyName
                        )}
                </td>

                <td class="text-danger fw-bold">
                  ${formatMoneySafe(
                            remaining
                        )}
                </td>

                <td>
                  ${escapeHtml(
                            item?.dueDate ||
                            '-'
                        )}
                </td>

                <td>
                  <span
                    class="badge ${statusClass}"
                  >
                    ${statusText}
                  </span>
                </td>

                <td>
                  <strong>
                    ${escapeHtml(
                            agingCategory
                        )}
                  </strong>
                </td>

                <td>

                  <div
                    class="d-flex gap-1 flex-wrap"
                  >

                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      onclick="showDebtDetailById(${invoiceId})"
                    >
                      <i class="fa-solid fa-eye me-1"></i>
                      Chi tiết
                    </button>

                    <button
                      type="button"
                      class="btn btn-sm btn-success"
                      onclick='openRecordPayment(
                        ${invoiceId},
                        ${JSON.stringify(
                            invoiceCode
                        )},
                        ${remaining}
                      )'
                    >
                      <i class="fa-solid fa-hand-holding-dollar me-1"></i>
                      Thu Tiền
                    </button>

                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      onclick="sendDebtReminder(${invoiceId}, this)"
                    >
                      <i class="fa-solid fa-bell me-1"></i>
                      Nhắc Nợ
                    </button>

                  </div>

                </td>

              </tr>
            `;

                    }
                )
                .join('');

    }


    // =======================================================
    // SHOW DETAIL BY ID
    // =======================================================

    function showDebtDetailById(
        invoiceId
    ) {

        const id =
            safeNumber(
                invoiceId
            );


        const debt =
            currentDebtList.find(
                function (item) {

                    return safeNumber(
                        item?.id
                    ) === id;

                }
            );


        if (!debt) {

            alert(
                'Không tìm thấy dữ liệu chi tiết công nợ.'
            );

            return;
        }


        showDebtDetail(
            debt
        );

    }


    // =======================================================
    // APPLY FILTERS
    // =======================================================

    function applyDebtFilters() {

        const filteredList =
            getFilteredDebtList();


        renderDebtList(
            filteredList
        );


        renderDebtResultCount(
            filteredList.length
        );

    }


    // =======================================================
    // API
    // =======================================================

    async function getDebtOverview() {

        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                '/debt/overview'
            );

        }


        const response =
            await fetch(
                '/api/debt/overview'
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // LOAD DEBT
    // =======================================================

    async function loadDebt() {

        setSummaryLoading(
            true
        );


        clearDebtError();


        try {

            const data =
                await getDebtOverview();


            renderDebtSummary(
                data?.summary || {}
            );


            currentDebtList =
                Array.isArray(
                    data?.debtList
                )
                    ? data.debtList
                    : [];


            ensureDebtToolbar();

            applyDebtFilters();


            console.log(
                'Debt overview loaded successfully.'
            );


        } catch (error) {

            console.error(
                'Lỗi tải Báo cáo Công Nợ:',
                error
            );


            renderDebtSummary(
                {}
            );


            currentDebtList =
                [];


            ensureDebtToolbar();


            renderDebtEmpty(
                'Không thể tải danh sách công nợ.'
            );


            showDebtError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );


        } finally {

            setSummaryLoading(
                false
            );

        }

    }


    // =======================================================
    // RECORD PAYMENT
    // =======================================================

    function openRecordPayment(
        invId,
        invCode,
        remaining
    ) {

        const invIdEl =
            getElement(
                'payInvoiceId'
            );


        const invCodeEl =
            getElement(
                'payInvoiceCode'
            );


        const remTextEl =
            getElement(
                'payRemainingText'
            );


        const amountEl =
            getElement(
                'payAmount'
            );


        const safeRemaining =
            Math.max(
                safeNumber(
                    remaining
                ),
                0
            );


        if (invIdEl) {

            invIdEl.value =
                invId;

        }


        if (invCodeEl) {

            invCodeEl.value =
                invCode || '';

        }


        if (remTextEl) {

            remTextEl.value =
                formatMoneySafe(
                    safeRemaining
                );

        }


        if (amountEl) {

            amountEl.value =
                safeRemaining;

            amountEl.max =
                safeRemaining;

            amountEl.min =
                0;

        }


        const modalEl =
            getElement(
                'modalRecordPayment'
            );


        if (
            modalEl &&
            window.bootstrap &&
            window.bootstrap.Modal
        ) {

            const modalInstance =
                window.bootstrap.Modal
                    .getOrCreateInstance(
                        modalEl
                    );


            modalInstance.show();


            return;

        }


        alert(
            'Không tìm thấy hộp thoại ghi nhận thanh toán!'
        );

    }


    // =======================================================
    // SUBMIT PAYMENT
    // =======================================================

    async function submitRecordPayment(e) {

        e.preventDefault();


        const invIdEl =
            getElement(
                'payInvoiceId'
            );


        const amountEl =
            getElement(
                'payAmount'
            );


        const methodEl =
            getElement(
                'payMethod'
            );


        const refEl =
            getElement(
                'payRefCode'
            );


        const notesEl =
            getElement(
                'payNotes'
            );


        const invoiceId =
            invIdEl
                ? invIdEl.value
                : null;


        const amount =
            amountEl
                ? safeNumber(
                    amountEl.value
                )
                : 0;


        const body = {

            invoiceId:
                invoiceId,

            amount:
                amount,

            paymentMethod:
                methodEl
                    ? methodEl.value
                    : 'BankTransfer',

            referenceCode:
                refEl
                    ? refEl.value.trim()
                    : '',

            notes:
                notesEl
                    ? notesEl.value.trim()
                    : ''

        };


        if (
            !invoiceId ||
            amount <= 0
        ) {

            alert(
                'Vui lòng kiểm tra hóa đơn và số tiền thanh toán.'
            );

            return;

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
                        '/debt/payment',
                        body
                    );

            } else {

                const response =
                    await fetch(
                        '/api/debt/payment',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(body)
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


            if (data?.success) {

                const modalEl =
                    getElement(
                        'modalRecordPayment'
                    );


                if (modalEl) {

                    const modalInstance =
                        window.bootstrap?.Modal
                            .getInstance(
                                modalEl
                            );


                    if (modalInstance) {
                        modalInstance.hide();
                    }

                }


                alert(
                    'Ghi nhận thanh toán thành công!'
                );


                await loadDebt();


                return;

            }


            alert(
                data?.message ||
                'Lỗi khi thu tiền!'
            );


        } catch (error) {

            console.error(
                'Lỗi ghi nhận thanh toán:',
                error
            );


            alert(
                error?.message ||
                'Lỗi kết nối máy chủ!'
            );

        }

    }


    // =======================================================
    // FE-18 - DEBT REMINDER
    // =======================================================

    async function sendDebtReminder(
        invoiceId,
        buttonElement = null
    ) {

        const id =
            safeNumber(
                invoiceId
            );


        if (!id) {

            alert(
                'Mã hóa đơn không hợp lệ!'
            );

            return;

        }


        const button =
            buttonElement || null;


        // -----------------------------------------------------
        // XÁC NHẬN
        // -----------------------------------------------------

        const confirmed =
            window.confirm(
                'Bạn có chắc muốn gửi nhắc nợ cho hóa đơn này không?'
            );


        if (!confirmed) {
            return;
        }


        // -----------------------------------------------------
        // DISABLE BUTTON
        // -----------------------------------------------------

        let originalHtml =
            '';


        if (button) {

            originalHtml =
                button.innerHTML;

            button.disabled =
                true;

            button.innerHTML = `
        <span
          class="spinner-border spinner-border-sm me-1"
          role="status"
          aria-hidden="true"
        ></span>
        Đang gửi...
      `;

            button.setAttribute(
                'aria-busy',
                'true'
            );

        }


        try {

            let data;


            // ---------------------------------------------------
            // Ưu tiên GoddyAPI
            // ---------------------------------------------------

            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.post ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.post(
                        '/debt/remind',
                        {
                            invoiceId:
                                id
                        }
                    );

            } else {

                // -----------------------------------------------
                // Fallback tương thích code cũ
                // -----------------------------------------------

                const response =
                    await fetch(
                        '/api/debt/remind',
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    invoiceId:
                                        id
                                })
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
                data &&
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    'Không thể gửi nhắc nợ.'
                );

            }


            alert(
                data?.message ||
                'Đã gửi lời nhắc nợ thành công!'
            );


        } catch (error) {

            console.error(
                'Lỗi gửi nhắc nợ:',
                error
            );


            alert(
                error?.message ||
                'Lỗi gửi nhắc nợ!'
            );


        } finally {

            // ---------------------------------------------------
            // KHÔI PHỤC BUTTON
            // ---------------------------------------------------

            if (button) {

                button.disabled =
                    false;

                button.innerHTML =
                    originalHtml ||
                    `
            <i class="fa-solid fa-bell me-1"></i>
            Nhắc Nợ
          `;

                button.removeAttribute(
                    'aria-busy'
                );

            }

        }

    }


    // =======================================================
    // EXPORT CSV
    // =======================================================

    async function exportDebtCSV() {

        try {

            const data =
                await getDebtOverview();


            let csv =
                'Mã Hóa Đơn,Khách Hàng,Số Tiền Nợ,Hạn Trả,Số Ngày Quá Hạn,Phân Loại Tuổi Nợ\n';


            (
                Array.isArray(
                    data?.debtList
                )
                    ? data.debtList
                    : []
            )
                .forEach(
                    function (item) {

                        const row = [

                            item?.invoiceCode ||
                            '',

                            getClientName(
                                item
                            ),

                            safeNumber(
                                item?.remainingAmount
                            ),

                            item?.dueDate ||
                            '',

                            safeNumber(
                                item?.overdueDays
                            ),

                            item?.agingCategory ||
                            ''

                        ];


                        csv +=
                            row
                                .map(
                                    function (value) {

                                        return (
                                            '"' +
                                            String(value)
                                                .replace(
                                                    /"/g,
                                                    '""'
                                                ) +
                                            '"'
                                        );

                                    }
                                )
                                .join(',') +
                            '\n';

                    }
                );


            if (
                typeof window.downloadCSV ===
                'function'
            ) {

                window.downloadCSV(
                    csv,
                    'Bao_Cao_Tuoi_No_Aging_Report.csv'
                );

            } else {

                const blob =
                    new Blob(
                        [
                            '\uFEFF' +
                            csv
                        ],
                        {
                            type:
                                'text/csv;charset=utf-8;'
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
                    'Bao_Cao_Tuoi_No_Aging_Report.csv';


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();


                URL.revokeObjectURL(
                    url
                );

            }


        } catch (error) {

            console.error(
                'Lỗi xuất CSV:',
                error
            );


            alert(
                error?.message ||
                'Lỗi xuất CSV!'
            );

        }

    }


    // =======================================================
    // GLOBAL EXPORTS
    // =======================================================

    window.loadDebt =
        loadDebt;


    window.openRecordPayment =
        openRecordPayment;


    window.submitRecordPayment =
        submitRecordPayment;


    window.sendDebtReminder =
        sendDebtReminder;


    window.exportDebtCSV =
        exportDebtCSV;


    window.showDebtDetailById =
        showDebtDetailById;


    window.showDebtDetail =
        showDebtDetail;


})(window);