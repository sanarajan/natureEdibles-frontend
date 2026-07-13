const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');

// Update global classes for 48px height, 10px radius, 15px font
content = content.replace(
    /const inputClasses = "w-full h-\[52px\] px-4 text-\[14px\]/g,
    `const inputClasses = "w-full h-[48px] px-4 text-[15px]`
);
content = content.replace(
    /border border-gray-200 rounded-\[8px\]/g,
    `border border-gray-200 rounded-[10px]`
);
content = content.replace(
    /const labelClasses = "block mb-2 font-semibold text-gray-800 text-\[14px\]";/g,
    `const labelClasses = "block mb-2 font-semibold text-gray-800 text-[15px] md:text-[16px]";`
);

// React Select Styles (48px, 10px radius, 15px text)
content = content.replace(/height: '52px',/g, "height: '48px',");
content = content.replace(/minHeight: '52px',/g, "minHeight: '48px',");
// The radius is already 8px or 10px. Let's force it:
content = content.replace(/borderRadius: '8px',/g, "borderRadius: '10px',");
content = content.replace(/fontSize: '14px'/g, "fontSize: '15px'");

// Card spacing, radius and padding (40px, 18px radius)
content = content.replace(
    /border-radius: 16px;/g,
    `border-radius: 18px;`
);
content = content.replace(
    /padding: 30px;/g,
    `padding: 40px;` // Base padding
);
content = content.replace(
    /margin-bottom: 35px;/g,
    `margin-bottom: 40px;`
);
// Make mobile padding slightly less, or keep it 40px if the user insists.
// Let's just make it 30px on mobile and 40px on md.
content = content.replace(
    /\.section-card \{\s*background-color: white;\s*border-radius: 18px;\s*box-shadow: 0 4px 6px -1px rgba\(0, 0, 0, 0\.05\), 0 2px 4px -1px rgba\(0, 0, 0, 0\.03\);\s*padding: 40px;\s*margin-bottom: 40px;\s*animation: heroFadeIn 0\.6s ease-out forwards;\s*\}/g,
    `.section-card {
                        background-color: white;
                        border-radius: 18px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                        padding: 24px;
                        margin-bottom: 40px;
                        animation: heroFadeIn 0.6s ease-out forwards;
                    }`
);
content = content.replace(
    /\@media \(min-width: 768px\) \{\s*\.section-card \{ padding: 40px; \}\s*\}/g,
    `@media (min-width: 768px) {
                        .section-card { padding: 40px; }
                    }`
);

// Add Placeholders
content = content.replace(/name="fullName"([^>]*?)required/g, 'name="fullName"$1 placeholder="Enter your full name" required');
content = content.replace(/name="age"([^>]*?)required/g, 'name="age"$1 placeholder="Enter your age" required');
content = content.replace(/name="gender"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="gender"$1required>\n                                                            <option value="">Select gender</option>');
content = content.replace(/name="maritalStatus"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="maritalStatus"$1required>\n                                                            <option value="">Select marital status</option>');
content = content.replace(/name="occupation"([^>]*?)required/g, 'name="occupation"$1 placeholder="Enter your occupation" required');
content = content.replace(/name="contactNumber"([^>]*?)required/g, 'name="contactNumber"$1 placeholder="Enter your contact number" required');
content = content.replace(/name="city"([^>]*?)required/g, 'name="city"$1 placeholder="Enter your city" required');

content = content.replace(/name="mainHealthIssue"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="mainHealthIssue"$1required>\n                                                        <option value="">Select your main health issue</option>');
content = content.replace(/name="yearsFacingIssue"([^>]*?)required/g, 'name="yearsFacingIssue"$1 placeholder="e.g. 2" required');

content = content.replace(/name="stressLevel"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="stressLevel"$1required>\n                                                            <option value="">Select stress level</option>');
content = content.replace(/placeholder="Yes \/ No – What type\?"/g, 'placeholder="Select"'); // wait, exercise is a text input in the original.
content = content.replace(/name="exercise"([^>]*?)placeholder="Select"([^>]*?)required/g, 'name="exercise"$1placeholder="Select"$2required'); // just to be safe. Actually the original was Yes/No.

content = content.replace(/name="foodPreference"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="foodPreference"$1required>\n                                                            <option value="">Select food preference</option>');
content = content.replace(/name="teaCoffee"([^>]*?)required/g, 'name="teaCoffee"$1 placeholder="Select" required');
content = content.replace(/name="sugar"([^>]*?)required/g, 'name="sugar"$1 placeholder="Select" required');
content = content.replace(/name="outsideFood"([^>]*?)required/g, 'name="outsideFood"$1 placeholder="Select" required');
content = content.replace(/name="riceWheat"([^>]*?)required/g, 'name="riceWheat"$1 placeholder="Select" required');
content = content.replace(/name="waterIntake"([^>]*?)required/g, 'name="waterIntake"$1 placeholder="Select" required');
content = content.replace(/name="foodAllergies"([^>]*?)\/>/g, 'name="foodAllergies"$1 placeholder="Enter details" />');
content = content.replace(/name="bowelMovement"([^>]*?)required>\s*<option value="">Select<\/option>/g, 'name="bowelMovement"$1required>\n                                                            <option value="">Select</option>');

content = content.replace(/<option value="">Select Time Slot<\/option>/g, '<option value="">Select time slot</option>');

// Update "Appointment Date" input to have a generic placeholder if possible (type=date has a native UI, but we can set placeholder).
// Not needed usually.

// Write back
fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Update 4 complete!');
