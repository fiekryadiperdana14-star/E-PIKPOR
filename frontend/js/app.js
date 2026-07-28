var app = angular.module('epikporApp', ['ngRoute']);

// ============================================================
// Config: Routes & HTTP Interceptor
// ============================================================
app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    $routeProvider
        .when('/landing', { templateUrl: 'views/landing.html' })
        .when('/login', { templateUrl: 'views/login.html', controller: 'LoginCtrl' })
        .when('/dashboard', { templateUrl: 'views/dashboard.html?v=12', controller: 'DashboardCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/buat-laporan', { templateUrl: 'views/report-form.html?v=12', controller: 'ReportFormCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/pelimpahan', { templateUrl: 'views/handover-list.html?v=12', controller: 'HandoverCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/jadwal-piket', { templateUrl: 'views/schedule.html?v=12', controller: 'ScheduleCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/siaga-wiken', { templateUrl: 'views/siaga-wiken.html?v=12', controller: 'SiagaWikenCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/sop', { templateUrl: 'views/sop.html?v=12', controller: 'SOPCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/struktur', { templateUrl: 'views/org-chart.html?v=12', controller: 'OrgChartCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/users', { templateUrl: 'views/user-management.html?v=12', controller: 'UserManagementCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .when('/kalender-libur', { templateUrl: 'views/holidays.html?v=12', controller: 'HolidayCtrl', resolve: { auth: ['$q', '$window', '$location', checkAuth] } })
        .otherwise({ redirectTo: '/landing' });

    $httpProvider.interceptors.push(['$q', '$window', '$location', function($q, $window, $location) {
        return {
            request: function(config) {
                config.headers = config.headers || {};
                var token = $window.localStorage.getItem('token');
                if (token) config.headers.Authorization = 'Bearer ' + token;
                return config;
            },
            responseError: function(response) {
                if (response.status === 401) {
                    $window.localStorage.removeItem('token');
                    $window.localStorage.removeItem('user');
                    $location.path('/login');
                }
                return $q.reject(response);
            }
        };
    }]);
}]);

// ============================================================
// Run: Global State & Route Guards
// ============================================================
app.run(['$rootScope', '$window', '$location', function($rootScope, $window, $location) {
    $rootScope.isLoggedIn = function() { return !!$window.localStorage.getItem('token'); };
    if ($rootScope.isLoggedIn()) {
        try { $rootScope.user = JSON.parse($window.localStorage.getItem('user')); }
        catch (e) { $window.localStorage.removeItem('user'); $window.localStorage.removeItem('token'); }
    }
    $rootScope.$on('$routeChangeStart', function(event, next) {
        var publicPages = ['views/login.html', 'views/landing.html'];
        if (!$rootScope.isLoggedIn() && publicPages.indexOf(next.templateUrl) === -1) { $location.path('/landing'); }
    });
    $rootScope.$on('$routeChangeSuccess', function() {
        var sidebar = document.getElementById('sidebarNav');
        if (sidebar && sidebar.classList.contains('show')) {
            var bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebar);
            if (bsOffcanvas) bsOffcanvas.hide();
        }
    });
}]);

// ============================================================
// Custom Filters
// ============================================================
app.filter('startFrom', function() {
    return function(input, start) {
        if (!input || !input.length) return [];
        return input.slice(+start);
    };
});

function checkAuth($q, $window, $location) {
    return $window.localStorage.getItem('token') ? $q.resolve(true) : ($location.path('/login'), $q.reject(false));
}

// ============================================================
// API Service
// ============================================================
app.factory('ApiService', ['$http', function($http) {
    var b = '/api';
    return {
        login: function(c) { return $http.post(b + '/auth/login', c); },
        getUsers: function() { return $http.get(b + '/auth/users'); },
        getSubnit: function() { return $http.get(b + '/auth/subnit'); },
        getRegu: function() { return $http.get(b + '/auth/regu'); },
        getReports: function() { return $http.get(b + '/reports'); },
        getStats: function() { return $http.get(b + '/stats'); },
        createReport: function(fd) { return $http.post(b + '/reports', fd, { transformRequest: angular.identity, headers: { 'Content-Type': undefined } }); },
        updateReport: function(id, d) { return $http.put(b + '/reports/' + id, d); },
        deleteReport: function(id) { return $http.delete(b + '/reports/' + id); },
        getReportHistory: function(id) { return $http.get(b + '/reports/' + id + '/history'); },
        createHandover: function(d) { return $http.post(b + '/handovers', d); },
        getHandoversPenerima: function(id) { return $http.get(b + '/handovers/penerima/' + id); },
        updateHandoverStatus: function(id, d) { return $http.put(b + '/handovers/' + id, d); },
        getAllUsers: function() { return $http.get(b + '/users'); },
        createUser: function(d) { return $http.post(b + '/users', d); },
        updateUser: function(id, d) { return $http.put(b + '/users/' + id, d); },
        deleteUser: function(id) { return $http.delete(b + '/users/' + id); },
        getSchedules: function(params) { return $http.get(b + '/schedules', { params: params }); },
        getTodaySchedule: function() { return $http.get(b + '/schedules/today'); },
        createSchedule: function(d) { return $http.post(b + '/schedules', d); },
        generateSchedule: function(d) { return $http.post(b + '/schedules/generate', d); },
        deleteSchedule: function(id) { return $http.delete(b + '/schedules/' + id); },
        getSiagaWiken: function() { return $http.get(b + '/siaga-wiken'); },
        getActiveSiaga: function() { return $http.get(b + '/siaga-wiken/active'); },
        createSiagaWiken: function(d) { return $http.post(b + '/siaga-wiken', d); },
        checkinSiaga: function(id) { return $http.post(b + '/siaga-wiken/' + id + '/checkin'); },
        deleteSiagaWiken: function(id) { return $http.delete(b + '/siaga-wiken/' + id); },
        getSOPs: function(params) { return $http.get(b + '/sop', { params: params }); },
        createSOP: function(fd) { return $http.post(b + '/sop', fd, { transformRequest: angular.identity, headers: {'Content-Type': undefined} }); },
        updateSOP: function(id, fd) { return $http.put(b + '/sop/' + id, fd, { transformRequest: angular.identity, headers: {'Content-Type': undefined} }); },
        deleteSOP: function(id) { return $http.delete(b + '/sop/' + id); },
        getHolidays: function(params) { return $http.get(b + '/holidays', { params: params }); },
        createHoliday: function(d) { return $http.post(b + '/holidays', d); },
        deleteHoliday: function(id) { return $http.delete(b + '/holidays/' + id); },
        getOrgLeaders: function() { return $http.get(b + '/org-leaders'); },
        createOrgLeader: function(d) { return $http.post(b + '/org-leaders', d); },
        updateOrgLeader: function(id, d) { return $http.put(b + '/org-leaders/' + id, d); },
        deleteOrgLeader: function(id) { return $http.delete(b + '/org-leaders/' + id); },
        getOrgChart: function() { return $http.get(b + '/org-chart'); }
    };
}]);

// ============================================================
// Navbar Controller
// ============================================================
app.controller('NavbarCtrl', ['$scope', '$window', '$location', '$rootScope', 'ApiService',
function($scope, $window, $location, $rootScope, ApiService) {
    $scope.globalStats = {};
    if ($rootScope.isLoggedIn()) {
        ApiService.getStats().then(function(r) { $scope.globalStats = r.data; });
    }
    
    $scope.isActive = function(path) {
        return $location.path() === path;
    };
    
    $scope.logout = function() {
        Swal.fire({ title: 'Logout', text: 'Apakah Anda yakin ingin keluar?', icon: 'question',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Logout', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(result) {
            if (result.isConfirmed) {
                $scope.$apply(function() {
                    $window.localStorage.removeItem('token');
                    $window.localStorage.removeItem('user');
                    $rootScope.user = null;
                    $location.path('/login');
                });
            }
        });
    };
}]);

// ============================================================
// Login Controller
// ============================================================
app.controller('LoginCtrl', ['$scope', 'ApiService', '$window', '$location', '$rootScope',
function($scope, ApiService, $window, $location, $rootScope) {
    if ($rootScope.isLoggedIn()) { $location.path('/dashboard'); return; }
    $scope.credentials = { username: '', password: '' };
    $scope.isLoading = false;
    $scope.doLogin = function() {
        $scope.isLoading = true;
        ApiService.login($scope.credentials).then(function(res) {
            $window.localStorage.setItem('token', res.data.token);
            $window.localStorage.setItem('user', JSON.stringify(res.data.user));
            $rootScope.user = res.data.user;
            Swal.fire({ icon: 'success', title: 'Login Berhasil', text: 'Selamat datang, ' + res.data.user.pangkat + ' ' + res.data.user.nama_lengkap,
                background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            $location.path('/dashboard');
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Login gagal.', background: '#1e293b', color: '#fff' });
        }).finally(function() { $scope.isLoading = false; });
    };
}]);

// ============================================================
// Dashboard Controller
// ============================================================
app.controller('DashboardCtrl', ['$scope', 'ApiService', '$rootScope',
function($scope, ApiService, $rootScope) {
    $scope.reports = []; $scope.users = []; $scope.stats = {}; $scope.todaySchedule = [];
    $scope.currentPage = 1; $scope.pageSize = 10;

    function loadAll() {
        ApiService.getReports().then(function(r) { $scope.reports = r.data; });
        ApiService.getStats().then(function(r) { $scope.stats = r.data; });
        ApiService.getUsers().then(function(r) { $scope.users = r.data.filter(function(u) { return u.id !== $rootScope.user.id; }); });
        ApiService.getTodaySchedule().then(function(r) { $scope.todaySchedule = r.data; });
    }
    loadAll();

    $scope.openHandoverModal = function(report) {
        $scope.selectedReport = report;
        $scope.handoverData = { report_id: report.id, regu_pengirim_id: $rootScope.user.id, regu_penerima_id: '', catatan: '' };
        new bootstrap.Modal(document.getElementById('handoverModal')).show();
    };
    $scope.submitHandover = function() {
        ApiService.createHandover($scope.handoverData).then(function(res) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.data.message, background: '#1e293b', color: '#fff', timer: 2000, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('handoverModal')); if(m) m.hide();
            loadAll();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        });
    };
    $scope.viewReportDetails = function(report) {
        $scope.selectedReportDetail = report; $scope.isEditingReport = false; $scope.reportHistory = [];
        ApiService.getReportHistory(report.id).then(function(r) { $scope.reportHistory = r.data; });
        new bootstrap.Modal(document.getElementById('reportDetailModal')).show();
    };
    $scope.toggleEditReport = function() {
        $scope.isEditingReport = !$scope.isEditingReport;
        if ($scope.isEditingReport) $scope.editReportData = angular.copy($scope.selectedReportDetail);
    };
    $scope.submitEditReport = function() {
        $scope.isSavingEdit = true;
        var p = angular.copy($scope.editReportData);
        p.user_id = $rootScope.user.id;
        p.editor_nama = $rootScope.user.nama_lengkap;
        p.editor_pangkat = $rootScope.user.pangkat;
        p.editor_nrp = $rootScope.user.nrp;
        ApiService.updateReport(p.id, p).then(function() {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Laporan diperbarui.', background: '#1e293b', color: '#fff', timer: 2000, showConfirmButton: false });
            ApiService.getReportHistory(p.id).then(function(r) { $scope.reportHistory = r.data; });
            angular.extend($scope.selectedReportDetail, p);
            $scope.isEditingReport = false;
            loadAll();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        }).finally(function() { $scope.isSavingEdit = false; });
    };
    $scope.deleteReport = function(id) {
        Swal.fire({ title: 'Hapus Laporan?', text: 'Tindakan ini tidak dapat dibatalkan!', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(result) {
            if (result.isConfirmed) {
                ApiService.deleteReport(id).then(function() {
                    Swal.fire({ icon: 'success', title: 'Terhapus', background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
                    loadAll();
                }).catch(function(err) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
                });
            }
        });
    };
    $scope.openPhoto = function(fotoStr) {
        if (!fotoStr) return;
        try { $scope.carouselPhotos = JSON.parse(fotoStr); } catch(e) { $scope.carouselPhotos = [fotoStr]; }
        $scope.activePhotoIndex = 0;
        new bootstrap.Modal(document.getElementById('photoModal')).show();
    };
    $scope.nextPhoto = function() { if ($scope.activePhotoIndex < $scope.carouselPhotos.length - 1) $scope.activePhotoIndex++; };
    $scope.prevPhoto = function() { if ($scope.activePhotoIndex > 0) $scope.activePhotoIndex--; };
}]);

// ============================================================
// File Model Directive
// ============================================================
app.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            element.bind('change', function() {
                scope.$apply(function() {
                    var files = Array.from(element[0].files);
                    if (files.length > 5) { files = files.slice(0, 5); Swal.fire({ icon: 'warning', title: 'Maks 5 Foto', background: '#1e293b', color: '#fff' }); }
                    model.assign(scope, files);
                    scope.fotoPreviews = [];
                    files.forEach(function(file) {
                        if (file.type.startsWith('image/')) {
                            var reader = new FileReader();
                            reader.onload = function(e) { scope.$apply(function() { scope.fotoPreviews.push(e.target.result); }); };
                            reader.readAsDataURL(file);
                        }
                    });
                });
            });
        }
    };
}]);

// ============================================================
// Report Form Controller
// ============================================================
app.controller('ReportFormCtrl', ['$scope', 'ApiService', '$location', '$rootScope',
function($scope, ApiService, $location, $rootScope) {
    $scope.report = { judul: '', lokasi: '', zona: '', shift: '', deskripsi: '', kategori_gakkum: '', pasal_pelanggaran: '', tindakan: '' };
    $scope.fotos = []; $scope.fotoPreviews = []; $scope.isSubmitting = false;

    // Auto-set zona from user's subnit
    if ($rootScope.user.subnit_kode) {
        var kode = $rootScope.user.subnit_kode;
        if (kode === 'BARAT') $scope.report.zona = 'Barat';
        else if (kode === 'TENGAH') $scope.report.zona = 'Tengah';
        else if (kode === 'TIMUR') $scope.report.zona = 'Timur';
    }

    // Auto-detect shift
    var hour = new Date().getHours();
    if (hour >= 6 && hour < 14) $scope.report.shift = 'Pagi';
    else if (hour >= 14 && hour < 22) $scope.report.shift = 'Sore';
    else $scope.report.shift = 'Malam';

    setTimeout(function() {
        flatpickr('#waktuKejadian', { enableTime: true, dateFormat: 'Y-m-d H:i:S', time_24hr: true, defaultDate: new Date() });
    }, 150);

    $scope.removePhoto = function(index) {
        $scope.fotoPreviews.splice(index, 1); $scope.fotos.splice(index, 1);
        document.getElementById('inputFoto').value = '';
    };
    $scope.submitReport = function() {
        $scope.isSubmitting = true;
        var fd = new FormData();
        fd.append('judul', $scope.report.judul); fd.append('lokasi', $scope.report.lokasi);
        fd.append('zona', $scope.report.zona); fd.append('shift', $scope.report.shift);
        fd.append('waktu_kejadian', document.getElementById('waktuKejadian').value);
        fd.append('deskripsi', $scope.report.deskripsi); fd.append('pelapor_id', $rootScope.user.id);
        fd.append('kategori_gakkum', $scope.report.kategori_gakkum || 'lainnya');
        fd.append('tindakan', $scope.report.tindakan || '');
        fd.append('pasal_pelanggaran', $scope.report.pasal_pelanggaran || '');
        if ($scope.fotos && $scope.fotos.length > 0) $scope.fotos.forEach(function(f) { fd.append('foto', f); });
        ApiService.createReport(fd).then(function() {
            Swal.fire({ icon: 'success', title: 'Tersimpan!', background: '#1e293b', color: '#fff', timer: 2000, showConfirmButton: false });
            $location.path('/dashboard');
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        }).finally(function() { $scope.isSubmitting = false; });
    };
}]);

// ============================================================
// Handover Controller
// ============================================================
app.controller('HandoverCtrl', ['$scope', 'ApiService', '$rootScope',
function($scope, ApiService, $rootScope) {
    $scope.handovers = []; $scope.currentPage = 1; $scope.pageSize = 10;
    function load() { ApiService.getHandoversPenerima($rootScope.user.id).then(function(r) { $scope.handovers = r.data; }); }
    load();
    $scope.updateStatus = function(h, status) {
        Swal.fire({ title: 'Konfirmasi', text: 'Apakah yakin ' + (status === 'diterima' ? 'menerima' : 'menolak') + ' pelimpahan?', icon: 'warning',
            showCancelButton: true, confirmButtonColor: status === 'diterima' ? '#3b82f6' : '#ef4444', cancelButtonColor: '#64748b',
            confirmButtonText: status === 'diterima' ? 'Terima' : 'Tolak', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(result) {
            if (result.isConfirmed) {
                ApiService.updateHandoverStatus(h.id, { status_terima: status, report_id: h.report_id }).then(function(r) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: r.data.message, background: '#1e293b', color: '#fff', timer: 2000, showConfirmButton: false });
                    load();
                });
            }
        });
    };
}]);

