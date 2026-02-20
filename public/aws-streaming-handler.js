// AWS S3 Streaming Handler for Digital Grandpa Content
// Handles secure streaming, preview limits, and paywall enforcement

class AWSStreamingHandler {
    constructor() {
        this.config = {
            region: 'us-east-1',
            bucket: 'digitalgrandpa-content',
            cloudFrontDomain: 'https://d1234567890.cloudfront.net',
            apiEndpoint: 'https://api.digitalgrandpa.org/v1',
            previewLimits: {
                free: 100, // 100% access for free content
                premium: 20, // 20% preview for premium content
                course: 15, // 15% preview for courses
                audio: 10 // 10% preview for audio series
            }
        };
        
        this.currentStreams = new Map();
        this.userAccess = this.loadUserAccess();
        this.analytics = new StreamingAnalytics();
        
        this.init();
    }

    init() {
        console.log('🎬 AWS Streaming Handler initializing...');
        this.setupEventListeners();
        this.validateUserAccess();
    }

    setupEventListeners() {
        // Listen for media events
        document.addEventListener('play', this.handleMediaPlay.bind(this), true);
        document.addEventListener('pause', this.handleMediaPause.bind(this), true);
        document.addEventListener('timeupdate', this.handleTimeUpdate.bind(this), true);
        document.addEventListener('ended', this.handleMediaEnded.bind(this), true);
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Listen for beforeunload to track session
        window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }

