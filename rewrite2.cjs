const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// Add Send icon
content = content.replace(
    `import { Loader2, AlertCircle, Upload } from 'lucide-react';`,
    `import { Loader2, AlertCircle, Upload, Send } from 'lucide-react';`
);

// Container Background
content = content.replace(
    /background-color:\s*#F6FFF7;/g,
    `background-color: #F3FAEB;`
);

// Inputs styling
content = content.replace(
    /const inputClasses = "w-full h-\[52px\] px-4 text-\[15px\] md:text-\[16px\] text-gray-800 bg-white border border-gray-300 rounded-\[10px\]/g,
    `const inputClasses = "w-full h-[52px] px-4 text-[14px] text-gray-800 bg-white border border-gray-200 rounded-[8px]`
);

content = content.replace(
    /const labelClasses = "block mb-2 font-semibold text-gray-800 text-\[15px\] md:text-\[16px\]";/g,
    `const labelClasses = "block mb-2 font-semibold text-gray-800 text-[14px]";`
);

// React Select Styles
content = content.replace(
    /borderRadius: '10px',/g,
    `borderRadius: '8px',`
);
content = content.replace(
    /fontSize: '15px'/g,
    `fontSize: '14px'`
);

// Radio Checkbox Styling
content = content.replace(
    /border-radius: 6px !important;/g,
    `border-radius: 4px !important;`
);

// Headers Replacement
content = content.replace(/<h2 className="mb-6[^>]+>(\d)️⃣\s+(.*?)<\/h2>/g, 
    '<div className="flex items-center mb-6"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">$1</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">$2</h2></div>'
);

// Fix Section 1 grid
content = content.replace(/w-full md:w-1\/(2|3|4) px-\[15px\] mb-4/g, 'w-full md:w-1/2 lg:w-1/3 px-[15px] mb-6');
content = content.replace(/w-full px-\[15px\] mb-4/g, 'w-full md:w-1/2 lg:w-1/3 px-[15px] mb-6');

// Rewrite Section 2 structure
const section2Find = `<div className="mb-4">
                                                    <label className={labelClasses}>What is your main health issue?`;
const section2Replace = `<div className="flex flex-wrap -mx-[15px]">
                                                    <div className="w-full lg:w-1/2 px-[15px] mb-6">
                                                    <label className={labelClasses}>What is your main health issue?`;
content = content.replace(section2Find, section2Replace);

const section2YearsFind = `<div className="mb-4">
                                                    <label className={labelClasses}>Since how many years are you facing this issue?`;
const section2YearsReplace = `</div>
                                                    <div className="w-full lg:w-1/2 px-[15px] mb-6">
                                                    <label className={labelClasses}>Since how many years are you facing this issue?`;
content = content.replace(section2YearsFind, section2YearsReplace);

const medicalTreatmentFind = `<div className="mb-4">
                                                    <label className={labelClasses}>Have you taken medical treatment?`;
const medicalTreatmentReplace = `</div>
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Have you taken medical treatment?`;
content = content.replace(medicalTreatmentFind, medicalTreatmentReplace);

const takingMedicinesFind = `<div className="mb-4">
                                                    <label className={labelClasses}>Are you currently taking any medicines?`;
const takingMedicinesReplace = `</div>
                                                    </div>
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Are you currently taking any medicines?`;
content = content.replace(takingMedicinesFind, takingMedicinesReplace);

