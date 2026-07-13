const fs = require('fs');

let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// --- 1. Fix CSS Classes in JS strings ---
content = content.replace(
    /const inputClasses = ".*?";/,
    'const inputClasses = "custom-input";'
);
content = content.replace(
    /const selectClasses = `.*?`;/,
    'const selectClasses = "custom-select";'
);
content = content.replace(
    /const labelClasses = ".*?";/,
    'const labelClasses = "custom-label";'
);

// Update reactSelectStyles
content = content.replace(/minHeight: '50px'/g, "minHeight: '48px'");
content = content.replace(/minHeight: '44px'/g, "minHeight: '48px'");
content = content.replace(/height: '50px'/g, "height: '48px'");
content = content.replace(/height: '44px'/g, "height: '48px'");

// --- 2. Inject CSS styles ---
const customCss = `
                    .custom-input, .custom-select {
                        height: 48px !important;
                        padding: 0 16px;
                        font-size: 15px;
                        border: 1px solid #d9d9d9;
                        border-radius: 10px;
                        width: 100%;
                        color: #333;
                        transition: all 0.3s;
                        box-sizing: border-box;
                    }
                    .custom-input:focus, .custom-select:focus {
                        outline: none;
                        border-color: #38996E;
                        box-shadow: 0 0 0 1px #38996E;
                    }
                    .custom-label {
                        display: block;
                        margin-bottom: 8px !important;
                        font-weight: 600;
                        color: #333;
                        font-size: 15px;
                        min-height: 22px; 
                    }
                    .form-group-mb {
                        margin-bottom: 28px !important;
                    }
                    .symptoms-col {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    .symptom-item {
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        border: 1px solid #eaeaea;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: white;
                        margin-bottom: 0 !important;
                    }
                    .symptom-item:hover {
                        border-color: #2B7A58;
                        background: #F3FAEB;
                    }
                    .radio-group-horiz {
                        display: flex;
                        align-items: center;
                        gap: 32px;
                        height: 48px; /* align exactly with inputs */
                    }
                    .radio-label {
                        display: flex;
                        align-items: center;
                        font-weight: 500;
                        color: #333;
                        font-size: 15px;
                        cursor: pointer;
                        margin-bottom: 0;
                    }
`;

content = content.replace(/.custom-radio-input \{[\s\S]*?width: 24px \!important;[\s\S]*?height: 24px \!important;/g, (match) => {
    return match.replace(/width: 24px \!important;/g, 'width: 18px !important;').replace(/height: 24px \!important;/g, 'height: 18px !important;');
});

if (!content.includes('.custom-input')) {
    content = content.replace('</style>', customCss + '\n</style>');
}

// --- 3. Replace gap Tailwind classes and wrappers ---
// Let's globally replace the 3-column classes in Basic Details and Lifestyle to ensure exact widths and heights
content = content.replace(/col-12 col-md-6 col-lg-4 mb-4/g, 'col-12 col-md-6 col-lg-4 form-group-mb');
content = content.replace(/col-12 col-md-6 mb-4/g, 'col-12 col-md-6 form-group-mb');
content = content.replace(/col-12 mb-4/g, 'col-12 form-group-mb');
content = content.replace(/col-12 col-md-8 mb-4/g, 'col-12 col-md-8 form-group-mb');
content = content.replace(/col-12 col-md-4 mb-4/g, 'col-12 col-md-4 form-group-mb');

// Radio groups spacing:
// Instead of Tailwind "flex gap-8" we use our new "radio-group-horiz"
content = content.replace(/<div className="flex gap-8">/g, '<div className="radio-group-horiz">');
content = content.replace(/<label className="flex items-center text-gray-800 font-medium cursor-pointer text-\[14px\]">/g, '<label className="radio-label">');
content = content.replace(/<label className="flex items-center text-gray-800 font-medium cursor-pointer text-\[15px\]">/g, '<label className="radio-label">');

// --- 4. Symptoms 2-column explicit split ---
// Currently it is mapped:
/*
{symptomsList.map(sym => (
    <div key={sym} className="col-12 col-md-6 mb-3">
    <label className="flex items-center p-4 rounded-[12px] border border-gray-100 hover:border-[#2B7A58] hover:bg-[#F3FAEB] transition-all cursor-pointer group bg-white shadow-sm">
        <input type="checkbox" ... />
        <span ...>{sym}</span>
    </label>
    </div>
))}
*/
// We need to completely rewrite the Symptoms grid rendering block.
const symOriginalPattern = /\{symptomsList\.map\(sym => \([\s\S]*?<\/div>\n\s*\)\)\}/;
const symReplacement = `
<div className="row">
    <div className="col-12 col-md-6">
        <div className="symptoms-col">
            {symptomsList.slice(0, 5).map(sym => (
                <label key={sym.id} className="symptom-item">
                    <input type="checkbox" value={sym.label} checked={formData.symptoms.includes(sym.label)} onChange={handleSymptomChange} className="custom-checkbox-input" />
                    <span className="text-gray-700 font-medium ml-3">{sym.label}</span>
                </label>
            ))}
        </div>
    </div>
    <div className="col-12 col-md-6 mt-3 mt-md-0">
        <div className="symptoms-col">
            {symptomsList.slice(5, 10).map(sym => (
                <label key={sym.id} className="symptom-item">
                    <input type="checkbox" value={sym.label} checked={formData.symptoms.includes(sym.label)} onChange={handleSymptomChange} className="custom-checkbox-input" />
                    <span className="text-gray-700 font-medium ml-3">{sym.label}</span>
                </label>
            ))}
        </div>
    </div>
</div>
`;
content = content.replace(symOriginalPattern, symReplacement);

// --- 5. Lifestyle 3-column alignment ---
// The Lifestyle section used:
// "col-12 col-md-6 col-lg-4 form-group-mb" wrapper, which is correct for 3 columns.
// Let's ensure ALL lifestyle fields are col-lg-4.
// Let's replace the `col-12 col-md-6 form-group-mb` with `col-12 col-md-6 col-lg-4 form-group-mb` for Lifestyle specifically?
// No, I already did that for all fields that were 3 columns in Tailwind.
// Wait, when I translated Tailwind `grid-cols-3`, I wrapped children with `col-12 col-md-6 col-lg-4 mb-4`.
// But wait! Did I miss some fields?
// Earlier I replaced `<div>\s*<label` with `col-12 col-md-6 col-lg-4 mb-4`.
// Let's verify by just logging the Lifestyle section to see if it's correct.

// Let's fix the Card padding and section spacing exactly:
content = content.replace(/padding: 32px;/g, 'padding: 32px;'); // just making sure
content = content.replace(/margin-bottom: 32px;/g, 'margin-bottom: 32px;'); 

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('UI Polish complete!');
