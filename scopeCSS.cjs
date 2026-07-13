const fs = require('fs');

let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// 1. Add .consultation-page class to the main container
content = content.replace(/<div className="py-16 bg-\[#F3F3F3\]">/, '<div className="consultation-page py-16 bg-[#F3F3F3]">');

// 2. Extract the <style> block
const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>') + '</style>'.length;

if (styleStart !== -1 && styleEnd !== -1) {
    let styleBlock = content.substring(styleStart, styleEnd);
    
    // Prefix custom classes with .consultation-page
    const classesToScope = [
        '.custom-checkbox-input:checked',
        '.custom-checkbox-input',
        '.custom-radio-input:checked::after',
        '.custom-radio-input:checked',
        '.custom-radio-input',
        '.custom-select-bg',
        '.section-card',
        '.form-container',
        '.custom-input:focus, .custom-select:focus',
        '.custom-input, .custom-select',
        '.custom-label',
        '.form-group-mb',
        '.symptoms-col',
        '.symptom-item:hover',
        '.symptom-item',
        '.radio-group-horiz',
        '.radio-label'
    ];
    
    // Simplest approach: just split by lines and replace if it starts with the class
    let styleLines = styleBlock.split('\\n');
    for (let i = 0; i < styleLines.length; i++) {
        let line = styleLines[i];
        
        for (const cls of classesToScope) {
            // Check if the line contains the class definition (i.e. followed by { or , or just space)
            if (line.includes(cls)) {
                // To avoid replacing inside properties or values, we only replace if it's a selector line
                if (line.includes('{') || line.includes(',')) {
                    // Split the selector by comma
                    const parts = cls.split(',').map(p => p.trim());
                    const scoped = parts.map(p => '.consultation-page ' + p).join(', ');
                    line = line.replace(cls, scoped);
                }
            }
        }
        styleLines[i] = line;
    }
    
    styleBlock = styleLines.join('\\n');
    
    content = content.substring(0, styleStart) + styleBlock + content.substring(styleEnd);
}

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('CSS scoped to .consultation-page successfully!');
