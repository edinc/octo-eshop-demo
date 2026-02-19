const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeRegex = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

const attackString = 'a@' + 'a'.repeat(50000) + '!';
console.time('Old Regex');
regex.test(attackString);
console.timeEnd('Old Regex');

console.time('New Regex');
safeRegex.test(attackString);
console.timeEnd('New Regex');
