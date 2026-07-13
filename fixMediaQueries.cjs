const fs = require('fs');

let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// Fix the un-prefixed @media query classes
content = content.replace(
    /@media \(min-width: 768px\) \{\s*\.section-card \{ padding: 32px; \}\s*\}/g,
    '@media (min-width: 768px) { .consultation-page .section-card { padding: 32px; } }'
);

content = content.replace(
    /@media \(min-width: 768px\) \{\s*\.form-container \{ padding: 32px; \}\s*\}/g,
    '@media (min-width: 768px) { .consultation-page .form-container { padding: 32px; } }'
);

// Double check if there are any other un-prefixed classes
// In previous script, I searched for `.section-card` and replaced with `.consultation-page .section-card` but it only replaced the first occurrence!
// Wait! `replace()` in JS only replaces the FIRST occurrence unless a regex with `/g` is used!
// Oh my god. My previous script:
// `line = line.replace(cls, scoped);`
// It was iterating line by line, so it DID replace it if it was on a separate line.
// The @media queries had `.section-card` on the SAME line as `@media`, or indented.
// Actually, they look like this: `                        .section-card { padding: 32px; }`
// Let's just do a thorough regex replace to ensure absolutely NO naked `.section-card` or `.form-container` remains in the style block.

let styleStart = content.indexOf('<style>');
let styleEnd = content.indexOf('</style>') + '</style>'.length;

if (styleStart !== -1 && styleEnd !== -1) {
    let styleBlock = content.substring(styleStart, styleEnd);
    
    // Make sure .section-card and .form-container are fully prefixed inside the style block
    styleBlock = styleBlock.replace(/(?<!\.consultation-page\s)\.section-card/g, '.consultation-page .section-card');
    styleBlock = styleBlock.replace(/(?<!\.consultation-page\s)\.form-container/g, '.consultation-page .form-container');
    
    content = content.substring(0, styleStart) + styleBlock + content.substring(styleEnd);
}

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Fixed leaked @media classes!');
