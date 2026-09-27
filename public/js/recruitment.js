/**
 * =========================================================
 * GODDY RECRUIT - Recruitment & Placement Module
 * FE-27 / FE-28
 * =========================================================
 *
 * FE-27:
 * - Dashboard tuyển dụng tổng quan
 * - Tổng vị trí tuyển dụng
 * - Vị trí đang mở
 * - Tổng ứng viên
 * - Tổng deal onboard
 * - Deal đang bảo hành
 * - Tổng phí dịch vụ
 * - Biểu đồ trạng thái vị trí
 * - Biểu đồ trạng thái deal
 *
 * FE-28:
 * - Quản lý danh sách vị trí tuyển dụng
 * - Tìm kiếm vị trí / phòng ban
 * - Lọc trạng thái vị trí
 * - Đếm số kết quả
 * - Thêm vị trí tuyển dụng
 * - Validation
 * - Loading / Empty / Error
 *
 * Dữ liệu sử dụng đúng các API đã có trong public hiện tại:
 * - /api/recruitment/jobs
 * - /api/recruitment/candidates
 * - /api/recruitment/placements
 *
 * FE-28 tạo job qua:
 * - POST /api/recruitment/jobs
 *
 * Giữ nguyên:
 * - Chốt Deal Tuyển Dụng
 * - Tính phí dịch vụ
 * - Phát hành hóa đơn từ placement
 * - Không sửa recruitment.html
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // STATE
    // =======================================================

    let recruitmentJobs = [];

    let recruitmentCandidates = [];

    let recruitmentPlacements = [];

    let recruitmentStatusChart = null;

    let placementStatusChart = null;

    let currentJobSearch = '';

    let currentJobStatus = 'All';


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


    function escapeHtml(value) {

        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

    }


    function normalize(value) {

        return String(value ?? '')
            .toLowerCase()
            .trim();

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


    // =======================================================
    // API HELPER
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
                        JSON.stringify(body)
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        return await response.json();

    }


    // =======================================================
    // FE-28 - POSITION MANAGEMENT UI
    // =======================================================

    function ensurePositionManagement() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {
            return null;
        }


        let panel =
            getElement(
                'recruitmentPositionManagement'
            );


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                'div'
            );


        panel.id =
            'recruitmentPositionManagement';


        panel.className =
            'table-box mb-4';


        panel.innerHTML = `

      <div class="box-header">

        <div>

          <h3 class="box-title">

            <i
              class="fa-solid fa-briefcase text-primary me-2"
            ></i>

            Quản Lý Vị Trí Tuyển Dụng

          </h3>

          <div
            class="text-muted small mt-1"
          >
            Quản lý các vị trí tuyển dụng theo doanh nghiệp,
            phòng ban và trạng thái
          </div>

        </div>


        <div
          class="d-flex gap-2 flex-wrap"
        >

          <span
            id="positionResultCount"
            class="ui-data-count"
          >
            0 vị trí
          </span>


          <button
            type="button"
            class="btn btn-sm btn-primary"
            id="btnAddRecruitmentJob"
          >

            <i
              class="fa-solid fa-plus me-1"
            ></i>

            Thêm Vị Trí

          </button>

        </div>

      </div>


      <div
        class="px-3 pt-3"
      >

        <div
          class="d-flex gap-2 flex-wrap"
        >

          <div
            class="input-group"
            style="max-width: 360px;"
          >

            <span
              class="input-group-text bg-white"
            >
              <i
                class="fa-solid fa-magnifying-glass text-muted"
              ></i>
            </span>

            <input
              type="search"
              id="positionSearchInput"
              class="form-control"
              placeholder="Tìm vị trí / phòng ban..."
              autocomplete="off"
              aria-label="Tìm vị trí tuyển dụng"
            >

          </div>


          <select
            id="positionStatusFilter"
            class="form-select"
            style="max-width: 220px;"
            aria-label="Lọc trạng thái vị trí"
          >

            <option value="All">
              Tất cả trạng thái
            </option>

            <option value="Opening">
              Đang tuyển
            </option>

            <option value="Closed">
              Đã đóng
            </option>

          </select>


          <button
            type="button"
            class="btn btn-outline-secondary"
            id="btnResetPositionFilter"
          >

            <i
              class="fa-solid fa-rotate-left me-1"
            ></i>

            Xóa lọc

          </button>

        </div>

      </div>


      <div
        id="positionErrorAlert"
        class="mx-3 mt-3"
        style="display:none;"
      ></div>


      <div
        class="table-responsive mt-3"
      >

        <table
          class="table table-hover mb-0"
        >

          <thead>

            <tr>

              <th>
                #
              </th>

              <th>
                Vị Trí
              </th>

              <th>
                Phòng Ban
              </th>

              <th>
                Khách Hàng
              </th>

              <th>
                Mức Lương
              </th>

              <th>
                Phí Dịch Vụ
              </th>

              <th>
                Trạng Thái
              </th>

            </tr>

          </thead>

          <tbody
            id="positionManagementTableBody"
          ></tbody>

        </table>

      </div>

    `;


        const existingDashboard =
            getElement(
                'recruitmentDashboard'
            );


        if (existingDashboard) {

            section.insertBefore(
                panel,
                existingDashboard
            );

        } else {

            const firstTable =
                section.querySelector(
                    '.table-box'
                );


            if (firstTable) {

                section.insertBefore(
                    panel,
                    firstTable
                );

            } else {

                section.prepend(
                    panel
                );

            }

        }


        const addButton =
            getElement(
                'btnAddRecruitmentJob'
            );


        if (addButton) {

            addButton.addEventListener(
                'click',
                function () {

                    openRecruitmentJobModal();

                }
            );

        }


        const searchInput =
            getElement(
                'positionSearchInput'
            );


        if (searchInput) {

            searchInput.addEventListener(
                'input',
                function () {

                    currentJobSearch =
                        searchInput.value.trim();

                    applyPositionFilters();

                }
            );

        }


        const statusFilter =
            getElement(
                'positionStatusFilter'
            );


        if (statusFilter) {

            statusFilter.addEventListener(
                'change',
                function () {

                    currentJobStatus =
                        statusFilter.value;

                    applyPositionFilters();

                }
            );

        }


        const resetButton =
            getElement(
                'btnResetPositionFilter'
            );


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    currentJobSearch =
                        '';

                    currentJobStatus =
                        'All';


                    if (searchInput) {

                        searchInput.value =
                            '';

                    }


                    if (statusFilter) {

                        statusFilter.value =
                            'All';

                    }


                    applyPositionFilters();

                }
            );

        }


        ensureRecruitmentJobModal();


        return panel;

    }


    // =======================================================
    // FE-28 - POSITION RESULT COUNT
    // =======================================================

    function renderPositionResultCount(
        count
    ) {

        const element =
            getElement(
                'positionResultCount'
            );


        if (!element) {
            return;
        }


        element.textContent =
            `${count} vị trí`;

    }


    // =======================================================
    // FE-28 - POSITION ERROR
    // =======================================================

    function clearPositionError() {

        const element =
            getElement(
                'positionErrorAlert'
            );


        if (!element) {
            return;
        }


        element.style.display =
            'none';


        element.innerHTML =
            '';

    }


    function showPositionError(
        message
    ) {

        const element =
            getElement(
                'positionErrorAlert'
            );


        if (!element) {
            return;
        }


        element.style.display =
            'block';


        element.innerHTML = `
      <div
        class="ui-alert ui-alert-warning"
      >

        <i
          class="fa-solid fa-circle-exclamation"
        ></i>

        <div>

          <div class="fw-bold">
            Không thể tải danh sách vị trí
          </div>

          <div class="small">
            ${escapeHtml(
            message ||
            'Vui lòng kiểm tra kết nối tới máy chủ.'
        )}
          </div>

        </div>

      </div>
    `;

    }


    // =======================================================
    // FE-28 - POSITION LOADING
    // =======================================================

    function renderPositionLoading() {

        const tbody =
            getElement(
                'positionManagementTableBody'
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

          <div
            class="ui-loading"
          >

            <div
              class="ui-spinner"
            ></div>

            <div>
              Đang tải danh sách vị trí...
            </div>

          </div>

        </td>

      </tr>
    `;


        renderPositionResultCount(
            0
        );

    }


    // =======================================================
    // FE-28 - POSITION EMPTY
    // =======================================================

    function renderPositionEmpty(
        message =
            'Chưa có vị trí tuyển dụng nào.'
    ) {

        const tbody =
            getElement(
                'positionManagementTableBody'
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

          <div
            class="ui-empty"
          >

            <div
              class="ui-empty-icon"
            >
              <i
                class="fa-solid fa-briefcase"
              ></i>
            </div>

            <div
              class="ui-empty-title"
            >
              ${escapeHtml(
            message
        )}
            </div>

            <div
              class="ui-empty-text"
            >
              Chưa có dữ liệu vị trí để hiển thị.
            </div>

          </div>

        </td>

      </tr>
    `;


        renderPositionResultCount(
            0
        );

    }


    // =======================================================
    // FE-28 - POSITION TABLE
    // =======================================================

    function renderPositionTable(
        jobs
    ) {

        const tbody =
            getElement(
                'positionManagementTableBody'
            );


        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(jobs)
                ? jobs
                : [];


        if (
            items.length ===
            0
        ) {

            renderPositionEmpty(
                currentJobSearch ||
                    currentJobStatus !== 'All'
                    ? 'Không tìm thấy vị trí phù hợp.'
                    : 'Chưa có vị trí tuyển dụng nào.'
            );

            return;

        }


        tbody.innerHTML =
            items
                .map(
                    function (job) {

                        const id =
                            safeNumber(
                                job?.id
                            );


                        const status =
                            safeText(
                                job?.status
                            );


                        const isOpening =
                            normalize(
                                status
                            ) ===
                            'opening';


                        const statusClass =
                            isOpening
                                ? 'bg-success'
                                : 'bg-secondary';


                        const statusText =
                            isOpening
                                ? 'Đang tuyển'
                                : 'Đã đóng';


                        return `

              <tr>

                <td>
                  <span
                    class="badge bg-light text-dark border"
                  >
                    #${id}
                  </span>
                </td>


                <td>

                  <strong>
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
                                'Chưa cập nhật'
                            )
                        )}
                </td>


                <td>
                  ${escapeHtml(
                            job?.Client
                                ?.companyName ||
                            '-'
                        )}
                </td>


                <td>
                  ${escapeHtml(
                            safeText(
                                job?.salaryRange,
                                'Thỏa thuận'
                            )
                        )}
                </td>


                <td>
                  <span
                    class="badge bg-light text-success border"
                  >
                    ${safeNumber(
                            job?.feeRatePercent
                        )}%
                  </span>
                </td>


                <td>

                  <span
                    class="badge ${statusClass}"
                  >
                    ${statusText}
                  </span>

                </td>

              </tr>

            `;

                    }
                )
                .join('');


        renderPositionResultCount(
            items.length
        );

    }


    // =======================================================
    // FE-28 - POSITION FILTER
    // =======================================================

    function getFilteredPositions() {

        const search =
            normalize(
                currentJobSearch
            );


        return recruitmentJobs.filter(
            function (job) {

                const title =
                    normalize(
                        job?.title
                    );


                const department =
                    normalize(
                        job?.department
                    );


                const status =
                    safeText(
                        job?.status,
                        ''
                    );


                const searchMatched =
                    !search ||
                    title.includes(
                        search
                    ) ||
                    department.includes(
                        search
                    );


                const statusMatched =
                    currentJobStatus === 'All' ||
                    status ===
                    currentJobStatus;


                return (
                    searchMatched &&
                    statusMatched
                );

            }
        );

    }


    function applyPositionFilters() {

        const filtered =
            getFilteredPositions();


        renderPositionTable(
            filtered
        );

    }


    // =======================================================
    // FE-28 - JOB MODAL
    // =======================================================

    function ensureRecruitmentJobModal() {

        let modal =
            getElement(
                'modalAddRecruitmentJob'
            );


        if (modal) {
            return modal;
        }


        modal =
            document.createElement(
                'div'
            );


        modal.id =
            'modalAddRecruitmentJob';


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
        class="modal-dialog modal-dialog-centered"
      >

        <div
          class="modal-content border-0 shadow-lg"
        >

          <div
            class="modal-header"
          >

            <div>

              <div
                class="text-muted small text-uppercase fw-bold"
              >
                Quản lý vị trí
              </div>

              <h5
                class="modal-title"
              >
                <i
                  class="fa-solid fa-briefcase me-2 text-primary"
                ></i>
                Thêm Vị Trí Tuyển Dụng
              </h5>

            </div>


            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Đóng"
            ></button>

          </div>


          <form
            id="formAddRecruitmentJob"
          >

            <div
              class="modal-body"
            >

              <div
                id="recruitmentJobFormError"
                class="mb-3"
                style="display:none;"
              ></div>


              <div
                class="mb-3"
              >

                <label
                  class="form-label fw-bold"
                  for="recruitmentJobClientId"
                >
                  Khách hàng (Doanh nghiệp) *
                </label>

                <select
                  id="recruitmentJobClientId"
                  class="form-select"
                  required
                >

                  <option value="">
                    -- Chọn khách hàng --
                  </option>

                </select>

              </div>


              <div
                class="mb-3"
              >

                <label
                  class="form-label fw-bold"
                  for="recruitmentJobTitle"
                >
                  Vị trí tuyển dụng *
                </label>

                <input
                  type="text"
                  id="recruitmentJobTitle"
                  class="form-control"
                  placeholder="Ví dụ: Senior Data Engineer"
                  maxlength="150"
                  required
                >

              </div>


              <div
                class="mb-3"
              >

                <label
                  class="form-label fw-bold"
                  for="recruitmentJobDepartment"
                >
                  Phòng ban *
                </label>

                <input
                  type="text"
                  id="recruitmentJobDepartment"
                  class="form-control"
                  placeholder="Ví dụ: Công nghệ thông tin"
                  maxlength="120"
                  required
                >

              </div>


              <div
                class="row g-3"
              >

                <div
                  class="col-md-8"
                >

                  <label
                    class="form-label fw-bold"
                    for="recruitmentJobSalary"
                  >
                    Dải lương
                  </label>

                  <input
                    type="text"
                    id="recruitmentJobSalary"
                    class="form-control"
                    placeholder="Ví dụ: 30 - 45 triệu VND"
                  >

                </div>


                <div
                  class="col-md-4"
                >

                  <label
                    class="form-label fw-bold"
                    for="recruitmentJobFeeRate"
                  >
                    Phí dịch vụ (%)
                  </label>

                  <input
                    type="number"
                    id="recruitmentJobFeeRate"
                    class="form-control"
                    value="18"
                    min="0"
                    max="100"
                    step="0.1"
                  >

                </div>

              </div>


              <div
                class="ui-alert ui-alert-info mt-3"
              >

                <i
                  class="fa-solid fa-circle-info"
                ></i>

                <div>
                  Vị trí mới sẽ được tạo ở trạng thái
                  <strong>Đang tuyển</strong>.
                </div>

              </div>

            </div>


            <div
              class="modal-footer"
            >

              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Đóng
              </button>


              <button
                type="submit"
                class="btn btn-primary"
              >

                <i
                  class="fa-solid fa-save me-1"
                ></i>

                Lưu Vị Trí

              </button>

            </div>

          </form>

        </div>

      </div>
    `;


        document.body.appendChild(
            modal
        );


        const form =
            getElement(
                'formAddRecruitmentJob'
            );


        if (form) {

            form.addEventListener(
                'submit',
                function (event) {

                    submitRecruitmentJob(
                        event
                    );

                }
            );

        }


        return modal;

    }


    // =======================================================
    // FE-28 - JOB FORM ERROR
    // =======================================================

    function clearRecruitmentJobFormError() {

        const element =
            getElement(
                'recruitmentJobFormError'
            );


        if (!element) {
            return;
        }


        element.style.display =
            'none';


        element.innerHTML =
            '';

    }


    function showRecruitmentJobFormError(
        message
    ) {

        const element =
            getElement(
                'recruitmentJobFormError'
            );


        if (!element) {
            return;
        }


        element.style.display =
            'block';


        element.innerHTML = `
      <div
        class="ui-alert ui-alert-danger"
      >

        <i
          class="fa-solid fa-circle-exclamation"
        ></i>

        <div>
          ${escapeHtml(
            message ||
            'Vui lòng kiểm tra thông tin.'
        )}
        </div>

      </div>
    `;

    }


    // =======================================================
    // FE-28 - LOAD CLIENTS FOR JOB
    // =======================================================

    async function loadClientsForRecruitmentJob() {

        const select =
            getElement(
                'recruitmentJobClientId'
            );


        if (!select) {
            return;
        }


        select.innerHTML = `
      <option value="">
        -- Đang tải khách hàng... --
      </option>
    `;


        try {

            const data =
                await apiGet(
                    '/clients'
                );


            const clients =
                Array.isArray(
                    data?.clients
                )
                    ? data.clients
                    : [];


            select.innerHTML = `
        <option value="">
          -- Chọn khách hàng --
        </option>
      `;


            if (
                clients.length ===
                0
            ) {

                select.innerHTML = `
          <option value="">
            (Chưa có khách hàng)
          </option>
        `;

                return;

            }


            clients.forEach(
                function (client) {

                    const option =
                        document.createElement(
                            'option'
                        );


                    option.value =
                        client.id;


                    option.textContent =
                        safeText(
                            client.companyName
                        );


                    select.appendChild(
                        option
                    );

                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải khách hàng cho vị trí:',
                error
            );


            select.innerHTML = `
        <option value="">
          (Không thể tải khách hàng)
        </option>
      `;

        }

    }


    // =======================================================
    // FE-28 - OPEN JOB MODAL
    // =======================================================

    async function openRecruitmentJobModal() {

        const modalEl =
            ensureRecruitmentJobModal();


        const form =
            getElement(
                'formAddRecruitmentJob'
            );


        if (form) {
            form.reset();
        }


        const feeRate =
            getElement(
                'recruitmentJobFeeRate'
            );


        if (feeRate) {
            feeRate.value =
                '18';
        }


        clearRecruitmentJobFormError();


        await loadClientsForRecruitmentJob();


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


        } else {

            alert(
                'Không tìm thấy hộp thoại thêm vị trí tuyển dụng!'
            );

        }

    }


    // =======================================================
    // FE-28 - SUBMIT JOB
    // =======================================================

    async function submitRecruitmentJob(
        event
    ) {

        event.preventDefault();


        clearRecruitmentJobFormError();


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


        const clientId =
            getValue(
                'recruitmentJobClientId'
            );


        const title =
            getValue(
                'recruitmentJobTitle'
            );


        const department =
            getValue(
                'recruitmentJobDepartment'
            );


        const salaryRange =
            getValue(
                'recruitmentJobSalary'
            );


        const feeRate =
            Number(
                getValue(
                    'recruitmentJobFeeRate'
                )
            );


        if (!clientId) {

            showRecruitmentJobFormError(
                'Vui lòng chọn khách hàng.'
            );

            return;

        }


        if (!title) {

            showRecruitmentJobFormError(
                'Vui lòng nhập vị trí tuyển dụng.'
            );

            return;

        }


        if (!department) {

            showRecruitmentJobFormError(
                'Vui lòng nhập phòng ban.'
            );

            return;

        }


        if (
            !Number.isFinite(
                feeRate
            ) ||
            feeRate < 0 ||
            feeRate > 100
        ) {

            showRecruitmentJobFormError(
                'Phí dịch vụ phải từ 0% đến 100%.'
            );

            return;

        }


        const submitButton =
            event.submitter;


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
        ></span>

        Đang lưu...
      `;

        }


        try {

            const body = {

                clientId:
                    clientId,

                title:
                    title,

                department:
                    department,

                salaryRange:
                    salaryRange ||
                    'Thỏa thuận',

                feeRatePercent:
                    feeRate

            };


            const data =
                await apiPost(
                    '/recruitment/jobs',
                    body
                );


            if (
                data?.success === false
            ) {

                throw new Error(
                    data?.message ||
                    'Không thể tạo vị trí tuyển dụng.'
                );

            }


            const modalEl =
                getElement(
                    'modalAddRecruitmentJob'
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
                'Tạo vị trí tuyển dụng thành công!'
            );


            // Tải lại toàn bộ dữ liệu tuyển dụng
            await loadRecruitmentDashboard();


            await loadPlacements();


        } catch (error) {

            console.error(
                'Lỗi tạo vị trí tuyển dụng:',
                error
            );


            showRecruitmentJobFormError(
                error?.message ||
                'Lỗi kết nối máy chủ.'
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;


                submitButton.innerHTML =
                    originalHtml ||
                    `
            <i
              class="fa-solid fa-save me-1"
            ></i>
            Lưu Vị Trí
          `;

            }

        }

    }


    // =======================================================
    // DASHBOARD UI
    // =======================================================

    function ensureRecruitmentDashboard() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {
            return null;
        }


        let dashboard =
            getElement(
                'recruitmentDashboard'
            );


        if (dashboard) {
            return dashboard;
        }


        dashboard =
            document.createElement(
                'div'
            );


        dashboard.id =
            'recruitmentDashboard';


        dashboard.className =
            'mb-4';


        dashboard.innerHTML = `

      <div
        class="d-flex justify-content-between align-items-center mb-3"
      >

        <div>

          <h3 class="fw-bold mb-1">
            <i
              class="fa-solid fa-chart-line text-primary me-2"
            ></i>
            Dashboard Tuyển Dụng
          </h3>

          <div class="text-muted small">
            Tổng quan vị trí tuyển dụng, ứng viên và deal onboard
          </div>

        </div>


        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          id="btnRefreshRecruitmentDashboard"
        >
          <i
            class="fa-solid fa-rotate me-1"
          ></i>
          Làm mới
        </button>

      </div>


      <div
        class="row g-3 mb-4"
      >

        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="kpi-card h-100"
          >

            <div
              class="kpi-icon bg-primary-subtle text-primary"
            >
              <i
                class="fa-solid fa-briefcase"
              ></i>
            </div>

            <div>

              <div
                class="text-muted small"
              >
                Tổng vị trí
              </div>

              <div
                id="recruitmentKpiJobs"
                class="kpi-value"
              >
                0
              </div>

            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="kpi-card h-100"
          >

            <div
              class="kpi-icon bg-success-subtle text-success"
            >
              <i
                class="fa-solid fa-door-open"
              ></i>
            </div>

            <div>

              <div
                class="text-muted small"
              >
                Vị trí đang tuyển
              </div>

              <div
                id="recruitmentKpiOpenJobs"
                class="kpi-value text-success"
              >
                0
              </div>

            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="kpi-card h-100"
          >

            <div
              class="kpi-icon bg-info-subtle text-info"
            >
              <i
                class="fa-solid fa-users"
              ></i>
            </div>

            <div>

              <div
                class="text-muted small"
              >
                Tổng ứng viên
              </div>

              <div
                id="recruitmentKpiCandidates"
                class="kpi-value text-info"
              >
                0
              </div>

            </div>

          </div>

        </div>


        <div
          class="col-xl-3 col-md-6"
        >

          <div
            class="kpi-card h-100"
          >

            <div
              class="kpi-icon bg-warning-subtle text-warning"
            >
              <i
                class="fa-solid fa-user-check"
              ></i>
            </div>

            <div>

              <div
                class="text-muted small"
              >
                Deal onboard
              </div>

              <div
                id="recruitmentKpiPlacements"
                class="kpi-value text-warning"
              >
                0
              </div>

            </div>

          </div>

        </div>

      </div>


      <div
        class="row g-3 mb-4"
      >

        <div
          class="col-xl-4"
        >

          <div
            class="stat-card h-100"
          >

            <div
              class="stat-label"
            >
              Đang trong thời hạn bảo hành
            </div>

            <div
              id="recruitmentKpiWarranty"
              class="stat-value text-warning"
            >
              0
            </div>

            <div
              class="text-muted small mt-1"
            >
              Deal có trạng thái UnderWarranty
            </div>

          </div>

        </div>


        <div
          class="col-xl-4"
        >

          <div
            class="stat-card h-100"
          >

            <div
              class="stat-label"
            >
              Phí dịch vụ từ deal
            </div>

            <div
              id="recruitmentKpiServiceFee"
              class="stat-value text-success"
            >
              0 đ
            </div>

            <div
              class="text-muted small mt-1"
            >
              Tổng serviceFee hiện có
            </div>

          </div>

        </div>


        <div
          class="col-xl-4"
        >

          <div
            class="stat-card h-100"
          >

            <div
              class="stat-label"
            >
              Tỷ lệ onboard / vị trí mở
            </div>

            <div
              id="recruitmentKpiConversion"
              class="stat-value text-primary"
            >
              0%
            </div>

            <div
              class="text-muted small mt-1"
            >
              Tính từ dữ liệu đang có
            </div>

          </div>

        </div>

      </div>


      <div
        class="row g-3"
      >

        <div
          class="col-xl-6"
        >

          <div
            class="table-box h-100"
          >

            <div
              class="box-header"
            >

              <div>

                <h3
                  class="box-title"
                >
                  <i
                    class="fa-solid fa-chart-pie text-primary me-2"
                  ></i>
                  Trạng Thái Vị Trí
                </h3>

              </div>

            </div>

            <div
              style="height: 300px;"
              class="p-3"
            >

              <canvas
                id="recruitmentStatusChart"
              ></canvas>

            </div>

          </div>

        </div>


        <div
          class="col-xl-6"
        >

          <div
            class="table-box h-100"
          >

            <div
              class="box-header"
            >

              <div>

                <h3
                  class="box-title"
                >
                  <i
                    class="fa-solid fa-chart-donut text-success me-2"
                  ></i>
                  Trạng Thái Deal
                </h3>

              </div>

            </div>

            <div
              style="height: 300px;"
              class="p-3"
            >

              <canvas
                id="placementStatusChart"
              ></canvas>

            </div>

          </div>

        </div>

      </div>

    `;


        const tableBox =
            section.querySelector(
                '.table-box'
            );


        if (tableBox) {

            section.insertBefore(
                dashboard,
                tableBox
            );

        } else {

            section.prepend(
                dashboard
            );

        }


        const refreshButton =
            getElement(
                'btnRefreshRecruitmentDashboard'
            );


        if (refreshButton) {

            refreshButton.addEventListener(
                'click',
                function () {

                    loadRecruitmentDashboard();

                }
            );

        }


        return dashboard;

    }


    // =======================================================
    // DASHBOARD KPI
    // =======================================================

    function renderRecruitmentKpis() {

        const totalJobs =
            recruitmentJobs.length;


        const openJobs =
            recruitmentJobs.filter(
                function (job) {

                    return normalize(
                        job?.status
                    ) ===
                        'opening';

                }
            ).length;


        const totalCandidates =
            recruitmentCandidates.length;


        const totalPlacements =
            recruitmentPlacements.length;


        const warrantyPlacements =
            recruitmentPlacements.filter(
                function (placement) {

                    return (
                        normalize(
                            placement?.status
                        ) ===
                        'underwarranty'
                    );

                }
            ).length;


        const serviceFee =
            recruitmentPlacements.reduce(
                function (
                    total,
                    placement
                ) {

                    return (
                        total +
                        safeNumber(
                            placement?.serviceFee
                        )
                    );

                },
                0
            );


        const conversion =
            openJobs > 0
                ? (
                    totalPlacements /
                    openJobs *
                    100
                )
                : 0;


        const jobsEl =
            getElement(
                'recruitmentKpiJobs'
            );


        const openJobsEl =
            getElement(
                'recruitmentKpiOpenJobs'
            );


        const candidatesEl =
            getElement(
                'recruitmentKpiCandidates'
            );


        const placementsEl =
            getElement(
                'recruitmentKpiPlacements'
            );


        const warrantyEl =
            getElement(
                'recruitmentKpiWarranty'
            );


        const serviceFeeEl =
            getElement(
                'recruitmentKpiServiceFee'
            );


        const conversionEl =
            getElement(
                'recruitmentKpiConversion'
            );


        if (jobsEl) {

            jobsEl.textContent =
                totalJobs;

        }


        if (openJobsEl) {

            openJobsEl.textContent =
                openJobs;

        }


        if (candidatesEl) {

            candidatesEl.textContent =
                totalCandidates;

        }


        if (placementsEl) {

            placementsEl.textContent =
                totalPlacements;

        }


        if (warrantyEl) {

            warrantyEl.textContent =
                warrantyPlacements;

        }


        if (serviceFeeEl) {

            serviceFeeEl.textContent =
                formatMoneySafe(
                    serviceFee
                );

        }


        if (conversionEl) {

            conversionEl.textContent =
                conversion.toFixed(1) +
                '%';

        }

    }


    // =======================================================
    // EMPTY CHART
    // =======================================================

    function renderChartEmpty(
        canvasId,
        message
    ) {

        const canvas =
            getElement(
                canvasId
            );


        if (!canvas) {
            return;
        }


        const parent =
            canvas.parentElement;


        if (!parent) {
            return;
        }


        if (
            parent.querySelector(
                '.recruitment-chart-empty'
            )
        ) {

            return;

        }


        canvas.style.display =
            'none';


        const empty =
            document.createElement(
                'div'
            );


        empty.className =
            'recruitment-chart-empty ui-empty h-100';


        empty.innerHTML = `
      <div
        class="ui-empty-icon"
      >
        <i
          class="fa-solid fa-chart-simple"
        ></i>
      </div>

      <div
        class="ui-empty-title"
      >
        Chưa có dữ liệu
      </div>

      <div
        class="ui-empty-text"
      >
        ${escapeHtml(
            message
        )}
      </div>
    `;


        parent.appendChild(
            empty
        );

    }


    // =======================================================
    // CHART STATE
    // =======================================================

    function clearChartEmpty(
        canvasId
    ) {

        const canvas =
            getElement(
                canvasId
            );


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
                '.recruitment-chart-empty'
            );


        if (empty) {

            empty.remove();

        }


        canvas.style.display =
            'block';

    }


    // =======================================================
    // JOB STATUS CHART
    // =======================================================

    function renderRecruitmentStatusChart() {

        if (
            typeof window.Chart ===
            'undefined'
        ) {

            console.warn(
                'Recruitment Dashboard: Chart.js chưa được tải.'
            );

            return;

        }


        const canvas =
            getElement(
                'recruitmentStatusChart'
            );


        if (!canvas) {
            return;
        }


        const opening =
            recruitmentJobs.filter(
                function (job) {

                    return normalize(
                        job?.status
                    ) ===
                        'opening';

                }
            ).length;


        const closed =
            recruitmentJobs.filter(
                function (job) {

                    return normalize(
                        job?.status
                    ) ===
                        'closed';

                }
            ).length;


        const other =
            Math.max(
                recruitmentJobs.length -
                opening -
                closed,
                0
            );


        if (
            recruitmentJobs.length ===
            0
        ) {

            renderChartEmpty(
                'recruitmentStatusChart',
                'Chưa có vị trí tuyển dụng.'
            );

            return;

        }


        clearChartEmpty(
            'recruitmentStatusChart'
        );


        if (
            recruitmentStatusChart &&
            typeof recruitmentStatusChart.destroy ===
            'function'
        ) {

            recruitmentStatusChart.destroy();

        }


        recruitmentStatusChart =
            new Chart(
                canvas.getContext('2d'),
                {
                    type:
                        'doughnut',

                    data: {

                        labels: [
                            'Đang tuyển',
                            'Đã đóng',
                            'Khác'
                        ],

                        datasets: [
                            {
                                data: [
                                    opening,
                                    closed,
                                    other
                                ],

                                backgroundColor: [
                                    '#10b981',
                                    '#64748b',
                                    '#94a3b8'
                                ],

                                borderColor:
                                    '#ffffff',

                                borderWidth:
                                    3
                            }
                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '62%',

                        plugins: {

                            legend: {
                                position:
                                    'bottom'
                            }

                        }

                    }

                }
            );

    }


    // =======================================================
    // PLACEMENT STATUS CHART
    // =======================================================

    function renderPlacementStatusChart() {

        if (
            typeof window.Chart ===
            'undefined'
        ) {

            return;

        }


        const canvas =
            getElement(
                'placementStatusChart'
            );


        if (!canvas) {
            return;
        }


        const warranty =
            recruitmentPlacements.filter(
                function (placement) {

                    return normalize(
                        placement?.status
                    ) ===
                        'underwarranty';

                }
            ).length;


        const completed =
            recruitmentPlacements.filter(
                function (placement) {

                    return normalize(
                        placement?.status
                    ) !==
                        'underwarranty';

                }
            ).length;


        if (
            recruitmentPlacements.length ===
            0
        ) {

            renderChartEmpty(
                'placementStatusChart',
                'Chưa có deal onboard.'
            );

            return;

        }


        clearChartEmpty(
            'placementStatusChart'
        );


        if (
            placementStatusChart &&
            typeof placementStatusChart.destroy ===
            'function'
        ) {

            placementStatusChart.destroy();

        }


        placementStatusChart =
            new Chart(
                canvas.getContext('2d'),
                {
                    type:
                        'doughnut',

                    data: {

                        labels: [
                            'Đang bảo hành',
                            'Hoàn thành'
                        ],

                        datasets: [
                            {
                                data: [
                                    warranty,
                                    completed
                                ],

                                backgroundColor: [
                                    '#f59e0b',
                                    '#10b981'
                                ],

                                borderColor:
                                    '#ffffff',

                                borderWidth:
                                    3
                            }
                        ]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        cutout:
                            '62%',

                        plugins: {

                            legend: {
                                position:
                                    'bottom'
                            }

                        }

                    }

                }
            );

    }


    // =======================================================
    // LOAD DASHBOARD DATA
    // =======================================================

    async function loadRecruitmentDashboard() {

        ensurePositionManagement();

        ensureRecruitmentDashboard();


        const refreshButton =
            getElement(
                'btnRefreshRecruitmentDashboard'
            );


        if (refreshButton) {

            refreshButton.disabled =
                true;


            refreshButton.innerHTML = `
        <span
          class="spinner-border spinner-border-sm me-1"
        ></span>
        Đang tải...
      `;

        }


        try {

            const results =
                await Promise.all([
                    apiGet(
                        '/recruitment/jobs'
                    ),

                    apiGet(
                        '/recruitment/candidates'
                    ),

                    apiGet(
                        '/recruitment/placements'
                    )
                ]);


            recruitmentJobs =
                Array.isArray(
                    results[0]?.jobs
                )
                    ? results[0].jobs
                    : [];


            recruitmentCandidates =
                Array.isArray(
                    results[1]?.candidates
                )
                    ? results[1].candidates
                    : [];


            recruitmentPlacements =
                Array.isArray(
                    results[2]?.placements
                )
                    ? results[2].placements
                    : [];


            applyPositionFilters();


            clearPositionError();


            renderRecruitmentKpis();


            renderRecruitmentStatusChart();


            renderPlacementStatusChart();


            console.log(
                'Recruitment dashboard loaded.',
                {
                    jobs:
                        recruitmentJobs.length,

                    candidates:
                        recruitmentCandidates.length,

                    placements:
                        recruitmentPlacements.length
                }
            );


        } catch (error) {

            console.error(
                'Lỗi tải Recruitment Dashboard:',
                error
            );


            recruitmentJobs =
                [];


            recruitmentCandidates =
                [];


            recruitmentPlacements =
                [];


            applyPositionFilters();


            showPositionError(
                error?.message ||
                'Không thể kết nối máy chủ.'
            );


            renderRecruitmentKpis();


            renderChartEmpty(
                'recruitmentStatusChart',
                'Không thể tải dữ liệu vị trí.'
            );


            renderChartEmpty(
                'placementStatusChart',
                'Không thể tải dữ liệu deal.'
            );

        } finally {

            if (refreshButton) {

                refreshButton.disabled =
                    false;


                refreshButton.innerHTML = `
          <i
            class="fa-solid fa-rotate me-1"
          ></i>
          Làm mới
        `;

            }

        }

    }


    // =======================================================
    // LOAD PLACEMENTS
    // =======================================================

    async function loadPlacements() {

        try {

            const data =
                await apiGet(
                    '/recruitment/placements'
                );


            const placements =
                Array.isArray(
                    data?.placements
                )
                    ? data.placements
                    : [];


            recruitmentPlacements =
                placements;


            const tbody =
                getElement(
                    'placementsTableBody'
                );


            if (!tbody) {
                return;
            }


            tbody.innerHTML =
                '';


            if (
                placements.length ===
                0
            ) {

                tbody.innerHTML = `
          <tr>

            <td
              colspan="8"
              class="text-center text-muted py-3"
            >
              Chưa có deal tuyển dụng nào.
            </td>

          </tr>
        `;


                // FE-27:
                // Vẫn hiển thị Dashboard khi chưa có deal.
                await loadRecruitmentDashboard();


                return;

            }


            placements.forEach(
                function (placement) {

                    const isWarranty =
                        placement?.status ===
                        'UnderWarranty';


                    const hasInvoice =
                        placement?.Invoice != null;


                    tbody.innerHTML += `
            <tr>

              <td>

                <strong>
                  ${escapeHtml(
                        placement?.Candidate
                            ?.fullName ||
                        '-'
                    )}
                </strong>

              </td>


              <td>
                ${escapeHtml(
                        placement?.Job
                            ?.title ||
                        '-'
                    )}
              </td>


              <td>
                ${escapeHtml(
                        placement?.Client
                            ?.companyName ||
                        '-'
                    )}
              </td>


              <td>
                ${formatMoneySafe(
                        placement?.officialSalary
                    )}
              </td>


              <td
                class="text-success fw-bold"
              >
                ${formatMoneySafe(
                        placement?.serviceFee
                    )}
              </td>


              <td>

                <i
                  class="fa-regular fa-calendar-check me-1"
                ></i>

                ${escapeHtml(
                        placement?.warrantyEndDate ||
                        '-'
                    )}

              </td>


              <td>

                <span
                  class="status-badge ${isWarranty
                            ? 'badge-warranty'
                            : 'badge-passed'
                        }"
                >
                  ${escapeHtml(
                            placement?.status ||
                            '-'
                        )}
                </span>

              </td>


              <td>

                ${hasInvoice
                            ? `
                      <span
                        class="badge bg-success"
                      >
                        ${escapeHtml(
                                placement
                                    ?.Invoice
                                    ?.invoiceCode ||
                                ''
                            )}
                      </span>
                    `
                            : `
                      <button
                        class="btn btn-sm btn-outline-primary"
                        onclick="quickIssueInvoice(${safeNumber(
                                placement?.id
                            )})"
                      >

                        <i
                          class="fa-solid fa-file-invoice me-1"
                        ></i>

                        Xuất HĐ

                      </button>
                    `
                        }

              </td>

            </tr>
          `;

                }
            );


            // FE-27:
            // Có dữ liệu deal thì tải Dashboard.
            await loadRecruitmentDashboard();


        } catch (error) {

            console.error(
                'Lỗi tải deal tuyển dụng:',
                error
            );


            const tbody =
                getElement(
                    'placementsTableBody'
                );


            if (tbody) {

                tbody.innerHTML = `
          <tr>

            <td
              colspan="8"
              class="text-center text-muted py-4"
            >
              Không thể tải danh sách deal tuyển dụng.
            </td>

          </tr>
        `;

            }


            // FE-27:
            // API placements lỗi vẫn hiển thị Dashboard.
            await loadRecruitmentDashboard();

        }

    }


    // =======================================================
    // ADD PLACEMENT
    // =======================================================

    async function openModalAddPlacement() {

        const formEl =
            getElement(
                'formAddPlacement'
            );


        if (formEl) {
            formEl.reset();
        }


        const onboardDateEl =
            getElement(
                'placementOnboardDate'
            );


        if (onboardDateEl) {

            onboardDateEl.valueAsDate =
                new Date();

        }


        try {

            const results =
                await Promise.all([
                    apiGet(
                        '/clients'
                    ),

                    apiGet(
                        '/recruitment/candidates'
                    )
                ]);


            const clientsData =
                results[0];


            const candidatesData =
                results[1];


            const clientSelect =
                getElement(
                    'placementClientId'
                );


            if (clientSelect) {

                clientSelect.innerHTML =
                    `
            <option value="">
              -- Chọn khách hàng --
            </option>
          `;


                (
                    Array.isArray(
                        clientsData?.clients
                    )
                        ? clientsData.clients
                        : []
                )
                    .forEach(
                        function (client) {

                            const option =
                                document.createElement(
                                    'option'
                                );


                            option.value =
                                client.id;


                            option.textContent =
                                safeText(
                                    client.companyName
                                );


                            clientSelect.appendChild(
                                option
                            );

                        }
                    );

            }


            const candSelect =
                getElement(
                    'placementCandidateId'
                );


            if (candSelect) {

                candSelect.innerHTML =
                    `
            <option value="">
              -- Chọn ứng viên --
            </option>
          `;


                (
                    Array.isArray(
                        candidatesData?.candidates
                    )
                        ? candidatesData.candidates
                        : []
                )
                    .forEach(
                        function (candidate) {

                            const option =
                                document.createElement(
                                    'option'
                                );


                            option.value =
                                candidate.id;


                            option.textContent =
                                safeText(
                                    candidate.fullName
                                ) +
                                ' (' +
                                safeText(
                                    candidate.currentPosition,
                                    ''
                                ) +
                                ')';


                            candSelect.appendChild(
                                option
                            );

                        }
                    );

            }


            const modalEl =
                getElement(
                    'modalAddPlacement'
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


            } else {

                alert(
                    'Không tìm thấy hộp thoại thêm deal!'
                );

            }


        } catch (error) {

            console.error(
                'Lỗi mở modal deal:',
                error
            );


            alert(
                error?.message ||
                'Không thể tải dữ liệu để tạo deal.'
            );

        }

    }


    // =======================================================
    // SELECT CLIENT FOR PLACEMENT
    // =======================================================

    async function onSelectClientForPlacement() {

        const clientSelect =
            getElement(
                'placementClientId'
            );


        const clientId =
            clientSelect
                ? clientSelect.value
                : '';


        const jobSelect =
            getElement(
                'placementJobId'
            );


        if (!jobSelect) {
            return;
        }


        jobSelect.innerHTML =
            `
        <option value="">
          ${clientId
                ? '-- Đang tải vị trí... --'
                : '-- Chọn khách hàng trước --'
            }
        </option>
      `;


        if (!clientId) {
            return;
        }


        try {

            const data =
                await apiGet(
                    '/recruitment/jobs'
                );


            const jobs =
                Array.isArray(
                    data?.jobs
                )
                    ? data.jobs
                    : [];


            const clientJobs =
                jobs.filter(
                    function (job) {

                        return String(
                            job?.clientId
                        ) ===
                            String(
                                clientId
                            );

                    }
                );


            jobSelect.innerHTML =
                '';


            if (
                clientJobs.length ===
                0
            ) {

                jobSelect.innerHTML =
                    `
            <option value="">
              (Khách hàng này chưa có Job mở)
            </option>
          `;

                return;

            }


            clientJobs
                .forEach(
                    function (job) {

                        const option =
                            document.createElement(
                                'option'
                            );


                        option.value =
                            job.id;


                        option.textContent =
                            `${safeText(
                                job.title
                            )} (${safeText(
                                job.department
                            )})`;


                        jobSelect.appendChild(
                            option
                        );

                    }
                );


        } catch (error) {

            console.error(
                'Lỗi tải danh sách job:',
                error
            );


            jobSelect.innerHTML =
                `
          <option value="">
            (Lỗi tải danh sách job)
          </option>
        `;

        }

    }


    // =======================================================
    // CALC FEE
    // =======================================================

    function calcPlacementFee() {

        const salaryEl =
            getElement(
                'placementSalary'
            );


        const rateEl =
            getElement(
                'placementFeeRate'
            );


        const estimatedFeeEl =
            getElement(
                'placementEstFee'
            );


        const salary =
            parseFloat(
                salaryEl
                    ? salaryEl.value
                    : 0
            ) ||
            0;


        const rate =
            parseFloat(
                rateEl
                    ? rateEl.value
                    : 18
            ) ||
            18;


        const fee =
            salary *
            12 *
            (
                rate /
                100
            );


        if (estimatedFeeEl) {

            estimatedFeeEl.value =
                formatMoneySafe(
                    fee
                );

        }

    }


    // =======================================================
    // SUBMIT PLACEMENT
    // =======================================================

    async function submitAddPlacement(e) {

        e.preventDefault();


        const getVal =
            function (id) {

                const element =
                    getElement(
                        id
                    );


                return element
                    ? element.value
                    : '';

            };


        const body = {

            clientId:
                getVal(
                    'placementClientId'
                ),

            jobId:
                getVal(
                    'placementJobId'
                ),

            candidateId:
                getVal(
                    'placementCandidateId'
                ),

            officialSalary:
                getVal(
                    'placementSalary'
                ),

            feeRatePercent:
                getVal(
                    'placementFeeRate'
                ),

            onboardDate:
                getVal(
                    'placementOnboardDate'
                ),

            warrantyDays:
                getVal(
                    'placementWarrantyDays'
                )

        };


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
        ></span>
        Đang xử lý...
      `;

        }


        try {

            const data =
                await apiPost(
                    '/recruitment/placements',
                    body
                );


            if (
                data?.success
            ) {

                const modalEl =
                    getElement(
                        'modalAddPlacement'
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
                    'Ghi nhận deal tuyển dụng thành công!'
                );


                await loadPlacements();


                await loadRecruitmentDashboard();


            } else {

                alert(
                    data?.message ||
                    'Lỗi khi chốt deal!'
                );

            }


        } catch (error) {

            console.error(
                'Lỗi chốt deal:',
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
            <i
              class="fa-solid fa-check me-1"
            ></i>
            Chốt Deal
          `;

            }

        }

    }


    // =======================================================
    // ISSUE INVOICE
    // =======================================================

    async function quickIssueInvoice(
        placementId
    ) {

        const confirmed =
            window.confirm(
                'Bạn có chắc chắn muốn phát hành hóa đơn VAT cho deal tuyển dụng này?'
            );


        if (!confirmed) {
            return;
        }


        try {

            const data =
                await apiPost(
                    '/invoices/from-placement',
                    {
                        placementId:
                            placementId,

                        vatRate:
                            8.0
                    }
                );


            if (
                data?.success
            ) {

                alert(
                    `Phát hành hóa đơn thành công! Mã HĐ: ${data?.invoice?.invoiceCode ||
                    '-'
                    }`
                );


                await loadPlacements();


                await loadRecruitmentDashboard();


            } else {

                alert(
                    data?.message ||
                    'Lỗi phát hành hóa đơn!'
                );

            }


        } catch (error) {

            console.error(
                'Lỗi phát hành hóa đơn:',
                error
            );


            alert(
                error?.message ||
                'Lỗi kết nối máy chủ!'
            );

        }

    }


    // =======================================================
    // EXPORT
    // =======================================================

    window.loadPlacements =
        loadPlacements;


    window.openModalAddPlacement =
        openModalAddPlacement;


    window.onSelectClientForPlacement =
        onSelectClientForPlacement;


    window.calcPlacementFee =
        calcPlacementFee;


    window.submitAddPlacement =
        submitAddPlacement;


    window.quickIssueInvoice =
        quickIssueInvoice;


    window.loadRecruitmentDashboard =
        loadRecruitmentDashboard;


    window.openRecruitmentJobModal =
        openRecruitmentJobModal;


    window.submitRecruitmentJob =
        submitRecruitmentJob;


    window.applyPositionFilters =
        applyPositionFilters;


})(window);