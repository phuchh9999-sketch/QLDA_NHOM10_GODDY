/**
 * =========================================================
 * GODDY RECRUIT - Candidate Status Management
 * FE-32
 * =========================================================
 *
 * Chức năng:
 * - Hiển thị danh sách ứng viên
 * - Cập nhật giai đoạn tuyển dụng
 * - Mới
 * - Sàng lọc
 * - Phỏng vấn
 * - Offer
 * - Nhận việc
 * - Loại
 * - Lưu trạng thái FE bằng localStorage
 *
 * Quan trọng:
 * - KHÔNG sửa recruitment.js
 * - KHÔNG tạo endpoint backend mới
 * - Dùng GoddyAPI nếu có
 * - Có fallback fetch
 * =========================================================
 */

(function (window) {
    'use strict';


    // =======================================================
    // CONFIG
    // =======================================================

    const STORAGE_KEY =
        'goddy_recruit_candidate_status';


    const STATUS_LIST = [
        {
            value: 'New',
            label: 'Mới',
            icon: 'fa-user-plus'
        },

        {
            value: 'Screening',
            label: 'Sàng lọc',
            icon: 'fa-filter'
        },

        {
            value: 'Interview',
            label: 'Phỏng vấn',
            icon: 'fa-comments'
        },

        {
            value: 'Offer',
            label: 'Offer',
            icon: 'fa-file-signature'
        },

        {
            value: 'Hired',
            label: 'Nhận việc',
            icon: 'fa-user-check'
        },

        {
            value: 'Rejected',
            label: 'Loại',
            icon: 'fa-user-xmark'
        }
    ];


    let candidates = [];

    let statusOverrides = {};


    // =======================================================
    // HELPERS
    // =======================================================

    function getElement(id) {

        return document.getElementById(id);

    }


    function safeText(
        value,
        fallback = '-'
    ) {

        const text =
            String(
                value ?? ''
            ).trim();

        return text || fallback;

    }


    function safeNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;

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


    // =======================================================
    // STORAGE
    // =======================================================

    function loadStatusOverrides() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!raw) {

                statusOverrides = {};

                return;

            }


            const parsed =
                JSON.parse(
                    raw
                );


            if (
                parsed &&
                typeof parsed === 'object' &&
                !Array.isArray(parsed)
            ) {

                statusOverrides =
                    parsed;

            } else {

                statusOverrides = {};

            }

        } catch (error) {

            console.warn(
                'Không thể đọc trạng thái ứng viên:',
                error
            );

            statusOverrides = {};

        }

    }


    function saveStatusOverrides() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    statusOverrides
                )
            );

            return true;

        } catch (error) {

            console.error(
                'Không thể lưu trạng thái ứng viên:',
                error
            );

            return false;

        }

    }


    function getStoredStatus(
        candidateId
    ) {

        return (
            statusOverrides[
            String(
                candidateId
            )
            ] ||
            ''
        );

    }


    function setStoredStatus(
        candidateId,
        status
    ) {

        statusOverrides[
            String(
                candidateId
            )
        ] = status;


        saveStatusOverrides();

    }


    // =======================================================
    // STATUS
    // =======================================================

    function getStatus(
        candidate
    ) {

        const id =
            safeNumber(
                candidate?.id
            );


        const stored =
            getStoredStatus(
                id
            );


        if (stored) {
            return stored;
        }


        const original =
            safeText(
                candidate?.status,
                'New'
            );


        const normalized =
            normalize(
                original
            );


        const mapped =
            STATUS_LIST.find(
                function (item) {

                    return (
                        item.value ===
                        original ||
                        normalize(
                            item.value
                        ) ===
                        normalized
                    );

                }
            );


        return mapped
            ? mapped.value
            : 'New';

    }


    function getStatusMeta(
        status
    ) {

        return (
            STATUS_LIST.find(
                function (item) {

                    return (
                        item.value ===
                        status
                    );

                }
            )
        ) || STATUS_LIST[0];

    }


    function getStatusBadgeClass(
        status
    ) {

        switch (status) {

            case 'New':
                return 'status-new';

            case 'Screening':
                return 'status-screening';

            case 'Interview':
                return 'status-interview';

            case 'Offer':
                return 'status-offer';

            case 'Hired':
                return 'status-hired';

            case 'Rejected':
                return 'status-rejected';

            default:
                return 'status-new';

        }

    }


    // =======================================================
    // API
    // =======================================================

    async function loadCandidatesFromApi() {

        try {

            if (
                window.GoddyAPI &&
                typeof window.GoddyAPI.get ===
                'function'
            ) {

                const data =
                    await window.GoddyAPI.get(
                        '/recruitment/candidates'
                    );


                return Array.isArray(
                    data?.candidates
                )
                    ? data.candidates
                    : [];

            }


            const response =
                await fetch(
                    '/api/recruitment/candidates'
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );

            }


            const data =
                await response.json();


            return Array.isArray(
                data?.candidates
            )
                ? data.candidates
                : [];

        } catch (error) {

            console.error(
                'Lỗi tải ứng viên FE-32:',
                error
            );


            return [];

        }

    }


    // =======================================================
    // CSS
    // =======================================================

    function ensureStyles() {

        if (
            getElement(
                'candidateStatusStyles'
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'candidateStatusStyles';


        style.textContent = `

      #candidateStatusPanel {
        margin-top: 24px;
      }

      #candidateStatusPanel .status-card {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: #ffffff;
        padding: 18px;
        transition:
          transform .18s ease,
          box-shadow .18s ease,
          border-color .18s ease;
      }

      #candidateStatusPanel .status-card:hover {
        transform: translateY(-1px);
        box-shadow:
          0 8px 24px rgba(15, 23, 42, .08);
      }

      #candidateStatusPanel .status-step {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
      }

      #candidateStatusPanel .status-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 42px;
        background: #eff6ff;
        color: #2563eb;
      }

      #candidateStatusPanel .status-name {
        font-weight: 700;
        color: #0f172a;
      }

      #candidateStatusPanel .status-description {
        font-size: 13px;
        color: #64748b;
        margin-top: 2px;
      }

      #candidateStatusPanel .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
      }

      #candidateStatusPanel .status-new {
        background: #dbeafe;
        color: #1d4ed8;
      }

      #candidateStatusPanel .status-screening {
        background: #cffafe;
        color: #0e7490;
      }

      #candidateStatusPanel .status-interview {
        background: #fef3c7;
        color: #b45309;
      }

      #candidateStatusPanel .status-offer {
        background: #dcfce7;
        color: #15803d;
      }

      #candidateStatusPanel .status-hired {
        background: #16a34a;
        color: #ffffff;
      }

      #candidateStatusPanel .status-rejected {
        background: #fee2e2;
        color: #b91c1c;
      }

      #candidateStatusPanel .candidate-status-select {
        min-width: 190px;
        font-weight: 600;
      }

      #candidateStatusPanel .status-empty {
        padding: 48px 20px;
        text-align: center;
        color: #64748b;
      }

      #candidateStatusPanel .status-empty-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        background: #f1f5f9;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 24px;
      }

      #candidateStatusPanel .status-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        margin: 16px;
      }

      @media (max-width: 768px) {

        #candidateStatusPanel .status-toolbar {
          margin: 12px;
        }

        #candidateStatusPanel .candidate-status-select {
          min-width: 150px;
        }

      }

    `;


        document.head.appendChild(
            style
        );

    }


    // =======================================================
    // PANEL
    // =======================================================

    function ensurePanel() {

        const section =
            getElement(
                'section-recruitment'
            );


        if (!section) {

            return null;

        }


        let panel =
            getElement(
                'candidateStatusPanel'
            );


        if (panel) {

            return panel;

        }


        panel =
            document.createElement(
                'section'
            );


        panel.id =
            'candidateStatusPanel';


        panel.className =
            'table-box';


        panel.innerHTML = `

      <div
        class="box-header"
      >

        <div>

          <h3
            class="box-title"
          >

            <i
              class="fa-solid fa-arrows-turn-to-dots text-primary me-2"
            ></i>

            Cập Nhật Giai Đoạn Tuyển Dụng

          </h3>


          <div
            class="text-muted small mt-1"
          >

            Cập nhật trạng thái ứng viên theo tiến trình tuyển dụng

          </div>

        </div>


        <span
          id="candidateStatusCount"
          class="ui-data-count"
        >
          0 ứng viên
        </span>

      </div>


      <div
        class="status-toolbar"
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
            id="candidateStatusSearch"
            class="form-control"
            placeholder="Tìm tên / email / vị trí..."
            autocomplete="off"
          >

        </div>


        <select
          id="candidateStatusFilter"
          class="form-select"
          style="max-width:210px;"
        >

          <option value="All">
            Tất cả trạng thái
          </option>

          <option value="New">
            Mới
          </option>

          <option value="Screening">
            Sàng lọc
          </option>

          <option value="Interview">
            Phỏng vấn
          </option>

          <option value="Offer">
            Offer
          </option>

          <option value="Hired">
            Nhận việc
          </option>

          <option value="Rejected">
            Loại
          </option>

        </select>


        <button
          type="button"
          class="btn btn-outline-secondary"
          id="candidateStatusReset"
        >

          <i
            class="fa-solid fa-rotate-left me-1"
          ></i>

          Xóa lọc

        </button>

      </div>


      <div
        class="table-responsive"
      >

        <table
          class="table table-hover mb-0 align-middle"
        >

          <thead>

            <tr>

              <th>#</th>

              <th>Ứng Viên</th>

              <th>Email</th>

              <th>Vị Trí</th>

              <th>Trạng Thái</th>

              <th
                style="min-width:210px;"
              >
                Cập Nhật
              </th>

            </tr>

          </thead>


          <tbody
            id="candidateStatusBody"
          ></tbody>

        </table>

      </div>

    `;


        section.appendChild(
            panel
        );


        bindEvents();


        return panel;

    }


    // =======================================================
    // EVENTS
    // =======================================================

    function bindEvents() {

        getElement(
            'candidateStatusSearch'
        )?.addEventListener(
            'input',
            render
        );


        getElement(
            'candidateStatusFilter'
        )?.addEventListener(
            'change',
            render
        );


        getElement(
            'candidateStatusReset'
        )?.addEventListener(
            'click',
            function () {

                const search =
                    getElement(
                        'candidateStatusSearch'
                    );


                const filter =
                    getElement(
                        'candidateStatusFilter'
                    );


                if (search) {
                    search.value =
                        '';
                }


                if (filter) {
                    filter.value =
                        'All';
                }


                render();

            }
        );

    }


    // =======================================================
    // FILTER
    // =======================================================

    function getFilteredCandidates() {

        const search =
            normalize(
                getElement(
                    'candidateStatusSearch'
                )?.value
            );


        const filter =
            getElement(
                'candidateStatusFilter'
            )?.value ||
            'All';


        return candidates.filter(
            function (candidate) {

                const status =
                    getStatus(
                        candidate
                    );


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


                const matchSearch =
                    !search ||
                    name.includes(
                        search
                    ) ||
                    email.includes(
                        search
                    ) ||
                    position.includes(
                        search
                    );


                const matchStatus =
                    filter ===
                    'All' ||
                    status ===
                    filter;


                return (
                    matchSearch &&
                    matchStatus
                );

            }
        );

    }


    // =======================================================
    // RENDER
    // =======================================================

    function render() {

        const body =
            getElement(
                'candidateStatusBody'
            );


        if (!body) {
            return;
        }


        const items =
            getFilteredCandidates();


        const count =
            getElement(
                'candidateStatusCount'
            );


        if (count) {

            count.textContent =
                `${items.length} ứng viên`;

        }


        if (
            items.length ===
            0
        ) {

            body.innerHTML = `

        <tr>

          <td
            colspan="6"
          >

            <div
              class="status-empty"
            >

              <div
                class="status-empty-icon"
              >

                <i
                  class="fa-solid fa-user-group"
                ></i>

              </div>


              <div
                class="fw-bold text-dark mb-1"
              >
                Chưa có ứng viên
              </div>


              <div>
                Chưa có dữ liệu ứng viên phù hợp để cập nhật.
              </div>

            </div>

          </td>

        </tr>

      `;

            return;

        }


        body.innerHTML =
            items
                .map(
                    function (candidate) {

                        const id =
                            safeNumber(
                                candidate?.id
                            );


                        const status =
                            getStatus(
                                candidate
                            );


                        const meta =
                            getStatusMeta(
                                status
                            );


                        const options =
                            STATUS_LIST
                                .map(
                                    function (item) {

                                        return `

                    <option
                      value="${item.value}"
                      ${item.value ===
                                                status
                                                ? 'selected'
                                                : ''
                                            }
                    >
                      ${item.label}
                    </option>

                  `;

                                    }
                                )
                                .join('');


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

                  <div
                    class="d-flex align-items-center gap-2"
                  >

                    <div
                      class="status-icon"
                      style="
                        width:36px;
                        height:36px;
                        flex-basis:36px;
                      "
                    >

                      <i
                        class="fa-solid ${meta.icon
                            }"
                      ></i>

                    </div>


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

                    </div>

                  </div>

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
                    class="status-badge ${getStatusBadgeClass(
                                status
                            )}"
                  >

                    <i
                      class="fa-solid ${meta.icon
                            }"
                    ></i>

                    ${escapeHtml(
                                meta.label
                            )}

                  </span>

                </td>


                <td>

                  <select
                    class="form-select form-select-sm candidate-status-select"
                    data-candidate-id="${id}"
                    aria-label="Cập nhật trạng thái"
                  >

                    ${options}

                  </select>

                </td>

              </tr>

            `;

                    }
                )
                .join('');


        body
            .querySelectorAll(
                '.candidate-status-select'
            )
            .forEach(
                function (select) {

                    select.addEventListener(
                        'change',
                        function () {

                            updateStatus(
                                Number(
                                    select.dataset
                                        .candidateId
                                ),
                                select.value
                            );

                        }
                    );

                }
            );

    }


    // =======================================================
    // UPDATE
    // =======================================================

    function updateStatus(
        candidateId,
        newStatus
    ) {

        const candidate =
            candidates.find(
                function (item) {

                    return (
                        safeNumber(
                            item?.id
                        ) ===
                        safeNumber(
                            candidateId
                        )
                    );

                }
            );


        if (!candidate) {

            alert(
                'Không tìm thấy ứng viên.'
            );

            return;

        }


        const meta =
            getStatusMeta(
                newStatus
            );


        const confirmed =
            window.confirm(
                `Cập nhật ứng viên "${safeText(
                    candidate?.fullName
                )}" sang trạng thái "${meta.label}"?`
            );


        if (!confirmed) {

            render();

            return;

        }


        setStoredStatus(
            candidateId,
            newStatus
        );


        candidate.status =
            newStatus;


        render();


        // Đồng bộ các module FE nếu đang tồn tại.
        if (
            typeof window.renderRecruitmentPipeline ===
            'function'
        ) {

            try {

                window.renderRecruitmentPipeline();

            } catch (error) {

                console.warn(
                    'Không thể đồng bộ Recruitment Pipeline:',
                    error
                );

            }

        }


        if (
            typeof window.applyCandidateFilters ===
            'function'
        ) {

            try {

                window.applyCandidateFilters();

            } catch (error) {

                console.warn(
                    'Không thể đồng bộ Candidate Management:',
                    error
                );

            }

        }


        alert(
            `Đã cập nhật "${safeText(
                candidate?.fullName
            )}" → ${meta.label}`
        );

    }


    // =======================================================
    // LOAD
    // =======================================================

    async function initialize() {

        ensureStyles();

        ensurePanel();

        loadStatusOverrides();


        const body =
            getElement(
                'candidateStatusBody'
            );


        if (body) {

            body.innerHTML = `

        <tr>

          <td
            colspan="6"
            class="text-center py-5"
          >

            <div
              class="status-empty"
            >

              <div
                class="spinner-border text-primary mb-3"
                role="status"
              ></div>


              <div
                class="fw-bold"
              >
                Đang tải ứng viên...
              </div>

            </div>

          </td>

        </tr>

      `;

        }


        candidates =
            await loadCandidatesFromApi();


        render();

    }


    // =======================================================
    // GLOBAL
    // =======================================================

    window.CandidateStatusManager = {

        initialize,

        reload:
            initialize,

        updateStatus

    };


    // =======================================================
    // START
    // =======================================================

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