const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safeRegex = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

// Attack string: many parts separated by dots, but fail at the end?
// Or many characters that are NOT dots, then force backtracking?
// The problem is that [^\s@]+ matches dots.

// Try a string that matches [^\s@]+ but forces backtracking for the literal dot.
const attackString = 'a@' + 'a.'.repeat(50000) + 'a';
console.time('Old Regex');
regex.test(attackString);
console.timeEnd('Old Regex');

console.time('New Regex');
safeRegex.test(attackString);
console.timeEnd('New Regex');