// ============================================================
// Schedule Controller
// ============================================================
app.controller('ScheduleCtrl', ['$scope', 'ApiService', '$rootScope',
function($scope, ApiService, $rootScope) {
    var now = new Date();
    $scope.selectedMonth = now.getMonth() + 1;
    $scope.selectedYear = now.getFullYear();
    $scope.monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    $scope.dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    $scope.calendarDays = [];
    $scope.schedules = [];
    $scope.holidays = [];
    $scope.selectedDateSchedules = [];
    $scope.selectedDateStr = '';
    $scope.allPersonel = [];
    $scope.subnitList = [];
    $scope.schedForm = { tipe: 'reguler' };

    function loadData() {
        ApiService.getSchedules({ bulan: $scope.selectedMonth, tahun: $scope.selectedYear }).then(function(r) {
            $scope.schedules = r.data;
            buildCalendar();
        });
        ApiService.getHolidays({ tahun: $scope.selectedYear }).then(function(r) {
            $scope.holidays = r.data;
            buildCalendar();
        });
        ApiService.getUsers().then(function(r) { $scope.allPersonel = r.data; });
        ApiService.getSubnit().then(function(r) { $scope.subnitList = r.data; });
    }

    function buildCalendar() {
        var firstDay = new Date($scope.selectedYear, $scope.selectedMonth - 1, 1);
        var lastDay = new Date($scope.selectedYear, $scope.selectedMonth, 0);
        var startDow = firstDay.getDay();
        var days = [];
        var today = new Date(); today.setHours(0,0,0,0);

        var holidayMap = {};
        ($scope.holidays || []).forEach(function(h) {
            var d = new Date(h.tanggal); 
            var key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            holidayMap[key] = h.nama;
        });

        var schedMap = {};
        ($scope.schedules || []).forEach(function(s) {
            var d = new Date(s.tanggal);
            var key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            schedMap[key] = (schedMap[key] || 0) + 1;
        });

        for (var i = 0; i < startDow; i++) days.push({ date: null });
        for (var d = 1; d <= lastDay.getDate(); d++) {
            var date = new Date($scope.selectedYear, $scope.selectedMonth - 1, d);
            var key = $scope.selectedYear + '-' + String($scope.selectedMonth).padStart(2,'0') + '-' + String(d).padStart(2,'0');
            days.push({
                date: date, day: d, isToday: date.getTime() === today.getTime(),
                isWeekend: date.getDay() === 0 || date.getDay() === 6,
                isHoliday: !!holidayMap[key], holidayName: holidayMap[key] || null,
                scheduleCount: schedMap[key] || 0, dateStr: key
            });
        }
        $scope.calendarDays = days;
    }

    $scope.selectDate = function(day) {
        $scope.selectedDateStr = day.dateStr;
        $scope.selectedDateSchedules = $scope.schedules.filter(function(s) {
            var d = new Date(s.tanggal);
            var key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
            return key === day.dateStr;
        });
    };

    $scope.prevMonth = function() {
        $scope.selectedMonth--;
        if ($scope.selectedMonth < 1) { $scope.selectedMonth = 12; $scope.selectedYear--; }
        $scope.selectedDateStr = ''; $scope.selectedDateSchedules = [];
        loadData();
    };
    $scope.nextMonth = function() {
        $scope.selectedMonth++;
        if ($scope.selectedMonth > 12) { $scope.selectedMonth = 1; $scope.selectedYear++; }
        $scope.selectedDateStr = ''; $scope.selectedDateSchedules = [];
        loadData();
    };

    $scope.openAddSchedule = function() {
        $scope.schedForm = { tipe: 'reguler' };
        new bootstrap.Modal(document.getElementById('addScheduleModal')).show();
    };
    $scope.saveSchedule = function() {
        ApiService.createSchedule($scope.schedForm).then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('addScheduleModal')); if(m) m.hide();
            loadData();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        });
    };
    $scope.deleteSchedule = function(id) {
        Swal.fire({ title: 'Hapus Jadwal?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
            confirmButtonText: 'Hapus', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(r) { if (r.isConfirmed) { ApiService.deleteSchedule(id).then(function() { loadData(); $scope.selectedDateSchedules = []; }); } });
    };
    $scope.generateSchedule = function() {
        $scope.genForm = {};
        new bootstrap.Modal(document.getElementById('generateModal')).show();
    };
    $scope.submitGenerate = function() {
        $scope.isGenerating = true;
        ApiService.generateSchedule($scope.genForm).then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff' });
            var m = bootstrap.Modal.getInstance(document.getElementById('generateModal')); if(m) m.hide();
            loadData();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        }).finally(function() { $scope.isGenerating = false; });
    };

    loadData();
}]);

