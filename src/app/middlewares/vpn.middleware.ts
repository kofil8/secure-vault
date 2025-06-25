import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { ALLOWED_COUNTRIES, DEDICATED_IP } from '../config/security';

export const vpnRestriction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get client IP from request (handling proxy headers)
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Handle cases where x-forwarded-for might be a list
        if (typeof clientIp === 'string' && clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }

        // Verify the IP matches your dedicated IP
        if (clientIp !== DEDICATED_IP) {
            console.warn(`Unauthorized access attempt from IP: ${clientIp}`);
            return res.status(403).json({ 
                success: false,
                error: 'Access restricted. Please connect using your dedicated NordVPN IP.' 
            });
        }

        // Optional country verification (if enabled)
        if (process.env.VERIFY_COUNTRY === 'true') {
            try {
                // Using ip-api.com for geolocation (free tier)
                const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
                const country = response.data.country;
                
                if (!ALLOWED_COUNTRIES.includes(country)) {
                    console.warn(`Access attempt from restricted country: ${country}`);
                    return res.status(403).json({ 
                        success: false,
                        error: `Access restricted from ${country}. Please connect from an allowed country.` 
                    });
                }
            } catch (geoError) {
                console.error('Geolocation check failed:', geoError);
                // Fail open - allow access if geolocation fails
                // For stricter security, you could fail closed:
                // return res.status(403).json({ error: 'Geolocation verification failed' });
            }
        }

        next();
    } catch (error: any) {
        console.error('VPN verification failed:', error);
        res.status(403).json({ 
            success: false,
            error: 'VPN verification failed. Access denied.' 
        });
    }
};

export const vpnCheck = (req: Request, res: Response, next: NextFunction) => {
    // Simplified version without async/await for basic checks
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (clientIp !== DEDICATED_IP) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid access IP' 
        });
    }
    
    next();
};