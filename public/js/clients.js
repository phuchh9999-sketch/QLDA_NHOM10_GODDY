/**
 * =========================================================
 * GODDY RECRUIT - Client Management Module
 * FE-19 / FE-20
 * =========================================================
 *
 * FE-19:
 * - Load danh sách khách hàng
 * - Tìm kiếm tên / MST / người liên hệ
 * - Loading / Empty / Error state
 * - Xuất CSV
 *
 * FE-20:
 * - Dùng lại modal hiện có để Thêm / Sửa khách hàng
 * - Tự chuyển tiêu đề modal theo chế độ
 * - Tự thêm cột Thao tác vào bảng
 * - Chỉnh sửa dữ liệu khách hàng
 * - Xác nhận trước khi cập nhật
 * - Loading button khi submit
 * - Ưu tiên GoddyAPI
 *
 * Giữ nguyên:
 * - clients.html hiện tại
 * - Endpoint /api/clients
 * - Các field backend hiện có
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // STATE
    // =======================================================

    let editingClientId = null;


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


    function getClientsState() {

        if (
            typeof globalClients !== 'undefined' &&
            Array.isArray(globalClients)
        ) {
            return globalClients;
        }

        return [];
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
            `${count} khách hàng`;

    }


    // =======================================================
    // ERROR
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
          colspan="7"
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
          colspan="7"
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
    // TABLE ACTION HEADER
    // =======================================================

    function ensureClientsActionColumn() {

        const tbody =
            getElement(
                'clientsTableBody'
            );


        if (!tbody) {
            return;
        }


        const table =
            tbody.closest(
                'table'
            );


        if (!table) {
            return;
        }


        const headerRow =
            table.querySelector(
                'thead tr'
            );


        if (!headerRow) {
            return;
        }


        const headers =
            Array.from(
                headerRow.querySelectorAll(
                    'th'
                )
            );


        const exists =
            headers.some(
                function (header) {

                    return normalize(
                        header.textContent
                    ) === 'thao tác';

                }
            );


        if (!exists) {

            const th =
                document.createElement(
                    'th'
                );


            th.className =
                'text-end';


            th.textContent =
                'Thao Tác';


            headerRow.appendChild(
                th
            );

        }

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


        ensureClientsActionColumn();


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
                .map(
                    function (client) {

                        const clientId =
                            Number(
                                client?.id
                            );


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


                <td class="text-end">
                  <button
                    type="button"
                    class="ui-icon-btn primary"
                    title="Chỉnh sửa khách hàng"
                    onclick="openEditClient(${clientId})"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </button>
                </td>

              </tr>
            `;

                    }
                )
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
            getClientsState();


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
    // API - GET CLIENTS
    // =======================================================

    async function getClients() {

        if (
            window.GoddyAPI?.clients &&
            typeof window.GoddyAPI.clients.list ===
            'function'
        ) {

            return await window.GoddyAPI.clients.list();

        }


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


            const clients =
                Array.isArray(
                    data?.clients
                )
                    ? data.clients
                    : [];


            if (
                typeof globalClients !== 'undefined'
            ) {

                globalClients =
                    clients;

            }


            renderClientsTable(
                clients
            );


            console.log(
                'Client list loaded successfully.',
                {
                    count:
                        clients.length
                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải danh sách khách hàng:',
                error
            );


            if (
                typeof globalClients !== 'undefined'
            ) {

                globalClients =
                    [];

            }


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
    // MODAL MODE
    // =======================================================

    function setClientModalMode(
        mode,
        client = null
    ) {

        const modalEl =
            getElement(
                'modalAddClient'
            );


        if (!modalEl) {
            return;
        }


        const title =
            modalEl.querySelector(
                '.modal-title'
            );


        const submitButton =
            modalEl.querySelector(
                'button[type="submit"]'
            );


        const icon =
            title?.querySelector(
                'i'
            );


        if (mode === 'edit') {

            editingClientId =
                Number(
                    client?.id
                );


            if (icon) {

                icon.className =
                    'fa-solid fa-pen me-2 text-primary';

            }


            if (title) {

                title.lastChild.textContent =
                    'Chỉnh Sửa Khách Hàng Doanh Nghiệp';

            }


            if (submitButton) {

                submitButton.innerHTML = `
          <i class="fa-solid fa-save me-1"></i>
          Lưu Thay Đổi
        `;

            }


            return;

        }


        editingClientId =
            null;


        if (icon) {

            icon.className =
                'fa-solid fa-building me-2 text-primary';

        }


        if (title) {

            title.lastChild.textContent =
                'Thêm Khách Hàng Doanh Nghiệp Mới';

        }


        if (submitButton) {

            submitButton.innerHTML = `
        <i class="fa-solid fa-save me-1"></i>
        Lưu Khách Hàng
      `;

        }

    }


    // =======================================================
    // OPEN ADD
    // =======================================================

    function openModalAddClient() {

        const form =
            getElement(
                'formAddClient'
            );


        if (form) {
            form.reset();
        }


        setClientModalMode(
            'create'
        );


        const modalEl =
            getElement(
                'modalAddClient'
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
            'Không tìm thấy hộp thoại thêm khách hàng!'
        );

    }


    // =======================================================
    // OPEN EDIT
    // =======================================================

    function openEditClient(
        clientId
    ) {

        const id =
            Number(
                clientId
            );


        const clients =
            getClientsState();


        const client =
            clients.find(
                function (item) {

                    return Number(
                        item?.id
                    ) === id;

                }
            );


        if (!client) {

            alert(
                'Không tìm thấy khách hàng cần chỉnh sửa.'
            );

            return;
        }


        const mappings = {

            newClientName:
                client?.companyName ||
                '',

            newClientTaxCode:
                client?.taxCode ||
                '',

            newClientNetDays:
                client?.paymentTermDays ??
                '30',

            newClientAddress:
                client?.address ||
                '',

            newClientContactPerson:
                client?.contactPerson ||
                '',

            newClientContactPhone:
                client?.contactPhone ||
                '',

            newClientContactEmail:
                client?.contactEmail ||
                ''

        };


        Object.keys(
            mappings
        )
            .forEach(
                function (fieldId) {

                    const element =
                        getElement(
                            fieldId
                        );


                    if (element) {

                        element.value =
                            mappings[fieldId];

                    }

                }
            );


        setClientModalMode(
            'edit',
            client
        );


        const modalEl =
            getElement(
                'modalAddClient'
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

        }

    }


    // =======================================================
    // FORM BODY
    // =======================================================

    function collectClientFormData() {

        function valueOf(id) {

            const element =
                getElement(
                    id
                );


            return element
                ? element.value.trim()
                : '';

        }


        return {

            companyName:
                valueOf(
                    'newClientName'
                ),

            taxCode:
                valueOf(
                    'newClientTaxCode'
                ),

            paymentTermDays:
                valueOf(
                    'newClientNetDays'
                ),

            address:
                valueOf(
                    'newClientAddress'
                ),

            contactPerson:
                valueOf(
                    'newClientContactPerson'
                ),

            contactPhone:
                valueOf(
                    'newClientContactPhone'
                ),

            contactEmail:
                valueOf(
                    'newClientContactEmail'
                )

        };

    }


    // =======================================================
    // SUBMIT CREATE / EDIT
    // =======================================================

    async function submitAddClient(e) {

        e.preventDefault();


        const body =
            collectClientFormData();


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


        const submitButton =
            e.submitter ||
            getElement(
                'formAddClient'
            )?.querySelector(
                'button[type="submit"]'
            );


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

        ${editingClientId
                    ? 'Đang lưu...'
                    : 'Đang tạo...'
                }
      `;

        }


        try {

            let data;


            // ---------------------------------------------------
            // UPDATE
            // ---------------------------------------------------

            if (editingClientId) {

                const confirmed =
                    window.confirm(
                        'Bạn có chắc muốn lưu thay đổi khách hàng này không?'
                    );


                if (!confirmed) {
                    return;
                }


                if (
                    window.GoddyAPI?.clients &&
                    typeof window.GoddyAPI.clients.update ===
                    'function'
                ) {

                    data =
                        await window.GoddyAPI.clients.update(
                            editingClientId,
                            body
                        );

                } else if (
                    window.GoddyAPI &&
                    typeof window.GoddyAPI.put ===
                    'function'
                ) {

                    data =
                        await window.GoddyAPI.put(
                            `/clients/${editingClientId}`,
                            body
                        );

                } else {

                    const response =
                        await fetch(
                            `/api/clients/${editingClientId}`,
                            {
                                method:
                                    'PUT',

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
                        'Không thể cập nhật khách hàng.'
                    );

                }


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
                    data?.message ||
                    'Cập nhật khách hàng thành công!'
                );


                editingClientId =
                    null;


                await loadClients();


                return;

            }


            // ---------------------------------------------------
            // CREATE
            // ---------------------------------------------------

            if (
                window.GoddyAPI?.clients &&
                typeof window.GoddyAPI.clients.create ===
                'function'
            ) {

                data =
                    await window.GoddyAPI.clients.create(
                        body
                    );

            } else if (
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
                    'Không thể tạo khách hàng.'
                );

            }


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
                data?.message ||
                'Thêm khách hàng doanh nghiệp thành công!'
            );


            await loadClients();


        } catch (error) {

            console.error(
                editingClientId
                    ? 'Lỗi cập nhật khách hàng:'
                    : 'Lỗi thêm khách hàng:',
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
            <i class="fa-solid fa-save me-1"></i>
            Lưu Khách Hàng
          `;

            }

        }

    }


    // =======================================================
    // EXPORT CSV
    // =======================================================

    function exportClientsCSV() {

        const clients =
            getClientsState();


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
    // EXPORT GLOBAL FUNCTIONS
    // =======================================================

    window.loadClients =
        loadClients;


    window.renderClientsTable =
        renderClientsTable;


    window.filterClientsTable =
        filterClientsTable;


    window.openModalAddClient =
        openModalAddClient;


    window.openEditClient =
        openEditClient;


    window.submitAddClient =
        submitAddClient;


    window.exportClientsCSV =
        exportClientsCSV;


})(window);