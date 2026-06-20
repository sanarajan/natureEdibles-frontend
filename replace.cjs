const fs = require('fs');
const path = require('path');

const publicLiveImages = 'd:/natureEdibles/natureEdibles-frontend/public/liveimages';
const srcDir = 'd:/natureEdibles/natureEdibles-frontend/src';

let images = fs.readdirSync(publicLiveImages).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

let imageIndex = 0;
function getNextImage() {
    if (images.length === 0) return '/images/noimage.png'; // fallback
    const img = '/liveimages/' + images[imageIndex % images.length];
    imageIndex++;
    return img;
}

// Function to process a single file
function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Replace Imports with consts
    // import X from '../../assets/images/...' -> const X = '/liveimages/...'
    const importRegex = /import\s+([a-zA-Z0-9_]+)\s+from\s+['"]\.\.\/\.\.\/assets\/images\/.*?['"];/g;
    content = content.replace(importRegex, (match, varName) => {
        // preserve some icons if needed like lineSvg or shopPng
        if (varName.toLowerCase().includes('svg') || varName.toLowerCase().includes('icon')) {
            return match; // Keep SVGs if they are structural
        }
        return `const ${varName} = '${getNextImage()}';`;
    });

    // Also replace imports with single dot (e.g. '../assets/images/') in About/Contact
    const importRegex2 = /import\s+([a-zA-Z0-9_]+)\s+from\s+['"]\.\.\/assets\/images\/.*?['"];/g;
    content = content.replace(importRegex2, (match, varName) => {
        if (varName.toLowerCase().includes('svg') || varName.toLowerCase().includes('icon')) {
            return match; 
        }
        return `const ${varName} = '${getNextImage()}';`;
    });

    // Replace static /images/ string paths
    const stringPathRegex = /['"]\/images\/(?!favicon|logo|vlc).*?\.(jpg|jpeg|png)['"]/g;
    content = content.replace(stringPathRegex, (match) => {
        if(match.includes('logo') || match.includes('favicon') || match.includes('bg') || match.includes('map')) {
            return match; // preserve logos, backgrounds and maps
        }
        return `'${getNextImage()}'`;
    });

    // 2. Replace Text (Home)
    content = content.replace(/Experience the timeless wisdom of nature/g, "Premium Organic Foods for a Healthy Life");
    content = content.replace(/No code need\. Plus free shipping/g, "Fresh from farm to table. Free shipping");
    content = content.replace(/Nature's Finest Offerings/g, "Nature's Finest Organic Offerings");
    content = content.replace(/'Accessories',\s*'Haircare',\s*'nailcare',\s*'Beautycare',\s*'Bodycare',\s*'Skincare'/g, 
                              "'Spices', 'Snacks', 'Sweets', 'Dry Fruits', 'Beverages', 'Organic Staples'");
    content = content.replace(/>Essential Items</g, ">Organic Spices<");
    content = content.replace(/>Repair Serum</g, ">Healthy Snacks<");
    content = content.replace(/>Anti Aging Cream</g, ">Natural Sweets<");
    content = content.replace(/Highly Recommended([\s\S]*?)Essentials/g, "Highly Recommended$1Organic Food");
    content = content.replace(/>Similar Profiles</g, ">Customer Favorites<");
    content = content.replace(/Big Saving On Everyday Essentials/g, "Big Saving On Everyday Organic Essentials");
    content = content.replace(/Latest Cosmetic News/g, "Latest Organic Food News");
    content = content.replace(/Subscribe Newsletter & Get Cosmetic News/g, "Subscribe Newsletter & Get Organic Food News");
    
    // Product replacements
    content = content.replace(/Clear Complexion Cleansing Foam/g, "Organic Honey");
    content = content.replace(/Floral Burst Fragrance Mist/g, "Natural Jaggery Powder");
    content = content.replace(/Aqua-Fresh Moisturizing Gel/g, "Cold Pressed Coconut Oil");
    content = content.replace(/Divine Essence Perfume Elixir/g, "Organic Turmeric Powder");
    content = content.replace(/Dewy Glow Foundation/g, "Organic Almonds");
    content = content.replace(/Illuminating Body Oil/g, "Organic Cashews");
    content = content.replace(/Cleansing Body Wash/g, "Organic Walnuts");
    content = content.replace(/Calming Body Lotion/g, "Organic Raisins");

    content = content.replace(/Illuminate Your Beauty With Potent Anti-Wrinkle\./g, "Health Benefits of Organic Spices.");
    content = content.replace(/Pamper Skin, Indulge Senses, Relax, Unwind\./g, "From Farm To Table: Our Organic Journey.");
    content = content.replace(/Customize Regimen, Address Needs, Achieve Results\./g, "Top 5 Reasons To Switch To Organic.");
    content = content.replace(/Combat Aging, Restore Elasticity, Firm And Lift\./g, "Healthy Snack Ideas For Kids.");
    content = content.replace(/Hydrate Deeply For A Plump, Youthful Appearance\./g, "The Importance Of Chemical-Free Eating.");

    // Footer
    content = content.replace(/>Hydrated Supple Skin</g, ">Benefits of Organic Eating<");
    content = content.replace(/>Glowing Radiant Skin</g, ">Farm Fresh Produce<");
    content = content.replace(/>Silky Soft Skin</g, ">Natural Edibles Journey<");

    // About
    content = content.replace(/Skin Care/g, "Organic Spices & Condiments");
    content = content.replace(/Face serums, creams, moisturizers, scrubs; created with potent botanical actives backed by natural science\./g, "A wide variety of pure, unadulterated spices sourced directly from organic farms.");
    content = content.replace(/Hair Care/g, "Healthy Snacks");
    content = content.replace(/Herbal oils, scalp serums, mild herbal cleansers with clinically supported extracts\./g, "Delicious and nutritious snacks made from organic ingredients without preservatives.");
    content = content.replace(/Herbal Supplements/g, "Natural Sweets");
    content = content.replace(/Liver support, metabolic wellness, women's wellness; crafted using scientifically studied herbal actives\./g, "Traditional sweets prepared with natural jaggery and organic ingredients.");
    content = content.replace(/Herbal Teas & Wellness Blends/g, "Organic Staples");
    content = content.replace(/Premium botanical teas created for purity, balance, and everyday wellbeing\./g, "Everyday essentials like rice, pulses, and flours grown organically.");

    content = content.replace(/Global-Standard Ingredients/g, "100% Organic Sourcing");
    content = content.replace(/We use internationally respected natural and botanical actives like Hyaluronic Acid, Niacinamide, Ceramides, Squalane, Bakuchiol, Rosehip Oil, Licorice Extract, Aloe Vera, Green Tea, Gotu Kola, Silymarin, Curcumin, Omega-rich oils and more, all carefully balanced with India's traditional botanicals\./g, "We source our products directly from certified organic farms, ensuring that everything from our spices to our snacks is grown without harmful chemicals or pesticides.");
    
    content = content.replace(/Hybrid Formulation Philosophy/g, "Farm-to-Table Philosophy");
    content = content.replace(/A fusion of:/g, "Our approach focuses on:");
    content = content.replace(/>Advanced natural science</g, ">Sustainable farming<");
    content = content.replace(/>Indian herbal knowledge</g, ">Traditional processing<");
    content = content.replace(/>Modern cosmetic chemistry</g, ">Uncompromised purity<");
    content = content.replace(/>Nutraceutical innovation</g, ">Nutritional value<");
    content = content.replace(/This unique approach allows Naturalayam™ products to deliver visible results without compromising safety or purity\./g, "This unique approach allows Natural Edibles to deliver healthy, delicious food without compromising safety or purity.");
    
    content = content.replace(/High Performance, Clean Formulas/g, "Clean, Natural Foods");
    content = content.replace(/No harmful additives - only nature-focused, safety-tested functional actives for gentle and effective results\./g, "No harmful additives, artificial colors, or preservatives - only nature-focused, tested foods for your family's health.");
    
    content = content.replace(/Premium Brand, International Appeal/g, "Premium Quality, Local Roots");
    content = content.replace(/Every detail; formulation, compliance, quality checks, packaging, reflects global luxury standards with scientific clarity and modern natural aesthetics\./g, "Every detail; sourcing, quality checks, packaging, reflects our commitment to bringing you the best organic food with modern aesthetics and traditional values.");
    
    content = content.replace(/Naturalayam™/g, "Natural Edibles");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${filePath}`);
}

const filesToProcess = [
    path.join(srcDir, 'pages', 'Home', 'Home.tsx'),
    path.join(srcDir, 'pages', 'About', 'About.tsx'),
    path.join(srcDir, 'pages', 'Contact', 'Contact.tsx'),
    path.join(srcDir, 'components', 'Footer', 'Footer.tsx'),
    path.join(srcDir, 'components', 'Header', 'Header.tsx')
];

filesToProcess.forEach(processFile);
console.log('Done!');