// ============================================================
// Siaga Wiken Controller
// ============================================================
app.controller('SiagaWikenCtrl', ['$scope', 'ApiService', '$rootScope',
function($scope, ApiService, $rootScope) {
    $scope.allEvents = []; $scope.activeEvents = []; $scope.isCurrentlySiaga = false; $scope.canCheckin = false;
    $scope.eventForm = { tipe: 'weekend' };

    function load() {
        ApiService.getSiagaWiken().then(function(r) { $scope.allEvents = r.data; });
        ApiService.getActiveSiaga().then(function(r) {
            $scope.activeEvents = r.data;
            $scope.isCurrentlySiaga = r.data.length > 0;
            if (r.data.length > 0) {
                $scope.activeEvent = r.data[0];
                // Check if current user can checkin
                var assigned = false;
                (r.data[0].personel || []).forEach(function(p) {
                    if (p.user_id === $rootScope.user.id && p.status_checkin === 'belum') assigned = true;
                });
                $scope.canCheckin = assigned;
            }
        });
    }
    load();

    $scope.openCreateEvent = function() {
        $scope.eventForm = { tipe: 'weekend' };
        new bootstrap.Modal(document.getElementById('createEventModal')).show();
    };
    $scope.submitEvent = function() {
        ApiService.createSiagaWiken($scope.eventForm).then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('createEventModal')); if(m) m.hide();
            load();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        });
    };
    $scope.checkin = function() {
        if (!$scope.activeEvent) return;
        ApiService.checkinSiaga($scope.activeEvent.id).then(function(r) {
            Swal.fire({ icon: 'success', title: 'Checkin Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff' });
            load();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        });
    };
    $scope.deleteEvent = function(id) {
        Swal.fire({ title: 'Hapus Event?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
            confirmButtonText: 'Hapus', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(r) { if (r.isConfirmed) ApiService.deleteSiagaWiken(id).then(function() { load(); }); });
    };
}]);

