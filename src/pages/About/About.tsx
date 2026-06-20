import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
    return (
        <>
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>About us</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/"> Home</Link></li>
                                <li className="breadcrumb-item">About us</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
            {/* Our Mission Section */}
            <section className="content-inner bg-light">
                <div className="container">
                    <div className="row about-style2 align-items-center">
                        <div className="col-lg-5 col-md-12 col-sm-12 m-b30">
                            <div className="about-thumb">
                                <img src='/liveimages/healthy-farm-fresh-food-32.jpeg' alt="" />
                            </div>
                        </div>
                        <div className="col-lg-7 col-md-12 col-sm-12 m-b30">
                            <div className="about-content">
                                <div className="section-head mb-4">
                                    <h3 className="title">A Brand Defined by Quality, Purity & Science</h3>
                                    <p className="m-b20"><strong>Natural Edibles</strong> is an international-standard natural science brand from India, built on the foundation of purity, research, and uncompromising quality. We bring together time-tested herbal wisdom and modern scientific formulation standards to create premium products that reflect India's authentic natural heritage in its most refined form.</p>
                                    <p className="m-b20">Every Natural Edibles product is crafted using globally recognised, clinically studied, and scientifically proven natural ingredients sourced responsibly from India and trusted regions around the world.</p>
                                    <p className="m-b0">Our formulations are designed through a meticulous blend of herbal extracts, botanical actives, essential nutrients, plant oils, and evidence-based natural compounds, ensuring high efficacy, safety, and consistency.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="content-inner-1">
                <div className="container">
                    <div className="section-head text-center mb-5">
                        <h2 className="title">Product Excellence Across Categories</h2>
                    </div>
                    <div className="row justify-content-center">
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Organic Spices & Condiments</h4>
                                    <p className="m-b0">A wide variety of pure, unadulterated spices sourced directly from organic farms.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Healthy Snacks</h4>
                                    <p className="m-b0">Delicious and nutritious snacks made from organic ingredients without preservatives.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Natural Sweets</h4>
                                    <p className="m-b0">Traditional sweets prepared with natural jaggery and organic ingredients.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                            <div className="icon-bx-wraper style-1 text-center bg-light p-4 radius-md" style={{ height: '100%' }}>
                                <div className="icon-content">
                                    <h4 className="dz-title m-b10 text-primary">Organic Staples</h4>
                                    <p className="m-b0">Everyday essentials like rice, pulses, and flours grown organically.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Categories Section End */}

            {/* Get In Touch */}
            <section className="get-in-touch">
                <div className="m-r100 m-md-r0 m-sm-r0">
                    <h3 className="dz-title mb-lg-0 mb-3">Questions ?
                        <span>Our experts will help find the gear that’s right for you</span>
                    </h3>
                </div>
                <Link to="/contact" className="btn btn-white btn-hover-1">Get In Touch</Link>
            </section>
            {/* Get In Touch End */}

            {/* Team1 Section Start */}
            <section className="content-inner overlay-white-dark overflow-hidden">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0 order-lg-1 order-2">
                            <div className="section-head style-2 wow fadeInUp m-md-r100 m-b30" data-wow-delay="0.1s">
                                <h2 className="title">What Makes Natural Edibles Unique?</h2>
                                
                                <h5 className="m-b10 text-primary mt-4">100% Organic Sourcing</h5>
                                <p className="m-b20">We source our products directly from certified organic farms, ensuring that everything from our spices to our snacks is grown without harmful chemicals or pesticides.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">Farm-to-Table Philosophy</h5>
                                <p className="m-b10">Our approach focuses on:</p>
                                <ul className="about-list m-b20" style={{ paddingLeft: '20px' }}>
                                    <li>Sustainable farming</li>
                                    <li>Traditional processing</li>
                                    <li>Uncompromised purity</li>
                                    <li>Nutritional value</li>
                                </ul>
                                <p className="m-b20">This unique approach allows Natural Edibles to deliver healthy, delicious food without compromising safety or purity.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">Clean, Natural Foods</h5>
                                <p className="m-b20">No harmful additives, artificial colors, or preservatives - only nature-focused, tested foods for your family's health.</p>
                                
                                <h5 className="m-b10 text-primary mt-4">Premium Quality, Local Roots</h5>
                                <p className="m-b0">Every detail; sourcing, quality checks, packaging, reflects our commitment to bringing you the best organic food with modern aesthetics and traditional values.</p>
                            </div>

                        </div>

                        <div className="col-lg-6  order-lg-2 order-1 mb-4 mb-xl-0">
                            <div className="row g-xl-4 g-md-4 g-3 m-0">
                                <div className="col-lg-12 wow fadeInUp" data-wow-delay="0.2s">
                                    <div className="about-thumb radius-1">
                                        <img src='/liveimages/natural-edibles-spices-65.jpeg' alt="" />
                                    </div>
                                </div>
                                <div className="col-xl-5 col-lg-5 col-sm-5 col-5 wow fadeInUp gx-0 mt-2"
                                    data-wow-delay="0.5s">
                                    <div className="about-thumb radius-1">
                                        <img src='/liveimages/natural-edibles-spices-60.jpeg' alt="" />
                                    </div>
                                </div>
                                <div className="col-xl-7 col-lg-7 col-sm-7 col-7 wow fadeInUp mt-2" data-wow-delay="0.4s">
                                    <div className="about-thumb radius-1">
                                        <img src='/liveimages/pure-natural-ingredients-78.jpeg' alt="" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default About;