const uploadFind = `<div className="mb-4">
                                                    <label className={labelClasses}>Do you have any medical reports? (HbA1c, Thyroid, Hormone Tests, Scan Reports, etc.)</label>
                                                    <div className="mt-1">
                                                        <label className="inline-flex items-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-[10px] cursor-pointer hover:bg-gray-100 hover:border-[#38996E] transition-all duration-300">
                                                            <Upload className="w-5 h-5 mr-3 text-[#38996E]" />
                                                            <span className="text-gray-700 font-medium text-[15px]">Choose Files to Upload</span>
                                                            <input 
                                                                type="file" 
                                                                multiple 
                                                                accept=".pdf,.jpg,.jpeg,.png" 
                                                                onChange={handleFileChange} 
                                                                className="hidden" 
                                                            />
                                                        </label>
                                                        {medicalReports.length > 0 && (
                                                            <div className="mt-2 text-sm text-gray-600">
                                                                {medicalReports.length} file(s) selected
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>`;
const uploadReplace = `</div>
                                                    </div>
                                                    <div className="w-full px-[15px] mb-6">
                                                    <label className={labelClasses}>Do you have any medical reports? (HbA1c, Thyroid, Hormone Tests, Scan Reports, etc.)</label>
                                                    <div className="mt-2 w-full border border-gray-200 rounded-[8px] p-6 flex flex-col md:flex-row items-center justify-between bg-white">
                                                        <div className="flex items-center mb-4 md:mb-0">
                                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                                                <Upload className="w-6 h-6 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 text-[15px] mb-1">Upload Files</h4>
                                                                <p className="text-gray-500 text-[13px]">Choose files or drag and drop</p>
                                                            </div>
                                                        </div>
                                                        <label className="inline-flex items-center px-6 py-[10px] bg-white border border-[#38996E] text-[#38996E] rounded-[6px] cursor-pointer hover:bg-[#F3FAEB] transition-all duration-300 font-medium text-[14px]">
                                                            Choose Files
                                                            <input 
                                                                type="file" 
                                                                multiple 
                                                                accept=".pdf,.jpg,.jpeg,.png" 
                                                                onChange={handleFileChange} 
                                                                className="hidden" 
                                                            />
                                                        </label>
                                                    </div>
                                                    {medicalReports.length > 0 && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            {medicalReports.length} file(s) selected
                                                        </div>
                                                    )}
                                                </div>
                                                </div>`;
content = content.replace(uploadFind, uploadReplace);


// Section 3 (Symptoms) grid
// It's currently: <div className="flex flex-wrap -mx-[15px] mb-4">
// Replace with a clean 3-col grid
const symptomsFind = `<div className="flex flex-wrap -mx-[15px] mb-4">
                                                    {symptomsList.map(sym => (
                                                        <div key={sym.id} className="w-full md:w-1/2 lg:w-1/3 px-[15px] mb-3">
                                                            <div className="flex items-center h-full">`;
const symptomsReplace = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-4 mb-4">
                                                    {symptomsList.map(sym => (
                                                        <div key={sym.id} className="flex items-center">`;
content = content.replace(symptomsFind, symptomsReplace);

// Also remove the closing divs for symptoms
const symptomsEndFind = `                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>`;
const symptomsEndReplace = `                                                        </div>
                                                    ))}
                                                </div>`;
content = content.replace(symptomsEndFind, symptomsEndReplace);

// Remove the inline text color class from symptom labels since we want standard gray
content = content.replace(
    /text-\[15px\] md:text-\[16px\]/g,
    `text-[14px]`
);

// Submit Button styling
const submitFind = `<button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[300px] inline-flex justify-center items-center px-10 py-[14px] text-[18px] text-white bg-gradient-to-r from-[#2B7A58] to-[#38996E] rounded-full hover:from-[#215E44] hover:to-[#2B7A58] shadow-lg hover:shadow-xl font-bold transition-all duration-300 cursor-pointer border-0 transform hover:-translate-y-1">
                                                        {loading ? <Loader2 className="animate-spin inline mr-2 w-5 h-5" /> : null}
                                                        Submit Registration
                                                    </button>`;
const submitReplace = `<button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-10 py-[16px] text-[16px] text-white bg-[#2B7A58] rounded-[8px] hover:bg-[#215E44] shadow-md font-bold transition-all duration-300 cursor-pointer border-0">
                                                        {loading ? <Loader2 className="animate-spin inline mr-2 w-5 h-5" /> : <Send className="w-5 h-5 mr-2" />}
                                                        Submit Registration
                                                    </button>`;
content = content.replace(submitFind, submitReplace);

// Also remove placeholder icons inside inputs if there were any, but none were present.
fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Update 2 complete!');