// ============================================================
// SOP Controller
// ============================================================
app.controller('SOPCtrl', ['$scope', 'ApiService', '$rootScope', '$sce',
function($scope, ApiService, $rootScope, $sce) {
    $scope.sops = []; $scope.selectedSOP = {}; $scope.sopForm = {}; $scope.isEditingSOP = false;
    $scope.filterKategori = '';

    $scope.loadSOPs = function() {
        var params = {};
        if ($scope.filterKategori) params.kategori = $scope.filterKategori;
        ApiService.getSOPs(params).then(function(r) { $scope.sops = r.data; });
    };
    $scope.loadSOPs();

    $scope.renderSOP = function(content) {
        if (!content) return '';
        // Simple markdown-like rendering
        var html = content.replace(/\\n/g, '\n')
            .replace(/^## (.+)$/gm, '<h5 class="text-primary mt-3 mb-2">$1</h5>')
            .replace(/^### (.+)$/gm, '<h6 class="fw-bold mt-2 mb-1">$1</h6>')
            .replace(/^\d+\. (.+)$/gm, '<div class="sop-step"><span class="sop-step-num"></span>$1</div>')
            .replace(/^   - (.+)$/gm, '<div class="sop-sub-item">• $1</div>')
            .replace(/^- (.+)$/gm, '<div class="sop-sub-item">• $1</div>')
            .replace(/\n/g, '<br>');
        return $sce.trustAsHtml(html);
    };

    $scope.viewSOP = function(sop) {
        $scope.selectedSOP = sop;
        new bootstrap.Modal(document.getElementById('sopViewModal')).show();
    };
    $scope.openCreateSOP = function() {
        $scope.isEditingSOP = false;
        $scope.sopForm = { kategori: 'umum', urutan: 0 };
        new bootstrap.Modal(document.getElementById('sopFormModal')).show();
    };
    $scope.editSOP = function(sop) {
        $scope.isEditingSOP = true;
        $scope.sopForm = angular.copy(sop);
        var m = bootstrap.Modal.getInstance(document.getElementById('sopViewModal')); if(m) m.hide();
        setTimeout(function() { new bootstrap.Modal(document.getElementById('sopFormModal')).show(); }, 300);
    };
    $scope.saveSOP = function() {
        var fd = new FormData();
        fd.append('judul', $scope.sopForm.judul);
        fd.append('kategori', $scope.sopForm.kategori);
        fd.append('konten', $scope.sopForm.konten);
        if ($scope.sopForm.urutan) fd.append('urutan', $scope.sopForm.urutan);
        if ($scope.sopForm.pdfFile) fd.append('pdfFile', $scope.sopForm.pdfFile);
        
        if ($scope.isEditingSOP) {
            if ($scope.sopForm.remove_pdf) {
                fd.append('existing_file_url', ''); // trigger removal
            } else if ($scope.sopForm.file_url && !$scope.sopForm.pdfFile) {
                fd.append('existing_file_url', $scope.sopForm.file_url); // keep existing
            }
        }

        var req = $scope.isEditingSOP ? ApiService.updateSOP($scope.sopForm.id, fd) : ApiService.createSOP(fd);
        req.then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#000000', timer: 1500, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('sopFormModal')); if(m) m.hide();
            $scope.loadSOPs();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#000000' });
        });
    };
}]);

