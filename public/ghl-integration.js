/**
 * Digital Grandpa Weekly Giveback - GoHighLevel Integration
 * Handles supporter data capture, tagging, and automated thank-you workflows
 */

class GHLIntegrationHandler {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.GHL_API_KEY;
        this.locationId = config.locationId || process.env.GHL_LOCATION_ID;
        this.webhookUrl = config.webhookUrl || '/api/ghl-webhook';
        this.baseURL = 'https://rest.gohighlevel.com/v1';
        
        this.init();
    }

    init() {
        console.log('🎯 GHL Integration initializing...');
        this.validateConfig();
    }

    validateConfig() {
        if (!this.apiKey) {
            console.warn('⚠️ GHL API key not configured');
        }
        if (!this.locationId) {
            console.warn('⚠️ GHL Location ID not configured');
        }
    }

    /**
     * Send supporter data to GoHighLevel
     */
    async sendSupporterToGHL(supporterData) {
        try {
            console.log('📤 Sending supporter to GHL:', supporterData.email);

            // Prepare contact data for GHL
            const contactData = this.prepareSupporterData(supporterData);
            
            // Create or update contact
            const contact = await this.createOrUpdateContact(contactData);
            
            // Add supporter-specific tags
            await this.addSupporterTags(contact.id, supporterData);
            
            // Trigger thank-you workflow
            await this.triggerThankYouWorkflow(contact.id, supporterData);
            
            // Log supporter activity
            await this.logSupporterActivity(contact.id, supporterData);
            
            console.log('✅ Supporter successfully added to GHL:', contact.id);
            
            return {
                success: true,
                contactId: contact.id,
                contact: contact
            };

        } catch (error) {
            console.error('❌ Failed to send supporter to GHL:', error);
            throw error;
        }
    }

    /**
     * Prepare supporter data for GHL format
     */
    prepareSupporterData(supporterData) {
        const nameParts = supporterData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
            firstName: firstName,
            lastName: lastName,
            email: supporterData.email,
            phone: supporterData.phone || '',
            source: 'Digital Grandpa Weekly Giveback',
            tags: ['Supporter', 'Weekly_Giveback'],
            customFields: {
                support_amount: supporterData.amount,
                support_date: supporterData.timestamp || new Date().toISOString(),
                include_in_drawing: supporterData.includeInDrawing,
                payment_id: supporterData.paymentId || '',
                support_level: this.getSupportLevel(supporterData.amount),
                supporter_type: this.getSupporterType(supporterData.amount)
            },
            locationId: this.locationId
        };
    }

    /**
     * Get support level based on amount
     */
    getSupportLevel(amount) {
        if (amount >= 250) return 'Champion';
        if (amount >= 100) return 'Trailblazer';
        if (amount >= 50) return 'Fire Keeper';
        if (amount >= 25) return 'Spark Lighter';
        return 'Supporter';
    }

    /**
     * Get supporter type for segmentation
     */
    getSupporterType(amount) {
        if (amount >= 250) return 'Major Supporter';
        if (amount >= 100) return 'Regular Supporter';
        return 'New Supporter';
    }

    /**
     * Create or update contact in GHL
     */
    async createOrUpdateContact(contactData) {
        try {
            // First, try to find existing contact by email
            const existingContact = await this.findContactByEmail(contactData.email);
            
            if (existingContact) {
                // Update existing contact
                return await this.updateContact(existingContact.id, contactData);
            } else {
                // Create new contact
                return await this.createContact(contactData);
            }

        } catch (error) {
            console.error('❌ Contact creation/update failed:', error);
            throw error;
        }
    }

    /**
     * Find contact by email
     */
    async findContactByEmail(email) {
        try {
            const response = await fetch(`${this.baseURL}/contacts/search?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`GHL search failed: ${response.status}`);
            }

            const data = await response.json();
            return data.contacts && data.contacts.length > 0 ? data.contacts[0] : null;

        } catch (error) {
            console.error('❌ Contact search failed:', error);
            return null;
        }
    }

    /**
     * Create new contact in GHL
     */
    async createContact(contactData) {
        try {
            const response = await fetch(`${this.baseURL}/contacts/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GHL contact creation failed: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const contact = await response.json();
            console.log('✅ New contact created in GHL:', contact.id);
            
            return contact;

        } catch (error) {
            console.error('❌ Contact creation failed:', error);
            throw error;
        }
    }

    /**
     * Update existing contact in GHL
     */
    async updateContact(contactId, contactData) {
        try {
            const response = await fetch(`${this.baseURL}/contacts/${contactId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GHL contact update failed: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const contact = await response.json();
            console.log('✅ Contact updated in GHL:', contact.id);
            
            return contact;

        } catch (error) {
            console.error('❌ Contact update failed:', error);
            throw error;
        }
    }

    /**
     * Add supporter-specific tags
     */
    async addSupporterTags(contactId, supporterData) {
        try {
            const tags = [
                'Supporter',
                'Weekly_Giveback',
                this.getSupportLevel(supporterData.amount),
                this.getSupporterType(supporterData.amount)
            ];

            if (supporterData.includeInDrawing) {
                tags.push('Drawing_Participant');
            }

            // Add current month/year tags for tracking
            const now = new Date();
            tags.push(`Support_${now.getFullYear()}`);
            tags.push(`Support_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`);

            const response = await fetch(`${this.baseURL}/contacts/${contactId}/tags`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tags })
            });

            if (!response.ok) {
                throw new Error(`GHL tag addition failed: ${response.status}`);
            }

            console.log('✅ Tags added to contact:', tags);

        } catch (error) {
            console.error('❌ Tag addition failed:', error);
            // Don't throw - tags are nice to have but not critical
        }
    }

    /**
     * Trigger thank-you workflow in GHL
     */
    async triggerThankYouWorkflow(contactId, supporterData) {
        try {
            // Determine workflow based on support level
            const workflowId = this.getThankYouWorkflowId(supporterData.amount);
            
            if (!workflowId) {
                console.log('⚠️ No workflow configured for this support level');
                return;
            }

            const response = await fetch(`${this.baseURL}/contacts/${contactId}/workflow/${workflowId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventStartDate: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`GHL workflow trigger failed: ${response.status}`);
            }

            console.log('✅ Thank-you workflow triggered:', workflowId);

        } catch (error) {
            console.error('❌ Workflow trigger failed:', error);
            // Don't throw - workflow is nice to have but not critical
        }
    }

    /**
     * Get appropriate thank-you workflow ID based on support amount
     */
    getThankYouWorkflowId(amount) {
        // These would be configured in your GHL account
        const workflows = {
            major: process.env.GHL_WORKFLOW_MAJOR_SUPPORTER,     // $250+
            regular: process.env.GHL_WORKFLOW_REGULAR_SUPPORTER, // $100+
            standard: process.env.GHL_WORKFLOW_STANDARD_SUPPORTER // $25+
        };

        if (amount >= 250) return workflows.major;
        if (amount >= 100) return workflows.regular;
        return workflows.standard;
    }

    /**
     * Log supporter activity for tracking
     */
    async logSupporterActivity(contactId, supporterData) {
        try {
            const note = `Weekly Giveback Support: $${supporterData.amount} - ${supporterData.includeInDrawing ? 'Included' : 'Not included'} in drawing`;
            
            const response = await fetch(`${this.baseURL}/contacts/${contactId}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: note,
                    userId: 'system'
                })
            });

            if (!response.ok) {
                throw new Error(`GHL note creation failed: ${response.status}`);
            }

            console.log('✅ Activity logged for contact');

        } catch (error) {
            console.error('❌ Activity logging failed:', error);
            // Don't throw - logging is nice to have but not critical
        }
    }

    /**
     * Handle webhook from GHL (for two-way sync)
     */
    async handleGHLWebhook(webhookData) {
        try {
            console.log('📥 GHL webhook received:', webhookData.type);

            switch (webhookData.type) {
                case 'ContactCreate':
                    await this.handleContactCreate(webhookData);
                    break;
                case 'ContactUpdate':
                    await this.handleContactUpdate(webhookData);
                    break;
                case 'ContactDelete':
                    await this.handleContactDelete(webhookData);
                    break;
                default:
                    console.log('ℹ️ Unhandled webhook type:', webhookData.type);
            }

        } catch (error) {
            console.error('❌ Webhook handling failed:', error);
            throw error;
        }
    }

    /**
     * Handle contact creation webhook
     */
    async handleContactCreate(webhookData) {
        console.log('👤 New contact created in GHL:', webhookData.contact?.email);
        // Add any additional processing needed
    }

    /**
     * Handle contact update webhook
     */
    async handleContactUpdate(webhookData) {
        console.log('📝 Contact updated in GHL:', webhookData.contact?.email);
        // Add any additional processing needed
    }

    /**
     * Handle contact deletion webhook
     */
    async handleContactDelete(webhookData) {
        console.log('🗑️ Contact deleted in GHL:', webhookData.contact?.email);
        // Add any cleanup needed
    }

    /**
     * Get supporter statistics from GHL
     */
    async getSupporterStatistics() {
        try {
            // Get contacts with supporter tags
            const response = await fetch(`${this.baseURL}/contacts/search?tags=Supporter`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`GHL statistics fetch failed: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                totalSupporters: data.meta?.total || 0,
                newThisMonth: this.countNewSupportersThisMonth(data.contacts || []),
                drawingParticipants: this.countDrawingParticipants(data.contacts || [])
            };

        } catch (error) {
            console.error('❌ Statistics fetch failed:', error);
            return {
                totalSupporters: 0,
                newThisMonth: 0,
                drawingParticipants: 0
            };
        }
    }

    /**
     * Count new supporters this month
     */
    countNewSupportersThisMonth(contacts) {
        const now = new Date();
        const thisMonth = `Support_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        return contacts.filter(contact => 
            contact.tags && contact.tags.includes(thisMonth)
        ).length;
    }

    /**
     * Count drawing participants
     */
    countDrawingParticipants(contacts) {
        return contacts.filter(contact => 
            contact.tags && contact.tags.includes('Drawing_Participant')
        ).length;
    }

    /**
     * Send thank-you email with digital gifts
     */
    async sendThankYouEmail(contactId, supporterData) {
        try {
            const emailData = {
                contactId: contactId,
                templateId: this.getEmailTemplateId(supporterData.amount),
                customFields: {
                    supporter_name: supporterData.name,
                    support_amount: supporterData.amount,
                    support_level: this.getSupportLevel(supporterData.amount),
                    download_link: this.generateDownloadLink(supporterData),
                    drawing_status: supporterData.includeInDrawing ? 'included' : 'not included'
                }
            };

            const response = await fetch(`${this.baseURL}/contacts/${contactId}/email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                throw new Error(`GHL email send failed: ${response.status}`);
            }

            console.log('✅ Thank-you email sent');

        } catch (error) {
            console.error('❌ Thank-you email failed:', error);
            throw error;
        }
    }

    /**
     * Get email template ID based on support level
     */
    getEmailTemplateId(amount) {
        // These would be configured in your GHL account
        const templates = {
            major: process.env.GHL_EMAIL_TEMPLATE_MAJOR,
            regular: process.env.GHL_EMAIL_TEMPLATE_REGULAR,
            standard: process.env.GHL_EMAIL_TEMPLATE_STANDARD
        };

        if (amount >= 250) return templates.major;
        if (amount >= 100) return templates.regular;
        return templates.standard;
    }

    /**
     * Generate download link for digital gifts
     */
    generateDownloadLink(supporterData) {
        // Generate secure download link based on support level
        const baseUrl = process.env.DOWNLOAD_BASE_URL || 'https://digitalgrandpa.org/downloads';
        const token = this.generateSecureToken(supporterData);
        
        return `${baseUrl}/supporter-gift?token=${token}&level=${this.getSupportLevel(supporterData.amount)}`;
    }

    /**
     * Generate secure token for downloads
     */
    generateSecureToken(supporterData) {
        // In production, use proper JWT or similar
        const data = {
            email: supporterData.email,
            amount: supporterData.amount,
            timestamp: Date.now(),
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        return Buffer.from(JSON.stringify(data)).toString('base64');
    }
}

/**
 * Server-side webhook handler example
 */
const webhookHandlerExample = `
// Express.js webhook handler
app.post('/api/ghl-webhook', express.json(), async (req, res) => {
    try {
        const webhookData = req.body;
        
        // Verify webhook signature if configured
        if (process.env.GHL_WEBHOOK_SECRET) {
            const signature = req.headers['x-ghl-signature'];
            if (!verifyGHLSignature(req.body, signature)) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        
        // Process webhook
        const ghlHandler = new GHLIntegrationHandler();
        await ghlHandler.handleGHLWebhook(webhookData);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('GHL webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

function verifyGHLSignature(payload, signature) {
    // Implement signature verification
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GHLIntegrationHandler, webhookHandlerExample };
} else {
    window.GHLIntegrationHandler = GHLIntegrationHandler;
}

console.log('🎯 GHL Integration loaded');

