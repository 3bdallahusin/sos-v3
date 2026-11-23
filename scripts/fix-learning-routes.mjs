import fs from 'fs';

const content = fs.readFileSync('apps/api/src/routes/learning.ts', 'utf8');

const marker = `  // ----------------------------------------------------
  // DUAL-LAYER NOTES & UNIVERSAL CANVAS HOST ENDPOINTS`;

const endMarker = `      return reply.status(500).send({ error: 'Failed to process AI notes chat' });
    }
  });
};`;

// Split by marker
const parts = content.split(marker);
console.log('Found parts:', parts.length);

if (parts.length > 2) {
  // All parts except the last one had the marker inserted in place of "};"
  // Each part (from index 1 to parts.length - 2) ends with endMarker followed by original code
  let restored = parts[0];
  for (let i = 1; i < parts.length - 1; i++) {
    const afterMarker = parts[i];
    const endIdx = afterMarker.indexOf(endMarker);
    if (endIdx !== -1) {
      const restOfCode = afterMarker.slice(endIdx + endMarker.length);
      restored += '};\n' + restOfCode;
    } else {
      console.error('End marker not found in part', i);
    }
  }

  // The last part (index parts.length - 1) is the intended single insertion at the end of the file!
  restored += marker + parts[parts.length - 1];

  fs.writeFileSync('apps/api/src/routes/learning.ts', restored, 'utf8');
  console.log('Restored learning.ts successfully!');
}
