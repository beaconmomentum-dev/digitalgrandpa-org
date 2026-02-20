// Digital Grandpa - Complete JavaScript - Production Ready
// Enhanced with error handling, fallbacks, and optimizations

// Enhanced GHL Configuration with fallbacks
const DIGITAL_GRANDPA_CONFIG = {
    webhook: {
        // Email capture webhook (existing)
        emailCaptureUrl: 'https://services.leadconnectorhq.com/hooks/xiByhBN0HkemBQ3gLZxB/webhook-trigger/710239a7-39fa-4367-b0e8-096ef4c0341c',
        // Contact form webhook (new)
        contactFormUrl: 'https://services.leadconnectorhq.com/hooks/xiByhBN0HkemBQ3gLZxB/webhook-trigger/710239a7-39fa-4367-b0e8-096ef4c0341c',
        // Blog subscription webhook (new)
        blogSubscriptionUrl: 'https://services.leadconnectorhq.com/hooks/xiByhBN0HkemBQ3gLZxB/webhook-trigger/710239a7-39fa-4367-b0e8-096ef4c0341c',
        tag: 'digitalgrandpa-free-resource',
        contactTag: 'digitalgrandpa-contact-form',
        blogTag: 'digitalgrandpa-blog-subscriber',
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
    },
    analytics: {
        gaTrackingId: 'G-XXXXXXXXXX', // Replace with actual GA4 tracking ID
        enabled: true,
        debug: false
    },
    messaging: {
        loadingText: 'Securing your access...',
        successText: 'Welcome to the Digital Grandpa family',
        errorText: 'Something went wrong. Please try again or email info@digitalgrandpa.org'
    },
    resources: {
        'When Everything Falls Apart': {
            type: 'pdf',
            url: 'https://digitalgrandpa.org/downloads/when-everything-falls-apart.pdf',
            fallbackUrl: '/downloads/when-everything-falls-apart.pdf',
            size: '2.1MB',
            pages: 47,
            description: 'Comprehensive crisis navigation guide'
        },
        'From Sacrifice to Service': {
            type: 'audio',
            url: 'https://digitalgrandpa.org/downloads/sacrifice-to-service-audio.zip',
            fallbackUrl: '/downloads/sacrifice-to-service-audio.zip',
            size: '156MB',
            duration: '3.5 hours',
            episodes: 6,
            description: '6-part audio series on transformation'
        },
        'The Veteran\'s Second Battle': {
            type: 'video',
            url: 'https://digitalgrandpa.org/downloads/veterans-second-battle.mp4',
            fallbackUrl: '/downloads/veterans-second-battle.mp4',
            size: '892MB',
            duration: '90 minutes',
            description: 'Complete workshop with workbook'
        },
        'Join Rise & Reclaim Community': {
            type: 'redirect',
            url: 'https://joinriseandreclaim.com',
            fallbackUrl: '/community/join',
            description: 'Access to private community platform'
        },
        'Voices of Inspiration - Chapter 1': {
            type: 'pdf',
            url: 'https://digitalgrandpa.org/downloads/voices-inspiration-chapter1.pdf',
            fallbackUrl: '/downloads/voices-inspiration-chapter1.pdf',
            size: '1.2MB',
            pages: 12,
            description: 'Sample chapter from real transformation stories'
        },
        'The Power of Getting Started - Chapter 1': {
            type: 'pdf',
            url: 'https://digitalgrandpa.org/downloads/power-getting-started-chapter1.pdf',
            fallbackUrl: '/downloads/power-getting-started-chapter1.pdf',
            size: '987KB',
            pages: 10,
            description: 'First steps to overcoming overwhelm'
        },
        'Complete Library - Preview': {
            type: 'pdf',
            url: 'https://digitalgrandpa.org/downloads/complete-library-preview.pdf',
            fallbackUrl: '/downloads/complete-library-preview.pdf',
            size: '2.5MB',
            pages: 25,
            description: 'Overview of all books and tools included'
        },
        'Voices of Inspiration - Full Book': {
            type: 'purchase',
            url: 'https://digitalgrandpa.org/purchase/voices-inspiration',
            fallbackUrl: '/purchase/voices-inspiration',
            price: '$19.99',
            description: 'Complete book with 12 real transformation stories'
        },
        'The Power of Getting Started - Full Book': {
            type: 'purchase',
            url: 'https://digitalgrandpa.org/purchase/power-getting-started',
            fallbackUrl: '/purchase/power-getting-started',
            price: '$24.99',
            description: 'Complete guide to overcoming overwhelm'
        },
        'Digital Grandpa Complete Library': {
            type: 'purchase',
            url: 'https://digitalgrandpa.org/purchase/complete-library',
            fallbackUrl: '/purchase/complete-library',
            price: '$97.00',
            description: 'Lifetime access to all books and tools'
        }
    },
    ui: {
        scrollThreshold: 0.5,
        progressIndicatorDelay: 2000,
        exitIntentEnabled: true,
        floatingCTADelay: 30000,
        animationDuration: 300,
        debounceDelay: 100
    },
    analytics: {
        enabled: true,
        debug: false
    }
};

