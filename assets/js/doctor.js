// DoctorGo Doctor Module
class DoctorManager {
    constructor() {
        this.isAvailable = false;
        this.currentLocation = null;
        this.pendingRequests = [];
        this.activeConsultations = [];
        this.consultationHistory = [];
        this.earnings = {
            today: 0,
            week: 0,
            month: 0,
            total: 0
        };
        this.stats = {
            patientsServed: 0,
            rating: 0,
            reviews: []
        };
    }

    // Initialize doctor features
    init() {
        this.loadDoctorData();
        this.setupDoctorEventListeners();
        this.startLocationTracking();
    }

    // Load doctor-specific data
    loadDoctorData() {
        this.loadConsultationHistory();
        this.loadEarnings();
        this.loadStats();
        this.loadAvailabilityStatus();
    }

    // Setup event listeners for doctor features
    setupDoctorEventListeners() {
        // Availability toggle
        const availabilityToggle = document.getElementById('availability-toggle');
        if (availabilityToggle) {
            availabilityToggle.addEventListener('change', (e) => {
                this.toggleAvailability(e.target.checked);
            });
        }

        // Listen for consultation requests
        this.startListeningForRequests();
    }

    // Toggle doctor availability
    toggleAvailability(isAvailable) {
        this.isAvailable = isAvailable;
        this.saveAvailabilityStatus();
        
        const statusIndicator = document.getElementById('online-status');
        if (statusIndicator) {
            if (isAvailable) {
                statusIndicator.classList.remove('offline');
                statusIndicator.classList.add('online');
                statusIndicator.innerHTML = '<span class="status-dot"></span><span>Online</span>';
                app.showToast('You are now available for consultations', 'success');
                this.startAcceptingRequests();
            } else {
                statusIndicator.classList.remove('online');
                statusIndicator.classList.add('offline');
                statusIndicator.innerHTML = '<span class="status-dot"></span><span>Offline</span>';
                app.showToast('You are now offline', 'info');
                this.stopAcceptingRequests();
            }
        }
        
        // Update location tracking
        if (isAvailable) {
            this.startLocationTracking();
        } else {
            this.stopLocationTracking();
        }
    }

    // Start accepting consultation requests
    startAcceptingRequests() {
        if (!this.isAvailable) return;
        
        // Simulate incoming requests
        this.requestSimulator = setInterval(() => {
            if (this.isAvailable && Math.random() > 0.7) { // 30% chance every 30 seconds
                this.generateMockRequest();
            }
        }, 30000);
    }

    // Stop accepting requests
    stopAcceptingRequests() {
        if (this.requestSimulator) {
            clearInterval(this.requestSimulator);
            this.requestSimulator = null;
        }
    }

