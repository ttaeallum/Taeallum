import fetch from 'node-fetch';

async function testScrape(url: string) {
    console.log(`Testing: ${url}`);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        }
    });
    const html = await res.text();
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!dataMatch) {
        console.log("Could not find ytInitialData");
        return;
    }
    const data = JSON.parse(dataMatch[1]);
    console.log("Keys in data:", Object.keys(data).join(', '));
    if (data.contents) {
        console.log("Keys in data.contents:", Object.keys(data.contents).join(', '));
    } else {
        console.log("data.contents is missing");
    }
}

testScrape("https://www.youtube.com/playlist?list=PLDoPjPGz0dKfCHY0zU-oJ3XQ4j6b5P_9_");
