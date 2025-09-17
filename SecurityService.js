const DatabaseService = require('./DatabaseService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');

class SecurityService {
  constructor() {
    this.isInitialized = false;
    this.activeThreats = new Map();
    this.securityMetrics = {
      threatLevel: 'low',
      activeAlerts: 0,
      failedLogins: 0,
      suspiciousActivities: 0
    };
    this.zeroTrustRules = [];
    this.auditTrail = [];
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  async initialize() {
    await this.initializeZeroTrustRules();
    await this.startSecurityMonitoring();
    await this.initializeEncryption();
    this.isInitialized = true;
    console.log('🔒 Security Service initialized with Zero-Trust architecture');
  }

  async initializeZeroTrustRules() {
    this.zeroTrustRules = [
      {
        id: 'auth_verification',
        name: 'Authentication Verification',
        description: 'All requests must be authenticated',
        enabled: true,
        action: 'verify_token'
      },
      {
        id: 'rate_limiting',
        name: 'Rate Limiting',
        description: 'Limit requests per IP/user',
        enabled: true,
        limit: 100,
        window: 3600 // 1 hour
      },
      {
        id: 'data_encryption',
        name: 'Data Encryption',
        description: 'All sensitive data must be encrypted',
        enabled: true,
        algorithm: 'aes-256-gcm'
      },
      {
        id: 'transaction_verification',
        name: 'Transaction Verification',
        description: 'High-value transactions require additional verification',
        enabled: true,
        threshold: 10000
      },
      {
        id: 'geo_blocking',
        name: 'Geo Blocking',
        description: 'Block requests from high-risk countries',
        enabled: true,
        blockedCountries: ['XX', 'YY'] // Example blocked countries
      }
    ];
  }

  startSecurityMonitoring() {
    // Security scan every 10 seconds
    cron.schedule('*/10 * * * * *', () => {
      this.runSecurityScan();
    });

    // Threat analysis every minute
    cron.schedule('* * * * *', () => {
      this.analyzeThreatLevel();
    });

    // Generate security report every hour
    cron.schedule('0 * * * *', () => {
      this.generateSecurityReport();
    });
  }

  async initializeEncryption() {
    // Generate or load encryption keys
    this.encryptionConfig = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      saltLength: 32,
      tagLength: 16
    };
  }

  // Authentication & Authorization
  async authenticateUser(username, password) {
    try {
      const user = await DatabaseService.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      );

      if (!user) {
        await this.logSecurityEvent('auth_failed', 'medium', `Failed login attempt for user: ${username}`);
        this.securityMetrics.failedLogins++;
        return { success: false, error: 'Invalid credentials' };
      }

      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        await this.logSecurityEvent('auth_failed', 'medium', `Invalid password for user: ${username}`);
        this.securityMetrics.failedLogins++;
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = this.generateJWT(user);
      
      // Update last login
      await DatabaseService.run(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date().toISOString(), user.id]
      );

      await this.logSecurityEvent('auth_success', 'low', `Successful login for user: ${username}`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  generateJWT(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.sign(payload, secret);
  }

  async verifyJWT(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret);
      
      // Additional checks
      const user = await DatabaseService.get(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (!user) {
        throw new Error('User not found or inactive');
      }

      return { valid: true, user: decoded };
    } catch (error) {
      await this.logSecurityEvent('token_invalid', 'medium', `Invalid token verification: ${error.message}`);
      return { valid: false, error: error.message };
    }
  }

  // Zero-Trust Verification
  async verifyRequest(req) {
    const verificationResults = {
      passed: true,
      checks: [],
      riskScore: 0
    };

    // Check authentication
    const authCheck = await this.checkAuthentication(req);
    verificationResults.checks.push(authCheck);
    if (!authCheck.passed) verificationResults.passed = false;

    // Check rate limiting
    const rateCheck = await this.checkRateLimit(req);
    verificationResults.checks.push(rateCheck);
    if (!rateCheck.passed) verificationResults.passed = false;

    // Check geo-location
    const geoCheck = await this.checkGeoLocation(req);
    verificationResults.checks.push(geoCheck);
    verificationResults.riskScore += geoCheck.riskScore;

    // Check for suspicious patterns
    const patternCheck = await this.checkSuspiciousPatterns(req);
    verificationResults.checks.push(patternCheck);
    verificationResults.riskScore += patternCheck.riskScore;

    return verificationResults;
  }