// Utility functions
const Utils = {
    // Debounce function to limit rapid function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Safe element selector
    safeQuerySelector(selector) {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return null;
        }
    },

    // Safe element selectors (multiple)
    safeQuerySelectorAll(selector) {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return [];
        }
    },

    // Safe storage access
    safeStorageGet(key, storage = sessionStorage) {
        try {
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`Failed to get storage item: ${key}`, error);
            return null;
        }
    },

    safeStorageSet(key, value, storage = sessionStorage) {
        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Failed to set storage item: ${key}`, error);
            return false;
        }
    },

    // Email validation with enhanced checks
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const disposableEmailDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        
        if (!emailRegex.test(email)) return false;
        if (disposableEmailDomains.includes(domain)) return false;
        
        return true;
    },

    // Generate UUID for tracking
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

// Enhanced Modal State Manager with error handling
const ModalManager = {
    activeModal: null,
    
    // Open a modal (closes any existing modal first)
    openModal(modalId) {
        try {
            console.log('🔓 Opening modal:', modalId);
            
            // Close any existing modal first
            this.closeAllModals();
            
            const modal = Utils.safeQuerySelector(`#${modalId}`);
            if (!modal) {
                console.error(`Modal not found: ${modalId}`);
                return false;
            }
            
            this.activeModal = modalId;
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            // Prevent body scroll
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            // Focus management with delay for better UX
            setTimeout(() => {
                const firstInput = modal.querySelector('input, button');
                if (firstInput && typeof firstInput.focus === 'function') {
                    firstInput.focus();
                }
            }, 100);
            
            // Announce to screen readers
            this.announceModal(modalId);
            
            return true;
        } catch (error) {
            console.error('Error opening modal:', error);
            return false;
        }
    },
    
    // Close specific modal
    closeModal(modalId) {
        try {
            console.log('🔒 Closing modal:', modalId);
            
            const modal = Utils.safeQuerySelector(`#${modalId}`);
            if (!modal) return false;
            
            modal.style.display = 'none';
            modal.classList.remove('active');
            
            // Clear form if it's email modal
            if (modalId === 'emailModal') {
                const form = modal.querySelector('.email-form');
                if (form && typeof form.reset === 'function') {
                    form.reset();
                }
                
                // Remove any form messages
                const existingMessages = modal.querySelectorAll('.form-message');
                existingMessages.forEach(msg => {
                    if (msg.parentNode) {
                        msg.parentNode.removeChild(msg);
                    }
                });
            }
            
            // Reset body scroll if this was the active modal
            if (this.activeModal === modalId) {
                this.activeModal = null;
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
            }
            
            return true;
        } catch (error) {
            console.error('Error closing modal:', error);
            return false;
        }
    },
    
    // Close all modals
    closeAllModals() {
        try {
            console.log('🔒 Closing all modals');
            
            const modals = ['emailModal', 'downloadModal'];
            modals.forEach(modalId => {
                const modal = Utils.safeQuerySelector(`#${modalId}`);
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('active');
                    
                    // Clear forms
                    const form = modal.querySelector('form');
                    if (form && typeof form.reset === 'function') {
                        form.reset();
                    }
                    
                    // Remove messages
                    const messages = modal.querySelectorAll('.form-message');
                    messages.forEach(msg => {
                        if (msg.parentNode) {
                            msg.parentNode.removeChild(msg);
                        }
                    });
                }
            });
            
            this.activeModal = null;
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        } catch (error) {
            console.error('Error closing all modals:', error);
        }
    },
    
    // Check if any modal is open
    isModalOpen() {
        return this.activeModal !== null;
    },

    // Announce modal to screen readers
    announceModal(modalId) {
        try {
            const modal = Utils.safeQuerySelector(`#${modalId}`);
            if (modal) {
                const title = modal.querySelector('h3');
                if (title) {
                    // Create announcement for screen readers
                    const announcement = document.createElement('div');
                    announcement.setAttribute('aria-live', 'polite');
                    announcement.setAttribute('aria-atomic', 'true');
                    announcement.style.position = 'absolute';
                    announcement.style.left = '-9999px';
                    announcement.textContent = `Modal opened: ${title.textContent}`;
                    document.body.appendChild(announcement);
                    
                    setTimeout(() => {
                        if (announcement.parentNode) {
                            announcement.parentNode.removeChild(announcement);
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.warn('Error announcing modal:', error);
        }
    }
};

// Enhanced Form Handler with comprehensive error handling
const FormHandler = {
    lastModalTrigger: null,
    isVeteran: false,
    submissionInProgress: false,

    // Show email modal with proper state management
    showEmailModal() {
        try {
            console.log('📧 Showing email modal');
            
            if (ModalManager.openModal('emailModal')) {
                // Track modal open
                this.trackEvent('modal_opened', {
                    'trigger': this.lastModalTrigger || 'unknown',
                    'timestamp': new Date().toISOString()
                });
                
                // Reset last trigger
                this.lastModalTrigger = null;
            }
        } catch (error) {
            console.error('Error showing email modal:', error);
        }
    },

    // Hide email modal
    hideEmailModal() {
        try {
            console.log('📧 Hiding email modal');
            ModalManager.closeModal('emailModal');
        } catch (error) {
            console.error('Error hiding email modal:', error);
        }
    },

    // Show download modal with proper state management
    showDownloadModal(resource, resourceName, userName) {
        try {
            console.log('📥 Showing download modal for:', resourceName);
            
            const modal = Utils.safeQuerySelector('#downloadModal');
            const title = Utils.safeQuerySelector('#downloadTitle');
            const details = Utils.safeQuerySelector('#downloadDetails');
            const downloadBtn = Utils.safeQuerySelector('#downloadBtn');
            
            if (!modal) {
                console.error('Download modal not found');
                return false;
            }
            
            // Update modal content
            if (title) title.textContent = `${resourceName} is Ready!`;
            
            if (details) {
                let detailsHTML = `
                    <div style="text-align: left;">
                        <h4 style="margin-bottom: 1rem; color: #2c3e50;">${resourceName}</h4>
                        <p style="margin-bottom: 1rem; color: #666;">${resource.description}</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div><strong>Type:</strong> ${resource.type.toUpperCase()}</div>
                            <div><strong>Size:</strong> ${resource.size || 'N/A'}</div>
                            ${resource.pages ? `<div><strong>Pages:</strong> ${resource.pages}</div>` : ''}
                            ${resource.duration ? `<div><strong>Duration:</strong> ${resource.duration}</div>` : ''}
                            ${resource.episodes ? `<div><strong>Episodes:</strong> ${resource.episodes}</div>` : ''}
                            ${resource.price ? `<div><strong>Price:</strong> ${resource.price}</div>` : ''}
                        </div>
                        <p style="color: #3498db; font-weight: 600;">✅ Access granted for ${userName}</p>
                    </div>
                `;
                details.innerHTML = detailsHTML;
            }
            
            // Set up download button
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    if (resource.type === 'purchase') {
                        window.open(resource.url, '_blank');
                    } else {
                        this.initiateDownload(resource.url, resourceName, resource.fallbackUrl);
                    }
                    this.hideDownloadModal();
                };
                
                // Update button text based on resource type
                downloadBtn.textContent = resource.type === 'purchase' ? 'Purchase Now' : 'Download Now';
            }
            
            // Show modal using ModalManager
            return ModalManager.openModal('downloadModal');
        } catch (error) {
            console.error('Error showing download modal:', error);
            return false;
        }
    },

    // Hide download modal
    hideDownloadModal() {
        try {
            console.log('📥 Hiding download modal');
            ModalManager.closeModal('downloadModal');
        } catch (error) {
            console.error('Error hiding download modal:', error);
        }
    },

    // Enhanced form validation with military domain detection
    validateForm(firstName, email) {
        const errors = [];
        
        try {
            // Name validation
            if (!firstName || !firstName.trim()) {
                errors.push('Please enter your first name');
            } else if (firstName.trim().length < 2) {
                errors.push('First name must be at least 2 characters');
            } else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) {
                errors.push('First name can only contain letters, spaces, apostrophes, and hyphens');
            }
            
            // Email validation
            if (!email || !email.trim()) {
                errors.push('Please enter your email address');
            } else if (!Utils.isValidEmail(email.trim())) {
                errors.push('Please enter a valid email address');
            }
            
            // Check for military/veteran domains for personalization
            const militaryDomains = ['va.gov', 'army.mil', 'navy.mil', 'af.mil', 'usmc.mil', 'uscg.mil', 'us.army.mil'];
            const domain = email.split('@')[1]?.toLowerCase();
            if (domain && militaryDomains.includes(domain)) {
                this.isVeteran = true;
                this.updateModalForVeteran();
            }
        } catch (error) {
            console.error('Error validating form:', error);
            errors.push('Validation error occurred. Please try again.');
        }
        
        return errors;
    },

    // Update modal messaging for veterans
    updateModalForVeteran() {
        try {
            const modalTitle = Utils.safeQuerySelector('#emailModalTitle');
            const modalDesc = Utils.safeQuerySelector('#emailModalDescription');
            
            if (modalTitle && modalDesc) {
                modalTitle.textContent = 'Welcome, Fellow Veteran';
                modalDesc.textContent = 'Join thousands of veterans who\'ve found their path forward. These resources were created by someone who understands the unique challenges we face.';
            }
        } catch (error) {
            console.error('Error updating modal for veteran:', error);
        }
    },

    // Submit to GHL webhook with enhanced retry logic and error handling
    async submitToGHL(firstName, email) {
        const payload = {
            firstName: firstName.trim(),
            email: email.trim(),
            tag: DIGITAL_GRANDPA_CONFIG.webhook.tag,
            source: 'digitalgrandpa_website',
            veteran_detected: this.isVeteran || false,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            session_id: Utils.generateUUID()
        };

        console.log('Digital Grandpa: Submitting to GHL', payload);

        for (let attempt = 1; attempt <= DIGITAL_GRANDPA_CONFIG.webhook.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), DIGITAL_GRANDPA_CONFIG.webhook.timeout);

                const response = await fetch(DIGITAL_GRANDPA_CONFIG.webhook.emailCaptureUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'DigitalGrandpa/1.0'
                    },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok || response.status === 200) {
                    console.log(`✅ GHL submission successful (attempt ${attempt})`);
                    
                    // Track successful submission
                    this.trackEvent('ghl_submission_success', {
                        'user_name': firstName,
                        'attempt': attempt,
                        'veteran_detected': this.isVeteran || false
                    });

                    return { success: true, attempt };
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

            } catch (error) {
                console.warn(`❌ GHL attempt ${attempt} failed:`, error.message);
                
                if (attempt === DIGITAL_GRANDPA_CONFIG.webhook.retryAttempts) {
                    // Track final failure
                    this.trackEvent('ghl_submission_failed', {
                        'error': error.message,
                        'attempts': attempt,
                        'user_name': firstName
                    });
                    
                    return { 
                        success: false, 
                        error: error.message 
                    };
                }
                
                // Exponential backoff retry delay
                await new Promise(resolve => 
                    setTimeout(resolve, DIGITAL_GRANDPA_CONFIG.webhook.retryDelay * Math.pow(2, attempt - 1))
                );
            }
        }
    },

    // Main form submission with enhanced validation and error handling
    async submitEmail() {
        try {
            // Prevent multiple submissions
            if (this.submissionInProgress) {
                console.log('Submission already in progress');
                return;
            }

            const firstNameEl = Utils.safeQuerySelector('#firstName');
            const emailEl = Utils.safeQuerySelector('#emailAddress');
            const submitButton = Utils.safeQuerySelector('.email-submit');
            
            if (!firstNameEl || !emailEl || !submitButton) {
                console.error('Required form elements not found');
                this.showFormMessage('Form error. Please refresh the page and try again.', 'error');
                return;
            }

            const firstName = firstNameEl.value;
            const email = emailEl.value;
            
            // Enhanced validation
            const errors = this.validateForm(firstName, email);
            if (errors.length > 0) {
                this.showFormMessage(errors.join('<br>'), 'error');
                return;
            }

            this.submissionInProgress = true;

            // Show enhanced loading state
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = DIGITAL_GRANDPA_CONFIG.messaging.loadingText;
            submitButton.style.opacity = '0.7';

            try {
                const result = await this.submitToGHL(firstName, email);
                
                if (result.success) {
                    // Store enhanced access credentials
                    const accessData = {
                        verified: true,
                        name: firstName,
                        email: email,
                        timestamp: Date.now(),
                        veteran: this.isVeteran || false,
                        submission_attempt: result.attempt,
                        session_id: Utils.generateUUID()
                    };
                    
                    Utils.safeStorageSet('digitalGrandpaAccess', accessData);

                    // Show personalized success message
                    const welcomeMessage = this.isVeteran ? 
                        `Welcome to the family, ${firstName}. Thank you for your service.` :
                        `${DIGITAL_GRANDPA_CONFIG.messaging.successText}, ${firstName}!`;
                    
                    this.showFormMessage(welcomeMessage, 'success');

                    // Track successful email capture
                    if (typeof Analytics !== 'undefined') {
                        Analytics.trackConversion('email_capture_success', {
                            source: 'homepage_modal',
                            email: email,
                            firstName: firstName,
                            isVeteran: this.isVeteran
                        });
                    }

                    // Auto-close and redirect to thank you page
                    setTimeout(() => {
                        this.hideEmailModal();
                        // Redirect to thank you page with tracking parameters
                        window.location.href = `/thank-you.html?source=homepage&campaign=email_signup&veteran=${this.isVeteran}`;
                    }, 2000);

                } else {
                    // Enhanced error handling
                    this.showFormMessage(
                        `I'm having trouble connecting right now, ${firstName}. Please try again in a moment, or email me directly at info@digitalgrandpa.org`, 
                        'error'
                    );
                }
                
            } catch (error) {
                console.error('Submission error:', error);
                this.showFormMessage('Connection error. Please check your internet and try again.', 'error');
            } finally {
                // Reset button state
                this.submissionInProgress = false;
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                submitButton.style.opacity = '1';
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.submissionInProgress = false;
            this.showFormMessage('An unexpected error occurred. Please try again.', 'error');
        }
    },

    // Enhanced form message display
    showFormMessage(message, type) {
        try {
            // Remove existing message
            const existingMessage = Utils.safeQuerySelector('.form-message');
            if (existingMessage && existingMessage.parentNode) {
                existingMessage.parentNode.removeChild(existingMessage);
            }

            // Create enhanced message element
            const messageEl = document.createElement('div');
            messageEl.className = `form-message ${type}`;
            messageEl.innerHTML = message; // Allow HTML for multiple errors
            messageEl.setAttribute('role', 'alert');
            messageEl.setAttribute('aria-live', 'polite');
            
            // Insert after form
            const form = Utils.safeQuerySelector('.email-form');
            if (form && form.parentNode) {
                form.parentNode.insertBefore(messageEl, form.nextSibling);
            }
            
            // Auto-remove error messages after 5 seconds
            if (type === 'error') {
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Error showing form message:', error);
        }
    },

    // Handle pending resource access
    handlePendingResource(userName) {
        try {
            // Check if this was for Rise & Reclaim checkout
            const pendingCheckout = Utils.safeStorageGet('pendingRiseReclaimCheckout');
            if (pendingCheckout) {
                sessionStorage.removeItem('pendingRiseReclaimCheckout');
                const access = Utils.safeStorageGet('digitalGrandpaAccess') || {};
                initiateStripeCheckout(access.email, access.name);
                return;
            }
            
            // Handle regular resource delivery
            const pendingResource = Utils.safeStorageGet('pendingResourceAccess');
            if (pendingResource) {
                sessionStorage.removeItem('pendingResourceAccess');
                this.deliverResource(pendingResource, userName);
            }
        } catch (error) {
            console.error('Error handling pending resource:', error);
        }
    },

    // Enhanced resource delivery with download modal
    deliverResource(resourceName, userName) {
        try {
            console.log(`🎁 Delivering "${resourceName}" to ${userName}`);
            
            const resource = DIGITAL_GRANDPA_CONFIG.resources[resourceName];
            if (!resource) {
                console.error('Resource not found:', resourceName);
                this.showToast(`Resource "${resourceName}" not found`, 'error');
                return;
            }
            
            // Track delivery
            this.trackEvent('resource_delivered', {
                'resource_name': resourceName,
                'user_name': userName,
                'resource_type': resource.type
            });

            // Show download modal for files
            if (resource.type !== 'redirect') {
                this.showDownloadModal(resource, resourceName, userName);
            } else {
                // Direct redirect for community access
                window.open(resource.url, '_blank');
            }
        } catch (error) {
            console.error('Error delivering resource:', error);
            this.showToast('Error delivering resource. Please contact support.', 'error');
        }
    },

    // Initiate actual download with fallback support
    initiateDownload(url, resourceName, fallbackUrl) {
        try {
            console.log('💾 Starting download:', resourceName);
            
            // Track download initiation
            this.trackEvent('download_initiated', {
                'resource_name': resourceName,
                'download_url': url
            });
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = resourceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + this.getFileExtension(url);
            link.target = '_blank';
            
            // Add error handling for failed downloads
            link.onerror = () => {
                console.warn('Primary download failed, trying fallback:', fallbackUrl);
                if (fallbackUrl) {
                    window.open(fallbackUrl, '_blank');
                } else {
                    this.showToast('Download failed. Please contact support.', 'error');
                }
            };
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            this.showToast(`Download started: ${resourceName}`, 'success');
        } catch (error) {
            console.error('Error initiating download:', error);
            this.showToast('Download failed. Please try again.', 'error');
        }
    },

    // Get file extension from URL
    getFileExtension(url) {
        try {
            const path = url.split('?')[0];
            const extension = path.split('.').pop();
            return extension ? `.${extension}` : '';
        } catch (error) {
            console.warn('Error getting file extension:', error);
            return '';
        }
    },

    // Show toast notification with enhanced styling
    showToast(message, type = 'info') {
        try {
            // Remove existing toast
            const existingToast = Utils.safeQuerySelector('.toast');
            if (existingToast && existingToast.parentNode) {
                existingToast.parentNode.removeChild(existingToast);
            }
            
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            toast.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#3498db'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 4000;
                animation: slideInRight 0.3s ease-out;
                font-size: 14px;
                max-width: 300px;
                word-wrap: break-word;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideOutRight 0.3s ease-out';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    },

    // Enhanced analytics tracking with error handling
    trackEvent(eventName, parameters = {}) {
        try {
            if (!DIGITAL_GRANDPA_CONFIG.analytics.enabled) return;

            const eventData = {
                'custom_parameter_1': 'digital_grandpa',
                'timestamp': new Date().toISOString(),
                'page_url': window.location.href,
                ...parameters
            };

            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, eventData);
            }
            
            // Facebook Pixel (if available)
            if (typeof fbq !== 'undefined') {
                fbq('track', 'CustomEvent', {
                    event_name: eventName,
                    ...eventData
                });
            }
            
            // Console logging for development
            if (DIGITAL_GRANDPA_CONFIG.analytics.debug) {
                console.log(`📊 Event tracked: ${eventName}`, eventData);
            }
        } catch (error) {
            console.warn('Error tracking event:', error);
        }
    }
};

// FIXED: Resource Access Control with enhanced error handling
function accessResource(resourceName) {
    try {
        console.log('🔍 Resource requested:', resourceName);
        
        // Track resource access attempt
        FormHandler.trackEvent('resource_access_attempted', {
            'resource_name': resourceName
        });
        
        // Check if user is verified
        const access = Utils.safeStorageGet('digitalGrandpaAccess') || {};
        
        if (access.verified && access.name) {
            // Immediate access for verified users
            FormHandler.deliverResource(resourceName, access.name);
        } else {
            // Store requested resource and show email modal
            Utils.safeStorageSet('pendingResourceAccess', resourceName);
            
            // Set modal trigger for analytics
            FormHandler.lastModalTrigger = 'resource_request';
            
            // Customize modal for specific resource
            const modalTitle = Utils.safeQuerySelector('#emailModalTitle');
            const modalDescription = Utils.safeQuerySelector('#emailModalDescription');
            
            if (modalTitle) {
                modalTitle.textContent = `Get "${resourceName}"`;
            }
            
            if (modalDescription) {
                modalDescription.textContent = `Enter your name and email to access "${resourceName}" and join thousands transforming their setbacks into comebacks.`;
            }
            
            FormHandler.showEmailModal();
        }
    } catch (error) {
        console.error('Error accessing resource:', error);
        FormHandler.showToast('Error accessing resource. Please try again.', 'error');
    }
}

// FIXED: Enhanced Section Navigation with error handling and progress tracking
function showSection(sectionId) {
    try {
        console.log('🧭 Navigating to section:', sectionId);
        
        // Hide all sections first
        const sections = Utils.safeQuerySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = Utils.safeQuerySelector(`#${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            
            // Special handling for hero section
            if (sectionId === 'home') {
                targetSection.style.display = 'flex';
            }
            
            // Update progress indicator
            updateProgressIndicator(sectionId);
            
            // Smooth scroll to top of section
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 100);
            
            // Update URL hash without triggering scroll
            if (history.pushState) {
                history.pushState(null, null, `#${sectionId}`);
            }
        } else {
            console.error('Section not found:', sectionId);
            return;
        }
        
        // Update navigation active states
        const navLinks = Utils.safeQuerySelectorAll('.nav-link, .nav-link-mobile');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current navigation items
        const activeNavLinks = Utils.safeQuerySelectorAll(`[data-section="${sectionId}"]`);
        activeNavLinks.forEach(link => {
            link.classList.add('active');
        });
        
        // Close mobile menu if open
        const mobileNav = Utils.safeQuerySelector('#mobileNav');
        if (mobileNav && mobileNav.classList.contains('active')) {
            toggleMobileMenu();
        }
        
        // Track section navigation
        FormHandler.trackEvent('section_viewed', {
            'section_name': sectionId,
            'navigation_method': 'menu_click'
        });
    } catch (error) {
        console.error('Error showing section:', error);
    }
}

