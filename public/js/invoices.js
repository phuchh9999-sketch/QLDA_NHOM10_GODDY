/**
 * =========================================================
 * GODDY RECRUIT - Invoice Management Module
 * FE-23 / FE-26
 * =========================================================
 *
 * FE-23:
 * - Load danh sách hóa đơn
 * - Lọc trạng thái
 * - Tìm kiếm mã HĐ / khách hàng
 * - Đếm kết quả
 * - Loading / Empty / Error state
 * - Xem & In
 * - Xuất CSV
 *
 * FE-26:
 * - Thêm nút Thu Tiền vào danh sách hóa đơn
 * - Dùng modal thanh toán có sẵn trong invoices.html
 * - Tự truyền mã hóa đơn / số tiền còn nợ
 * - Không tạo endpoint mới
 * - Giữ nguyên payment flow trong debt.js
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // STATE
    // =======================================================

    let currentInvoices = [];

    let currentSearch = '';


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    function safeNumber(value) {
        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function safeText(
        value,
        fallback = '-'
    ) {
        const text =
            String(value ?? '').trim();

        return text || fallback;
    }


    function normalize(value) {
        return String(value ?? '')
            .toLowerCase()
            .trim();
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


    function getClientName(invoice) {
        return (
            invoice?.Client?.companyName ||
            '-'
        );
    }


    function getStatusClass(status) {

        switch (status) {

            case 'Paid':
                return 'badge-paid';

            case 'Partial':
                return 'badge-partial';

            case 'Overdue':
                return 'badge-overdue';

            case 'Sent':
                return 'badge-sent';

            default:
                return 'badge-sent';

        }

    }


    function getStatusText(status) {

        switch (status) {

            case 'Paid':
                return 'Đã thanh toán';

            case 'Partial':
                return 'Đã trả một phần';

            case 'Overdue':
                return 'Quá hạn';

            case 'Sent':
                return 'Chờ thanh toán';

            default:
                return safeText(
                    status,
                    'Không xác định'
                );

        }

    }


    // =======================================================
    // RESULT COUNT
    // =======================================================

    function renderInvoiceResultCount(
        count
    ) {

        const tableBody =
            getElement(
                'invoicesTableBody'
            );


        if (!tableBody) {
            return;
        }


        const table =
            tableBody.closest(
                'table'
            );


        if (!table) {
            return;
        }


        const tableBox =
            table.closest(
                '.table-box'
            );


        if (!tableBox) {
            return;
        }


        let countElement =
            getElement(
                'invoiceResultCount'
            );


        if (!countElement) {

            countElement =
                document.createElement(
                    'span'
                );


            countElement.id =
                'invoiceResultCount';


            countElement.className =
                'ui-data-count ms-2';


            const boxHeader =
                tableBox.querySelector(
                    '.box-header'
                );


            if (boxHeader) {

                const actionArea =
                    boxHeader.querySelector(
                        '.d-flex'
                    );


                if (actionArea) {

                    actionArea.appendChild(
                        countElement
                    );

                } else {

                    boxHeader.appendChild(
                        countElement
                    );

                }

            }

        }


        countElement.textContent =
            `${count} hóa đơn`;

    }


    // =======================================================
    // SEARCH
    // =======================================================

    function ensureInvoiceSearch() {

        const tableBody =
            getElement(
                'invoicesTableBody'
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


        let search =
            getElement(
                'invoiceSearchInput'
            );


        if (search) {
            return search;
        }


        const boxHeader =
            tableBox.querySelector(
                '.box-header'
            );


        if (!boxHeader) {
            return null;
        }


        const actionArea =
            boxHeader.querySelector(
                '.d-flex'
            );


        if (!actionArea) {
            return null;
        }


        search =
            document.createElement(
                'input'
            );


        search.type =
            'search';


        search.id =
            'invoiceSearchInput';


        search.className =
            'form-control form-control-sm';


        search.placeholder =
            'Tìm mã HĐ / khách hàng...';


        search.autocomplete =
            'off';


        search.style.width =
            '220px';


        search.setAttribute(
            'aria-label',
            'Tìm kiếm hóa đơn'
        );


        actionArea.insertBefore(
            search,
            actionArea.firstChild
        );


        search.addEventListener(
            'input',
            function () {

                currentSearch =
                    search.value.trim();

                applyInvoiceFilters();

            }
        );


        return search;

    }


    // =======================================================
    // ERROR
    // =======================================================

    function clearInvoiceError() {

        const existing =
            getElement(
                'invoiceErrorAlert'
            );


        if (existing) {
            existing.remove();
        }

    }


    function showInvoiceError(
        message
    ) {

        clearInvoiceError();


        const tableBody =
            getElement(
                'invoicesTableBody'
            );


        if (!tableBody) {
            return;
        }


        const tableBox =
            tableBody.closest(
                '.table-box'
            );


        if (!tableBox) {
            return;
        }


        const alert =
            document.createElement(
                'div'
            );


        alert.id =
            'invoiceErrorAlert';


        alert.className =
            'ui-alert ui-alert-warning mt-3';


        alert.innerHTML = `
      <i class="fa-solid fa-circle-exclamation"></i>

      <div>

        <div class="fw-bold">
          Không thể tải danh sách hóa đơn
        </div>

        <div class="small">
          ${escapeHtml(
            message ||
            'Vui lòng kiểm tra kết nối tới máy chủ.'
        )}
        </div>

      </div>
    `;


        const tableResponsive =
            tableBox.querySelector(
                '.table-responsive'
            );


        if (tableResponsive) {

            tableBox.insertBefore(
                alert,
                tableResponsive
            );

        } else {

            tableBox.appendChild(
                alert
            );

        }

    }


    // =======================================================
    // LOADING
    // =======================================================

    function renderInvoiceLoading() {

        const tbody =
            getElement(
                'invoicesTableBody'
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>

        <td
          colspan="8"
          class="text-center py-5"
        >

          <div class="ui-loading">

            <div class="ui-spinner"></div>

            <div>
              Đang tải danh sách hóa đơn...
            </div>

          </div>

        </td>

      </tr>
    `;


        renderInvoiceResultCount(
            0
        );

    }


    // =======================================================
    // EMPTY
    // =======================================================

    function renderInvoiceEmpty(
        message =
            'Không có hóa đơn nào phù hợp.'
    ) {

        const tbody =
            getElement(
                'invoicesTableBody'
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>

        <td
          colspan="8"
          class="text-center text-muted py-5"
        >

          <div class="ui-empty">

            <div class="ui-empty-icon">
              <i class="fa-solid fa-file-invoice"></i>
            </div>

            <div class="ui-empty-title">
              ${escapeHtml(
            message
        )}
            </div>

            <div class="ui-empty-text">
              Không có dữ liệu hóa đơn để hiển thị.
            </div>

          </div>

        </td>

      </tr>
    `;


        renderInvoiceResultCount(
            0
        );

    }


    // =======================================================
    // FE-26 - PAYMENT ACTION
    // =======================================================

    function buildPaymentButton(
        invoice
    ) {

        const invoiceId =
            safeNumber(
                invoice?.id
            );


        const invoiceCode =
            safeText(
                invoice?.invoiceCode,
                ''
            );


        const remaining =
            safeNumber(
                invoice?.remainingAmount
            );


        // Hóa đơn đã thanh toán hết
        if (
            remaining <= 0
        ) {

            return `
        <button
          type="button"
          class="btn btn-sm btn-outline-success"
          disabled
          title="Hóa đơn đã tất toán"
        >
          <i class="fa-solid fa-circle-check me-1"></i>
          Đã tất toán
        </button>
      `;

        }


        // Chưa có ID hợp lệ
        if (!invoiceId) {

            return `
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          disabled
        >
          <i class="fa-solid fa-hand-holding-dollar me-1"></i>
          Thu Tiền
        </button>
      `;

        }


        return `
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
        title="Ghi nhận thanh toán"
      >
        <i class="fa-solid fa-hand-holding-dollar me-1"></i>
        Thu Tiền
      </button>
    `;

    }


    // =======================================================
    // TABLE
    // =======================================================

    function renderInvoicesTable(
        invoices
    ) {

        const tbody =
            getElement(
                'invoicesTableBody'
            );


        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(
                invoices
            )
                ? invoices
                : [];


        if (items.length === 0) {

            renderInvoiceEmpty();

            return;
        }


        tbody.innerHTML =
            items
                .map(
                    function (invoice) {

                        const invoiceId =
                            safeNumber(
                                invoice?.id
                            );


                        const status =
                            safeText(
                                invoice?.status
                            );


                        const statusClass =
                            getStatusClass(
                                status
                            );


                        const statusText =
                            getStatusText(
                                status
                            );


                        const invoiceCode =
                            safeText(
                                invoice?.invoiceCode
                            );


                        const clientName =
                            getClientName(
                                invoice
                            );


                        const dueDate =
                            safeText(
                                invoice?.dueDate
                            );


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
                            clientName
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
                  ${escapeHtml(
                            dueDate
                        )}
                </td>


                <td>
                  <span
                    class="status-badge ${statusClass}"
                  >
                    ${escapeHtml(
                            statusText
                        )}
                  </span>
                </td>


                <td>

                  <div
                    class="d-flex gap-1 flex-wrap"
                  >

                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      ${invoiceId
                                ? `onclick="viewInvoiceDetail(${invoiceId})"`
                                : 'disabled'
                            }
                    >
                      <i
                        class="fa-solid fa-file-lines me-1"
                      ></i>
                      Xem &amp; In
                    </button>

                    ${buildPaymentButton(
                                invoice
                            )}

                  </div>

                </td>

              </tr>
            `;

                    }
                )
                .join('');


        renderInvoiceResultCount(
            items.length
        );

    }


    // =======================================================
    // FILTER
    // =======================================================

    function getFilteredInvoices() {

        const statusEl =
            getElement(
                'invoiceFilterStatus'
            );


        const selectedStatus =
            statusEl
                ? statusEl.value
                : 'All';


        const search =
            normalize(
                currentSearch
            );


        return currentInvoices.filter(
            function (invoice) {

                const invoiceStatus =
                    safeText(
                        invoice?.status,
                        ''
                    );


                const statusMatches =
                    selectedStatus === 'All' ||
                    invoiceStatus ===
                    selectedStatus;


                const code =
                    normalize(
                        invoice?.invoiceCode
                    );


                const client =
                    normalize(
                        getClientName(
                            invoice
                        )
                    );


                const searchMatches =
                    !search ||
                    code.includes(
                        search
                    ) ||
                    client.includes(
                        search
                    );


                return (
                    statusMatches &&
                    searchMatches
                );

            }
        );

    }


    function applyInvoiceFilters() {

        const filtered =
            getFilteredInvoices();


        renderInvoicesTable(
            filtered
        );


        renderInvoiceResultCount(
            filtered.length
        );

    }


    // =======================================================
    // API - GET INVOICES
    // =======================================================

    async function getInvoices() {

        const statusEl =
            getElement(
                'invoiceFilterStatus'
            );


        const selectedStatus =
            statusEl
                ? statusEl.value
                : 'All';


        const query =
            selectedStatus &&
                selectedStatus !== 'All'
                ? `?status=${encodeURIComponent(
                    selectedStatus
                )}`
                : '';


        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                `/invoices${query}`
            );

        }


        const response =
            await fetch(
                `/api/invoices${query}`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // LOAD INVOICES
    // =======================================================

    async function loadInvoices() {

        clearInvoiceError();

        ensureInvoiceSearch();

        renderInvoiceLoading();


        try {

            const data =
                await getInvoices();


            currentInvoices =
                Array.isArray(
                    data?.invoices
                )
                    ? data.invoices
                    : [];


            applyInvoiceFilters();


            console.log(
                'Invoice list loaded successfully.',
                {
                    count:
                        currentInvoices.length
                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải danh sách hóa đơn:',
                error
            );


            currentInvoices =
                [];


            renderInvoiceEmpty(
                'Không thể tải danh sách hóa đơn.'
            );


            showInvoiceError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );

        }

    }


    // =======================================================
    // VIEW INVOICE DETAIL
    // =======================================================

    async function viewInvoiceDetail(
        invoiceId
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


        try {

            let data;


            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.get ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.get(
                        `/invoices/${id}`
                    );

            } else {

                const response =
                    await fetch(
                        `/api/invoices/${id}`
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
                !data?.success ||
                !data?.invoice
            ) {

                throw new Error(
                    data?.message ||
                    'Không tìm thấy thông tin hóa đơn!'
                );

            }


            const invoice =
                data.invoice;


            const setText =
                function (
                    elementId,
                    value
                ) {

                    const element =
                        getElement(
                            elementId
                        );


                    if (element) {

                        element.textContent =
                            value ?? '';

                    }

                };


            // -----------------------------------------------
            // HEADER
            // -----------------------------------------------

            setText(
                'invDetailCode',
                safeText(
                    invoice?.invoiceCode
                )
            );


            setText(
                'invDetailIssueDate',
                safeText(
                    invoice?.issueDate
                )
            );


            setText(
                'invDetailDueDate',
                safeText(
                    invoice?.dueDate
                )
            );


            // -----------------------------------------------
            // CLIENT
            // -----------------------------------------------

            setText(
                'invDetailClientName',
                getClientName(
                    invoice
                )
            );


            setText(
                'invDetailTaxCode',
                safeText(
                    invoice?.Client?.taxCode
                )
            );


            setText(
                'invDetailAddress',
                safeText(
                    invoice?.Client?.address
                )
            );


            // -----------------------------------------------
            // PLACEMENT
            // -----------------------------------------------

            const candidateName =
                invoice?.Placement
                    ?.Candidate
                    ?.fullName ||
                'Ứng viên';


            const jobTitle =
                invoice?.Placement
                    ?.Job
                    ?.title ||
                'Chuyên viên';


            setText(
                'invDetailPlacementInfo',
                `${candidateName} - ${jobTitle}`
            );


            // -----------------------------------------------
            // MONEY
            // -----------------------------------------------

            setText(
                'invDetailSubtotal',
                formatMoneySafe(
                    invoice?.subtotal
                )
            );


            setText(
                'invDetailSubtotalFoot',
                formatMoneySafe(
                    invoice?.subtotal
                )
            );


            setText(
                'invDetailVat',
                formatMoneySafe(
                    invoice?.vatAmount
                )
            );


            setText(
                'invDetailTotal',
                formatMoneySafe(
                    invoice?.totalAmount
                )
            );


            setText(
                'invDetailPaid',
                formatMoneySafe(
                    invoice?.paidAmount
                )
            );


            setText(
                'invDetailRemaining',
                formatMoneySafe(
                    invoice?.remainingAmount
                )
            );


            // -----------------------------------------------
            // STATUS
            // -----------------------------------------------

            const status =
                safeText(
                    invoice?.status
                );


            const statusBadgeEl =
                getElement(
                    'invDetailStatusBadge'
                );


            if (statusBadgeEl) {

                statusBadgeEl.innerHTML = `
          <span
            class="status-badge ${getStatusClass(
                    status
                )}"
          >
            ${escapeHtml(
                    getStatusText(
                        status
                    )
                )}
          </span>
        `;

            }


            // -----------------------------------------------
            // MODAL
            // -----------------------------------------------

            const modalEl =
                getElement(
                    'modalInvoiceDetail'
                );


            if (
                modalEl &&
                window.bootstrap?.Modal
            ) {

                const footer =
                    modalEl.querySelector(
                        '.modal-footer'
                    );


                if (footer) {

                    let paymentButton =
                        getElement(
                            'invoiceDetailPaymentButton'
                        );


                    if (!paymentButton) {

                        paymentButton =
                            document.createElement(
                                'button'
                            );


                        paymentButton.id =
                            'invoiceDetailPaymentButton';


                        paymentButton.type =
                            'button';


                        paymentButton.className =
                            'btn btn-success';


                        footer.insertBefore(
                            paymentButton,
                            footer.lastElementChild
                        );

                    }


                    const remaining =
                        safeNumber(
                            invoice?.remainingAmount
                        );


                    if (
                        remaining > 0 &&
                        safeNumber(
                            invoice?.id
                        ) > 0
                    ) {

                        paymentButton.disabled =
                            false;


                        paymentButton.innerHTML = `
              <i class="fa-solid fa-hand-holding-dollar me-1"></i>
              Thu Tiền
            `;


                        paymentButton.onclick =
                            function () {

                                const paymentModal =
                                    window.bootstrap?.Modal
                                        .getInstance(
                                            modalEl
                                        );


                                if (paymentModal) {
                                    paymentModal.hide();
                                }


                                setTimeout(
                                    function () {

                                        if (
                                            typeof window.openRecordPayment ===
                                            'function'
                                        ) {

                                            window.openRecordPayment(
                                                safeNumber(
                                                    invoice.id
                                                ),
                                                safeText(
                                                    invoice.invoiceCode,
                                                    ''
                                                ),
                                                remaining
                                            );

                                        } else {

                                            alert(
                                                'Chức năng thanh toán chưa được tải.'
                                            );

                                        }

                                    },
                                    180
                                );

                            };

                    } else {

                        paymentButton.disabled =
                            true;


                        paymentButton.innerHTML = `
              <i class="fa-solid fa-circle-check me-1"></i>
              Đã tất toán
            `;


                        paymentButton.onclick =
                            null;

                    }

                }


                const modal =
                    window.bootstrap.Modal
                        .getOrCreateInstance(
                            modalEl
                        );


                modal.show();


            } else {

                alert(
                    `Chi tiết HĐ ${safeText(
                        invoice?.invoiceCode
                    )} | Còn nợ: ${formatMoneySafe(
                        invoice?.remainingAmount
                    )}`
                );

            }


        } catch (error) {

            console.error(
                'Lỗi xem chi tiết hóa đơn:',
                error
            );


            alert(
                error?.message ||
                'Không thể mở chi tiết hóa đơn!'
            );

        }

    }


    // =======================================================
    // EXPORT CSV
    // =======================================================

    async function exportInvoicesCSV() {

        try {

            let data;


            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.get ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.get(
                        '/invoices'
                    );

            } else {

                const response =
                    await fetch(
                        '/api/invoices'
                    );


                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );

                }


                data =
                    await response.json();

            }


            const invoices =
                Array.isArray(
                    data?.invoices
                )
                    ? data.invoices
                    : [];


            if (
                invoices.length ===
                0
            ) {

                alert(
                    'Không có dữ liệu hóa đơn để xuất.'
                );

                return;

            }


            let csv =
                'Mã Hóa Đơn,Khách Hàng,Tổng Tiền,Đã Trả,Còn Nợ,Hạn Trả,Trạng Thái\n';


            invoices.forEach(
                function (invoice) {

                    const row = [

                        invoice?.invoiceCode ??
                        '',

                        getClientName(
                            invoice
                        ),

                        invoice?.totalAmount ??
                        '',

                        invoice?.paidAmount ??
                        '',

                        invoice?.remainingAmount ??
                        '',

                        invoice?.dueDate ??
                        '',

                        invoice?.status ??
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
                    'Danh_Sach_Hoa_Don.csv'
                );

                return;

            }


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
                'Danh_Sach_Hoa_Don.csv';


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


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

    window.loadInvoices =
        loadInvoices;


    window.viewInvoiceDetail =
        viewInvoiceDetail;


    window.exportInvoicesCSV =
        exportInvoicesCSV;


})(window);