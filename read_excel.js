const xlsx = require('xlsx');
const path = require('path');
const file = path.resolve('final superadmin report from antigravity (1).xlsx');
const workbook = xlsx.readFile(file);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);
console.log(JSON.stringify(data, null, 2));