// FIXED: Progress Indicator Management - REMOVED COMPLETELY
function updateProgressIndicator(sectionId) {
    // Progress indicator completely removed to eliminate double menu
    return;
}

// FIXED: Mobile Menu Toggle with error handling
function toggleMobileMenu() {
    try {
        const mobileNav = Utils.safeQuerySelector('#mobileNav');
        const hamburger = Utils.safeQuerySelector('.hamburger-menu');
        
        if (mobileNav && hamburger) {
            const isActive = mobileNav.classList.toggle('active');
            hamburger.classList.toggle('active');
            
            // Properly show/hide mobile menu
            if (isActive) {
                mobileNav.style.display = 'flex';
            } else {
                mobileNav.style.display = 'none';
            }
            
            // Track mobile menu usage
            FormHandler.trackEvent('mobile_menu_toggled', {
                'action': isActive ? 'opened' : 'closed'
            });
        }
    } catch (error) {
        console.error('Error toggling mobile menu:', error);
    }
}

// Rise & Reclaim Functions with error handling
function learnMoreRiseReclaim() {
    try {
        FormHandler.trackEvent('rise_reclaim_learn_more_clicked', {
            'source_page': 'digital_grandpa_main',
            'button_location': 'rise_reclaim_section'
        });
        
        console.log('🔗 Redirecting to Rise & Reclaim info page');
        window.open('https://joinriseandreclaim.com', '_blank');
    } catch (error) {
        console.error('Error in learnMoreRiseReclaim:', error);
    }
}

