const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// 1. Classes
content = content.replace(
`    const inputClasses = "block w-full px-3 py-[0.375rem] text-[1rem] font-normal leading-[1.5] text-[#212529] bg-white bg-clip-padding border border-solid border-[#ced4da] rounded-[0.375rem] transition ease-in-out m-0 focus:text-[#212529] focus:bg-white focus:border-[#86b7fe] focus:outline-none focus:ring-[0.25rem] focus:ring-[#0d6efd40]";
    const selectClasses = \`\${inputClasses} appearance-none\`;
    const labelClasses = "inline-block mb-2 text-[#212529] text-[1rem]";
    const errorClasses = "text-[#D23636] text-[0.875em] mt-1";`,
`    const inputClasses = "w-full h-[52px] px-4 text-[15px] md:text-[16px] text-gray-800 bg-white border border-gray-300 rounded-[10px] shadow-sm transition-all duration-300 ease-in-out focus:outline-none focus:border-[#38996E] focus:ring-1 focus:ring-[#38996E]";
    const selectClasses = \`\${inputClasses} appearance-none custom-select-bg\`;
    const labelClasses = "block mb-2 font-semibold text-gray-800 text-[15px] md:text-[16px]";
    const errorClasses = "text-[#D23636] text-[0.875rem] mt-1 font-medium";`
);

// 2. React Select Styles
content = content.replace(
`    const reactSelectStyles = {
        control: (base: any) => ({
            ...base,
            borderColor: '#ced4da',
            boxShadow: 'none',
            '&:hover': { borderColor: '#86b7fe' },
            padding: '1px'
        })
    };`,
`    const reactSelectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            height: '52px',
            minHeight: '52px',
            borderRadius: '10px',
            borderColor: state.isFocused ? '#38996E' : '#D1D5DB',
            boxShadow: state.isFocused ? '0 0 0 1px #38996E' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': { borderColor: state.isFocused ? '#38996E' : '#9CA3AF' },
            padding: '0 8px',
            fontSize: '15px'
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#38996E' : state.isFocused ? '#F6FFF7' : 'white',
            color: state.isSelected ? 'white' : '#1F2937',
            '&:active': { backgroundColor: '#38996E' }
        })
    };`
);

// 3. CSS Styles
content = content.replace(
`                    .custom-checkbox-input {
                        opacity: 1 !important;
                        position: static !important;
                        width: 1.25em !important;
                        height: 1.25em !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        background-color: #fff !important;
                        border: 1px solid #38996E !important;
                        border-radius: 0.25em !important;
                        margin-top: 0;
                        cursor: pointer;
                    }
                    .custom-checkbox-input:checked {
                        background-color: #38996E !important;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
                        background-size: 80% !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                    .custom-radio-input {
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        width: 1.25em !important;
                        height: 1.25em !important;
                        border: 1px solid #ced4da !important;
                        border-radius: 50% !important;
                        margin-right: 0.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .custom-radio-input:checked {
                        border-color: #38996E !important;
                        background-color: #38996E !important;
                    }
                    .custom-radio-input:checked::after {
                        content: '';
                        width: 0.5em;
                        height: 0.5em;
                        border-radius: 50%;
                        background-color: white;
                    }
                    .custom-select-bg {
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: right 0.75rem center;
                        background-size: 16px 12px;
                    }
                    @keyframes heroFadeIn {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }`,
`                    .custom-checkbox-input {
                        opacity: 1 !important;
                        position: static !important;
                        width: 24px !important;
                        height: 24px !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        background-color: #fff !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 6px !important;
                        margin-top: 0;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                    }
                    .custom-checkbox-input:checked {
                        background-color: #38996E !important;
                        border-color: #38996E !important;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
                        background-size: 80% !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                    .custom-radio-input {
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        width: 24px !important;
                        height: 24px !important;
                        border: 2px solid #D1D5DB !important;
                        border-radius: 50% !important;
                        margin-right: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease-in-out;
                    }
                    .custom-radio-input:checked {
                        border-color: #38996E !important;
                        background-color: #38996E !important;
                    }
                    .custom-radio-input:checked::after {
                        content: '';
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: white;
                    }
                    .custom-select-bg {
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: right 1rem center;
                        background-size: 16px 12px;
                    }
                    @keyframes heroFadeIn {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .section-card {
                        background-color: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                        padding: 30px;
                        margin-bottom: 35px;
                        animation: heroFadeIn 0.6s ease-out forwards;
                    }
                    @media (min-width: 768px) {
                        .section-card { padding: 40px; }
                    }
                    .form-container {
                        background-color: #F6FFF7;
                        border-radius: 16px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                        padding: 20px;
                    }
                    @media (min-width: 768px) {
                        .form-container { padding: 40px; }
                    }`
);

// Form Wrapper
content = content.replace(
`<div className="py-12 bg-[#F3F3F3]">
                <div className="container mx-auto px-4 max-w-[1200px]">
                    <div className="flex flex-wrap justify-center -mx-4">
                        <div className="w-full lg:w-10/12 xl:w-8/12 px-4">
                            <div className="relative flex flex-col min-w-0 break-words bg-white border-0 rounded-[6px] shadow-sm">
                                <div className="flex-auto p-6 md:p-12">`,
`<div className="py-16 bg-[#F3F3F3]">
                <div className="container mx-auto px-4 max-w-[1200px]">
                    <div className="flex flex-wrap justify-center -mx-4">
                        <div className="w-full lg:w-10/12 xl:w-9/12 px-4">
                            <div className="form-container relative flex flex-col min-w-0 break-words border-0">
                                <div className="flex-auto">`
);

// Required Asterisks
content = content.replace(/ \*\<\/label\>/g, ' <span className="text-[#D23636] font-bold">*</span></label>');

