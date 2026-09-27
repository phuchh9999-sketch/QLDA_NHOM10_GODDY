/**
 * =========================================================
 * GODDY RECRUIT - Recruitment & Placement Module
 * FE-27 / FE-28 / FE-29 / FE-30 / FE-31
 * =========================================================
 *
 * FE-27:
 * - Dashboard tuyển dụng
 * - KPI vị trí / ứng viên / deal
 * - Biểu đồ trạng thái vị trí
 * - Biểu đồ trạng thái deal
 *
 * FE-28:
 * - Quản lý vị trí tuyển dụng
 * - Tìm kiếm / lọc vị trí
 * - Thêm vị trí
 *
 * FE-29:
 * - Quản lý ứng viên
 * - Tìm kiếm / lọc ứng viên
 * - Xem chi tiết ứng viên
 *
 * FE-30:
 * - Recruitment Pipeline
 * - Nhận ứng viên
 * - Sàng lọc
 * - Phỏng vấn
 * - Offer
 * - Nhận việc
 * - Loại
 *
 * FE-31:
 * - Quản lý lịch phỏng vấn
 * - Thêm lịch phỏng vấn
 * - Chọn ứng viên / vị trí
 * - Ngày / giờ / vòng
 * - Người phỏng vấn
 * - Kết quả
 * - Ghi chú
 * - Xem danh sách
 * - Lọc trạng thái
 * - Xóa lịch phỏng vấn
 * - Lưu trình duyệt bằng localStorage
 *
 * API thật đang có:
 * - /api/recruitment/jobs
 * - /api/recruitment/candidates
 * - /api/recruitment/placements
 * - /api/clients
 * - /api/recruitment/jobs (POST)
 * - /api/recruitment/placements (POST)
 * - /api/invoices/from-placement (POST)
 *
 * FE-31 CHƯA tự tạo interview endpoint vì public/backend
 * hiện tại chưa có contract interview được xác nhận.
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

    let currentInterviewStatus = 'All';

    let recruitmentInterviews = [];


    const INTERVIEW_STORAGE_KEY =
        'goddy_recruit_interviews';


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
                'nhan',
                'nhan ung vien'
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
    // INTERVIEW STATUS
    // =======================================================

    const INTERVIEW_STATUSES = [

        {
            value: 'Scheduled',
            text: 'Đã lên lịch'
        },

        {
            value: 'Completed',
            text: 'Đã phỏng vấn'
        },

        {
            value: 'Passed',
            text: 'Đạt'
        },

        {
            value: 'Failed',
            text: 'Không đạt'
        },

        {
            value: 'Cancelled',
            text: 'Đã hủy'
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
            String(
                value ?? ''
            ).trim();

        return text ||
            fallback;

    }


    function normalize(value) {

        return String(
            value ?? ''
        )
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(
                /[\u0300-\u036f]/g,
                ''
            );

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
            safeNumber(
                value
            ).toLocaleString(
                'vi-VN'
            ) +
            ' đ'
        );

    }


    function formatInterviewDate(
        dateValue
    ) {

        if (!dateValue) {
            return '-';
        }


        const date =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return safeText(
                dateValue
            );

        }


        return date.toLocaleDateString(
            'vi-VN'
        );

    }


    // =======================================================
    // API HELPERS
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
                    method: 'POST',

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


    // =======================================================
    // FE-31 - LOCAL INTERVIEW STORAGE
    // =======================================================

    function loadInterviewStorage() {

        try {

            const raw =
                localStorage.getItem(
                    INTERVIEW_STORAGE_KEY
                );


            if (!raw) {

                recruitmentInterviews =
                    [];

                return;

            }


            const parsed =
                JSON.parse(
                    raw
                );


            recruitmentInterviews =
                Array.isArray(
                    parsed
                )
                    ? parsed
                    : [];

        } catch (error) {

            console.warn(
                'Không thể đọc lịch phỏng vấn:',
                error
            );


            recruitmentInterviews =
                [];

        }

    }


    function saveInterviewStorage() {

        try {

            localStorage.setItem(
                INTERVIEW_STORAGE_KEY,
                JSON.stringify(
                    recruitmentInterviews
                )
            );


            return true;

        } catch (error) {

            console.error(
                'Không thể lưu lịch phỏng vấn:',
                error
            );


            return false;

        }

    }


    // =======================================================
    // FE-31 - INTERVIEW HELPERS
    // =======================================================

    function getInterviewStatusText(
        status
    ) {

        const item =
            INTERVIEW_STATUSES.find(
                function (entry) {

                    return entry.value ===
                        status;

                }
            );


        return item
            ? item.text
            : safeText(
                status,
                'Đã lên lịch'
            );

    }


    function getInterviewStatusClass(
        status
    ) {

        switch (status) {

            case 'Completed':
                return 'bg-primary';

            case 'Passed':
                return 'bg-success';

            case 'Failed':
                return 'bg-danger';

            case 'Cancelled':
                return 'bg-secondary';

            default:
                return 'bg-warning text-dark';

        }

    }


    function getCandidateById(
        id
    ) {

        return recruitmentCandidates.find(
            function (candidate) {

                return (
                    safeNumber(
                        candidate?.id
                    ) ===
                    safeNumber(
                        id
                    )
                );

            }
        ) || null;

    }


    function getJobById(
        id
    ) {

        return recruitmentJobs.find(
            function (job) {

                return (
                    safeNumber(
                        job?.id
                    ) ===
                    safeNumber(
                        id
                    )
                );

            }
        ) || null;

    }


    // =======================================================
    // FE-31 - INTERVIEW UI
    // =======================================================

    function ensureInterviewManagement() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {
            return null;
        }


        let panel =
            getElement(
                'recruitmentInterviewManagement'
            );


        if (panel) {
            return panel;
        }


        panel =
            document.createElement(
                'div'
            );


        panel.id =
            'recruitmentInterviewManagement';


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
              class="fa-solid fa-calendar-check text-primary me-2"
            ></i>

            Quản Lý Phỏng Vấn

          </h3>

          <div
            class="text-muted small mt-1"
          >
            Lưu lịch phỏng vấn và kết quả từng vòng tuyển dụng
          </div>

        </div>


        <div
          class="d-flex gap-2 align-items-center flex-wrap"
        >

          <span
            id="interviewResultCount"
            class="ui-data-count"
          >
            0 lịch
          </span>


          <button
            type="button"
            class="btn btn-sm btn-primary"
            id="btnAddInterview"
          >

            <i
              class="fa-solid fa-plus me-1"
            ></i>

            Thêm Lịch Phỏng Vấn

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
            style="max-width:360px;"
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
              id="interviewSearchInput"
              class="form-control"
              placeholder="Tìm ứng viên / vị trí..."
              autocomplete="off"
            >

          </div>


          <select
            id="interviewStatusFilter"
            class="form-select"
            style="max-width:220px;"
          >

            <option value="All">
              Tất cả trạng thái
            </option>

            <option value="Scheduled">
              Đã lên lịch
            </option>

            <option value="Completed">
              Đã phỏng vấn
            </option>

            <option value="Passed">
              Đạt
            </option>

            <option value="Failed">
              Không đạt
            </option>

            <option value="Cancelled">
              Đã hủy
            </option>

          </select>


          <button
            type="button"
            class="btn btn-outline-secondary"
            id="btnResetInterviewFilter"
          >

            <i
              class="fa-solid fa-rotate-left me-1"
            ></i>

            Xóa lọc

          </button>

        </div>

      </div>


      <div
        class="table-responsive mt-3"
      >

        <table
          class="table table-hover mb-0"
        >

          <thead>

            <tr>

              <th>
                Ứng Viên
              </th>

              <th>
                Vị Trí
              </th>

              <th>
                Ngày
              </th>

              <th>
                Giờ
              </th>

              <th>
                Vòng
              </th>

              <th>
                Người Phỏng Vấn
              </th>

              <th>
                Kết Quả
              </th>

              <th
                class="text-end"
              >
                Thao Tác
              </th>

            </tr>

          </thead>


          <tbody
            id="interviewTableBody"
          ></tbody>

        </table>

      </div>

    `;


        const candidatePanel =
            getElement(
                'recruitmentCandidateManagement'
            );


        const pipelinePanel =
            getElement(
                'recruitmentPipeline'
            );


        const positionPanel =
            getElement(
                'recruitmentPositionManagement'
            );


        if (candidatePanel) {

            candidatePanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else if (pipelinePanel) {

            pipelinePanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else if (positionPanel) {

            positionPanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else {

            section.prepend(
                panel
            );

        }


        const addButton =
            getElement(
                'btnAddInterview'
            );


        if (addButton) {

            addButton.addEventListener(
                'click',
                openInterviewModal
            );

        }


        const searchInput =
            getElement(
                'interviewSearchInput'
            );


        if (searchInput) {

            searchInput.addEventListener(
                'input',
                function () {

                    renderInterviewTable();

                }
            );

        }


        const statusFilter =
            getElement(
                'interviewStatusFilter'
            );


        if (statusFilter) {

            statusFilter.addEventListener(
                'change',
                function () {

                    currentInterviewStatus =
                        statusFilter.value;


                    renderInterviewTable();

                }
            );

        }


        const resetButton =
            getElement(
                'btnResetInterviewFilter'
            );


        if (resetButton) {

            resetButton.addEventListener(
                'click',
                function () {

                    if (searchInput) {

                        searchInput.value =
                            '';

                    }


                    currentInterviewStatus =
                        'All';


                    if (statusFilter) {

                        statusFilter.value =
                            'All';

                    }


                    renderInterviewTable();

                }
            );

        }


        ensureInterviewModal();


        return panel;

    }


    // =======================================================
    // FE-31 - INTERVIEW TABLE
    // =======================================================

    function renderInterviewTable() {

        const tbody =
            getElement(
                'interviewTableBody'
            );


        if (!tbody) {
            return;
        }


        const search =
            normalize(
                getElement(
                    'interviewSearchInput'
                )?.value
            );


        const filtered =
            recruitmentInterviews.filter(
                function (interview) {

                    const candidate =
                        getCandidateById(
                            interview.candidateId
                        );


                    const job =
                        getJobById(
                            interview.jobId
                        );


                    const candidateName =
                        normalize(
                            interview.candidateName ||
                            candidate?.fullName
                        );


                    const jobTitle =
                        normalize(
                            interview.jobTitle ||
                            job?.title
                        );


                    const searchMatch =
                        !search ||
                        candidateName.includes(
                            search
                        ) ||
                        jobTitle.includes(
                            search
                        );


                    const statusMatch =
                        currentInterviewStatus ===
                        'All' ||
                        interview.status ===
                        currentInterviewStatus;


                    return (
                        searchMatch &&
                        statusMatch
                    );

                }
            )
                .sort(
                    function (
                        a,
                        b
                    ) {

                        const first =
                            `${a.date || ''} ${a.time || ''}`;

                        const second =
                            `${b.date || ''} ${b.time || ''}`;

                        return (
                            first.localeCompare(
                                second
                            )
                        );

                    }
                );


        const countElement =
            getElement(
                'interviewResultCount'
            );


        if (countElement) {

            countElement.textContent =
                `${filtered.length} lịch`;

        }


        if (
            filtered.length ===
            0
        ) {

            tbody.innerHTML = `

        <tr>

          <td
            colspan="8"
            class="text-center text-muted py-5"
          >

            <div
              class="ui-empty"
            >

              <div
                class="ui-empty-icon"
              >

                <i
                  class="fa-solid fa-calendar-xmark"
                ></i>

              </div>


              <div
                class="ui-empty-title"
              >
                Chưa có lịch phỏng vấn
              </div>


              <div
                class="ui-empty-text"
              >
                Hãy thêm lịch phỏng vấn đầu tiên.
              </div>

            </div>

          </td>

        </tr>

      `;

            return;

        }


        tbody.innerHTML =
            filtered
                .map(
                    function (interview) {

                        const candidate =
                            getCandidateById(
                                interview.candidateId
                            );


                        const job =
                            getJobById(
                                interview.jobId
                            );


                        const candidateName =
                            safeText(
                                interview.candidateName ||
                                candidate?.fullName,
                                'Ứng viên'
                            );


                        const jobTitle =
                            safeText(
                                interview.jobTitle ||
                                job?.title,
                                'Vị trí'
                            );


                        return `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(
                            candidateName
                        )}
                  </strong>

                </td>


                <td>
                  ${escapeHtml(
                            jobTitle
                        )}
                </td>


                <td>
                  ${escapeHtml(
                            formatInterviewDate(
                                interview.date
                            )
                        )}
                </td>


                <td>
                  ${escapeHtml(
                            safeText(
                                interview.time,
                                '-'
                            )
                        )}
                </td>


                <td>

                  <span
                    class="badge bg-light text-dark border"
                  >
                    Vòng ${safeNumber(
                            interview.round
                        ) || 1
                            }
                  </span>

                </td>


                <td>
                  ${escapeHtml(
                                safeText(
                                    interview.interviewer,
                                    'Chưa cập nhật'
                                )
                            )}
                </td>


                <td>

                  <span
                    class="badge ${getInterviewStatusClass(
                                interview.status
                            )
                            }"
                  >
                    ${escapeHtml(
                                getInterviewStatusText(
                                    interview.status
                                )
                            )}
                  </span>

                </td>


                <td
                  class="text-end"
                >

                  <div
                    class="d-flex gap-1 justify-content-end"
                  >

                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      onclick="viewInterviewDetail('${interview.id}')"
                      title="Xem chi tiết"
                    >

                      <i
                        class="fa-solid fa-eye"
                      ></i>

                    </button>


                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      onclick="deleteInterview('${interview.id}')"
                      title="Xóa lịch"
                    >

                      <i
                        class="fa-solid fa-trash"
                      ></i>

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
    // FE-31 - INTERVIEW MODAL
    // =======================================================

    function ensureInterviewModal() {

        let modal =
            getElement(
                'modalAddInterview'
            );


        if (modal) {
            return modal;
        }


        modal =
            document.createElement(
                'div'
            );


        modal.id =
            'modalAddInterview';


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
                class="text-muted small text-uppercase fw-bold"
              >
                Recruitment
              </div>


              <h5
                class="modal-title"
              >

                <i
                  class="fa-solid fa-calendar-plus text-primary me-2"
                ></i>

                Thêm Lịch Phỏng Vấn

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
            id="formAddInterview"
          >

            <div
              class="modal-body"
            >

              <div
                id="interviewFormError"
                style="display:none;"
                class="mb-3"
              ></div>


              <div
                class="row g-3"
              >

                <div
                  class="col-md-6"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewCandidateId"
                  >
                    Ứng viên *
                  </label>

                  <select
                    id="interviewCandidateId"
                    class="form-select"
                    required
                  >

                    <option value="">
                      -- Chọn ứng viên --
                    </option>

                  </select>

                </div>


                <div
                  class="col-md-6"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewJobId"
                  >
                    Vị trí *
                  </label>

                  <select
                    id="interviewJobId"
                    class="form-select"
                    required
                  >

                    <option value="">
                      -- Chọn vị trí --
                    </option>

                  </select>

                </div>


                <div
                  class="col-md-4"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewDate"
                  >
                    Ngày phỏng vấn *
                  </label>

                  <input
                    type="date"
                    id="interviewDate"
                    class="form-control"
                    required
                  >

                </div>


                <div
                  class="col-md-4"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewTime"
                  >
                    Giờ
                  </label>

                  <input
                    type="time"
                    id="interviewTime"
                    class="form-control"
                  >

                </div>


                <div
                  class="col-md-4"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewRound"
                  >
                    Vòng
                  </label>

                  <input
                    type="number"
                    id="interviewRound"
                    class="form-control"
                    value="1"
                    min="1"
                    max="20"
                  >

                </div>


                <div
                  class="col-md-6"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewInterviewer"
                  >
                    Người phỏng vấn
                  </label>

                  <input
                    type="text"
                    id="interviewInterviewer"
                    class="form-control"
                    maxlength="150"
                    placeholder="Ví dụ: Nguyễn Văn A"
                  >

                </div>


                <div
                  class="col-md-6"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewStatus"
                  >
                    Trạng thái
                  </label>

                  <select
                    id="interviewStatus"
                    class="form-select"
                  >

                    <option value="Scheduled">
                      Đã lên lịch
                    </option>

                    <option value="Completed">
                      Đã phỏng vấn
                    </option>

                    <option value="Passed">
                      Đạt
                    </option>

                    <option value="Failed">
                      Không đạt
                    </option>

                    <option value="Cancelled">
                      Đã hủy
                    </option>

                  </select>

                </div>


                <div
                  class="col-12"
                >

                  <label
                    class="form-label fw-bold"
                    for="interviewResult"
                  >
                    Kết quả / Nhận xét
                  </label>

                  <textarea
                    id="interviewResult"
                    class="form-control"
                    rows="3"
                    maxlength="1000"
                    placeholder="Nhập nhận xét hoặc kết quả vòng phỏng vấn..."
                  ></textarea>

                </div>


                <div
                  class="col-12"
                >

                  <div
                    class="ui-alert ui-alert-info"
                  >

                    <i
                      class="fa-solid fa-circle-info"
                    ></i>

                    <div>
                      Lịch phỏng vấn hiện được lưu trên trình duyệt
                      để hoàn thiện UI FE-31. Chưa gọi API interview mới.
                    </div>

                  </div>

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
                  class="fa-solid fa-calendar-check me-1"
                ></i>

                Lưu Lịch Phỏng Vấn

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
                'formAddInterview'
            );


        if (form) {

            form.addEventListener(
                'submit',
                submitInterview
            );

        }


        return modal;

    }


    // =======================================================
    // FE-31 - POPULATE SELECTS
    // =======================================================

    function populateInterviewSelects() {

        const candidateSelect =
            getElement(
                'interviewCandidateId'
            );


        const jobSelect =
            getElement(
                'interviewJobId'
            );


        if (candidateSelect) {

            candidateSelect.innerHTML = `
        <option value="">
          -- Chọn ứng viên --
        </option>
      `;


            recruitmentCandidates.forEach(
                function (candidate) {

                    const option =
                        document.createElement(
                            'option'
                        );


                    option.value =
                        safeNumber(
                            candidate?.id
                        );


                    option.textContent =
                        `${safeText(
                            candidate?.fullName
                        )} - ${safeText(
                            candidate?.currentPosition,
                            'Chưa cập nhật'
                        )
                        }`;


                    candidateSelect.appendChild(
                        option
                    );

                }
            );

        }


        if (jobSelect) {

            jobSelect.innerHTML = `
        <option value="">
          -- Chọn vị trí --
        </option>
      `;


            recruitmentJobs.forEach(
                function (job) {

                    const option =
                        document.createElement(
                            'option'
                        );


                    option.value =
                        safeNumber(
                            job?.id
                        );


                    option.textContent =
                        `${safeText(
                            job?.title
                        )} - ${safeText(
                            job?.department,
                            'Chưa cập nhật'
                        )
                        }`;


                    jobSelect.appendChild(
                        option
                    );

                }
            );

        }

    }


    // =======================================================
    // FE-31 - OPEN INTERVIEW MODAL
    // =======================================================

    function openInterviewModal() {

        const modal =
            ensureInterviewModal();


        const form =
            getElement(
                'formAddInterview'
            );


        if (form) {
            form.reset();
        }


        populateInterviewSelects();


        const dateInput =
            getElement(
                'interviewDate'
            );


        if (dateInput) {

            const today =
                new Date();


            const year =
                today.getFullYear();


            const month =
                String(
                    today.getMonth() +
                    1
                ).padStart(
                    2,
                    '0'
                );


            const day =
                String(
                    today.getDate()
                ).padStart(
                    2,
                    '0'
                );


            dateInput.value =
                `${year}-${month}-${day}`;

        }


        const roundInput =
            getElement(
                'interviewRound'
            );


        if (roundInput) {
            roundInput.value =
                '1';
        }


        const status =
            getElement(
                'interviewStatus'
            );


        if (status) {
            status.value =
                'Scheduled';
        }


        clearInterviewFormError();


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
    // FE-31 - ERROR
    // =======================================================

    function clearInterviewFormError() {

        const element =
            getElement(
                'interviewFormError'
            );


        if (!element) {
            return;
        }


        element.style.display =
            'none';


        element.innerHTML =
            '';

    }


    function showInterviewFormError(
        message
    ) {

        const element =
            getElement(
                'interviewFormError'
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


    // =======================================================
    // FE-31 - SUBMIT
    // =======================================================

    function submitInterview(
        event
    ) {

        event.preventDefault();


        clearInterviewFormError();


        const candidateId =
            safeNumber(
                getElement(
                    'interviewCandidateId'
                )?.value
            );


        const jobId =
            safeNumber(
                getElement(
                    'interviewJobId'
                )?.value
            );


        const date =
            getElement(
                'interviewDate'
            )?.value ||
            '';


        const time =
            getElement(
                'interviewTime'
            )?.value ||
            '';


        const round =
            safeNumber(
                getElement(
                    'interviewRound'
                )?.value
            ) ||
            1;


        const interviewer =
            getElement(
                'interviewInterviewer'
            )?.value
                ?.trim() ||
            '';


        const status =
            getElement(
                'interviewStatus'
            )?.value ||
            'Scheduled';


        const result =
            getElement(
                'interviewResult'
            )?.value
                ?.trim() ||
            '';


        if (!candidateId) {

            showInterviewFormError(
                'Vui lòng chọn ứng viên.'
            );

            return;

        }


        if (!jobId) {

            showInterviewFormError(
                'Vui lòng chọn vị trí.'
            );

            return;

        }


        if (!date) {

            showInterviewFormError(
                'Vui lòng chọn ngày phỏng vấn.'
            );

            return;

        }


        const candidate =
            getCandidateById(
                candidateId
            );


        const job =
            getJobById(
                jobId
            );


        const interview = {

            id:
                `INT-${Date.now()}`,

            candidateId:
                candidateId,

            candidateName:
                safeText(
                    candidate?.fullName,
                    'Ứng viên'
                ),

            jobId:
                jobId,

            jobTitle:
                safeText(
                    job?.title,
                    'Vị trí'
                ),

            date:
                date,

            time:
                time,

            round:
                round,

            interviewer:
                interviewer,

            status:
                status,

            result:
                result,

            createdAt:
                new Date().toISOString()

        };


        recruitmentInterviews.push(
            interview
        );


        saveInterviewStorage();


        const modal =
            getElement(
                'modalAddInterview'
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


        renderInterviewTable();


        alert(
            'Đã lưu lịch phỏng vấn thành công!'
        );

    }


    // =======================================================
    // FE-31 - DETAIL
    // =======================================================

    function viewInterviewDetail(
        interviewId
    ) {

        const interview =
            recruitmentInterviews.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                        String(
                            interviewId
                        );

                }
            );


        if (!interview) {

            alert(
                'Không tìm thấy lịch phỏng vấn.'
            );

            return;

        }


        const candidate =
            getCandidateById(
                interview.candidateId
            );


        const job =
            getJobById(
                interview.jobId
            );


        const resultText =
            safeText(
                interview.result,
                'Chưa có nhận xét.'
            );


        alert(
            [
                `Ứng viên: ${safeText(
                    interview.candidateName ||
                    candidate?.fullName
                )
                }`,
                `Vị trí: ${safeText(
                    interview.jobTitle ||
                    job?.title
                )
                }`,
                `Ngày: ${formatInterviewDate(
                    interview.date
                )
                }`,
                `Giờ: ${safeText(
                    interview.time,
                    'Chưa cập nhật'
                )
                }`,
                `Vòng: ${safeNumber(
                    interview.round
                ) || 1
                }`,
                `Người phỏng vấn: ${safeText(
                    interview.interviewer,
                    'Chưa cập nhật'
                )
                }`,
                `Trạng thái: ${getInterviewStatusText(
                    interview.status
                )
                }`,
                `Kết quả: ${resultText
                }`
            ].join(
                '\n'
            )
        );

    }


    // =======================================================
    // FE-31 - DELETE
    // =======================================================

    function deleteInterview(
        interviewId
    ) {

        const interview =
            recruitmentInterviews.find(
                function (item) {

                    return String(
                        item.id
                    ) ===
                        String(
                            interviewId
                        );

                }
            );


        if (!interview) {
            return;
        }


        const confirmed =
            window.confirm(
                `Bạn có chắc muốn xóa lịch phỏng vấn của ${safeText(
                    interview.candidateName
                )
                }?`
            );


        if (!confirmed) {
            return;
        }


        recruitmentInterviews =
            recruitmentInterviews.filter(
                function (item) {

                    return String(
                        item.id
                    ) !==
                        String(
                            interviewId
                        );

                }
            );


        saveInterviewStorage();


        renderInterviewTable();

    }


    // =======================================================
    // FE-27 - DASHBOARD UI
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


    // =======================================================
    // FE-27 - KPI
    // =======================================================

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


        const jobsEl =
            getElement(
                'recruitmentKpiJobs'
            );


        if (jobsEl) {
            jobsEl.textContent =
                totalJobs;
        }


        const openJobsEl =
            getElement(
                'recruitmentKpiOpenJobs'
            );


        if (openJobsEl) {
            openJobsEl.textContent =
                openJobs;
        }


        const candidatesEl =
            getElement(
                'recruitmentKpiCandidates'
            );


        if (candidatesEl) {
            candidatesEl.textContent =
                totalCandidates;
        }


        const placementsEl =
            getElement(
                'recruitmentKpiPlacements'
            );


        if (placementsEl) {
            placementsEl.textContent =
                totalPlacements;
        }


        const warrantyEl =
            getElement(
                'recruitmentKpiWarranty'
            );


        if (warrantyEl) {
            warrantyEl.textContent =
                warranty;
        }


        const feeEl =
            getElement(
                'recruitmentKpiServiceFee'
            );


        if (feeEl) {
            feeEl.textContent =
                formatMoneySafe(
                    serviceFee
                );
        }


        const conversionEl =
            getElement(
                'recruitmentKpiConversion'
            );


        if (conversionEl) {

            conversionEl.textContent =
                conversion.toFixed(
                    1
                ) +
                '%';

        }

    }


    // =======================================================
    // FE-27 - CHART EMPTY
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
    // FE-27 - JOB CHART
    // =======================================================

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


    // =======================================================
    // FE-27 - PLACEMENT CHART
    // =======================================================

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
        class="pipeline-board px-3 pb-3 pt-2 d-flex flex-wrap gap-3"
      ></div>

    `;


        const candidatePanel =
            getElement(
                'recruitmentCandidateManagement'
            );


        const positionPanel =
            getElement(
                'recruitmentPositionManagement'
            );


        if (candidatePanel) {

            candidatePanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else if (positionPanel) {

            positionPanel.insertAdjacentElement(
                'afterend',
                panel
            );

        } else {

            section.prepend(
                panel
            );

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

        return (
            PIPELINE_STAGES.find(
                function (stage) {

                    return stage.key ===
                        key;

                }
            )
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
                  class="fa-solid ${stage.icon
                        } text-primary"
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
        class="d-flex flex-wrap"
      >
        ${chips}
      </div>
    `;


        const total =
            getElement(
                'pipelineTotalCount'
            );


        if (total) {

            total.textContent =
                `${recruitmentCandidates.length} ứng viên`;

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


        return `

      <div
        class="border rounded-3 p-3 mb-2 bg-white shadow-sm"
      >

        <div
          class="d-flex justify-content-between align-items-start gap-2"
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
              class="fa-solid ${stageInfo.icon
            } me-1"
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
          class="ui-empty py-5 w-100"
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
            Chưa có ứng viên để phân bổ vào các giai đoạn.
          </div>

        </div>

      `;

            return;

        }


        const grouped = {};


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

                    grouped[stage] =
                        [];

                }


                grouped[
                    stage
                ].push(
                    candidate
                );

            }
        );


        const keys =
            [
                ...PIPELINE_STAGES.map(
                    function (stage) {
                        return stage.key;
                    }
                )
            ];


        if (
            grouped.other.length
        ) {

            keys.push(
                'other'
            );

        }


        board.innerHTML =
            keys.map(
                function (key) {

                    const info =
                        getPipelineStageInfo(
                            key
                        );


                    const items =
                        grouped[key] ||
                        [];


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
                      class="d-flex justify-content-between align-items-center"
                    >

                      <div
                        class="fw-bold"
                      >

                        <i
                          class="fa-solid ${info.icon
                        } text-primary me-1"
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
                    style="
                      min-height:180px;
                      max-height:480px;
                      overflow-y:auto;
                    "
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
                                .join(
                                    ''
                                )
                        }

                  </div>

                </div>

              </div>

            `;

                }
            ).join('');

    }


    // =======================================================
    // FE-28 - LOAD JOB DATA / POSITION TABLE
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

      <div
        class="box-header"
      >

        <div>

          <h3
            class="box-title"
          >

            <i
              class="fa-solid fa-briefcase text-primary me-2"
            ></i>

            Quản Lý Vị Trí Tuyển Dụng

          </h3>


          <div
            class="text-muted small mt-1"
          >
            Quản lý vị trí theo doanh nghiệp, phòng ban và trạng thái
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
            style="max-width:360px;"
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
            style="max-width:220px;"
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

            section.prepend(
                panel
            );

        }


        getElement(
            'btnAddRecruitmentJob'
        )?.addEventListener(
            'click',
            openRecruitmentJobModal
        );


        getElement(
            'positionSearchInput'
        )?.addEventListener(
            'input',
            function () {

                currentJobSearch =
                    getElement(
                        'positionSearchInput'
                    )?.value ||
                    '';

                applyPositionFilters();

            }
        );


        getElement(
            'positionStatusFilter'
        )?.addEventListener(
            'change',
            function () {

                currentJobStatus =
                    getElement(
                        'positionStatusFilter'
                    )?.value ||
                    'All';

                applyPositionFilters();

            }
        );


        getElement(
            'btnResetPositionFilter'
        )?.addEventListener(
            'click',
            function () {

                currentJobSearch =
                    '';

                currentJobStatus =
                    'All';


                getElement(
                    'positionSearchInput'
                ).value =
                    '';


                getElement(
                    'positionStatusFilter'
                ).value =
                    'All';


                applyPositionFilters();

            }
        );


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
            Array.isArray(
                jobs
            )
                ? jobs
                : [];


        if (
            items.length ===
            0
        ) {

            renderPositionEmpty(
                currentJobSearch ||
                    currentJobStatus !==
                    'All'
                    ? 'Không tìm thấy vị trí phù hợp.'
                    : 'Chưa có vị trí tuyển dụng nào.'
            );

            return;

        }


        tbody.innerHTML =
            items
                .map(
                    function (job) {

                        const opening =
                            normalize(
                                job?.status
                            ) ===
                            'opening';


                        return `

              <tr>

                <td>
                  #${safeNumber(
                            job?.id
                        )}
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
                    class="badge ${opening
                                ? 'bg-success'
                                : 'bg-secondary'
                            }"
                  >
                    ${opening
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

            <h5
              class="modal-title"
            >

              <i
                class="fa-solid fa-briefcase text-primary me-2"
              ></i>

              Thêm Vị Trí Tuyển Dụng

            </h5>


            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
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
                style="display:none;"
                class="mb-3"
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
                  required
                  maxlength="150"
                  placeholder="Ví dụ: Senior Data Engineer"
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
                  required
                  maxlength="120"
                  placeholder="Ví dụ: Công nghệ thông tin"
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


        getElement(
            'formAddRecruitmentJob'
        )?.addEventListener(
            'submit',
            submitRecruitmentJob
        );


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
                'Lỗi tải khách hàng:',
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


        getElement(
            'formAddRecruitmentJob'
        )?.reset();


        getElement(
            'recruitmentJobFeeRate'
        ).value =
            '18';


        clearRecruitmentJobFormError();


        await loadClientsForRecruitmentJob();


        window.bootstrap?.Modal
            ?.getOrCreateInstance(
                modal
            )
            ?.show();

    }


    async function submitRecruitmentJob(
        event
    ) {

        event.preventDefault();


        clearRecruitmentJobFormError();


        const clientId =
            getElement(
                'recruitmentJobClientId'
            )?.value ||
            '';


        const title =
            getElement(
                'recruitmentJobTitle'
            )?.value
                ?.trim() ||
            '';


        const department =
            getElement(
                'recruitmentJobDepartment'
            )?.value
                ?.trim() ||
            '';


        const salaryRange =
            getElement(
                'recruitmentJobSalary'
            )?.value
                ?.trim() ||
            '';


        const feeRate =
            Number(
                getElement(
                    'recruitmentJobFeeRate'
                )?.value
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
                    'Không thể tạo vị trí.'
                );

            }


            window.bootstrap?.Modal
                ?.getInstance(
                    getElement(
                        'modalAddRecruitmentJob'
                    )
                )
                ?.hide();


            alert(
                data?.message ||
                'Tạo vị trí tuyển dụng thành công!'
            );


            await loadRecruitmentDashboard();

        } catch (error) {

            console.error(
                'Lỗi tạo vị trí:',
                error
            );


            showRecruitmentJobFormError(
                error?.message ||
                'Lỗi kết nối máy chủ.'
            );

        }

    }


    // =======================================================
    // PLACEMENT
    // =======================================================

    async function loadPlacements() {

        try {

            const data =
                await apiGet(
                    '/recruitment/placements'
                );


            recruitmentPlacements =
                Array.isArray(
                    data?.placements
                )
                    ? data.placements
                    : [];


            const tbody =
                getElement(
                    'placementsTableBody'
                );


            if (tbody) {

                tbody.innerHTML =
                    '';


                if (
                    recruitmentPlacements.length ===
                    0
                ) {

                    tbody.innerHTML = `
            <tr>

              <td
                colspan="8"
                class="text-center text-muted py-4"
              >
                Chưa có deal tuyển dụng nào.
              </td>

            </tr>
          `;

                } else {

                    recruitmentPlacements.forEach(
                        function (placement) {

                            const warranty =
                                placement?.status ===
                                'UnderWarranty';


                            const hasInvoice =
                                placement?.Invoice !=
                                null;


                            tbody.innerHTML += `

                <tr>

                  <td>
                    <strong>
                      ${escapeHtml(
                                safeText(
                                    placement
                                        ?.Candidate
                                        ?.fullName
                                )
                            )}
                    </strong>
                  </td>


                  <td>
                    ${escapeHtml(
                                safeText(
                                    placement
                                        ?.Job
                                        ?.title
                                )
                            )}
                  </td>


                  <td>
                    ${escapeHtml(
                                safeText(
                                    placement
                                        ?.Client
                                        ?.companyName
                                )
                            )}
                  </td>


                  <td>
                    ${formatMoneySafe(
                                placement
                                    ?.officialSalary
                            )}
                  </td>


                  <td
                    class="text-success fw-bold"
                  >
                    ${formatMoneySafe(
                                placement
                                    ?.serviceFee
                            )}
                  </td>


                  <td>

                    ${escapeHtml(
                                safeText(
                                    placement
                                        ?.warrantyEndDate
                                )
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
                                    safeText(
                                        placement?.status
                                    )
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

                }

            }


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


        const dateInput =
            getElement(
                'placementOnboardDate'
            );


        if (dateInput) {
            dateInput.valueAsDate =
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


            window.bootstrap?.Modal
                ?.getOrCreateInstance(
                    modal
                )
                ?.show();

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

        const clientId =
            getElement(
                'placementClientId'
            )?.value ||
            '';


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


            if (
                clientJobs.length ===
                0
            ) {

                jobSelect.innerHTML = `
          <option value="">
            (Khách hàng này chưa có Job mở)
          </option>
        `;

            }

        } catch (error) {

            console.error(
                'Lỗi tải job:',
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
            ) ||
            0;


        const rate =
            parseFloat(
                getElement(
                    'placementFeeRate'
                )?.value
            ) ||
            18;


        const fee =
            salary *
            12 *
            (
                rate /
                100
            );


        const feeElement =
            getElement(
                'placementEstFee'
            );


        if (feeElement) {

            feeElement.value =
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


            window.bootstrap?.Modal
                ?.getInstance(
                    getElement(
                        'modalAddPlacement'
                    )
                )
                ?.hide();


            alert(
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
    // LOAD DASHBOARD + POSITION + CANDIDATE + PIPELINE
    // =======================================================

    async function loadRecruitmentDashboard() {

        ensurePositionManagement();

        ensureCandidateManagement();

        ensureRecruitmentPipeline();

        ensureInterviewManagement();

        ensureRecruitmentDashboard();

        loadInterviewStorage();


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
                    'Lỗi tải vị trí:',
                    results[0].reason
                );

            }


            if (
                results[1].status ===
                'fulfilled'
            ) {

                recruitmentCandidates =
                    Array.isArray(
                        results[1].value
                            ?.candidates
                    )
                        ? results[1]
                            .value
                            .candidates
                        : [];

            } else {

                recruitmentCandidates =
                    [];

                console.error(
                    'Lỗi tải ứng viên:',
                    results[1].reason
                );

            }


            if (
                results[2].status ===
                'fulfilled'
            ) {

                recruitmentPlacements =
                    Array.isArray(
                        results[2].value
                            ?.placements
                    )
                        ? results[2]
                            .value
                            .placements
                        : [];

            } else {

                recruitmentPlacements =
                    [];

                console.error(
                    'Lỗi tải deal:',
                    results[2].reason
                );

            }


            applyPositionFilters();


            applyCandidateFilters();


            renderRecruitmentPipeline();


            renderInterviewTable();


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


            renderInterviewTable();


            renderRecruitmentKpis();


            renderChartEmpty(
                'recruitmentStatusChart',
                'Không thể tải dữ liệu vị trí.'
            );


            renderChartEmpty(
                'placementStatusChart',
                'Không thể tải dữ liệu deal.'
            );

        }

    }


    // =======================================================
    // CANDIDATE MANAGEMENT
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
            Tra cứu ứng viên theo họ tên, email, vị trí và trạng thái
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


        getElement(
            'candidateSearchInput'
        )?.addEventListener(
            'input',
            function () {

                currentCandidateSearch =
                    getElement(
                        'candidateSearchInput'
                    )?.value ||
                    '';

                applyCandidateFilters();

            }
        );


        getElement(
            'candidateStatusFilter'
        )?.addEventListener(
            'change',
            function () {

                currentCandidateStatus =
                    getElement(
                        'candidateStatusFilter'
                    )?.value ||
                    'All';

                applyCandidateFilters();

            }
        );


        getElement(
            'btnResetCandidateFilter'
        )?.addEventListener(
            'click',
            function () {

                currentCandidateSearch =
                    '';

                currentCandidateStatus =
                    'All';


                getElement(
                    'candidateSearchInput'
                ).value =
                    '';


                getElement(
                    'candidateStatusFilter'
                ).value =
                    'All';


                applyCandidateFilters();

            }
        );


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
                Chưa có ứng viên nào.
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


            return;

        }


        tbody.innerHTML =
            items
                .map(
                    function (candidate) {

                        return `

              <tr>

                <td>
                  #${safeNumber(
                            candidate?.id
                        )}
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
                  ${escapeHtml(
                            safeText(
                                candidate?.email,
                                'Chưa cập nhật'
                            )
                        )}
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
                    class="badge bg-secondary"
                  >
                    ${escapeHtml(
                            safeText(
                                candidate?.status,
                                'Chưa cập nhật'
                            )
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

                const name =
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


                return (

                    (
                        !search ||
                        name.includes(
                            search
                        ) ||
                        email.includes(
                            search
                        ) ||
                        position.includes(
                            search
                        )
                    ) &&

                    (
                        currentCandidateStatus ===
                        'All' ||
                        status ===
                        currentCandidateStatus
                    )

                );

            }
        );

    }


    function applyCandidateFilters() {

        populateCandidateStatusFilter();

        renderCandidateTable(
            getFilteredCandidates()
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

            <h5
              class="modal-title"
              id="candidateDetailTitle"
            >
              Chi tiết ứng viên
            </h5>


            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
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

        const candidate =
            getCandidateById(
                candidateId
            );


        if (!candidate) {

            alert(
                'Không tìm thấy ứng viên.'
            );

            return;

        }


        const modal =
            ensureCandidateDetailModal();


        getElement(
            'candidateDetailTitle'
        ).textContent =
            safeText(
                candidate?.fullName,
                'Chi tiết ứng viên'
            );


        getElement(
            'candidateDetailBody'
        ).innerHTML = `

      <div
        class="row g-3"
      >

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
                  class="text-muted small"
                >
                  Họ tên
                </div>

                <strong>
                  ${escapeHtml(
            safeText(
                candidate?.fullName
            )
        )}
                </strong>

              </div>


              <div>

                <div
                  class="text-muted small"
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
                class="mb-3"
              >

                <div
                  class="text-muted small"
                >
                  Vị trí
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


              <div>

                <div
                  class="text-muted small"
                >
                  Trạng thái
                </div>

                <span
                  class="badge bg-secondary"
                >
                  ${escapeHtml(
            safeText(
                candidate?.status,
                'Chưa cập nhật'
            )
        )}
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    `;


        window.bootstrap?.Modal
            ?.getOrCreateInstance(
                modal
            )
            ?.show();

    }


    // =======================================================
    // EXPORT GLOBALS
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


    window.openInterviewModal =
        openInterviewModal;


    window.submitInterview =
        submitInterview;


    window.viewInterviewDetail =
        viewInterviewDetail;


    window.deleteInterview =
        deleteInterview;


    window.renderInterviewTable =
        renderInterviewTable;


    // =======================================================
    // INITIALIZATION
    // =======================================================

    loadInterviewStorage();


})(window);