    // Generate mock consultation request
    generateMockRequest() {
        const mockPatients = [
            'Ahmed Hassan', 'Fatima Khan', 'Mohammad Ali', 'Rashida Begum',
            'Karim Rahman', 'Nasreen Sultana', 'Jahangir Alam', 'Sarah Ahmed'
        ];
        
        const mockSymptoms = [
            'Fever and headache since yesterday',
            'Persistent cough and chest pain',
            'Stomach pain and nausea',
            'Back pain and muscle stiffness',
            'Skin rash and itching',
            'Dizziness and fatigue',
            'Joint pain and swelling',
            'Breathing difficulty'
        ];
        
        const mockLocations = [
            'Dhanmondi, Dhaka', 'Gulshan, Dhaka', 'Banani, Dhaka',
            'Uttara, Dhaka', 'Mirpur, Dhaka', 'Mohammadpur, Dhaka'
        ];
        
        const request = {
            id: Date.now(),
            patientName: mockPatients[Math.floor(Math.random() * mockPatients.length)],
            symptoms: mockSymptoms[Math.floor(Math.random() * mockSymptoms.length)],
            location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
            distance: (Math.random() * 5 + 0.5).toFixed(1), // 0.5-5.5 km
            estimatedFee: app.currentUser?.consultationFee || 800,
            urgency: Math.random() > 0.8 ? 'high' : 'normal',
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        this.pendingRequests.push(request);
        this.updateRequestsDisplay();
        this.showRequestNotification(request);
    }

    // Show request notification
    showRequestNotification(request) {
        app.showToast(`New request from ${request.patientName}`, 'info');
        
        // Play notification sound (in real app)
        this.playNotificationSound();
        
        // Auto-remove request after 5 minutes if not responded
        setTimeout(() => {
            this.autoRejectRequest(request.id);
        }, 300000); // 5 minutes
    }

    // Update requests display
    updateRequestsDisplay() {
        const requestsList = document.getElementById('requests-list');
        if (!requestsList) return;
        
        if (this.pendingRequests.length === 0) {
            requestsList.innerHTML = '<p class="no-requests">No pending requests</p>';
            return;
        }
        
        requestsList.innerHTML = this.pendingRequests.map(request => 
            this.createRequestCard(request)
        ).join('');
    }

    // Create request card HTML
    createRequestCard(request) {
        return `
            <div class="request-card ${request.urgency === 'high' ? 'urgent' : ''}" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="patient-info">
                        <h4>${request.patientName}</h4>
                        <div class="patient-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${request.location} (${request.distance} km)
                        </div>
                    </div>
                    <div class="request-time">
                        ${this.formatRequestTime(request.createdAt)}
                        ${request.urgency === 'high' ? '<span class="urgent-badge">URGENT</span>' : ''}
                    </div>
                </div>
                
                <div class="symptoms-section">
                    <div class="symptoms-label">Reported Symptoms:</div>
                    <div class="symptoms-text">${request.symptoms}</div>
                </div>
                
                <div class="request-details">
                    <div class="estimated-fee">Fee: ৳${request.estimatedFee}</div>
                    <div class="distance">Distance: ${request.distance} km</div>
                </div>
                
                <div class="request-actions">
                    <button class="btn btn-accept" onclick="doctorManager.acceptRequest(${request.id})">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-reject" onclick="doctorManager.rejectRequest(${request.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        `;
    }

    // Accept consultation request
    async acceptRequest(requestId) {
        try {
            const request = this.pendingRequests.find(r => r.id === requestId);
            if (!request) {
                app.showToast('Request not found', 'error');
                return;
            }
            
            app.showToast('Accepting request...', 'info');
            
            // Simulate API call
            await this.delay(1500);
            
            // Move request to active consultations
            request.status = 'accepted';
            request.acceptedAt = new Date().toISOString();
            
            this.activeConsultations.push(request);
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
            
            // Update displays
            this.updateRequestsDisplay();
            this.updateActiveConsultationsDisplay();
            
            app.showToast(`Request from ${request.patientName} accepted!`, 'success');
            
            // Show navigation screen
            this.showNavigationScreen(request);
            
        } catch (error) {
            console.error('Error accepting request:', error);
            app.showToast('Failed to accept request', 'error');
        }
    }

    // Reject consultation request
    async rejectRequest(requestId) {
        try {
            const request = this.pendingRequests.find(r => r.id === requestId);
            if (!request) {
                app.showToast('Request not found', 'error');
                return;
            }
            
            app.showToast('Rejecting request...', 'info');
            
            // Simulate API call
            await this.delay(1000);
            
            // Remove request
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
            
            // Update display
            this.updateRequestsDisplay();
            
            app.showToast(`Request from ${request.patientName} rejected`, 'info');
            
        } catch (error) {
            console.error('Error rejecting request:', error);
            app.showToast('Failed to reject request', 'error');
        }
    }

    // Auto-reject request after timeout
    autoRejectRequest(requestId) {
        const request = this.pendingRequests.find(r => r.id === requestId);
        if (request && request.status === 'pending') {
            this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
            this.updateRequestsDisplay();
            app.showToast(`Request from ${request.patientName} expired`, 'warning');
        }
    }

    // Show navigation screen
    showNavigationScreen(consultation) {
        const screen = this.createNavigationScreen(consultation);
        const appContainer = document.getElementById('app');
        
        const existingNav = document.getElementById('navigation-screen');
        if (existingNav) {
            existingNav.remove();
        }
        
        appContainer.appendChild(screen);
        app.showScreen('navigation');
    }

    // Create navigation screen
    createNavigationScreen(consultation) {
        const screen = document.createElement('div');
        screen.id = 'navigation-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="navigation-container">
                <div class="navigation-header">
                    <h2>Navigate to Patient</h2>
                    <div class="consultation-status">Active</div>
                </div>
                
                <div class="patient-summary">
                    <div class="patient-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="patient-info">
                        <h3>${consultation.patientName}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${consultation.location}</p>
                        <p><i class="fas fa-route"></i> ${consultation.distance} km away</p>
                    </div>
                </div>
                
                <div class="map-container navigation-map">
                    <div class="map-placeholder">
                        <i class="fas fa-route"></i>
                        <p>Navigation map would show here</p>
                        <small>Turn-by-turn directions to patient location</small>
                    </div>
                </div>
                
                <div class="navigation-actions">
                    <button class="btn btn-primary" onclick="doctorManager.openMapsApp('${consultation.location}')">
                        <i class="fas fa-external-link-alt"></i>
                        Open in Maps
                    </button>
                    <button class="btn btn-secondary" onclick="doctorManager.callPatient('${consultation.patientName}')">
                        <i class="fas fa-phone"></i>
                        Call Patient
                    </button>
                </div>
                
                <div class="arrival-section">
                    <button class="btn btn-success full-width" onclick="doctorManager.markArrived(${consultation.id})">
                        <i class="fas fa-check-circle"></i>
                        I Have Arrived
                    </button>
                </div>
                
                <div class="emergency-actions">
                    <button class="btn btn-emergency" onclick="doctorManager.reportEmergency(${consultation.id})">
                        <i class="fas fa-exclamation-triangle"></i>
                        Report Emergency
                    </button>
                </div>
            </div>
        `;
        
        return screen;
    }

    // Mark arrival at patient location
    async markArrived(consultationId) {
        try {
            const consultation = this.activeConsultations.find(c => c.id === consultationId);
            if (!consultation) {
                app.showToast('Consultation not found', 'error');
                return;
            }
            
            app.showToast('Marking arrival...', 'info');
            
            // Simulate API call
            await this.delay(1000);
            
            consultation.status = 'arrived';
            consultation.arrivedAt = new Date().toISOString();
            
            app.showToast('Arrival confirmed!', 'success');
            
            // Show consultation screen
            this.showConsultationScreen(consultation);
            
        } catch (error) {
            console.error('Error marking arrival:', error);
            app.showToast('Failed to mark arrival', 'error');
        }
    }

    // Show consultation screen
    showConsultationScreen(consultation) {
        const screen = this.createConsultationScreen(consultation);
        const appContainer = document.getElementById('app');
        
        const existingConsult = document.getElementById('consultation-screen');
        if (existingConsult) {
            existingConsult.remove();
        }
        
        appContainer.appendChild(screen);
        app.showScreen('consultation');
    }

    // Create consultation screen
    createConsultationScreen(consultation) {
        const screen = document.createElement('div');
        screen.id = 'consultation-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="consultation-container">
                <div class="consultation-header">
                    <h2>Active Consultation</h2>
                    <div class="consultation-timer" id="consultation-timer">00:00</div>
                </div>
                
                <div class="patient-summary">
                    <div class="patient-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="patient-info">
                        <h3>${consultation.patientName}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${consultation.location}</p>
                        <p><i class="fas fa-stethoscope"></i> ${consultation.symptoms}</p>
                    </div>
                </div>
                
                <div class="consultation-notes">
                    <h4>Consultation Notes</h4>
                    <textarea id="consultation-notes" placeholder="Enter your notes, diagnosis, and treatment recommendations..." rows="6"></textarea>
                </div>
                
                <div class="prescription-section">
                    <h4>Prescription</h4>
                    <textarea id="prescription" placeholder="Enter prescription details..." rows="4"></textarea>
                </div>
                
                <div class="consultation-actions">
                    <button class="btn btn-success" onclick="doctorManager.completeConsultation(${consultation.id})">
                        <i class="fas fa-check"></i>
                        Complete Consultation
                    </button>
                    <button class="btn btn-warning" onclick="doctorManager.referPatient(${consultation.id})">
                        <i class="fas fa-share"></i>
                        Refer to Specialist
                    </button>
                </div>
                
                <div class="emergency-actions">
                    <button class="btn btn-emergency" onclick="doctorManager.requestAmbulance(${consultation.id})">
                        <i class="fas fa-ambulance"></i>
                        Request Ambulance
                    </button>
                </div>
            </div>
        `;
        
        // Start consultation timer
        this.startConsultationTimer(consultation);
        
        return screen;
    }

    // Start consultation timer
    startConsultationTimer(consultation) {
        const startTime = new Date(consultation.arrivedAt).getTime();
        const timerElement = document.getElementById('consultation-timer');
        
        this.consultationTimer = setInterval(() => {
            const now = new Date().getTime();
            const elapsed = now - startTime;
            
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            if (timerElement) {
                timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // Complete consultation
    async completeConsultation(consultationId) {
        try {
            const consultation = this.activeConsultations.find(c => c.id === consultationId);
            if (!consultation) {
                app.showToast('Consultation not found', 'error');
                return;
            }
            
            const notes = document.getElementById('consultation-notes')?.value;
            const prescription = document.getElementById('prescription')?.value;
            
            if (!notes || notes.trim().length < 10) {
                app.showToast('Please enter consultation notes (minimum 10 characters)', 'warning');
                return;
            }
            
            app.showToast('Completing consultation...', 'info');
            
            // Simulate API call
            await this.delay(2000);
            
            // Update consultation
            consultation.status = 'completed';
            consultation.completedAt = new Date().toISOString();
            consultation.notes = notes;
            consultation.prescription = prescription;
            consultation.duration = Date.now() - new Date(consultation.arrivedAt).getTime();
            
            // Move to history
            this.consultationHistory.unshift(consultation);
            this.activeConsultations = this.activeConsultations.filter(c => c.id !== consultationId);
            
            // Update earnings
            this.updateEarnings(consultation.estimatedFee);
            
            // Update stats
            this.updateStats();
            
            // Clear timer
            if (this.consultationTimer) {
                clearInterval(this.consultationTimer);
            }
            
            app.showToast('Consultation completed successfully!', 'success');
            
            // Show payment screen
            this.showPaymentScreen(consultation);
            
        } catch (error) {
            console.error('Error completing consultation:', error);
            app.showToast('Failed to complete consultation', 'error');
        }
    }

    // Show payment screen
    showPaymentScreen(consultation) {
        const screen = this.createPaymentScreen(consultation);
        const appContainer = document.getElementById('app');
        
        const existingPayment = document.getElementById('payment-screen');
        if (existingPayment) {
            existingPayment.remove();
        }
        
        appContainer.appendChild(screen);
        app.showScreen('payment');
    }

    // Create payment screen
    createPaymentScreen(consultation) {
        const screen = document.createElement('div');
        screen.id = 'payment-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="payment-container">
                <div class="payment-header">
                    <h2>Payment</h2>
                    <div class="payment-status">Pending</div>
                </div>
                
                <div class="consultation-summary">
                    <h4>Consultation Summary</h4>
                    <div class="summary-item">
                        <span>Patient:</span>
                        <span>${consultation.patientName}</span>
                    </div>
                    <div class="summary-item">
                        <span>Duration:</span>
                        <span>${this.formatDuration(consultation.duration)}</span>
                    </div>
                    <div class="summary-item">
                        <span>Fee:</span>
                        <span>৳${consultation.estimatedFee}</span>
                    </div>
                </div>
                
                <div class="payment-method-selection">
                    <h4>Payment Method</h4>
                    <div class="payment-methods">
                        <div class="payment-method selected" data-method="cash">
                            <input type="radio" name="payment" value="cash" checked>
                            <div class="payment-icon method-cash">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <span>Cash</span>
                        </div>
                        <div class="payment-method" data-method="mobile">
                            <input type="radio" name="payment" value="mobile">
                            <div class="payment-icon method-mobile">
                                <i class="fas fa-mobile-alt"></i>
                            </div>
                            <span>Mobile Banking</span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-actions">
                    <button class="btn btn-success full-width" onclick="doctorManager.confirmPayment(${consultation.id})">
                        <i class="fas fa-check"></i>
                        Confirm Payment Received
                    </button>
                </div>
                
                <div class="skip-payment">
                    <button class="btn btn-secondary" onclick="doctorManager.skipPayment(${consultation.id})">
                        Skip Payment (Bill Later)
                    </button>
                </div>
            </div>
        `;
        
        return screen;
    }

    // Confirm payment received
    async confirmPayment(consultationId) {
        try {
            const consultation = this.consultationHistory.find(c => c.id === consultationId);
            if (!consultation) {
                app.showToast('Consultation not found', 'error');
                return;
            }
            
            app.showToast('Processing payment...', 'info');
            
            // Simulate API call
            await this.delay(1500);
            
            consultation.paymentStatus = 'received';
            consultation.paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cash';
            consultation.paymentReceivedAt = new Date().toISOString();
            
            app.showToast('Payment confirmed!', 'success');
            
            // Show rating screen
            this.showRatingScreen(consultation);
            
        } catch (error) {
            console.error('Error confirming payment:', error);
            app.showToast('Failed to confirm payment', 'error');
        }
    }

    // Skip payment for later
    skipPayment(consultationId) {
        const consultation = this.consultationHistory.find(c => c.id === consultationId);
        if (consultation) {
            consultation.paymentStatus = 'pending';
            app.showToast('Payment marked as pending', 'info');
        }
        
        app.showDashboard();
    }

    // Show rating screen
    showRatingScreen(consultation) {
        app.showToast('Consultation complete! Awaiting patient feedback.', 'success');
        
        // Simulate receiving patient rating
        setTimeout(() => {
            const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
            this.receivePatientRating(consultation.id, rating);
        }, 3000);
        
        app.showDashboard();
    }

    // Receive patient rating
    receivePatientRating(consultationId, rating) {
        const consultation = this.consultationHistory.find(c => c.id === consultationId);
        if (consultation) {
            consultation.rating = rating;
            consultation.ratedAt = new Date().toISOString();
            
            // Update overall rating
            this.updateOverallRating();
            
            app.showToast(`Patient rated you ${rating} stars!`, 'success');
        }
    }

    // Update earnings
    updateEarnings(amount) {
        this.earnings.today += amount;
        this.earnings.week += amount;
        this.earnings.month += amount;
        this.earnings.total += amount;
        
        this.saveEarnings();
        this.updateEarningsDisplay();
    }

    // Update earnings display
    updateEarningsDisplay() {
        const earningsElement = document.getElementById('earnings');
        if (earningsElement) {
            earningsElement.textContent = `৳${this.earnings.today}`;
        }
    }

    // Update statistics
    updateStats() {
        this.stats.patientsServed = this.consultationHistory.length;
        this.updateOverallRating();
        
        const patientsElement = document.getElementById('patients-served');
        if (patientsElement) {
            patientsElement.textContent = this.stats.patientsServed;
        }
    }

    // Update overall rating
    updateOverallRating() {
        const ratedConsultations = this.consultationHistory.filter(c => c.rating);
        if (ratedConsultations.length > 0) {
            const totalRating = ratedConsultations.reduce((sum, c) => sum + c.rating, 0);
            this.stats.rating = (totalRating / ratedConsultations.length).toFixed(1);
            
            const ratingElement = document.getElementById('doctor-rating');
            if (ratingElement) {
                ratingElement.textContent = this.stats.rating;
            }
        }
    }

    // Open maps app for navigation
    openMapsApp(location) {
        const encodedLocation = encodeURIComponent(location);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        
        // In a real mobile app, this would open the native maps app
        window.open(mapsUrl, '_blank');
        app.showToast('Opening maps application...', 'info');
    }

    // Call patient
    callPatient(patientName) {
        app.showToast(`Calling ${patientName}...`, 'info');
        // In real app, this would initiate a phone call
    }

    // Report emergency
    reportEmergency(consultationId) {
        app.showToast('Emergency services contacted!', 'error');
        // In real app, this would contact emergency services
    }

    // Request ambulance
    requestAmbulance(consultationId) {
        app.showToast('Ambulance requested!', 'error');
        // In real app, this would request ambulance service
    }

    // Refer patient to specialist
    referPatient(consultationId) {
        app.showToast('Referral form will open soon', 'info');
        // In real app, this would open referral interface
    }

    // Start location tracking for available doctors
    startLocationTracking() {
        if (!this.isAvailable) return;
        
        // Update location every 30 seconds
        this.locationTracker = setInterval(() => {
            this.updateLocation();
        }, 30000);
        
        // Initial location update
        this.updateLocation();
    }

    // Stop location tracking
    stopLocationTracking() {
        if (this.locationTracker) {
            clearInterval(this.locationTracker);
            this.locationTracker = null;
        }
    }

    // Update current location
    async updateLocation() {
        try {
            this.currentLocation = await app.getCurrentLocation();
            // In real app, this would send location to server
        } catch (error) {
            console.warn('Failed to update location:', error);
        }
    }

    // Start listening for consultation requests
    startListeningForRequests() {
        // In real app, this would use WebSocket or Server-Sent Events
        // For demo, we'll simulate with random requests
    }

    // Play notification sound
    playNotificationSound() {
        // In real app, this would play a notification sound
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
    }

    // Format request time
    formatRequestTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} min ago`;
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    // Format duration
    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Load consultation history
    loadConsultationHistory() {
        const saved = localStorage.getItem('doctorgo_consultation_history');
        this.consultationHistory = saved ? JSON.parse(saved) : [];
    }

    // Save consultation history
    saveConsultationHistory() {
        localStorage.setItem('doctorgo_consultation_history', JSON.stringify(this.consultationHistory));
    }

    // Load earnings
    loadEarnings() {
        const saved = localStorage.getItem('doctorgo_earnings');
        if (saved) {
            this.earnings = { ...this.earnings, ...JSON.parse(saved) };
        }
    }

    // Save earnings
    saveEarnings() {
        localStorage.setItem('doctorgo_earnings', JSON.stringify(this.earnings));
    }

    // Load availability status
    loadAvailabilityStatus() {
        const saved = localStorage.getItem('doctorgo_availability');
        if (saved) {
            this.isAvailable = JSON.parse(saved);
            
            const toggle = document.getElementById('availability-toggle');
            if (toggle) {
                toggle.checked = this.isAvailable;
                this.toggleAvailability(this.isAvailable);
            }
        }
    }

    // Save availability status
    saveAvailabilityStatus() {
        localStorage.setItem('doctorgo_availability', JSON.stringify(this.isAvailable));
    }

    // Update active consultations display
    updateActiveConsultationsDisplay() {
        // Update any active consultations display if needed
    }

    // Utility method
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize doctor manager
let doctorManager;
document.addEventListener('DOMContentLoaded', () => {
    doctorManager = new DoctorManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DoctorManager;
}