const fs = require('fs');
const path = require('path');

const VOUCHERS_FILE = 'data/vouchers.json';
const actionType = process.env.ACTION_TYPE;
const voucherData = process.env.VOUCHER_DATA ? JSON.parse(process.env.VOUCHER_DATA) : null;

// Vouchers laden
let vouchers = [];
if (fs.existsSync(VOUCHERS_FILE)) {
  vouchers = JSON.parse(fs.readFileSync(VOUCHERS_FILE, 'utf8'));
}

console.log(`Action: ${actionType}`);
console.log(`Current vouchers: ${vouchers.length}`);

switch (actionType) {
  case 'create-voucher':
    if (voucherData) {
      vouchers.unshift(voucherData);
      console.log(`Created voucher: ${voucherData.code}`);
    }
    break;
    
  case 'redeem-voucher':
    if (voucherData) {
      const index = vouchers.findIndex(v => v.code === voucherData.code);
      if (index !== -1) {
        vouchers[index] = { ...vouchers[index], ...voucherData };
        console.log(`Redeemed voucher: ${voucherData.code}`);
      }
    }
    break;
    
  case 'delete-voucher':
    if (voucherData) {
      vouchers = vouchers.filter(v => v.id !== voucherData.id);
      console.log(`Deleted voucher: ${voucherData.id}`);
    }
    break;
}

// Speichern
fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2));
console.log(`Saved ${vouchers.length} vouchers`);