function joinRiseReclaim() {
    try {
        FormHandler.trackEvent('rise_reclaim_join_clicked', {
            'source_page': 'digital_grandpa_main',
            'button_location': 'rise_reclaim_section'
        });
        
        console.log('💳 Initiating Rise & Reclaim membership checkout');
        
        const access = Utils.safeStorageGet('digitalGrandpaAccess') || {};
        
        if (access.verified && access.email) {
            initiateStripeCheckout(access.email, access.name);
        } else {
            FormHandler.lastModalTrigger = 'rise_reclaim_join';
            
            const modalTitle = Utils.safeQuerySelector('#emailModalTitle');
            const modalDescription = Utils.safeQuerySelector('#emailModalDescription');
            
            if (modalTitle && modalDescription) {
                modalTitle.textContent = 'Join Rise & Reclaim Community';
                modalDescription.textContent = 'Enter your details below to proceed to secure checkout for Rise & Reclaim membership. Transform your setbacks into comebacks with our proven community framework.';
            }
            
            Utils.safeStorageSet('pendingRiseReclaimCheckout', true);
            FormHandler.showEmailModal();
        }
    } catch (error) {
        console.error('Error in joinRiseReclaim:', error);
    }
}

function initiateStripeCheckout(email, name) {
    try {
        FormHandler.trackEvent('stripe_checkout_initiated', {
            'product': 'rise_reclaim_membership',
            'user_email': email,
            'user_name': name
        });
        
        console.log('🔥 Starting Stripe checkout for Rise & Reclaim');
        
        const stripeCheckoutData = {
            email: email,
            name: name,
            product: 'rise_reclaim_membership',
            source: 'digital_grandpa_website',
            timestamp: new Date().toISOString()
        };
        
        const joinButton = Utils.safeQuerySelector('.phoenix-join');
        if (joinButton) {
            const originalText = joinButton.textContent;
            joinButton.textContent = 'Redirecting to Checkout...';
            joinButton.disabled = true;
            
            setTimeout(() => {
                joinButton.textContent = originalText;
                joinButton.disabled = false;
            }, 3000);
        }
        
        // Replace this URL with your actual Stripe checkout session URL
        const checkoutUrl = `https://checkout.stripe.com/your-actual-checkout-session-id?prefilled_email=${encodeURIComponent(email)}`;
        window.location.href = checkoutUrl;
        
    } catch (error) {
        console.error('Stripe checkout error:', error);
        FormHandler.showToast('Unable to start checkout. Please try again.', 'error');
        
        FormHandler.trackEvent('stripe_checkout_error', {
            'error': error.message,
            'user_email': email
        });
    }
}

// FIXED: Scroll-Based Features - Progress Indicator Removed
const handleScroll = Utils.throttle(() => {
    try {
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = scrolled / (documentHeight - windowHeight);
        
        // Progress indicator completely removed
        
        // Show floating CTA
        const floatingCTA = Utils.safeQuerySelector('#floatingCTA');
        if (floatingCTA && scrollPercentage > DIGITAL_GRANDPA_CONFIG.ui.scrollThreshold) {
            floatingCTA.classList.add('visible');
        }
    } catch (error) {
        console.error('Error in scroll handler:', error);
    }
}, 16); // ~60fps

// Exit Intent Detection with enhanced logic
function handleExitIntent(e) {
    try {
        if (e.clientY <= 0 && !Utils.safeStorageGet('exitIntentShown')) {
            Utils.safeStorageSet('exitIntentShown', true);
            
            FormHandler.lastModalTrigger = 'exit_intent';
            
            const modalTitle = Utils.safeQuerySelector('#emailModalTitle');
            const modalDescription = Utils.safeQuerySelector('#emailModalDescription');
            
            if (modalTitle && modalDescription) {
                modalTitle.textContent = 'Before you go...';
                modalDescription.textContent = 'Join 1,200+ others who\'ve transformed their setbacks into comebacks. Get instant access to all free resources.';
            }
            
            FormHandler.showEmailModal();
            
            FormHandler.trackEvent('exit_intent_triggered', {
                'page_section': Utils.safeQuerySelector('.section.active')?.id || 'unknown'
            });
        }
    } catch (error) {
        console.error('Error in exit intent handler:', error);
    }
}

// FIXED: URL Hash Handling for Direct Section Access
function handleHashChange() {
    try {
        const hash = window.location.hash.substring(1);
        if (hash && Utils.safeQuerySelector(`#${hash}`)) {
            showSection(hash);
        }
    } catch (error) {
        console.error('Error handling hash change:', error);
    }
}

