const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');
const lines = content.split('\n');

// Find boundaries
const formStart = lines.findIndex(l => l.includes('<form ref={formRef} id="consultationForm" onSubmit={handleSubmit}>'));
const sec1Start = lines.findIndex((l, i) => i > formStart && l.includes('1️⃣') || l.includes('Basic Details') && l.includes('flex items-center'));
const sec2Start = lines.findIndex((l, i) => i > sec1Start && l.includes('2️⃣') || l.includes('Main Health Concern') && l.includes('flex items-center'));
const inferStart = lines.findIndex((l, i) => i > sec2Start && l.includes('{(formData.mainHealthIssue === \'PCOS\''));
const sec4Start = lines.findIndex((l, i) => i > inferStart && l.includes('Lifestyle Details'));
const sec5Start = lines.findIndex((l, i) => i > sec4Start && l.includes('Current Food Pattern'));
const sec6Start = lines.findIndex((l, i) => i > sec5Start && l.includes('Body Symptoms'));
const sec7Start = lines.findIndex((l, i) => i > sec6Start && l.includes('Commitment Level'));
const sec8Start = lines.findIndex((l, i) => i > sec7Start && l.includes('Appointment Details'));
const formEnd = lines.findIndex((l, i) => i > sec8Start && l.includes('Submit Registration')) - 2;

// The exact lines for each block
const headerAndSec1 = lines.slice(0, sec2Start - 2); 
const sec2AndInfer = lines.slice(sec2Start - 2, sec4Start - 2);
const sec4Lifestyle = lines.slice(sec4Start - 2, sec5Start - 2);
const sec5Food = lines.slice(sec5Start - 2, sec6Start - 2);
const sec6Symptoms = lines.slice(sec6Start - 2, sec7Start - 2);
const sec7Commitment = lines.slice(sec7Start - 2, sec8Start - 2);
const sec8Appointment = lines.slice(sec8Start - 2, formEnd);
const footer = lines.slice(formEnd);

// Reassemble in correct order: 
// Sec1 -> Sec2&Infer -> Symptoms(3) -> Lifestyle(4) + Food -> Appointment(5) -> Commitment(6)
let newLines = [
    ...headerAndSec1,
    ...sec2AndInfer,
    ...sec6Symptoms,
    ...sec4Lifestyle,
    ...sec5Food,
    ...sec8Appointment,
    ...sec7Commitment,
    ...footer
];

let newContent = newLines.join('\n');

// Now perform all layout and styling replacements on newContent!

// 1. Update Card CSS
newContent = newContent.replace(
    /\.section-card \{\s*background-color: white;\s*border-radius: 18px;\s*box-shadow: 0 4px 6px -1px rgba\(0, 0, 0, 0\.05\), 0 2px 4px -1px rgba\(0, 0, 0, 0\.03\);\s*padding: 24px;\s*margin-bottom: 40px;\s*animation: heroFadeIn 0\.6s ease-out forwards;\s*\}/g,
    `.section-card {
                        background-color: white;
                        border-radius: 20px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        padding: 32px;
                        margin-bottom: 32px;
                        animation: heroFadeIn 0.6s ease-out forwards;
                    }`
);
newContent = newContent.replace(
    /\@media \(min-width: 768px\) \{\s*\.section-card \{ padding: 40px; \}\s*\}/g,
    `@media (min-width: 768px) {
                        .section-card { padding: 32px; }
                    }`
);
newContent = newContent.replace(
    /padding: 20px;/g,
    `padding: 32px;`
); // form-container padding
newContent = newContent.replace(
    /\@media \(min-width: 768px\) \{\s*\.form-container \{ padding: 40px; \}\s*\}/g,
    `@media (min-width: 768px) {
                        .form-container { padding: 32px; }
                    }`
);

// 2. Input Styles
newContent = newContent.replace(
    /border border-gray-200 rounded-\[10px\]/g,
    `border border-[#d9d9d9] rounded-[10px]`
);

// Form item margin bottom
newContent = newContent.replace(/mb-6/g, 'mb-[28px]'); // mb-6 was 24px, user wants 28px
newContent = newContent.replace(/mb-4/g, 'mb-[28px]'); // replace all mb-4 wrapper margins to 28px

