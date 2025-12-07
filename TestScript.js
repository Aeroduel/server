import fetch from "node-fetch";

const INTERVAL_MS = 5000;
const DURATION_MS = 15 * 60 * 1000;
const TARGET_URL = 'http://aeroduel.local:45045/api/test';

const results = [];

function generateASCIIChart(data) {
    const chartHeight = 10;
    const chart = Array(chartHeight).fill('');

    data.forEach((result, index) => {
        const symbol = result.success ? '█' : 'X';
        for (let i = 0; i < chartHeight; i++) {
            chart[i] += (i === chartHeight - 1) ? symbol : ' ';
        }
    });

    return chart.join('\n');
}

async function makeRequest() {
    try {
        const response = await fetch(TARGET_URL);
        results.push({
            timestamp: Date.now(),
            success: response.ok,
            status: response.status,
            error: null
        });
        console.log(`Request successful (status: ${response.status})`);
    } catch (error) {
        results.push({
            timestamp: Date.now(),
            success: false,
            status: null,
            error: error.message
        });
        console.error(`Request failed: ${error.message}`);
    }
}

function printSummary() {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = (successful / total * 100).toFixed(2);

    console.log('\nTest summary:');
    console.log(`Success rate: ${successRate}%`);
    console.log(`Total requests: ${total}`);
    console.log(`Successful requests: ${successful}`);
    console.log(`Failed requests: ${total - successful}`);
    console.log('\nRequest Timeline (█=success, X=failure):');
    console.log(generateASCIIChart(results));
}

async function main() {
    console.log('Starting requests...');
    const startTime = Date.now();

    const interval = setInterval(makeRequest, INTERVAL_MS);

    process.on('SIGINT', () => {
        clearInterval(interval);
        printSummary();
        process.exit(0);
    });

    setTimeout(() => {
        clearInterval(interval);
        printSummary();
    }, DURATION_MS);

    await makeRequest(); // Make first request immediately
}

main().catch(console.error);
