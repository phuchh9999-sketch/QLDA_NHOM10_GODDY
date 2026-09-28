/**
 * =========================================================
 * GODDY RECRUIT - Import / Export Module
 * FE-34
 * =========================================================
 *
 * FE-34:
 * - Import đối tác bằng CSV
 * - Import hóa đơn bằng CSV
 * - Import ứng viên bằng CSV
 * - Kiểm tra dữ liệu trước khi ghi
 * - Không cho import chéo nghiệp vụ
 * - Export CSV / Excel
 * - Export PDF thông qua Print
 *
 * API ghi dữ liệu:
 * - POST /api/clients
 *
 * Các API import trực tiếp cho hóa đơn / ứng viên
 * chưa được xác nhận trong public hiện tại,
 * nên module không tự bịa endpoint.
 *
 * Với hóa đơn / ứng viên:
 * - Đọc file
 * - Parse CSV
 * - Validate
 * - Preview
 * - Báo rõ API ghi cần bổ sung
 *
 * =========================================================
 */

(function (window) {

    'use strict';


    // =======================================================
    // CONFIG
    // =======================================================

    const CONFIG = {

        clients: {

            label:
                'Đối tác',

            entity:
                'clients',

            api:
                '/clients',

            headers: [
                'companyName',
                'taxCode',
                'paymentTermDays',
                'address',
                'contactPerson',
                'contactPhone',
                'contactEmail'
            ]

        },


        invoices: {

            label:
                'Hóa đơn',

            entity:
                'invoices',

            api:
                '/invoices/import',

            headers: [
                'invoiceCode',
                'clientId',
                'issueDate',
                'dueDate',
                'totalAmount',
                'paidAmount',
                'remainingAmount',
                'status'
            ]

        },


        candidates: {

            label:
                'Ứng viên',

            entity:
                'candidates',

            api:
                '/recruitment/candidates/import',

            headers: [
                'fullName',
                'email',
                'currentPosition',
                'status'
            ]

        }

    };


    // =======================================================
    // STATE
    // =======================================================

    let selectedEntity =
        'clients';


    let importedRows =
        [];


    let importedHeaders =
        [];


    let importedFileName =
        '';


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {

        return document.getElementById(id);

    }


    function safeText(
        value,
        fallback = ''
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

        const n =
            Number(
                value
            );


        return Number.isFinite(
            n
        )
            ? n
            : 0;

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


    function normalizeHeader(
        value
    ) {

        return String(
            value ?? ''
        )
            .replace(
                /^\uFEFF/,
                ''
            )
            .trim();

    }


    function showMessage(
        type,
        message
    ) {

        const area =
            getElement(
                'importExportMessage'
            );


        if (!area) {

            alert(
                message
            );

            return;

        }


        area.innerHTML = `

      <div
        class="alert alert-${type} mb-0"
        role="alert"
      >

        <i
          class="fa-solid ${type === 'danger'
                ? 'fa-circle-exclamation'
                : type === 'warning'
                    ? 'fa-triangle-exclamation'
                    : 'fa-circle-check'
            } me-2"
        ></i>

        ${escapeHtml(
                message
            )}

      </div>

    `;

    }


    // =======================================================
    // API
    // =======================================================

    async function apiPost(
        endpoint,
        body
    ) {

        if (
            window.GoddyAPI &&
            typeof window.GoddyAPI.post ===
            'function'
        ) {

            return await window.GoddyAPI.post(
                endpoint,
                body
            );

        }


        const response =
            await fetch(
                `/api${endpoint}`,
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


        return await response.json();

    }


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
    // PANEL
    // =======================================================

    function ensurePanel() {

        if (
            getElement(
                'importExportPanel'
            )
        ) {

            return;

        }


        const clientsSection =
            getElement(
                'section-clients'
            );


        const recruitmentSection =
            getElement(
                'section-recruitment'
            );


        const invoicesSection =
            getElement(
                'section-invoices'
            );


        const debtSection =
            getElement(
                'section-debt'
            );


        const parent =
            clientsSection ||
            recruitmentSection ||
            invoicesSection ||
            debtSection;


        if (!parent) {

            return;

        }


        const panel =
            document.createElement(
                'section'
            );


        panel.id =
            'importExportPanel';


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
              class="fa-solid fa-file-arrow-up text-primary me-2"
            ></i>

            Import / Export Dữ Liệu

          </h3>


          <div
            class="text-muted small mt-1"
          >

            Nhập dữ liệu theo đúng nghiệp vụ và xuất dữ liệu theo bộ lọc

          </div>

        </div>


        <span
          id="importExportStatus"
          class="ui-data-count"
        >
          Chưa chọn file
        </span>

      </div>


      <div
        class="p-3"
      >

        <div
          class="row g-3"
        >

          <div
            class="col-lg-4"
          >

            <label
              class="form-label fw-bold"
            >
              Nghiệp vụ Import
            </label>


            <select
              id="importEntity"
              class="form-select"
            >

              <option value="clients">
                Đối tác
              </option>

              <option value="invoices">
                Hóa đơn
              </option>

              <option value="candidates">
                Ứng viên
              </option>

            </select>


            <div
              class="form-text"
              id="importEntityHelp"
            >

              Kế toán viên nhập đối tác.

            </div>

          </div>


          <div
            class="col-lg-5"
          >

            <label
              class="form-label fw-bold"
            >
              File CSV
            </label>


            <input
              type="file"
              id="importFile"
              class="form-control"
              accept=".csv,text/csv"
            >


            <div
              class="form-text"
            >

              UTF-8 CSV, dòng đầu là tên cột.

            </div>

          </div>


          <div
            class="col-lg-3 d-flex align-items-end"
          >

            <div
              class="d-flex gap-2 w-100"
            >

              <button
                type="button"
                class="btn btn-primary flex-fill"
                id="btnPreviewImport"
              >

                <i
                  class="fa-solid fa-magnifying-glass me-1"
                ></i>

                Kiểm Tra

              </button>


              <button
                type="button"
                class="btn btn-outline-success"
                id="btnImportData"
                disabled
              >

                <i
                  class="fa-solid fa-cloud-arrow-up"
                ></i>

              </button>

            </div>

          </div>

        </div>


        <div
          id="importExportMessage"
          class="mt-3"
        ></div>


        <div
          id="importValidationArea"
          class="mt-3"
        ></div>


        <div
          id="importPreviewArea"
          class="mt-3"
        ></div>


        <div
          class="border-top pt-3 mt-4"
        >

          <div
            class="d-flex justify-content-between align-items-center flex-wrap gap-2"
          >

            <div>

              <div
                class="fw-bold"
              >

                Xuất dữ liệu

              </div>


              <div
                class="small text-muted"
              >

                Xuất dữ liệu hiện có của từng nghiệp vụ.

              </div>

            </div>


            <div
              class="d-flex gap-2 flex-wrap"
            >

              <button
                type="button"
                class="btn btn-sm btn-outline-success"
                id="btnExportClients"
              >

                <i
                  class="fa-solid fa-file-csv me-1"
                ></i>

                Đối tác CSV

              </button>


              <button
                type="button"
                class="btn btn-sm btn-outline-success"
                id="btnExportInvoices"
              >

                <i
                  class="fa-solid fa-file-excel me-1"
                ></i>

                Hóa đơn Excel

              </button>


              <button
                type="button"
                class="btn btn-sm btn-outline-success"
                id="btnExportCandidates"
              >

                <i
                  class="fa-solid fa-file-csv me-1"
                ></i>

                Ứng viên CSV

              </button>


              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                id="btnExportCurrentPdf"
              >

                <i
                  class="fa-solid fa-file-pdf me-1"
                ></i>

                PDF

              </button>

            </div>

          </div>

        </div>

      </div>

    `;


        parent.appendChild(
            panel
        );


        ensureStyles();

        bindEvents();

    }


    // =======================================================
    // STYLES
    // =======================================================

    function ensureStyles() {

        if (
            getElement(
                'importExportStyles'
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'importExportStyles';


        style.textContent = `

      #importExportPanel
        .import-preview-table {

        max-height:
          360px;

        overflow:
          auto;

        border:
          1px solid #e2e8f0;

        border-radius:
          12px;

      }


      #importExportPanel
        .import-preview-table table {

        margin-bottom:
          0;

      }


      #importExportPanel
        .validation-list {

        max-height:
          220px;

        overflow-y:
          auto;

      }


      #importExportPanel
        .validation-item {

        display:
          flex;

        gap:
          8px;

        padding:
          6px 0;

        border-bottom:
          1px solid #f1f5f9;

        font-size:
          13px;

      }


      #importExportPanel
        .validation-item:last-child {

        border-bottom:
          0;

      }

    `;


        document.head.appendChild(
            style
        );

    }


    // =======================================================
    // EVENTS
    // =======================================================

    function bindEvents() {

        getElement(
            'importEntity'
        )?.addEventListener(
            'change',
            onEntityChange
        );


        getElement(
            'importFile'
        )?.addEventListener(
            'change',
            onFileSelected
        );


        getElement(
            'btnPreviewImport'
        )?.addEventListener(
            'click',
            previewImport
        );


        getElement(
            'btnImportData'
        )?.addEventListener(
            'click',
            importData
        );


        getElement(
            'btnExportClients'
        )?.addEventListener(
            'click',
            exportClients
        );


        getElement(
            'btnExportInvoices'
        )?.addEventListener(
            'click',
            exportInvoices
        );


        getElement(
            'btnExportCandidates'
        )?.addEventListener(
            'click',
            exportCandidates
        );


        getElement(
            'btnExportCurrentPdf'
        )?.addEventListener(
            'click',
            exportCurrentPdf
        );

    }


    function onEntityChange() {

        selectedEntity =
            getElement(
                'importEntity'
            )?.value ||
            'clients';


        const help =
            getElement(
                'importEntityHelp'
            );


        if (help) {

            if (
                selectedEntity ===
                'clients'
            ) {

                help.textContent =
                    'Kế toán viên nhập đối tác.';

            } else if (
                selectedEntity ===
                'invoices'
            ) {

                help.textContent =
                    'Kế toán viên nhập hóa đơn. File phải đúng mẫu hóa đơn.';

            } else {

                help.textContent =
                    'HR Recruiter nhập ứng viên.';

            }

        }


        resetImportPreview();

    }


    function onFileSelected() {

        resetImportPreview();


        const file =
            getElement(
                'importFile'
            )?.files?.[0];


        if (!file) {

            return;

        }


        importedFileName =
            file.name;


        const status =
            getElement(
                'importExportStatus'
            );


        if (status) {

            status.textContent =
                importedFileName;

        }

    }


    function resetImportPreview() {

        importedRows =
            [];

        importedHeaders =
            [];


        getElement(
            'importValidationArea'
        ).innerHTML =
            '';


        getElement(
            'importPreviewArea'
        ).innerHTML =
            '';


        const importButton =
            getElement(
                'btnImportData'
            );


        if (importButton) {

            importButton.disabled =
                true;

        }

    }


    // =======================================================
    // CSV PARSER
    // =======================================================

    function parseCsv(
        text
    ) {

        const rows =
            [];


        let current =
            [];


        let value =
            '';


        let quoted =
            false;


        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            const char =
                text[i];


            const next =
                text[i + 1];


            if (char === '"') {

                if (
                    quoted &&
                    next === '"'
                ) {

                    value +=
                        '"';

                    i++;

                } else {

                    quoted =
                        !quoted;

                }


                continue;

            }


            if (
                char === ',' &&
                !quoted
            ) {

                current.push(
                    value
                );

                value =
                    '';

                continue;

            }


            if (
                (
                    char === '\n' ||
                    char === '\r'
                ) &&
                !quoted
            ) {

                if (
                    char === '\r' &&
                    next === '\n'
                ) {

                    i++;

                }


                current.push(
                    value
                );


                rows.push(
                    current
                );


                current =
                    [];


                value =
                    '';


                continue;

            }


            value +=
                char;

        }


        if (
            value.length > 0 ||
            current.length > 0
        ) {

            current.push(
                value
            );


            rows.push(
                current
            );

        }


        return rows.filter(
            function (row) {

                return row.some(
                    function (cell) {

                        return String(
                            cell
                        ).trim() !== '';

                    }
                );

            }
        );

    }


    // =======================================================
    // VALIDATE
    // =======================================================

    function validateRows(
        headers,
        rows
    ) {

        const errors =
            [];


        const config =
            CONFIG[
            selectedEntity
            ];


        const normalizedHeaders =
            headers.map(
                normalizeHeader
            );


        config.headers.forEach(
            function (requiredHeader) {

                if (
                    !normalizedHeaders.includes(
                        requiredHeader
                    )
                ) {

                    errors.push(
                        `Thiếu cột bắt buộc: ${requiredHeader}`
                    );

                }

            }
        );


        if (
            rows.length ===
            0
        ) {

            errors.push(
                'File không có dữ liệu.'
            );

        }


        rows.forEach(
            function (
                row,
                index
            ) {

                const line =
                    index + 2;


                if (
                    selectedEntity ===
                    'clients'
                ) {

                    validateClientRow(
                        row,
                        normalizedHeaders,
                        line,
                        errors
                    );

                }


                if (
                    selectedEntity ===
                    'invoices'
                ) {

                    validateInvoiceRow(
                        row,
                        normalizedHeaders,
                        line,
                        errors
                    );

                }


                if (
                    selectedEntity ===
                    'candidates'
                ) {

                    validateCandidateRow(
                        row,
                        normalizedHeaders,
                        line,
                        errors
                    );

                }

            }
        );


        return errors;

    }


    function columnValue(
        row,
        headers,
        name
    ) {

        const index =
            headers.indexOf(
                name
            );


        return index >= 0
            ? safeText(
                row[index]
            )
            : '';

    }


    function validateClientRow(
        row,
        headers,
        line,
        errors
    ) {

        const companyName =
            columnValue(
                row,
                headers,
                'companyName'
            );


        const taxCode =
            columnValue(
                row,
                headers,
                'taxCode'
            );


        const paymentTerm =
            columnValue(
                row,
                headers,
                'paymentTermDays'
            );


        if (!companyName) {

            errors.push(
                `Dòng ${line}: thiếu companyName`
            );

        }


        if (!taxCode) {

            errors.push(
                `Dòng ${line}: thiếu taxCode`
            );

        }


        if (
            paymentTerm &&
            !Number.isFinite(
                Number(
                    paymentTerm
                )
            )
        ) {

            errors.push(
                `Dòng ${line}: paymentTermDays phải là số`
            );

        }

    }


    function validateInvoiceRow(
        row,
        headers,
        line,
        errors
    ) {

        const invoiceCode =
            columnValue(
                row,
                headers,
                'invoiceCode'
            );


        const clientId =
            columnValue(
                row,
                headers,
                'clientId'
            );


        const totalAmount =
            columnValue(
                row,
                headers,
                'totalAmount'
            );


        if (!invoiceCode) {

            errors.push(
                `Dòng ${line}: thiếu invoiceCode`
            );

        }


        if (!clientId) {

            errors.push(
                `Dòng ${line}: thiếu clientId`
            );

        }


        if (
            !totalAmount ||
            !Number.isFinite(
                Number(
                    totalAmount
                )
            )
        ) {

            errors.push(
                `Dòng ${line}: totalAmount phải là số`
            );

        }

    }


    function validateCandidateRow(
        row,
        headers,
        line,
        errors
    ) {

        const fullName =
            columnValue(
                row,
                headers,
                'fullName'
            );


        const email =
            columnValue(
                row,
                headers,
                'email'
            );


        if (!fullName) {

            errors.push(
                `Dòng ${line}: thiếu fullName`
            );

        }


        if (!email) {

            errors.push(
                `Dòng ${line}: thiếu email`
            );

        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    email
                )
        ) {

            errors.push(
                `Dòng ${line}: email không hợp lệ`
            );

        }

    }


    // =======================================================
    // PREVIEW
    // =======================================================

    async function previewImport() {

        const file =
            getElement(
                'importFile'
            )?.files?.[0];


        if (!file) {

            showMessage(
                'warning',
                'Vui lòng chọn file CSV trước.'
            );

            return;

        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(
                    '.csv'
                )
        ) {

            showMessage(
                'danger',
                'Chỉ chấp nhận file CSV.'
            );

            return;

        }


        resetImportPreview();


        try {

            const text =
                await file.text();


            const csvRows =
                parseCsv(
                    text
                );


            if (
                csvRows.length ===
                0
            ) {

                showMessage(
                    'danger',
                    'File CSV không có dữ liệu.'
                );

                return;

            }


            importedHeaders =
                csvRows.shift()
                    .map(
                        normalizeHeader
                    );


            importedRows =
                csvRows;


            const errors =
                validateRows(
                    importedHeaders,
                    importedRows
                );


            renderValidation(
                errors
            );


            renderPreview();


            const button =
                getElement(
                    'btnImportData'
                );


            if (
                button &&
                errors.length ===
                0
            ) {

                button.disabled =
                    false;

                showMessage(
                    'success',
                    `Kiểm tra thành công ${importedRows.length} dòng. Có thể import.`
                );

            } else {

                showMessage(
                    'danger',
                    `Phát hiện ${errors.length} lỗi. Hãy sửa file rồi kiểm tra lại.`
                );

            }

        } catch (error) {

            console.error(
                'FE-34 CSV error:',
                error
            );


            showMessage(
                'danger',
                'Không thể đọc file CSV.'
            );

        }

    }


    function renderValidation(
        errors
    ) {

        const area =
            getElement(
                'importValidationArea'
            );


        if (!area) {

            return;

        }


        if (
            errors.length ===
            0
        ) {

            area.innerHTML = `

        <div
          class="alert alert-success mb-0"
        >

          <i
            class="fa-solid fa-circle-check me-2"
          ></i>

          Dữ liệu hợp lệ.

        </div>

      `;


            return;

        }


        area.innerHTML = `

      <div
        class="alert alert-danger"
      >

        <div
          class="fw-bold mb-2"
        >

          <i
            class="fa-solid fa-triangle-exclamation me-1"
          ></i>

          Danh sách lỗi

        </div>


        <div
          class="validation-list"
        >

          ${errors
                .slice(
                    0,
                    100
                )
                .map(
                    function (
                        error
                    ) {

                        return `

                  <div
                    class="validation-item"
                  >

                    <i
                      class="fa-solid fa-xmark text-danger"
                    ></i>

                    <span>
                      ${escapeHtml(
                            error
                        )}
                    </span>

                  </div>

                `;

                    }
                )
                .join('')
            }

        </div>

      </div>

    `;

    }


    function renderPreview() {

        const area =
            getElement(
                'importPreviewArea'
            );


        if (!area) {

            return;

        }


        if (
            importedRows.length ===
            0
        ) {

            area.innerHTML =
                '';

            return;

        }


        const previewRows =
            importedRows.slice(
                0,
                20
            );


        area.innerHTML = `

      <div
        class="fw-bold mb-2"
      >

        Xem trước dữ liệu
        <span
          class="text-muted fw-normal"
        >
          (tối đa 20 dòng)
        </span>

      </div>


      <div
        class="import-preview-table"
      >

        <table
          class="table table-sm table-hover"
        >

          <thead>

            <tr>

              ${importedHeaders
                .map(
                    function (
                        header
                    ) {

                        return `

                      <th>
                        ${escapeHtml(
                            header
                        )}
                      </th>

                    `;

                    }
                )
                .join('')
            }

            </tr>

          </thead>


          <tbody>

            ${previewRows
                .map(
                    function (
                        row
                    ) {

                        return `

                    <tr>

                      ${importedHeaders
                                .map(
                                    function (
                                        _,
                                        index
                                    ) {

                                        return `

                              <td>
                                ${escapeHtml(
                                            safeText(
                                                row[index]
                                            )
                                        )}
                              </td>

                            `;

                                    }
                                )
                                .join('')
                            }

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
    // IMPORT
    // =======================================================

    async function importData() {

        if (
            importedRows.length ===
            0
        ) {

            showMessage(
                'warning',
                'Chưa có dữ liệu hợp lệ để import.'
            );

            return;

        }


        const button =
            getElement(
                'btnImportData'
            );


        if (button) {

            button.disabled =
                true;

        }


        try {

            if (
                selectedEntity ===
                'clients'
            ) {

                await importClients();

            } else {

                /*
                 * Không tự gửi POST tới endpoint chưa
                 * được xác nhận trong public/backend hiện tại.
                 */

                showMessage(
                    'warning',
                    `Đã kiểm tra ${importedRows.length} dòng ${CONFIG[selectedEntity].label}, nhưng Backend hiện chưa có API import trực tiếp được xác nhận. Dữ liệu chưa được ghi vào DB.`
                );

            }

        } catch (error) {

            console.error(
                'FE-34 import error:',
                error
            );


            showMessage(
                'danger',
                error?.message ||
                'Import thất bại.'
            );

        } finally {

            if (button) {

                button.disabled =
                    false;

            }

        }

    }


    async function importClients() {

        const headers =
            importedHeaders;


        let success =
            0;

        let failed =
            0;


        const errors =
            [];


        for (
            let i = 0;
            i < importedRows.length;
            i++
        ) {

            const row =
                importedRows[i];


            const body = {

                companyName:
                    columnValue(
                        row,
                        headers,
                        'companyName'
                    ),

                taxCode:
                    columnValue(
                        row,
                        headers,
                        'taxCode'
                    ),

                paymentTermDays:
                    columnValue(
                        row,
                        headers,
                        'paymentTermDays'
                    ) || 0,

                address:
                    columnValue(
                        row,
                        headers,
                        'address'
                    ),

                contactPerson:
                    columnValue(
                        row,
                        headers,
                        'contactPerson'
                    ),

                contactPhone:
                    columnValue(
                        row,
                        headers,
                        'contactPhone'
                    ),

                contactEmail:
                    columnValue(
                        row,
                        headers,
                        'contactEmail'
                    )

            };


            try {

                const data =
                    await apiPost(
                        '/clients',
                        body
                    );


                if (
                    data?.success ===
                    false
                ) {

                    throw new Error(
                        data?.message ||
                        'Backend từ chối dữ liệu.'
                    );

                }


                success++;

            } catch (error) {

                failed++;


                errors.push(
                    `Dòng ${i + 2
                    }: ${error?.message ||
                    'Lỗi API'
                    }`
                );

            }

        }


        if (
            typeof window.loadClients ===
            'function'
        ) {

            try {

                await window.loadClients();

            } catch (error) {

                console.warn(
                    'Không thể refresh danh sách khách hàng:',
                    error
                );

            }

        }


        if (
            failed ===
            0
        ) {

            showMessage(
                'success',
                `Import thành công ${success} đối tác vào hệ thống.`
            );

        } else {

            showMessage(
                'warning',
                `Import xong: ${success} thành công, ${failed} thất bại.`
            );


            renderValidation(
                errors
            );

        }


        const button =
            getElement(
                'btnImportData'
            );


        if (button) {

            button.disabled =
                true;

        }

    }


    // =======================================================
    // CSV EXPORT
    // =======================================================

    function downloadCsv(
        csv,
        fileName
    ) {

        const blob =
            new Blob(
                [
                    '\ufeff',
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
            fileName;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    }


    function csvEscape(
        value
    ) {

        return (
            '"' +
            String(
                value ?? ''
            )
                .replace(
                    /"/g,
                    '""'
                ) +
            '"'
        );

    }


    async function exportClients() {

        try {

            const data =
                await apiGet(
                    '/clients'
                );


            const rows =
                Array.isArray(
                    data?.clients
                )
                    ? data.clients
                    : [];


            if (
                rows.length ===
                0
            ) {

                alert(
                    'Không có dữ liệu đối tác.'
                );

                return;

            }


            let csv =
                [
                    'ID',
                    'companyName',
                    'taxCode',
                    'paymentTermDays',
                    'address',
                    'contactPerson',
                    'contactPhone',
                    'contactEmail',
                    'status'
                ]
                    .map(
                        csvEscape
                    )
                    .join(',')
                +
                '\n';


            rows.forEach(
                function (client) {

                    csv += [

                        client?.id,

                        client?.companyName,

                        client?.taxCode,

                        client?.paymentTermDays,

                        client?.address,

                        client?.contactPerson,

                        client?.contactPhone,

                        client?.contactEmail,

                        client?.status

                    ]
                        .map(
                            csvEscape
                        )
                        .join(',')
                        +
                        '\n';

                }
            );


            downloadCsv(
                csv,
                'GODDY_Doi_Tac.csv'
            );


        } catch (error) {

            console.error(
                'Export clients:',
                error
            );


            alert(
                error?.message ||
                'Không thể xuất đối tác.'
            );

        }

    }


    async function exportInvoices() {

        try {

            const data =
                await apiGet(
                    '/invoices'
                );


            const rows =
                Array.isArray(
                    data?.invoices
                )
                    ? data.invoices
                    : [];


            if (
                rows.length ===
                0
            ) {

                alert(
                    'Không có dữ liệu hóa đơn.'
                );

                return;

            }


            let csv =
                [

                    'Mã Hóa Đơn',

                    'Khách Hàng',

                    'Ngày Lập',

                    'Hạn Trả',

                    'Tổng Tiền',

                    'Đã Thanh Toán',

                    'Còn Nợ',

                    'Trạng Thái'

                ]
                    .map(
                        csvEscape
                    )
                    .join(',')
                +
                '\n';


            rows.forEach(
                function (invoice) {

                    csv += [

                        invoice?.invoiceCode,

                        invoice?.Client
                            ?.companyName,

                        invoice?.issueDate,

                        invoice?.dueDate,

                        invoice?.totalAmount,

                        invoice?.paidAmount,

                        invoice?.remainingAmount,

                        invoice?.status

                    ]
                        .map(
                            csvEscape
                        )
                        .join(',')
                        +
                        '\n';

                }
            );


            downloadCsv(
                csv,
                'GODDY_Hoa_Don.xls'
            );


        } catch (error) {

            console.error(
                'Export invoices:',
                error
            );


            alert(
                error?.message ||
                'Không thể xuất hóa đơn.'
            );

        }

    }


    async function exportCandidates() {

        try {

            const data =
                await apiGet(
                    '/recruitment/candidates'
                );


            const rows =
                Array.isArray(
                    data?.candidates
                )
                    ? data.candidates
                    : [];


            if (
                rows.length ===
                0
            ) {

                alert(
                    'Không có dữ liệu ứng viên.'
                );

                return;

            }


            let csv =
                [

                    'ID',

                    'Họ Tên',

                    'Email',

                    'Vị Trí',

                    'Trạng Thái'

                ]
                    .map(
                        csvEscape
                    )
                    .join(',')
                +
                '\n';


            rows.forEach(
                function (candidate) {

                    csv += [

                        candidate?.id,

                        candidate?.fullName,

                        candidate?.email,

                        candidate?.currentPosition,

                        candidate?.status

                    ]
                        .map(
                            csvEscape
                        )
                        .join(',')
                        +
                        '\n';

                }
            );


            downloadCsv(
                csv,
                'GODDY_Ung_Vien.csv'
            );


        } catch (error) {

            console.error(
                'Export candidates:',
                error
            );


            alert(
                error?.message ||
                'Không thể xuất ứng viên.'
            );

        }

    }


    // =======================================================
    // PDF
    // =======================================================

    function exportCurrentPdf() {

        const panel =
            getElement(
                'importExportPanel'
            );


        if (!panel) {

            alert(
                'Không tìm thấy khu vực xuất dữ liệu.'
            );

            return;

        }


        const printWindow =
            window.open(
                '',
                '_blank',
                'width=1200,height=800'
            );


        if (!printWindow) {

            alert(
                'Trình duyệt đang chặn popup.'
            );

            return;

        }


        const clone =
            panel.cloneNode(
                true
            );


        clone.querySelector(
            '#importFile'
        )?.remove();


        clone.querySelector(
            '#btnPreviewImport'
        )?.remove();


        clone.querySelector(
            '#btnImportData'
        )?.remove();


        printWindow.document.open();


        printWindow.document.write(`

<!DOCTYPE html>

<html lang="vi">

<head>

<meta charset="UTF-8">

<title>
GODDY RECRUIT - Import Export
</title>


<style>

body {

  font-family:
    Arial,
    sans-serif;

  margin:
    25px;

  color:
    #0f172a;

}


h1 {

  margin-bottom:
    4px;

}


.subtitle {

  color:
    #64748b;

  margin-bottom:
    18px;

}


table {

  width:
    100%;

  border-collapse:
    collapse;

}


th,
td {

  border:
    1px solid #cbd5e1;

  padding:
    7px;

}


th {

  background:
    #f8fafc;

}


button,
select,
input {

  display:
    none;

}

</style>

</head>


<body>

<h1>
GODDY RECRUIT - Import / Export
</h1>


<div
  class="subtitle"
>
Báo cáo dữ liệu hiện tại
</div>


${clone.outerHTML}


<script>

window.onload =
  function () {

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


        printWindow.document.close();

    }


    // =======================================================
    // EXPORT GLOBAL
    // =======================================================

    window.GoddyImportExport = {

        initialize:
            ensurePanel,

        preview:
            previewImport,

        importData:
            importData,

        exportClients:
            exportClients,

        exportInvoices:
            exportInvoices,

        exportCandidates:
            exportCandidates,

        exportPdf:
            exportCurrentPdf

    };


    // =======================================================
    // INIT
    // =======================================================

    function initialize() {

        ensurePanel();

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