const fs = require('fs');
let content = fs.readFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', 'utf-8');
content = content.split('className="flex items-center text-[#212529] cursor-pointer"').join('className="flex items-center text-gray-800 font-medium cursor-pointer text-[15px] md:text-[16px]"');
fs.writeFileSync('src/pages/User/Consultation/ConsultationBooking.tsx', content, 'utf-8');
console.log('Fixed radio labels');
