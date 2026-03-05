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
      console.log('Mismatch at index', i, 'char', c);
      console.log('Stack (all):');
      for (let j=0; j<stack.length; j++){
        const it = stack[j];
        const before = s.slice(Math.max(0,it.i-40), it.i+40);
        console.log(j, it.c, 'idx', it.i, '\n', before, '\n---');
      }
      process.exit(1);
    }
  }
}
if (stack.length) {
  console.log('Remaining stack (unclosed):');
  for (let j=0;j<stack.length;j++){
    const it = stack[j];
    const before = s.slice(Math.max(0,it.i-40), it.i+40);
    console.log(j, it.c, 'idx', it.i, '\n', before, '\n---');
  }
  process.exit(2);
}
console.log('All balanced');
