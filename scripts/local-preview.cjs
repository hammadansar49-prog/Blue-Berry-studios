process.env.PORT='53836';
process.argv.push('--serve');
console.log('Local preview: http://127.0.0.1:53836/?scenario=invoice');
console.log('Keep this terminal open. Refresh browser after edits. Ctrl+C stops the server.');
require('./print-ui.cjs');