// ============================================================
// Org Chart Controller
// ============================================================
app.controller('OrgChartCtrl', ['$scope', 'ApiService',
function($scope, ApiService) {
    $scope.orgKanit = null; $scope.orgKasubnit = []; $scope.orgBamin = []; $scope.orgSubnits = [];
    $scope.orgLeaders = [];
    $scope.isEditingLeader = false;
    $scope.leaderForm = {};
    $scope.orgUserForm = {};

    // --- Load data ---
    $scope.loadOrgLeaders = function() {
        ApiService.getOrgLeaders().then(function(res) {
            $scope.orgLeaders = res.data;
        }).catch(function(err) { console.error('Error loading org leaders', err); });
    };

    $scope.loadOrgChart = function() {
        ApiService.getOrgChart().then(function(r) {
            var users = r.data;
            $scope.orgKanit = users.find(function(u) { return u.role === 'kanit'; });
            $scope.orgKasubnit = users.filter(function(u) { return u.role === 'kasubnit'; });
            $scope.orgBamin = users.filter(function(u) { return u.role === 'bamin'; });

            var subnits = {};
            users.forEach(function(u) {
                if (u.subnit_kode && (u.role === 'danregu' || u.role === 'anggota')) {
                    if (!subnits[u.subnit_kode]) {
                        subnits[u.subnit_kode] = { nama: u.subnit_nama, kode: u.subnit_kode, regus: {} };
                    }
                    var reguKey = u.regu_kode || 'unassigned';
                    if (!subnits[u.subnit_kode].regus[reguKey]) {
                        subnits[u.subnit_kode].regus[reguKey] = { nama: u.regu_nama || 'Belum Ditugaskan', members: [] };
                    }
                    subnits[u.subnit_kode].regus[reguKey].members.push(u);
                }
            });

            var order = ['TIMUR', 'TENGAH', 'BARAT'];
            $scope.orgSubnits = order.map(function(kode) {
                if (!subnits[kode]) return null;
                var s = subnits[kode];
                s.regus = Object.values(s.regus).sort(function(a,b) { return a.nama.localeCompare(b.nama); });
                s.regus.forEach(function(r) {
                    r.members.sort(function(a,b) { return a.role === 'danregu' ? -1 : 1; });
                });
                return s;
            }).filter(Boolean);
            
            // Helper for template
            $scope.getKasubnit = function(kode) {
                // Determine Kasubnit by code based on typical assignment
                // Image mapping: Timur -> Kasubnit I, Barat -> Kasubnit II, Tengah -> null
                if (kode === 'TIMUR') return $scope.orgKasubnit[0] || null;
                if (kode === 'BARAT') return $scope.orgKasubnit[1] || null;
                return null;
            };
            
            $scope.getSubnit = function(kode) {
                return $scope.orgSubnits.find(function(s) { return s.kode === kode; });
            };
        });
    };

    // Load subnit and regu lists for creation modal
    $scope.subnitList = [];
    $scope.reguList = [];
    ApiService.getSubnit().then(function(r) { $scope.subnitList = r.data; });
    ApiService.getRegu().then(function(r) { $scope.reguList = r.data; });

    // --- Add Member Modal ---
    $scope.memberForm = {};
    $scope.modalTitle = 'Tambah Personel Baru';

    $scope.openAddMemberModal = function(type, kode) {
        var defaultRole = 'anggota';
        var defaultSubnitId = '';
        
        if (type === 'bamin') {
            defaultRole = 'bamin';
            $scope.modalTitle = 'Tambah Anggota BAMIN GAKKUM';
        } else if (type === 'subnit') {
            $scope.modalTitle = 'Tambah Anggota Subnit ' + kode;
            var found = $scope.subnitList.find(function(s) { return s.kode === kode; });
            if (found) defaultSubnitId = String(found.id);
        }

        $scope.memberForm = {
            username: '',
            password: '123',
            nama_lengkap: '',
            pangkat: '',
            nrp: '',
            role: defaultRole,
            subnit_id: defaultSubnitId,
            regu_id: ''
        };

        new bootstrap.Modal(document.getElementById('orgUserCreateModal')).show();
    };

    $scope.saveNewMember = function() {
        if (!$scope.memberForm.username) {
            $scope.memberForm.username = 'usr_' + Date.now();
        }
        ApiService.createUser($scope.memberForm).then(function() {
            var m = bootstrap.Modal.getInstance(document.getElementById('orgUserCreateModal')); if(m) m.hide();
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Anggota baru berhasil ditambahkan.', timer: 1500, showConfirmButton: false });
            $scope.loadOrgChart();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal menambahkan anggota.' });
        });
    };

    // --- Leader CRUD ---
    $scope.openCreateLeader = function() {
        $scope.isEditingLeader = false;
        $scope.leaderForm = { urutan: $scope.orgLeaders.length + 1 };
        new bootstrap.Modal(document.getElementById('leaderFormModal')).show();
    };

    $scope.editLeader = function(l) {
        $scope.isEditingLeader = true;
        $scope.leaderForm = angular.copy(l);
        new bootstrap.Modal(document.getElementById('leaderFormModal')).show();
    };

    $scope.saveLeader = function() {
        var req = $scope.isEditingLeader ? ApiService.updateOrgLeader($scope.leaderForm.id, $scope.leaderForm) : ApiService.createOrgLeader($scope.leaderForm);
        req.then(function() {
            var m = bootstrap.Modal.getInstance(document.getElementById('leaderFormModal')); if(m) m.hide();
            Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Data pimpinan berhasil disimpan.', timer: 1500, showConfirmButton: false });
            $scope.loadOrgLeaders();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal menyimpan.' });
        });
    };

    $scope.deleteLeader = function(id) {
        Swal.fire({
            title: 'Hapus pimpinan?', text: 'Tindakan ini tidak bisa dibatalkan!',
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
        }).then(function(result) {
            if (result.isConfirmed) {
                ApiService.deleteOrgLeader(id).then(function() { $scope.loadOrgLeaders(); });
            }
        });
    };

    // --- Personel (User) Edit from Org Chart ---
    $scope.editOrgUser = function(u) {
        $scope.orgUserForm = {
            id: u.id,
            nama_lengkap: u.nama_lengkap,
            pangkat: u.pangkat,
            role: u.role
        };
        new bootstrap.Modal(document.getElementById('orgUserEditModal')).show();
    };

    $scope.saveOrgUser = function() {
        ApiService.updateUser($scope.orgUserForm.id, $scope.orgUserForm).then(function() {
            var m = bootstrap.Modal.getInstance(document.getElementById('orgUserEditModal')); if(m) m.hide();
            Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Data personel berhasil diperbarui.', timer: 1500, showConfirmButton: false });
            $scope.loadOrgChart();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal memperbarui.' });
        });
    };

    // --- Init ---
    $scope.loadOrgLeaders();
    $scope.loadOrgChart();
}]);

