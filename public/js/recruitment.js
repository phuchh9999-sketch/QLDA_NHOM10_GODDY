/**
 * =========================================================
 * GODDY RECRUIT - Recruitment & Placement Module
 * FE-27 / FE-28 / FE-29 / FE-30
 * =========================================================
 *
 * FE-27:
 * - Dashboard tuyển dụng tổng quan
 * - KPI vị trí / ứng viên / deal
 * - Biểu đồ trạng thái vị trí
 * - Biểu đồ trạng thái deal
 *
 * FE-28:
 * - Quản lý vị trí tuyển dụng
 * - Tìm kiếm / lọc vị trí
 * - Thêm vị trí tuyển dụng
 *
 * FE-29:
 * - Quản lý ứng viên
 * - Tìm kiếm / lọc ứng viên
 * - Xem chi tiết ứng viên
 *
 * FE-30:
 * - Recruitment Pipeline
 * - 6 giai đoạn chính:
 *   Nhận ứng viên
 *   Sàng lọc
 *   Phỏng vấn
 *   Offer
 *   Nhận việc
 *   Loại
 * - Tự gom ứng viên theo status thực tế từ API
 * - Không tạo API mới
 *
 * API sử dụng đúng các API đang có:
 * - /api/recruitment/jobs
 * - /api/recruitment/candidates
 * - /api/recruitment/placements
 * - /api/clients
 * - /api/recruitment/jobs (POST)
 * - /api/recruitment/placements (POST)
 * - /api/invoices/from-placement (POST)
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

    let currentCandidateSearch = '';

    let currentCandidateStatus = 'All';


    // =======================================================
    // PIPELINE STAGES
    // =======================================================

    const PIPELINE_STAGES = [
        {
            key: 'received',
            title: 'Nhận ứng viên',
            icon: 'fa-user-plus',
            aliases: [
                'new',
                'received',
                'applied',
                'application',
                'candidate',
                'moi',
                'nhan'
            ]
        },

        {
            key: 'screening',
            title: 'Sàng lọc',
            icon: 'fa-filter',
            aliases: [
                'screening',
                'screen',
                'shortlisted',
                'shortlist',
                'sang loc',
                'sangloc'
            ]
        },

        {
            key: 'interview',
            title: 'Phỏng vấn',
            icon: 'fa-comments',
            aliases: [
                'interview',
                'interviewing',
                'phong van',
                'phongvan'
            ]
        },

        {
            key: 'offer',
            title: 'Offer',
            icon: 'fa-file-signature',
            aliases: [
                'offer',
                'offered',
                'offering'
            ]
        },

        {
            key: 'hired',
            title: 'Nhận việc',
            icon: 'fa-user-check',
            aliases: [
                'hired',
                'accepted',
                'accept',
                'onboard',
                'onboarded',
                'nhan viec',
                'nhanviec'
            ]
        },

        {
            key: 'rejected',
            title: 'Loại',
            icon: 'fa-user-xmark',
            aliases: [
                'rejected',
                'reject',
                'declined',
                'failed',
                'loai',
                'loai bo'
            ]
        }
    ];


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
            .trim()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
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
    // API
    // =======================================================

    async function apiGet(endpoint) {

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
    // FE-28 - POSITION MANAGEMENT
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
            Quản lý vị trí tuyển dụng theo doanh nghiệp,
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
            >

          </div>


          <select
            id="positionStatusFilter"
            class="form-select"
            style="max-width: 220px;"
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

              <th>#</th>

              <th>Vị Trí</th>

              <th>Phòng Ban</th>

              <th>Khách Hàng</th>

              <th>Mức Lương</th>

              <th>Phí Dịch Vụ</th>

              <th>Trạng Thái</th>

            </tr>

          </thead>


          <tbody
            id="positionManagementTableBody"
          ></tbody>

        </table>

      </div>

    `;


        const dashboard =
            getElement(
                'recruitmentDashboard'
            );


        if (dashboard) {

            section.insertBefore(
                panel,
                dashboard
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


    function renderPositionResultCount(
        count
    ) {

        const element =
            getElement(
                'positionResultCount'
            );


        if (element) {

            element.textContent =
                `${count} vị trí`;

        }

    }


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

          <div class="ui-loading">

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


    function renderPositionEmpty(
        message
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

                        const status =
                            safeText(
                                job?.status
                            );


                        const isOpening =
                            normalize(
                                status
                            ) ===
                            'opening';


                        return `

              <tr>

                <td>
                  <span
                    class="badge bg-light text-dark border"
                  >
                    #${safeNumber(
                            job?.id
                        )}
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
                    class="badge ${isOpening
                                ? 'bg-success'
                                : 'bg-secondary'
                            }"
                  >
                    ${isOpening
                                ? 'Đang tuyển'
                                : 'Đã đóng'
                            }
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


                return (
                    (
                        !search ||
                        title.includes(
                            search
                        ) ||
                        department.includes(
                            search
                        )
                    ) &&
                    (
                        currentJobStatus ===
                        'All' ||
                        status ===
                        currentJobStatus
                    )
                );

            }
        );

    }


    function applyPositionFilters() {

        renderPositionTable(
            getFilteredPositions()
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
                >
                  Khách hàng *
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
                  >
                    Dải lương
                  </label>

                  <input
                    type="text"
                    id="recruitmentJobSalary"
                    class="form-control"
                    placeholder="30 - 45 triệu VND"
                  >

                </div>


                <div
                  class="col-md-4"
                >

                  <label
                    class="form-label fw-bold"
                  >
                    Phí (%)
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
                  Vị trí mới sẽ ở trạng thái
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
                submitRecruitmentJob
            );

        }


        return modal;

    }


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
            message
        )}
        </div>

      </div>
    `;

    }


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


    async function openRecruitmentJobModal() {

        const modal =
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
            modal &&
            window.bootstrap?.Modal
        ) {

            window.bootstrap.Modal
                .getOrCreateInstance(
                    modal
                )
                .show();

        }

    }


    async function submitRecruitmentJob(
        event
    ) {

        event.preventDefault();


        clearRecruitmentJobFormError();


        function valueOf(id) {

            const element =
                getElement(id);


            return element
                ? element.value.trim()
                : '';

        }


        const clientId =
            valueOf(
                'recruitmentJobClientId'
            );


        const title =
            valueOf(
                'recruitmentJobTitle'
            );


        const department =
            valueOf(
                'recruitmentJobDepartment'
            );


        const salaryRange =
            valueOf(
                'recruitmentJobSalary'
            );


        const feeRate =
            Number(
                valueOf(
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


        const button =
            event.submitter;


        const originalHtml =
            button
                ? button.innerHTML
                : '';


        if (button) {

            button.disabled =
                true;


            button.innerHTML = `
        <span
          class="spinner-border spinner-border-sm me-1"
        ></span>
        Đang lưu...
      `;

        }


        try {

            const data =
                await apiPost(
                    '/recruitment/jobs',
                    {
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

                    }
                );


            if (
                data?.success ===
                false
            ) {

                throw new Error(
                    data?.message ||
                    'Không thể tạo vị trí tuyển dụng.'
                );

            }


            const modal =
                getElement(
                    'modalAddRecruitmentJob'
                );


            if (
                modal &&
                window.bootstrap?.Modal
            ) {

                window.bootstrap.Modal
                    .getInstance(
                        modal
                    )
                    ?.hide();

            }


            alert(
                data?.message ||
                'Tạo vị trí tuyển dụng thành công!'
            );


            await loadRecruitmentDashboard();

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

            if (button) {

                button.disabled =
                    false;


                button.innerHTML =
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
    // FE-29 - CANDIDATE MANAGEMENT
    // =======================================================

    function ensureCandidateManagement() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {
            return null;
        }


        let panel =
            getElement(
                'recruitmentCandidateManagement'
            );


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                'div'
            );


        panel.id =
            'recruitmentCandidateManagement';


        panel.className =
            'table-box mb-4';


        panel.innerHTML = `

      <div
        class="box-header"
      >

        <div>

          <h3
            class="box-title"
          >

            <i
              class="fa-solid fa-users text-info me-2"
            ></i>

            Quản Lý Ứng Viên

          </h3>

          <div
            class="text-muted small mt-1"
          >
            Tra cứu ứng viên theo họ tên, email,
            vị trí và trạng thái
          </div>

        </div>


        <span
          id="candidateResultCount"
          class="ui-data-count"
        >
          0 ứng viên
        </span>

      </div>


      <div
        class="px-3 pt-3"
      >

        <div
          class="d-flex gap-2 flex-wrap"
        >

          <div
            class="input-group"
            style="max-width:380px;"
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
              id="candidateSearchInput"
              class="form-control"
              placeholder="Tìm họ tên / email / vị trí..."
              autocomplete="off"
            >

          </div>


          <select
            id="candidateStatusFilter"
            class="form-select"
            style="max-width:220px;"
          >

            <option value="All">
              Tất cả trạng thái
            </option>

          </select>


          <button
            type="button"
            class="btn btn-outline-secondary"
            id="btnResetCandidateFilter"
          >

            <i
              class="fa-solid fa-rotate-left me-1"
            ></i>

            Xóa lọc

          </button>

        </div>

      </div>


      <div
        id="candidateErrorAlert"
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

              <th>#</th>

              <th>Họ Tên</th>

              <th>Email</th>

              <th>Vị Trí Hiện Tại</th>

              <th>Trạng Thái</th>

              <th
                class="text-end"
              >
                Thao Tác
              </th>

            </tr>

          </thead>


          <tbody
            id="candidateManagementTableBody"
          ></tbody>

        </table>

      </div>

    `;


        const positionPanel =
            getElement(
                'recruitmentPositionManagement'
            );


        if (positionPanel) {

            positionPanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else {

            section.prepend(
                panel
            );

        }


        const searchInput =
            getElement(
                'candidateSearchInput'
            );


        if (searchInput) {

            searchInput.addEventListener(
                'input',
                function () {

                    currentCandidateSearch =
                        searchInput.value.trim();

                    applyCandidateFilters();

                }
            );

        }


        const statusFilter =
            getElement(
                'candidateStatusFilter'
            );


        if (statusFilter) {

            statusFilter.addEventListener(
                'change',
                function () {

                    currentCandidateStatus =
                        statusFilter.value;

                    applyCandidateFilters();

                }
            );

        }


        const resetButton =
            getElement(
                'btnResetCandidateFilter'
            );


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    currentCandidateSearch =
                        '';

                    currentCandidateStatus =
                        'All';


                    if (searchInput) {
                        searchInput.value =
                            '';
                    }


                    if (statusFilter) {
                        statusFilter.value =
                            'All';
                    }


                    applyCandidateFilters();

                }
            );

        }


        ensureCandidateDetailModal();


        return panel;

    }


    function renderCandidateResultCount(
        count
    ) {

        const element =
            getElement(
                'candidateResultCount'
            );


        if (element) {

            element.textContent =
                `${count} ứng viên`;

        }

    }


    function renderCandidateLoading() {

        const tbody =
            getElement(
                'candidateManagementTableBody'
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

          <div
            class="ui-loading"
          >

            <div
              class="ui-spinner"
            ></div>

            <div>
              Đang tải danh sách ứng viên...
            </div>

          </div>

        </td>

      </tr>
    `;


        renderCandidateResultCount(
            0
        );

    }


    function renderCandidateEmpty(
        message
    ) {

        const tbody =
            getElement(
                'candidateManagementTableBody'
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

          <div
            class="ui-empty"
          >

            <div
              class="ui-empty-icon"
            >

              <i
                class="fa-solid fa-user-group"
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
              Chưa có dữ liệu ứng viên để hiển thị.
            </div>

          </div>

        </td>

      </tr>
    `;


        renderCandidateResultCount(
            0
        );

    }


    function populateCandidateStatusFilter() {

        const select =
            getElement(
                'candidateStatusFilter'
            );


        if (!select) {
            return;
        }


        const statuses =
            Array.from(
                new Set(
                    recruitmentCandidates
                        .map(
                            function (candidate) {

                                return safeText(
                                    candidate?.status,
                                    ''
                                );

                            }
                        )
                        .filter(
                            function (status) {

                                return Boolean(
                                    status
                                );

                            }
                        )
                )
            );


        select.innerHTML = `
      <option value="All">
        Tất cả trạng thái
      </option>
    `;


        statuses.forEach(
            function (status) {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    status;


                option.textContent =
                    status;


                select.appendChild(
                    option
                );

            }
        );


        if (
            currentCandidateStatus !==
            'All' &&
            statuses.includes(
                currentCandidateStatus
            )
        ) {

            select.value =
                currentCandidateStatus;

        } else {

            currentCandidateStatus =
                'All';

            select.value =
                'All';

        }

    }


    function renderCandidateTable(
        candidates
    ) {

        const tbody =
            getElement(
                'candidateManagementTableBody'
            );


        if (!tbody) {
            return;
        }


        const items =
            Array.isArray(
                candidates
            )
                ? candidates
                : [];


        if (
            items.length ===
            0
        ) {

            renderCandidateEmpty(
                currentCandidateSearch ||
                    currentCandidateStatus !==
                    'All'
                    ? 'Không tìm thấy ứng viên phù hợp.'
                    : 'Chưa có ứng viên nào.'
            );

            return;

        }


        tbody.innerHTML =
            items
                .map(
                    function (candidate) {

                        const status =
                            safeText(
                                candidate?.status,
                                'Chưa cập nhật'
                            );


                        const normalizedStatus =
                            normalize(
                                status
                            );


                        const active =
                            [
                                'new',
                                'received',
                                'applied',
                                'screening',
                                'interview',
                                'offer',
                                'hired',
                                'accepted',
                                'onboard'
                            ].includes(
                                normalizedStatus
                            );


                        return `

              <tr>

                <td>
                  <span
                    class="badge bg-light text-dark border"
                  >
                    #${safeNumber(
                            candidate?.id
                        )}
                  </span>
                </td>


                <td>

                  <strong>
                    ${escapeHtml(
                            safeText(
                                candidate?.fullName
                            )
                        )}
                  </strong>

                </td>


                <td>

                  <small>
                    ${escapeHtml(
                            safeText(
                                candidate?.email,
                                'Chưa cập nhật'
                            )
                        )}
                  </small>

                </td>


                <td>
                  ${escapeHtml(
                            safeText(
                                candidate?.currentPosition,
                                'Chưa cập nhật'
                            )
                        )}
                </td>


                <td>

                  <span
                    class="badge ${active
                                ? 'bg-success'
                                : 'bg-secondary'
                            }"
                  >
                    ${escapeHtml(
                                status
                            )}
                  </span>

                </td>


                <td
                  class="text-end"
                >

                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    onclick="openCandidateDetail(${safeNumber(
                                candidate?.id
                            )})"
                  >

                    <i
                      class="fa-solid fa-eye me-1"
                    ></i>

                    Chi tiết

                  </button>

                </td>

              </tr>

            `;

                    }
                )
                .join('');


        renderCandidateResultCount(
            items.length
        );

    }


    function getFilteredCandidates() {

        const search =
            normalize(
                currentCandidateSearch
            );


        return recruitmentCandidates.filter(
            function (candidate) {

                const fullName =
                    normalize(
                        candidate?.fullName
                    );


                const email =
                    normalize(
                        candidate?.email
                    );


                const position =
                    normalize(
                        candidate?.currentPosition
                    );


                const status =
                    safeText(
                        candidate?.status,
                        ''
                    );


                const searchMatched =
                    !search ||
                    fullName.includes(
                        search
                    ) ||
                    email.includes(
                        search
                    ) ||
                    position.includes(
                        search
                    );


                const statusMatched =
                    currentCandidateStatus ===
                    'All' ||
                    status ===
                    currentCandidateStatus;


                return (
                    searchMatched &&
                    statusMatched
                );

            }
        );

    }


    function applyCandidateFilters() {

        renderCandidateTable(
            getFilteredCandidates()
        );

    }


    // =======================================================
    // FE-29 - CANDIDATE DETAIL
    // =======================================================

    function ensureCandidateDetailModal() {

        let modal =
            getElement(
                'modalCandidateDetail'
            );


        if (modal) {
            return modal;
        }


        modal =
            document.createElement(
                'div'
            );


        modal.id =
            'modalCandidateDetail';


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

        <div
          class="modal-content border-0 shadow-lg"
        >

          <div
            class="modal-header"
          >

            <div>

              <div
                class="text-muted small text-uppercase fw-bold mb-1"
              >
                Hồ sơ ứng viên
              </div>

              <h5
                class="modal-title"
                id="candidateDetailTitle"
              >
                Chi tiết ứng viên
              </h5>

            </div>


            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Đóng"
            ></button>

          </div>


          <div
            class="modal-body"
            id="candidateDetailBody"
          ></div>


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

          </div>

        </div>

      </div>

    `;


        document.body.appendChild(
            modal
        );


        return modal;

    }


    function openCandidateDetail(
        candidateId
    ) {

        const id =
            safeNumber(
                candidateId
            );


        const candidate =
            recruitmentCandidates.find(
                function (item) {

                    return (
                        safeNumber(
                            item?.id
                        ) ===
                        id
                    );

                }
            );


        if (!candidate) {

            alert(
                'Không tìm thấy ứng viên cần xem.'
            );

            return;

        }


        const modal =
            ensureCandidateDetailModal();


        const title =
            getElement(
                'candidateDetailTitle'
            );


        const body =
            getElement(
                'candidateDetailBody'
            );


        const status =
            safeText(
                candidate?.status,
                'Chưa cập nhật'
            );


        if (title) {

            title.textContent =
                safeText(
                    candidate?.fullName
                );

        }


        if (body) {

            body.innerHTML = `

        <div
          class="row g-3"
        >

          <div
            class="col-12"
          >

            <div
              class="ui-card"
            >

              <div
                class="d-flex align-items-center gap-3"
              >

                <div
                  class="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center"
                  style="width:64px;height:64px;"
                >

                  <i
                    class="fa-solid fa-user fa-xl"
                  ></i>

                </div>


                <div>

                  <div
                    class="text-muted small"
                  >
                    ỨNG VIÊN
                  </div>

                  <div
                    class="fs-4 fw-bold"
                  >
                    ${escapeHtml(
                safeText(
                    candidate?.fullName
                )
            )}
                  </div>

                  <span
                    class="badge bg-secondary mt-1"
                  >
                    ${escapeHtml(
                status
            )}
                  </span>

                </div>

              </div>

            </div>

          </div>


          <div
            class="col-md-6"
          >

            <div
              class="ui-card h-100"
            >

              <div
                class="ui-card-subtitle"
              >
                Thông tin liên hệ
              </div>

              <div
                class="mt-3"
              >

                <div
                  class="mb-3"
                >

                  <div
                    class="text-muted small mb-1"
                  >
                    Email
                  </div>

                  <div>
                    ${escapeHtml(
                safeText(
                    candidate?.email,
                    'Chưa cập nhật'
                )
            )}
                  </div>

                </div>


                <div>

                  <div
                    class="text-muted small mb-1"
                  >
                    Mã ứng viên
                  </div>

                  <code>
                    #${id}
                  </code>

                </div>

              </div>

            </div>

          </div>


          <div
            class="col-md-6"
          >

            <div
              class="ui-card h-100"
            >

              <div
                class="ui-card-subtitle"
              >
                Thông tin nghề nghiệp
              </div>

              <div
                class="mt-3"
              >

                <div
                  class="text-muted small mb-1"
                >
                  Vị trí hiện tại
                </div>

                <strong>
                  ${escapeHtml(
                safeText(
                    candidate?.currentPosition,
                    'Chưa cập nhật'
                )
            )}
                </strong>

              </div>

            </div>

          </div>

        </div>

      `;

        }


        if (
            modal &&
            window.bootstrap?.Modal
        ) {

            window.bootstrap.Modal
                .getOrCreateInstance(
                    modal
                )
                .show();

        }

    }


    // =======================================================
    // FE-30 - PIPELINE
    // =======================================================

    function ensureRecruitmentPipeline() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {
            return null;
        }


        let panel =
            getElement(
                'recruitmentPipeline'
            );


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                'div'
            );


        panel.id =
            'recruitmentPipeline';


        panel.className =
            'table-box mb-4';


        panel.innerHTML = `

      <div
        class="box-header"
      >

        <div>

          <h3
            class="box-title"
          >

            <i
              class="fa-solid fa-route text-primary me-2"
            ></i>

            Recruitment Pipeline

          </h3>

          <div
            class="text-muted small mt-1"
          >
            Theo dõi ứng viên theo từng giai đoạn tuyển dụng
          </div>

        </div>


        <span
          id="pipelineTotalCount"
          class="ui-data-count"
        >
          0 ứng viên
        </span>

      </div>


      <div
        id="pipelineSummary"
        class="px-3 pt-3"
      ></div>


      <div
        id="recruitmentPipelineBoard"
        class="pipeline-board px-3 pb-3 pt-2"
      ></div>

    `;


        const candidatePanel =
            getElement(
                'recruitmentCandidateManagement'
            );


        if (candidatePanel) {

            candidatePanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else {

            const positionPanel =
                getElement(
                    'recruitmentPositionManagement'
                );


            if (positionPanel) {

                positionPanel.insertAdjacentElement(
                    'afterend',
                    panel
                );

            } else {

                section.prepend(
                    panel
                );

            }

        }


        return panel;

    }


    function getPipelineStage(
        candidate
    ) {

        const raw =
            normalize(
                candidate?.status
            );


        if (!raw) {

            return 'received';

        }


        for (
            const stage
            of PIPELINE_STAGES
        ) {

            if (
                stage.aliases.includes(
                    raw
                )
            ) {

                return stage.key;

            }

        }


        return 'other';

    }


    function getPipelineStageInfo(
        key
    ) {

        return PIPELINE_STAGES.find(
            function (stage) {

                return stage.key ===
                    key;

            }
        ) || {

            key:
                'other',

            title:
                'Khác',

            icon:
                'fa-circle-question',

            aliases:
                []

        };

    }


    function renderPipelineSummary() {

        const container =
            getElement(
                'pipelineSummary'
            );


        if (!container) {
            return;
        }


        const total =
            recruitmentCandidates.length;


        const chips =
            PIPELINE_STAGES.map(
                function (stage) {

                    const count =
                        recruitmentCandidates.filter(
                            function (candidate) {

                                return (
                                    getPipelineStage(
                                        candidate
                                    ) ===
                                    stage.key
                                );

                            }
                        ).length;


                    return `

              <div
                class="d-inline-flex align-items-center gap-2 border rounded-pill px-3 py-2 me-2 mb-2 bg-white"
              >

                <i
                  class="fa-solid ${stage.icon} text-primary"
                ></i>

                <span
                  class="small fw-semibold"
                >
                  ${stage.title}
                </span>

                <span
                  class="badge bg-light text-dark border"
                >
                  ${count}
                </span>

              </div>

            `;

                }
            ).join('');


        container.innerHTML = `
      <div
        class="d-flex flex-wrap align-items-center"
      >

        ${chips}

      </div>
    `;


        const totalElement =
            getElement(
                'pipelineTotalCount'
            );


        if (totalElement) {

            totalElement.textContent =
                `${total} ứng viên`;

        }

    }


    function createPipelineCard(
        candidate
    ) {

        const stage =
            getPipelineStage(
                candidate
            );


        const stageInfo =
            getPipelineStageInfo(
                stage
            );


        const status =
            safeText(
                candidate?.status,
                'Chưa cập nhật'
            );


        return `

      <div
        class="border rounded-3 p-3 mb-2 bg-white shadow-sm"
      >

        <div
          class="d-flex justify-content-between gap-2 align-items-start"
        >

          <div>

            <div
              class="fw-bold"
            >
              ${escapeHtml(
            safeText(
                candidate?.fullName
            )
        )}
            </div>

            <div
              class="small text-muted mt-1"
            >
              ${escapeHtml(
            safeText(
                candidate?.currentPosition,
                'Chưa cập nhật'
            )
        )}
            </div>

          </div>


          <span
            class="badge bg-light text-dark border"
          >
            #${safeNumber(
            candidate?.id
        )}
          </span>

        </div>


        <div
          class="small text-muted mt-2"
        >

          <i
            class="fa-regular fa-envelope me-1"
          ></i>

          ${escapeHtml(
            safeText(
                candidate?.email,
                'Chưa cập nhật'
            )
        )}

        </div>


        <div
          class="mt-3 d-flex justify-content-between align-items-center gap-2"
        >

          <span
            class="badge bg-primary-subtle text-primary"
          >

            <i
              class="fa-solid ${stageInfo.icon} me-1"
            ></i>

            ${escapeHtml(
            stageInfo.title
        )}

          </span>


          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            onclick="openCandidateDetail(${safeNumber(
            candidate?.id
        )})"
            title="Xem chi tiết"
          >

            <i
              class="fa-solid fa-eye"
            ></i>

          </button>

        </div>


        <div
          class="small text-secondary mt-2"
        >
          Trạng thái API:
          <strong>
            ${escapeHtml(
            status
        )}
          </strong>
        </div>

      </div>

    `;

    }


    function renderRecruitmentPipeline() {

        const board =
            getElement(
                'recruitmentPipelineBoard'
            );


        if (!board) {
            return;
        }


        renderPipelineSummary();


        if (
            recruitmentCandidates.length ===
            0
        ) {

            board.innerHTML = `

        <div
          class="ui-empty py-5"
        >

          <div
            class="ui-empty-icon"
          >

            <i
              class="fa-solid fa-route"
            ></i>

          </div>


          <div
            class="ui-empty-title"
          >
            Chưa có dữ liệu Pipeline
          </div>


          <div
            class="ui-empty-text"
          >
            Chưa có ứng viên để phân bổ vào các giai đoạn tuyển dụng.
          </div>

        </div>

      `;

            return;

        }


        const grouped =
        {};


        PIPELINE_STAGES.forEach(
            function (stage) {

                grouped[
                    stage.key
                ] = [];

            }
        );


        grouped.other =
            [];


        recruitmentCandidates.forEach(
            function (candidate) {

                const stage =
                    getPipelineStage(
                        candidate
                    );


                if (
                    !grouped[stage]
                ) {

                    grouped[
                        stage
                    ] = [];

                }


                grouped[
                    stage
                ].push(
                    candidate
                );

            }
        );


        const stageKeys = [
            ...PIPELINE_STAGES.map(
                function (stage) {
                    return stage.key;
                }
            )
        ];


        if (
            grouped.other.length >
            0
        ) {

            stageKeys.push(
                'other'
            );

        }


        board.innerHTML =
            stageKeys
                .map(
                    function (key) {

                        const info =
                            getPipelineStageInfo(
                                key
                            );


                        const items =
                            grouped[key] || [];


                        return `

                <div
                  class="pipeline-column"
                  style="
                    min-width:260px;
                    flex:1 1 260px;
                    max-width:320px;
                  "
                >

                  <div
                    class="border rounded-3 bg-light h-100 overflow-hidden"
                  >

                    <div
                      class="p-3 border-bottom bg-white"
                    >

                      <div
                        class="d-flex justify-content-between align-items-center gap-2"
                      >

                        <div
                          class="fw-bold"
                        >

                          <i
                            class="fa-solid ${info.icon} text-primary me-1"
                          ></i>

                          ${escapeHtml(
                            info.title
                        )}

                        </div>


                        <span
                          class="badge bg-primary"
                        >
                          ${items.length}
                        </span>

                      </div>

                    </div>


                    <div
                      class="p-2"
                      style="min-height:180px;max-height:480px;overflow-y:auto;"
                    >

                      ${items.length ===
                                0

                                ? `

                              <div
                                class="text-center text-muted small py-4"
                              >

                                <i
                                  class="fa-solid fa-inbox mb-2"
                                ></i>

                                <div>
                                  Chưa có ứng viên
                                </div>

                              </div>

                            `

                                : items
                                    .map(
                                        createPipelineCard
                                    )
                                    .join('')
                            }

                    </div>

                  </div>

                </div>

              `;

                    }
                )
                .join('');

    }


    // =======================================================
    // FE-27 - DASHBOARD
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

          <h3
            class="fw-bold mb-1"
          >

            <i
              class="fa-solid fa-chart-line text-primary me-2"
            ></i>

            Dashboard Tuyển Dụng

          </h3>

          <div
            class="text-muted small"
          >
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

              <h3
                class="box-title"
              >

                <i
                  class="fa-solid fa-chart-pie text-primary me-2"
                ></i>

                Trạng Thái Vị Trí

              </h3>

            </div>


            <div
              style="height:300px;"
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

              <h3
                class="box-title"
              >

                <i
                  class="fa-solid fa-chart-donut text-success me-2"
                ></i>

                Trạng Thái Deal

              </h3>

            </div>


            <div
              style="height:300px;"
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


        const firstTable =
            section.querySelector(
                '.table-box'
            );


        if (firstTable) {

            section.insertBefore(
                dashboard,
                firstTable
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
                loadRecruitmentDashboard
            );

        }


        return dashboard;

    }


    function renderRecruitmentKpis() {

        const totalJobs =
            recruitmentJobs.length;


        const openJobs =
            recruitmentJobs.filter(
                function (job) {

                    return (
                        normalize(
                            job?.status
                        ) ===
                        'opening'
                    );

                }
            ).length;


        const totalCandidates =
            recruitmentCandidates.length;


        const totalPlacements =
            recruitmentPlacements.length;


        const warranty =
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


        if (
            getElement(
                'recruitmentKpiJobs'
            )
        ) {

            getElement(
                'recruitmentKpiJobs'
            ).textContent =
                totalJobs;

        }


        if (
            getElement(
                'recruitmentKpiOpenJobs'
            )
        ) {

            getElement(
                'recruitmentKpiOpenJobs'
            ).textContent =
                openJobs;

        }


        if (
            getElement(
                'recruitmentKpiCandidates'
            )
        ) {

            getElement(
                'recruitmentKpiCandidates'
            ).textContent =
                totalCandidates;

        }


        if (
            getElement(
                'recruitmentKpiPlacements'
            )
        ) {

            getElement(
                'recruitmentKpiPlacements'
            ).textContent =
                totalPlacements;

        }


        if (
            getElement(
                'recruitmentKpiWarranty'
            )
        ) {

            getElement(
                'recruitmentKpiWarranty'
            ).textContent =
                warranty;

        }


        if (
            getElement(
                'recruitmentKpiServiceFee'
            )
        ) {

            getElement(
                'recruitmentKpiServiceFee'
            ).textContent =
                formatMoneySafe(
                    serviceFee
                );

        }


        if (
            getElement(
                'recruitmentKpiConversion'
            )
        ) {

            getElement(
                'recruitmentKpiConversion'
            ).textContent =
                conversion.toFixed(1) +
                '%';

        }

    }


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


    function renderRecruitmentStatusChart() {

        const canvas =
            getElement(
                'recruitmentStatusChart'
            );


        if (!canvas) {
            return;
        }


        if (
            typeof window.Chart ===
            'undefined'
        ) {

            return;

        }


        const opening =
            recruitmentJobs.filter(
                function (job) {

                    return (
                        normalize(
                            job?.status
                        ) ===
                        'opening'
                    );

                }
            ).length;


        const closed =
            recruitmentJobs.filter(
                function (job) {

                    return (
                        normalize(
                            job?.status
                        ) ===
                        'closed'
                    );

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
                canvas.getContext(
                    '2d'
                ),
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


    function renderPlacementStatusChart() {

        const canvas =
            getElement(
                'placementStatusChart'
            );


        if (!canvas) {
            return;
        }


        if (
            typeof window.Chart ===
            'undefined'
        ) {

            return;

        }


        const warranty =
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


        const completed =
            recruitmentPlacements.filter(
                function (placement) {

                    return (
                        normalize(
                            placement?.status
                        ) !==
                        'underwarranty'
                    );

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
                canvas.getContext(
                    '2d'
                ),
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
    // LOAD DASHBOARD
    // =======================================================

    async function loadRecruitmentDashboard() {

        ensurePositionManagement();

        ensureCandidateManagement();

        ensureRecruitmentPipeline();

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
                await Promise.allSettled([
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


            if (
                results[0].status ===
                'fulfilled'
            ) {

                recruitmentJobs =
                    Array.isArray(
                        results[0].value?.jobs
                    )
                        ? results[0].value.jobs
                        : [];

            } else {

                recruitmentJobs =
                    [];

                console.error(
                    'Lỗi tải danh sách vị trí:',
                    results[0].reason
                );

            }


            if (
                results[1].status ===
                'fulfilled'
            ) {

                recruitmentCandidates =
                    Array.isArray(
                        results[1].value?.candidates
                    )
                        ? results[1].value.candidates
                        : [];

            } else {

                recruitmentCandidates =
                    [];

                console.error(
                    'Lỗi tải danh sách ứng viên:',
                    results[1].reason
                );

            }


            if (
                results[2].status ===
                'fulfilled'
            ) {

                recruitmentPlacements =
                    Array.isArray(
                        results[2].value?.placements
                    )
                        ? results[2].value.placements
                        : [];

            } else {

                recruitmentPlacements =
                    [];

                console.error(
                    'Lỗi tải deal tuyển dụng:',
                    results[2].reason
                );

            }


            populateCandidateStatusFilter();


            applyPositionFilters();


            applyCandidateFilters();


            renderRecruitmentPipeline();


            renderRecruitmentKpis();


            renderRecruitmentStatusChart();


            renderPlacementStatusChart();


        } catch (error) {

            console.error(
                'Lỗi Recruitment Dashboard:',
                error
            );


            recruitmentJobs =
                [];

            recruitmentCandidates =
                [];

            recruitmentPlacements =
                [];


            applyPositionFilters();

            applyCandidateFilters();

            renderRecruitmentPipeline();

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
    // PLACEMENTS
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


                await loadRecruitmentDashboard();


                return;

            }


            placements.forEach(
                function (placement) {

                    const warranty =
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
                  class="status-badge ${warranty
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


            await loadRecruitmentDashboard();

        }

    }


    // =======================================================
    // ADD PLACEMENT
    // =======================================================

    async function openModalAddPlacement() {

        const form =
            getElement(
                'formAddPlacement'
            );


        if (form) {
            form.reset();
        }


        const onboardDate =
            getElement(
                'placementOnboardDate'
            );


        if (onboardDate) {

            onboardDate.valueAsDate =
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


            const clients =
                Array.isArray(
                    results[0]?.clients
                )
                    ? results[0].clients
                    : [];


            const candidates =
                Array.isArray(
                    results[1]?.candidates
                )
                    ? results[1].candidates
                    : [];


            const clientSelect =
                getElement(
                    'placementClientId'
                );


            if (clientSelect) {

                clientSelect.innerHTML = `
          <option value="">
            -- Chọn khách hàng --
          </option>
        `;


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


                        clientSelect.appendChild(
                            option
                        );

                    }
                );

            }


            const candidateSelect =
                getElement(
                    'placementCandidateId'
                );


            if (candidateSelect) {

                candidateSelect.innerHTML = `
          <option value="">
            -- Chọn ứng viên --
          </option>
        `;


                candidates.forEach(
                    function (candidate) {

                        const option =
                            document.createElement(
                                'option'
                            );


                        option.value =
                            candidate.id;


                        option.textContent =
                            `${safeText(
                                candidate.fullName
                            )} (${safeText(
                                candidate.currentPosition,
                                ''
                            )
                            })`;


                        candidateSelect.appendChild(
                            option
                        );

                    }
                );

            }


            const modal =
                getElement(
                    'modalAddPlacement'
                );


            if (
                modal &&
                window.bootstrap?.Modal
            ) {

                window.bootstrap.Modal
                    .getOrCreateInstance(
                        modal
                    )
                    .show();

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


        if (!clientId) {

            jobSelect.innerHTML = `
        <option value="">
          -- Chọn khách hàng trước --
        </option>
      `;

            return;

        }


        jobSelect.innerHTML = `
      <option value="">
        -- Đang tải vị trí... --
      </option>
    `;


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

                        return (
                            String(
                                job?.clientId
                            ) ===
                            String(
                                clientId
                            )
                        );

                    }
                );


            jobSelect.innerHTML =
                '';


            if (
                clientJobs.length ===
                0
            ) {

                jobSelect.innerHTML = `
          <option value="">
            (Khách hàng này chưa có Job mở)
          </option>
        `;

                return;

            }


            clientJobs.forEach(
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
                        )
                        })`;


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


            jobSelect.innerHTML = `
        <option value="">
          (Lỗi tải danh sách job)
        </option>
      `;

        }

    }


    function calcPlacementFee() {

        const salary =
            parseFloat(
                getElement(
                    'placementSalary'
                )?.value
            ) || 0;


        const rate =
            parseFloat(
                getElement(
                    'placementFeeRate'
                )?.value
            ) || 18;


        const fee =
            salary *
            12 *
            (
                rate /
                100
            );


        const estimatedFee =
            getElement(
                'placementEstFee'
            );


        if (estimatedFee) {

            estimatedFee.value =
                formatMoneySafe(
                    fee
                );

        }

    }


    async function submitAddPlacement(
        event
    ) {

        event.preventDefault();


        function valueOf(id) {

            return (
                getElement(
                    id
                )?.value ||
                ''
            );

        }


        const body = {

            clientId:
                valueOf(
                    'placementClientId'
                ),

            jobId:
                valueOf(
                    'placementJobId'
                ),

            candidateId:
                valueOf(
                    'placementCandidateId'
                ),

            officialSalary:
                valueOf(
                    'placementSalary'
                ),

            feeRatePercent:
                valueOf(
                    'placementFeeRate'
                ),

            onboardDate:
                valueOf(
                    'placementOnboardDate'
                ),

            warrantyDays:
                valueOf(
                    'placementWarrantyDays'
                )

        };


        const button =
            event.submitter;


        const originalHtml =
            button
                ? button.innerHTML
                : '';


        if (button) {

            button.disabled =
                true;


            button.innerHTML = `
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
                data?.success ===
                false
            ) {

                throw new Error(
                    data?.message ||
                    'Không thể ghi nhận deal.'
                );

            }


            const modal =
                getElement(
                    'modalAddPlacement'
                );


            if (
                modal &&
                window.bootstrap?.Modal
            ) {

                window.bootstrap.Modal
                    .getInstance(
                        modal
                    )
                    ?.hide();

            }


            alert(
                data?.message ||
                'Ghi nhận deal tuyển dụng thành công!'
            );


            await loadPlacements();


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

            if (button) {

                button.disabled =
                    false;


                button.innerHTML =
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

        if (
            !window.confirm(
                'Bạn có chắc chắn muốn phát hành hóa đơn VAT cho deal tuyển dụng này?'
            )
        ) {

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
    // GLOBAL EXPORT
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


    window.applyCandidateFilters =
        applyCandidateFilters;


    window.openCandidateDetail =
        openCandidateDetail;


    window.renderRecruitmentPipeline =
        renderRecruitmentPipeline;


})(window);