// Enhanced Event Listeners and Initialization with comprehensive error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Digital Grandpa: Complete site loaded with enhanced error handling');
        
        // FIXED: Ensure proper section visibility on load
        const sections = Utils.safeQuerySelectorAll('.section');
        sections.forEach(section => {
            if (section.classList.contains('active')) {
                section.style.display = section.id === 'home' ? 'flex' : 'block';
            } else {
                section.style.display = 'none';
            }
        });
        
        // Handle initial hash in URL
        const initialHash = window.location.hash.substring(1);
        if (initialHash && Utils.safeQuerySelector(`#${initialHash}`)) {
            showSection(initialHash);
        }
        
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
        
        // FIXED: Set up all navigation event listeners with direct onclick handlers
        const navElements = Utils.safeQuerySelectorAll('[data-section]');
        navElements.forEach(element => {
            element.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section');
                    if (sectionId) {
                        showSection(sectionId);
                    }
                } catch (error) {
                    console.error('Error in navigation click:', error);
                }
            });
            
            // Also add onclick attribute for immediate functionality
            const sectionId = element.getAttribute('data-section');
            if (sectionId) {
                element.setAttribute('onclick', `showSection('${sectionId}')`);
            }
        });
        
        // FIXED: Set up all resource access event listeners with direct onclick handlers
        const resourceElements = Utils.safeQuerySelectorAll('[data-resource]');
        resourceElements.forEach(element => {
            element.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    const resourceName = this.getAttribute('data-resource');
                    if (resourceName) {
                        accessResource(resourceName);
                    }
                } catch (error) {
                    console.error('Error in resource access click:', error);
                }
            });
            
            // Also add onclick attribute for immediate functionality
            const resourceName = element.getAttribute('data-resource');
            if (resourceName) {
                element.setAttribute('onclick', `accessResource('${resourceName}')`);
            }
        });
        
        // FIXED: Set up Rise & Reclaim buttons with error handling
        const phoenixJoinButtons = Utils.safeQuerySelectorAll('.phoenix-join');
        phoenixJoinButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    joinRiseReclaim();
                } catch (error) {
                    console.error('Error in phoenix join click:', error);
                }
            });
        });
        
        const phoenixLearnButtons = Utils.safeQuerySelectorAll('.phoenix-learn');
        phoenixLearnButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    learnMoreRiseReclaim();
                } catch (error) {
                    console.error('Error in phoenix learn click:', error);
                }
            });
        });
        
        // FIXED: Set up floating CTA with error handling
        const floatingCTA = Utils.safeQuerySelector('.floating-btn');
        if (floatingCTA) {
            floatingCTA.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    FormHandler.lastModalTrigger = 'floating_cta';
                    FormHandler.showEmailModal();
                } catch (error) {
                    console.error('Error in floating CTA click:', error);
                }
            });
        }
        
        // FIXED: Set up hamburger menu with error handling
        const hamburgerMenu = Utils.safeQuerySelector('.hamburger-menu');
        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    toggleMobileMenu();
                } catch (error) {
                    console.error('Error in hamburger menu click:', error);
                }
            });
        }
        
        // FIXED: Global click handlers for modal closing with error handling
        document.addEventListener('click', function(event) {
            try {
                // Close modal when clicking backdrop
                if (event.target.classList.contains('email-modal') || 
                    event.target.classList.contains('download-modal')) {
                    ModalManager.closeAllModals();
                }
                
                // Handle close button clicks
                if (event.target.classList.contains('modal-close') ||
                    event.target.classList.contains('close-download')) {
                    ModalManager.closeAllModals();
                }
            } catch (error) {
                console.error('Error in global click handler:', error);
            }
        });
        
        // FIXED: Enhanced keyboard handling with error handling
        document.addEventListener('keydown', function(event) {
            try {
                // Escape key closes all modals
                if (event.key === 'Escape') {
                    ModalManager.closeAllModals();
                }
                
                // Enter key in email form
                if (event.key === 'Enter' && ModalManager.activeModal === 'emailModal') {
                    const firstName = Utils.safeQuerySelector('#firstName');
                    const email = Utils.safeQuerySelector('#emailAddress');
                    
                    if (document.activeElement === firstName || document.activeElement === email) {
                        event.preventDefault();
                        FormHandler.submitEmail();
                    }
                }
            } catch (error) {
                console.error('Error in keyboard handler:', error);
            }
        });
        
        // FIXED: Form submission handler with error handling
        const emailForm = Utils.safeQuerySelector('.email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', function(event) {
                try {
                    event.preventDefault();
                    FormHandler.submitEmail();
                } catch (error) {
                    console.error('Error in form submission:', error);
                }
            });
        }
        
        // FIXED: Progress step click handlers with error handling
        const progressSteps = Utils.safeQuerySelectorAll('.progress-step');
        progressSteps.forEach(step => {
            step.addEventListener('click', () => {
                try {
                    const sectionId = step.dataset.section;
                    if (sectionId) {
                        showSection(sectionId);
                    }
                } catch (error) {
                    console.error('Error in progress step click:', error);
                }
            });
        });
        
        // Welcome back returning users
        const access = Utils.safeStorageGet('digitalGrandpaAccess') || {};
        if (access.verified && access.name) {
            const welcomeMessage = access.veteran ? 
                `👋 Welcome back, ${access.name}. Thank you for your service.` :
                `👋 Welcome back, ${access.name}!`;
            console.log(welcomeMessage);
            FormHandler.showToast(welcomeMessage, 'success');
        }
        
        // Set up scroll handling with throttling
        window.addEventListener('scroll', handleScroll);
        
        // Set up exit intent detection
        if (DIGITAL_GRANDPA_CONFIG.ui.exitIntentEnabled) {
            document.addEventListener('mouseleave', handleExitIntent);
        }
        
        // Show floating CTA after delay
        setTimeout(() => {
            try {
                const floatingCTA = Utils.safeQuerySelector('#floatingCTA');
                if (floatingCTA && !Utils.safeStorageGet('digitalGrandpaAccess')) {
                    floatingCTA.classList.add('visible');
                }
            } catch (error) {
                console.error('Error showing floating CTA:', error);
            }
        }, DIGITAL_GRANDPA_CONFIG.ui.floatingCTADelay);
        
        // Track initial page load
        FormHandler.trackEvent('page_loaded', {
            'page_title': document.title,
            'user_agent': navigator.userAgent,
            'screen_resolution': `${screen.width}x${screen.height}`,
            'returning_user': !!Utils.safeStorageGet('digitalGrandpaAccess'),
            'load_time': performance.now()
        });
        
    } catch (error) {
        console.error('Error during DOMContentLoaded:', error);
        // Fallback: at least try to show the basic site
        const homeSection = Utils.safeQuerySelector('#home');
        if (homeSection) {
            homeSection.style.display = 'flex';
            homeSection.classList.add('active');
        }
    }
});

// Error boundary for unhandled errors
window.addEventListener('error', function(event) {
    console.error('Unhandled error:', event.error);
    FormHandler.trackEvent('javascript_error', {
        'error_message': event.message,
        'error_filename': event.filename,
        'error_lineno': event.lineno,
        'error_colno': event.colno
    });
});

// Error boundary for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    FormHandler.trackEvent('promise_rejection', {
        'error_reason': event.reason?.toString() || 'Unknown'
    });
});

// Export for global access and testing
window.DigitalGrandpa = {
    FormHandler,
    ModalManager,
    Utils,
    accessResource,
    showSection,
    toggleMobileMenu,
    config: DIGITAL_GRANDPA_CONFIG
};

// Make functions globally available for onclick handlers
window.showSection = showSection;
window.accessResource = accessResource;
window.toggleMobileMenu = toggleMobileMenu;
window.FormHandler = FormHandler;

// Google Analytics 4 Integration
const Analytics = {
    initialized: false,
    
    // Initialize Google Analytics
    init() {
        if (!DIGITAL_GRANDPA_CONFIG.analytics.enabled || this.initialized) {
            return;
        }
        
        try {
            // Load Google Analytics script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${DIGITAL_GRANDPA_CONFIG.analytics.gaTrackingId}`;
            document.head.appendChild(script);
            
            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            
            gtag('js', new Date());
            gtag('config', DIGITAL_GRANDPA_CONFIG.analytics.gaTrackingId, {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                    'custom_parameter_1': 'veteran_status',
                    'custom_parameter_2': 'user_segment'
                }
            });
            
            this.initialized = true;
            
            if (DIGITAL_GRANDPA_CONFIG.analytics.debug) {
                console.log('✅ Google Analytics initialized');
            }
            
        } catch (error) {
            console.error('Failed to initialize Google Analytics:', error);
        }
    },
    
    // Track events
    trackEvent(eventName, parameters = {}) {
        if (!this.initialized || !window.gtag) {
            if (DIGITAL_GRANDPA_CONFIG.analytics.debug) {
                console.log('Analytics not initialized, queuing event:', eventName, parameters);
            }
            return;
        }
        
        try {
            // Add default parameters
            const eventData = {
                event_category: 'Digital Grandpa',
                event_label: parameters.label || '',
                value: parameters.value || 0,
                ...parameters
            };
            
            window.gtag('event', eventName, eventData);
            
            if (DIGITAL_GRANDPA_CONFIG.analytics.debug) {
                console.log('📊 Analytics event tracked:', eventName, eventData);
            }
            
        } catch (error) {
            console.error('Failed to track analytics event:', error);
        }
    },
    
    // Track page views
    trackPageView(pagePath, pageTitle) {
        if (!this.initialized || !window.gtag) {
            return;
        }
        
        try {
            window.gtag('config', DIGITAL_GRANDPA_CONFIG.analytics.gaTrackingId, {
                page_path: pagePath,
                page_title: pageTitle
            });
            
            if (DIGITAL_GRANDPA_CONFIG.analytics.debug) {
                console.log('📄 Page view tracked:', pagePath, pageTitle);
            }
            
        } catch (error) {
            console.error('Failed to track page view:', error);
        }
    },
    
    // Track conversions
    trackConversion(conversionName, value = 0, currency = 'USD') {
        this.trackEvent('conversion', {
            event_category: 'Conversions',
            event_label: conversionName,
            value: value,
            currency: currency
        });
    },
    
    // Track email signups
    trackEmailSignup(userType = 'general') {
        this.trackConversion('email_signup', 1);
        this.trackEvent('generate_lead', {
            event_category: 'Lead Generation',
            event_label: 'Email Signup',
            user_type: userType
        });
    },
    
    // Track Rise & Reclaim clicks
    trackRiseClick(location = 'unknown') {
        this.trackEvent('rise_reclaim_click', {
            event_category: 'External Links',
            event_label: 'Rise & Reclaim',
            click_location: location
        });
    },
    
    // Track form interactions
    trackFormStart(formType) {
        this.trackEvent('form_start', {
            event_category: 'Form Interaction',
            event_label: formType,
            form_type: formType
        });
    },
    
    trackFormFieldFocus(formType, fieldName) {
        this.trackEvent('form_field_focus', {
            event_category: 'Form Interaction',
            event_label: `${formType} - ${fieldName}`,
            form_type: formType,
            field_name: fieldName
        });
    },
    
    trackFormValidationError(formType, errorType) {
        this.trackEvent('form_validation_error', {
            event_category: 'Form Errors',
            event_label: `${formType} - ${errorType}`,
            form_type: formType,
            error_type: errorType
        });
    },
    
    trackFormSubmissionAttempt(formType) {
        this.trackEvent('form_submit_attempt', {
            event_category: 'Form Interaction',
            event_label: formType,
            form_type: formType
        });
    },
    
    trackFormSubmissionSuccess(formType, additionalData = {}) {
        this.trackConversion(`${formType}_submission`, 1);
        this.trackEvent('form_submit_success', {
            event_category: 'Form Interaction',
            event_label: formType,
            form_type: formType,
            ...additionalData
        });
    },
    
    trackFormSubmissionError(formType, errorMessage) {
        this.trackEvent('form_submit_error', {
            event_category: 'Form Errors',
            event_label: formType,
            form_type: formType,
            error_message: errorMessage
        });
    },
    
    // Track user engagement
    trackTimeOnPage() {
        const startTime = Date.now();
        
        // Track time spent when user leaves page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            this.trackEvent('time_on_page', {
                event_category: 'Engagement',
                event_label: window.location.pathname,
                value: timeSpent,
                time_spent_seconds: timeSpent
            });
        });
    },
    
    // Track scroll depth
    trackScrollDepth() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const tracked = new Set();
        
        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.trackEvent('scroll_depth', {
                        event_category: 'Engagement',
                        event_label: `${milestone}%`,
                        value: milestone,
                        scroll_depth: milestone
                    });
                }
            });
        };
        
        window.addEventListener('scroll', Utils.throttle(trackScroll, 1000));
    },
    
    // Track veteran detection
    trackVeteranDetection(method, confidence = 'unknown') {
        this.trackEvent('veteran_detected', {
            event_category: 'User Segmentation',
            event_label: method,
            detection_method: method,
            confidence_level: confidence
        });
    },
    
    // Track crisis support interactions
    trackCrisisSupportClick(supportType) {
        this.trackEvent('crisis_support_click', {
            event_category: 'Crisis Support',
            event_label: supportType,
            support_type: supportType
        });
    }
};