// Grid replacements
newContent = newContent.replace(/<div className="flex flex-wrap -mx-\[15px\]">/g, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');
newContent = newContent.replace(/<div className="w-full md:w-1\/2 lg:w-1\/3 px-\[15px\] mb-\[28px\]">/g, '<div>');
newContent = newContent.replace(/<div className="w-full lg:w-1\/2 px-\[15px\] mb-\[28px\]">/g, '<div>');
newContent = newContent.replace(/<div className="w-full md:w-1\/2 px-\[15px\] mb-\[28px\]">/g, '<div>');
newContent = newContent.replace(/<div className="w-full md:w-1\/4 px-\[15px\] mb-\[28px\]">/g, '<div>');
newContent = newContent.replace(/<div className="w-full md:w-1\/3 px-\[15px\] mb-\[28px\]">/g, '<div>');
newContent = newContent.replace(/<div className="w-full px-\[15px\] mb-\[28px\]">/g, '<div className="col-span-1 md:col-span-2 lg:col-span-3">');

// Specific grid columns overrides
// Sec 1 Country (needs to be full width)
newContent = newContent.replace(/<div>\s*<label className=\{labelClasses\}>Country/g, '<div className="col-span-1 md:col-span-2 lg:col-span-3">\n                                                        <label className={labelClasses}>Country');

// Sec 2 Main Health Concern grid wrapper
// The layout currently uses naked divs without a wrap.
let sec2GridFind = `<div className="flex items-center mb-\[28px\]"><div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">2</div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">Main Health Concern</h2></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    <div>`;
let sec2GridReplace = `<div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">2</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Main Health Concern</h2></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="md:col-span-2">`;
newContent = newContent.replace(sec2GridFind, sec2GridReplace);

// Merge Section 4 & 5
// Sec 5 header needs to be completely wiped out so it flows into the grid.
let sec5HeaderFind = `</div>
                                                <div className="section-card">
                                                {/* 5. Current Food Pattern */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">5</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Current Food Pattern</h2></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
let sec5HeaderReplace = ``;
newContent = newContent.replace(sec5HeaderFind, sec5HeaderReplace);

// Update all section headers correctly
newContent = newContent.replace(
    /<div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">3<\/div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">For Infertility Clients/g,
    `<div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">*</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">For Infertility Clients`
);

newContent = newContent.replace(
    /<div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">\d<\/div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">Body Symptoms/g,
    `<div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">3</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Symptoms`
);

newContent = newContent.replace(
    /<div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">\d<\/div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">Lifestyle Details/g,
    `<div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">4</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Additional Information`
);

newContent = newContent.replace(
    /<div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">\d<\/div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">Appointment Details/g,
    `<div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">5</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Appointment Preferences`
);

newContent = newContent.replace(
    /<div className="w-8 h-8 rounded-\[8px\] bg-\[#E8F5E9\] text-\[#2B7A58\] flex items-center justify-center font-bold mr-3 text-\[15px\]">\d<\/div><h2 className="text-\[18px\] md:text-\[20px\] font-bold text-gray-800">Commitment Level/g,
    `<div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">6</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Commitment`
);

// Symptoms grid styling
// The symptoms are currently using `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-4 mb-[28px]`. We'll just leave it as is, or make it exactly match:
newContent = newContent.replace(/gap-y-5 gap-x-4/g, 'gap-6');

// Commitment grid styling
// The commitment uses naked divs originally, let's wrap them in a 3-column grid
let commitGridFind = `<div className="mb-\[28px\]" data-error={!!errors.readyForNaturalDiet}>`;
let commitGridReplace = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div data-error={!!errors.readyForNaturalDiet}>`;
newContent = newContent.replace(commitGridFind, commitGridReplace);
newContent = newContent.replace(/<div className="mb-\[28px\]" data-error=\{\!\!errors\.readyToAvoidSugar\}>/g, '<div data-error={!!errors.readyToAvoidSugar}>');
newContent = newContent.replace(/<div className="mb-\[28px\]" data-error=\{\!\!errors\.familySupport\}>/g, '<div data-error={!!errors.familySupport}>');

// Wait, earlier my script already did this. But let me be sure they match exactly.
// Actually, they had naked divs because the earlier replacement might not have matched if it didn't run properly on that part.
// But wait, the original file had `mb-4`. It became `mb-[28px]` just above.

// Add closing grid div for commitment before it ends
let commitGridEndFind = `{errors.familySupport && <div className={errorClasses}>{errors.familySupport}</div>}
                                                </div>

                                                </div>`;
let commitGridEndReplace = `{errors.familySupport && <div className={errorClasses}>{errors.familySupport}</div>}
                                                </div>
                                                </div>

                                                </div>`;
// Replace the first occurrence in the commitment block
if (newContent.indexOf(commitGridEndFind) !== -1) {
    newContent = newContent.replace(commitGridEndFind, commitGridEndReplace);
}

// Appointment section grid
let apptGridFind = `<div className="flex flex-wrap -mx-\[15px\] mb-\[28px\]">
                                                    <div>`;
let apptGridReplace = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[28px]">
                                                    <div>`;
newContent = newContent.replace(apptGridFind, apptGridReplace);

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', newContent, 'utf-8');
console.log('Update 5 complete!');
