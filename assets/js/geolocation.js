// DoctorGo Geolocation Module
class GeolocationManager {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.isTracking = false;
        this.locationHistory = [];
        this.accuracy = 100; // meters
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };
    }

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    }

    // Get current position
    async getCurrentPosition() {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported by this browser');
        }

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = this.formatPosition(position);
                    this.addToHistory(this.currentPosition);
                    resolve(this.currentPosition);
                },
                (error) => {
                    reject(this.handleLocationError(error));
                },
                this.options
            );
        });
    }

    // Start watching position
    startWatching() {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        if (this.isTracking) {
            this.stopWatching();
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newPosition = this.formatPosition(position);
                
                // Only update if position has changed significantly
                if (this.hasPositionChanged(newPosition)) {
                    this.currentPosition = newPosition;
                    this.addToHistory(newPosition);
                    this.onLocationUpdate(newPosition);
                }
            },
            (error) => {
                this.onLocationError(this.handleLocationError(error));
            },
            this.options
        );

        this.isTracking = true;
        console.log('Started location tracking');
    }

    // Stop watching position
    stopWatching() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
            console.log('Stopped location tracking');
        }
    }

    // Format position object
    formatPosition(position) {
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };
    }

    // Check if position has changed significantly
    hasPositionChanged(newPosition) {
        if (!this.currentPosition) return true;

        const distance = this.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            newPosition.latitude,
            newPosition.longitude
        );

        // Consider position changed if moved more than accuracy threshold
        return distance > this.accuracy;
    }

    // Add position to history
    addToHistory(position) {
        this.locationHistory.push({
            ...position,
            recordedAt: new Date().toISOString()
        });

        // Keep only last 100 positions
        if (this.locationHistory.length > 100) {
            this.locationHistory.shift();
        }
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Calculate bearing between two points
    calculateBearing(lat1, lon1, lat2, lon2) {
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

        const θ = Math.atan2(y, x);
        return (θ * 180 / Math.PI + 360) % 360; // Bearing in degrees
    }

    // Find nearby locations within radius
    findNearby(targetLocations, radius = 5000) {
        if (!this.currentPosition) {
            throw new Error('Current position not available');
        }

        return targetLocations
            .map(location => ({
                ...location,
                distance: this.calculateDistance(
                    this.currentPosition.latitude,
                    this.currentPosition.longitude,
                    location.latitude,
                    location.longitude
                )
            }))
            .filter(location => location.distance <= radius)
            .sort((a, b) => a.distance - b.distance);
    }

    // Get address from coordinates (reverse geocoding)
    async reverseGeocode(latitude, longitude) {
        try {
            // In a real app, you would use a geocoding service like Google Maps
            // For demo, we'll return a mock address
            const mockAddresses = [
                'Dhanmondi 27, Dhaka 1205, Bangladesh',
                'Gulshan 2, Dhaka 1212, Bangladesh',
                'Banani, Dhaka 1213, Bangladesh',
                'Uttara, Dhaka 1230, Bangladesh',
                'Mirpur DOHS, Dhaka 1216, Bangladesh',
                'Mohammadpur, Dhaka 1207, Bangladesh'
            ];

            // Simulate API delay
            await this.delay(1000);

            const randomAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
            return {
                formatted_address: randomAddress,
                components: {
                    area: randomAddress.split(',')[0],
                    city: 'Dhaka',
                    country: 'Bangladesh'
                }
            };
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return {
                formatted_address: 'Unknown location',
                components: {}
            };
        }
    }

    // Get coordinates from address (geocoding)
    async geocode(address) {
        try {
            // In a real app, you would use a geocoding service
            // For demo, we'll return mock coordinates for Dhaka area
            await this.delay(1000);

            // Mock coordinates for different areas in Dhaka
            const mockCoordinates = {
                'dhanmondi': { latitude: 23.7461, longitude: 90.3742 },
                'gulshan': { latitude: 23.7925, longitude: 90.4078 },
                'banani': { latitude: 23.7937, longitude: 90.4066 },
                'uttara': { latitude: 23.8759, longitude: 90.3795 },
                'mirpur': { latitude: 23.8103, longitude: 90.3654 },
                'mohammadpur': { latitude: 23.7679, longitude: 90.3492 }
            };

            const lowerAddress = address.toLowerCase();
            for (const [area, coords] of Object.entries(mockCoordinates)) {
                if (lowerAddress.includes(area)) {
                    return coords;
                }
            }

            // Default to Dhaka center if no match
            return { latitude: 23.8103, longitude: 90.4125 };
        } catch (error) {
            console.error('Geocoding failed:', error);
            throw new Error('Failed to geocode address');
        }
    }

    // Handle location errors
    handleLocationError(error) {
        let message;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied. Please enable location services.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
            default:
                message = 'An unknown error occurred while retrieving location.';
        }
        
        return new Error(message);
    }

    // Format distance for display
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        } else {
            return `${(meters / 1000).toFixed(1)}km`;
        }
    }

    // Calculate estimated time of arrival
    calculateETA(distance, speed = 30) {
        // Default speed: 30 km/h (typical city driving)
        const timeInHours = distance / 1000 / speed;
        const timeInMinutes = Math.ceil(timeInHours * 60);
        return Math.max(1, timeInMinutes); // Minimum 1 minute
    }

    // Get user-friendly direction
    getDirection(bearing) {
        const directions = [
            'North', 'North-East', 'East', 'South-East',
            'South', 'South-West', 'West', 'North-West'
        ];
        const index = Math.round(bearing / 45) % 8;
        return directions[index];
    }

    // Check if location is within a geofence
    isWithinGeofence(targetLat, targetLon, radius) {
        if (!this.currentPosition) return false;

        const distance = this.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            targetLat,
            targetLon
        );

        return distance <= radius;
    }

    // Create a simple route (straight line for demo)
    createRoute(startLat, startLon, endLat, endLon) {
        return {
            distance: this.calculateDistance(startLat, startLon, endLat, endLon),
            bearing: this.calculateBearing(startLat, startLon, endLat, endLon),
            duration: this.calculateETA(this.calculateDistance(startLat, startLon, endLat, endLon)),
            steps: [
                {
                    instruction: `Head ${this.getDirection(this.calculateBearing(startLat, startLon, endLat, endLon))}`,
                    distance: this.calculateDistance(startLat, startLon, endLat, endLon),
                    duration: this.calculateETA(this.calculateDistance(startLat, startLon, endLat, endLon))
                }
            ]
        };
    }

    // Share location
    shareLocation() {
        if (!this.currentPosition) {
            throw new Error('No location available to share');
        }

        const locationUrl = `https://www.google.com/maps?q=${this.currentPosition.latitude},${this.currentPosition.longitude}`;
        
        if (navigator.share) {
            return navigator.share({
                title: 'My Current Location',
                text: 'Here is my current location',
                url: locationUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(locationUrl);
            return Promise.resolve();
        }
    }

    // Event handlers (to be overridden)
    onLocationUpdate(position) {
        console.log('Location updated:', position);
        // Override this method to handle location updates
    }

    onLocationError(error) {
        console.error('Location error:', error);
        // Override this method to handle location errors
    }

    // Get location permissions status
    async checkPermissions() {
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                return result.state; // 'granted', 'denied', or 'prompt'
            } catch (error) {
                console.warn('Cannot check geolocation permissions:', error);
                return 'unknown';
            }
        }
        return 'unknown';
    }

    // Request location permissions
    async requestPermissions() {
        try {
            const position = await this.getCurrentPosition();
            return 'granted';
        } catch (error) {
            if (error.message.includes('denied')) {
                return 'denied';
            }
            return 'error';
        }
    }

    // Save location data to localStorage
    saveLocationData() {
        const data = {
            currentPosition: this.currentPosition,
            locationHistory: this.locationHistory.slice(-10), // Keep last 10 positions
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('doctorgo_location_data', JSON.stringify(data));
    }

    // Load location data from localStorage
    loadLocationData() {
        try {
            const saved = localStorage.getItem('doctorgo_location_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentPosition = data.currentPosition;
                this.locationHistory = data.locationHistory || [];
                
                // Check if data is recent (within 1 hour)
                const lastUpdate = new Date(data.lastUpdate);
                const now = new Date();
                const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
                
                if (hoursSinceUpdate > 1) {
                    // Data is stale, clear it
                    this.currentPosition = null;
                    this.locationHistory = [];
                }
            }
        } catch (error) {
            console.warn('Failed to load location data:', error);
        }
    }

    // Clean up resources
    cleanup() {
        this.stopWatching();
        this.saveLocationData();
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
let geolocationManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    geolocationManager = new GeolocationManager();
    geolocationManager.loadLocationData();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (geolocationManager) {
            geolocationManager.cleanup();
        }
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeolocationManager;
}