// Enhanced FormHandler with Analytics Integration
const OriginalFormHandler = FormHandler;
FormHandler.trackEvent = function(eventName, parameters = {}) {
    Analytics.trackEvent(eventName, parameters);
};

// Override the original submitToGHL to include analytics
const originalSubmitToGHL = FormHandler.submitToGHL;
FormHandler.submitToGHL = async function(firstName, email) {
    // Track form submission attempt
    Analytics.trackEvent('form_submit_attempt', {
        event_category: 'Form Interaction',
        event_label: 'Email Capture'
    });
    
    const result = await originalSubmitToGHL.call(this, firstName, email);
    
    if (result.success) {
        // Track successful email signup
        Analytics.trackEmailSignup(this.isVeteran ? 'veteran' : 'general');
    }
    
    return result;
};

// Initialize Analytics when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Analytics
    Analytics.init();
    
    // Track initial page view
    Analytics.trackPageView(window.location.pathname, document.title);
    
    // Track Rise & Reclaim clicks
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a[href*="joinriseandreclaim.com"], .rise-cta');
        if (target) {
            const location = target.classList.contains('nav-link') ? 'navigation' :
                           target.classList.contains('btn-rise') ? 'hero_button' :
                           target.classList.contains('floating-btn') ? 'floating_cta' :
                           'unknown';
            Analytics.trackRiseClick(location);
        }
    });
    
    // Track section navigation
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionId) {
            Analytics.trackEvent('section_navigation', {
                event_category: 'Navigation',
                event_label: sectionId,
                section_name: sectionId
            });
            return originalShowSection(sectionId);
        };
    }
});



// Contact Form Handler
const ContactFormHandler = {
    submissionInProgress: false,

    // Initialize contact form
    init() {
        try {
            const contactForm = Utils.safeQuerySelector('#contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', this.handleSubmit.bind(this));
                console.log('✅ Contact form initialized');
            }
        } catch (error) {
            console.error('Error initializing contact form:', error);
        }
    },

    // Handle contact form submission
    async handleSubmit(event) {
        event.preventDefault();
        
        if (this.submissionInProgress) {
            console.log('Contact form submission already in progress');
            return;
        }

        try {
            const form = event.target;
            const formData = new FormData(form);
            
            const contactData = {
                name: formData.get('name')?.trim() || '',
                email: formData.get('email')?.trim() || '',
                subject: formData.get('subject')?.trim() || '',
                message: formData.get('message')?.trim() || ''
            };

            // Validate form data
            const errors = this.validateContactForm(contactData);
            if (errors.length > 0) {
                this.showContactMessage(errors.join('<br>'), 'error');
                return;
            }

            this.submissionInProgress = true;
            
            // Update submit button
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending Message...';

            // Submit to GHL
            const result = await this.submitContactToGHL(contactData);
            
            if (result.success) {
                // Track successful contact form submission
                Analytics.trackEvent('contact_form_success', {
                    event_category: 'Contact Form',
                    event_label: contactData.subject,
                    contact_subject: contactData.subject
                });

                this.showContactMessage(
                    `Thank you, ${contactData.name}! Your message has been sent. We'll respond within 24-48 hours.`,
                    'success'
                );
                
                // Reset form after success
                form.reset();
                
                // Test email to Jarvis if this is a test submission
                if (contactData.email === 'jarvis@joinriseandreclaim.com' || 
                    contactData.message.toLowerCase().includes('test')) {
                    console.log('🧪 Test submission detected - triggering test automation');
                }

            } else {
                this.showContactMessage(
                    'Sorry, there was an issue sending your message. Please try again or email us directly at info@digitalgrandpa.org',
                    'error'
                );
                
                // Track failed submission
                Analytics.trackEvent('contact_form_error', {
                    event_category: 'Contact Form',
                    event_label: 'Submission Failed',
                    error_message: result.error || 'Unknown error'
                });
            }

        } catch (error) {
            console.error('Contact form submission error:', error);
            this.showContactMessage(
                'An unexpected error occurred. Please try again or email us directly.',
                'error'
            );
        } finally {
            this.submissionInProgress = false;
            
            // Reset submit button
            const submitButton = event.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        }
    },

    // Validate contact form data
    validateContactForm(data) {
        const errors = [];
        
        try {
            // Name validation
            if (!data.name || data.name.length < 2) {
                errors.push('Please enter your full name (at least 2 characters)');
            }
            
            // Email validation
            if (!Utils.isValidEmail(data.email)) {
                errors.push('Please enter a valid email address');
            }
            
            // Subject validation
            if (!data.subject) {
                errors.push('Please select a subject for your message');
            }
            
            // Message validation
            if (!data.message || data.message.length < 10) {
                errors.push('Please enter a message (at least 10 characters)');
            }
            
            if (data.message && data.message.length > 2000) {
                errors.push('Message is too long (maximum 2000 characters)');
            }
            
        } catch (error) {
            console.error('Error validating contact form:', error);
            errors.push('Validation error occurred. Please try again.');
        }
        
        return errors;
    },

    // Submit contact form to GHL
    async submitContactToGHL(contactData) {
        const payload = {
            firstName: contactData.name.split(' ')[0] || contactData.name,
            lastName: contactData.name.split(' ').slice(1).join(' ') || '',
            email: contactData.email,
            phone: '', // Contact form doesn't collect phone
            tag: DIGITAL_GRANDPA_CONFIG.webhook.contactTag,
            source: 'digitalgrandpa_contact_form',
            subject: contactData.subject,
            message: contactData.message,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            session_id: Utils.generateUUID(),
            form_type: 'contact_form'
        };

        console.log('Digital Grandpa: Submitting contact form to GHL', payload);

        for (let attempt = 1; attempt <= DIGITAL_GRANDPA_CONFIG.webhook.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), DIGITAL_GRANDPA_CONFIG.webhook.timeout);

                const response = await fetch(DIGITAL_GRANDPA_CONFIG.webhook.contactFormUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'User-Agent': 'DigitalGrandpa/1.0'
                    },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok || response.status === 200) {
                    console.log(`✅ Contact form GHL submission successful (attempt ${attempt})`);
                    return { success: true, attempt };
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

            } catch (error) {
                console.warn(`❌ Contact form GHL attempt ${attempt} failed:`, error.message);
                
                if (attempt === DIGITAL_GRANDPA_CONFIG.webhook.retryAttempts) {
                    return { 
                        success: false, 
                        error: error.message 
                    };
                }
                
                // Exponential backoff retry delay
                await new Promise(resolve => 
                    setTimeout(resolve, DIGITAL_GRANDPA_CONFIG.webhook.retryDelay * Math.pow(2, attempt - 1))
                );
            }
        }
    },

    // Show contact form message
    showContactMessage(message, type) {
        try {
            // Remove existing message
            const existingMessage = Utils.safeQuerySelector('.contact-form-message');
            if (existingMessage && existingMessage.parentNode) {
                existingMessage.parentNode.removeChild(existingMessage);
            }

            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = `contact-form-message ${type}`;
            messageEl.innerHTML = message;
            messageEl.setAttribute('role', 'alert');
            messageEl.setAttribute('aria-live', 'polite');
            
            // Style the message
            messageEl.style.cssText = `
                padding: 1rem;
                margin: 1rem 0;
                border-radius: 4px;
                font-weight: 500;
                ${type === 'success' ? 
                    'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
                    'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
                }
            `;

            // Insert message after form
            const form = Utils.safeQuerySelector('#contactForm');
            if (form && form.parentNode) {
                form.parentNode.insertBefore(messageEl, form.nextSibling);
                
                // Auto-remove success messages after 5 seconds
                if (type === 'success') {
                    setTimeout(() => {
                        if (messageEl && messageEl.parentNode) {
                            messageEl.parentNode.removeChild(messageEl);
                        }
                    }, 5000);
                }
            }
            
        } catch (error) {
            console.error('Error showing contact form message:', error);
        }
    }
};

