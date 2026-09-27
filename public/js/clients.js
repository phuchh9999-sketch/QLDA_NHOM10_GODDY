/**
 * =========================================================
 * GODDY RECRUIT - Client Management Module
 * FE-19: Client List
 * =========================================================
 *
 * Giữ nguyên chức năng hiện có:
 * - Load danh sách khách hàng
 * - Tìm kiếm
 * - Thêm khách hàng
 * - Xuất CSV
 *
 * FE-19 cải thiện:
 * - Ưu tiên GoddyAPI
 * - Loading state
 * - Error state
 * - Empty state
 * - Đếm số lượng kết quả
 * - Escape dữ liệu HTML
 * - Giữ nguyên contract /api/clients
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


    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    function safeText(value, fallback = '-') {
        const text = String(value ?? '').trim();

        return text || fallback;
    }


    function normalize(value) {
        return String(value ?? '')
            .toLowerCase()
            .trim();
    }


    function ensureGlobalClients() {
        if (!Array.isArray(window.globalClients)) {
            window.globalClients = [];
        }

        return window.globalClients;
    }


    // =======================================================
    // RESULT COUNT
    // =======================================================

    function renderClientResultCount(count) {

        const tableBody =
            getElement(
                'clientsTableBody'
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
                'clientResultCount'
            );


        if (!countElement) {

            countElement =
                document.createElement(
                    'span'
                );


            countElement.id =
                'clientResultCount';


            countElement.className =
                'ui-data-count';


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
            `${count} khách hàng`;

    }


    // =======================================================
    // ERROR STATE
    // =======================================================

    function clearClientError() {

        const existing =
            getElement(
                'clientErrorAlert'
            );

        if (existing) {
            existing.remove();
        }

    }


    function showClientError(message) {

        clearClientError();


        const tableBody =
            getElement(
                'clientsTableBody'
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
            'clientErrorAlert';


        alert.className =
            'ui-alert ui-alert-warning mt-3';


        alert.innerHTML = `
      <i class="fa-solid fa-circle-exclamation"></i>

      <div>
        <div class="fw-bold">
          Không thể tải danh sách khách hàng
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

    function renderClientLoading() {

        const tbody =
            getElement(
                'clientsTableBody'
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="text-center py-5"
        >
          <div class="ui-loading">
            <div class="ui-spinner"></div>

            <div>
              Đang tải danh sách khách hàng...
            </div>
          </div>
        </td>
      </tr>
    `;


        renderClientResultCount(
            0
        );

    }


    // =======================================================
    // EMPTY
    // =======================================================

    function renderClientEmpty(
        message = 'Không có khách hàng nào.'
    ) {

        const tbody =
            getElement(
                'clientsTableBody'
            );


        if (!tbody) {
            return;
        }


        tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="text-center text-muted py-5"
        >
          <div class="ui-empty">
            <div class="ui-empty-icon">
              <i class="fa-solid fa-building"></i>
            </div>

            <div class="ui-empty-title">
              ${escapeHtml(
            message
        )}
            </div>

            <div class="ui-empty-text">
              Chưa có dữ liệu doanh nghiệp để hiển thị.
            </div>
          </div>
        </td>
      </tr>
    `;


        renderClientResultCount(
            0
        );

    }


    // =======================================================
    // RENDER TABLE
    // =======================================================

    function renderClientsTable(
        clients
    ) {

        const tbody =
            getElement(
                'clientsTableBody'
            );


        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(clients)
                ? clients
                : [];


        if (items.length === 0) {

            renderClientEmpty();

            return;
        }


        tbody.innerHTML =
            items
                .map(function (client) {

                    const companyName =
                        safeText(
                            client?.companyName
                        );


                    const address =
                        safeText(
                            client?.address,
                            'Chưa cập nhật'
                        );


                    const taxCode =
                        safeText(
                            client?.taxCode
                        );


                    const contactPerson =
                        safeText(
                            client?.contactPerson
                        );


                    const email =
                        safeText(
                            client?.contactEmail
                        );


                    const phone =
                        safeText(
                            client?.contactPhone,
                            ''
                        );


                    const paymentDays =
                        safeText(
                            client?.paymentTermDays,
                            '30'
                        );


                    const status =
                        safeText(
                            client?.status,
                            'Active'
                        );


                    const statusClass =
                        normalize(status) === 'active'
                            ? 'badge-paid'
                            : 'badge-sent';


                    return `
            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                        companyName
                    )}
                </strong>

                <br>

                <small class="text-muted">
                  ${escapeHtml(
                        address
                    )}
                </small>
              </td>


              <td>
                <code>
                  ${escapeHtml(
                        taxCode
                    )}
                </code>
              </td>


              <td>
                ${escapeHtml(
                        contactPerson
                    )}
              </td>


              <td>
                <small>
                  ${escapeHtml(
                        email
                    )}
                </small>

                ${phone
                            ? `
                      <br>
                      <small class="text-muted">
                        ${escapeHtml(
                                phone
                            )}
                      </small>
                    `
                            : ''
                        }
              </td>


              <td>
                <span class="badge bg-secondary">
                  Net ${escapeHtml(
                            paymentDays
                        )} ngày
                </span>
              </td>


              <td>
                <span
                  class="status-badge ${statusClass}"
                >
                  ${escapeHtml(
                            status
                        )}
                </span>
              </td>

            </tr>
          `;

                })
                .join('');


        renderClientResultCount(
            items.length
        );

    }


    // =======================================================
    // FILTER
    // =======================================================

    function filterClientsTable() {

        const clients =
            ensureGlobalClients();


        const input =
            getElement(
                'clientSearchInput'
            );


        const query =
            normalize(
                input
                    ? input.value
                    : ''
            );


        if (!query) {

            renderClientsTable(
                clients
            );

            return;
        }


        const filtered =
            clients.filter(
                function (client) {

                    const companyName =
                        normalize(
                            client?.companyName
                        );


                    const taxCode =
                        normalize(
                            client?.taxCode
                        );


                    const contactPerson =
                        normalize(
                            client?.contactPerson
                        );


                    return (
                        companyName.includes(
                            query
                        ) ||
                        taxCode.includes(
                            query
                        ) ||
                        contactPerson.includes(
                            query
                        )
                    );

                }
            );


        if (filtered.length === 0) {

            renderClientEmpty(
                'Không tìm thấy khách hàng phù hợp.'
            );

            return;
        }


        renderClientsTable(
            filtered
        );

    }


    // =======================================================
    // API
    // =======================================================

    async function getClients() {

        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.get ===
            'function'
        ) {

            return await window.GoddyAPI.get(
                '/clients'
            );

        }


        const response =
            await fetch(
                '/api/clients'
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // LOAD CLIENTS
    // =======================================================

    async function loadClients() {

        clearClientError();


        renderClientLoading();


        try {

            const data =
                await getClients();


            window.globalClients =
                Array.isArray(
                    data?.clients
                )
                    ? data.clients
                    : [];


            renderClientsTable(
                window.globalClients
            );


            console.log(
                'Client list loaded successfully.',
                {
                    count:
                        window.globalClients.length
                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải danh sách khách hàng:',
                error
            );


            window.globalClients =
                [];


            renderClientEmpty(
                'Không thể tải danh sách khách hàng.'
            );


            showClientError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );

        }

    }


    // =======================================================
    // ADD CLIENT MODAL
    // =======================================================

    function openModalAddClient() {

        const form =
            getElement(
                'formAddClient'
            );


        if (form) {
            form.reset();
        }


        const modalEl =
            getElement(
                'modalAddClient'
            );


        if (
            modalEl &&
            window.bootstrap &&
            window.bootstrap.Modal
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
            'Không tìm thấy hộp thoại thêm khách hàng!'
        );

    }


    // =======================================================
    // ADD CLIENT
    // =======================================================

    async function submitAddClient(e) {

        e.preventDefault();


        const getValue =
            function (id) {

                const element =
                    getElement(
                        id
                    );


                return element
                    ? element.value.trim()
                    : '';

            };


        const body = {

            companyName:
                getValue(
                    'newClientName'
                ),

            taxCode:
                getValue(
                    'newClientTaxCode'
                ),

            paymentTermDays:
                getValue(
                    'newClientNetDays'
                ),

            address:
                getValue(
                    'newClientAddress'
                ),

            contactPerson:
                getValue(
                    'newClientContactPerson'
                ),

            contactPhone:
                getValue(
                    'newClientContactPhone'
                ),

            contactEmail:
                getValue(
                    'newClientContactEmail'
                )

        };


        if (!body.companyName) {

            alert(
                'Vui lòng nhập tên doanh nghiệp.'
            );

            return;
        }


        if (!body.taxCode) {

            alert(
                'Vui lòng nhập mã số thuế.'
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
                        '/clients',
                        body
                    );

            } else {

                const response =
                    await fetch(
                        '/api/clients',
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
                        'modalAddClient'
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
                    'Thêm khách hàng doanh nghiệp thành công!'
                );


                await loadClients();


                return;
            }


            alert(
                data?.message ||
                'Có lỗi xảy ra khi thêm khách hàng.'
            );


        } catch (error) {

            console.error(
                'Lỗi thêm khách hàng:',
                error
            );


            alert(
                error?.message ||
                'Lỗi kết nối máy chủ!'
            );

        }

    }


    // =======================================================
    // EXPORT CSV
    // =======================================================

    function exportClientsCSV() {

        const clients =
            ensureGlobalClients();


        if (
            clients.length ===
            0
        ) {

            alert(
                'Không có dữ liệu khách hàng để xuất.'
            );

            return;
        }


        let csv =
            'ID,Doanh Nghiệp,Mã Số Thuế,Địa Chỉ,Người Liên Hệ,Email,Điện Thoại,NetDays\n';


        clients.forEach(
            function (client) {

                const row = [

                    client?.id ?? '',

                    client?.companyName ?? '',

                    client?.taxCode ?? '',

                    client?.address ?? '',

                    client?.contactPerson ?? '',

                    client?.contactEmail ?? '',

                    client?.contactPhone ?? '',

                    client?.paymentTermDays ?? ''

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
                'Danh_Sach_Khach_Hang_B2B.csv'
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
            'Danh_Sach_Khach_Hang_B2B.csv';


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
    // GLOBAL EXPORTS
    // =======================================================

    window.loadClients =
        loadClients;


    window.renderClientsTable =
        renderClientsTable;


    window.filterClientsTable =
        filterClientsTable;


    window.openModalAddClient =
        openModalAddClient;


    window.submitAddClient =
        submitAddClient;


    window.exportClientsCSV =
        exportClientsCSV;


})(window);