/**
 * =========================================================
 * GODDY RECRUIT - Debt & Aging Module
 * FE-15: Debt Overview
 * =========================================================
 *
 * Giữ nguyên các chức năng hiện có:
 * - Tải tổng quan công nợ / aging
 * - Hiển thị 3 KPI tuổi nợ
 * - Hiển thị danh sách công nợ
 * - Ghi nhận thanh toán
 * - Gửi nhắc nợ
 * - Xuất CSV
 *
 * FE-15 cải thiện:
 * - Ưu tiên dùng GoddyAPI khi có
 * - Fallback fetch để không phá trang cũ
 * - Loading state
 * - Empty state
 * - Error state
 * - Escape dữ liệu khi render HTML
 * - Giữ nguyên endpoint/backend contract hiện tại
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


    // =======================================================
    // ERROR ALERT
    // =======================================================

    function clearDebtError() {

        const existing =
            getElement('debtErrorAlert');

        if (existing) {
            existing.remove();
        }

    }


    function showDebtError(message) {

        clearDebtError();


        const section =
            getElement('section-debt');

        if (!section) {
            return;
        }


        const alert =
            document.createElement('div');

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
    // OVERVIEW LOADING STATE
    // =======================================================

    function setSummaryLoading(isLoading) {

        const ids = [
            'debtAging1to30',
            'debtAging31to60',
            'debtAgingAbove60'
        ];


        ids.forEach(function (id) {

            const element =
                getElement(id);

            if (!element) {
                return;
            }


            if (isLoading) {

                element.dataset.previousValue =
                    element.textContent;

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

        });

    }


    // =======================================================
    // RENDER OVERVIEW
    // =======================================================

    function renderDebtSummary(summary = {}) {

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
    // RENDER EMPTY TABLE
    // =======================================================

    function renderDebtEmpty() {

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
          Hiện không có công nợ cần thu!
        </td>
      </tr>
    `;

    }


    // =======================================================
    // RENDER DEBT TABLE
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
            Array.isArray(debtList)
                ? debtList
                : [];


        if (items.length === 0) {

            renderDebtEmpty();

            return;
        }


        tbody.innerHTML =
            items.map(function (item) {

                const overdueDays =
                    safeNumber(
                        item.overdueDays
                    );


                const invoiceId =
                    safeNumber(
                        item.id
                    );


                const remaining =
                    safeNumber(
                        item.remainingAmount
                    );


                const invoiceCode =
                    item.invoiceCode ||
                    '';


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
                    getClientName(item)
                )}
            </td>

            <td class="text-danger fw-bold">
              ${formatMoneySafe(
                    remaining
                )}
            </td>

            <td>
              ${escapeHtml(
                    item.dueDate || '-'
                )}
            </td>

            <td>
              <span
                class="badge ${overdueDays > 0
                        ? 'bg-danger'
                        : 'bg-success'
                    }"
              >
                ${overdueDays > 0
                        ? overdueDays +
                        ' ngày quá hạn'
                        : 'Trong hạn'
                    }
              </span>
            </td>

            <td>
              <strong>
                ${escapeHtml(
                        item.agingCategory ||
                        '-'
                    )}
              </strong>
            </td>

            <td>
              <div class="d-flex gap-1 flex-wrap">

                <button
                  type="button"
                  class="btn btn-sm btn-success"
                  onclick='openRecordPayment(
                    ${invoiceId},
                    ${JSON.stringify(invoiceCode)},
                    ${remaining}
                  )'
                >
                  <i class="fa-solid fa-hand-holding-dollar me-1"></i>
                  Thu Tiền
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  onclick="sendDebtReminder(${invoiceId})"
                >
                  <i class="fa-solid fa-bell me-1"></i>
                  Nhắc Nợ
                </button>

              </div>
            </td>

          </tr>
        `;

            }).join('');

    }


    // =======================================================
    // API HELPER
    // =======================================================

    async function getDebtOverview() {

        // Ưu tiên API Layer
        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                '/debt/overview'
            );

        }


        // Fallback giữ tương thích
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
    // LOAD DEBT OVERVIEW
    // =======================================================

    async function loadDebt() {

        setSummaryLoading(
            true
        );

        clearDebtError();


        try {

            const data =
                await getDebtOverview();


            // -----------------------------------------------
            // SUMMARY / AGING
            // -----------------------------------------------

            renderDebtSummary(
                data?.summary || {}
            );


            // -----------------------------------------------
            // DETAIL LIST
            // -----------------------------------------------

            renderDebtList(
                data?.debtList || []
            );


            console.log(
                'Debt overview loaded successfully.'
            );


        } catch (error) {

            console.error(
                'Lỗi tải Báo cáo Công Nợ:',
                error
            );


            // Không để KPI bị rỗng
            renderDebtSummary({});


            // Không để bảng trắng khó hiểu
            renderDebtEmpty();


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
    // RECORD PAYMENT MODAL
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
                safeNumber(remaining),
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
                window.bootstrap.Modal.getOrCreateInstance(
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


                // Tải lại overview để KPI và bảng cập nhật
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
    // DEBT REMINDER
    // =======================================================

    async function sendDebtReminder(
        invoiceId
    ) {

        const id =
            safeNumber(invoiceId);


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
                .forEach(function (item) {

                    const row = [

                        item?.invoiceCode ||
                        '',

                        getClientName(item),

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
                            .map(function (value) {

                                return (
                                    '"' +
                                    String(value)
                                        .replace(
                                            /"/g,
                                            '""'
                                        ) +
                                    '"'
                                );

                            })
                            .join(',') +
                        '\n';

                });


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
    // EXPORT GLOBAL FUNCTIONS
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


})(window);