// Enhanced Analytics with Contact Form Tracking
const OriginalAnalyticsTrackEvent = Analytics.trackEvent;
Analytics.trackEvent = function(eventName, parameters = {}) {
    // Call original tracking
    OriginalAnalyticsTrackEvent.call(this, eventName, parameters);
    
    // Additional contact form specific tracking
    if (eventName === 'contact_form_success') {
        // Track as conversion
        this.trackConversion('contact_form_submission', 1);
        
        // Track specific subject categories
        const subject = parameters.contact_subject || '';
        if (subject.includes('support') || subject.includes('general')) {
            this.trackEvent('support_request', {
                event_category: 'Support',
                event_label: 'Contact Form'
            });
        } else if (subject.includes('media') || subject.includes('speaking')) {
            this.trackEvent('media_inquiry', {
                event_category: 'Media',
                event_label: 'Contact Form'
            });
        } else if (subject.includes('partnership')) {
            this.trackEvent('partnership_inquiry', {
                event_category: 'Partnerships',
                event_label: 'Contact Form'
            });
        }
    }
};

// Initialize contact form when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact form handler
    ContactFormHandler.init();
    
    // Track contact page view if on contact page
    if (window.location.pathname.includes('contact')) {
        Analytics.trackPageView('/contact', 'Contact - Digital Grandpa');
        Analytics.trackEvent('contact_page_view', {
            event_category: 'Page Views',
            event_label: 'Contact Page'
        });
    }
});


// Enhanced Form Tracking Integration
const FormTracker = {
    init() {
        this.setupEmailFormTracking();
        this.setupContactFormTracking();
        this.setupCrisisSupportTracking();
        this.setupGeneralFormTracking();
    },

    // Email capture form tracking
    setupEmailFormTracking() {
        const emailForm = Utils.safeQuerySelector('#emailModal form');
        if (emailForm) {
            // Track form start when modal opens
            const emailModal = Utils.safeQuerySelector('#emailModal');
            if (emailModal) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const isVisible = emailModal.style.display !== 'none' && 
                                            !emailModal.style.display.includes('none');
                            if (isVisible) {
                                Analytics.trackFormStart('email_capture');
                            }
                        }
                    });
                });
                observer.observe(emailModal, { attributes: true });
            }

            // Track field focus
            const firstNameField = emailForm.querySelector('#firstName');
            const emailField = emailForm.querySelector('#emailAddress');
            
            if (firstNameField) {
                firstNameField.addEventListener('focus', () => {
                    Analytics.trackFormFieldFocus('email_capture', 'first_name');
                });
            }
            
            if (emailField) {
                emailField.addEventListener('focus', () => {
                    Analytics.trackFormFieldFocus('email_capture', 'email');
                });
                
                // Track veteran email detection
                emailField.addEventListener('blur', () => {
                    const email = emailField.value.toLowerCase();
                    const militaryDomains = [
                        'army.mil', 'navy.mil', 'af.mil', 'marines.mil', 'uscg.mil',
                        'va.gov', 'veteran.', 'vfw.org', 'legion.org'
                    ];
                    
                    const isVeteranEmail = militaryDomains.some(domain => email.includes(domain));
                    if (isVeteranEmail) {
                        Analytics.trackVeteranDetection('email_domain', 'high');
                    }
                });
            }
        }
    },

    // Contact form tracking
    setupContactFormTracking() {
        const contactForm = Utils.safeQuerySelector('#contactForm');
        if (contactForm) {
            // Track form start when user first interacts
            let formStarted = false;
            const trackFormStart = () => {
                if (!formStarted) {
                    Analytics.trackFormStart('contact_form');
                    formStarted = true;
                }
            };

            // Track field focus events
            const fields = contactForm.querySelectorAll('input, select, textarea');
            fields.forEach(field => {
                field.addEventListener('focus', () => {
                    trackFormStart();
                    Analytics.trackFormFieldFocus('contact_form', field.name || field.id);
                });
                
                // Track validation errors
                field.addEventListener('invalid', () => {
                    Analytics.trackFormValidationError('contact_form', field.name || field.id);
                });
            });

            // Track subject selection
            const subjectField = contactForm.querySelector('#contactSubject');
            if (subjectField) {
                subjectField.addEventListener('change', () => {
                    Analytics.trackEvent('contact_subject_selected', {
                        event_category: 'Form Interaction',
                        event_label: subjectField.value,
                        subject_type: subjectField.value
                    });
                });
            }
        }
    },

    // Crisis support tracking
    setupCrisisSupportTracking() {
        // Track crisis support link clicks
        const crisisLinks = Utils.safeQuerySelectorAll('.crisis-links a');
        crisisLinks.forEach(link => {
            link.addEventListener('click', () => {
                const supportType = link.textContent.includes('988') ? 'crisis_lifeline' :
                                 link.textContent.includes('Veterans') ? 'veterans_crisis' :
                                 link.textContent.includes('741741') ? 'crisis_text' : 'unknown';
                
                Analytics.trackCrisisSupportClick(supportType);
            });
        });
    },

    // General form tracking
    setupGeneralFormTracking() {
        // Track all form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const formType = form.id === 'contactForm' ? 'contact_form' :
                           form.closest('#emailModal') ? 'email_capture' : 'unknown_form';
            
            Analytics.trackFormSubmissionAttempt(formType);
        });

        // Track form abandonment
        window.addEventListener('beforeunload', () => {
            // Check if any forms were started but not completed
            const emailModal = Utils.safeQuerySelector('#emailModal');
            const contactForm = Utils.safeQuerySelector('#contactForm');
            
            if (emailModal && emailModal.style.display !== 'none') {
                const firstName = Utils.safeQuerySelector('#firstName')?.value;
                const email = Utils.safeQuerySelector('#emailAddress')?.value;
                
                if ((firstName && firstName.length > 0) || (email && email.length > 0)) {
                    Analytics.trackEvent('form_abandonment', {
                        event_category: 'Form Interaction',
                        event_label: 'email_capture',
                        form_type: 'email_capture',
                        completion_level: firstName && email ? 'partial' : 'minimal'
                    });
                }
            }
        });
    }
};

// Enhanced initialization with comprehensive tracking
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Analytics
    Analytics.init();
    
    // Initialize form tracking
    FormTracker.init();
    
    // Track initial page view
    Analytics.trackPageView(window.location.pathname, document.title);
    
    // Start engagement tracking
    Analytics.trackTimeOnPage();
    Analytics.trackScrollDepth();
    
    // Track Rise & Reclaim clicks
    document.addEventListener('click', function(e) {
        const target = e.target.closest('a[href*="joinriseandreclaim.com"], .rise-cta');
        if (target) {
            const location = target.classList.contains('nav-link') ? 'navigation' :
                           target.classList.contains('btn-rise') ? 'hero_button' :
                           target.classList.contains('floating-btn') ? 'floating_cta' :
                           target.closest('.footer') ? 'footer' :
                           'unknown';
            Analytics.trackRiseClick(location);
        }
    });
    
    // Track section navigation
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionId) {
            Analytics.trackEvent('section_navigation', {
                event_category: 'Navigation',
                event_label: sectionId,
                section_name: sectionId
            });
            return originalShowSection(sectionId);
        };
    }
    
    // Track resource access attempts
    const originalAccessResource = window.accessResource;
    if (originalAccessResource) {
        window.accessResource = function(resourceName, trigger) {
            Analytics.trackEvent('resource_access_attempt', {
                event_category: 'Resource Access',
                event_label: resourceName,
                resource_name: resourceName,
                trigger_source: trigger || 'unknown'
            });
            return originalAccessResource(resourceName, trigger);
        };
    }
    
    // Initialize contact form handler
    ContactFormHandler.init();
    
    // Track contact page view if on contact page
    if (window.location.pathname.includes('contact')) {
        Analytics.trackPageView('/contact', 'Contact - Digital Grandpa');
        Analytics.trackEvent('contact_page_view', {
            event_category: 'Page Views',
            event_label: 'Contact Page'
        });
    }
    
    // Track blog page views
    if (window.location.pathname.includes('blog')) {
        Analytics.trackEvent('blog_page_view', {
            event_category: 'Page Views',
            event_label: 'Blog Page'
        });
    }
    
    // Track store page views
    if (window.location.pathname.includes('store')) {
        Analytics.trackEvent('store_page_view', {
            event_category: 'Page Views',
            event_label: 'Store Page'
        });
    }
});



