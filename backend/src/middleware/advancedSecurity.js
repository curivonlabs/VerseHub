import crypto from 'crypto';

/**
 * 1. Deep Object Sanitizer (Removes NoSQL injection operators like $ne, $gt, $where and XSS strings)
 */
export const sanitizeInput = (data) => {
    if (data === null || typeof data !== 'object') {
        if (typeof data === 'string') {
            // Strip out potential script injection tags and basic dangerous patterns
            return data
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .trim();
        }
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeInput(item));
    }

    const sanitizedObj = {};
    for (const key of Object.keys(data)) {
        // Block MongoDB operator keys ($gt, $set, $where, etc.) to prevent NoSQL injection
        if (key.startsWith('$') || key.includes('.')) {
            continue; 
        }
        sanitizedObj[key] = sanitizeInput(data[key]);
    }
    return sanitizedObj;
};

/**
 * 2. Comprehensive Security Middleware Suite
 */
export const advancedSecurity = () => {
    return (req, res, next) => {
        try {
            // --- A. Secure Headers Hardening (Zero-dependency custom implementation) ---
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '0'); // Modern best practice: disable buggy built-in browser filters, rely on CSP
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none';");
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            res.removeHeader('X-Powered-By'); // Hide Express fingerprint

            // --- B. Strict Content-Type Enforcement for mutating requests ---
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const contentType = req.headers['content-type'];
                if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
                    return res.status(415).json({
                        success: false,
                        error: 'Unsupported Media Type. Mutations must use application/json or multipart/form-data.',
                        status_code: 415,
                    });
                }
            }

            // --- C. HTTP Parameter Pollution (HPP) Defense ---
            for (const key of Object.keys(req.query)) {
                if (Array.isArray(req.query[key])) {
                    req.query[key] = req.query[key][req.query[key].length - 1];
                }
            }

            // --- D. Deep Sanitization & NoSQL Injection Protection ---
            if (req.body && typeof req.body === 'object') {
                req.body = sanitizeInput(req.body);
            }
            if (req.query && typeof req.query === 'object') {
                req.query = sanitizeInput(req.query);
            }
            if (req.params && typeof req.params === 'object') {
                req.params = sanitizeInput(req.params);
            }

            next();
        } catch (err) {
            console.error('Security Middleware Fault:', err);
            return res.status(400).json({ 
              success: false,
              error: 'Bad Request / Security Violation Detected.',
              status_code: 400,
            });
        }
    };
};

/**
 * 3. Constant-Time String Comparison (Prevents Timing Attacks against API keys/tokens)
 */
export const secureCompare = (a, b) => {
    try {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        if (bufA.length !== bufB.length) {
            crypto.timingSafeEqual(bufA, bufA);
            return false;
        }
        return crypto.timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
};

/**
 * 4. Request Signature / Webhook Verification (Cryptographic payload verification from scratch)
 */
export const verifyHmacSignature = (secretKey, headerName = 'x-signature') => {
    return (req, res, next) => {
        const signature = req.headers[headerName];
        if (!signature) {
            return res.status(401).json({ 
              success: false,
              error: 'Missing security signature header.',
              status_code: 401,
            });
        }

        const computedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(JSON.stringify(req.body || {}))
            .digest('hex');

        if (!secureCompare(signature, computedSignature)) {
            return res.status(403).json({
              success: false,
              error: 'Invalid cryptographic signature.',
              status_code: 403,
            });
        }

        next();
    };
};