    async loadUserAccess() {
        try {
            // Get user access from localStorage and validate with server
            const localAccess = JSON.parse(localStorage.getItem('digitalGrandpaAccess') || '{}');
            
            if (localAccess.verified && localAccess.email) {
                // Validate with server
                const response = await fetch(`${this.config.apiEndpoint}/user/access`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localAccess.token || ''}`
                    },
                    body: JSON.stringify({
                        email: localAccess.email,
                        timestamp: Date.now()
                    })
                });

                if (response.ok) {
                    const serverAccess = await response.json();
                    return { ...localAccess, ...serverAccess };
                }
            }
            
            return { verified: false, purchasedContent: [] };
        } catch (error) {
            console.warn('Error loading user access:', error);
            return { verified: false, purchasedContent: [] };
        }
    }

    async validateUserAccess() {
        this.userAccess = await this.loadUserAccess();
        console.log('👤 User access loaded:', this.userAccess);
    }

    generateSecureUrl(contentPath, contentType = 'free') {
        // Generate signed URL for AWS S3/CloudFront
        const timestamp = Math.floor(Date.now() / 1000);
        const expiry = timestamp + (contentType === 'free' ? 3600 : 1800); // 1 hour for free, 30 min for premium
        
        // In production, this would be generated server-side
        const signature = this.generateSignature(contentPath, expiry);
        
        return `${this.config.cloudFrontDomain}/${contentPath}?Expires=${expiry}&Signature=${signature}&Key-Pair-Id=APKAI...`;
    }

    generateSignature(contentPath, expiry) {
        // Simplified signature generation - in production, use proper AWS signing
        const data = `${contentPath}${expiry}`;
        return btoa(data).replace(/[+/=]/g, '');
    }

    async requestStream(contentId, contentType = 'free') {
        try {
            console.log(`🎬 Requesting stream for ${contentId} (${contentType})`);
            
            // Check user access
            if (contentType !== 'free' && !this.hasAccess(contentId)) {
                throw new Error('Access denied - content not purchased');
            }

            // Get content metadata
            const metadata = await this.getContentMetadata(contentId);
            if (!metadata) {
                throw new Error('Content not found');
            }

            // Generate secure streaming URL
            const streamUrl = this.generateSecureUrl(metadata.path, contentType);
            
            // Create stream session
            const streamSession = {
                contentId,
                contentType,
                metadata,
                streamUrl,
                startTime: Date.now(),
                watchTime: 0,
                previewLimit: this.getPreviewLimit(contentType),
                hasAccess: this.hasAccess(contentId)
            };

            this.currentStreams.set(contentId, streamSession);
            
            // Track stream start
            this.analytics.trackStreamStart(streamSession);
            
            return streamSession;
            
        } catch (error) {
            console.error('Error requesting stream:', error);
            throw error;
        }
    }

    async getContentMetadata(contentId) {
        // Content metadata mapping - in production, fetch from API
        const contentMap = {
            'free-audio-1': {
                path: 'audio/free/finding-your-way-forward.mp3',
                title: 'Finding Your Way Forward',
                duration: 900, // 15 minutes
                type: 'audio',
                category: 'free'
            },
            'free-video-1': {
                path: 'video/free/starting-over-guide.mp4',
                title: 'The Grandfather\'s Guide to Starting Over',
                duration: 1200, // 20 minutes
                type: 'video',
                category: 'free'
            },
            'course-preview-1': {
                path: 'courses/transformation/preview.mp4',
                title: 'Complete Transformation Course - Preview',
                duration: 1800, // 30 minutes total
                type: 'video',
                category: 'course',
                fullContentId: 'transformation-course-full'
            },
            'audio-series-preview': {
                path: 'podcast/voices-resilience/episode-1-preview.mp3',
                title: 'Voices of Resilience - Episode 1 Preview',
                duration: 2700, // 45 minutes total
                type: 'audio',
                category: 'audio',
                fullContentId: 'voices-series-full'
            },
            'transformation-course-full': {
                path: 'courses/transformation/complete',
                title: 'Complete Transformation Course',
                duration: 28800, // 8 hours
                type: 'video',
                category: 'premium',
                modules: 12
            },
            'voices-series-full': {
                path: 'podcast/voices-resilience/complete',
                title: 'Voices of Resilience Complete Series',
                duration: 32400, // 9 hours
                type: 'audio',
                category: 'premium',
                episodes: 12
            }
        };

        return contentMap[contentId] || null;
    }

    getPreviewLimit(contentType) {
        return this.config.previewLimits[contentType] || this.config.previewLimits.premium;
    }

    hasAccess(contentId) {
        if (!this.userAccess.verified) return false;
        
        // Check if user has purchased this content
        const purchasedContent = this.userAccess.purchasedContent || [];
        return purchasedContent.includes(contentId) || 
               purchasedContent.includes('complete-library') ||
               purchasedContent.includes('rise-reclaim-membership');
    }

    handleMediaPlay(event) {
        const mediaElement = event.target;
        const contentId = this.getContentIdFromElement(mediaElement);
        
        if (contentId && this.currentStreams.has(contentId)) {
            const stream = this.currentStreams.get(contentId);
            stream.lastPlayTime = Date.now();
            
            console.log(`▶️ Playing ${contentId}`);
            this.analytics.trackPlayEvent(stream);
        }
    }

    handleMediaPause(event) {
        const mediaElement = event.target;
        const contentId = this.getContentIdFromElement(mediaElement);
        
        if (contentId && this.currentStreams.has(contentId)) {
            const stream = this.currentStreams.get(contentId);
            if (stream.lastPlayTime) {
                stream.watchTime += Date.now() - stream.lastPlayTime;
            }
            
            console.log(`⏸️ Paused ${contentId}`);
            this.analytics.trackPauseEvent(stream);
        }
    }

    handleTimeUpdate(event) {
        const mediaElement = event.target;
        const contentId = this.getContentIdFromElement(mediaElement);
        
        if (contentId && this.currentStreams.has(contentId)) {
            const stream = this.currentStreams.get(contentId);
            const currentTime = mediaElement.currentTime;
            const duration = mediaElement.duration;
            
            // Check preview limits for premium content
            if (!stream.hasAccess && stream.contentType !== 'free') {
                const previewDuration = (duration * stream.previewLimit) / 100;
                
                if (currentTime >= previewDuration) {
                    this.enforcePaywall(mediaElement, stream);
                    return;
                }
            }
            
            // Update progress
            stream.currentTime = currentTime;
            stream.progress = (currentTime / duration) * 100;
            
            // Track milestone events
            this.trackProgressMilestones(stream);
        }
    }

    handleMediaEnded(event) {
        const mediaElement = event.target;
        const contentId = this.getContentIdFromElement(mediaElement);
        
        if (contentId && this.currentStreams.has(contentId)) {
            const stream = this.currentStreams.get(contentId);
            stream.completed = true;
            
            console.log(`🏁 Completed ${contentId}`);
            this.analytics.trackCompletionEvent(stream);
            
            // Show upsell for preview content
            if (!stream.hasAccess && stream.metadata.fullContentId) {
                this.showUpsellModal(stream);
            }
        }
    }

    enforcePaywall(mediaElement, stream) {
        console.log(`🔒 Paywall enforced for ${stream.contentId}`);
        
        // Pause the media
        mediaElement.pause();
        
        // Show paywall overlay
        this.showPaywallOverlay(stream);
        
        // Track paywall hit
        this.analytics.trackPaywallHit(stream);
    }

    showPaywallOverlay(stream) {
        const overlay = document.getElementById('paywallOverlay');
        if (overlay) {
            overlay.style.display = 'block';
            
            // Update paywall message based on content type
            const message = this.getPaywallMessage(stream);
            const messageElement = overlay.querySelector('.paywall-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    getPaywallMessage(stream) {
        const messages = {
            course: `🎓 You've seen ${stream.previewLimit}% of this course. Ready to transform your life with the complete program?`,
            audio: `🎧 This was just a taste. Get the full ${stream.metadata.episodes}-episode series to hear every powerful story.`,
            premium: `⭐ Want to continue? Unlock the full content and start your transformation journey today.`
        };
        
        return messages[stream.metadata.category] || messages.premium;
    }

    showUpsellModal(stream) {
        // Create and show upsell modal
        const modal = document.createElement('div');
        modal.className = 'upsell-modal';
        modal.innerHTML = `
            <div class="upsell-content">
                <h3>🎉 You just experienced a preview!</h3>
                <p>Ready for the complete ${stream.metadata.title}?</p>
                <div class="upsell-benefits">
                    <div class="benefit">✅ Full access to all content</div>
                    <div class="benefit">✅ Downloadable resources</div>
                    <div class="benefit">✅ 30-day money-back guarantee</div>
                </div>
                <div class="upsell-actions">
                    <button class="btn-purchase" onclick="this.purchaseContent('${stream.metadata.fullContentId}')">
                        Get Full Access
                    </button>
                    <button class="btn-secondary" onclick="this.closeUpsellModal()">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 30000);
    }

    trackProgressMilestones(stream) {
        const milestones = [25, 50, 75, 90];
        const currentMilestone = milestones.find(m => 
            stream.progress >= m && !stream[`milestone_${m}`]
        );
        
        if (currentMilestone) {
            stream[`milestone_${currentMilestone}`] = true;
            this.analytics.trackMilestone(stream, currentMilestone);
        }
    }

    getContentIdFromElement(mediaElement) {
        // Extract content ID from media element or parent container
        return mediaElement.dataset.contentId || 
               mediaElement.closest('[data-content-id]')?.dataset.contentId ||
               null;
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pause all active streams when tab becomes hidden
            this.currentStreams.forEach((stream, contentId) => {
                const mediaElement = document.querySelector(`[data-content-id="${contentId}"]`);
                if (mediaElement && !mediaElement.paused) {
                    mediaElement.pause();
                }
            });
        }
    }

    handlePageUnload() {
        // Track session end for all active streams
        this.currentStreams.forEach(stream => {
            this.analytics.trackSessionEnd(stream);
        });
    }

    // Public API methods
    async playContent(contentId, contentType = 'free') {
        try {
            const stream = await this.requestStream(contentId, contentType);
            return stream.streamUrl;
        } catch (error) {
            console.error('Error playing content:', error);
            throw error;
        }
    }

    pauseContent(contentId) {
        const mediaElement = document.querySelector(`[data-content-id="${contentId}"]`);
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    stopContent(contentId) {
        const mediaElement = document.querySelector(`[data-content-id="${contentId}"]`);
        if (mediaElement) {
            mediaElement.pause();
            mediaElement.currentTime = 0;
        }
        
        this.currentStreams.delete(contentId);
    }

    getStreamingStats() {
        const stats = {
            activeStreams: this.currentStreams.size,
            totalWatchTime: 0,
            completedStreams: 0
        };
        
        this.currentStreams.forEach(stream => {
            stats.totalWatchTime += stream.watchTime;
            if (stream.completed) stats.completedStreams++;
        });
        
        return stats;
    }
}

// Streaming Analytics Class
class StreamingAnalytics {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
    }

    generateSessionId() {
        return 'stream_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    trackEvent(eventType, data) {
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            ...data
        };
        
        this.events.push(event);
        console.log('📊 Streaming Event:', event);
        
        // Send to analytics service (Google Analytics, etc.)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                event_category: 'Streaming',
                event_label: data.contentId,
                value: data.progress || 0
            });
        }
    }

    trackStreamStart(stream) {
        this.trackEvent('stream_start', {
            contentId: stream.contentId,
            contentType: stream.contentType,
            contentTitle: stream.metadata.title,
            hasAccess: stream.hasAccess
        });
    }

    trackPlayEvent(stream) {
        this.trackEvent('stream_play', {
            contentId: stream.contentId,
            currentTime: stream.currentTime || 0
        });
    }

    trackPauseEvent(stream) {
        this.trackEvent('stream_pause', {
            contentId: stream.contentId,
            currentTime: stream.currentTime || 0,
            watchTime: stream.watchTime
        });
    }

    trackMilestone(stream, milestone) {
        this.trackEvent('stream_milestone', {
            contentId: stream.contentId,
            milestone: milestone,
            watchTime: stream.watchTime
        });
    }

    trackPaywallHit(stream) {
        this.trackEvent('paywall_hit', {
            contentId: stream.contentId,
            previewTime: stream.currentTime,
            previewLimit: stream.previewLimit
        });
    }

    trackCompletionEvent(stream) {
        this.trackEvent('stream_complete', {
            contentId: stream.contentId,
            totalWatchTime: stream.watchTime,
            hasAccess: stream.hasAccess
        });
    }

    trackSessionEnd(stream) {
        this.trackEvent('stream_session_end', {
            contentId: stream.contentId,
            sessionDuration: Date.now() - stream.startTime,
            totalWatchTime: stream.watchTime,
            progress: stream.progress || 0
        });
    }

    getAnalyticsData() {
        return {
            sessionId: this.sessionId,
            events: this.events,
            summary: this.generateSummary()
        };
    }

    generateSummary() {
        const summary = {
            totalEvents: this.events.length,
            streamStarts: 0,
            completions: 0,
            paywallHits: 0,
            milestones: {}
        };
        
        this.events.forEach(event => {
            switch (event.type) {
                case 'stream_start':
                    summary.streamStarts++;
                    break;
                case 'stream_complete':
                    summary.completions++;
                    break;
                case 'paywall_hit':
                    summary.paywallHits++;
                    break;
                case 'stream_milestone':
                    summary.milestones[event.milestone] = (summary.milestones[event.milestone] || 0) + 1;
                    break;
            }
        });
        
        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AWSStreamingHandler, StreamingAnalytics };
} else {
    window.AWSStreamingHandler = AWSStreamingHandler;
    window.StreamingAnalytics = StreamingAnalytics;
}

