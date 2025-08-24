// DoctorGo Patient Module
class PatientManager {
    constructor() {
        this.currentLocation = null;
        this.nearbyDoctors = [];
        this.currentBooking = null;
        this.bookingHistory = [];
        this.searchFilters = {
            specialization: 'all',
            distance: 10, // km
            rating: 0,
            fee: { min: 0, max: 5000 }
        };
    }

    // Initialize patient features
    init() {
        this.loadPatientData();
        this.setupPatientEventListeners();
    }

    // Load patient-specific data
    loadPatientData() {
        this.loadBookingHistory();
        this.loadSavedSearches();
    }

    // Setup event listeners for patient features
    setupPatientEventListeners() {
        // Symptoms form
        const symptomsTextarea = document.getElementById('symptoms');
        if (symptomsTextarea) {
            symptomsTextarea.addEventListener('input', (e) => {
                this.handleSymptomsInput(e.target.value);
            });
        }

        // Emergency button
        const emergencyBtn = document.querySelector('.btn-emergency');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                this.handleEmergencyRequest();
            });
        }
    }

    // Handle symptoms input with suggestions
    handleSymptomsInput(symptoms) {
        if (symptoms.length > 10) {
            this.suggestSpecializations(symptoms);
        }
    }

    // Suggest relevant specializations based on symptoms
    suggestSpecializations(symptoms) {
        const symptomKeywords = {
            'heart': 'cardiologist',
            'chest pain': 'cardiologist',
            'breathing': 'cardiologist',
            'skin': 'dermatologist',
            'rash': 'dermatologist',
            'acne': 'dermatologist',
            'headache': 'neurologist',
            'migraine': 'neurologist',
            'child': 'pediatrician',
            'baby': 'pediatrician',
            'fever': 'general',
            'cold': 'general',
            'stomach': 'general'
        };

        const lowerSymptoms = symptoms.toLowerCase();
        const suggestions = [];

        for (const [keyword, specialization] of Object.entries(symptomKeywords)) {
            if (lowerSymptoms.includes(keyword)) {
                suggestions.push(specialization);
            }
        }

        if (suggestions.length > 0) {
            this.showSpecializationSuggestions([...new Set(suggestions)]);
        }
    }

    // Show specialization suggestions
    showSpecializationSuggestions(suggestions) {
        // Remove existing suggestions
        const existingSuggestions = document.querySelector('.specialization-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        if (suggestions.length === 0) return;

        const symptomsInput = document.getElementById('symptoms');
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'specialization-suggestions';
        suggestionDiv.innerHTML = `
            <p><strong>Recommended specialists:</strong></p>
            <div class="suggestion-pills">
                ${suggestions.map(spec => `
                    <span class="suggestion-pill" onclick="patientManager.selectSpecialization('${spec}')">
                        ${this.formatSpecialization(spec)}
                    </span>
                `).join('')}
            </div>
        `;

        symptomsInput.parentNode.insertBefore(suggestionDiv, symptomsInput.nextSibling);
    }

    // Format specialization name for display
    formatSpecialization(spec) {
        const names = {
            'general': 'General Practitioner',
            'cardiologist': 'Cardiologist',
            'dermatologist': 'Dermatologist',
            'neurologist': 'Neurologist',
            'pediatrician': 'Pediatrician'
        };
        return names[spec] || spec;
    }

    // Select a specialization filter
    selectSpecialization(specialization) {
        this.searchFilters.specialization = specialization;
        app.showToast(`Filtering by ${this.formatSpecialization(specialization)}`, 'info');
        
        // Remove suggestions
        const suggestions = document.querySelector('.specialization-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }

    // Find nearby doctors
    async findNearbyDoctors() {
        try {
            app.showToast('Searching for nearby doctors...', 'info');
            
            // Get current location
            this.currentLocation = await app.getCurrentLocation();
            
            // Simulate API call to find doctors
            await this.delay(2000);
            
            // Mock nearby doctors data
            this.nearbyDoctors = this.generateMockDoctors();
            
            // Apply filters
            const filteredDoctors = this.applyFilters(this.nearbyDoctors);
            
            if (filteredDoctors.length === 0) {
                app.showToast('No doctors found matching your criteria', 'info');
                return;
            }
            
            // Show doctor search screen
            this.showDoctorSearchScreen(filteredDoctors);
            
        } catch (error) {
            console.error('Error finding doctors:', error);
            app.showToast('Unable to find doctors. Please try again.', 'error');
        }
    }

    // Generate mock doctors data
    generateMockDoctors() {
        const specializations = ['general', 'cardiologist', 'dermatologist', 'neurologist', 'pediatrician'];
        const names = [
            'Dr. Sarah Ahmed', 'Dr. Mohammad Rahman', 'Dr. Fatima Khan',
            'Dr. Ahmed Hassan', 'Dr. Rashida Begum', 'Dr. Karim Ali',
            'Dr. Nasreen Sultana', 'Dr. Jahangir Alam'
        ];
        
        return names.map((name, index) => ({
            id: index + 1,
            name: name,
            specialization: specializations[index % specializations.length],
            experience: Math.floor(Math.random() * 15) + 2,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            consultationFee: Math.floor(Math.random() * 1000) + 500,
            distance: (Math.random() * 8 + 0.5).toFixed(1),
            eta: Math.floor(Math.random() * 30) + 15,
            available: Math.random() > 0.3,
            reviews: Math.floor(Math.random() * 200) + 20,
            verified: true,
            avatar: `https://ui-avatars.io/api/?name=${encodeURIComponent(name)}&background=2E86C1&color=fff`
        }));
    }

    // Apply search filters to doctors list
    applyFilters(doctors) {
        return doctors.filter(doctor => {
            // Specialization filter
            if (this.searchFilters.specialization !== 'all' && 
                doctor.specialization !== this.searchFilters.specialization) {
                return false;
            }
            
            // Distance filter
            if (parseFloat(doctor.distance) > this.searchFilters.distance) {
                return false;
            }
            
            // Rating filter
            if (parseFloat(doctor.rating) < this.searchFilters.rating) {
                return false;
            }
            
            // Fee filter
            if (doctor.consultationFee < this.searchFilters.fee.min || 
                doctor.consultationFee > this.searchFilters.fee.max) {
                return false;
            }
            
            return true;
        });
    }

    // Show doctor search screen
    showDoctorSearchScreen(doctors) {
        // Create and show doctor search screen
        const searchScreen = this.createDoctorSearchScreen(doctors);
        const appContainer = document.getElementById('app');
        
        // Remove existing search screen
        const existingSearch = document.getElementById('doctor-search-screen');
        if (existingSearch) {
            existingSearch.remove();
        }
        
        appContainer.appendChild(searchScreen);
        app.showScreen('doctor-search');
    }

    // Create doctor search screen HTML
    createDoctorSearchScreen(doctors) {
        const screen = document.createElement('div');
        screen.id = 'doctor-search-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="search-container">
                <div class="search-header">
                    <button class="back-btn" onclick="app.showDashboard()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Nearby Doctors</h2>
                </div>
                
                <div class="search-bar">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" class="search-input" placeholder="Search doctors..." 
                           onkeyup="patientManager.searchDoctors(this.value)">
                </div>
                
                <div class="filter-section">
                    <div class="filter-buttons">
                        <button class="filter-btn ${this.searchFilters.specialization === 'all' ? 'active' : ''}" 
                                onclick="patientManager.setFilter('specialization', 'all')">All</button>
                        <button class="filter-btn ${this.searchFilters.specialization === 'general' ? 'active' : ''}" 
                                onclick="patientManager.setFilter('specialization', 'general')">GP</button>
                        <button class="filter-btn ${this.searchFilters.specialization === 'cardiologist' ? 'active' : ''}" 
                                onclick="patientManager.setFilter('specialization', 'cardiologist')">Heart</button>
                        <button class="filter-btn ${this.searchFilters.specialization === 'dermatologist' ? 'active' : ''}" 
                                onclick="patientManager.setFilter('specialization', 'dermatologist')">Skin</button>
                    </div>
                </div>
                
                <div class="map-container">
                    <div class="map-placeholder">
                        <i class="fas fa-map-marker-alt"></i>
                        <p>Map view would show here</p>
                        <small>Showing ${doctors.length} doctors nearby</small>
                    </div>
                </div>
                
                <div class="doctors-list">
                    ${doctors.map(doctor => this.createDoctorCard(doctor)).join('')}
                </div>
            </div>
        `;
        
        return screen;
    }

    // Create doctor card HTML
    createDoctorCard(doctor) {
        return `
            <div class="doctor-card ${!doctor.available ? 'unavailable' : ''}" 
                 data-doctor-id="${doctor.id}">
                <div class="doctor-header">
                    <img src="${doctor.avatar}" alt="${doctor.name}" class="doctor-avatar">
                    <div class="doctor-info">
                        <h4>${doctor.name}</h4>
                        <div class="doctor-specialization">${this.formatSpecialization(doctor.specialization)}</div>
                        <div class="doctor-experience">${doctor.experience} years experience</div>
                    </div>
                    <div class="availability-indicator ${doctor.available ? 'available' : 'unavailable'}">
                        ${doctor.available ? 'Available' : 'Busy'}
                    </div>
                </div>
                
                <div class="doctor-details">
                    <div class="detail-item">
                        <div class="detail-value rating-value">
                            ${doctor.rating} <i class="fas fa-star"></i>
                        </div>
                        <div class="detail-label">${doctor.reviews} reviews</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${doctor.distance} km</div>
                        <div class="detail-label">Distance</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value">${doctor.eta} min</div>
                        <div class="detail-label">ETA</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-value fee-value">৳${doctor.consultationFee}</div>
                        <div class="detail-label">Consultation</div>
                    </div>
                </div>
                
                <div class="doctor-actions">
                    <button class="btn btn-book" 
                            onclick="patientManager.bookDoctor(${doctor.id})"
                            ${!doctor.available ? 'disabled' : ''}>
                        <i class="fas fa-calendar-plus"></i>
                        ${doctor.available ? 'Book Now' : 'Unavailable'}
                    </button>
                    <button class="btn btn-call" onclick="patientManager.callDoctor(${doctor.id})">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Search doctors by name or specialization
    searchDoctors(query) {
        const doctors = this.applyFilters(this.nearbyDoctors);
        const filteredDoctors = doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(query.toLowerCase()) ||
            this.formatSpecialization(doctor.specialization).toLowerCase().includes(query.toLowerCase())
        );
        
        this.updateDoctorsList(filteredDoctors);
    }

    // Set search filter
    setFilter(filterType, value) {
        this.searchFilters[filterType] = value;
        
        // Update filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = document.querySelector(`[onclick*="'${value}'"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update doctors list
        const filteredDoctors = this.applyFilters(this.nearbyDoctors);
        this.updateDoctorsList(filteredDoctors);
    }

    // Update doctors list display
    updateDoctorsList(doctors) {
        const doctorsList = document.querySelector('.doctors-list');
        if (doctorsList) {
            doctorsList.innerHTML = doctors.map(doctor => this.createDoctorCard(doctor)).join('');
        }
    }

    // Book a doctor
    async bookDoctor(doctorId) {
        try {
            const doctor = this.nearbyDoctors.find(d => d.id === doctorId);
            if (!doctor) {
                app.showToast('Doctor not found', 'error');
                return;
            }
            
            app.showToast('Sending booking request...', 'info');
            
            // Simulate booking API call
            await this.delay(2000);
            
            // Create booking object
            const booking = {
                id: Date.now(),
                doctorId: doctor.id,
                doctorName: doctor.name,
                doctorSpecialization: doctor.specialization,
                patientId: app.currentUser.id,
                patientName: app.currentUser.name,
                symptoms: document.getElementById('symptoms')?.value || 'Not specified',
                fee: doctor.consultationFee,
                distance: doctor.distance,
                eta: doctor.eta,
                status: 'pending',
                createdAt: new Date().toISOString(),
                location: this.currentLocation
            };
            
            this.currentBooking = booking;
            
            // Simulate doctor acceptance (random chance)
            setTimeout(() => {
                if (Math.random() > 0.3) { // 70% acceptance rate
                    this.handleBookingAccepted(booking);
                } else {
                    this.handleBookingRejected(booking);
                }
            }, 5000);
            
            // Show booking screen
            this.showBookingScreen(booking);
            
        } catch (error) {
            console.error('Booking error:', error);
            app.showToast('Failed to book doctor. Please try again.', 'error');
        }
    }

    // Handle booking accepted
    handleBookingAccepted(booking) {
        booking.status = 'confirmed';
        this.currentBooking = booking;
        
        app.showToast('Booking confirmed! Doctor is on the way.', 'success');
        this.showTrackingScreen(booking);
    }

    // Handle booking rejected
    handleBookingRejected(booking) {
        booking.status = 'rejected';
        this.currentBooking = null;
        
        app.showToast('Doctor is not available. Please try another doctor.', 'error');
        // Return to doctor search
        this.findNearbyDoctors();
    }

    // Show booking screen
    showBookingScreen(booking) {
        const screen = this.createBookingScreen(booking);
        const appContainer = document.getElementById('app');
        
        const existingBooking = document.getElementById('booking-screen');
        if (existingBooking) {
            existingBooking.remove();
        }
        
        appContainer.appendChild(screen);
        app.showScreen('booking');
    }

    // Create booking screen
    createBookingScreen(booking) {
        const screen = document.createElement('div');
        screen.id = 'booking-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="booking-container">
                <div class="booking-header">
                    <h2>Booking Request</h2>
                    <div class="booking-status status-${booking.status}">${booking.status}</div>
                </div>
                
                <div class="doctor-summary">
                    <img src="https://ui-avatars.io/api/?name=${encodeURIComponent(booking.doctorName)}&background=2E86C1&color=fff" 
                         alt="${booking.doctorName}" class="doctor-avatar">
                    <div class="doctor-info">
                        <h3>${booking.doctorName}</h3>
                        <p>${this.formatSpecialization(booking.doctorSpecialization)}</p>
                        <p>Distance: ${booking.distance} km • ETA: ${booking.eta} min</p>
                    </div>
                </div>
                
                <div class="booking-details">
                    <h4>Request Details</h4>
                    <div class="detail-row">
                        <span>Symptoms:</span>
                        <span>${booking.symptoms}</span>
                    </div>
                    <div class="detail-row">
                        <span>Consultation Fee:</span>
                        <span>৳${booking.fee}</span>
                    </div>
                    <div class="detail-row">
                        <span>Estimated Time:</span>
                        <span>${booking.eta} minutes</span>
                    </div>
                </div>
                
                <div class="booking-status-message">
                    ${booking.status === 'pending' ? 
                        '<p><i class="fas fa-clock"></i> Waiting for doctor to accept...</p>' :
                        '<p><i class="fas fa-check-circle"></i> Booking confirmed!</p>'
                    }
                </div>
                
                <div class="booking-actions">
                    <button class="btn btn-secondary" onclick="patientManager.cancelBooking()">
                        Cancel Request
                    </button>
                </div>
            </div>
        `;
        
        return screen;
    }

    // Show tracking screen
    showTrackingScreen(booking) {
        const screen = this.createTrackingScreen(booking);
        const appContainer = document.getElementById('app');
        
        const existingTracking = document.getElementById('tracking-screen');
        if (existingTracking) {
            existingTracking.remove();
        }
        
        appContainer.appendChild(screen);
        app.showScreen('tracking');
        
        // Start location tracking simulation
        this.simulateLocationTracking(booking);
    }

    // Create tracking screen
    createTrackingScreen(booking) {
        const screen = document.createElement('div');
        screen.id = 'tracking-screen';
        screen.className = 'screen';
        
        screen.innerHTML = `
            <div class="tracking-container">
                <div class="tracking-header">
                    <h2>Doctor On The Way</h2>
                </div>
                
                <div class="tracking-map">
                    <div class="map-container">
                        <div class="map-placeholder">
                            <i class="fas fa-car"></i>
                            <p>Live tracking map would show here</p>
                        </div>
                    </div>
                </div>
                
                <div class="tracking-status">
                    <div class="status-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="status-text">Doctor is on the way</div>
                    <div class="status-subtext">Please wait at your location</div>
                    
                    <div class="eta-info">
                        <div class="eta-time" id="eta-countdown">${booking.eta}</div>
                        <div class="eta-label">minutes away</div>
                    </div>
                </div>
                
                <div class="doctor-contact">
                    <h4>${booking.doctorName}</h4>
                    <div class="contact-actions">
                        <button class="btn btn-primary" onclick="patientManager.callDoctor(${booking.doctorId})">
                            <i class="fas fa-phone"></i> Call
                        </button>
                        <button class="btn btn-secondary" onclick="patientManager.messageDoctor(${booking.doctorId})">
                            <i class="fas fa-comment"></i> Message
                        </button>
                    </div>
                </div>
                
                <div class="emergency-actions">
                    <button class="btn btn-emergency" onclick="patientManager.requestEmergency()">
                        <i class="fas fa-exclamation-triangle"></i>
                        Emergency
                    </button>
                </div>
            </div>
        `;
        
        return screen;
    }

    // Simulate location tracking
    simulateLocationTracking(booking) {
        let eta = parseInt(booking.eta);
        const countdown = document.getElementById('eta-countdown');
        
        const trackingInterval = setInterval(() => {
            eta -= 1;
            if (countdown) {
                countdown.textContent = Math.max(0, eta);
            }
            
            if (eta <= 0) {
                clearInterval(trackingInterval);
                this.doctorArrived(booking);
            }
        }, 60000); // Update every minute
        
        // Store interval for cleanup
        this.trackingInterval = trackingInterval;
    }

    // Handle doctor arrival
    doctorArrived(booking) {
        booking.status = 'arrived';
        app.showToast('Doctor has arrived!', 'success');
        
        // Show arrival notification
        this.showArrivalScreen(booking);
    }

    // Call doctor
    callDoctor(doctorId) {
        app.showToast('Calling doctor...', 'info');
        // In real app, this would initiate a call
    }

    // Message doctor
    messageDoctor(doctorId) {
        app.showToast('Opening chat...', 'info');
        // In real app, this would open chat interface
    }

    // Cancel booking
    cancelBooking() {
        if (this.currentBooking) {
            this.currentBooking.status = 'cancelled';
            this.currentBooking = null;
            
            // Clear tracking interval
            if (this.trackingInterval) {
                clearInterval(this.trackingInterval);
            }
            
            app.showToast('Booking cancelled', 'info');
            app.showDashboard();
        }
    }

    // Handle emergency request
    handleEmergencyRequest() {
        app.showToast('Contacting emergency services...', 'error');
        
        // In real app, this would:
        // 1. Contact emergency services
        // 2. Send location
        // 3. Notify emergency contacts
        
        setTimeout(() => {
            app.showToast('Emergency services have been notified', 'success');
        }, 2000);
    }

    // Load booking history
    loadBookingHistory() {
        const saved = localStorage.getItem('doctorgo_booking_history');
        this.bookingHistory = saved ? JSON.parse(saved) : [];
    }

    // Save booking to history
    saveBookingToHistory(booking) {
        this.bookingHistory.unshift(booking);
        // Keep only last 50 bookings
        this.bookingHistory = this.bookingHistory.slice(0, 50);
        localStorage.setItem('doctorgo_booking_history', JSON.stringify(this.bookingHistory));
    }

    // Load saved searches
    loadSavedSearches() {
        const saved = localStorage.getItem('doctorgo_saved_searches');
        return saved ? JSON.parse(saved) : [];
    }

    // Utility method
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize patient manager
let patientManager;
document.addEventListener('DOMContentLoaded', () => {
    patientManager = new PatientManager();
});

// Global function for find doctors button
function findDoctors() {
    const symptoms = document.getElementById('symptoms')?.value;
    if (!symptoms || !symptoms.trim()) {
        app.showToast('Please describe your symptoms first', 'warning');
        return;
    }
    
    patientManager.findNearbyDoctors();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientManager;
}