// Blog Form Handler
const BlogFormHandler = {
    submissionInProgress: false,

    // Initialize blog form
    init() {
        try {
            const blogForm = document.getElementById('blogEmailForm');
            if (blogForm) {
                blogForm.addEventListener('submit', (e) => this.handleBlogSubmit(e));
                console.log('✅ Blog form handler initialized');
            }
        } catch (error) {
            console.error('Error initializing blog form:', error);
        }
    },

    // Handle blog subscription form submission
    async handleBlogSubmit(event) {
        event.preventDefault();
        
        if (this.submissionInProgress) {
            console.log('⏳ Blog submission already in progress');
            return;
        }

        try {
            this.submissionInProgress = true;
            const submitBtn = event.target.querySelector('.blog-subscribe-btn');
            const originalText = submitBtn.textContent;
            
            // Update button state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';
            
            // Get form data
            const firstName = document.getElementById('blogFirstName').value.trim();
            const email = document.getElementById('blogEmail').value.trim();
            
            // Validate form
            const errors = this.validateBlogForm(firstName, email);
            if (errors.length > 0) {
                this.showBlogMessage(errors.join('<br>'), 'error');
                return;
            }
            
            // Submit to GHL
            const success = await this.submitToBlogWebhook(firstName, email);
            
            if (success) {
                // Track successful subscription
                if (typeof Analytics !== 'undefined') {
                    Analytics.trackEvent('blog_subscription', {
                        event_category: 'Blog',
                        event_label: 'Footer Subscription',
                        user_type: 'blog_subscriber'
                    });
                }
                
                this.showBlogMessage('🎉 Welcome to the Digital Grandpa blog family! Check your email for confirmation.', 'success');
                event.target.reset();
            } else {
                this.showBlogMessage('Something went wrong. Please try again or email info@digitalgrandpa.org', 'error');
            }
            
        } catch (error) {
            console.error('Blog form submission error:', error);
            this.showBlogMessage('Connection error. Please check your internet and try again.', 'error');
        } finally {
            this.submissionInProgress = false;
            const submitBtn = event.target.querySelector('.blog-subscribe-btn');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe to Blog';
        }
    },

    // Validate blog form
    validateBlogForm(firstName, email) {
        const errors = [];
        
        if (!firstName || firstName.length < 2) {
            errors.push('Please enter your first name');
        }
        
        if (!email || !this.isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        return errors;
    },

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Submit to blog webhook
    async submitToBlogWebhook(firstName, email) {
        try {
            const webhookData = {
                firstName: firstName,
                email: email,
                source: 'digitalgrandpa-blog',
                tags: [DIGITAL_GRANDPA_CONFIG.webhook.blogTag],
                customFields: {
                    lead_source: 'Blog Subscription',
                    subscription_type: 'Blog Updates',
                    signup_page: window.location.pathname,
                    signup_timestamp: new Date().toISOString()
                }
            };

            console.log('📤 Submitting to blog webhook:', webhookData);

            const response = await fetch(DIGITAL_GRANDPA_CONFIG.webhook.blogSubscriptionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                console.log('✅ Blog webhook submission successful');
                return true;
            } else {
                console.error('❌ Blog webhook submission failed:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ Blog webhook submission error:', error);
            return false;
        }
    },

    // Show blog form message
    showBlogMessage(message, type) {
        try {
            // Remove existing messages
            const existingMessages = document.querySelectorAll('.blog-form-message');
            existingMessages.forEach(msg => msg.remove());
            
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = `blog-form-message ${type}`;
            messageEl.innerHTML = message;
            messageEl.setAttribute('role', 'alert');
            messageEl.setAttribute('aria-live', 'polite');
            
            // Style the message
            messageEl.style.cssText = `
                margin-top: 1rem;
                padding: 0.75rem;
                border-radius: 4px;
                font-size: 0.9rem;
                ${type === 'success' ? 
                    'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 
                    'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
                }
            `;
            
            // Insert after form
            const form = document.getElementById('blogEmailForm');
            if (form && form.parentNode) {
                form.parentNode.insertBefore(messageEl, form.nextSibling);
            }
            
            // Auto-remove error messages after 5 seconds
            if (type === 'error') {
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Error showing blog message:', error);
        }
    }
};



// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Digital Grandpa - Initializing...');
        
        // Initialize core components
        Utils.init();
        Navigation.init();
        FormHandler.init();
        ContactFormHandler.init();
        BlogFormHandler.init(); // Initialize blog form handler
        Analytics.init();
        
        // Initialize page-specific features
        if (typeof initializeEmailModal !== 'undefined') {
            initializeEmailModal();
        }
        
        console.log('✅ Digital Grandpa - All systems ready');
        
        // Track page load
        Analytics.trackPageView(window.location.pathname, document.title);
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
    }
});

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    
    // Track errors in analytics if available
    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('javascript_error', {
            'error_message': event.error?.message || 'Unknown error',
            'error_filename': event.filename || 'Unknown file',
            'error_line': event.lineno || 0
        });
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Track promise rejections in analytics if available
    if (typeof Analytics !== 'undefined' && Analytics.trackEvent) {
        Analytics.trackEvent('promise_rejection', {
            'rejection_reason': event.reason?.toString() || 'Unknown rejection'
        });
    }
});

console.log('📋 Digital Grandpa script loaded successfully');


// Enhanced Email Modal with Audience Selection
const AudienceSelector = {
    audienceContent: {
        veteran: {
            title: "Resources for Veterans",
            description: "Transition guides, VA benefits navigation, and career strategies specifically designed for military veterans.",
            content: `<h4>🎖️ Veteran-Specific Resources Include:</h4>
                     <p>• Military-to-civilian transition roadmap<br>
                     • VA benefits maximization guide<br>
                     • Career translation for military skills<br>
                     • Brotherhood and purpose after service</p>`
        },
        reentry: {
            title: "Life After Incarceration Support",
            description: "Practical guides for rebuilding life, finding employment, and reconnecting with family after incarceration.",
            content: `<h4>🔓 Reentry Resources Include:</h4>
                     <p>• Employment strategies that work<br>
                     • Housing and benefits navigation<br>
                     • Family reunification guidance<br>
                     • Building trust and community acceptance</p>`
        },
        youth: {
            title: "At-Risk Youth Empowerment",
            description: "Mentorship guidance, educational pathways, and life skills for young people facing challenges.",
            content: `<h4>🌟 Youth Support Resources Include:</h4>
                     <p>• Educational and career pathway planning<br>
                     • Mentorship and positive role models<br>
                     • Life skills and financial literacy<br>
                     • Building confidence and self-worth</p>`
        },
        general: {
            title: "Life Transformation Resources",
            description: "Universal wisdom for overcoming setbacks and building resilience in any life situation.",
            content: `<h4>💪 General Resources Include:</h4>
                     <p>• Setback-to-comeback strategies<br>
                     • Resilience building techniques<br>
                     • Purpose and meaning discovery<br>
                     • Practical life rebuilding steps</p>`
        }
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('audience-btn')) {
                this.selectAudience(e.target);
            }
        });
    },

    selectAudience(button) {
        // Remove selected class from all buttons
        document.querySelectorAll('.audience-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selected class to clicked button
        button.classList.add('selected');

        // Get audience type
        const audienceType = button.dataset.audience;
        
        // Update hidden input
        const audienceInput = document.getElementById('audienceType');
        if (audienceInput) {
            audienceInput.value = audienceType;
        }

        // Update modal content
        this.updateModalContent(audienceType);
    },

    updateModalContent(audienceType) {
        const content = this.audienceContent[audienceType];
        if (!content) return;

        // Update modal title and description
        const modalTitle = document.getElementById('emailModalTitle');
        const modalDesc = document.getElementById('emailModalDescription');
        
        if (modalTitle) modalTitle.textContent = content.title;
        if (modalDesc) modalDesc.textContent = content.description;

        // Update dynamic content area
        const dynamicContent = document.getElementById('dynamicContent');
        if (dynamicContent) {
            dynamicContent.innerHTML = `
                <div class="urgency-indicator">
                    <span class="urgency-text">⏰ <strong>2,847 people</strong> downloaded this month</span>
                </div>
                <div class="audience-specific-content">
                    ${content.content}
                </div>
            `;
        }

        // Update submit button text
        const submitBtn = document.querySelector('.email-submit');
        if (submitBtn) {
            submitBtn.textContent = `🔓 Get My ${content.title}`;
        }
    }
};

// Initialize audience selector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AudienceSelector.init();
});


// Enhanced Social Proof Functionality
const SocialProofEnhancer = {
    init() {
        this.animateStats();
        this.updateMemberCount();
        this.rotateSuccessStories();
    },

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number[data-target]');
        
        const animateNumber = (element) => {
            const target = parseInt(element.dataset.target);
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current);
            }, 16);
        };

        // Use Intersection Observer to trigger animation when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    },

    updateMemberCount() {
        const memberElement = document.getElementById('activeMembers');
        if (!memberElement) return;

        // Simulate realistic member count fluctuation
        const baseMemberCount = 1247;
        const variation = Math.floor(Math.random() * 20) - 10; // ±10 members
        const currentCount = baseMemberCount + variation;
        
        memberElement.textContent = currentCount.toLocaleString();
        
        // Update every 30 seconds
        setInterval(() => {
            const newVariation = Math.floor(Math.random() * 20) - 10;
            const newCount = baseMemberCount + newVariation;
            memberElement.textContent = newCount.toLocaleString();
        }, 30000);
    },

    rotateSuccessStories() {
        const successStories = [
            "Marcus R. just landed his first job after reentry",
            "Sarah T. completed her GED and started college",
            "James V. reconnected with his family after 3 years",
            "Maria L. opened her own small business",
            "David K. became a mentor in his community",
            "Lisa M. found stable housing after homelessness"
        ];

        const recentActivityElement = document.querySelector('.recent-text');
        if (!recentActivityElement) return;

        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % successStories.length;
            const story = successStories[currentIndex];
            const [name, achievement] = story.split(' just ');
            recentActivityElement.innerHTML = `Latest success: <strong>${name}</strong> just ${achievement}`;
        }, 8000); // Change every 8 seconds
    }
};

// Initialize social proof enhancements
document.addEventListener('DOMContentLoaded', () => {
    SocialProofEnhancer.init();
});