// ============================================================
// Holiday Controller
// ============================================================
app.controller('HolidayCtrl', ['$scope', 'ApiService',
function($scope, ApiService) {
    $scope.holidays = []; $scope.filterYear = new Date().getFullYear();
    $scope.holidayStats = { total: 0, libur_nasional: 0, cuti_bersama: 0 };
    $scope.holidaysByMonth = [];
    $scope.holidayForm = { jenis: 'libur_nasional' };
    var monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    $scope.loadHolidays = function() {
        ApiService.getHolidays({ tahun: $scope.filterYear }).then(function(r) {
            $scope.holidays = r.data;
            $scope.holidayStats.total = r.data.length;
            $scope.holidayStats.libur_nasional = r.data.filter(function(h) { return h.jenis === 'libur_nasional'; }).length;
            $scope.holidayStats.cuti_bersama = r.data.filter(function(h) { return h.jenis === 'cuti_bersama'; }).length;

            // Group by month
            var byMonth = {};
            r.data.forEach(function(h) {
                var m = new Date(h.tanggal).getMonth();
                if (!byMonth[m]) byMonth[m] = { name: monthNames[m], holidays: [] };
                byMonth[m].holidays.push(h);
            });
            $scope.holidaysByMonth = Object.values(byMonth).sort(function(a,b) {
                return monthNames.indexOf(a.name) - monthNames.indexOf(b.name);
            });
        });
    };
    $scope.loadHolidays();

    $scope.getDayName = function(tanggal) {
        var days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        return days[new Date(tanggal).getDay()];
    };
    $scope.openAddHoliday = function() {
        $scope.holidayForm = { jenis: 'libur_nasional' };
        new bootstrap.Modal(document.getElementById('addHolidayModal')).show();
    };
    $scope.saveHoliday = function() {
        ApiService.createHoliday($scope.holidayForm).then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('addHolidayModal')); if(m) m.hide();
            $scope.loadHolidays();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        });
    };
    $scope.deleteHoliday = function(id) {
        Swal.fire({ title: 'Hapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
            confirmButtonText: 'Hapus', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(r) { if (r.isConfirmed) ApiService.deleteHoliday(id).then(function() { $scope.loadHolidays(); }); });
    };
}]);