  async checkAuthentication(req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { name: 'authentication', passed: false, reason: 'No token provided' };
    }

    const verification = await this.verifyJWT(token);
    return {
      name: 'authentication',
      passed: verification.valid,
      reason: verification.valid ? 'Token valid' : verification.error
    };
  }

  async checkRateLimit(req) {
    const key = req.ip || 'unknown';
    const rule = this.zeroTrustRules.find(r => r.id === 'rate_limiting');
    
    if (!rule || !rule.enabled) {
      return { name: 'rate_limit', passed: true, reason: 'Rate limiting disabled' };
    }

    // Simple in-memory rate limiting (in production, use Redis)
    const now = Date.now();
    const windowStart = now - (rule.window * 1000);
    
    // This is a simplified implementation
    return { name: 'rate_limit', passed: true, reason: 'Within rate limits' };
  }

  async checkGeoLocation(req) {
    // Simulate geo-location check
    const clientIP = req.ip || req.connection.remoteAddress;
    const country = this.getCountryFromIP(clientIP); // Simulated
    
    const rule = this.zeroTrustRules.find(r => r.id === 'geo_blocking');
    if (rule && rule.enabled && rule.blockedCountries.includes(country)) {
      return {
        name: 'geo_location',
        passed: false,
        reason: `Blocked country: ${country}`,
        riskScore: 0.8
      };
    }

    return {
      name: 'geo_location',
      passed: true,
      reason: 'Location allowed',
      riskScore: 0.1
    };
  }

  getCountryFromIP(ip) {
    // Simulate IP to country lookup
    const countries = ['US', 'GB', 'DE', 'JP', 'CA'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  async checkSuspiciousPatterns(req) {
    let riskScore = 0;
    const patterns = [];

    // Check for rapid consecutive requests
    if (this.isRapidRequests(req.ip)) {
      riskScore += 0.3;
      patterns.push('rapid_requests');
    }

    // Check for unusual request patterns
    if (this.isUnusualPattern(req)) {
      riskScore += 0.2;
      patterns.push('unusual_pattern');
    }

    return {
      name: 'suspicious_patterns',
      passed: riskScore < 0.5,
      reason: patterns.length > 0 ? `Patterns detected: ${patterns.join(', ')}` : 'No suspicious patterns',
      riskScore
    };
  }

  isRapidRequests(ip) {
    // Simplified check for demonstration
    return Math.random() < 0.1; // 10% chance of being flagged
  }

  isUnusualPattern(req) {
    // Simplified pattern detection
    return Math.random() < 0.05; // 5% chance of unusual pattern
  }

  // Encryption & Decryption
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(this.encryptionConfig.ivLength);
      const salt = crypto.randomBytes(this.encryptionConfig.saltLength);
      const key = crypto.pbkdf2Sync(this.encryptionKey, salt, 100000, this.encryptionConfig.keyLength, 'sha256');
      
      const cipher = crypto.createCipher(this.encryptionConfig.algorithm, key);
      cipher.setAAD(Buffer.from('additional-data'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  decrypt(encryptedData) {
    try {
      const { encrypted, iv, salt, tag } = encryptedData;
      const key = crypto.pbkdf2Sync(this.encryptionKey, Buffer.from(salt, 'hex'), 100000, this.encryptionConfig.keyLength, 'sha256');
      
      const decipher = crypto.createDecipher(this.encryptionConfig.algorithm, key);
      decipher.setAAD(Buffer.from('additional-data'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  // Security Monitoring
  async runSecurityScan() {
    const threats = [];

    // Check for failed login attempts
    const recentFailedLogins = await DatabaseService.all(
      `SELECT COUNT(*) as count FROM security_events 
       WHERE event_type = 'auth_failed' 
       AND timestamp > datetime('now', '-1 hour')`
    );

    if (recentFailedLogins[0]?.count > 10) {
      threats.push({
        type: 'brute_force',
        severity: 'high',
        description: `${recentFailedLogins[0].count} failed login attempts in the last hour`
      });
    }

    // Check for suspicious activities
    const suspiciousEvents = await DatabaseService.all(
      `SELECT COUNT(*) as count FROM security_events 
       WHERE severity = 'high' 
       AND timestamp > datetime('now', '-30 minutes')`
    );

    if (suspiciousEvents[0]?.count > 5) {
      threats.push({
        type: 'suspicious_activity',
        severity: 'high',
        description: `${suspiciousEvents[0].count} high-severity events in 30 minutes`
      });
    }

    // Update active threats
    for (const threat of threats) {
      this.activeThreats.set(threat.type, {
        ...threat,
        detectedAt: new Date(),
        resolved: false
      });
    }

    this.securityMetrics.activeAlerts = this.activeThreats.size;
  }

  analyzeThreatLevel() {
    const threatCount = this.activeThreats.size;
    const failedLogins = this.securityMetrics.failedLogins;

    if (threatCount >= 3 || failedLogins > 20) {
      this.securityMetrics.threatLevel = 'critical';
    } else if (threatCount >= 2 || failedLogins > 10) {
      this.securityMetrics.threatLevel = 'high';
    } else if (threatCount >= 1 || failedLogins > 5) {
      this.securityMetrics.threatLevel = 'medium';
    } else {
      this.securityMetrics.threatLevel = 'low';
    }
  }

  async generateSecurityReport() {
    const report = {
      timestamp: new Date(),
      threatLevel: this.securityMetrics.threatLevel,
      activeThreats: Array.from(this.activeThreats.values()),
      metrics: this.securityMetrics,
      recentEvents: await this.getRecentSecurityEvents(),
      recommendations: this.generateSecurityRecommendations()
    };

    console.log('📊 Security Report Generated:', {
      threatLevel: report.threatLevel,
      activeThreats: report.activeThreats.length,
      failedLogins: report.metrics.failedLogins
    });

    return report;
  }

  async getRecentSecurityEvents() {
    return await DatabaseService.all(
      `SELECT * FROM security_events 
       WHERE timestamp > datetime('now', '-24 hours') 
       ORDER BY timestamp DESC 
       LIMIT 50`
    );
  }

  generateSecurityRecommendations() {
    const recommendations = [];

    if (this.securityMetrics.threatLevel === 'critical') {
      recommendations.push('Consider enabling additional security measures');
      recommendations.push('Review and update access controls');
    }

    if (this.securityMetrics.failedLogins > 10) {
      recommendations.push('Implement stricter rate limiting');
      recommendations.push('Consider IP blocking for repeated failures');
    }

    if (this.activeThreats.size > 0) {
      recommendations.push('Investigate and resolve active threats');
    }

    return recommendations;
  }

  async logSecurityEvent(eventType, severity, description, userId = null, sourceIP = null) {
    await DatabaseService.run(
      'INSERT INTO security_events (event_type, severity, description, user_id, source_ip) VALUES (?, ?, ?, ?, ?)',
      [eventType, severity, description, userId, sourceIP]
    );

    this.auditTrail.push({
      timestamp: new Date(),
      eventType,
      severity,
      description,
      userId,
      sourceIP
    });

    // Keep audit trail size manageable
    if (this.auditTrail.length > 1000) {
      this.auditTrail = this.auditTrail.slice(-500);
    }
  }

  // Human approval for critical actions
  async requireHumanApproval(action, details) {
    const approvalRequest = {
      id: crypto.randomBytes(16).toString('hex'),
      action,
      details,
      requestedAt: new Date(),
      status: 'pending',
      requiredApprovals: 1,
      approvals: []
    };

    console.log('👤 Human approval required for:', action);
    
    // In a real implementation, this would notify administrators
    // For demo purposes, we'll auto-approve after a short delay
    setTimeout(() => {
      this.approveAction(approvalRequest.id, 'system', 'Auto-approved for demo');
    }, 5000);

    return approvalRequest;
  }

  approveAction(requestId, approver, comment) {
    console.log(`✅ Action approved by ${approver}: ${comment}`);
    // Implementation would update the approval status
  }

  getSecurityMetrics() {
    return {
      ...this.securityMetrics,
      activeThreats: Array.from(this.activeThreats.values()),
      auditTrailCount: this.auditTrail.length
    };
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).reverse();
  }

  isHealthy() {
    return this.isInitialized && this.securityMetrics.threatLevel !== 'critical';
  }
}

module.exports = new SecurityService();