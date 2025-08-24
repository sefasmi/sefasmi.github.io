// DoctorGo Main Application
class DoctorGoApp {
    constructor() {
        this.currentScreen = 'welcome';
        this.userRole = null;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.geolocation = null;
        
        this.init();
    }

    init() {
        console.log('Initializing DoctorGo App...');
        
        // Show loading screen initially
        this.showLoadingScreen();
        
        // Initialize after short delay to show loading
        setTimeout(() => {
            this.hideLoadingScreen();
            this.checkAuthStatus();
            this.setupEventListeners();
            this.requestLocationPermission();
        }, 2000);
        
        // Setup offline detection
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (app) app.style.display = 'none';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (app) app.style.display = 'block';
            }, 300);
        }
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('doctorgo_user');
        const savedRole = localStorage.getItem('doctorgo_role');
        
        if (savedUser && savedRole) {
            this.currentUser = JSON.parse(savedUser);
            this.userRole = savedRole;
            this.showDashboard();
        } else {
            this.showScreen('welcome');
        }
    }

    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`${screenId}-screen`) || 
                           document.getElementById(screenId);
        
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }

        // Show/hide bottom navigation based on screen
        this.toggleBottomNav();
    }

    toggleBottomNav() {
        const bottomNav = document.getElementById('bottom-nav');
        const showNavScreens = ['patient-dashboard', 'doctor-dashboard'];
        
        if (bottomNav) {
            if (showNavScreens.includes(this.currentScreen)) {
                bottomNav.style.display = 'flex';
            } else {
                bottomNav.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        // Form submissions
        this.setupFormListeners();
        
        // Navigation
        this.setupNavigationListeners();
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.saveAppState();
        });
    }

    setupFormListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }
    }

    setupNavigationListeners() {
        // Bottom navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const screen = item.dataset.screen;
                this.handleNavigation(screen);
            });
        });
    }

    handleNavigation(screen) {
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeItem = document.querySelector(`[data-screen="${screen}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Handle different navigation targets
        switch (screen) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'search':
                this.showDoctorSearch();
                break;
            case 'bookings':
                this.showBookings();
                break;
            case 'profile':
                this.showProfile();
                break;
        }
    }

    showDashboard() {
        if (this.userRole === 'patient') {
            this.showScreen('patient-dashboard');
            this.loadPatientDashboard();
        } else if (this.userRole === 'doctor') {
            this.showScreen('doctor-dashboard');
            this.loadDoctorDashboard();
        }
    }

    loadPatientDashboard() {
        if (this.currentUser) {
            const nameElement = document.getElementById('patient-name');
            if (nameElement) {
                nameElement.textContent = `Welcome, ${this.currentUser.name}`;
            }
        }
        
        // Load recent bookings
        this.loadRecentBookings();
    }

    loadDoctorDashboard() {
        if (this.currentUser) {
            const nameElement = document.getElementById('doctor-name');
            if (nameElement) {
                nameElement.textContent = `Dr. ${this.currentUser.name}`;
            }
        }
        
        // Load doctor statistics
        this.loadDoctorStats();
        this.loadPendingRequests();
    }

    handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        this.showToast('Logging in...', 'info');

        // Simulate API call
        setTimeout(() => {
            // Mock successful login
            const mockUser = {
                id: Date.now(),
                name: email.includes('@') ? email.split('@')[0] : email,
                email: email,
                role: this.userRole || 'patient'
            };

            this.currentUser = mockUser;
            this.saveUserData();
            this.showToast('Login successful!', 'success');
            this.showDashboard();
        }, 1500);
    }

    handleSignup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !phone || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Additional validation for doctors
        if (this.userRole === 'doctor') {
            const specialization = document.getElementById('specialization').value;
            const experience = document.getElementById('experience').value;
            const license = document.getElementById('license').files[0];
            const fee = document.getElementById('consultation-fee').value;

            if (!specialization || !experience || !license || !fee) {
                this.showToast('Please complete all doctor fields', 'error');
                return;
            }
        }

        this.showToast('Creating account...', 'info');

        // Simulate API call
        setTimeout(() => {
            const mockUser = {
                id: Date.now(),
                name: name,
                email: email,
                phone: phone,
                role: this.userRole || 'patient'
            };

            if (this.userRole === 'doctor') {
                mockUser.specialization = document.getElementById('specialization').value;
                mockUser.experience = document.getElementById('experience').value;
                mockUser.consultationFee = document.getElementById('consultation-fee').value;
                mockUser.verified = false; // Pending verification
            }

            this.currentUser = mockUser;
            this.saveUserData();
            this.showToast('Account created successfully!', 'success');
            this.showDashboard();
        }, 2000);
    }

    saveUserData() {
        if (this.currentUser && this.userRole) {
            localStorage.setItem('doctorgo_user', JSON.stringify(this.currentUser));
            localStorage.setItem('doctorgo_role', this.userRole);
        }
    }

    saveAppState() {
        const appState = {
            currentScreen: this.currentScreen,
            userRole: this.userRole,
            lastActive: Date.now()
        };
        localStorage.setItem('doctorgo_state', JSON.stringify(appState));
    }

    requestLocationPermission() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.geolocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    console.log('Location permission granted');
                },
                (error) => {
                    console.warn('Location permission denied:', error.message);
                    this.showToast('Location access is needed for better service', 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        }
    }

    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (this.geolocation) {
                resolve(this.geolocation);
                return;
            }

            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const location = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        };
                        this.geolocation = location;
                        resolve(location);
                    },
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }

    loadRecentBookings() {
        // Mock recent bookings data
        const mockBookings = [
            {
                id: 1,
                doctor: 'Dr. Sarah Ahmed',
                specialization: 'General Practitioner',
                date: '2024-01-15',
                status: 'completed',
                rating: 5
            }
        ];

        const bookingsList = document.getElementById('recent-bookings-list');
        if (bookingsList) {
            if (mockBookings.length === 0) {
                bookingsList.innerHTML = '<p class="no-bookings">No recent consultations</p>';
            } else {
                bookingsList.innerHTML = mockBookings.map(booking => `
                    <div class="booking-card">
                        <div class="booking-status status-${booking.status}">${booking.status}</div>
                        <div class="booking-header">
                            <div class="booking-date">${new Date(booking.date).toLocaleDateString()}</div>
                            <div class="booking-doctor">${booking.doctor}</div>
                            <div class="booking-specialization">${booking.specialization}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    loadDoctorStats() {
        // Mock doctor statistics
        const stats = {
            patientsServed: 42,
            rating: 4.8,
            earnings: 2500
        };

        document.getElementById('patients-served').textContent = stats.patientsServed;
        document.getElementById('doctor-rating').textContent = stats.rating.toFixed(1);
        document.getElementById('earnings').textContent = `৳${stats.earnings}`;
    }

    loadPendingRequests() {
        // Mock pending requests
        const mockRequests = [];

        const requestsList = document.getElementById('requests-list');
        if (requestsList) {
            if (mockRequests.length === 0) {
                requestsList.innerHTML = '<p class="no-requests">No pending requests</p>';
            } else {
                requestsList.innerHTML = mockRequests.map(request => `
                    <div class="request-card">
                        <!-- Request content will be rendered here -->
                    </div>
                `).join('');
            }
        }
    }

    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        // Set toast content and type
        toast.textContent = message;
        toast.className = `toast toast-${type} show`;

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        if (isOnline) {
            this.showToast('Connection restored', 'success');
        } else {
            this.showToast('No internet connection', 'error');
        }
    }

    // Additional utility methods
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
    }

    generateStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<i class="fas fa-star ${i <= rating ? 'filled' : ''}"></i>`);
        }
        return stars.join('');
    }
}

// Global functions called from HTML
function selectRole(role) {
    app.userRole = role;
    
    // Update UI to show selected role
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const selectedBtn = document.querySelector(`.${role}-btn`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // Show/hide doctor fields in signup
    const doctorFields = document.getElementById('doctor-fields');
    if (doctorFields) {
        doctorFields.style.display = role === 'doctor' ? 'block' : 'none';
    }
}

function showWelcome() {
    app.showScreen('welcome');
}

function showLogin() {
    app.showScreen('login');
}

function showSignup() {
    app.showScreen('signup');
}

function logout() {
    localStorage.removeItem('doctorgo_user');
    localStorage.removeItem('doctorgo_role');
    localStorage.removeItem('doctorgo_state');
    
    app.currentUser = null;
    app.userRole = null;
    app.showScreen('welcome');
    app.showToast('Logged out successfully', 'info');
}

function loginWithGoogle() {
    app.showToast('Google login not implemented yet', 'info');
}

function signupWithGoogle() {
    app.showToast('Google signup not implemented yet', 'info');
}

function findDoctors() {
    const symptoms = document.getElementById('symptoms').value;
    if (!symptoms.trim()) {
        app.showToast('Please describe your symptoms', 'warning');
        return;
    }
    
    app.showToast('Searching for nearby doctors...', 'info');
    // This would normally navigate to doctor search screen
    // For now, just show a message
    setTimeout(() => {
        app.showToast('Feature coming soon!', 'info');
    }, 1500);
}

function requestEmergency() {
    app.showToast('Emergency services contacted!', 'success');
    // This would normally contact emergency services
}

function toggleAvailability() {
    const toggle = document.getElementById('availability-toggle');
    const status = document.getElementById('online-status');
    
    if (toggle && status) {
        if (toggle.checked) {
            status.classList.remove('offline');
            status.classList.add('online');
            status.innerHTML = '<span class="status-dot"></span><span>Online</span>';
            app.showToast('You are now available for consultations', 'success');
        } else {
            status.classList.remove('online');
            status.classList.add('offline');
            status.innerHTML = '<span class="status-dot"></span><span>Offline</span>';
            app.showToast('You are now offline', 'info');
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DoctorGoApp();
});

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DoctorGoApp;
}