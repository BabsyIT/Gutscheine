const fs = require('fs');
const path = require('path');

// Generate random voucher code
function generateVoucherCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 3; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }
    return 'BABSY-' + segments.join('-');
}

// Main function
function generateVoucher(partnerName, customerId, description) {
    const dataPath = path.join(__dirname, '../data/vouchers.json');

    // Read current data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Create new voucher
    const voucher = {
        id: `voucher-${Date.now()}`,
        code: generateVoucherCode(),
        partner: partnerName,
        customerId: customerId,
        description: description || `Gutschein für ${partnerName}`,
        createdAt: new Date().toISOString(),
        isRedeemed: false,
        redeemedAt: null,
        redeemedBy: null
    };

    // Add to array
    data.vouchers.push(voucher);

    // Update stats
    data.stats.total = data.vouchers.length;
    data.stats.active = data.vouchers.filter(v => !v.isRedeemed).length;
    data.stats.redeemed = data.vouchers.filter(v => v.isRedeemed).length;
    data.lastUpdated = new Date().toISOString();

    // Write back
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    console.log('✅ Voucher generated successfully:');
    console.log(`   ID: ${voucher.id}`);
    console.log(`   Code: ${voucher.code}`);
    console.log(`   Partner: ${voucher.partner}`);
    console.log(`   Customer: ${voucher.customerId}`);
}

// Get arguments
const [,, partnerName, customerId, description] = process.argv;

if (!partnerName || !customerId) {
    console.error('❌ Error: Partner name and customer ID are required');
    process.exit(1);
}

generateVoucher(partnerName, customerId, description);
