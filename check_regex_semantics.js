const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const newRegex = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

const email1 = 'foo@bar.com';
const email2 = 'foo@sub.domain.com';
const email3 = 'foo@a.b.c.d.e.f.g';

console.log('Old Regex:');
console.log(email1, regex.test(email1));
console.log(email2, regex.test(email2));
console.log(email3, regex.test(email3));

console.log('New Regex:');
console.log(email1, newRegex.test(email1));
console.log(email2, newRegex.test(email2));
console.log(email3, newRegex.test(email3));
