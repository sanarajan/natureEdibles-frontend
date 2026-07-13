const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// Fix Checkbox & Radio Border Colors to be green always
content = content.replace(
    /border: 2px solid #D1D5DB !important;/g,
    `border: 2px solid #38996E !important;`
);

// Fix Section 2 Flex container (remove premature closing tags)
let findStr = `</div>
                                                    <div className="w-full lg:w-1/2 px-[15px] mb-6">
                                                    <label className={labelClasses}>Since how many`;
let replaceStr = `
                                                    <div className="w-full lg:w-1/2 px-[15px] mb-6">
                                                    <label className={labelClasses}>Since how many`;
content = content.replace(findStr, replaceStr);

findStr = `</div>
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Have you taken`;
replaceStr = `
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Have you taken`;
content = content.replace(findStr, replaceStr);

findStr = `</div>
                                                    </div>
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Are you currently`;
replaceStr = `</div>
                                                    <div className="w-full md:w-1/2 px-[15px] mb-6">
                                                    <div className="border border-gray-200 rounded-[8px] p-5 h-full">
                                                    <label className={labelClasses}>Are you currently`;
content = content.replace(findStr, replaceStr);

findStr = `</div>
                                                    </div>
                                                    <div className="w-full px-[15px] mb-6">
                                                    <label className={labelClasses}>Do you have any medical reports?`;
replaceStr = `</div>
                                                    <div className="w-full px-[15px] mb-6">
                                                    <label className={labelClasses}>Do you have any medical reports?`;
content = content.replace(findStr, replaceStr);

// The file upload block ends with:
// {medicalReports.length > 0 && (
//     <div className="mt-2 text-sm text-gray-600">
//         {medicalReports.length} file(s) selected
//     </div>
// )}
// </div>
// </div>
//
// {(formData.mainHealthIssue === 'PCOS' ...
// Let's add the closing </div> for the flex container right after the medical reports upload block finishes (if it's missing or if we removed too many).
// Currently, there are two `</div>` at the end of the upload block: one for the upload section `w-full`, and one for `section-card` which is incorrect because we need one for `flex` and one for `section-card`.
// Actually, earlier we had `</div></div>` replacing `</div>`, so there's two. Let's make sure it closes the flex container and section card properly.

findStr = `                                                    )}
                                                </div>
                                                </div>

                                                {(formData.mainHealthIssue === 'PCOS' || formData.mainHealthIssue.includes('PCOS')) && (`;
replaceStr = `                                                    )}
                                                </div>
                                                </div>
                                                </div>

                                                {(formData.mainHealthIssue === 'PCOS' || formData.mainHealthIssue.includes('PCOS')) && (`;
content = content.replace(findStr, replaceStr);

// Ensure the section titles match the reference design:
// 1: Basic Details
// 2: Main Health Concern
// 3: Symptoms (Was "For Infertility Clients" for 3 before. Wait, no. The condition was for infertility).
// Let's check the current titles using a regex replace again, but specifically rename "For Infertility Clients" -> "Infertility Assessment" (just to make it look good, but the user said "Everything must stay. Only improve styling."). I will leave the titles as they were but ensure the badges are perfectly numbered sequentially.
// In the current file, the headers are already rewritten by the previous script to have the badge. Let's just make sure they look flawless.

fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Update 3 complete!');
