const fs = require('fs');
const s = fs.readFileSync('src/components/controls/karaoke/KaraokeManager.tsx','utf8');
const pairs = {'(':')','{':'}','[':']'};
const stack = [];
for (let i=0;i<s.length;i++){
  const c = s[i];
  if ('({['.includes(c)) stack.push({c,i});
  else if (')}]'.includes(c)){
    const last = stack.pop();
    if (!last || pairs[last.c] !== c) {
      const upto = s.slice(Math.max(0,i-120), i+40);
      console.log('Mismatch at index', i, 'char', c, 'lastOpen', last?last.c:null);
      console.log('Context around mismatch:\n', upto);
      process.exit(1);
    }
  }
}
if (stack.length) {
  const last = stack[stack.length-1];
  const upto = s.slice(Math.max(0,last.i-120), last.i+40);
  console.log('Unclosed at index', last.i, 'char', last.c);
  console.log('Context around unclosed:\n', upto);
  process.exit(2);
}
console.log('All balanced');
