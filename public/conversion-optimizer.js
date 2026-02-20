// Conversion Optimization System for Digital Grandpa Store
// Implements trust building, behavioral triggers, and conversion psychology

class ConversionOptimizer {
    constructor() {
        this.config = {
            trustSignals: {
                memberCount: 1247,
                successStories: 89,
                yearsExperience: 30,
                veteransHelped: 1200
            },
            behavioralTriggers: {
                exitIntentDelay: 2000,
                scrollTriggerPercent: 70,
                timeOnPageTrigger: 120000, // 2 minutes
                inactivityTimeout: 45000 // 45 seconds
            },
            conversionElements: {
                scarcityEnabled: true,
                socialProofEnabled: true,
                urgencyEnabled: true,
                testimonialRotation: true
            }
        };
        
        this.userBehavior = {
            scrollDepth: 0,
            timeOnPage: Date.now(),
            interactions: 0,
            exitIntentShown: false,
            conversionAttempts: 0
        };
        
        this.testimonials = this.loadTestimonials();
        this.init();
    }

    init() {
        console.log('🎯 Conversion Optimizer initializing...');
        this.setupBehavioralTracking();
        this.setupTrustElements();
        this.setupConversionTriggers();
        this.startDynamicUpdates();
    }

    setupBehavioralTracking() {
        // Scroll depth tracking
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = Math.round(
                    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
                );
                
                if (scrollPercent > this.userBehavior.scrollDepth) {
                    this.userBehavior.scrollDepth = scrollPercent;
                    this.handleScrollMilestone(scrollPercent);
                }
            }, 100);
        });

        // Interaction tracking
        ['click', 'keydown', 'mousemove', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.userBehavior.interactions++;
                this.userBehavior.lastInteraction = Date.now();
            }, { passive: true });
        });

        // Exit intent detection (desktop)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !this.userBehavior.exitIntentShown) {
                this.triggerExitIntent();
            }
        });

        // Mobile exit intent (scroll to top quickly)
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            if (window.scrollY < lastScrollY - 100 && window.scrollY < 200) {
                if (!this.userBehavior.exitIntentShown && this.isMobile()) {
                    this.triggerExitIntent();
                }
            }
            lastScrollY = window.scrollY;
        });

        // Inactivity detection
        this.setupInactivityDetection();
    }

    setupInactivityDetection() {
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.handleInactivity();
            }, this.config.behavioralTriggers.inactivityTimeout);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        resetTimer();
    }

    setupTrustElements() {
        this.createTrustBadges();
        this.createSocialProofElements();
        this.createSecurityIndicators();
        this.createTestimonialCarousel();
    }

    createTrustBadges() {
        const trustContainer = document.createElement('div');
        trustContainer.className = 'floating-trust-badges';
        trustContainer.innerHTML = `
            <div class="trust-badge-item" data-tooltip="Verified by independent security audit">
                <span class="trust-icon">🔒</span>
                <span class="trust-text">Secure</span>
            </div>
            <div class="trust-badge-item" data-tooltip="30-day money-back guarantee">
                <span class="trust-icon">💯</span>
                <span class="trust-text">Guaranteed</span>
            </div>
            <div class="trust-badge-item" data-tooltip="Veteran-owned and operated business">
                <span class="trust-icon">🎖️</span>
                <span class="trust-text">Veteran Owned</span>
            </div>
            <div class="trust-badge-item" data-tooltip="Over ${this.config.trustSignals.yearsExperience} years helping people rebuild">
                <span class="trust-icon">⭐</span>
                <span class="trust-text">${this.config.trustSignals.yearsExperience}+ Years</span>
            </div>
        `;

        // Add CSS for trust badges
        const style = document.createElement('style');
        style.textContent = `
            .floating-trust-badges {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 1000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.5s ease;
            }
            
            .floating-trust-badges.visible {
                opacity: 1;
                transform: translateX(0);
            }
            
            .trust-badge-item {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 20px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .trust-badge-item:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            
            .trust-badge-item[data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.7rem;
                white-space: nowrap;
                margin-right: 8px;
                z-index: 1001;
            }
            
            @media (max-width: 768px) {
                .floating-trust-badges {
                    bottom: 10px;
                    right: 10px;
                    flex-direction: row;
                    flex-wrap: wrap;
                    max-width: 200px;
                }
                
                .trust-badge-item {
                    font-size: 0.7rem;
                    padding: 6px 10px;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(trustContainer);

        // Show trust badges after 3 seconds
        setTimeout(() => {
            trustContainer.classList.add('visible');
        }, 3000);
    }

    createSocialProofElements() {
        // Add live activity indicators
        const activityIndicator = document.createElement('div');
        activityIndicator.className = 'live-activity-indicator';
        activityIndicator.innerHTML = `
            <div class="activity-pulse"></div>
            <span class="activity-text">3 people viewing this page</span>
        `;

        const activityStyle = document.createElement('style');
        activityStyle.textContent = `
            .live-activity-indicator {
                position: fixed;
                top: 100px;
                left: 20px;
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 1000;
                opacity: 0;
                animation: slideInLeft 0.5s ease 5s forwards;
            }
            
            .activity-pulse {
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            @keyframes slideInLeft {
                to { opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.2); }
            }
            
            @media (max-width: 768px) {
                .live-activity-indicator {
                    position: relative;
                    top: auto;
                    left: auto;
                    margin: 1rem auto;
                    width: fit-content;
                }
            }
        `;
        document.head.appendChild(activityStyle);
        document.body.appendChild(activityIndicator);

        // Update activity count periodically
        this.updateActivityCount();
    }

    createSecurityIndicators() {
        // Add security badges to purchase buttons
        const purchaseButtons = document.querySelectorAll('.btn-purchase');
        purchaseButtons.forEach(button => {
            const securityBadge = document.createElement('div');
            securityBadge.className = 'security-badge';
            securityBadge.innerHTML = `
                <span class="security-icon">🔒</span>
                <span class="security-text">256-bit SSL Encrypted</span>
            `;
            
            button.parentNode.insertBefore(securityBadge, button.nextSibling);
        });

        const securityStyle = document.createElement('style');
        securityStyle.textContent = `
            .security-badge {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                font-size: 0.7rem;
                color: #666;
                margin-top: 8px;
                opacity: 0.8;
            }
            
            .security-icon {
                font-size: 0.8rem;
            }
        `;
        document.head.appendChild(securityStyle);
    }

    createTestimonialCarousel() {
        const testimonialContainer = document.createElement('div');
        testimonialContainer.className = 'floating-testimonial';
        testimonialContainer.innerHTML = `
            <div class="testimonial-content">
                <div class="testimonial-text" id="testimonialText"></div>
                <div class="testimonial-author" id="testimonialAuthor"></div>
            </div>
            <button class="testimonial-close" onclick="this.parentElement.style.display='none'">&times;</button>
        `;

        const testimonialStyle = document.createElement('style');
        testimonialStyle.textContent = `
            .floating-testimonial {
                position: fixed;
                bottom: 100px;
                left: 20px;
                max-width: 300px;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 1000;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.5s ease;
            }
            
            .floating-testimonial.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .testimonial-content {
                margin-bottom: 8px;
            }
            
            .testimonial-text {
                font-size: 0.85rem;
                line-height: 1.4;
                margin-bottom: 8px;
                font-style: italic;
            }
            
            .testimonial-author {
                font-size: 0.75rem;
                font-weight: 600;
                color: #666;
            }
            
            .testimonial-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #999;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .floating-testimonial {
                    position: relative;
                    bottom: auto;
                    left: auto;
                    margin: 2rem auto;
                    max-width: 90%;
                }
            }
        `;
        document.head.appendChild(testimonialStyle);
        document.body.appendChild(testimonialContainer);

        // Start testimonial rotation
        this.startTestimonialRotation();
    }

    setupConversionTriggers() {
        // Time-based trigger
        setTimeout(() => {
            this.triggerTimeBasedOffer();
        }, this.config.behavioralTriggers.timeOnPageTrigger);

        // Scroll-based trigger
        this.setupScrollTrigger();
    }

    setupScrollTrigger() {
        const triggerPercent = this.config.behavioralTriggers.scrollTriggerPercent;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent >= triggerPercent && !this.userBehavior.scrollTriggerShown) {
                this.userBehavior.scrollTriggerShown = true;
                this.triggerScrollBasedOffer();
            }
        });
    }

    handleScrollMilestone(percent) {
        const milestones = [25, 50, 75];
        
        if (milestones.includes(percent)) {
            this.trackEvent('scroll_milestone', { percent });
            
            // Show progressive disclosure based on scroll depth
            if (percent === 50) {
                this.showProgressiveOffer();
            }
        }
    }

    triggerExitIntent() {
        if (this.userBehavior.exitIntentShown) return;
        
        this.userBehavior.exitIntentShown = true;
        this.trackEvent('exit_intent_triggered');
        
        setTimeout(() => {
            this.showExitIntentModal();
        }, this.config.behavioralTriggers.exitIntentDelay);
    }

    showExitIntentModal() {
        const modal = document.createElement('div');
        modal.className = 'exit-intent-modal';
        modal.innerHTML = `
            <div class="exit-intent-overlay"></div>
            <div class="exit-intent-content">
                <button class="exit-intent-close" onclick="this.closest('.exit-intent-modal').remove()">&times;</button>
                <div class="exit-intent-header">
                    <h3>🛑 Wait! Don't Leave Empty-Handed</h3>
                    <p>You're just one step away from transforming your setbacks into comebacks.</p>
                </div>
                <div class="exit-intent-offer">
                    <div class="offer-badge">🎁 Special Offer</div>
                    <h4>Get the Complete Transformation Course</h4>
                    <div class="offer-price">
                        <span class="price-original">$297</span>
                        <span class="price-special">$97</span>
                        <span class="price-save">Save $200!</span>
                    </div>
                    <ul class="offer-benefits">
                        <li>✅ 12 comprehensive video modules</li>
                        <li>✅ Downloadable workbooks and guides</li>
                        <li>✅ 30-day money-back guarantee</li>
                        <li>✅ Lifetime access to all updates</li>
                    </ul>
                    <div class="offer-urgency">
                        ⏰ This offer expires in <span id="exitOfferTimer">10:00</span>
                    </div>
                    <div class="offer-actions">
                        <button class="btn-offer-accept" onclick="this.acceptExitOffer()">
                            🚀 Yes, Transform My Life!
                        </button>
                        <button class="btn-offer-decline" onclick="this.closest('.exit-intent-modal').remove()">
                            No thanks, I'll figure it out alone
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .exit-intent-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .exit-intent-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            
            .exit-intent-content {
                position: relative;
                background: white;
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }
            
            .exit-intent-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .exit-intent-close:hover {
                background: #f0f0f0;
                color: #333;
            }
            
            .exit-intent-header h3 {
                color: var(--primary-color);
                margin-bottom: 0.5rem;
                font-size: 1.5rem;
            }
            
            .exit-intent-header p {
                color: #666;
                margin-bottom: 2rem;
            }
            
            .offer-badge {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                display: inline-block;
                margin-bottom: 1rem;
            }
            
            .offer-price {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin: 1rem 0;
            }
            
            .price-original {
                text-decoration: line-through;
                color: #999;
                font-size: 1.1rem;
            }
            
            .price-special {
                font-size: 2rem;
                font-weight: 700;
                color: var(--accent-color);
            }
            
            .price-save {
                background: #28a745;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            
            .offer-benefits {
                list-style: none;
                padding: 0;
                margin: 1.5rem 0;
            }
            
            .offer-benefits li {
                padding: 0.5rem 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .offer-urgency {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 1rem;
                text-align: center;
                margin: 1.5rem 0;
                font-weight: 600;
                color: #856404;
            }
            
            .offer-actions {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .btn-offer-accept {
                background: linear-gradient(135deg, var(--accent-color), #c82333);
                color: white;
                padding: 1rem 2rem;
                border: none;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-offer-accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
            }
            
            .btn-offer-decline {
                background: transparent;
                color: #666;
                padding: 0.75rem 1rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-offer-decline:hover {
                background: #f8f9fa;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(modalStyle);
        document.body.appendChild(modal);

        // Start countdown timer
        this.startOfferTimer('exitOfferTimer', 600); // 10 minutes

        this.trackEvent('exit_intent_modal_shown');
    }

    startOfferTimer(elementId, seconds) {
        const timerElement = document.getElementById(elementId);
        if (!timerElement) return;

        const timer = setInterval(() => {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            if (seconds <= 0) {
                clearInterval(timer);
                timerElement.textContent = 'EXPIRED';
                // Disable offer buttons
                const modal = timerElement.closest('.exit-intent-modal');
                if (modal) {
                    const acceptBtn = modal.querySelector('.btn-offer-accept');
                    if (acceptBtn) {
                        acceptBtn.disabled = true;
                        acceptBtn.textContent = 'Offer Expired';
                    }
                }
            }
            
            seconds--;
        }, 1000);
    }

    acceptExitOffer() {
        this.trackEvent('exit_offer_accepted');
        // Redirect to purchase page with special offer
        window.location.href = '/purchase/transformation-course?offer=exit-special&price=97';
    }

    triggerTimeBasedOffer() {
        if (this.userBehavior.timeBasedOfferShown) return;
        
        this.userBehavior.timeBasedOfferShown = true;
        this.trackEvent('time_based_offer_triggered');
        
        // Show subtle notification
        this.showTimeBasedNotification();
    }

    showTimeBasedNotification() {
        const notification = document.createElement('div');
        notification.className = 'time-based-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⏰</span>
                <span class="notification-text">You've been here for 2 minutes. Ready to start your transformation?</span>
                <button class="notification-cta" onclick="this.showSpecialOffer()">Show Me How</button>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        const notificationStyle = document.createElement('style');
        notificationStyle.textContent = `
            .time-based-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-radius: 12px;
                padding: 1rem;
                max-width: 300px;
                z-index: 1000;
                animation: slideInRight 0.5s ease;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .notification-text {
                font-size: 0.85rem;
                line-height: 1.3;
            }
            
            .notification-cta {
                background: white;
                color: #667eea;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 0.5rem;
                width: 100%;
            }
            
            .notification-cta:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            
            .notification-close {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2rem;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(notificationStyle);
        document.body.appendChild(notification);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 15000);
    }

    showSpecialOffer() {
        // Scroll to premium content section
        const premiumSection = document.querySelector('.premium-content-section');
        if (premiumSection) {
            premiumSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.trackEvent('time_based_offer_clicked');
    }

    triggerScrollBasedOffer() {
        this.trackEvent('scroll_based_offer_triggered');
        
        // Show floating CTA
        this.showFloatingCTA();
    }

    showFloatingCTA() {
        const floatingCTA = document.createElement('div');
        floatingCTA.className = 'floating-cta';
        floatingCTA.innerHTML = `
            <div class="floating-cta-content">
                <div class="cta-text">
                    <strong>Ready to transform your life?</strong>
                    <span>Join thousands who've turned their setbacks into comebacks</span>
                </div>
                <button class="cta-button" onclick="this.scrollToMembership()">
                    Join Rise & Reclaim
                </button>
            </div>
        `;

        const ctaStyle = document.createElement('style');
        ctaStyle.textContent = `
            .floating-cta {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, var(--accent-color), #c82333);
                color: white;
                padding: 1rem;
                z-index: 1000;
                transform: translateY(100%);
                transition: transform 0.5s ease;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
            }
            
            .floating-cta.visible {
                transform: translateY(0);
            }
            
            .floating-cta-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1200px;
                margin: 0 auto;
                gap: 1rem;
            }
            
            .cta-text {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .cta-text strong {
                font-size: 1.1rem;
            }
            
            .cta-text span {
                font-size: 0.9rem;
                opacity: 0.9;
            }
            
            .cta-button {
                background: white;
                color: var(--accent-color);
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(255,255,255,0.3);
            }
            
            @media (max-width: 768px) {
                .floating-cta-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.75rem;
                }
                
                .cta-button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(ctaStyle);
        document.body.appendChild(floatingCTA);

        // Show with delay
        setTimeout(() => {
            floatingCTA.classList.add('visible');
        }, 1000);
    }

    scrollToMembership() {
        const membershipSection = document.querySelector('.membership-cta');
        if (membershipSection) {
            membershipSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.trackEvent('floating_cta_clicked');
    }

    handleInactivity() {
        if (this.userBehavior.inactivityOfferShown) return;
        
        this.userBehavior.inactivityOfferShown = true;
        this.trackEvent('inactivity_detected');
        
        // Show gentle re-engagement
        this.showInactivityPrompt();
    }

    showInactivityPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'inactivity-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <span class="prompt-icon">👋</span>
                <span class="prompt-text">Still there? Need help finding what you're looking for?</span>
                <button class="prompt-help" onclick="this.showHelpOptions()">I could use some guidance</button>
            </div>
        `;

        const promptStyle = document.createElement('style');
        promptStyle.textContent = `
            .inactivity-prompt {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid var(--deep-gold);
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                z-index: 1000;
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                animation: gentleBounce 0.5s ease;
            }
            
            .prompt-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            
            .prompt-icon {
                font-size: 2rem;
            }
            
            .prompt-text {
                font-size: 1.1rem;
                color: var(--primary-color);
                max-width: 300px;
            }
            
            .prompt-help {
                background: var(--deep-gold);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .prompt-help:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
            }
            
            @keyframes gentleBounce {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.05); }
            }
        `;
        document.head.appendChild(promptStyle);
        document.body.appendChild(prompt);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 10000);
    }

    showHelpOptions() {
        // Redirect to contact or show help modal
        window.location.href = '/contact.html?source=inactivity-help';
        this.trackEvent('inactivity_help_requested');
    }

    startDynamicUpdates() {
        // Update member count periodically
        setInterval(() => {
            this.updateMemberCount();
        }, 30000); // Every 30 seconds

        // Update activity indicators
        setInterval(() => {
            this.updateActivityCount();
        }, 45000); // Every 45 seconds
    }

    updateMemberCount() {
        const variation = Math.floor(Math.random() * 5) - 2; // -2 to +2
        this.config.trustSignals.memberCount += variation;
        
        // Update any displayed member counts
        const memberCountElements = document.querySelectorAll('[data-member-count]');
        memberCountElements.forEach(el => {
            el.textContent = this.config.trustSignals.memberCount.toLocaleString() + '+';
        });
    }

    updateActivityCount() {
        const activityElement = document.querySelector('.activity-text');
        if (activityElement) {
            const count = Math.floor(Math.random() * 8) + 2; // 2-9 people
            activityElement.textContent = `${count} people viewing this page`;
        }
    }

    loadTestimonials() {
        return [
            {
                text: "Bob's guidance helped me rebuild my life after 12 years in prison. Now I own my own business.",
                author: "Marcus T., Entrepreneur"
            },
            {
                text: "The transformation course gave me hope when I had none. I'm finally moving forward.",
                author: "Sarah M., Veteran"
            },
            {
                text: "Digital Grandpa showed me that setbacks are just setups for comebacks. Life-changing.",
                author: "James R., Father of 3"
            },
            {
                text: "After losing everything at 50, Bob's wisdom helped me build something even better.",
                author: "Linda K., Business Owner"
            },
            {
                text: "The community support in Rise & Reclaim is incredible. We lift each other up.",
                author: "David L., Veteran"
            }
        ];
    }

    startTestimonialRotation() {
        const testimonialElement = document.querySelector('.floating-testimonial');
        if (!testimonialElement) return;

        let currentIndex = 0;
        
        const showTestimonial = () => {
            const testimonial = this.testimonials[currentIndex];
            const textElement = document.getElementById('testimonialText');
            const authorElement = document.getElementById('testimonialAuthor');
            
            if (textElement && authorElement) {
                textElement.textContent = `"${testimonial.text}"`;
                authorElement.textContent = `— ${testimonial.author}`;
                
                testimonialElement.classList.add('visible');
                
                // Hide after 8 seconds
                setTimeout(() => {
                    testimonialElement.classList.remove('visible');
                }, 8000);
            }
            
            currentIndex = (currentIndex + 1) % this.testimonials.length;
        };

        // Show first testimonial after 10 seconds
        setTimeout(showTestimonial, 10000);
        
        // Then rotate every 15 seconds
        setInterval(showTestimonial, 15000);
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    trackEvent(eventName, data = {}) {
        const event = {
            type: eventName,
            timestamp: Date.now(),
            userBehavior: { ...this.userBehavior },
            ...data
        };
        
        console.log('🎯 Conversion Event:', event);
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'Conversion_Optimization',
                event_label: data.source || 'store',
                value: data.value || 0
            });
        }
    }

    getConversionStats() {
        return {
            userBehavior: this.userBehavior,
            timeOnPage: Date.now() - this.userBehavior.timeOnPage,
            conversionTriggers: {
                exitIntentShown: this.userBehavior.exitIntentShown,
                scrollTriggerShown: this.userBehavior.scrollTriggerShown,
                timeBasedOfferShown: this.userBehavior.timeBasedOfferShown,
                inactivityOfferShown: this.userBehavior.inactivityOfferShown
            }
        };
    }
}

// Initialize conversion optimizer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.conversionOptimizer = new ConversionOptimizer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversionOptimizer;
} else {
    window.ConversionOptimizer = ConversionOptimizer;
}