// Section Replacements
content = content.replace(
`                                                {/* 1. Basic Details */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">1️⃣ Basic Details</h5>`,
`                                                <div className="section-card">
                                                {/* 1. Basic Details */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">1️⃣ Basic Details</h2>`
);

content = content.replace(
`                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                
                                                {/* 2. Main Health Concern */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">2️⃣ Main Health Concern</h5>`,
`                                                </div>
                                                
                                                <div className="section-card">
                                                {/* 2. Main Health Concern */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">2️⃣ Main Health Concern</h2>`
);

content = content.replace(
`                                                {(formData.mainHealthIssue === 'PCOS' || formData.mainHealthIssue.includes('PCOS')) && (
                                                    <>
                                                        <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                        
                                                        {/* 3. For Infertility Clients */}
                                                        <h5 className="mb-4 text-[1.125rem] text-[#38996E]">3️⃣ For Infertility Clients (If Applicable)</h5>`,
`                                                </div>

                                                {(formData.mainHealthIssue === 'PCOS' || formData.mainHealthIssue.includes('PCOS')) && (
                                                    <div className="section-card">
                                                        {/* 3. For Infertility Clients */}
                                                        <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">3️⃣ For Infertility Clients (If Applicable)</h2>`
);

content = content.replace(
`                                                        )}
                                                    </>
                                                )}

                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                
                                                {/* 4. Lifestyle Details */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">4️⃣ Lifestyle Details</h5>`,
`                                                        )}
                                                    </div>
                                                )}

                                                <div className="section-card">
                                                {/* 4. Lifestyle Details */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">4️⃣ Lifestyle Details</h2>`
);

content = content.replace(
`                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                
                                                {/* 5. Current Food Pattern */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">5️⃣ Current Food Pattern</h5>`,
`                                                </div>
                                                <div className="section-card">
                                                {/* 5. Current Food Pattern */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">5️⃣ Current Food Pattern</h2>`
);

content = content.replace(
`                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                
                                                {/* 6. Body Symptoms */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">6️⃣ Body Symptoms <small className="text-[#6c757d] text-[0.875em]">(Tick if applicable)</small></h5>`,
`                                                </div>
                                                <div className="section-card">
                                                {/* 6. Body Symptoms */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">6️⃣ Body Symptoms <span className="text-gray-400 text-[14px] ml-2 font-normal">(Tick if applicable)</span></h2>`
);

content = content.replace(
`                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />
                                                
                                                {/* 7. Commitment Level */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">7️⃣ Commitment Level</h5>`,
`                                                </div>
                                                <div className="section-card">
                                                {/* 7. Commitment Level */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">7️⃣ Commitment Level</h2>`
);

content = content.replace(
`                                                <hr className="my-6 border-t border-[#cbcbcb] opacity-25" />

                                                {/* 8. Appointment Details */}
                                                <h5 className="mb-4 text-[1.125rem] text-[#38996E]">8️⃣ Appointment Details</h5>`,
`                                                </div>
                                                <div className="section-card">
                                                {/* 8. Appointment Details */}
                                                <h2 className="mb-6 text-[20px] md:text-[22px] font-semibold text-[#38996E] flex items-center border-b border-gray-100 pb-3">8️⃣ Appointment Details</h2>`
);

content = content.replace(
`                                                {/* Important Note */}`,
`                                                </div>
                                                {/* Important Note */}`
);

// Remove duplicate generic \`\${selectClasses} custom-select-bg\` and just use \`\${selectClasses}\`
content = content.replace(/\\\$\\\{selectClasses\\\} custom-select-bg/g, '\${selectClasses}');

// Radio buttons spacing
content = content.replace(/gap-4/g, 'gap-8');
content = content.replace(/className="flex items-center text-\\[#212529\\] cursor-pointer"/g, 'className="flex items-center text-gray-800 font-medium cursor-pointer text-[15px] md:text-[16px]"');
content = content.replace(/<label className="ml-2 cursor-pointer text-\\[#212529\\] select-none" htmlFor=\{sym.id\}>\{sym.label\}<\/label>/g, '<label className="ml-3 cursor-pointer text-gray-800 font-medium select-none text-[15px] md:text-[16px]" htmlFor={sym.id}>{sym.label}</label>');


// File Upload Styling
content = content.replace(
`<label className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                                                            <Upload className="w-4 h-4 mr-2 text-gray-600" />
                                                            <span className="text-gray-700 text-sm font-medium">Upload Files</span>`,
`<label className="inline-flex items-center px-6 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-[10px] cursor-pointer hover:bg-gray-100 hover:border-[#38996E] transition-all duration-300">
                                                            <Upload className="w-5 h-5 mr-3 text-[#38996E]" />
                                                            <span className="text-gray-700 font-medium text-[15px]">Choose Files to Upload</span>`
);

// Submit Button Styling
content = content.replace(
`<div className="text-center mt-6">
                                                    <button type="submit" disabled={loading} className="inline-block px-8 py-3 text-[1.125rem] text-white bg-black rounded-[0.375rem] hover:bg-[#333333] shadow-md font-medium transition-colors cursor-pointer border-0">`,
`<div className="text-center mt-10">
                                                    <button type="submit" disabled={loading} className="w-full md:w-auto md:min-w-[300px] inline-flex justify-center items-center px-10 py-[14px] text-[18px] text-white bg-gradient-to-r from-[#2B7A58] to-[#38996E] rounded-full hover:from-[#215E44] hover:to-[#2B7A58] shadow-lg hover:shadow-xl font-bold transition-all duration-300 cursor-pointer border-0 transform hover:-translate-y-1">`
);

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Update complete!');