// ============================================================
// User Management Controller
// ============================================================
app.controller('UserManagementCtrl', ['$scope', 'ApiService', '$rootScope', '$location',
function($scope, ApiService, $rootScope, $location) {
    if ($rootScope.user.role !== 'admin' && $rootScope.user.role !== 'kanit') {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', background: '#1e293b', color: '#fff' });
        $location.path('/dashboard'); return;
    }
    $scope.allUsers = []; $scope.userStats = { total: 0, admin: 0, kanit: 0, kasubnit: 0, danregu: 0, anggota: 0 };
    $scope.searchQuery = ''; $scope.currentUser = $rootScope.user;
    $scope.currentPage = 1; $scope.pageSize = 10;
    $scope.formData = {}; $scope.isEditing = false; $scope.isSaving = false;
    $scope.subnitList = []; $scope.reguList = [];

    function loadUsers() {
        ApiService.getAllUsers().then(function(r) {
            $scope.allUsers = r.data;
            $scope.userStats.total = r.data.length;
            ['admin','kanit','kasubnit','bamin','danregu','anggota'].forEach(function(role) {
                $scope.userStats[role] = r.data.filter(function(u) { return u.role === role; }).length;
            });
        });
    }
    loadUsers();
    ApiService.getSubnit().then(function(r) { $scope.subnitList = r.data; });
    ApiService.getRegu().then(function(r) { $scope.reguList = r.data; });

    $scope.openCreateModal = function() {
        $scope.isEditing = false;
        $scope.formData = { username: '', password: '', role: '', nama_lengkap: '' };
        new bootstrap.Modal(document.getElementById('userModal')).show();
    };
    $scope.openEditModal = function(user) {
        $scope.isEditing = true;
        $scope.formData = { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap,
            pangkat: user.pangkat, nrp: user.nrp, no_hp: user.no_hp, subnit_id: user.subnit_id ? String(user.subnit_id) : '',
            regu_id: user.regu_id ? String(user.regu_id) : '', password: '' };
        new bootstrap.Modal(document.getElementById('userModal')).show();
    };
    $scope.saveUser = function() {
        $scope.isSaving = true;
        var req = $scope.isEditing ? ApiService.updateUser($scope.formData.id, $scope.formData) : ApiService.createUser($scope.formData);
        req.then(function(r) {
            Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
            var m = bootstrap.Modal.getInstance(document.getElementById('userModal')); if(m) m.hide();
            loadUsers();
        }).catch(function(err) {
            Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
        }).finally(function() { $scope.isSaving = false; });
    };
    $scope.deleteUser = function(user) {
        if (user.id === $scope.currentUser.id) return;
        Swal.fire({ title: 'Hapus Akun', html: 'Hapus <strong>' + user.username + '</strong>?', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Hapus', cancelButtonText: 'Batal', background: '#1e293b', color: '#fff'
        }).then(function(r) {
            if (r.isConfirmed) ApiService.deleteUser(user.id).then(function(r) {
                Swal.fire({ icon: 'success', title: 'Berhasil!', text: r.data.message, background: '#1e293b', color: '#fff', timer: 1500, showConfirmButton: false });
                loadUsers();
            }).catch(function(err) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: (err.data && err.data.message) || 'Gagal.', background: '#1e293b', color: '#fff' });
            });
        });
    };

    $scope.getFilteredRegu = function() {
        if (!$scope.formData.subnit_id) return $scope.reguList;
        return $scope.reguList.filter(function(r) { return r.subnit_id === parseInt($scope.formData.subnit_id); });
    };
}]);

// ============================================================
// Swipe Navigation
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    var touchStartX = 0, touchEndX = 0;
    function handleSwipe() {
        var sidebar = document.getElementById('sidebarNav');
        if (!sidebar) return;
        var bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebar) || new bootstrap.Offcanvas(sidebar);
        if (touchEndX - touchStartX > 75 && touchStartX < 50) bsOffcanvas.show();
        if (touchStartX - touchEndX > 75 && sidebar.classList.contains('show')) bsOffcanvas.hide();
    }
    document.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, false);
    document.addEventListener('touchend', function(e) { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, false);
});
