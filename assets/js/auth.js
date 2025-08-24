// DoctorGo Authentication Module
class AuthManager {
    constructor() {
        this.apiBaseUrl = '/api'; // Would be actual API endpoint
        this.tokenKey = 'doctorgo_token';
        this.userKey = 'doctorgo_user';
        this.roleKey = 'doctorgo_role';
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        const user = localStorage.getItem(this.userKey);
        return !!(token && user);
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Get user role
    getUserRole() {
        return localStorage.getItem(this.roleKey);
    }

    // Login with email/phone and password
    async login(credentials) {
        try {
            this.showAuthLoading(true);
            
            // Simulate API call delay
            await this.delay(1500);
            
            // Mock authentication logic
            const mockUser = this.mockAuthenticate(credentials);
            
            if (mockUser) {
                this.setAuthData(mockUser);
                return { success: true, user: mockUser };
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Register new user
    async register(userData) {
        try {
            this.showAuthLoading(true);
            
            // Validate required fields
            const validation = this.validateRegistration(userData);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            
            // Simulate API call delay
            await this.delay(2000);
            
            // Create mock user
            const newUser = this.createMockUser(userData);
            
            // For doctors, mark as pending verification
            if (userData.role === 'doctor') {
                newUser.verified = false;
                newUser.verificationStatus = 'pending';
            }
            
            this.setAuthData(newUser);
            return { success: true, user: newUser };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Login with Google
    async loginWithGoogle() {
        try {
            this.showAuthLoading(true);
            
            // In a real app, this would use Google OAuth
            await this.delay(1000);
            
            // Mock Google user
            const googleUser = {
                id: 'google_' + Date.now(),
                name: 'John Doe',
                email: 'john.doe@gmail.com',
                phone: '+8801712345678',
                role: app.userRole || 'patient',
                avatar: 'https://ui-avatars.io/api/?name=John+Doe',
                provider: 'google',
                verified: true
            };
            
            this.setAuthData(googleUser);
            return { success: true, user: googleUser };
            
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.roleKey);
        
        // Clear any cached data
        this.clearCachedData();
        
        return { success: true };
    }

    // Forgot password
    async forgotPassword(email) {
        try {
            this.showAuthLoading(true);
            
            // Simulate API call
            await this.delay(1500);
            
            // In real app, this would send reset email
            console.log('Password reset email sent to:', email);
            
            return { success: true, message: 'Password reset link sent to your email' };
            
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Reset password
    async resetPassword(token, newPassword) {
        try {
            this.showAuthLoading(true);
            
            // Simulate API call
            await this.delay(1500);
            
            // In real app, this would validate token and update password
            console.log('Password reset successful');
            
            return { success: true, message: 'Password reset successful' };
            
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Verify doctor credentials
    async verifyDoctor(doctorId, verificationData) {
        try {
            this.showAuthLoading(true);
            
            // Simulate API call
            await this.delay(2000);
            
            // Mock verification process
            const user = this.getCurrentUser();
            if (user && user.id === doctorId) {
                user.verified = true;
                user.verificationStatus = 'verified';
                user.verificationDate = new Date().toISOString();
                
                this.setAuthData(user);
            }
            
            return { success: true, message: 'Doctor verification successful' };
            
        } catch (error) {
            console.error('Doctor verification error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Update user profile
    async updateProfile(updates) {
        try {
            this.showAuthLoading(true);
            
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Simulate API call
            await this.delay(1500);
            
            // Update user data
            const updatedUser = { ...user, ...updates };
            this.setAuthData(updatedUser);
            
            return { success: true, user: updatedUser };
            
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
        } finally {
            this.showAuthLoading(false);
        }
    }

    // Private helper methods
    mockAuthenticate(credentials) {
        const { email, password } = credentials;
        
        // Mock user database
        const mockUsers = [
            {
                id: 1,
                name: 'John Patient',
                email: 'patient@example.com',
                phone: '+8801712345678',
                role: 'patient',
                password: 'password123'
            },
            {
                id: 2,
                name: 'Dr. Sarah Ahmed',
                email: 'doctor@example.com',
                phone: '+8801798765432',
                role: 'doctor',
                password: 'doctor123',
                specialization: 'General Practitioner',
                experience: 8,
                consultationFee: 800,
                verified: true
            }
        ];
        
        // Find user by email or phone
        const user = mockUsers.find(u => 
            (u.email === email || u.phone === email) && u.password === password
        );
        
        if (user) {
            // Remove password from returned user object
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        
        return null;
    }

    createMockUser(userData) {
        return {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            avatar: `https://ui-avatars.io/api/?name=${encodeURIComponent(userData.name)}`,
            createdAt: new Date().toISOString(),
            verified: userData.role === 'patient', // Patients are auto-verified
            ...(userData.role === 'doctor' && {
                specialization: userData.specialization,
                experience: parseInt(userData.experience),
                consultationFee: parseInt(userData.consultationFee),
                verificationStatus: 'pending'
            })
        };
    }

    validateRegistration(userData) {
        const { name, email, phone, password, role } = userData;
        
        // Basic validation
        if (!name || name.length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters' };
        }
        
        if (!email || !this.isValidEmail(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        
        if (!phone || !this.isValidPhone(phone)) {
            return { valid: false, message: 'Please enter a valid phone number' };
        }
        
        if (!password || password.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' };
        }
        
        if (!role || !['patient', 'doctor'].includes(role)) {
            return { valid: false, message: 'Please select a valid role' };
        }
        
        // Doctor-specific validation
        if (role === 'doctor') {
            const { specialization, experience, consultationFee } = userData;
            
            if (!specialization) {
                return { valid: false, message: 'Please select your specialization' };
            }
            
            if (!experience || experience < 0 || experience > 50) {
                return { valid: false, message: 'Please enter valid years of experience' };
            }
            
            if (!consultationFee || consultationFee < 100) {
                return { valid: false, message: 'Consultation fee must be at least 100 BDT' };
            }
        }
        
        return { valid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // Bangladesh phone number validation
        const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    setAuthData(user) {
        const token = this.generateMockToken(user);
        
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        localStorage.setItem(this.roleKey, user.role);
    }

    generateMockToken(user) {
        // In real app, this would be a JWT token from server
        return btoa(JSON.stringify({
            userId: user.id,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
    }

    clearCachedData() {
        // Clear any app-specific cached data
        const keysToRemove = [
            'doctorgo_recent_searches',
            'doctorgo_bookings_cache',
            'doctorgo_doctors_cache'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    showAuthLoading(show) {
        // Show/hide loading indicator on auth buttons
        const authButtons = document.querySelectorAll('.btn[type="submit"], .btn-google');
        
        authButtons.forEach(button => {
            if (show) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            } else {
                button.disabled = false;
                // Restore original text based on button type
                if (button.classList.contains('btn-google')) {
                    if (button.textContent.includes('Continue')) {
                        button.innerHTML = '<i class="fab fa-google"></i> Continue with Google';
                    }
                } else {
                    const isLogin = button.closest('#login-form');
                    button.textContent = isLogin ? 'Login' : 'Create Account';
                }
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Enhanced auth form handlers
function enhanceAuthForms() {
    const authManager = new AuthManager();
    
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const credentials = {
                email: document.getElementById('login-email').value.trim(),
                password: document.getElementById('login-password').value
            };
            
            const result = await authManager.login(credentials);
            
            if (result.success) {
                app.currentUser = result.user;
                app.userRole = result.user.role;
                app.showToast('Login successful!', 'success');
                app.showDashboard();
            } else {
                app.showToast(result.error, 'error');
            }
        });
    }
    
    // Signup form handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                name: document.getElementById('signup-name').value.trim(),
                email: document.getElementById('signup-email').value.trim(),
                phone: document.getElementById('signup-phone').value.trim(),
                password: document.getElementById('signup-password').value,
                role: app.userRole || 'patient'
            };
            
            // Add doctor-specific fields
            if (userData.role === 'doctor') {
                userData.specialization = document.getElementById('specialization').value;
                userData.experience = document.getElementById('experience').value;
                userData.consultationFee = document.getElementById('consultation-fee').value;
                
                const licenseFile = document.getElementById('license').files[0];
                if (licenseFile) {
                    userData.licenseFileName = licenseFile.name;
                    userData.licenseFileSize = licenseFile.size;
                }
            }
            
            const result = await authManager.register(userData);
            
            if (result.success) {
                app.currentUser = result.user;
                app.userRole = result.user.role;
                
                if (result.user.role === 'doctor' && !result.user.verified) {
                    app.showToast('Account created! Verification pending.', 'info');
                } else {
                    app.showToast('Account created successfully!', 'success');
                }
                
                app.showDashboard();
            } else {
                app.showToast(result.error, 'error');
            }
        });
    }
}

// Enhanced Google auth handlers
async function enhancedGoogleLogin() {
    const authManager = new AuthManager();
    const result = await authManager.loginWithGoogle();
    
    if (result.success) {
        app.currentUser = result.user;
        app.userRole = result.user.role;
        app.showToast('Google login successful!', 'success');
        app.showDashboard();
    } else {
        app.showToast(result.error || 'Google login failed', 'error');
    }
}

async function enhancedGoogleSignup() {
    const authManager = new AuthManager();
    const result = await authManager.loginWithGoogle();
    
    if (result.success) {
        app.currentUser = result.user;
        app.userRole = result.user.role;
        app.showToast('Google signup successful!', 'success');
        app.showDashboard();
    } else {
        app.showToast(result.error || 'Google signup failed', 'error');
    }
}

// Initialize enhanced auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    enhanceAuthForms();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}