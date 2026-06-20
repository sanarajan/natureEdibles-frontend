const fs = require('fs');
const path = require('path');

const srcDir = 'd:/natureEdibles/natureEdibles-frontend/src';

const replacements = [
    {
        files: ['pages/Registration/VerifyEmail.tsx', 'pages/Registration/RegistrationSuccess.tsx', 'pages/Registration/Registration.tsx'],
        replace: [
            { from: /Serums, the alchemy of skincare, unlock the secrets of radiant beauty with every drop./g, to: "Organic food, the alchemy of nature, unlocks the secrets of radiant health with every bite." }
        ]
    },
    {
        files: ['pages/Home/Home.tsx'],
        replace: [
            { from: /Moisturizing Body Lotion/g, to: "Organic Honey" },
            { from: /Rejuvenating Body Oil/g, to: "Organic Walnuts" },
            { from: /Glow Serum/g, to: "Cold Pressed Coconut Oil" },
            { from: /Radiant Serum/g, to: "Organic Cashews" },
            { from: /Hydration Serum/g, to: "Natural Jaggery Powder" },
            { from: /Brightening Cream/g, to: "Organic Almonds" },
            { from: /Clear Complexion Cleansing Foam/g, to: "Organic Turmeric Powder" },
            { from: /Cozy Knit Cardigan Sweater/g, to: "Organic Raisins" },
            { from: /Sophisticated Swagger Suit/g, to: "Organic Spices" },
            { from: /Best Cloths/g, to: "Best Spices" },
            { from: /Balancing Body Toner/g, to: "Organic Honey" },
            { from: /Brightening Serum/g, to: "Cold Pressed Oil" }
        ]
    }
];

replacements.forEach(group => {
    group.files.forEach(file => {
        const filePath = path.join(srcDir, file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            group.replace.forEach(r => {
                content = content.replace(r.from, r.to);
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Processed ${filePath}`);
        }
    });
});
