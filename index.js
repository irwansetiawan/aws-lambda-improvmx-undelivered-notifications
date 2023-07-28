import https from 'https';
import * as config from './config.js';
import { ImprovMX } from 'improvmx-node-client';

export const handler = async(event) => {
    let domainLogs = {};
    let failedDomainLogs = {};

    for (const domain in config.improvmxApiKeys) {
        const apiKey = config.improvmxApiKeys[domain];

        const improvMx = new ImprovMX({ api_key: apiKey });
        const logs = await improvMx.getLogsForDomain(domain)
        
        if (logs) {
            
            for (const log of logs) {
                // Skip logs older than the lookback period
                if (log.created < new Date().getTime() - config.logLookbackPeriod) continue;
                
                domainLogs[domain] = domainLogs[domain] || [];
                domainLogs[domain].push(log);
                
                let failed = false;
                for (const event of log.events) {
                    if (!['QUEUED', 'DELIVERED'].includes(event.status)) {
                        failed = true;
                    }
                }
                if (failed) {
                    failedDomainLogs[domain] = failedDomainLogs[domain] || [];
                    failedDomainLogs[domain].push(log);
                }
            }
        }
    }
    
    let slackContent = '';
    
    for (const domain in failedDomainLogs) {
        const logs = failedDomainLogs[domain];
        for (const log of logs) {
            if (slackContent.length == 0) {
                slackContent += 'Recent failed emails:\n';
            }
            const d = new Date(log.created);
            slackContent += '* [' + new Date(log.created).toDateString() + '] ' + 
                            ' *' + log.subject + '* from `' + log.sender.email + '`' +
                            ' <' + log.url + '|download>' +
                            '\n';
        }
    }
    if (slackContent.length > 0) {
        const options = {
            method: 'POST',
            hostname: 'slack.com',
            path: '/api/chat.postMessage',
            headers: {
                Authorization: 'Bearer ' + config.slackBotToken,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        const postData = 'channel=' + config.slackChannelId + '&text=' + encodeURIComponent(slackContent);
        await new Promise((resolve, reject) => {
            const req = https.request(options, (response) => {
                var result = ''
                response.on('data', function (chunk) {
                    result += chunk;
                });
                response.on('end', function () {
                    resolve(result);
                });
            });
            req.write(postData);
            req.end();
            req.on('error', function (e) { reject(e); });
        });
    }
    
    const response = {
        statusCode: 200,
        contentType: 'application/json',
        body: JSON.stringify(failedDomainLogs, null, 4),
    };
    return response;
};
