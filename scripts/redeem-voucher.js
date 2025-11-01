const fs = require('fs');
const path = require('path');

// Main function
function redeemVoucher(voucherId, redeemedBy) {
    const dataPath = path.join(__dirname, '../data/vouchers.json');

    // Read current data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Find voucher
    const voucher = data.vouchers.find(v => v.id === voucherId || v.code === voucherId);

    if (!voucher) {
        console.error(`❌ Error: Voucher not found: ${voucherId}`);
        process.exit(1);
    }

    if (voucher.isRedeemed) {
        console.error(`❌ Error: Voucher already redeemed on ${voucher.redeemedAt}`);
        process.exit(1);
    }

    // Redeem voucher
    voucher.isRedeemed = true;
    voucher.redeemedAt = new Date().toISOString();
    voucher.redeemedBy = redeemedBy;

    // Update stats
    data.stats.active = data.vouchers.filter(v => !v.isRedeemed).length;
    data.stats.redeemed = data.vouchers.filter(v => v.isRedeemed).length;
    data.lastUpdated = new Date().toISOString();

    // Write back
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    console.log('✅ Voucher redeemed successfully:');
    console.log(`   Code: ${voucher.code}`);
    console.log(`   Partner: ${voucher.partner}`);
    console.log(`   Customer: ${voucher.customerId}`);
    console.log(`   Redeemed by: ${redeemedBy}`);
    console.log(`   Redeemed at: ${voucher.redeemedAt}`);
}

// Get arguments
const [,, voucherId, redeemedBy] = process.argv;

if (!voucherId || !redeemedBy) {
    console.error('❌ Error: Voucher ID and redeemed by are required');
    process.exit(1);
}

redeemVoucher(voucherId, redeemedBy);
